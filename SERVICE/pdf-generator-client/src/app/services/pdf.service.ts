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
  // Allow customization of API URL and token from outside
  private _apiUrl: string = environment.apiUrl || 'https://api.fundflo.ai/pdf';
  private _authToken: string | null = null;

  constructor(private http: HttpClient) {
    // Initialize token from localStorage if available
    this._authToken = localStorage.getItem('auth_token');
  }

  // Getters and setters for API URL and auth token
  get apiUrl(): string {
    return this._apiUrl;
  }

  set apiUrl(url: string) {
    if (url && url.trim() !== '') {
      this._apiUrl = url;
    }
  }

  get authToken(): string | null {
    return this._authToken;
  }

  set authToken(token: string | null) {
    this._authToken = token;
    // Also save to localStorage for persistence
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Generates a PDF from template content, options, and data
   * 
   * @param templateContent The HTML content to convert to PDF
   * @param pdfOptions Formatting options for the PDF
   * @param data Data to be used in the template
   * @returns An Observable with the PDF URL, file name, and base64 data
   */
  generatePdf(templateContent: string, pdfOptions: PdfOptions, data: any): Observable<PdfResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (this._authToken || this.getDefaultAuthToken())
    });

    // Restructure the payload to match what the Lambda expects
    const payload = {
      templateContent: templateContent,
      data: data,      
      pdfOptions: pdfOptions
    };

    // Handle the response type differently based on pdfResponse
    if (pdfOptions.pdfResponse === 'base64') {
      // For base64 output, we need to handle binary data
      return this.http.post(
        `${this._apiUrl}/generate-pdf?output=base64`,
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
        `${this._apiUrl}/generate-pdf?output=url`,
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
   * Convert ArrayBuffer to Base64 string
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
   * Retrieves the default auth token for fallback
   */
  private getDefaultAuthToken(): string {
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXIiOjEsImNpZCI6IjI5ZjE1MDZkLWU4Y2UtNDkwOC04ZjdiLTUzNWVmYWQ0OTIyZiIsInVjZCI6IjMwMzg0NyIsImxpZCI6IjJhNmIyMzU1LWExNDAtMzBlMC0xYWYyLTQ3ZGI3MDFmZDYwNSIsImVjbyI6IjEwMDAiLCJzdWJjbyI6IktBSjMwMjQ1Iiwic3ViaWQiOiI2IiwibG9naW5pZCI6ImUzNzNmMzViLWIzMjEtNDBmOS1hOWUyLTVmODUxN2EwMjFjNSIsIm5hbWUiOiJBdHVsIE5pZ2FtIiwiZ3VfdXVpZCI6bnVsbCwiZF9uYW1lIjoiQXR1bCBOaWdhbSIsIm1vYiI6Ijk4MTA2MDgyMTAiLCJwcm9kdWN0UHJpY2luZyI6IiIsImJyYW5jaENvZGUiOiIiLCJyZWdpb25Db2RlIjoiIiwiem9uZUNvZGUiOiIiLCJoYXNUY3MiOiIiLCJ0Y3NDb2RlIjoiIiwiZGl2aXNpb25Db2RlIjoiIiwicGF5bWVudFRlcm1Db2RlIjoiIiwic3RhdGVDb2RlIjoiIiwic3RhdGVDdXN0b21Db2RlIjoiIiwicm9sZSI6IlNhbGVzX0Nvb3JkaW5hdG9yIiwic2NvcGUiOlsib3BlbmlkIiwibW9iaWxlIl0sImlhdCI6MTc0NzEzNDI0NywiZXhwIjoxNzQ3MjIwNjQ3LCJhdWQiOiJodHRwczovL2FyLmRldi5mdW5kZmxvLmFpIiwiaXNzIjoiaHR0cHM6Ly9hci1hcGlzLWRldi51YXQuZnVuZGZsby5haSIsInN1YiI6IjQ2NjFiNzU4LTQ2MWMtYjY3Zi0zYjRhLTI4MDg1YTI2OWY4ZCIsImp0aSI6ImIyZmUyMmVjMzA1ZTYxNDZjMGE5OGM3MGFlMDg5YTJmYjI2YTAzY2QifQ.EHKftftaCC8k5BGShrn27MQm5Mdlc0z3qaQhq8DK1cLGIAR_g96xjcAz1LqjwG0EC1bghO4CoAzmkQ7SUkTDPGWZh6NOn1O8-pTGj2oBD7daO63wUNqVKJx_kTotqEPDPrcdzbkhTsFv5SwBKgyqSIe39UAIUObMwklmGB4dNXGp-vFNJ3Z5VhyWQYjoxOXOncngCyMnAxmUWkEGw7JQKm4lTL3qR8v_cHdDfDNARBltdN4Dgs9xSz7svqsn9evVDJk50rnm4EsvWy1rjqNo4Qg0bmQpTXQpu8eL-9i86_at4m7TJT4MR9nzPuEk3dVmM4Q3PjBq6PIJcttwZs0RzyVVWeqbWAXBfA_PvSThrz7gumBvIdcWcYgE9xdLKKCQ1Ylp-DrKHAeo7kGb0O3KVOhknpQWJb1Vb3a1dL7ApcDWiUpH7N3L3Pz5o7M2CF4xTJEQHEiPbHajLOihsFBHkAnUktQtb5lsuVPS6NlOJSAANSIhcKPfWJp1dlGzxMSLW97PWM8Jrxpn1an9ByS3VX69jPo3_3AttHEzR_CZzZKOipO2YlPP4jOG0CqEVH4Ra8iqdsVdDf3zad9gkbXH4rj9D8m53BCOcttfk3BvYFMbZnc3IDAHZZmpFqO4mRbe5bfieNTOQ0jIKflxUIooYNFw-qCp3hbL3mnFFGrYkqc';
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