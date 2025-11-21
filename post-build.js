import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy dist/public to server/public for production
const srcDir = path.join(__dirname, 'dist', 'public');
const destDir = path.join(__dirname, 'server', 'public');

if (fs.existsSync(srcDir)) {
  // Create server/public if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy all files
  const copyRecursive = (src, dest) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  
  copyRecursive(srcDir, destDir);
  console.log('✓ Copied dist/public to server/public for production');
} else {
  console.error('✗ dist/public not found');
  process.exit(1);
}
