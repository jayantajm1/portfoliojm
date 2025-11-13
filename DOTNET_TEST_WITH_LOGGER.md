# .NET Test with Logger - Command Reference

## Basic Test with TRX Report (XML format)
```powershell
dotnet test --logger "trx;LogFileName=test-results.trx"
```

## Test with HTML Report (Human-readable)
```powershell
dotnet test --logger "html;LogFileName=test-results.html"
```

## Test with Multiple Formats
```powershell
dotnet test --logger "trx;LogFileName=test-results.trx" --logger "html;LogFileName=test-results.html"
```

## Test with Coverage Report
```powershell
dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults
```

## All-in-One Command (Recommended)
```powershell
dotnet test --logger "trx;LogFileName=test-results.trx" --logger "html;LogFileName=test-results.html" --collect:"XPlat Code Coverage" --results-directory ./TestResults
```

## Quick Run from Dotnet Folder
```powershell
cd D:\JIT-TEST-gitlab\jitapitest\dotnet
dotnet test --logger "html;LogFileName=test-results.html" --results-directory ./TestResults
```

## View Results
After running the test, open the HTML report:
```
D:\JIT-TEST-gitlab\jitapitest\dotnet\TestResults\test-results.html
```

## Filter Specific Tests
```powershell
# Run specific test class
dotnet test --filter "MotherSanctionControllerTests" --logger "html;LogFileName=test-results.html"

# Run specific test method
dotnet test --filter "MotherSanctionController_GetBalanceSheet_CanGet" --logger "html;LogFileName=test-results.html"

# Run tests by trait
dotnet test --filter "Category=Integration" --logger "html;LogFileName=test-results.html"
```

## Output Location
Test results are saved in: `./TestResults/`

- TRX files: `./TestResults/test-results.trx`
- HTML files: `./TestResults/test-results.html`
- Coverage files: `./TestResults/*/coverage.cobertura.xml`

## Verbose Output
```powershell
dotnet test --logger "html;LogFileName=test-results.html" -v n
```

Verbosity levels: `q[uiet]`, `m[inimal]`, `n[ormal]`, `d[etailed]`, `diag[nostic]`
