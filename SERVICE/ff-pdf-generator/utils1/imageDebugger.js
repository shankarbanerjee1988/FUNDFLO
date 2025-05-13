// utils/imageDebugger.js

/**
 * Utility functions for debugging image issues in the PDF generator
 */

/**
 * Logs all image URLs found in a template
 * @param {string} templateContent - The HTML template content
 * @returns {number} - Number of images found
 */
function logTemplateImageUrls(templateContent) {
    console.log('Checking for image URLs in the template');
    
    // Simple regex to find img tags and their src attributes
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    let imgCount = 0;
    
    while ((match = imgRegex.exec(templateContent)) !== null) {
      imgCount++;
      const src = match[1];
      
      // Check if the image is base64 encoded
      if (src.startsWith('data:')) {
        console.log(`Image ${imgCount}: [Base64 encoded image, length: ${src.length} chars]`);
      } else {
        console.log(`Image ${imgCount}: ${src.substring(0, 100)}${src.length > 100 ? '...' : ''}`);
      }
      
      // Identify potential issues
      if (src.includes(' ') && !src.startsWith('data:')) {
        console.warn(`  ⚠️ Warning: Image ${imgCount} URL contains spaces, which may cause issues`);
      }
      
      if (!src.startsWith('http') && !src.startsWith('https') && !src.startsWith('data:') && !src.startsWith('/')) {
        console.warn(`  ⚠️ Warning: Image ${imgCount} URL is relative and may not resolve correctly`);
      }
    }
    
    console.log(`Total images found in template: ${imgCount}`);
    return imgCount;
  }
  
  /**
   * Modifies HTML to make images more likely to render in PDF
   * @param {string} html - The HTML content
   * @returns {string} - Enhanced HTML
   */
  function enhanceImagesForPdf(html) {
    console.log('Enhancing HTML for better image rendering in PDF');
    
    // Add extra styles for images
    const styleTag = `
      <style>
        /* Enhanced image styling for PDF rendering */
        img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 10px auto !important;
          page-break-inside: avoid !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Force image container visibility */
        *:has(> img) {
          overflow: visible !important;
          page-break-inside: avoid !important;
        }
        
        /* Add background to show missing images */
        img:not([src]), img[src=""] {
          min-width: 100px;
          min-height: 100px;
          border: 2px dashed #ff0000;
          background-color: #ffeeee;
        }
      </style>
    `;
    
    // Insert style tag before </head>
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}</head>`);
    } else {
      // If no head tag, add it at the beginning
      html = `<head>${styleTag}</head>${html}`;
    }
    
    // Add content security policy meta tag to allow images
    const cspTag = `<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: blob: 'unsafe-inline';">`;
    
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n  ${cspTag}`);
    }
    
    // Add script for image fallbacks
    const scriptTag = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Add error handler to all images
          const images = document.querySelectorAll('img');
          images.forEach(function(img, index) {
            // Set crossOrigin attribute
            if (!img.src.startsWith('data:')) {
              img.crossOrigin = 'anonymous';
            }
            
            // Handle errors
            img.onerror = function() {
              console.error('Failed to load image: ' + img.src);
              img.style.border = '2px dashed #ff0000';
              img.style.minWidth = '100px';
              img.style.minHeight = '100px';
              img.style.backgroundColor = '#ffeeee';
              img.alt = 'Image failed to load: ' + img.src;
            };
          });
        });
      </script>
    `;
    
    // Add the script before </body>
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      // If no body end tag, add it at the end
      html = `${html}\n${scriptTag}`;
    }
    
    return html;
  }
  
  /**
   * Fix problematic URLs in image src attributes
   * @param {string} html - The HTML content 
   * @returns {string} - HTML with fixed image URLs
   */
  function fixImageUrls(html) {
    console.log('Fixing problematic image URLs');
    
    // Handle spaces in URLs
    html = html.replace(/(<img[^>]+src=["'])([^"']+)(['"'][^>]*>)/g, (match, prefix, url, suffix) => {
      // Only fix http/https URLs, not data URLs
      if (url.startsWith('http') && url.includes(' ')) {
        const fixedUrl = url.replace(/ /g, '%20');
        console.log(`Fixed URL with spaces: ${url.substring(0, 50)}... → ${fixedUrl.substring(0, 50)}...`);
        return `${prefix}${fixedUrl}${suffix}`;
      }
      return match;
    });
    
    // Add protocol to protocol-relative URLs
    html = html.replace(/(<img[^>]+src=["'])\/\/([^"']+)(['"'][^>]*>)/g, (match, prefix, url, suffix) => {
      console.log(`Fixed protocol-relative URL: //${url}`);
      return `${prefix}https://${url}${suffix}`;
    });
    
    // Fix relative URLs (if a base URL is known - placeholder example)
    // This would need customization for your specific environment
    const baseUrl = process.env.BASE_URL || '';
    if (baseUrl) {
      html = html.replace(/(<img[^>]+src=["'])(?!http|https|data:|\/\/)([^"'\/][^"']+)(['"'][^>]*>)/g, 
        (match, prefix, url, suffix) => {
          console.log(`Fixed relative URL: ${url} → ${baseUrl}/${url}`);
          return `${prefix}${baseUrl}/${url}${suffix}`;
        });
    }
    
    return html;
  }
  
  /**
   * Get detailed diagnostics for image loading issues
   * @param {Object} page - Puppeteer page object
   * @returns {Promise<Array>} - Array of image diagnostics
   */
  async function getImageDiagnostics(page) {
    return page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).map((img, index) => {
        const rect = img.getBoundingClientRect();
        const styles = window.getComputedStyle(img);
        
        return {
          index,
          src: img.src.substring(0, 100) + (img.src.length > 100 ? '...' : ''),
          alt: img.alt,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: rect.width,
          displayHeight: rect.height,
          visible: rect.width > 0 && rect.height > 0,
          display: styles.display,
          visibility: styles.visibility,
          position: styles.position,
          zIndex: styles.zIndex,
          opacity: styles.opacity,
          overflow: styles.overflow,
          crossOrigin: img.crossOrigin
        };
      });
    });
  }

  function ensureCompatibleImageFormats(html) {
    console.log('Ensuring image format compatibility');
    
    // Function to determine if an image URL is likely to be of a specific format
    function getImageFormat(url) {
      if (!url) return null;
      
      // Handle data URLs
      if (url.startsWith('data:image/')) {
        const format = url.substring(11, url.indexOf(';'));
        return format;
      }
      
      // Handle file URLs with extensions
      const lowercasedUrl = url.toLowerCase();
      const extensions = {
        'png': 'png',
        'jpg': 'jpeg',
        'jpeg': 'jpeg',
        'gif': 'gif',
        'webp': 'webp',
        'svg': 'svg+xml',
        'avif': 'avif',
        'bmp': 'bmp',
        'ico': 'x-icon',
        'tiff': 'tiff'
      };
      
      for (const [ext, mime] of Object.entries(extensions)) {
        if (lowercasedUrl.endsWith(`.${ext}`)) {
          return mime;
        }
      }
      
      return null;
    }
    
    // Replace WebP and AVIF with a pre-rendering notification
    html = html.replace(/(<img[^>]+src=["'])([^"']+)(['"'][^>]*>)/g, (match, prefix, url, suffix) => {
      const format = getImageFormat(url);
      
      // Add format-specific attributes for better rendering
      if (format) {
        let updatedSuffix = suffix;
        
        // If it doesn't already have an alt attribute, add one
        if (!updatedSuffix.includes(' alt=')) {
          updatedSuffix = updatedSuffix.replace('>', ` alt="Image" >`);
        }
        
        // Add format as a data attribute for debugging
        updatedSuffix = updatedSuffix.replace('>', ` data-image-format="${format}" >`);
        
        // Handle SVG specially
        if (format === 'svg+xml') {
          // Add special handling for SVGs
          updatedSuffix = updatedSuffix.replace('>', ` style="max-width: 100%; height: auto;" >`);
        }
        
        // For potentially problematic formats, add warning
        if (['webp', 'avif'].includes(format)) {
          console.warn(`Warning: Image in ${format} format may not render correctly in PDF: ${url}`);
        }
        
        return `${prefix}${url}${updatedSuffix}`;
      }
      
      return match;
    });
    
    return html;
  }
  
  /**
   * Extracts SVG content from <img> tags pointing to SVG images
   * for better PDF rendering
   * @param {Object} page - Puppeteer page object
   */
  async function handleSvgImages(page) {
    // Find all SVG images
    const svgImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src$=".svg"], img[data-image-format="svg+xml"]'))
        .map((img, index) => {
          const rect = img.getBoundingClientRect();
          return {
            index,
            src: img.src,
            width: img.width || rect.width,
            height: img.height || rect.height,
            id: img.id || `svg-img-${index}`
          };
        });
    });
    
    console.log(`Found ${svgImages.length} SVG images`);
    
    // Process each SVG image
    for (const svgImage of svgImages) {
      try {
        // Fetch SVG content
        const response = await page.goto(svgImage.src, { waitUntil: 'networkidle0', timeout: 5000 });
        const svgContent = await response.text();
        
        // Replace the image with inline SVG
        await page.evaluate((data) => {
          const img = document.querySelector(`img[src="${data.src}"]`);
          if (img) {
            // Create a div to hold the SVG
            const container = document.createElement('div');
            container.id = data.id + '-container';
            container.style.width = data.width + 'px';
            container.style.height = data.height + 'px';
            container.style.display = 'inline-block';
            container.innerHTML = data.svgContent;
            
            // Replace the image with the SVG container
            img.parentNode.replaceChild(container, img);
            
            console.log(`Replaced SVG image #${data.index} with inline SVG`);
          }
        }, {
          src: svgImage.src,
          svgContent,
          width: svgImage.width,
          height: svgImage.height,
          id: svgImage.id,
          index: svgImage.index
        });
        
        // Navigate back to the original page
        await page.goBack();
      } catch (error) {
        console.error(`Error processing SVG image #${svgImage.index}:`, error.message);
      }
    }
  }
  
  module.exports = {
    logTemplateImageUrls,
    enhanceImagesForPdf,
    fixImageUrls,
    getImageDiagnostics
  };