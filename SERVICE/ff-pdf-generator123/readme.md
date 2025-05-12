serverless offline start




Date: {{formatDate invoice_date "DD MMM YYYY"}}

Currency: 
Price: {{formatCurrency price "INR" "en-IN"}}

Total: {{multiply price quantity}}  
Discounted Total: {{subtract (multiply price quantity) discount}}

Sum
Grand Total: {{sum item1.amount item2.amount item3.amount}}


Example POST Body (JSON): /dev/generate-pdf?output=url/base64
{
  "templateContent": "<h1>Report Title</h1><p>This is a sample report.</p><table><thead><tr><th>ID</th><th>Name</th><th>Value</th></tr></thead><tbody>{{#each items}}<tr><td>{{id}}</td><td>{{name}}</td><td>{{value}}</td></tr>{{/each}}</tbody></table>",
  "data": {
    "items": [
      {"id": 1, "name": "Item 1", "value": "$100"},
      {"id": 2, "name": "Item 2", "value": "$200"}
    ]
  },
  "format": "A4",
  "landscape": false,
  "displayHeaderFooter": true,
  "headerTemplate": "<div style='font-size: 10px; width: 100%; padding: 10px 20px;'><div style='text-align: left;'>Company Report</div><div style='text-align: right;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div></div>",
  "footerTemplate": "<div style='font-size: 10px; text-align: center; width: 100%; padding: 10px;'>Confidential Document - Generated on <span class='date'></span></div>",
  "margin": {
    "top": "100px",
    "bottom": "70px",
    "left": "20px",
    "right": "20px"
  },
  "printBackground": true
}




Handlebars Template Helpers
The following helpers are available in your templates:

{{markdown}} - Parse Markdown into HTML
{{jsonTable}} - Convert array of objects to HTML table
{{formatNumber}} - Format numbers with decimal precision
{{formatCurrency}} - Format numbers as currency
{{formatDate}} - Format dates with specified format
Math operations: {{multiply}}, {{sum}}, {{subtract}}, {{divide}}
Conditional helpers: {{ifEq}}, {{ifGt}}, {{isEven}}, {{isOdd}}, {{contains}}, {{startsWith}}, {{endsWith}}, {{ifCond}}
String helpers: {{toLowerCase}}, {{toUpperCase}}, {{truncate}}
Array helpers: {{join}}, {{first}}, {{last}}




