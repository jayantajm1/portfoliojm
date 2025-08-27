
Here is the updated documentation .

---

# Observability Setup and Usage Guide (V2)

This guide details the standardized approach for implementing observability (Logs, Metrics, and Traces) in this project. Following these patterns ensures consistent, correlated, and actionable telemetry data.

## 1. The Three Pillars of Observability

Our framework is built to provide insights into the three core pillars:

-   **Structured Logs:** Every log message is enriched with a `CorrelationId` to trace the entire lifecycle of a single request.
-   **Distributed Traces:** Using `ActivitySource`, we generate traces (spans) that show the flow and duration of operations. This creates a parent span in the Controller/Service and child spans for specific tasks like database calls.
-   **Metrics:** Using `Meter`, we produce numerical data about the application's health and performance. We have distinct metrics for **Service Operations** and **Database Operations**.

## 2. Core Components

The system is built on a few key components:

-   `CorrelationIdMiddleware.cs`: Ensures every request has a unique ID.
-   `IInstrumentationFactory.cs` / `InstrumentationFactory.cs`: A singleton factory for creating and caching `ActivitySource` and `Meter` objects efficiently.
-   `IInstrumentation.cs` / `Instrumentation.cs`: A generic, scoped helper that provides a ready-to-use set of instruments for any class it's injected into.

---

## 3. One-Time Setup Process

This setup only needs to be done once for the entire application.

### Step 1: Add the Core Instrumentation Files

Ensure the following files are present in your project. Note the corrections made to `IInstrumentation.cs` and `Instrumentation.cs`.

<details>
<summary>Click to see the updated core component code</summary>

**`IInstrumentation.cs` (Updated)**
```csharp
using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace CTS_BE.Instrumentation
{
    public interface IInstrumentation<T>
    {
        ActivitySource ActivitySource { get; }

        // Service/Controller Level Metrics
        Counter<long> OperationsCounter { get; }
        Counter<long> ErrorsCounter { get; }
        Histogram<double> OperationDuration { get; }

        /// <summary>
        /// A metric that goes up and down to track concurrent, in-flight operations.
        /// </summary>
        UpDownCounter<long> ActiveOperationsCounter { get; } // <-- Corrected to UpDownCounter

        // Database/Repository Level Metrics
        Counter<long> DbOperationsCounter { get; }
        Counter<long> DbErrorsCounter { get; }
        Histogram<double> DbOperationDuration { get; }
    }
}
```

**`Instrumentation.cs` (Updated & Corrected)**
```csharp
using CTS_BE.Factories;
using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace CTS_BE.Instrumentation
{
    public class Instrumentation<T> : IInstrumentation<T>
    {
        private readonly string _metricPrefix;

        public ActivitySource ActivitySource { get; }
        public Meter Meter { get; }
        public Counter<long> OperationsCounter { get; }
        public Counter<long> ErrorsCounter { get; }
        public Histogram<double> OperationDuration { get; }
        public UpDownCounter<long> ActiveOperationsCounter { get; } // <-- Corrected to UpDownCounter
        public Counter<long> DbOperationsCounter { get; }
        public Counter<long> DbErrorsCounter { get; }
        public Histogram<double> DbOperationDuration { get; }

        public Instrumentation(IInstrumentationFactory factory)
        {
            var type = typeof(T);
            var serviceName = type.FullName!;
            _metricPrefix = type.Name.ToLower().Replace("service", "").Replace("repository", "").Replace("controller", "");

            ActivitySource = factory.GetActivitySource(serviceName);
            Meter = factory.GetMeter(serviceName);

            // Service/Controller Level Metrics
            OperationsCounter = Meter.CreateCounter<long>(
                $"{_metricPrefix}.operations.count",
                description: "Number of service-level operations executed."
            );
            ErrorsCounter = Meter.CreateCounter<long>(
                $"{_metricPrefix}.errors.count",
                description: "Number of unexpected errors encountered in service logic."
            );
            OperationDuration = Meter.CreateHistogram<double>(
                $"{_metricPrefix}.operation.duration",
                unit: "ms",
                description: "Duration of service-level operations."
            );
            // This MUST be an UpDownCounter to track a value that can be decremented.
            ActiveOperationsCounter = Meter.CreateUpDownCounter<long>(
                $"{_metricPrefix}.active.operations.count",
                description: "Number of currently active (in-flight) operations."
            );

            // Database/Repository Level Metrics
            DbOperationsCounter = Meter.CreateCounter<long>(
                $"{_metricPrefix}.db.operations.count", // <-- Corrected description
                description: "Number of database operations executed."
            );
            DbErrorsCounter = Meter.CreateCounter<long>(
                $"{_metricPrefix}.db.errors.count", // <-- Corrected description
                description: "Number of database errors encountered."
            );
            DbOperationDuration = Meter.CreateHistogram<double>(
                $"{_metricPrefix}.db.operation.duration",
                unit: "ms",
                description: "Duration of database operations."
            );
        }
    }
}
```

</details>

### Step 2 & 3: Configure DI and Middleware

This part of the setup remains unchanged. Register the services in `Program.cs` and add the `CorrelationIdMiddleware`.

---

## 4. Developer Usage Guide

This workflow shows how to use the different sets of metrics in their appropriate layers.

### Step 1: Inject `IInstrumentation<T>`

Inject `IInstrumentation<T>` into the constructor of your **Controller**, **Service**, or **Repository**.

```csharp
// Example in a Service
public class MyProductService(
    IMyProductRepository productRepository,
    ILogger<MyProductService> logger,
    IInstrumentation<MyProductService> instrumentation // <-- INJECT HERE
) : IMyProductService
{
    //...
    private readonly IInstrumentation<MyProductService> _instrumentation = instrumentation;
}
```

### Step 2: Use the Correct Instrumentation Pattern for Each Layer

#### A) Service Layer Pattern

In your **Service** classes, use the **service-level** metrics (`OperationsCounter`, `ErrorsCounter`, `OperationDuration`, and `ActiveOperationsCounter`).

```csharp
public async Task<Product> GetProductAsync(int id)
{
    // A. Start the main activity and stopwatch
    using var activity = _instrumentation.ActivitySource.StartActivity("Service.GetProduct");
    var stopwatch = Stopwatch.StartNew();

    // B. Define tags and increment service-level counters
    var metricTags = new TagList { { "operation", "get_product" } };
    _instrumentation.OperationsCounter.Add(1, metricTags);
    _instrumentation.ActiveOperationsCounter.Add(1, metricTags); // <-- INCREMENT here

    activity?.AddTag("product.id", id);
    _logger.LogInformation("Getting product {ProductId}", id);

    try
    {
        // The service calls the repository. This will create a child span.
        var product = await _productRepository.FindByIdAsync(id);

        if (product == null) { /* Handle not found case */ }

        // C. Set span status to OK on success
        activity?.SetStatus(ActivityStatusCode.Ok);
        return product;
    }
    catch (Exception ex)
    {
        // D. On UNEXPECTED service errors, update metrics
        _logger.LogError(ex, "Service error getting product {ProductId}", id);

        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity?.RecordException(ex);

        // This is a service-level error
        _instrumentation.ErrorsCounter.Add(1, metricTags);
        throw;
    }
    finally
    {
        // E. ALWAYS decrement active count and record duration in finally
        _instrumentation.ActiveOperationsCounter.Add(-1, metricTags); // <-- DECREMENT here
        _instrumentation.OperationDuration.Record(stopwatch.Elapsed.TotalMilliseconds, metricTags);
    }
}
```

#### B) Repository Layer Pattern

In your **Repository** classes, use the **database-level** metrics (`DbOperationsCounter`, `DbErrorsCounter`, `DbOperationDuration`).

```csharp
public async Task<Product> FindByIdAsync(int id)
{
    // A. Start a CHILD activity for the database call and a stopwatch
    using var activity = _instrumentation.ActivitySource.StartActivity("Repository.FindById");
    var stopwatch = Stopwatch.StartNew();

    // B. Define tags and increment DATABASE-level counters
    var metricTags = new TagList { { "db.operation", "find_by_id" } };
    _instrumentation.DbOperationsCounter.Add(1, metricTags);

    activity?.AddTag("db.statement", "SELECT * FROM Products WHERE Id = @p0");
    activity?.AddTag("db.system", "postgresql");

    try
    {
        // C. Execute the database query
        return await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
    }
    catch (DbException ex)
    {
        // D. On DATABASE errors, update DB metrics
        _logger.LogError(ex, "Database error finding product {ProductId}", id);

        activity?.SetStatus(ActivityStatusCode.Error, "A database error occurred.");
        activity?.RecordException(ex);

        // This is a database-level error
        _instrumentation.DbErrorsCounter.Add(1, metricTags);
        throw;
    }
    finally
    {
        // E. ALWAYS record the database duration in the finally block
        _instrumentation.DbOperationDuration.Record(stopwatch.Elapsed.TotalMilliseconds, metricTags);
    }
}
```

##### C) Controller Instrumentation Pattern

Controllers translate service results (`Product` or `null`) into appropriate HTTP responses.

-   **Primary Goal:** Measure request health, create the root trace span, and handle the final user response.

```csharp
[HttpGet("products/{id}")]
public async Task<IActionResult> GetProductById(int id)
{
    using var activity = _instrumentation.ActivitySource.StartActivity("Controller.GetProductById");
    var stopwatch = Stopwatch.StartNew();
    var metricTags = new TagList { { "endpoint", "GET /products/{id}" } };
    _instrumentation.OperationsCounter.Add(1, metricTags);

    activity?.AddTag("product.id", id);
    _logger.LogInformation("Request received for product {ProductId}", id);

    try
    {
        // The service safely returns a Product or null (if not found OR if an error occurred).
        var product = await _myProductService.GetProductAsync(id);

        if (product == null)
        {
            // The service/repo logs will tell us *why* it's null.
            // For the user, a 404 is a safe and common response.
            activity?.SetStatus(ActivityStatusCode.Error, "Product not found or service failed");
            return NotFound($"Product with ID {id} could not be retrieved.");
        }

        activity?.SetStatus(ActivityStatusCode.Ok);
        return Ok(product);
    }
    catch (Exception ex) // This now only catches errors originating *within the controller*.
    {
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity?.RecordException(ex);
        _instrumentation.ErrorsCounter.Add(1, metricTags);
        _logger.LogError(ex, "Unhandled controller error getting product {ProductId}", id);
        return StatusCode(500, "A critical internal server error occurred.");
    }
    finally
    {
        _instrumentation.OperationDuration.Record(stopwatch.Elapsed.TotalMilliseconds, metricTags);
    }
}
```

### Quick Reference Cheatsheet

| Layer | Primary Metrics Used | Key `Activity` Tags | Purpose |
| :--- | :--- | :--- | :--- |
| **Controller** | `OperationsCounter`, `ErrorsCounter`, `OperationDuration` | `endpoint`, `http.method` | Measures HTTP request health and creates the root trace span. |
| **Service** | `OperationsCounter`, `ErrorsCounter`, `OperationDuration`, **`ActiveOperationsCounter`** | `operation`, Business IDs (e.g., `product.id`) | Measures business logic performance and tracks concurrent load. |
| **Repository** | **`DbOperationsCounter`**, **`DbErrorsCounter`**, **`DbOperationDuration`** | `db.system`, `db.statement`, `db.operation` | Measures database interaction performance and isolates DB errors. |

---


## . Summary of Best Practices

1.  **Use the Right Metrics for the Layer:**
    -   In **Services**, use `OperationsCounter`, `ErrorsCounter`, `OperationDuration`, and `ActiveOperationsCounter`.
    -   In **Repositories**, use `DbOperationsCounter`, `DbErrorsCounter`, and `DbOperationDuration`.
2.  **Manage `ActiveOperationsCounter` Carefully:** Increment (`.Add(1)`) at the start of a service method and always decrement (`.Add(-1)`) in the `finally` block.
3.  **Trace Method Boundaries:** Start an `Activity` at the beginning of each significant public method in your services and repositories. This automatically creates the parent-child trace relationships.
4.  **Tag Your Spans:** Add meaningful tags to your traces. For DB spans, include tags like `db.system` and `db.statement`.
---
This document is made by @Jayanta Mardi
