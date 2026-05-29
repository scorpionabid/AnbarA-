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

const files = walk('/src');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /<([A-Z][A-Za-z0-9_]*)/g;
  let match;
  const tagsInFile = new Set();
  while ((match = regex.exec(content)) !== null) {
    tagsInFile.add(match[1]);
  }
  
  for (const tag of tagsInFile) {
    const declarationRegex = new RegExp(`(import.*\\\\b${tag}\\\\b|const\\\\s+${tag}\\\\s*=|function\\\\s+${tag}\\\\b|class\\\\s+${tag}\\\\b)`, 'i');
    if (!declarationRegex.test(content) && !content.includes(`${tag}Props`) && tag !== 'Fragment') {
        const simpleCheck = new RegExp(`\\\\b${tag}\\\\b`, 'g');
        const matches = content.match(simpleCheck);
        const tagUses = (content.match(new RegExp(`<${tag}[\\\\s/>]`, 'g')) || []).length +
                        (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
        if (matches && matches.length === tagUses) {
             console.log(`Potential missing import in ${file}: ${tag}`);
        }
    }
  }
}
