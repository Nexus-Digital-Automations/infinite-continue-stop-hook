/* eslint-disable no-console, security/detect-non-literal-fs-filename */
const fs = require('fs');
const PATH = require('path');

/**
 * Final fix for Name vs Name property inconsistencies
 */

function fixFinalNameIssues(_filePath) {
  try {
    const content = fs.readFileSync(_filePath, 'utf8');
    let fixed = content;
    let changes = 0;

    // Fix Name: to Name: in object properties (more specific pattern)
    const beforeNameProp = fixed;
    fixed = fixed.replace(/(\s+)Name:\s*([^,\n}]+)/g, '$1name: $2');
    if (beforeNameProp !== fixed) {
      changes++;
      console.log(
        `Fixed Name: property declarations in ${PATH.basename(_filePath)}`,
      );
    }

    // Fix { Name, config } destructuring to { Name, config }
    const beforeNameDestructure = fixed;
    fixed = fixed.replace(/\{\s*Name\s*,\s*config\s*\}/g, '{ Name, config }');
    if (beforeNameDestructure !== fixed) {
      changes++;
      console.log(
        `Fixed { Name, config } destructuring in ${PATH.basename(_filePath)}`,
      );
    }

    // Fix ${Name} template literals to ${Name}
    const beforeNameTemplate = fixed;
    fixed = fixed.replace(/\$\{Name\}/g, '${Name}');
    if (beforeNameTemplate !== fixed) {
      changes++;
      console.log(`Fixed template literals in ${PATH.basename(_filePath)}`);
    }

    // Fix testDependencies.push(Name) to testDependencies.push(Name)
    const beforeNamePush = fixed;
    fixed = fixed.replace(
      /testDependencies\.push\(Name\)/g,
      'testDependencies.push(Name)',
    );
    if (beforeNamePush !== fixed) {
      changes++;
      console.log(
        `Fixed testDependencies.push(Name) in ${PATH.basename(_filePath)}`,
      );
    }

    // Fix step.Name to step.Name
    const beforeStepName = fixed;
    fixed = fixed.replace(/step\.Name/g, 'step.Name');
    if (beforeStepName !== fixed) {
      changes++;
      console.log(`Fixed step.Name references in ${PATH.basename(_filePath)}`);
    }

    // Fix systemConfig.Name to systemConfig.Name
    const beforeSystemConfigName = fixed;
    fixed = fixed.replace(/systemConfig\.Name/g, 'systemConfig.Name');
    if (beforeSystemConfigName !== fixed) {
      changes++;
      console.log(
        `Fixed systemConfig.Name references in ${PATH.basename(_filePath)}`,
      );
    }

    // Fix baselineTest.Name to baselineTest.Name
    const beforeBaselineTestName = fixed;
    fixed = fixed.replace(/baselineTest\.Name/g, 'baselineTest.Name');
    if (beforeBaselineTestName !== fixed) {
      changes++;
      console.log(
        `Fixed baselineTest.Name references in ${PATH.basename(_filePath)}`,
      );
    }

    if (changes > 0) {
      fs.writeFileSync(_filePath, fixed);
      console.log(`Fixed ${changes} final Name issues in: ${filePath}`);
      return true;
    }

    return false;
  } catch (_error) {
    console.error(`Error fixing ${filePath}:`, _error.message);
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
  if (fixFinalNameIssues(file)) {
    fixedCount++;
  }
}

console.log(`Fixed final Name issues in ${fixedCount} E2E test files.`);
