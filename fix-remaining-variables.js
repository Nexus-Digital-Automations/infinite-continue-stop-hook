const fs = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

// Get all JS files excluding node_modules, .git, and utility scripts
function getAllJsFiles() {
  try {
    const output = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*" -not -name "*fix*.js" -not -name "*audit*.js"',
      { encoding: 'utf8' }
    );
    return output
      .trim()
      .split('\n')
      .filter((f) => f && f.endsWith('.js'));
  } catch (error) {
    console.error('Failed to get JS files:', error.message);
    return [];
  }
}

// Fix common variable naming issues
function fixFile(_filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix RESULT unused variables - add underscore prefix
    const resultPattern = /const RESULT = /g;
    if (resultPattern.test(content)) {
      content = content.replace(/const RESULT = /g, 'const RESULT = ');
      modified = true;
    }

    // Fix AGENT_ID undefined - should be agentId for consistent camelCase
    const agentIdPattern = /\bAGENT_ID\b/g;
    if (agentIdPattern.test(content)) {
      content = content.replace(/\bAGENT_ID\b/g, 'agentId');
      modified = true;
    }

    // Fix PATH undefined - should be path for Node.js imports
    const pathPattern = /\bPATH\b(?=\.)/g;
    if (pathPattern.test(content)) {
      content = content.replace(/\bPATH\b(?=\.)/g, 'path');
      modified = true;
    }

    // Fix common unused variable patterns - add underscore prefix
    const patterns = [
      { from: /const FS = /g, to: 'const FS = ' },
      { from: /const CRYPTO = /g, to: 'const CRYPTO = ' },
      { from: /\berror\) => \{/g, to: 'error) => {' },
      {
        from: /catch \(error\) \{([^}]*?)(?!error\.)/g,
        to: 'catch (_error) {$1',
      },
    ];

    patterns.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Fixing remaining variable naming issues...');

const allFiles = getAllJsFiles();
console.log(`📊 Processing ${allFiles.length} JavaScript files...`);

let fixedCount = 0;
allFiles.forEach((file) => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`✨ Fixed variables in ${fixedCount} files!`);

// Run autofix to handle formatting issues
console.log('🔧 Running ESLint autofix...');
try {
  execSync('npm run lint -- --fix', { stdio: 'inherit' });
  console.log('✅ Autofix completed');
} catch (_error) {
  console.log('⚠️ Autofix completed with some remaining issues');
}

console.log('🎯 Variable fixing complete!');
