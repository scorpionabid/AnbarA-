const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) walk(path.join(dir, file), fileList);
    else if (file.endsWith('.tsx')) fileList.push(path.join(dir, file));
  }
  return fileList;
}

const files = walk('src');
const tags = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /<[A-Z][A-Za-z0-9_]*/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tags.add(match[0].substring(1));
  }
}
console.log(Array.from(tags).sort().join('\n'));
