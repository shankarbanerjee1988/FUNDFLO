/**
 * Renders guide.md or any markdown file into a PDF using the PDF Generator API
 * @param {string} markdownFilePath - Path to the markdown file
 * @param {object} options - Additional options for PDF generation
 * @returns {Promise<string>} - URL to the generated PDF
 */
const renderGuideToPdf = async (markdownFilePath, options = {}) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const axios = require('axios');
      const marked = require('marked');
      
      // Check if file exists
      if (!fs.existsSync(markdownFilePath)) {
        throw new Error(`Markdown file not found: ${markdownFilePath}`);
      }
      
      // Read markdown file
      const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8');
      
      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent);
      
      // Create a template with proper styling
      const templateContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #ecf0f1;
              padding-bottom: 10px;
            }
            
            h2 {
              color: #3498db;
              margin-top: 20px;
            }
            
            h3 {
              color: #2980b9;
            }
            
            code {
              background-color: #f7f7f7;
              padding: 2px 5px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 0.9em;
            }
            
            pre {
              background-color: #f7f7f7;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
            }
            
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 20px 0;
            }
            
            table, th, td {
              border: 1px solid #ddd;
            }
            
            th, td {
              padding: 12px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
            }
            
            blockquote {
              border-left: 4px solid #ccc;
              margin-left: 0;
              padding-left: 15px;
              color: #666;
            }
            
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;
      
      // Default PDF generation options
      const defaultOptions = {
        title: path.basename(markdownFilePath, '.md'),
        showPageNumbers: true,
        copyright: "© Generated with PDF Generator API",
        customFooter: `Generated on ${new Date().toLocaleDateString()}`,
        format: "A4",
        landscape: false,
        margin: { 
          top: "100px", 
          right: "20px", 
          bottom: "80px", 
          left: "20px" 
        }
      };
      
      // Merge default options with user-provided options
      const pdfOptions = {
        ...defaultOptions,
        ...options,
        templateContent,
        data: {} // No dynamic data needed since we've already processed the markdown
      };
      
      // Get API endpoint from environment variables or use a default
      const apiEndpoint = process.env.PDF_GENERATOR_API || 'https://api.example.com/generate-pdf';
      
      // Generate PDF using the API
      const response = await axios.post(apiEndpoint, pdfOptions);
      
      if (response.status !== 200) {
        throw new Error(`PDF generation failed: ${response.data.message}`);
      }
      
      // Return the URL of the generated PDF
      return response.data.url;
      
    } catch (error) {
      console.error('Error generating PDF from markdown:', error);
      throw error;
    }
  };
  
  module.exports = {
    renderGuideToPdf
  };