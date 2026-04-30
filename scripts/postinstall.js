const fs = require('fs');
const path = require('path');

function patchUtf8Write(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const source = fs.readFileSync(filePath, 'utf8');
  if (!source.includes('0xffffffff')) {
    return false;
  }
  const updated = source.replace(/utf8Write\(([^,]+),\s*([^,]+),\s*0xffffffff\)/g, 'utf8Write($1, $2)');
  if (updated === source) {
    return false;
  }
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Patched ${filePath}`);
  return true;
}

function main() {
  let msgpackrDir;
  try {
    msgpackrDir = path.dirname(require.resolve('msgpackr/package.json'));
  } catch (error) {
    console.warn('msgpackr not installed; skipping utf8Write patch');
    return;
  }

  const filesToPatch = [
    path.join(msgpackrDir, 'pack.js'),
    path.join(msgpackrDir, 'struct.js'),
    path.join(msgpackrDir, 'dist', 'node.cjs'),
    path.join(msgpackrDir, 'dist', 'index.js'),
  ];

  const patchedFiles = filesToPatch.filter(patchUtf8Write);
  if (!patchedFiles.length) {
    console.log('msgpackr utf8Write patch already applied or not required');
  }
}

main();
