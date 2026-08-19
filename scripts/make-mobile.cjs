const fs = require('fs');
const path = require('path');

const roots = [
  path.join(__dirname, '../admin/src/pages'),
  path.join(__dirname, '../admin/src/modules'),
  path.join(__dirname, '../website/src/pages'),
  path.join(__dirname, '../website/src/components'),
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.jsx')) out.push(full);
  }
  return out;
}

function rewriteClass(cls) {
  let c = cls;

  if (!c.includes('grid-cols-1') && !c.includes('sm:grid-cols-2') && /(^|[\s])grid-cols-2([\s]|$)/.test(c)) {
    c = c.replace(/(?<!:)grid-cols-2\b/, 'grid-cols-1 sm:grid-cols-2');
  }

  if (
    /(^|[\s])grid-cols-3([\s]|$)/.test(c) &&
    !c.includes('grid-cols-1') &&
    !c.includes('sm:grid-cols-3') &&
    !c.includes('md:grid-cols-3') &&
    !c.includes('lg:grid-cols-3')
  ) {
    c = c.replace(/(?<!:)grid-cols-3\b/, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
  }

  if (
    /(^|[\s])grid-cols-4([\s]|$)/.test(c) &&
    !c.includes('grid-cols-1') &&
    !c.includes('sm:grid-cols-4') &&
    !c.includes('md:grid-cols-4') &&
    !c.includes('lg:grid-cols-4') &&
    !c.includes('sm:grid-cols-2')
  ) {
    c = c.replace(/(?<!:)grid-cols-4\b/, 'grid-cols-2 lg:grid-cols-4');
  }

  if (c.includes('flex justify-between items-center mb-') && !c.includes('flex-col')) {
    c = c.replace(
      'flex justify-between items-center mb-',
      'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-'
    );
  }

  if (c.includes('fixed inset-0') && c.includes('flex items-center') && !c.includes('overflow-y-auto')) {
    c = c.replace('fixed inset-0', 'fixed inset-0 overflow-y-auto');
  }

  if (
    (c.includes('max-w-md w-full') || c.includes('max-w-lg w-full') || c.includes('max-w-2xl w-full') || c.includes('max-w-3xl w-full')) &&
    !c.includes('max-h-')
  ) {
    c += ' max-h-[min(92dvh,44rem)] overflow-y-auto mx-3 sm:mx-auto';
  }

  return c;
}

function transformFile(content) {
  return content.replace(/className="([^"]*)"/g, (_, cls) => `className="${rewriteClass(cls)}"`);
}

const root = path.join(__dirname, '..');
let changed = 0;
for (const dir of roots) {
  for (const file of walk(dir)) {
    const before = fs.readFileSync(file, 'utf8');
    const after = transformFile(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed += 1;
      console.log(path.relative(root, file));
    }
  }
}
console.log(`Updated ${changed} files`);
