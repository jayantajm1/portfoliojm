API Documentation Generation Guide for both Developer and User

---

# API Documentation Generation

Generates comprehensive, user-friendly API documentation in both **PDF** and **Excel** formats directly from your ASP.NET Core application's Swagger/OpenAPI specification.

---

## Table of Contents

- [Features at a Glance](#-features-at-a-glance)
- [Dependencies](#-dependencies)
- [Project Setup & Configuration](#-project-setup--configuration)
  - [1. Enable XML Comments](#1-enable-xml-comments)
  - [2. Configure SwaggerGen](#2-configure-swaggergen)
- [How to Use](#-how-to-use)
  - [1. Annotate Your Controllers & DTOs](#1-annotate-your-controllers--dtos)
  - [2. Run the Application](#2-run-the-application)
  - [3. Download Documentation](#3-download-documentation)
- [Customization Deep Dive](#-customization-deep-dive)
  - [The `PermissionOperationFilter`](#the-permissionoperationfilter)
  - [The `DocumentationGeneratorService`](#the-documentationgeneratorservice)
- [Sample Output](#-sample-output)
  - [Excel Format](#excel-format)
  - [PDF Format](#pdf-format)
- [Project File Structure](#-project-file-structure)

---

## ✨ Features at a Glance

- **Dual-Format Export:** Generate documentation in both stylized PDF and structured Excel formats.
- **Rich Metadata:** Captures essential OpenAPI fields directly from your code's XML comments (`summary`, `remarks`, `param`), attributes, and response types.
- **Custom Permissions:** Automatically detects multiple `[Permission]` attributes on your endpoints and lists them in a dedicated `x-permissions` field.
- **Dynamic Content:** Documentation is generated from your live API's `swagger.json`, ensuring it's always up-to-date with your code.
- **Customizable Design:**
  - **PDF:** A4 layout, colored headers for methods (GET: Green, POST: Blue), and clean typography using **QuestPDF**.
  - **Excel:** Method-colored headers, word-wrapped cells for readability, and a clean, filterable tabular structure using **ClosedXML**.

## 📦 Dependencies

- **.NET 8.0**
- **Swashbuckle.AspNetCore** (`v6.5.0` or higher)
- **QuestPDF** (`v2022.12.14` or higher)
- **ClosedXML** (`v0.102.3` or higher)

## 🛠️ Project Setup & Configuration

To enable this feature in your project, follow these steps.

### 1. Enable XML Comments

Your documentation is built from your code's XML comments (`<summary>`, `<param>`, etc.). Enable XML documentation generation in your project's `.csproj` file.

```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <!-- This is the crucial part -->
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <!-- This suppresses warnings for public members missing XML comments -->
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

### 2. Configure SwaggerGen

In your `Program.cs`, configure the `SwaggerGen` service. The following setup is required for the documentation generator to work correctly.

```csharp
// File: Program.cs
using System.Reflection;
using CTS_BE.Helper.Authentication; // For [Permission] attribute
using YourProject.Swagger.Filters; // The location of your custom filter

// ... other services

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CTS-BE API", Version = "v1" });

    // 1. Include XML comments from your controllers and models
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    c.IncludeXmlComments(xmlPath);

    // 2. Add the custom operation filter for permissions
    // This is where you register the logic to read [Permission] attributes
    c.OperationFilter<PermissionOperationFilter>();
});

// ...
```

## 🚀 How to Use

### 1. Annotate Your Controllers & DTOs

The quality of your documentation depends on how well you annotate your API endpoints.

#### **For Simple Parameters (Path, Query):**

Use `/// <param>` on the controller method.

```csharp
/// <summary>
/// Retrieves a specific PPO by its ID.
/// </summary>
/// <remarks>This fetches the complete record for a single pensioner.</remarks>
/// <param name="ppoId">The unique identifier of the PPO to retrieve.</param>
/// <returns>An API response with the pensioner's details.</returns>
[HttpGet("ppo/{ppoId}/details")]
[Tags("Pension: PPO Details")]
[Permission("can-view-ppo")] // This is read by PermissionOperationFilter
[Permission("is-treasury-user")] // Handles multiple permissions
public async Task<JsonAPIResponse<PensionerResponseDTO>> GetPensionerByPpoId(int ppoId)
{
    // ... implementation
}
```

#### **For Complex Parameters (Request Body DTOs):**

**Important:** The `/// <param>` tag on the controller method is **ignored** for DTOs. You must add `/// <summary>` comments to the **properties inside the DTO class itself.**

**Controller Method:**

```csharp
/// <summary>
/// Creates a new pensioner record.
/// </summary>
/// <param name="pensionerEntryDTO">This description is IGNORED. Use comments in the DTO class instead.</param>
[HttpPost("ppo/details")]
public async Task<JsonAPIResponse<PensionerResponseDTO>> CreatePensioner(
    PensionerEntryDTO pensionerEntryDTO
)
{
    // ...
}
```

**DTO Class (The Correct Way):**

```csharp
// File: PensionerEntryDTO.cs

/// <summary>
/// Contains all the details required to create a new pensioner.
/// </summary>
public class PensionerEntryDTO
{
    /// <summary>
    /// The full name of the pensioner.
    /// </summary>
    [Required]
    public string PensionerName { get; set; }

    /// <summary>
    /// The unique Pension Payment Order number.
    /// </summary>
    [Required]
    public string PpoNo { get; set; }
}
```

### 2. Run the Application

Start your ASP.NET Core application.

```bash
dotnet run
```

### 3. Download Documentation

Use a browser or an API client like `cURL` or Postman to hit the download endpoint.

**Endpoint:** `GET /api/v1/Swagger/download`

**Example: Download PDF**

```http
GET https://localhost:7123/api/v1/Swagger/download?format=pdf&docName=v1
```

**Example: Download Excel**

```http
GET https://localhost:7123/api/v1/Swagger/download?format=excel&docName=v1
```

---

## 🔬 Customization Deep Dive

### The `PermissionOperationFilter`

This is a custom `IOperationFilter` that inspects each endpoint for your `[Permission]` attributes. It collects all of them and adds them to a custom `x-permissions` array in the `swagger.json` file. This is how your authorization requirements become part of the documentation.

**File:** `Helpers/Authentication/PermissionOperationFilter.cs`

```csharp
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace CTS_BE.Helper.Authentication
{
    public class PermissionOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Get all [Permission] attributes on the action method
            var permissionAttributes = context.MethodInfo
                .GetCustomAttributes(true)
                .OfType<PermissionAttribute>();

            if (!permissionAttributes.Any())
            {
                return; // No permissions, do nothing
            }

            // If the extensions dictionary doesn't exist, create it
            operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();

            // Create a list of permissions from the attributes
            var permissions = permissionAttributes
                .Select(attr => attr.PermissionName)
                .Where(p => !string.IsNullOrEmpty(p))
                .ToList();

            if (permissions.Any())
            {
                // Create an OpenApiArray to hold the permission strings
                var openApiArray = new OpenApiArray();
                permissions.ForEach(p => openApiArray.Add(new OpenApiString(p)));

                // Add the custom x-permissions field with the array
                operation.Extensions.Add("x-permissions", openApiArray);
            }
        }
    }
}
```

### The `DocumentationGeneratorService`

This is the service you have already built. It contains the core logic for:

1.  Receiving the `OpenApiDocument` object from the `SwaggerController`.
2.  Parsing the document's paths, operations, parameters, and custom extensions (like `x-permissions`).
3.  Using **QuestPDF** to render the parsed data into a `byte[]` for the PDF file.
4.  Using **ClosedXML** to render the parsed data into a `byte[]` for the Excel file.

---

## 📊 Sample Output

### Excel Format

The Excel file provides a clean, filterable view of all endpoints, which is great for QA teams and for quick reference.

| Method | Path                   | Tags                   | Summary                                | Request Body      | Responses                   | Permissions                           |
| :----- | :--------------------- | :--------------------- | :------------------------------------- | :---------------- | :-------------------------- | :------------------------------------ |
| `GET`  | `/ppo/{ppoId}/details` | `Pension: PPO Details` | Gets a specific pensioner's details... | (none)            | `200`: PensionerResponseDTO | `can-view-ppo`<br/>`is-treasury-user` |
| `POST` | `/ppo/details`         | `Pension: PPO Details` | Creates a new pensioner record.        | PensionerEntryDTO | `200`: PensionerResponseDTO | `can-create-ppo`                      |

### PDF Format

The PDF is a polished, human-readable document suitable for sharing with external partners or for formal documentation archives.

- **Header:** Contains the endpoint method (`GET`, `POST`) and path, with a method-specific background color.
- **Metadata:** A section with `Tags`, `Summary`, `Description`, and **`Permissions`**.
- **Parameters:** A table listing all path, query, and header parameters with their types and descriptions.
- **Request Body:** A section detailing the request payload schema.
- **Responses:** A list of possible HTTP status codes and the shape of their response bodies.

## 📂 Project File Structure

A recommended location for the feature's files:

```
YourProject/
├── Controllers/
│   ├── Pension/
│   │   └── PpoDetailsController.cs   # Annotated controller
│   └── SwaggerController.cs          # The controller with the /download endpoint
├── BAL/                              # Business Access Layer
│   └── Services/
│       └── DocumentationGeneratorService.cs
├── DTOs/
│   └── PensionerEntryDTO.cs        # Annotated DTO
├── Helper/
│   └── Authentication/
│       ├── PermissionAttribute.cs
│       └── PermissionOperationFilter.cs
├── Program.cs                        # Contains SwaggerGen setup
└── YourProject.csproj                # XML documentation enabled here
```
