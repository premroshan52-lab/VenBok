const fs = require('fs');
const path = require('path');

const keywords = [
  '₹',
  'checkout',
  'invoice',
  'billing',
  'booking fee',
  'rental fee',
  'payment',
  'price',
  'amount',
  'cost per hour',
  'hourlyrate',
  'dailyrate',
  'totalamount',
  'paymentstatus',
  'paid',
  'unpaid'
];

function searchDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, results);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        for (const kw of keywords) {
          if (lower.includes(kw)) {
            results.push({
              file: fullPath,
              line: idx + 1,
              keyword: kw,
              snippet: line.trim()
            });
            break;
          }
        }
      });
    }
  }
  return results;
}

const frontendMatches = searchDir(path.resolve(__dirname, '../frontend/src'));
const backendMatches = searchDir(path.resolve(__dirname, '../backend/src'));

console.log('=== FRONTEND MATCHES === (' + frontendMatches.length + ')');
frontendMatches.forEach(m => {
  const rel = path.relative(path.resolve(__dirname, '..'), m.file);
  console.log(`${rel}:${m.line} [${m.keyword}] -> ${m.snippet.slice(0, 100)}`);
});

console.log('\n=== BACKEND MATCHES === (' + backendMatches.length + ')');
backendMatches.forEach(m => {
  const rel = path.relative(path.resolve(__dirname, '..'), m.file);
  console.log(`${rel}:${m.line} [${m.keyword}] -> ${m.snippet.slice(0, 100)}`);
});
