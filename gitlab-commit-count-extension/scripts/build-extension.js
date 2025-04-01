const fs = require('fs');
const path = require('path');

// Copy background.js to dist
fs.copyFileSync(
  path.join(__dirname, '../background/background.js'), 
  path.join(__dirname, '../dist/background.js')
);

// Rename _next folder to assets
const nextDir = path.join(__dirname, '../dist/_next');
const assetsDir = path.join(__dirname, '../dist/assets');

if (fs.existsSync(nextDir)) {
  console.log('Found _next directory, moving contents to assets...');
  
  // Create assets directory if it doesn't exist
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }
  
  // Copy all contents from _next to assets
  fs.cpSync(nextDir, assetsDir, { recursive: true });
  console.log('Copied _next contents to assets directory');
  
  // Update all references in HTML files
  const htmlFiles = ['index.html', 'popup/index.html', '404.html'];
  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, '../dist/', file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/\/_next\//g, '/assets/');
      fs.writeFileSync(filePath, content);
      console.log(`Updated references in ${file}`);
    }
  });
  
  // Remove the _next folder - try multiple methods
  try {
    console.log('Attempting to remove _next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('_next directory removed successfully');
  } catch (error) {
    console.error('Error removing directory with rmSync:', error);
    
    // Try alternative method
    try {
      // For Node.js < 14.14.0
      require('child_process').execSync(
        process.platform === 'win32' 
          ? `rmdir /s /q "${nextDir}"` 
          : `rm -rf "${nextDir}"`
      );
      console.log('_next directory removed using exec command');
    } catch (execError) {
      console.error('Failed to remove _next directory:', execError);
    }
  }
}

console.log('Extension build complete!'); 