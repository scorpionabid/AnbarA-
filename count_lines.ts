import fs from 'fs';
import path from 'path';

function countLines(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      countLines(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      if (lines >= 300) {
        console.log(`${lines} lines: ${fullPath}`);
      }
    }
  }
}

countLines('./src');
