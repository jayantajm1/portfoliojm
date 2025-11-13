# JITAPI.Tests - Test Execution Flow

This document illustrates the complete test execution flow for the JITAPI integration test suite.

## 📋 Overview

The test suite uses **xUnit** with **WebApplicationFactory** to create an in-memory test server that uses **real PostgreSQL databases** for integration testing. Authentication flows through actual API endpoints to obtain JWT tokens.

---

## 🔄 Complete Test Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEST RUNNER (xUnit)                                  │
│                     dotnet test / Visual Studio Test Explorer                │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ Discovers Tests
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COLLECTION DISCOVERY                                      │
│  • Finds [Collection("Integration")] on test classes                        │
│  • Links to IntegrationTestCollection                                       │
│  • Identifies ICollectionFixture<AuthenticatedTestFixture>                  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ One-Time Setup (Per Collection)
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│            AUTHENTICATED TEST FIXTURE (IAsyncLifetime)                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  InitializeAsync() - Runs ONCE before ALL tests in collection        │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  Step 1: Create JITWebAppFactory                                      │ │
│  │          └─→ Configures test web host with "Testing" environment     │ │
│  │                                                                         │ │
│  │  Step 2: Create HttpClient                                            │ │
│  │          └─→ Client = _application.CreateClient()                     │ │
│  │                                                                         │ │
│  │  Step 3: Authenticate via Real API                                    │ │
│  │          a) GET /api/Auth/get-captcha-image                           │ │
│  │             └─→ Returns: { captchaCode, captchaId }                   │ │
│  │                                                                         │ │
│  │          b) GET /api/Factory/LoginInputModel                          │ │
│  │             └─→ Returns: LoginInputModel with test credentials        │ │
│  │                                                                         │ │
│  │          c) POST /api/auth/login (with captcha + credentials)         │ │
│  │             └─→ Returns: JWT AccessToken                              │ │
│  │                                                                         │ │
│  │          d) Verify: GET /api/Dashboard/get-dashboard-data             │ │
│  │             └─→ Confirms authentication works                         │ │
│  │                                                                         │ │
│  │  Step 4: Set Authorization Header                                     │ │
│  │          └─→ Client.DefaultRequestHeaders.Authorization = Bearer Token│ │
│  │                                                                         │ │
│  │  ✓ Fixture Ready - HttpClient with valid JWT token                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ Fixture Shared Across All Tests
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JIT WEB APP FACTORY                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ConfigureWebHost(IWebHostBuilder builder)                           │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  1. Set Environment → "Testing"                                       │ │
│  │     └─→ Triggers conditional logic in Program.cs                     │ │
│  │         • Disables RabbitMQ registration                              │ │
│  │         • Disables Hangfire                                           │ │
│  │         • Skips RSA key provider                                      │ │
│  │                                                                         │ │
│  │  2. Load Configuration                                                │ │
│  │     └─→ appsettings.Testing.json (primary)                           │ │
│  │     └─→ appsettings.json (fallback)                                  │ │
│  │         Contains:                                                      │ │
│  │         • ConnectionStrings (PostgreSQL test databases)               │ │
│  │         • JWT settings                                                │ │
│  │         • Feature flags                                               │ │
│  │                                                                         │ │
│  │  3. ConfigureTestServices                                             │ │
│  │     a) Remove EF Core DbContext options (if any)                     │ │
│  │                                                                         │ │
│  │     b) Register DbContexts with REAL PostgreSQL                       │ │
│  │        • JITDBContext → "JITDBConnection"                            │ │
│  │        • JITReportDBContext → "JITReportDBConnection"                │ │
│  │        └─→ UseNpgsql() for both contexts                             │ │
│  │                                                                         │ │
│  │     c) Remove RsaKeyProvider                                          │ │
│  │        └─→ Prevents file I/O errors in test environment              │ │
│  │                                                                         │ │
│  │     d) Keep Real JWT Authentication                                   │ │
│  │        └─→ No test auth handler - uses actual auth middleware        │ │
│  │                                                                         │ │
│  │  ✓ In-Memory Test Server Running with Real DB Connections            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ Server Ready
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INDIVIDUAL TEST EXECUTION                                 │
│                                                                              │
│  Example: AuthControllerTests.AuthController_GetFinancialYear_ReturnsSuccess│
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Test Class Constructor                                               │ │
│  │  ├─→ Receives: AuthenticatedTestFixture (via DI)                     │ │
│  │  ├─→ Inherits: BaseControllerTests(fixture.Client)                   │ │
│  │  └─→ _client = fixture.Client (with JWT already set)                 │ │
│  │                                                                         │ │
│  │  [Fact] Test Method                                                   │ │
│  │  ├─→ Arrange: Test data setup (if needed)                            │ │
│  │  │                                                                     │ │
│  │  ├─→ Act: Call API via BaseControllerTests helper                    │ │
│  │  │    └─→ CallGetAsJsonAsync<T>("/api/auth/get-fin-year")           │ │
│  │  │        │                                                            │ │
│  │  │        ├─→ _client.GetAsync(url)                                  │ │
│  │  │        │   └─→ Sends HTTP GET with Bearer token                   │ │
│  │  │        │                                                            │ │
│  │  │        ├─→ await response.Content.ReadAsStreamAsync()             │ │
│  │  │        │                                                            │ │
│  │  │        └─→ JsonSerializer.Deserialize<APIResponseClass<T>>        │ │
│  │  │                                                                     │ │
│  │  └─→ Assert: Verify response (FluentAssertions)                      │ │
│  │       └─→ response.Should().NotBeNull()                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ↓ HTTP Request Flow                                                        │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                 IN-MEMORY TEST SERVER                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ASP.NET Core Middleware Pipeline                               │ │ │
│  │  │  1. JWT Authentication Middleware                                │ │ │
│  │  │     └─→ Validates Bearer token from request header              │ │ │
│  │  │     └─→ Creates ClaimsPrincipal                                  │ │ │
│  │  │                                                                   │ │ │
│  │  │  2. Authorization Middleware                                     │ │ │
│  │  │     └─→ Checks [Authorize] attributes                           │ │ │
│  │  │                                                                   │ │ │
│  │  │  3. MVC Routing                                                  │ │ │
│  │  │     └─→ Maps to Controller Action                               │ │ │
│  │  │                                                                   │ │ │
│  │  │  4. Controller Execution                                         │ │ │
│  │  │     └─→ AuthController.GetFinancialYear()                       │ │ │
│  │  │         │                                                         │ │ │
│  │  │         ├─→ Injects Services (via DI)                           │ │ │
│  │  │         │   • IAuthService                                       │ │ │
│  │  │         │   • IClaimService                                      │ │ │
│  │  │         │   • IConfiguration                                     │ │ │
│  │  │         │                                                         │ │ │
│  │  │         ├─→ Business Logic Layer (BAL)                          │ │ │
│  │  │         │   └─→ Service Methods                                 │ │ │
│  │  │         │       │                                                 │ │ │
│  │  │         │       ├─→ Data Access Layer (DAL)                     │ │ │
│  │  │         │       │   ├─→ Dapper Queries                          │ │ │
│  │  │         │       │   │   └─→ REAL PostgreSQL Database            │ │ │
│  │  │         │       │   │       • wbjit_test_0611                   │ │ │
│  │  │         │       │   │       • jit_test_db_06_11                 │ │ │
│  │  │         │       │   │       • hangfire (if used)                │ │ │
│  │  │         │       │   │                                            │ │ │
│  │  │         │       │   └─→ Executes SQL via Npgsql                 │ │ │
│  │  │         │       │       Returns data                            │ │ │
│  │  │         │       │                                                 │ │ │
│  │  │         │       └─→ Process & Return DTO                        │ │ │
│  │  │         │                                                         │ │ │
│  │  │         └─→ Return APIResponseClass<T>                          │ │ │
│  │  │                                                                   │ │ │
│  │  │  5. Response Serialization                                       │ │ │
│  │  │     └─→ JSON serialization (System.Text.Json)                   │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ↑ HTTP Response                                                            │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Test Assertion                                                       │ │
│  │  └─→ Validates response structure                                    │ │
│  │  └─→ Verifies status codes                                           │ │
│  │  └─→ Checks data integrity                                           │ │
│  │  └─→ FluentAssertions for readable failures                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ✓ Test Passes / ✗ Test Fails                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ Next Test Execution
                                 │ (Reuses same fixture & authenticated client)
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REPEAT FOR ALL TESTS                                      │
│  • AuthControllerTests (3 tests)                                            │
│  • DrawingLimitControllerTests                                              │
│  • UserControllerTests                                                      │
│  • ... (all controller tests)                                               │
│                                                                              │
│  All tests share:                                                           │
│  ✓ Same JITWebAppFactory instance                                          │
│  ✓ Same HttpClient                                                          │
│  ✓ Same JWT token                                                           │
│  ✓ Same database connections                                                │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ After All Tests Complete
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLEANUP (DisposeAsync)                                    │
│  1. Dispose HttpClient                                                      │
│  2. Dispose JITWebAppFactory                                                │
│     └─→ Shuts down in-memory test server                                   │
│  3. Release database connections                                            │
│                                                                              │
│  ✓ Resources cleaned up                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Components

### 1. **Test Infrastructure Layer**

```
┌────────────────────────────────────────┐
│  IntegrationTestCollection             │
│  • [CollectionDefinition]              │
│  • Defines shared fixture              │
└────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│  AuthenticatedTestFixture              │
│  • IAsyncLifetime                      │
│  • One-time authentication             │
│  • Provides authenticated HttpClient   │
└────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│  JITWebAppFactory                      │
│  • WebApplicationFactory<Program>      │
│  • Configures test environment         │
│  • Real PostgreSQL connections         │
└────────────────────────────────────────┘
```

### 2. **Test Class Hierarchy**

```
┌────────────────────────────────────────┐
│  BaseControllerTests (abstract)        │
│  • Helper methods for HTTP calls       │
│  • JSON serialization options          │
│  • CallGetAsJsonAsync<T>()             │
│  • CallPostAsJsonAsync<T, U>()         │
│  • CallPutAsJsonAsync<T, U>()          │
│  • CallDeleteAsJsonAsync<T>()          │
└────────────────────────────────────────┘
           ↑ Inherits
┌────────────────────────────────────────┐
│  Specific Controller Test Classes      │
│  • AuthControllerTests                 │
│  • DrawingLimitControllerTests         │
│  • UserControllerTests                 │
│  • etc.                                │
│                                        │
│  [Collection("Integration")]           │
│  [Trait("Category", "Integration")]    │
│  [Trait("Layer", "Controller")]        │
│  [Trait("Feature", "ControllerName")]  │
└────────────────────────────────────────┘
```

### 3. **Authentication Flow (One-Time)**

```
Start
  │
  ├─→ GET /api/Auth/get-captcha-image
  │   └─→ { captchaCode: "TEST", captchaId: 12345 }
  │
  ├─→ GET /api/Factory/LoginInputModel
  │   └─→ { username: "testuser", password: "***", ... }
  │
  ├─→ POST /api/auth/login
  │   Request: { username, password, captchaCode, captchaId }
  │   └─→ { token: "eyJhbG...", refreshToken: "..." }
  │
  ├─→ Set Authorization Header
  │   └─→ Bearer eyJhbG...
  │
  ├─→ Verify: GET /api/Dashboard/get-dashboard-data
  │   └─→ Success (200 OK)
  │
  └─→ ✓ Authenticated Client Ready
```

### 4. **Individual Test Flow**

```
Test Method
  │
  ├─→ Arrange: Prepare test data
  │
  ├─→ Act: Call API via BaseControllerTests helper
  │   └─→ _client.GetAsync/PostAsync/etc.
  │       └─→ In-Memory Test Server
  │           └─→ ASP.NET Core Pipeline
  │               ├─→ Authentication Middleware (JWT validation)
  │               ├─→ Authorization Middleware
  │               ├─→ Controller Action
  │               │   └─→ Service Layer (BAL)
  │               │       └─→ Repository Layer (DAL)
  │               │           └─→ Dapper Query
  │               │               └─→ PostgreSQL Database ✓
  │               │                   └─→ Returns data
  │               └─→ Serialize Response → JSON
  │
  └─→ Assert: Verify response
      └─→ FluentAssertions
```

---

## 🔧 Key Configuration Files

### `appsettings.Testing.json`
- Database connection strings (test databases)
- JWT configuration
- Feature flags for Testing environment

### `JITAPI.Tests.csproj`
- Test framework: xUnit
- HTTP testing: Microsoft.AspNetCore.Mvc.Testing
- Database: Npgsql.EntityFrameworkCore.PostgreSQL
- Assertions: FluentAssertions

### `Program.cs` (JITAPI)
- Conditional logic based on environment:
  ```csharp
  if (env.EnvironmentName != "Testing")
  {
      // Register RabbitMQ
      // Register Hangfire
      // Register RSA key provider
  }
  ```

---

## 🎯 Test Categorization (Traits)

Tests are organized using xUnit Traits for easy filtering:

```csharp
[Collection("Integration")]           // Shares AuthenticatedTestFixture
[Trait("Category", "Integration")]    // Integration vs Unit
[Trait("Layer", "Controller")]        // Controller/Service/Repository
[Trait("Feature", "Auth")]            // Functional area
[Trait("Action", "Login")]            // Specific endpoint/action
```

**Run specific tests:**
```powershell
# Run all integration tests
dotnet test --filter "Category=Integration"

# Run all Auth tests
dotnet test --filter "Feature=Auth"

# Run specific action tests
dotnet test --filter "Action=Login"

# Run all controller layer tests
dotnet test --filter "Layer=Controller"
```

---

## 🗄️ Database Strategy

### Test Databases (PostgreSQL)
- `wbjit_test_0611` - Main application database
- `jit_test_db_06_11` - Report database
- `hangfire` - Background job tracking

### Connection Management
- **Real connections** via Npgsql (not in-memory)
- Dapper for data access (requires actual DB)
- Shared across all tests (fast execution)
- Requires schema setup before test runs

---

## ⚡ Performance Optimizations

1. **Shared Fixture**
   - One-time authentication for entire test collection
   - Reuses same HttpClient and JWT token
   - Avoids repeated login overhead

2. **In-Memory Test Server**
   - No network latency
   - Fast request/response cycle
   - Full middleware pipeline execution

3. **Real Database**
   - Authentic integration testing
   - Validates Dapper queries
   - Tests actual database behavior

4. **Parallel Execution Disabled**
   - `[assembly: CollectionBehavior(DisableTestParallelization = true)]`
   - Prevents database conflicts
   - Ensures test isolation

---

## 🚀 Test Execution Commands

```powershell
# Run all tests
dotnet test

# Run with detailed output
dotnet test --verbosity normal

# Run specific test class
dotnet test --filter "FullyQualifiedName~AuthControllerTests"

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run and generate coverage report
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
```

---

## 📊 Test Result Logging

Tests use `TestResultLogger` for structured output:
- Request/Response logging (colored console output)
- CI/CD environment detection (suppresses verbose output)
- JSON serialization for debugging
- Integration with xUnit test output

---

## ✅ Summary

The JITAPI test suite provides:
- ✅ **Real Integration Testing** - Actual database queries via Dapper
- ✅ **Authentic Authentication** - JWT tokens via real API endpoints
- ✅ **Fast Execution** - Shared fixture and in-memory server
- ✅ **Easy Filtering** - Trait-based test organization
- ✅ **Clear Assertions** - FluentAssertions for readable tests
- ✅ **Full Pipeline Testing** - Complete ASP.NET Core middleware execution

---

**Next Steps:**
1. Ensure test databases are created and schema is up-to-date
2. Run `setup-test-databases.ps1` to verify database availability
3. Apply schema patches if needed (`patch-test-schema.sql`)
4. Run tests with `dotnet test --verbosity normal`
