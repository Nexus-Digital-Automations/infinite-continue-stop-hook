#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Comprehensive test file error fixer\n');

// Get all test files with errors
const getLintErrors = () => {
  try {
    execSync('npm run lint 2>&1', { encoding: 'utf8' });
    return [];
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n');
    const errors = {};

    let currentFile = null;
    for (const line of lines) {
      if (line.includes('.test.js')) {
        currentFile = line.trim();
        if (!errors[currentFile]) {
          errors[currentFile] = [];
        }
      } else if (currentFile && line.includes('error')) {
        const match = line.match(/(\d+):(\d+)\s+error\s+(.+)/);
        if (match) {
          errors[currentFile].push({
            line: parseInt(match[1]),
            column: parseInt(match[2]),
            message: match[3]
          });
        }
      }
    }

    return errors;
  }
};

// Fix patterns
const fixFile = (filePath, content) => {
  let modified = content;
  let changesMade = 0;

  // Remove zero-width spaces and other invisible Unicode characters
  const before = modified;
  modified = modified.replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (modified !== before) {
    changesMade++;
    console.log(`  ✓ Removed invisible Unicode characters`);
  }

  // Fix common undefined variable patterns
  const fixes = [
    // Fix 'result' is not defined - add const
    { pattern: /^\s*result = /gm, replacement: '    const result = ' },
    { pattern: /^\s*_result = /gm, replacement: '    const _result = ' },

    // Fix 'error' is not defined in catch blocks
    { pattern: /} catch \(_\) \{[\s\S]*?error\./g, replacement: (match) => match.replace(/error\./g, '_error.') },
    { pattern: /} catch \(_\) \{[\s\S]*?\b(error)\b(?!\.)/g, replacement: (match) => match.replace(/\berror\b/g, '_error') },

    // Fix '_error' is not defined - should be 'error' or '_' in catch
    { pattern: /catch \([^)]*\) \{[\s\S]*?_error\./g, replacement: (match) => {
      if (match.includes('catch (_)')) {
        return match; // Already using underscore, this is ok
      }
      return match.replace(/catch \(([^)]*)\)/, 'catch (error)').replace(/_error\./g, 'error.');
    }},

    // Fix 'FS' is not defined
    { pattern: /\bFS\./g, replacement: 'fs.' },
    { pattern: /\bFS\b(?!\.)/g, replacement: 'fs' },

    // Fix unused variables by prefixing with underscore
    { pattern: /^\s*const (category|result) = .*\/\/ Allowed unused/gm, replacement: (match, varName) => {
      return match.replace(`const ${varName}`, `const _${varName}`);
    }},

    // Fix 'category' is not defined
    { pattern: /\bcategory\b(?=\s*[,;)])/g, replacement: '_category' },

    // Fix '_category' is not defined (should be defined earlier)
    { pattern: /const \{ id, title \} = feature;/g, replacement: 'const { id, title, category: _category } = feature;' },

    // Fix '_filePath' is not defined
    { pattern: /\b_filePath\b/g, replacement: 'filePath' },

    // Fix 'agentId' is not defined in specific contexts
    { pattern: /testAgent\.([a-z]+)\(agentId/g, replacement: 'testAgent.$1(testAgent.agentId' },
  ];

  fixes.forEach(({ pattern, replacement }, _index) => {
    const beforeFix = modified;
    if (typeof replacement === 'function') {
      modified = modified.replace(pattern, replacement);
    } else {
      modified = modified.replace(pattern, replacement);
    }
    if (modified !== beforeFix) {
      changesMade++;
    }
  });

  // Fix parsing error patterns
  // Fix multiple variable declarations on one line (let x.let y.let z)
  modified = modified.replace(/let ([a-zA-Z_$][a-zA-Z0-9_$]*)\.let/g, 'let $1;\n  let');
  modified = modified.replace(/const ([a-zA-Z_$][a-zA-Z0-9_$]*)\.const/g, 'const $1;\n  const');

  // Fix arrow functions with return before arrow
  modified = modified.replace(/\)\s*return\s*\(\)\s*=>/g, ') =>');
  modified = modified.replace(/\(([^)]*)\)\s*return\s*\(\)\s*=>\s*\{/g, '($1) => {');

  // Fix unexpected commas at line start
  modified = modified.replace(/^\s*,\s*/gm, '');

  // Fix semicolons that should be commas in function calls
  modified = modified.replace(/(['"]),([a-zA-Z_$])/g, '$1, $2');
  modified = modified.replace(/\),\s*auditCriteriaContent;/g, '),\n    auditCriteriaContent\n  );');

  // Fix double closing parentheses
  modified = modified.replace(/\);[\s\n]*\);/g, ');');

  // Fix: let x.let y.beforeAll pattern
  modified = modified.replace(/let ([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*)\.(before[A-Z][a-zA-Z]*)/g,
    'let $1;\n  let $2;\n  $3');

  // Fix: const x.const y pattern
  modified = modified.replace(/const ([a-zA-Z_$][a-zA-Z0-9_$]*)\.const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    'const $1;\n  const $2');

  // Fix: function x.const y pattern
  modified = modified.replace(/\}\s*;\s*\}\s*;/g, '}\n  }');

  // Fix: finally: { should be finally {
  modified = modified.replace(/finally:\s*\{/g, 'finally {');

  // Fix: unexpected token path - path in destructuring
  modified = modified.replace(/const\s*{\s*([^}]*)\s*path\s*([^}]*)\s*}\s*=/g, 'const { $1 _path $2 } =');

  return { modified, changesMade };
};

// Main execution
const errors = getLintErrors();
const testFiles = Object.keys(errors).filter(f => f.includes('.test.js'));

console.log(`Found ${testFiles.length} test files with errors\n`);

let totalFixed = 0;
let totalFiles = 0;

testFiles.forEach(filePath => {
  // Extract actual file path
  const match = filePath.match(/\/Users\/[^\s]+\.test\.js/);
  if (!match) return;

  const actualPath = match[0];

  try {
    if (!fs.existsSync(actualPath)) {
      console.log(`⚠️  File not found: ${actualPath}`);
      return;
    }

    const content = fs.readFileSync(actualPath, 'utf8');
    const { modified, changesMade } = fixFile(actualPath, content);

    if (changesMade > 0) {
      fs.writeFileSync(actualPath, modified, 'utf8');
      console.log(`✅ Fixed ${changesMade} issues in ${actualPath.split('/').pop()}`);
      totalFixed += changesMade;
      totalFiles++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${actualPath}:`, error.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${totalFiles}`);
console.log(`   Total fixes: ${totalFixed}`);

// Run lint again to see improvement
console.log(`\n🔍 Checking remaining errors...`);
try {
  execSync('npm run lint 2>&1 | grep "error" | wc -l', { encoding: 'utf8', stdio: 'inherit' });
} catch {
  // Expected to fail if there are errors
}