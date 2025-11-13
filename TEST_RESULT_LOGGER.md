# Test Result Logger

## Overview

The `TestResultLogger` automatically saves all test execution details to organized log files in the `test-results` folder.

## Features

✅ **Automatic File Logging** - All test output is saved to timestamped log files  
✅ **Organized by Date** - Logs are organized in folders by date (YYYY-MM-DD)  
✅ **Timestamped Entries** - Each log entry includes precise timestamp  
✅ **Test Summaries** - Automatic test summary file generation  
✅ **Dual Output** - Logs to both console and file simultaneously  
✅ **Structured Logging** - Built-in methods for different log types  

## Folder Structure

```
test-results/
├── 2025-11-06/
│   ├── FavListControllerTests_143052.log
│   ├── FtoControllerTests_143053.log
│   ├── MasterControllerTests_143055.log
│   └── test-summary.txt
├── 2025-11-07/
│   ├── ...
│   └── test-summary.txt
```

## Usage

### Basic Setup

```csharp
public class MyControllerTests : IClassFixture<AuthenticatedTestFixture>, IDisposable
{
    private readonly HttpClient _client;
    private readonly TestResultLogger _logger;

    public MyControllerTests(
        AuthenticatedTestFixture factory,
        ITestOutputHelper output)
    {
        _client = factory.CreateClient();
        
        // Initialize logger with test class name
        _logger = new TestResultLogger(output, nameof(MyControllerTests));
    }

    [Fact]
    public async Task My_Test_Method()
    {
        var testName = nameof(My_Test_Method);
        _logger.WriteTestStart(testName);
        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Your test code here
            _logger.WriteInfo("Running test logic...");
            
            var response = await _client.GetAsync("/api/endpoint");
            _logger.WriteSuccess($"Got response: {response.StatusCode}");

            response.IsSuccessStatusCode.Should().BeTrue();

            stopwatch.Stop();
            _logger.WriteTestSuccess(testName, stopwatch.Elapsed);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.WriteTestFailure(testName, ex.Message, stopwatch.Elapsed);
            throw;
        }
    }

    public void Dispose()
    {
        _logger?.Dispose();
    }
}
```

## Logger Methods

### Test Lifecycle

```csharp
// Mark test start
_logger.WriteTestStart("TestName");

// Mark test success (with duration)
_logger.WriteTestSuccess("TestName", timeSpan);

// Mark test failure (with error and duration)
_logger.WriteTestFailure("TestName", errorMessage, timeSpan);
```

### Sections

```csharp
// Create a section header
_logger.WriteSection("Arrange");
_logger.WriteSection("Act");
_logger.WriteSection("Assert");
```

### Different Log Levels

```csharp
// Success message with ✓
_logger.WriteSuccess("Operation completed successfully");

// Failure message with ✗
_logger.WriteFailure("Operation failed");

// Info message with ℹ
_logger.WriteInfo("Processing data...");

// Warning message with ⚠
_logger.WriteWarning("Potential issue detected");

// Generic message
_logger.WriteLine("Custom message");
```

## Example Log Output

```
================================================================================
Test Execution Report
Test Class: FavListControllerTests
Start Time: 2025-11-06 14:30:52
Environment: Testing
================================================================================

[14:30:52.123] ▶ Starting Test: Get_Favorite_List_Should_Return_Success
[14:30:52.124] --------------------------------------------------------------------------------
[14:30:52.125] 
[14:30:52.126] ═══ Arrange ═══
[14:30:52.127] ℹ Preparing test data...
[14:30:52.128] ℹ Target endpoint: /api/fav-list/agency-fav-list
[14:30:52.129] 
[14:30:52.130] ═══ Act ═══
[14:30:52.131] ℹ Sending HTTP request...
[14:30:52.245] ℹ Response Status: 200 OK
[14:30:52.246] 
[14:30:52.247] ═══ Assert ═══
[14:30:52.248] ℹ Verifying response...
[14:30:52.249] ✓ Status code is OK
[14:30:52.250] ✓ Test PASSED: Get_Favorite_List_Should_Return_Success (127.45ms)
[14:30:52.251] 

================================================================================
Test Execution Completed
End Time: 2025-11-06 14:30:52
Total Duration: 0.15 seconds
Log File: d:\project NIC\JIT-gitlab\jitapitest\dotnet\JITAPI.Tests\bin\Debug\net8.0\test-results\2025-11-06\FavListControllerTests_143052.log
================================================================================
```

## Test Summary File

The logger automatically creates a `test-summary.txt` file in each date folder:

```
Last Test Run: 2025-11-06 14:30:52
Latest Log: FavListControllerTests_143052.log
Full Path: d:\...\test-results\2025-11-06\FavListControllerTests_143052.log

Recent Test Runs:
  - FavListControllerTests_143052.log (2025-11-06 14:30:52)
  - FtoControllerTests_143053.log (2025-11-06 14:30:53)
  - MasterControllerTests_143055.log (2025-11-06 14:30:55)
```

## Benefits

1. **Audit Trail** - Complete history of all test executions
2. **Debug Support** - Detailed logs help diagnose test failures
3. **CI/CD Integration** - Log files can be archived as build artifacts
4. **Performance Tracking** - Execution times recorded for each test
5. **Easy Navigation** - Organized by date and timestamped filenames

## Integration with Existing Tests

To add logging to existing tests:

1. Add `IDisposable` to your test class
2. Add `TestResultLogger` field
3. Initialize in constructor with `ITestOutputHelper`
4. Wrap test logic in try-catch with logger calls
5. Dispose logger in `Dispose()` method

See `ExampleTestWithLogging.cs` for complete examples.
