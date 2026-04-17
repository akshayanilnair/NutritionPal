const fs = require('fs');
const css = fs.readFileSync('lovable.css', 'utf-8');

// Find :root block
const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
if (rootMatch) {
  console.log("Light Mode Variables:");
  console.log(rootMatch[1].split(';').map(s => s.trim()).filter(s => s.startsWith('--')).join('\n'));
}

const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
if (darkMatch) {
  console.log("\nDark Mode Variables:");
  console.log(darkMatch[1].split(';').map(s => s.trim()).filter(s => s.startsWith('--')).join('\n'));
}
