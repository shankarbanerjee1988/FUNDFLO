# PDF Generator API Usage Guide

This guide provides instructions for using the PDF Generator API with Postman, including examples for various use cases.

## Getting Started

1. Import the provided Postman collection into your workspace
2. Import the environment configuration
3. Select the appropriate environment (dev, prod, or local)
4. Customize the requests as needed for your specific requirements

## Setup Instructions

### Import Collection

1. In Postman, click **Import** in the top left corner
2. Select the `PDF Generator Postman Collection.json` file
3. Click **Import** to add the collection to your workspace

### Import Environment

1. Click **Import** again
2. Select the `PDF Generator Environments.json` file
3. Click **Import** to add the environments to your workspace

### Configure Environments

1. Click the **Environments** tab
2. Update the URLs to match your actual API Gateway endpoints:
   - `dev-baseUrl`: Your development API endpoint
   - `prod-baseUrl`: Your production API endpoint
   - `local-baseUrl`: Your local testing endpoint using serverless offline

## Available Requests

The collection includes the following sample requests:

### 1. Generate Basic PDF

A simple PDF with default page numbers in header and footer.

### 2. Generate PDF with Custom Header/Footer

PDF with customized header and footer text.

### 3. Generate PDF as Base64

Returns the PDF as base64 encoded data instead of a URL.

### 4. Generate PDF with Sections

A more complex document with sections and structured page numbers.

### 5. Generate Invoice PDF

A professional invoice template with customized styling.

### 6. Generate PDF with Custom Page Size

PDF with custom page size (Letter) and orientation (Landscape).

### 7. Generate PDF without Page Numbers

Sample that disables page numbers in header and footer.

### 8. Generate PDF with Images

Demonstrates proper handling of images with page numbers.

## Common Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `templateContent` | Handlebars template for the PDF | (Required) |
| `data` | Data to be used in the template | `{}` |
| `title` | Document title shown in the header | - |
| `showPageNumbers` | Whether to show page numbers | `true` |
| `copyright` | Copyright text for the footer | "© Powered by Fundflo Technologies" |
| `customFooter` | Custom text for the footer center | - |
| `format` | Page format (A4, Letter, etc.) | "A4" |
| `landscape` | Landscape orientation | `false` |
| `margin` | Page margins | `{ top: "100px", right: "20px", bottom: "80px", left: "20px" }` |

## Query Parameters

| Parameter | Description | Options |
|-----------|-------------|---------|
| `output` | Output format | "url" (default) or "base64" |
| `debug` | Enable debug mode | `true` or `false` (default) |

## Handlebars Helpers

The API supports these custom Handlebars helpers:

| Helper | Description | Example |
|--------|-------------|---------|
| `{{pageBreak}}` | Insert a page break | `{{pageBreak}}` |
| `{{#avoidBreak}}...{{/avoidBreak}}` | Prevent content breaking across pages | `{{#avoidBreak}}...{{/avoidBreak}}` |
| `{{#section name="Title" number="1"}}...{{/section}}` | Create a section with header | `{{#section name="Introduction" number="1"}}...{{/section}}` |
| `{{formatDate date}}` | Format a date | `{{formatDate invoice.date}}` |
| `{{formatCurrency value}}` | Format as currency | `{{formatCurrency invoice.total}}` |
| `{{formatNumber value decimals=2}}` | Format a number | `{{formatNumber percentChange}}` |

## Testing Local Development

To test your local development environment:

1. Start the serverless offline server: `npm run dev`
2. In Postman, select the "Local" environment
3. Send requests to your local endpoint

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `400`: Invalid request (check your template or data)
- `500`: Server error (check your Lambda logs)

Error responses include details about what went wrong in the `error` and `message` fields.

## Example Request

```json
{
  "templateContent": "<h1>{{title}}</h1>\n<p>This is a sample document.</p>",
  "data": {
    "title": "Sample Document"
  },
  "title": "PDF Generator Example",
  "showPageNumbers": true,
  "copyright": "© 2025 My Company",
  "customFooter": "CONFIDENTIAL"
}
```

## Example Response

```json
{
  "message": "PDF generated and uploaded successfully",
  "url": "https://your-s3-bucket.s3.amazonaws.com/pdfs/2025-05-12/1683892749382-a1b2c3d4.pdf"
}
```