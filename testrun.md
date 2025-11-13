# Test Execution Guide

This document contains all the commands needed to run tests in the JIT API project.

## Prerequisites

- .NET 8.0 SDK installed
- Navigate to the dotnet directory: `cd d:\JIT-gitlab\jitapitest\dotnet`

## Current Status

⚠️ **Tests are currently failing** due to RabbitMQ configuration requirement during application startup.

### Known Issues
- Tests fail with: `System.InvalidOperationException : RabbitMQ configuration is missing`
- Issue location: `JITAPI\RabbitMQExtensions\RabbitMQExtensionRegister.cs:line 24`
- Root cause: RabbitMQ is required during app initialization (Program.cs:line 285)

## Test Commands

### Run All Tests
```powershell
cd d:\JIT-gitlab\jitapitest\dotnet
dotnet test --verbosity normal
```

### Run Specific Test Class
```powershell
# Run all AuthControllerTests
dotnet test --filter "FullyQualifiedName~AuthControllerTests" --verbosity normal

# Run all IntegrationControllerTests
dotnet test --filter "FullyQualifiedName~IntegrationControllerTests" --verbosity normal

# Run all DashboardControllerTests
dotnet test --filter "FullyQualifiedName~DashboardControllerTests" --verbosity normal

```

### Run Individual Tests
```powershell
# Financial Year test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_GetFinancialYear_ReturnsSuccess" --verbosity normal

# Login test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_Login_WithFactoryData_CanLogin" --verbosity normal

# Logout test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_Logout_CanLogout" --verbosity normal

# Get Config test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_GetConfig_CanGet" --verbosity normal

# Get Server Data test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_GetServerData_ReturnsData" --verbosity normal

# Get Captcha Image test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_GetCaptchaImage_ReturnsOk" --verbosity normal

# Send OTP test
dotnet test --filter "FullyQualifiedName~AuthControllerTests.AuthController_SendOtp_CanSend" --verbosity normal
```

### Run Tests with Coverage
```powershell
# Run all tests with coverage
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura

# Run specific test class with coverage
dotnet test --filter "FullyQualifiedName~AuthControllerTests" /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura

# Generate HTML coverage report (requires ReportGenerator)
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"coverage.cobertura.xml" -targetdir:"coveragereport" -reporttypes:Html
```

### Build Before Testing
```powershell
# Clean build
dotnet clean
dotnet build

# Then run tests
dotnet test --verbosity normal
```

### Run Tests in Watch Mode
```powershell
# Automatically re-run tests when code changes
dotnet watch test
```

## Troubleshooting

### Fix RabbitMQ Configuration Issue

To fix the current test failures, modify `JITAPI\Program.cs` around line 285:

```csharp
// Register the RabbitMQ extension (skip in Testing environment)
if (builder.Environment.EnvironmentName != "Testing")
{
    builder.Services
       .AddRabbitMQ(builder.Configuration)
       .AddMessageProcessing();
}
builder.Services.AddTransient<IRabbitMQTransactionRepo, RabbitMQTransactionRepo>();
builder.Services.AddTransient<IConsumeLogRepository, ConsumeLogRepository>();
```

### Check Test Discovery
```powershell
# List all discoverable tests
dotnet test --list-tests
```

### Verbose Output for Debugging
```powershell
# Maximum verbosity
dotnet test --verbosity detailed

# Diagnostic output
dotnet test --verbosity diagnostic
```

## Test Project Structure

```
JITAPI.Tests/
├── Controller/
│   ├── AuthControllerTests.cs          (7 tests - currently failing)
│   ├── BaseControllerTests.cs          (Abstract base class with helper methods)
│   ├── FtoControllerTests.cs           (9 tests - uses AuthenticatedTestFixture)
│   ├── IntegrationControllerTests.cs   (5 tests - has compilation warnings)
│   └── PayementFileApiControllerTests.cs (5 tests - has compilation warnings)
├── AuthenticatedTestFixture.cs          (Shared fixture for authenticated tests)
├── DatabaseFixture.cs                   (Database fixture for JIT DB and Hangfire DB)
├── JITWebAppFactory.cs                  (Test server factory)
├── TestAuthHandler.cs                   (Mock authentication handler)
├── TestDbInitializer.cs                 (Database seeding for tests)
└── appsettings.Test.json                (Test configuration)
```

### BaseControllerTests

The `BaseControllerTests` is an abstract base class that provides common functionality for controller tests:

**Features:**
- Abstract class (should not be instantiated directly)
- Implements `ITestCollectionOrderer` for test ordering
- Protected `_client` field for HTTP client access
- JSON serialization configuration with camelCase naming
- Console output helpers with colored formatting (disabled in CI environment)

**Helper Methods:**
- `CallPostAsJsonAsync<TRespDTO, TEntryDTO>` - POST requests with JSON payload
- `CallPutAsJsonAsync<TRespDTO, TEntryDTO>` - PUT requests with JSON payload
- `CallGetAsJsonAsync<TRespDTO>` - GET requests
- `CallDeleteAsJsonAsync<TRespDTO>` - DELETE requests
- `PrintOut` - Formatted console output for debugging (respects CI environment)

**Return Type:**
All HTTP helper methods return `APIResponseClass<T>` from `wbjitcssV1_be.Helper` namespace.

**Usage Example:**
```csharp
public class MyControllerTests : BaseControllerTests
{
    public MyControllerTests(HttpClient client) : base(client)
    {
    }

    [Fact]
    public async Task MyTest()
    {
        var response = await CallGetAsJsonAsync<MyResponseDto>("/api/endpoint");
        response.Should().NotBeNull();
    }
}
```

## Test Categories

### Integration Tests (Collection: "Integration")
- `AuthControllerTests` - 7 tests for authentication endpoints
- `IntegrationControllerTests` - 5 tests (needs refactoring to use AuthenticatedTestFixture)
- `PayementFileApiControllerTests` - 5 tests (needs refactoring to use AuthenticatedTestFixture)

## Recent Changes

### Completed
✅ Added `Microsoft.EntityFrameworkCore.InMemory` package (version 8.0.11)
✅ Refactored `AuthControllerTests` to use factory pattern with `AuthenticatedTestFixture`
✅ Added `partial Program class` to expose entry point for `WebApplicationFactory<Program>`
✅ Created `appsettings.Testing.json` with RabbitMQ configuration
✅ Configured JITWebAppFactory to use in-memory database

### Pending
⏳ Fix RabbitMQ configuration requirement in tests
⏳ Refactor `IntegrationControllerTests` to use `AuthenticatedTestFixture`
⏳ Refactor `PayementFileApiControllerTests` to use `AuthenticatedTestFixture`

## Additional Commands

### Restore Dependencies
```powershell
dotnet restore
```

### Clean Test Artifacts
```powershell
# Remove test results
Remove-Item -Recurse -Force TestResults

# Clean build output
dotnet clean
```

### Run Specific Test by Full Name
```powershell
dotnet test --filter "FullyQualifiedName=JITAPI.Tests.Controller.AuthControllerTests.AuthController_Login_WithFactoryData_CanLogin"
```

### Filter by Category (if implemented)
```powershell
# Example if [Trait("Category", "Integration")] is used
dotnet test --filter "Category=Integration"
```

## CI/CD Integration

### GitHub Actions / GitLab CI
```yaml
- name: Run Tests
  run: |
    cd dotnet
    dotnet test --verbosity normal --logger "trx;LogFileName=test-results.trx"
    
- name: Publish Test Results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Test Results
    path: '**/test-results.trx'
    reporter: dotnet-trx
```

## Notes

- All tests use an in-memory database (`JITApi_TestDb`)
- Tests use a mock authentication handler (`TestAuthHandler`)
- Test environment is set to "Testing" in `JITWebAppFactory`
- Database is reset before each test run (EnsureDeleted + EnsureCreated)

## Contact

For issues or questions about the tests, refer to the test files or check the main README.md.

---

**Last Updated:** November 6, 2025
