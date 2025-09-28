/**
 * Comprehensive fix for all unused error and template literal issues
 */

const fs = require('fs');

const fixes = [
  // Fix unused errors - prefix with underscore
  { pattern: /catch \(error\)/g, replacement: 'catch (_error)' },
  { pattern: /catch\(error\)/g, replacement: 'catch(_error)' },
  { pattern: /\}\s*catch\s*\(\s*error\s*\)/g, replacement: '} catch (_error)' },

  // Fix template literal issues
  { pattern: /`([^`]*)\$\{([^}]*)\s*`/g, replacement: '`$1\${$2}`' },
  {
    pattern: /details:\s*`([^`]*)\$\{([^}]*)\s*-/g,
    replacement: 'details: `$1\${$2} -',
  },

  // Fix specific template literal patterns that might be malformed
  {
    pattern:
      /`Linting configuration found \(\$\{config\}\) - assuming linting would pass with proper setup`/g,
    replacement:
      '`Linting configuration found (${config}) - assuming linting would pass with proper setup`',
  },

  // Fix unused variables - prefix with underscore
  { pattern: /\(\s*error\s*,/g, replacement: '(_error,' },
  {
    pattern: /function[^(]*\([^)]*error[^)]*\)/g,
    replacement: (match) => match.replace(/\berror\b/g, '_error'),
  },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
        console.log(`Applied fix: ${fix.pattern}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix the main taskmanager-api.js file
console.log('🚀 Starting comprehensive error and template literal fixes...\n');
const result = fixFile('./taskmanager-api.js');

if (result) {
  console.log('\n✨ Comprehensive fixes completed!');
} else {
  console.log('\n📝 No fixes needed');
}
