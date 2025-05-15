import { Component, OnInit } from '@angular/core';
import { PdfService, PdfOptions, PdfResponse } from './services/pdf.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface AuthInfo {
  loginUuid: string;
  userUuid: string;
  enterpriseUuid: string;
  enterpriseId: string;
  enterpriseCode: string;
  legalEntityUuid: string;
  companyCode: string;
  userCode: string;
  loginFullName: string;
  userFullName: string;
  userMobile: string;
  userRole: string;
  sessionId: string;
  clientIp: string;
  userAgent: string;
  eventEnterpriseId: string;
}

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>Advanced PDF Generator</h1>
      
      <div class="form-container">
        <!-- Tab navigation -->
        <ul class="nav-tabs">
          <li [class.active]="activeTab === 'options'" (click)="activeTab = 'options'">PDF Options & Template</li>
          <li [class.active]="activeTab === 'data'" (click)="activeTab = 'data'">Data</li>
          <li [class.active]="activeTab === 'samples'" (click)="activeTab = 'samples'">Samples</li>
        </ul>
        
        <!-- PDF Options & Template Tab -->
        <div class="tab-content" [class.active]="activeTab === 'options'">
          <div class="options-container">

          <div class="form-group">
                <label for="pdfResponse">Response Format:</label>
                <select id="pdfResponse" class="form-control" [(ngModel)]="pdfOptions.pdfResponse">
                  <option value="base64">Base64</option>
                  <option value="url">URL</option>
                </select>
              </div>  
            <!-- Left side: Template content -->
                <div class="form-group">
                  <label for="authUrl">AUTH URL:</label>
                  <input type="text"  
                    id="authUrl" 
                    class="form-control" 
                    [(ngModel)]="authUrl"
                    placeholder="Auth URL">
                </div>
              <div class="form-group">
                <label for="authToken">AUTH Token:</label>
                <input type="text" 
                  id="authToken" 
                  class="form-control" 
                  [(ngModel)]="authToken"
                  placeholder="Auth Token">
              </div>

                          <!-- Left side: Template content -->
            <div class="template-section">
              <h3>HTML Template</h3>
              <div class="form-group">
                <label for="templateContent">HTML Content:</label>
                <textarea 
                  id="templateContent" 
                  class="form-control" 
                  rows="20" 
                  [(ngModel)]="templateContent"
                  placeholder="Enter HTML content to convert to PDF">
                </textarea>
              </div>

              
            </div>
            
            <!-- Right side: PDF Options -->
            <div class="options-section">
              <h3>PDF Options</h3>
              
           
              <div class="form-row">
                <div class="form-group half">
                  <label for="format">Page Format:</label>
                  <select id="format" class="form-control" [(ngModel)]="pdfOptions.format">
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                
                <div class="form-group half">
                  <label for="landscape">Orientation:</label>
                  <div class="checkbox-container">
                    <input type="checkbox" id="landscape" [(ngModel)]="pdfOptions.landscape">
                    <label for="landscape">Landscape</label>
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <div class="checkbox-container">
                  <input type="checkbox" id="displayHeaderFooter" [(ngModel)]="pdfOptions.displayHeaderFooter">
                  <label for="displayHeaderFooter">Display Header & Footer</label>
                </div>
              </div>
              
              <div class="form-group">
                <div class="checkbox-container">
                  <input type="checkbox" id="printBackground" [(ngModel)]="pdfOptions.printBackground">
                  <label for="printBackground">Print Background</label>
                </div>
              </div>
              
              <div class="form-group">
                <label for="headerTemplate">Header Template (HTML):</label>
                <textarea id="headerTemplate" class="form-control" rows="3" [(ngModel)]="pdfOptions.headerTemplate"></textarea>
              </div>
              
              <div class="form-group">
                <label for="footerTemplate">Footer Template (HTML):</label>
                <textarea id="footerTemplate" class="form-control" rows="3" [(ngModel)]="pdfOptions.footerTemplate"></textarea>
              </div>
              
              <h4>Margins</h4>
              <div class="form-row">
                <div class="form-group quarter">
                  <label for="marginTop">Top:</label>
                  <input id="marginTop" class="form-control" [(ngModel)]="pdfOptions.margin.top">
                </div>
                
                <div class="form-group quarter">
                  <label for="marginRight">Right:</label>
                  <input id="marginRight" class="form-control" [(ngModel)]="pdfOptions.margin.right">
                </div>
                
                <div class="form-group quarter">
                  <label for="marginBottom">Bottom:</label>
                  <input id="marginBottom" class="form-control" [(ngModel)]="pdfOptions.margin.bottom">
                </div>
                
                <div class="form-group quarter">
                  <label for="marginLeft">Left:</label>
                  <input id="marginLeft" class="form-control" [(ngModel)]="pdfOptions.margin.left">
                </div>
              </div>
              
              <div class="form-group">
                <label for="timeout">Timeout (ms):</label>
                <input id="timeout" type="number" class="form-control" [(ngModel)]="pdfOptions.timeout">
              </div>
              
              <div class="form-group">
                <div class="checkbox-container">
                  <input type="checkbox" id="preferCSSPageSize" [(ngModel)]="pdfOptions.preferCSSPageSize">
                  <label for="preferCSSPageSize">Prefer CSS Page Size</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Data Tab -->
        <div class="tab-content" [class.active]="activeTab === 'data'">
          <h3>JSON Data</h3>
          <div class="form-group">
            <label for="jsonData">Data (JSON format):</label>
            <textarea 
              id="jsonData" 
              class="form-control" 
              rows="20" 
              [(ngModel)]="jsonDataText"
              placeholder="Enter JSON data to use in the template"
              (blur)="validateJsonData()">
            </textarea>
            <div *ngIf="jsonError" class="error-message">
              {{ jsonError }}
            </div>
          </div>
        </div>
        
        <!-- Samples Tab -->
        <div class="tab-content" [class.active]="activeTab === 'samples'">
          <h3>Sample Templates</h3>
          <div class="samples-container">
            <div class="sample-card" *ngFor="let sample of sampleTemplates" (click)="loadSample(sample)">
              <h4>{{ sample.name }}</h4>
              <p>{{ sample.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Generate button and status messages -->
      <div class="button-group">
        <button 
          class="btn btn-primary" 
          (click)="generatePdf()" 
          [disabled]="isLoading || jsonError">
          {{ isLoading ? 'Generating...' : 'Generate PDF' }}
        </button>
        
        <button 
          class="btn btn-secondary" 
          (click)="resetForm()" 
          [disabled]="isLoading">
          Reset
        </button>
        
        <button 
          class="btn btn-info" 
          (click)="copyRequestPayload()" 
          [disabled]="isLoading || jsonError">
          Copy Request JSON
        </button>
      </div>
      
      <div *ngIf="isLoading" class="alert alert-info mt-3">
        Generating your PDF... Please wait.
      </div>
      
      <div *ngIf="errorMessage" class="alert alert-danger mt-3">
        {{ errorMessage }}
      </div>
      
      <!-- Authentication Information Section - Always visible if available -->
      <div *ngIf="authInfo" class="auth-info-section mt-3">
        <div class="auth-info-header">
          <h3>Authentication Information</h3>
        </div>
        
        <div class="auth-info-content">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of authInfoItems">
                <td>{{ item.key }}</td>
                <td>{{ item.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- PDF Results Section -->
      <div *ngIf="pdfUrl || base64Pdf" class="result-section mt-3">
        <div class="alert alert-success">
          PDF generated successfully!
        </div>
        
        <!-- PDF Download Section -->
        <div class="pdf-container">
          <div class="pdf-section">
            <h3>PDF Download Options</h3>
            
            <div class="action-buttons mt-3">
              <!-- URL PDF Buttons -->
              <button *ngIf="pdfUrl" (click)="openUrlInNewTab(pdfUrl)" class="btn btn-success">
                View PDF (URL)
              </button>
              <a *ngIf="pdfUrl" [href]="pdfUrl" [download]="getFilename()" class="btn btn-info ml-2">
                Download PDF (URL)
              </a>
              
              <!-- Base64 PDF Buttons -->
              <button *ngIf="base64PdfString" (click)="viewBase64Pdf()" class="btn btn-success ml-2">
                View PDF (Base64)
              </button>
              <button *ngIf="base64PdfString" (click)="downloadBase64Pdf()" class="btn btn-info ml-2">
                Download PDF (Base64)
              </button>
              <button *ngIf="base64PdfString" (click)="copyBase64ToClipboard()" class="btn btn-warning ml-2">
                Copy Base64 String
              </button>
            </div>
            
            <!-- PDF Preview iframe -->
            <div *ngIf="currentPreviewUrl" class="pdf-preview mt-3">
              <iframe [src]="currentPreviewUrl" width="100%" height="500px" frameborder="0"></iframe>
            </div>
          </div>
        </div>
        
        <!-- Base64 String Display -->
        <div *ngIf="base64PdfString" class="base64-section mt-3">
          <div class="base64-header">
            <h3>Base64 PDF String</h3>
            <button (click)="showBase64String = !showBase64String" class="btn btn-sm btn-secondary">
              {{ showBase64String ? 'Hide' : 'Show' }} Base64 String
            </button>
          </div>
          <div *ngIf="showBase64String" class="base64-content">
            <textarea class="form-control" rows="5" readonly>{{base64PdfString}}</textarea>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-container {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
    }
    
    .nav-tabs {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0;
      background-color: #f1f1f1;
      border-bottom: 1px solid #ddd;
    }
    
    .nav-tabs li {
      padding: 10px 20px;
      cursor: pointer;
      border-right: 1px solid #ddd;
    }
    
    .nav-tabs li.active {
      background-color: #fff;
      border-bottom: 2px solid #007bff;
    }
    
    .tab-content {
      padding: 20px;
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .options-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .template-section {
      flex: 1;
      min-width: 400px;
    }
    
    .options-section {
      flex: 1;
      min-width: 400px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .half {
      flex: 1;
      min-width: 200px;
    }
    
    .quarter {
      flex: 1;
      min-width: 100px;
    }
    
    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    
    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .btn {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }
    
    .btn-info {
      background-color: #17a2b8;
      color: white;
    }
    
    .btn-sm {
      padding: 5px 10px;
      font-size: 0.875rem;
    }
    
    .btn-primary:disabled, .btn-secondary:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .alert {
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }
    
    .alert-info {
      background-color: #d1ecf1;
      color: #0c5460;
    }
    
    .alert-success {
      background-color: #d4edda;
      color: #155724;
    }
    
    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .error-message {
      color: #dc3545;
      margin-top: 5px;
      font-size: 0.9em;
    }
    
    .ml-2 {
      margin-left: 10px;
    }
    
    .mt-3 {
      margin-top: 15px;
    }
    
    .pdf-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 20px;
    }
    
    .pdf-section {
      flex: 1;
      min-width: 300px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      background-color: #f9f9f9;
    }
    
    .pdf-section h3 {
      margin-top: 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .pdf-preview {
      margin-top: 15px;
      border: 1px solid #ddd;
      background-color: white;
    }
    
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .base64-section, .auth-info-section {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      background-color: #f9f9f9;
    }
    
    .base64-header, .auth-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .base64-header h3, .auth-info-header h3 {
      margin: 0;
    }
    
    .base64-content, .auth-info-content {
      margin-top: 10px;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th, .table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .table-striped tbody tr:nth-of-type(odd) {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .samples-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .sample-card {
      flex: 1;
      min-width: 250px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      background-color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .sample-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      border-color: #007bff;
    }
    
    .sample-card h4 {
      margin-top: 0;
      color: #007bff;
    }
    
    .sample-card p {
      color: #666;
      font-size: 0.9em;
    }

    @media (max-width: 900px) {
      .options-container {
        flex-direction: column;
      }
      
      .template-section, .options-section {
        min-width: 100%;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .ml-2 {
        margin-left: 0;
        margin-top: 10px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  // Active tab tracking
  activeTab: 'options' | 'data' | 'samples' = 'options';
  
  authUrl: string = "https://services.fundflo.ai/generate-pdf";
  authToken: string = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXIiOjEsImNpZCI6ImVlOGYyMDhiLTEzNWQtNDk0MC1kYmI4LTBkMDMzNWUyMGExZiIsInVjZCI6IjIwMDAwMSIsImxpZCI6IjdlOTRmNjMwLWUwYWYtOTlhNS1jZDA0LWUwODcyZWFjNDM4MyIsImVjbyI6IjEwMDAiLCJzdWJjbyI6IkdSRTE2NzAyIiwic3ViaWQiOiIyIiwibG9naW5pZCI6ImVjYzY0MTg0LWIyOTQtNDRmOC04MGMxLTRkYWQ5ZmVhZmIxNiIsIm5hbWUiOiJTaGFua2FyIEJhbmVyamVlIiwiZ3VfdXVpZCI6bnVsbCwiZF9uYW1lIjoiU2hhbmthciBCYW5lcmplZSIsIm1vYiI6Ijc4Mjk2Mjk3OTQiLCJwcm9kdWN0UHJpY2luZyI6IiIsImJyYW5jaENvZGUiOiIiLCJyZWdpb25Db2RlIjoiIiwiem9uZUNvZGUiOiIiLCJoYXNUY3MiOiIiLCJ0Y3NDb2RlIjoiIiwiZGl2aXNpb25Db2RlIjoiIiwicGF5bWVudFRlcm1Db2RlIjoiIiwic3RhdGVDb2RlIjoiIiwic3RhdGVDdXN0b21Db2RlIjoiIiwicm9sZSI6IlN1cGVyX1VzZXIiLCJzY29wZSI6WyJvcGVuaWQiLCJtb2JpbGUiXSwiaWF0IjoxNzQ3MjgwMjcwLCJleHAiOjE3NDczNjY2NzAsImF1ZCI6Imh0dHBzOi8vc2l5YXJhbS5mdW5kZmxvLmFpIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LWVudGVycHJpc2UtYXBpLmZ1bmRmbG8uYWkiLCJzdWIiOiI1ZGFjODhhNy1jMmNmLWZmYzAtYmM1OS00ZDdhODMwZmM1ZDkiLCJqdGkiOiJkYTE0ZWJlYTliOTExNzJkMjk0NGIzNGM4ZTdkMmY5MTQyOGM5ZDE4In0.YhJAuImn09AGzmA21CLf5ii97aRo9G8ucKmee7JZWRMUEePYW_3N3vSb_EgLVlIbSefOLRINYF6DYtoxjPb9Y6qLQbyHEyRDKdiXAK8RN7LzawGH8jHryWEaUfiOLpxVprnEPgBJ0BB4vIdvUbKuWhVn0m0GyKkRh4CPniWned0pdAlPzyJOKmJmkVZpL8u_wSHaQU0sTbE0eBccvmi7AQ3YRgjHJfrlb6DNqQu_WVD94E2d12o-z41Ng3XAY3DFDDny55XDuejOMjG_TVpKO_hUhnN0vYVWc7eqWP-ZUL2U2H_Uay9qWxT4LV8DRSEFvrDT_bRFbBIHbruAagVoG_eRhYX9dzexkbjEqd4H0vQQtMv-e53210i5eORuXFb8T85i4dgUohEtte6b9mBdQp2y3eVKgMA5eQxvuvfcuUiBzCEQheQCZkBwLgssKvvwMPHblsLk8_XCVpiSvmUgNA0JmqKHqSxfyb5GTfxLlCw8wC1HkBmaMG8k1Ls3pzkjKs8G6dhlFZtsIxWm0GgrSI3mybiUZocBr-V5s_GXbmfGgof8c_9Bo7Q4LGd3XwGVEYhIrS5_teAUjNCFKvSaj3wXpSNJWLXPAQynIjiQ8-uHj3ba2LEZnUXoCI0Oz2Jm0wVcYIunXArbNvdYUksos4lOTITO9EjuvPGH2n6yzMA";
  // Template content
  templateContent: string = "<h1>This is a test PDF generated from HTML content.</h1> <img src='{{thumbnailUrl}}'/>{{#if technicalSpecs.length}}  <div style='margin-top: 20px; text-align: left;'>    <h3>Technical Specifications</h3>    <table style='width: 100%; border-collapse: collapse;'>      {{#each technicalSpecs}}      <tr style='{{#if this.highlight}}background-color: #f5f5f5;{{/if}}'>        <td style='padding: 8px; border: 1px solid #ddd;'>{{this.key}}</td><td style='padding: 8px; border: 1px solid #ddd; '>{{this.value}}</td>      </tr>     {{/each}}{{/if}}";

  // PDF options with default values
  pdfOptions: PdfOptions = {
    pdfResponse: "base64",
    format: "A4",
    landscape: false,
    displayHeaderFooter: true,
    headerTemplate: "<div style='width: 100%; font-size: 10px; padding: 5px 20px; border-bottom: 1px solid #ddd; text-align: center;'><span class=''>Test Header</span></div>",
    footerTemplate: "<div style='width: 100%; font-size: 10px; padding: 5px 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between;'><div style='flex: 1; text-align: left;'><span class='copyright'>@Fundflo Copyright</span></div><div style='flex: 1; text-align: center;'><span class='customFooter'>Test Footer</span></div><div style='flex: 1; text-align: right;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div></div>",
    printBackground: true,
    margin: {
      top: "80px",
      right: "30px",
      bottom: "80px",
      left: "30px"
    },
    timeout: 30000,
    preferCSSPageSize: false
  };
  
  // JSON data
  jsonDataText: string = '';
  jsonData: any = {};
  jsonError: string = '';
  
  // PDF generation status
  isLoading: boolean = false;
  errorMessage: string = '';
  pdfUrl: string | null = null;
  base64Pdf: SafeResourceUrl | null = null;
  base64PdfString: string | null = null;
  sanitizedPdfUrl: SafeResourceUrl | null = null;
  currentPreviewUrl: SafeResourceUrl | null = null;
  filename: string = 'document.pdf';
  
  // Authentication info
  authInfo: AuthInfo | null = null;
  authInfoItems: {key: string, value: string}[] = [];
  
  // UI control
  showBase64String: boolean = false;
  
  // Sample templates
  sampleTemplates = [
    {
      name: 'Product Specification',
      description: 'Template for product specs with technical details',
      template: `<!DOCTYPE html><html><head><title>Product Specification</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px}h1{color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2}.highlight{background-color:#ffffcc}.product-header{display:flex;justify-content:space-between;margin-bottom:20px}.product-title{font-size:24px;font-weight:bold}.product-code{color:#666}.description{margin-bottom:20px;font-style:italic}</style></head><body><div class='product-header'><div><div class='product-title'>{{productInfo.name}}</div><div class='product-code'>Product Code: {{productInfo.code}}</div></div><div>₹{{formatNumber productInfo.price}}/{{productInfo.unit}}</div></div><div class='description'>{{description}}</div><h3>Technical Specifications</h3><table><thead><tr><th>Specification</th><th>Value</th></tr></thead><tbody>{{#each technicalSpecs}}<tr class='{{#if highlight}}highlight{{/if}}'><td>{{key}}</td><td>{{value}}</td></tr>{{/each}}</tbody></table></body></html>`,
      data: {
        thumbnailUrl:"https://fundflo-dev-ar-ap-south-1-files-public.s3.ap-south-1.amazonaws.com/product-catalog/bf2b960b-8547-317c-c9c4-ad47576085c6/SAWPLN/inside_SAWPLN.jpg",
        productInfo: {
          name: "DOL SHAKTI WP",
          code: "SAWPJN",
          category: "",
          price: 3195,
          unit: "unit",
          showReorder: false
        },
        description: "SHAKTI WP STR REALY6.0-9.3A380-415V COIL",
        technicalSpecs: [
          { key: "Phase Type", value: "Three Phase", highlight: true },
          { key: "Manufacturer", value: "BCH Electric Ltd.", highlight: false },
          { key: "Country of Origin", value: "India", highlight: true },
          { key: "Voltage Range", value: "380-415V", highlight: false },
          { key: "Current Range", value: "6.0-9.3A", highlight: true },
          { key: "Warranty", value: "1 Year", highlight: false }
        ]
      }
    },
    {
      name: 'Invoice Template',
      description: 'Standard invoice with line items and totals',
      template: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice</title><style>body{font-family:Arial,sans-serif}
.invoice-header{display:flex;justify-content:space-between;margin-bottom:20px}
.invoice-title{font-size:24px;font-weight:bold}
table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background-color:#f2f2f2}
.total-row{font-weight:bold}</style></head>
<body><div class="invoice-header"><div><div class="invoice-title">INVOICE</div>
<div>Invoice #: {{invoiceNumber}}</div><div>Date: {{formatDate invoiceDate "DD/MM/YYYY"}}</div></div>
<div><h3>{{companyName}}</h3><div>{{companyAddress}}</div><div>{{companyPhone}}</div>
<div>{{companyEmail}}</div></div></div><div class="customer-info"><h3>Billed To:</h3>
<div>{{customerName}}</div><div>{{customerAddress}}</div><div>{{customerEmail}}</div></div>
<table><thead><tr><th>Item</th><th>Description</th><th>Quantity</th><th>Unit Price</th>
<th>Amount</th></tr></thead><tbody>{{#each items}}<tr><td>{{name}}</td><td>{{description}}</td>
<td>{{quantity}}</td><td>{{formatCurrency unitPrice}}</td>
<td>{{formatCurrency (multiply quantity unitPrice)}}</td></tr>{{/each}}</tbody><tfoot>
<tr><td colspan="4" align="right">Subtotal:</td><td>{{formatCurrency subtotal}}</td></tr>
<tr><td colspan="4" align="right">Tax ({{tax}}%):</td><td>{{formatCurrency taxAmount}}</td></tr>
<tr class="total-row"><td colspan="4" align="right">Total:</td><td>{{formatCurrency total}}</td>
</tr></tfoot></table><div class="notes"><h3>Notes:</h3><div>{{notes}}</div></div></body></html>`,
      data: {
        invoiceNumber: "INV-2025-0042",
        invoiceDate: "2025-05-08",
        companyName: "Fundflo Tech Pvt Ltd",
        companyAddress: "Bangalore 76",
        companyPhone: "+12312312312",
        companyEmail: "test@fundflo.ai",
        customerName: "Shankar ",
        customerAddress: "Kolkata",
        customerEmail: "t@t.com",
        items: [
          {
            name: "Web Development",
            description: "E-commerce website development",
            quantity: 1,
            unitPrice: 50000
          },
          {
            name: "SEO Services",
            description: "3-month search engine optimization",
            quantity: 1,
            unitPrice: 15000
          },
          {
            name: "Content Creation",
            description: "10 blog articles",
            quantity: 10,
            unitPrice: 2000
          }
        ],
        subtotal: 85000,
        tax: 18,
        taxAmount: 15300,
        total: 100300,
        notes: "Payment due within 30 days. Bank transfer details will be sent separately."
      }
    }
  ];

  constructor(
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Default sample data
    const sampleData = {
      
      productInfo: {
        name: "DOL SHAKTI WP",
        code: "SAWPJN",
        category: "",
        price: 3195,
        unit: "unit",
        showReorder: false
      },
      description: "SHAKTI WP STR REALY6.0-9.3A380-415V COIL",
      technicalSpecs: [
        {
          key: "Phase Type",
          value: "Three Phase",
          highlight: true
        },
        {
          key: "Manufacturer",
          value: "BCH Electric Ltd.",
          highlight: false
        },
        {
          key: "Country of Origin",
          value: "India",
          highlight: true
        }
      ]
    };
    
    this.jsonDataText = JSON.stringify(sampleData, null, 2);
    this.validateJsonData();
  }

  validateJsonData() {
    try {
      if (this.jsonDataText.trim()) {
        this.jsonData = JSON.parse(this.jsonDataText);
        this.jsonError = '';
      } else {
        this.jsonData = {};
        this.jsonError = '';
      }
    } catch (e) {
      this.jsonError = 'Invalid JSON format. Please check your syntax.';
      console.error('JSON Parse Error:', e);
    }
  }



  generatePdf() {
    // Validate inputs
    if (!this.templateContent) {
      this.errorMessage = 'Please enter some HTML template content';
      return;
    }
    
    this.validateJsonData();
    if (this.jsonError) {
      this.errorMessage = 'Please fix the JSON data errors before generating';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.pdfUrl = null;
    this.base64Pdf = null;
    this.base64PdfString = null;
    this.sanitizedPdfUrl = null;
    this.authInfo = null;
    this.authInfoItems = [];

    const dataWithAuth = {
      ...this.jsonData,
      authUrl: this.authUrl,
      authToken: this.authToken
    };

    this.pdfService.generatePdf(this.templateContent, this.pdfOptions, dataWithAuth)
      .subscribe({
        next: (response: any) => {
          // Process response - could be a JSON object or direct response from API
          console.log('PDF Response:', response);
          
          // Handle filename
          if (response.filename || response.fileName) {
            this.filename = response.filename || response.fileName;
          } else {
            this.filename = `'document'}.pdf`;
          }
          
          // Handle URL PDF
          if (response.pdfUrl) {
            this.pdfUrl = response.pdfUrl;
            this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
            this.currentPreviewUrl = this.sanitizedPdfUrl; // Default to URL preview
          }
          
          // Handle Base64 PDF
          const base64Data = response.base64 || response.base64Data;
          if (base64Data) {
            this.base64PdfString = base64Data;
            
            // Create a data URL for preview
            let base64DataUrl = base64Data;
            if (!base64DataUrl.startsWith('data:application/pdf;base64,')) {
              base64DataUrl = `data:application/pdf;base64,${base64Data}`;
            }
            
            this.base64Pdf = this.sanitizer.bypassSecurityTrustResourceUrl(base64DataUrl);
            
            // If no URL was provided, use base64 for preview
            if (!this.currentPreviewUrl) {
              this.currentPreviewUrl = this.base64Pdf;
            }
          }
          
          // Handle authInfo if present
          if (response.authInfo) {
            this.authInfo = response.authInfo;
            
            // Convert to array for display
            this.authInfoItems = Object.entries(response.authInfo).map(([key, value]) => ({
              key,
              value: value as string
            }));
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error generating PDF:', err);
          this.errorMessage = `Failed to generate PDF: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  resetForm() {
    // Reset to default values
    this.templateContent = "<h1>This is a test PDF generated from HTML content.</h1> <img src='{{thumbnailUrl}}'/>{{#if technicalSpecs.length}}  <div style='margin-top: 20px; text-align: left;'>    <h3>Technical Specifications</h3>    <table style='width: 100%; border-collapse: collapse;'>      {{#each technicalSpecs}}      <tr style='{{#if this.highlight}}background-color: #f5f5f5;{{/if}}'>        <td style='padding: 8px; border: 1px solid #ddd;'>{{this.key}}</td><td style='padding: 8px; border: 1px solid #ddd; '>{{this.value}}</td>      </tr>     {{/each}}{{/if}}";
    
    this.pdfOptions = {
      pdfResponse: "base64",
      format: "A4",
      landscape: false,
      displayHeaderFooter: true,
      headerTemplate: "<div style='width: 100%; font-size: 10px; padding: 5px 20px; border-bottom: 1px solid #ddd; text-align: center;'><span class=''></span></div>",
      footerTemplate: "<div style='width: 100%; font-size: 10px; padding: 5px 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between;'><div style='flex: 1; text-align: left;'><span class='copyright'></span></div><div style='flex: 1; text-align: center;'><span class='customFooter'></span></div><div style='flex: 1; text-align: right;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div></div>",
      printBackground: true,
      margin: {
        top: "80px",
        right: "30px",
        bottom: "80px",
        left: "30px"
      },
      timeout: 30000,
      preferCSSPageSize: false
    };
    
    // Reset sample data
    const sampleData = {
      thumbnailUrl:"https://fundflo-dev-ar-ap-south-1-files-public.s3.ap-south-1.amazonaws.com/product-catalog/bf2b960b-8547-317c-c9c4-ad47576085c6/SAWPLN/inside_SAWPLN.jpg",
      productInfo: {
        name: "DOL SHAKTI WP",
        code: "SAWPJN",
        category: "",
        price: 3195,
        unit: "unit",
        showReorder: false
      },
      description: "SHAKTI WP STR REALY6.0-9.3A380-415V COIL",
      technicalSpecs: [
        {
          key: "Phase Type",
          value: "Three Phase",
          highlight: true
        },
        {
          key: "Manufacturer",
          value: "BCH Electric Ltd.",
          highlight: false
        },
        {
          key: "Country of Origin",
          value: "India",
          highlight: true
        }
      ]
    };
    
    this.jsonDataText = JSON.stringify(sampleData, null, 2);
    this.validateJsonData();
    
    // Reset results
    this.pdfUrl = null;
    this.base64Pdf = null;
    this.base64PdfString = null;
    this.sanitizedPdfUrl = null;
    this.currentPreviewUrl = null;
    this.errorMessage = '';
    this.showBase64String = false;
    this.authInfo = null;
    this.authInfoItems = [];
    
    // Switch to options tab
    this.activeTab = 'options';
  }
  
  /**
   * Load a sample template and data
   */
  loadSample(sample: any) {
    this.templateContent = sample.template;
    this.jsonDataText = JSON.stringify(sample.data, null, 2);
    this.validateJsonData();
    
    // Switch to options tab after loading
    this.activeTab = 'options';
  }
  
  /**
   * Create and copy the full request payload as JSON
   */
  copyRequestPayload() {
    try {
      this.validateJsonData();
      if (this.jsonError) {
        this.errorMessage = 'Please fix the JSON data errors before copying';
        return;
      }
      
      const payload = {
        templateContent: this.templateContent,
        pdfOptions: this.pdfOptions,
        data: this.jsonData
      };
      
      const payloadString = JSON.stringify(payload, null, 2);
      
      // Use navigator.clipboard API if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(payloadString)
          .then(() => {
            alert('Request payload copied to clipboard!');
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
            this.fallbackCopyToClipboard(payloadString);
          });
      } else {
        this.fallbackCopyToClipboard(payloadString);
      }
    } catch (e) {
      console.error('Error preparing payload:', e);
      this.errorMessage = 'Failed to create payload JSON';
    }
  }
  
  /**
   * Get the filename for the PDF
   */
  getFilename(): string {
    return this.filename || `'document'}.pdf`;
  }
  
  /**
   * Open URL in a new tab
   */
  openUrlInNewTab(url: string): void {
    if (!url) return;
    
    window.open(url, '_blank');
  }
  
  /**
   * View Base64 PDF in a new tab
   */
  viewBase64Pdf(): void {
    if (!this.base64PdfString) return;
    
    // Create data URL if needed
    let dataUrl = this.base64PdfString;
    const dataUri = `data:application/pdf;base64,${this.base64PdfString}`;

    if (!dataUrl.startsWith('data:application/pdf;base64,')) {
      dataUrl = `data:application/pdf;base64,${this.base64PdfString}`;
    }
    
    // Open in a new tab
    window.open(dataUrl, '_blank');
  }
  
  /**
   * Download Base64 PDF directly
   */
  downloadBase64Pdf(): void {
    if (!this.base64PdfString) return;
    
    // Use the PDF service to download
    this.pdfService.downloadPdfFromBase64(
      this.base64PdfString, 
      this.getFilename()
    );
  }
  
  /**
   * Copy base64 string to clipboard
   */
  copyBase64ToClipboard(): void {
    if (!this.base64PdfString) return;
    
    // Use newer navigator.clipboard API if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.base64PdfString)
        .then(() => {
          alert('Base64 string copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          this.fallbackCopyToClipboard(this.base64PdfString);
        });
    } else {
      this.fallbackCopyToClipboard(this.base64PdfString);
    }
  }
  
  /**
   * Fallback method for copying to clipboard
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Text copied to clipboard!');
      } else {
        console.warn('Copying failed');
        alert('Failed to copy to clipboard');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textArea);
  }
}