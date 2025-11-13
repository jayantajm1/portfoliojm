# Test Results Generation Guide

This guide shows how to run tests and generate various report formats.

## Quick Start

### Option 1: Using PowerShell Script (Recommended)

```powershell
# Run all tests with comprehensive reports
.\run-tests-with-reports.ps1

# Run specific tests
.\run-tests-with-reports.ps1 -Filter "MotherSanctionControllerTests"

# Run tests matching a pattern
.\run-tests-with-reports.ps1 -Filter "UserController"
```

### Option 2: Using dotnet CLI directly

```powershell
# Generate TRX (Visual Studio Test Results)
dotnet test --logger "trx;LogFileName=TestResults/results.trx"

# Generate JUnit (CI/CD friendly)
dotnet test --logger "junit;LogFileName=TestResults/results-junit.xml"

# Generate XUnit XML
dotnet test --logger "xunit;LogFileName=TestResults/results-xunit.xml"

# Generate HTML Report
dotnet test --logger "html;LogFileName=TestResults/results.html"

# Generate multiple formats at once
dotnet test `
  --logger "trx;LogFileName=TestResults/results.trx" `
  --logger "junit;LogFileName=TestResults/results-junit.xml" `
  --logger "html;LogFileName=TestResults/results.html"
```

### Option 3: With Code Coverage

```powershell
# Generate coverage in Cobertura format
dotnet test `
  /p:CollectCoverage=true `
  /p:CoverletOutputFormat=cobertura `
  /p:CoverletOutput=TestResults/coverage.cobertura.xml

# Generate HTML coverage report
dotnet test `
  /p:CollectCoverage=true `
  /p:CoverletOutputFormat=cobertura `
  /p:CoverletOutput=TestResults/coverage.cobertura.xml

# Then generate HTML from coverage
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator `
  -reports:TestResults/coverage.cobertura.xml `
  -targetdir:TestResults/html-report `
  -reporttypes:Html
```

## Generated Report Formats

### 1. TRX Format
- **File**: `*.trx`
- **Use**: Visual Studio, Azure DevOps
- **Format**: XML
- **Human Readable**: No (use tools to view)

### 2. JUnit Format
- **File**: `*.xml`
- **Use**: Jenkins, GitLab CI, GitHub Actions
- **Format**: XML
- **Human Readable**: Partially

### 3. XUnit Format
- **File**: `*.xml`
- **Use**: CI/CD systems that support xUnit
- **Format**: XML
- **Human Readable**: Partially

### 4. HTML Format
- **File**: `*.html`
- **Use**: Human viewing in browser
- **Format**: HTML
- **Human Readable**: Yes ✓

### 5. Cobertura Coverage
- **File**: `coverage.cobertura.xml`
- **Use**: Code coverage analysis, CI/CD
- **Format**: XML
- **Convert to HTML**: Use ReportGenerator (see below)

## Creating Archives

### Create ZIP Archive (PowerShell)
```powershell
# Create a zip archive of test results
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Compress-Archive -Path TestResults\* -DestinationPath "test-results-$timestamp.zip"
```

### Create TAR Archive (PowerShell with tar)
```powershell
# Windows 10/11 has built-in tar
tar -czf test-results.tar.gz TestResults\

# Or using 7-Zip if installed
7z a -ttar test-results.tar TestResults\*
7z a -tgzip test-results.tar.gz test-results.tar
```

### Create TAR Archive (WSL/Linux)
```bash
tar -czf test-results.tar.gz TestResults/
```

## Advanced Usage

### Run with Coverage and Generate HTML Report
```powershell
# Step 1: Run tests with coverage
dotnet test `
  --logger "trx;LogFileName=TestResults/results.trx" `
  /p:CollectCoverage=true `
  /p:CoverletOutputFormat=cobertura `
  /p:CoverletOutput=TestResults/coverage.cobertura.xml

# Step 2: Install ReportGenerator (one time only)
dotnet tool install -g dotnet-reportgenerator-globaltool

# Step 3: Generate HTML report
reportgenerator `
  -reports:TestResults/coverage.cobertura.xml `
  -targetdir:TestResults/html-report `
  -reporttypes:Html;HtmlSummary;Badges

# Step 4: Open in browser
Invoke-Item TestResults\html-report\index.html
```

### Filter Specific Tests
```powershell
# Run only MotherSanctionController tests
dotnet test --filter "MotherSanctionControllerTests"

# Run only specific test method
dotnet test --filter "MotherSanctionController_GetBalanceSheet_CanGet"

# Run tests by category/trait
dotnet test --filter "Category=Integration"
```

## CI/CD Integration Examples

### GitHub Actions
```yaml
- name: Run tests
  run: |
    dotnet test \
      --logger "trx;LogFileName=test-results.trx" \
      --logger "junit;LogFileName=test-results-junit.xml" \
      /p:CollectCoverage=true \
      /p:CoverletOutputFormat=cobertura \
      /p:CoverletOutput=./coverage.cobertura.xml

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      **/test-results.trx
      **/test-results-junit.xml
      **/coverage.cobertura.xml
```

### GitLab CI
```yaml
test:
  script:
    - dotnet test 
        --logger "junit;LogFileName=test-results.xml"
        /p:CollectCoverage=true 
        /p:CoverletOutputFormat=cobertura
  artifacts:
    reports:
      junit: "**/test-results.xml"
      coverage_report:
        coverage_format: cobertura
        path: "**/coverage.cobertura.xml"
```

### Azure DevOps
```yaml
- task: DotNetCoreCLI@2
  inputs:
    command: 'test'
    arguments: '--logger trx --collect "Code coverage"'
    publishTestResults: true
```

## Viewing Reports

### View TRX Files
- **Visual Studio**: Test Explorer → Show Test Results
- **VS Code**: Install "Test Explorer UI" extension
- **Command line**: Use `trx2html` converter

### View Coverage Reports
```powershell
# After generating HTML coverage report
Invoke-Item TestResults\html-report\index.html
```

## Troubleshooting

### "Logger not found" Error
```powershell
# Install the logger packages
dotnet add package JunitXml.TestLogger
dotnet add package XunitXml.TestLogger
```

### "ReportGenerator not found"
```powershell
# Install globally
dotnet tool install -g dotnet-reportgenerator-globaltool

# Or install locally
dotnet tool install dotnet-reportgenerator-globaltool
```

### Generate Summary
```powershell
# Generate a text summary
reportgenerator `
  -reports:TestResults/coverage.cobertura.xml `
  -targetdir:TestResults `
  -reporttypes:TextSummary

# View the summary
Get-Content TestResults\Summary.txt
```

## Output Structure

After running `.\run-tests-with-reports.ps1`:
```
TestResults/
├── 2025-11-12_14-30-45/
│   ├── test-results.trx              # Visual Studio format
│   ├── test-results-junit.xml        # JUnit format for CI/CD
│   ├── test-results-xunit.xml        # XUnit format
│   ├── coverage.cobertura.xml        # Coverage data
│   └── html-report/                  # HTML coverage report
│       ├── index.html                # Open this in browser
│       ├── Summary.html
│       └── ... (other HTML files)
└── test-results_2025-11-12_14-30-45.zip  # Compressed archive
```

## Best Practices

1. **For CI/CD**: Use JUnit or XUnit formats
2. **For Humans**: Use HTML reports
3. **For Coverage**: Use Cobertura + HTML report
4. **For Archives**: Use ZIP for Windows, TAR.GZ for Linux/CI
5. **For Storage**: Keep TRX for long-term test history

## Examples

### Example 1: Quick Test Run
```powershell
dotnet test --logger "trx"
```

### Example 2: Full Report Suite
```powershell
.\run-tests-with-reports.ps1
```

### Example 3: Specific Controller
```powershell
.\run-tests-with-reports.ps1 -Filter "UserControllerTests"
```

### Example 4: Coverage Only
```powershell
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
reportgenerator -reports:coverage.cobertura.xml -targetdir:coverage-html
Invoke-Item coverage-html\index.html
```
