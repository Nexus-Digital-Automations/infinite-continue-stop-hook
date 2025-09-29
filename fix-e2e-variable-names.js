/* eslint-disable no-console, security/detect-non-literal-fs-filename */
const fs = require('fs');
const PATH = require('path');

/**
 * Fix variable naming issues in E2E test files
 */

function fixVariableNames(_filePath) {
  try {
    const content = fs.readFileSync(_filePath, 'utf8');
    let fixed = content;
    let changes = 0;

    // Fix result. -> result.
    const beforeRESULT = fixed;
    fixed = fixed.replace(/\bRESULT\./g, 'result.');
    if (beforeRESULT !== fixed) {
      changes++;
      console.log(`Fixed result. references in ${PATH.basename(_filePath)}`);
    }

    // Fix _operation -> operation
    const beforeOperation = fixed;
    fixed = fixed.replace(/\b_operation/g, 'operation');
    if (beforeOperation !== fixed) {
      changes++;
      console.log(`Fixed _operation references in ${PATH.basename(_filePath)}`);
    }

    // Fix OPERATION. -> operation.
    const beforeOPERATION = fixed;
    fixed = fixed.replace(/\bOPERATION\./g, 'operation.');
    if (beforeOPERATION !== fixed) {
      changes++;
      console.log(`Fixed OPERATION. references in ${PATH.basename(_filePath)}`);
    }

    // Fix _operationresult -> operation.result
    const beforeOperationResult = fixed;
    fixed = fixed.replace(/\b_operationresult\b/g, 'operation.result');
    if (beforeOperationResult !== fixed) {
      changes++;
      console.log(
        `Fixed _operationresult references in ${PATH.basename(_filePath)}`
      );
    }

    if (changes > 0) {
      fs.writeFileSync(_filePath, fixed);
      console.log(`Fixed ${changes} variable naming issues in: ${filePath}`);
      return true;
    }

    return false;
  } catch (_error) {
    console.error(`Error fixing ${filePath}:`, error.message);
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
  if (fixVariableNames(file)) {
    fixedCount++;
  }
}

console.log(`Fixed variable naming issues in ${fixedCount} E2E test files.`);
