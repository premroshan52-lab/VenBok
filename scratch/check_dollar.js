const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) search(p);
    else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((l, idx) => {
        const stripped = l.replace(/\$\{/g, '');
        if (stripped.includes('$')) {
          console.log(path.relative('frontend/src', p) + ':' + (idx+1) + ' -> ' + l.trim().slice(0, 90));
        }
      });
    }
  }
}
search('frontend/src');
