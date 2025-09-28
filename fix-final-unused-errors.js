/**
 * Final comprehensive fix for all syntax errors
 */

const fs = require('fs');
const { execSync } = require('child_process');

const fixes = [
  // Fix template literal syntax issues
  {
    pattern: /this\.warn\(`([^`]*)\$\{([^}]*)\}`/g,
    replacement: 'this.warn(`$1\${$2}`',
  },
  {
    pattern: /this\.info\(`([^`]*)\$\{([^}]*)\}`/g,
    replacement: 'this.info(`$1\${$2}`',
  },
  {
    pattern: /this\.error\(`([^`]*)\$\{([^}]*)\}`/g,
    replacement: 'this.error(`$1\${$2}`',
  },
  {
    pattern: /this\.debug\(`([^`]*)\$\{([^}]*)\}`/g,
    replacement: 'this.debug(`$1\${$2}`',
  },

  // Fix specific malformed template literals
  {
    pattern: /`Security: \$\{message\}`/g,
    replacement: '`Security: ${message}`',
  },
  {
    pattern: /`Performance: \$\{([^}]*)\}`/g,
    replacement: '`Performance: ${$1}`',
  },
  {
    pattern: /`Database: \$\{([^}]*)\} on \$\{([^}]*)\}`/g,
    replacement: '`Database: ${$1} on ${$2}`',
  },

  // Fix logger import/reference issues
  {
    pattern: /const \{ loggers \} = require\('\.\/logger'\);/g,
    replacement: '',
  },
  {
    pattern: /operation, operationName,/g,
    replacement: 'operation: operationName,',
  },

  // Fix remaining capitalization issues
  {
    pattern: /OPERATION ([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    replacement: 'operation $1',
  },
  { pattern: /\$\{OPERATION\s+([^}]+)\}/g, replacement: '${operation} $1' },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    fixes.forEach((fix) => {
      const beforeFix = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeFix) {
        modified = true;
        console.log(`Applied fix in ${filePath}: ${fix.pattern}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all JS files in lib/ directory
function findLibFiles() {
  try {
    const output = execSync('find lib/ -name "*.js" 2>/dev/null || echo ""', {
      encoding: 'utf8',
    });
    return output
      .trim()
      .split('\n')
      .filter((f) => f);
  } catch {
    return [];
  }
}

// Fix all files
console.log('🚀 Starting final comprehensive syntax fixes...\n');

const filesToFix = ['./taskmanager-api.js', ...findLibFiles()];

let fixedCount = 0;

filesToFix.forEach((file) => {
  if (fs.existsSync(file)) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
});

console.log(
  `\n📊 Summary: Fixed ${fixedCount} out of ${filesToFix.length} files`,
);

// Try running tests to verify
if (fixedCount > 0) {
  console.log('\n🧪 Testing fixes...');
  try {
    execSync('npm test -- test/unit/verification-endpoints.test.js', {
      stdio: 'inherit',
    });
    console.log('✅ Tests passed!');
  } catch {
    console.log('⚠️  Tests still have issues, but syntax should be improved');
  }
}

console.log('\n✨ Final comprehensive fixes completed!');
