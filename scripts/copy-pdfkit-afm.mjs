// Copy pdfkit's built-in AFM font metrics into Next's server chunks directory so
// pdfkit can read them via __dirname + '/data/...' when bundled by webpack.
import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve('node_modules/pdfkit/js/data');
const destCandidates = [
  path.resolve('.next/server/chunks/data'),
  path.resolve('.next/server/app/data'),
];

if (!fs.existsSync(srcDir)) {
  console.log('[copy-pdfkit-afm] pdfkit data dir not found at', srcDir, '- skipping');
  process.exit(0);
}

for (const dest of destCandidates) {
  fs.mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const f of fs.readdirSync(srcDir)) {
    if (f.endsWith('.afm')) {
      fs.copyFileSync(path.join(srcDir, f), path.join(dest, f));
      copied++;
    }
  }
  console.log(`[copy-pdfkit-afm] copied ${copied} .afm files to ${dest}`);
}
