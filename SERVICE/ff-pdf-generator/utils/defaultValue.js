// Default CSS styles for PDF
const defaultStyles = `
<style>
    body { 
        font-family: Arial, sans-serif; 
        padding: 20px;
        line-height: 1.4;
        font-size: 12pt;
    }
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
    }
    th, td { 
        border: 1px solid #ccc; 
        padding: 8px; 
        text-align: left; 
    }
    th { 
        background-color: #f5f5f5; 
        font-weight: bold;
    }
    thead { 
        display: table-header-group; 
        break-inside: avoid; 
    }
    tr { 
        page-break-inside: avoid; 
    }
    h1, h2, h3, h4, h5, h6 { 
        color: #333;
        margin-top: 1em;
        margin-bottom: 0.5em;
    }
    h1 { font-size: 22pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 16pt; }
    h4 { font-size: 14pt; }
    h5 { font-size: 12pt; }
    h6 { font-size: 10pt; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    p { margin: 0 0 1em; }
    ul, ol { margin: 0 0 1em 2em; }
    img { 
        max-width: 100%; 
        height: auto; 
        display: block;
        margin: 10px auto;
        page-break-inside: avoid;
    }
    hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
    @page { margin: 1cm; }
    
    /* Add page break control classes */
    .page-break-before { page-break-before: always; }
    .page-break-after { page-break-after: always; }
    .avoid-break { page-break-inside: avoid; }
    
    /* Image handling improvements */
    img {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        object-fit: contain !important;
    }
    
    /* Fallback for missing images */
    img:not([src]), img[src=""] {
        min-width: 100px;
        min-height: 100px;
        border: 2px dashed #ff0000;
        background-color: #ffeeee;
    }
    
    /* Force image container visibility */
    *:has(> img) {
        overflow: visible !important;
        page-break-inside: avoid !important;
    }
</style>
`;

// Default header template
const defaultHeaderTemplate = `
<div style="width: 100%; font-size: 10px; padding: 5px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
  <div>Generated on: <span class="date"></span></div>
  <div><span class="pageNumber"></span> of <span class="totalPages"></span></div>
</div>
`;

// Default footer template
const defaultFooterTemplate = `
<div style="width: 100%; font-size: 10px; padding: 5px 20px; border-top: 1px solid #ddd; display: flex; justify-content: center;">
  <div>© ${new Date().getFullYear()} - PDF Generator Service</div>
</div>
`;

module.exports = {
  defaultStyles,
  defaultHeaderTemplate,
  defaultFooterTemplate
};