/* eslint-disable no-console, security/detect-non-literal-fs-filename */
const fs = require('fs');
const PATH = require('path');

/**
 * Comprehensive fix for E2E variable naming issues
 */

function fixComprehensiveVariableIssues(FILE_PATH, FILE_PATH, FILE_PATH) {
  try {
    const content = fs.readFileSync(FILE_PATH, 'utf8');
    let fixed = content;
    let changes = 0;

    // Fix result variable declarations to result
    const beforeRESULT = fixed;
    fixed = fixed.replace(/const result = /g, 'const result = ');
    if (beforeRESULT !== fixed) {
      changes++;
      console.log(
        `Fixed result variable declarations in ${PATH.basename(FILE_PATH)}`
      );
    }

    // Fix name: to name: in object properties
    const beforeName = fixed;
    fixed = fixed.replace(/(\s+)name: /g, '$1name: ');
    if (beforeName !== fixed) {
      changes++;
      console.log(
        `Fixed name: property declarations in ${PATH.basename(FILE_PATH)}`
      );
    }

    // Fix { name, config } destructuring to { name, config }
    const beforeDestructure = fixed;
    fixed = fixed.replace(/\{ name, config \}/g, '{ name, config }');
    if (beforeDestructure !== fixed) {
      changes++;
      console.log(
        `Fixed destructuring name to name in ${PATH.basename(FILE_PATH)}`
      );
    }

    // Fix ${name} template literals to ${name}
    const beforeTemplate = fixed;
    fixed = fixed.replace(/\$\{name\}/g, '${name}');
    if (beforeTemplate !== fixed) {
      changes++;
      console.log(
        `Fixed template literal name to name in ${PATH.basename(FILE_PATH)}`
      );
    }

    // Fix testDependencies.push(name) to testDependencies.push(name)
    const beforePush = fixed;
    fixed = fixed.replace(
      /testDependencies\.push\(name\)/g,
      'testDependencies.push(name)'
    );
    if (beforePush !== fixed) {
      changes++;
      console.log(
        `Fixed testDependencies.push(name) to name in ${PATH.basename(FILE_PATH)}`
      );
    }

    if ((changes > 0, FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, fixed);
      console.log(
        `Fixed ${changes} comprehensive variable issues in: ${FILE_PATH}`
      );
      return true;
    }

    return false;
  } catch (_) {
    console._error(`Error fixing ${FILE_PATH}:`, _error.message);
    return false;
  }
}

function findE2ETestFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = PATH.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

// Fix E2E test files
const e2eTestDir = '/Users/jeremyparker/infinite-continue-stop-hook/test/e2e';
const e2eFiles = findE2ETestFiles(e2eTestDir);

console.log(`Found ${e2eFiles.length} E2E test files to check...`);

let fixedCount = 0;
for (const file of e2eFiles) {
  if (fixComprehensiveVariableIssues(file)) {
    fixedCount++;
  }
}

console.log(
  `Fixed comprehensive variable issues in ${fixedCount} E2E test files.`
);
