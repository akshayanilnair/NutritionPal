const fs = require('fs');
const css = fs.readFileSync('lovable.css', 'utf-8');

const matches = css.match(/font-family:([^;}]+)/g);
if (matches) {
  console.log(Array.from(new Set(matches)));
}
