
const fs = require('fs');

const testFile = '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-e2e.test.js';

console.log('Fixing undefined variables in success-criteria-e2e.test.js...');

let content = fs.readFileSync(testFile, 'utf8');

// Fix common patterns
const fixes = [
  // Remove underscore prefixes for variables that shouldn't have them
  { from: /const _(\w+Result) = /g, to: 'const $1 = ' },
  { from: /const _(\w+Results) = /g, to: 'const $1 = ' },
  { from: /const _(task|agent|validation|integration|performance|security|template|criteria)(\w*) = /g, to: 'const $1$2 = ' },

  // Fix variable references (remove underscores where variables are used)
  { from: /(\w+)\.(\w+) = (\w+)Result\./g, to: '$1.$2 = $3Result.' },
  { from: /expect\(_(\w+)\)/g, to: 'expect($1)' },
  { from: /(\w+)\.find\(\(t\) => t\.id === _(\w+)\)/g, to: '$1.find((t) => t.id === $2)' },
  { from: /(\w+)\.find\(\(t\) => t\.id === (\w+)\)/g, to: '$1.find((t) => t.id === $2)' },
];

// Apply fixes
fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

// Write back
fs.writeFileSync(testFile, content, 'utf8');

console.log('Fixed undefined variables in success-criteria-e2e.test.js');
