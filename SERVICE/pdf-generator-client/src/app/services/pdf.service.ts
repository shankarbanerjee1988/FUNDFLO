import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PdfResponse {
  message?: string;
  filename?: string;
  fileName?: string;
  url?: string;
  base64?: string;
  base64Data?: string;
  authInfo?: any;
}

export interface PdfOptions {
  pdfResponse: string; // 'url' or 'base64'
  format: string;
  landscape: boolean;
  displayHeaderFooter: boolean;
  headerTemplate: string;
  footerTemplate: string;
  printBackground: boolean;
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  preferCSSPageSize?: boolean;
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
//   private apiUrl = environment.apiUrl || 'https://api.fundflo.ai/pdf';

  constructor(private http: HttpClient) {}

  /**
   * Generates a PDF from template content, options, and data
   * 
   * @param templateContent The HTML content to convert to PDF
   * @param pdfOptions Formatting options for the PDF
   * @param data Data to be used in the template
   * @returns An Observable with the PDF URL, file name, and base64 data
   */
  generatePdf(templateContent: string, pdfOptions: PdfOptions, data: any): Observable<PdfResponse> {
    
    const apiUrl = data.authUrl+'?output='+pdfOptions.pdfResponse;
    const authToken = data.authToken;

    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    //   'Authorization': 'Bearer ' + this.getAuthToken()
      'Authorization': 'Bearer ' + authToken

    });

    // MODIFIED: Restructure the payload to match what the Lambda expects
    // Move key PDF options to the root level while maintaining the pdfOptions object
    const payload = {
      templateContent: templateContent,
      data: data,      
      pdfOptions: pdfOptions
    };

    // MODIFIED: Handle the response type differently based on pdfResponse
    if (pdfOptions.pdfResponse === 'base64') {
      // For base64 output, we need to handle two different cases:
      // 1. Lambda returns application/pdf with isBase64Encoded: true
      // 2. Lambda returns application/json with a base64 string inside
      
      // Make the request with responseType 'arraybuffer' to handle binary data
      return this.http.post(
        `${apiUrl}`,
        payload,
        { headers, responseType: 'arraybuffer' }
      ).pipe(
        map(response => {
          // Convert ArrayBuffer to Base64 string
          const base64 = this.arrayBufferToBase64(response);
          
          return {
            base64: base64,
            filename: 'document.pdf'
          };
        }),
        catchError(error => {
          console.error('Error generating PDF:', error);
          return throwError(() => new Error('Failed to generate PDF: ' + (error.message || 'Unknown error')));
        })
      );
    } else {
      // For URL output, use the existing method
      return this.http.post<PdfResponse>(
        `${apiUrl}`,
        payload,
        { headers }
      ).pipe(
        map(response => {
          return {
            message: response.message,
            filename: response.filename || response.fileName,
            pdfUrl: response.url,
            authInfo: response.authInfo
          };
        }),
        catchError(error => {
          console.error('Error generating PDF:', error);
          return throwError(() => new Error('Failed to generate PDF: ' + (error.error?.message || error.message || 'Unknown error')));
        })
      );
    }
  }

  /**
   * NEW METHOD: Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Retrieves the auth token from storage or environment
   */
  private getAuthToken(): string {
    // Try to get from localStorage first
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      return storedToken;
    }
    
    // Fallback to the default token
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXIiOjEsImNpZCI6ImVlOGYyMDhiLTEzNWQtNDk0MC1kYmI4LTBkMDMzNWUyMGExZiIsInVjZCI6IjIwMDAwMSIsImxpZCI6IjdlOTRmNjMwLWUwYWYtOTlhNS1jZDA0LWUwODcyZWFjNDM4MyIsImVjbyI6IjEwMDAiLCJzdWJjbyI6IkdSRTE2NzAyIiwic3ViaWQiOiIyIiwibG9naW5pZCI6ImVjYzY0MTg0LWIyOTQtNDRmOC04MGMxLTRkYWQ5ZmVhZmIxNiIsIm5hbWUiOiJTaGFua2FyIEJhbmVyamVlIiwiZ3VfdXVpZCI6bnVsbCwiZF9uYW1lIjoiU2hhbmthciBCYW5lcmplZSIsIm1vYiI6Ijc4Mjk2Mjk3OTQiLCJwcm9kdWN0UHJpY2luZyI6IiIsImJyYW5jaENvZGUiOiIiLCJyZWdpb25Db2RlIjoiIiwiem9uZUNvZGUiOiIiLCJoYXNUY3MiOiIiLCJ0Y3NDb2RlIjoiIiwiZGl2aXNpb25Db2RlIjoiIiwicGF5bWVudFRlcm1Db2RlIjoiIiwic3RhdGVDb2RlIjoiIiwic3RhdGVDdXN0b21Db2RlIjoiIiwicm9sZSI6IlN1cGVyX1VzZXIiLCJzY29wZSI6WyJvcGVuaWQiLCJtb2JpbGUiXSwiaWF0IjoxNzQ3MjgwMjcwLCJleHAiOjE3NDczNjY2NzAsImF1ZCI6Imh0dHBzOi8vc2l5YXJhbS5mdW5kZmxvLmFpIiwiaXNzIjoiaHR0cHM6Ly90ZXN0LWVudGVycHJpc2UtYXBpLmZ1bmRmbG8uYWkiLCJzdWIiOiI1ZGFjODhhNy1jMmNmLWZmYzAtYmM1OS00ZDdhODMwZmM1ZDkiLCJqdGkiOiJkYTE0ZWJlYTliOTExNzJkMjk0NGIzNGM4ZTdkMmY5MTQyOGM5ZDE4In0.YhJAuImn09AGzmA21CLf5ii97aRo9G8ucKmee7JZWRMUEePYW_3N3vSb_EgLVlIbSefOLRINYF6DYtoxjPb9Y6qLQbyHEyRDKdiXAK8RN7LzawGH8jHryWEaUfiOLpxVprnEPgBJ0BB4vIdvUbKuWhVn0m0GyKkRh4CPniWned0pdAlPzyJOKmJmkVZpL8u_wSHaQU0sTbE0eBccvmi7AQ3YRgjHJfrlb6DNqQu_WVD94E2d12o-z41Ng3XAY3DFDDny55XDuejOMjG_TVpKO_hUhnN0vYVWc7eqWP-ZUL2U2H_Uay9qWxT4LV8DRSEFvrDT_bRFbBIHbruAagVoG_eRhYX9dzexkbjEqd4H0vQQtMv-e53210i5eORuXFb8T85i4dgUohEtte6b9mBdQp2y3eVKgMA5eQxvuvfcuUiBzCEQheQCZkBwLgssKvvwMPHblsLk8_XCVpiSvmUgNA0JmqKHqSxfyb5GTfxLlCw8wC1HkBmaMG8k1Ls3pzkjKs8G6dhlFZtsIxWm0GgrSI3mybiUZocBr-V5s_GXbmfGgof8c_9Bo7Q4LGd3XwGVEYhIrS5_teAUjNCFKvSaj3wXpSNJWLXPAQynIjiQ8-uHj3ba2LEZnUXoCI0Oz2Jm0wVcYIunXArbNvdYUksos4lOTITO9EjuvPGH2n6yzMA';
  }

  /**
   * Converts a base64 string to a Blob object
   */
  base64ToBlob(base64: string, contentType: string = 'application/pdf'): Blob {
    // Remove header if present (e.g., "data:application/pdf;base64,")
    const base64Cleaned = base64.replace(/^data:.*;base64,/, '');
    
    try {
      const byteCharacters = atob(base64Cleaned);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      return new Blob(byteArrays, { type: contentType });
    } catch (err) {
      console.error('Error converting base64 to blob:', err);
      return new Blob([], { type: contentType });
    }
  }
  
  /**
   * Create a downloadable PDF from a base64 string
   */
  downloadPdfFromBase64(base64: string, filename: string = 'document.pdf'): void {
    if (!this.isBase64(base64)) {
      console.error('Invalid base64 string');
      return;
    }

    const blob = this.base64ToBlob(base64);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Validates if a string is valid Base64
   */
  isBase64(str: string): boolean {
    if (!str || str === '' || str.trim() === '') return false;
    
    // Remove header if present
    const base64 = str.replace(/^data:.*;base64,/, '');
    
    // Quick format check (should be divisible by 4)
    if (base64.length % 4 !== 0) return false;
    
    // Use regex to check base64 pattern
    const regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return regex.test(base64);
  }
}