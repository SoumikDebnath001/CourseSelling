const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { regex: /brand-/g, replacement: 'teal-' },
  { regex: /ball-/g, replacement: 'rose-gold-' },
  { regex: /grape-/g, replacement: 'amber-' },
  { regex: /sun-/g, replacement: 'amber-' }
];

let filesModified = 0;

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    for (let r of replacements) {
      newContent = newContent.replace(r.regex, r.replacement);
    }
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      filesModified++;
      console.log(`Modified: ${filePath}`);
    }
  }
});

console.log(`Successfully modified ${filesModified} files.`);
