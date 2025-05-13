// Custom script to fix Chromium permissions in Lambda deployment package

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running post-deployment setup for Chromium...');

// This script will be run during deployment to ensure Chromium is properly configured
// Add this script in the package.json's scripts section

// Check for the existence of the chromium binary in node_modules
const chromiumPath = path.join(__dirname, 'node_modules', '@sparticuz', 'chromium', 'bin');

try {
  if (fs.existsSync(chromiumPath)) {
    console.log(`Chromium found at: ${chromiumPath}`);
    
    // Make Chromium executable
    try {
      execSync(`chmod +x ${chromiumPath}`);
      console.log('Successfully set executable permissions on Chromium');
    } catch (chmodError) {
      console.error('Error setting permissions:', chmodError.message);
    }
    
    // Create a symlink in /opt/bin if permissions allow
    try {
      execSync('mkdir -p /opt/bin');
      execSync(`ln -sf ${chromiumPath} /opt/bin/chromium`);
      console.log('Successfully created symlink to /opt/bin/chromium');
    } catch (symlinkError) {
      console.error('Error creating symlink (this is expected during local development):', 
                    symlinkError.message);
      console.log('The symlink will be created in the Lambda environment by the Layer');
    }
  } else {
    console.log('Chromium binary not found in node_modules. Using Lambda Layer instead.');
  }
} catch (error) {
  console.error('Error in post-deployment script:', error);
}