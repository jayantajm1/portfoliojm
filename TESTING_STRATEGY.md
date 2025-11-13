# Comprehensive Testing Strategy for JIT API

## Current Setup Analysis

### ✅ What's Already Working

1. **Environment Isolation** ✅
   - `Program.cs` properly checks for "Testing" environment
   - RabbitMQ, Hangfire, RsaKeyProvider, and JWT are disabled in tests
   - `appsettings.Testing.json` configured with test database

2. **Test Configuration** ✅
   - `JITWebAppFactory` uses "Testing" environment
   - Loads `appsettings.Testing.json`
   - In-Memory EF Core DbContext for fast tests
   - Removes real Npgsql registrations

3. **Authentication Testing** ✅
   - `AuthenticatedTestFixture` handles full auth flow
   - Gets captcha → logs in → stores token
   - `TestAuthHandler` for simple bypass auth

### ⚠️ Critical Issue: Mixing Dapper + EF Core In-Memory

**Your app uses Dapper for database access, but tests use EF Core In-Memory database.**

**Problem:** Dapper executes raw SQL against a real database connection. EF Core In-Memory provider doesn't support SQL queries.

**Evidence from your setup:**
- `appsettings.Testing.json` has real PostgreSQL connection strings
- `DatabaseFixture.cs` connects to real test database
- `JITWebAppFactory.cs` uses `UseInMemoryDatabase()` (won't work with Dapper!)

## Recommended Testing Approach

### Option 1: Real Test Database (Recommended for Dapper)

Since you're using **Dapper**, you MUST test against a real PostgreSQL database.

#### Step 1: Update `JITWebAppFactory.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using wbjitcssV1_be.DAL;
using wbjitcssV1_be.Helper;

namespace JITAPI.Tests
{
    public class JITWebAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            // Load appsettings.Testing.json (already has test DB connection strings)
            builder.ConfigureAppConfiguration((context, config) =>
            {
                var env = context.HostingEnvironment;
                config
                    .SetBasePath(env.ContentRootPath)
                    .AddJsonFile("appsettings.Testing.json", optional: false, reloadOnChange: false)
                    .AddEnvironmentVariables();
            });

            builder.ConfigureTestServices(services =>
            {
                // Remove In-Memory DbContext registrations (they don't work with Dapper!)
                var efDescriptors = services
                    .Where(d => d.ServiceType == typeof(DbContextOptions<JITDBContext>) ||
                               d.ServiceType == typeof(DbContextOptions<JITReportDBContext>) ||
                               d.ServiceType == typeof(DbContextOptions))
                    .ToList();
                foreach (var d in efDescriptors) services.Remove(d);

                // Re-register DbContexts with PostgreSQL from appsettings.Testing.json
                // Program.cs already does this, but only if NOT Testing environment
                // So we need to do it here explicitly
                var configuration = services.BuildServiceProvider()
                    .GetRequiredService<IConfiguration>();

                services.AddDbContext<JITDBContext>(options =>
                    options.UseNpgsql(configuration.GetConnectionString("JITDBConnection")),
                    ServiceLifetime.Scoped);

                services.AddDbContext<JITReportDBContext>(options =>
                    options.UseNpgsql(configuration.GetConnectionString("JITReportDBConnection")),
                    ServiceLifetime.Scoped);

                // Keep RsaKeyProvider removed (no encryption keys in test)
                services.RemoveAll<RsaKeyProvider>();

                // Use real JWT auth (not test bypass) for integration tests
                // AuthenticatedTestFixture will handle login and token management
            });
        }
    }
}
```

#### Step 2: Database Management Strategy

**For Local Testing:**

1. **One-Time Setup:** Create dedicated test databases
   ```sql
   CREATE DATABASE wbjit_test_0611;
   CREATE DATABASE hangfire_test;
   ```

2. **Test Lifecycle:**
   - **Before all tests:** Ensure databases exist
   - **Before each test:** (Optional) Truncate tables OR use transactions
   - **After each test:** Rollback transaction OR clean data
   - **After all tests:** (Optional) Drop databases

**For CI/CD Pipeline:**

Use **Testcontainers** to spin up PostgreSQL in Docker:

```bash
dotnet add JITAPI.Tests package Testcontainers.PostgreSql
```

```csharp
// DatabaseFixture.cs
using Testcontainers.PostgreSql;
using Xunit;

public class DatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer _postgresContainer;
    public string ConnectionString { get; private set; }

    public async Task InitializeAsync()
    {
        // Start PostgreSQL container
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("jitapi_test")
            .WithUsername("testuser")
            .WithPassword("testpass")
            .Build();

        await _postgresContainer.StartAsync();
        ConnectionString = _postgresContainer.GetConnectionString();

        // Run migrations/seed data
        await SeedTestDatabase();
    }

    public async Task DisposeAsync()
    {
        await _postgresContainer.DisposeAsync();
    }

    private async Task SeedTestDatabase()
    {
        // Run your SQL scripts to create schema
        // Or use EF migrations: dbContext.Database.Migrate();
    }
}

// Collection fixture for sharing container across tests
[CollectionDefinition("Database collection")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture> { }

// Use in test classes
[Collection("Database collection")]
public class AuthControllerTests
{
    private readonly DatabaseFixture _dbFixture;

    public AuthControllerTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
        // Override connection string in tests
        Environment.SetEnvironmentVariable("ConnectionStrings:JITDBConnection", 
            dbFixture.ConnectionString);
    }
}
```

#### Step 3: Transaction-Based Test Isolation

Wrap each test in a transaction and rollback after:

```csharp
using System.Data;
using Npgsql;
using Xunit;

public class TransactionalTestBase : IAsyncLifetime
{
    protected IDbConnection Connection { get; private set; }
    protected IDbTransaction Transaction { get; private set; }

    public async Task InitializeAsync()
    {
        // Get connection string from config
        var connectionString = // ... from appsettings.Testing.json
        Connection = new NpgsqlConnection(connectionString);
        await Connection.OpenAsync();
        Transaction = Connection.BeginTransaction();
    }

    public async Task DisposeAsync()
    {
        // Rollback all changes made during test
        Transaction?.Rollback();
        Transaction?.Dispose();
        Connection?.Dispose();
    }
}

// Use in tests
public class AuthControllerTests : TransactionalTestBase
{
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Test code...
        // All DB changes will be rolled back after test
    }
}
```

### Option 2: Respawn (Reset Database Between Tests)

Use **Respawn** to quickly reset database to clean state:

```bash
dotnet add JITAPI.Tests package Respawn
```

```csharp
using Npgsql;
using Respawn;
using Xunit;

public class DatabaseFixture : IAsyncLifetime
{
    private Respawner _respawner;
    private NpgsqlConnection _connection;

    public async Task InitializeAsync()
    {
        var connectionString = "...from appsettings.Testing.json";
        _connection = new NpgsqlConnection(connectionString);
        await _connection.OpenAsync();

        // Initialize Respawn
        _respawner = await Respawner.CreateAsync(_connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            TablesToIgnore = new Table[] { "__EFMigrationsHistory" },
            SchemasToInclude = new[] { "public" }
        });
    }

    public async Task ResetDatabaseAsync()
    {
        await _respawner.ResetAsync(_connection);
    }

    public Task DisposeAsync()
    {
        _connection?.Dispose();
        return Task.CompletedTask;
    }
}

// Use in tests
[Collection("Database collection")]
public class AuthControllerTests : IAsyncLifetime
{
    private readonly DatabaseFixture _dbFixture;

    public AuthControllerTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
    }

    public async Task InitializeAsync()
    {
        // Reset database before each test
        await _dbFixture.ResetDatabaseAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Login_Test()
    {
        // Test with clean database
    }
}
```

## CI/CD Pipeline Strategy

### GitHub Actions Example

```yaml
name: .NET Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: jitapi_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'
    
    - name: Restore dependencies
      run: dotnet restore
    
    - name: Run tests
      run: dotnet test --no-restore --verbosity normal
      env:
        ConnectionStrings__JITDBConnection: "Host=localhost;Database=jitapi_test;Username=testuser;Password=testpass;Port=5432"
```

### Azure DevOps Example

```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

resources:
  containers:
  - container: postgres
    image: postgres:15
    env:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: jitapi_test
    ports:
    - 5432:5432

steps:
- task: UseDotNet@2
  inputs:
    version: '8.0.x'

- script: dotnet restore
  displayName: 'Restore packages'

- script: dotnet test --logger trx
  displayName: 'Run tests'
  env:
    ConnectionStrings__JITDBConnection: 'Host=localhost;Database=jitapi_test;Username=testuser;Password=testpass;Port=5432'

- task: PublishTestResults@2
  inputs:
    testResultsFormat: 'VSTest'
    testResultsFiles: '**/*.trx'
```

## Test Organization Best Practices

### 1. Test Categories

```csharp
// Unit tests (mock dependencies)
[Trait("Category", "Unit")]
public class UserServiceTests { }

// Integration tests (real database)
[Trait("Category", "Integration")]
public class AuthControllerTests { }

// E2E tests (full stack)
[Trait("Category", "E2E")]
public class LoginFlowTests { }
```

Run specific categories:
```bash
dotnet test --filter "Category=Unit"
dotnet test --filter "Category=Integration"
```

### 2. Test Data Builders

```csharp
public class LoginInputModelBuilder
{
    private readonly LoginInputModel _model = new();

    public LoginInputModelBuilder WithUsername(string username)
    {
        _model.Username = username;
        return this;
    }

    public LoginInputModelBuilder WithValidCredentials()
    {
        _model.Username = "GROUP_N_USER_007";
        _model.Password = "admin";
        return this;
    }

    public LoginInputModel Build() => _model;
}

// Usage in tests
var loginData = new LoginInputModelBuilder()
    .WithValidCredentials()
    .Build();
```

### 3. Shared Test Utilities

```csharp
public static class TestHelpers
{
    public static async Task<string> GetAuthTokenAsync(HttpClient client)
    {
        // Reusable auth logic
    }

    public static void SeedTestData(JITDBContext context)
    {
        // Seed common test data
    }
}
```

## Current Issues to Fix

### Issue 1: In-Memory DB with Dapper ❌

**Current:** `JITWebAppFactory` uses `UseInMemoryDatabase()`  
**Problem:** Dapper can't execute SQL against in-memory provider  
**Fix:** Use real PostgreSQL connection from `appsettings.Testing.json`

### Issue 2: TestAuthHandler Not Used ❌

**Current:** `TestAuthHandler` registered but not used  
**Current:** `AuthenticatedTestFixture` does real login (correct!)  
**Recommendation:** Remove `TestAuthHandler` OR use it for tests that don't need real auth

### Issue 3: Database Cleanup ⚠️

**Current:** No cleanup between tests  
**Problem:** Tests may interfere with each other  
**Fix:** Use transactions OR Respawn OR recreate database

## Recommended Next Steps

1. **Fix `JITWebAppFactory`** - Remove In-Memory, use real PostgreSQL
2. **Add Database Fixture** - Use Testcontainers for CI/CD
3. **Implement Test Isolation** - Use transactions or Respawn
4. **Update CI/CD Pipeline** - Add PostgreSQL service
5. **Organize Tests** - Add categories and traits
6. **Add Test Data Seeding** - Create test fixtures with sample data

## Example: Complete Test Class

```csharp
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;

[Collection("Database collection")] // Share database fixture
public class AuthControllerTests : IAsyncLifetime
{
    private readonly ITestOutputHelper _output;
    private readonly DatabaseFixture _dbFixture;
    private readonly JITWebAppFactory _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(
        ITestOutputHelper output,
        DatabaseFixture dbFixture)
    {
        _output = output;
        _dbFixture = dbFixture;
        _factory = new JITWebAppFactory();
        _client = _factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        // Reset database before each test
        await _dbFixture.ResetDatabaseAsync();
        
        // Seed test data
        await SeedTestDataAsync();
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        _factory.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var loginData = new LoginInputModel
        {
            Username = "GROUP_N_USER_007",
            Password = "admin",
            CaptchaCode = "test", // From seeded data
            CaptchaId = 1,
            Fin_Year = 2526
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginData);

        // Assert
        _output.WriteLine($"Status: {response.StatusCode}");
        Assert.True(response.IsSuccessStatusCode);
        
        var result = await response.Content.ReadFromJsonAsync<APIResponseClass<TokenModel>>();
        Assert.NotNull(result?.Data?.Token);
    }

    private async Task SeedTestDataAsync()
    {
        // Insert test users, captchas, etc.
    }
}
```

## Summary

**For Dapper + PostgreSQL apps:**
1. ✅ Use real test database (not In-Memory)
2. ✅ Use Testcontainers for CI/CD
3. ✅ Use transactions or Respawn for test isolation
4. ✅ Keep external dependencies (RabbitMQ, Hangfire) disabled
5. ✅ Use real authentication flow in integration tests

Your current setup is 80% there - just need to fix the In-Memory database issue!
