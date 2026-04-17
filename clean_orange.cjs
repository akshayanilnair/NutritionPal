const fs = require('fs');
const path = require('path');

const replacements = [
  // Orange replacements missed
  [/hover:bg-orange-[789]00/g, 'hover:scale-[1.02] transition-transform text-white'],
  [/hover:bg-orange-200/g, 'hover:bg-primary/30'],
  [/bg-orange-50/g, 'bg-primary/10'],
  [/border-orange-500/g, 'border-primary'],
  [/text-orange-500/g, 'text-primary'],
  [/text-orange-800/g, 'text-primary-foreground text-opacity-80'],
  [/shadow-orange-500\/30/g, 'shadow-spice'],
  [/shadow-orange-500\/20/g, 'shadow-spice'],
  
  // Clean up inline gradient duplicates generated from my previous replace
  ['bg-gradient-to-br lovable-gradient-spice shadow-spice', 'lovable-gradient-spice shadow-spice'],
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [regex, replacement] of replacements) {
    if (typeof regex === 'string') {
      content = content.split(regex).join(replacement);
    } else {
      content = content.replace(regex, replacement);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Cleaned up remaining orange classes');
