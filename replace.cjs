const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace emerald with orange
  content = content.replace(/emerald/g, 'orange');
  
  // Replace specific hex colors used for emerald
  content = content.replace(/#10b981/g, '#f97316'); // emerald-500 -> orange-500
  content = content.replace(/#34d399/g, '#fdba74'); // emerald-400 -> orange-300
  content = content.replace(/#059669/g, '#ea580c'); // emerald-600 -> orange-600

  // Fix BMI normal color to be green instead of orange
  if (filePath.includes('Dashboard.tsx')) {
    content = content.replace(/text-orange-600', bg: 'bg-orange-100' \}; \/\/ Normal/g, "text-green-600', bg: 'bg-green-100' };");
    content = content.replace(/if \(bmi < 24\.9\) return \{ label: 'Normal', color: 'text-orange-600', bg: 'bg-orange-100' \};/g, "if (bmi < 24.9) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };");
  }

  fs.writeFileSync(filePath, content, 'utf8');
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
console.log('Done replacing emerald with orange.');
