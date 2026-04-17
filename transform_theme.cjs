const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  [/bg-stone-50/g, 'bg-background/40 backdrop-blur-sm'],
  [/bg-white/g, 'bg-card/80 backdrop-blur-md lovable-gradient-card'],
  [/bg-orange-600/g, 'bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice'],
  [/bg-orange-500/g, 'bg-primary'],
  [/bg-orange-100/g, 'bg-primary/20'],
  [/bg-stone-100/g, 'bg-muted'],
  [/bg-stone-200/g, 'bg-muted-foreground/20'],
  
  // Texts
  [/text-stone-900/g, 'text-foreground font-bold'],
  [/text-stone-800/g, 'text-foreground font-semibold'],
  [/text-stone-700/g, 'text-foreground'],
  [/text-stone-600/g, 'text-muted-foreground'],
  [/text-stone-500/g, 'text-muted-foreground'],
  [/text-stone-400/g, 'text-muted-foreground/70'],
  [/text-orange-900/g, 'text-foreground'],
  [/text-orange-600/g, 'text-primary'],
  [/text-orange-700/g, 'text-primary'],
  
  // Borders
  [/border-stone-100/g, 'border-border/50'],
  [/border-stone-200/g, 'border-border'],
  [/border-orange-100/g, 'border-primary/20'],
  [/border-orange-200/g, 'border-primary/30'],

  // Focus rings
  [/focus:ring-orange-500/g, 'focus:ring-ring'],

  // Gradients
  [/from-orange-400 to-orange-600/g, 'lovable-gradient-spice shadow-spice'],
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
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
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('ErrorBoundary')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done transforming to lovable theme');
