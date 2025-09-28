const fs = require('fs');
const path = require('path');

/**
 * Final fix for name vs name property inconsistencies
 */

function fixFinalNameIssues(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = content;
    let changes = 0;

    // Fix name: to name: in object properties (more specific pattern)
    const beforeNameProp = fixed;
    fixed = fixed.replace(/(\s+)name:\s*([^,\n}]+)/g, '$1name: $2');
    if (beforeNameProp !== fixed) {
      changes++;
      console.log(
        `Fixed name: property declarations in ${path.basename(filePath)}`,
      );
    }

    // Fix { name, config } destructuring to { name, config }
    const beforeNameDestructure = fixed;
    fixed = fixed.replace(/\{\s*name\s*,\s*config\s*\}/g, '{ name, config }');
    if (beforeNameDestructure !== fixed) {
      changes++;
      console.log(
        `Fixed { name, config } destructuring in ${path.basename(filePath)}`,
      );
    }

    // Fix ${name} template literals to ${name}
    const beforeNameTemplate = fixed;
    fixed = fixed.replace(/\$\{name\}/g, '${name}');
    if (beforeNameTemplate !== fixed) {
      changes++;
      console.log(
        `Fixed ${name} template literals in ${path.basename(filePath)}`,
      );
    }

    // Fix testDependencies.push(name) to testDependencies.push(name)
    const beforeNamePush = fixed;
    fixed = fixed.replace(
      /testDependencies\.push\(name\)/g,
      'testDependencies.push(name)',
    );
    if (beforeNamePush !== fixed) {
      changes++;
      console.log(
        `Fixed testDependencies.push(name) in ${path.basename(filePath)}`,
      );
    }

    // Fix step.name to step.name
    const beforeStepName = fixed;
    fixed = fixed.replace(/step\.name/g, 'step.name');
    if (beforeStepName !== fixed) {
      changes++;
      console.log(`Fixed step.name references in ${path.basename(filePath)}`);
    }

    // Fix systemConfig.name to systemConfig.name
    const beforeSystemConfigName = fixed;
    fixed = fixed.replace(/systemConfig\.name/g, 'systemConfig.name');
    if (beforeSystemConfigName !== fixed) {
      changes++;
      console.log(
        `Fixed systemConfig.name references in ${path.basename(filePath)}`,
      );
    }

    // Fix baselineTest.name to baselineTest.name
    const beforeBaselineTestName = fixed;
    fixed = fixed.replace(/baselineTest\.name/g, 'baselineTest.name');
    if (beforeBaselineTestName !== fixed) {
      changes++;
      console.log(
        `Fixed baselineTest.name references in ${path.basename(filePath)}`,
      );
    }

    if (changes > 0) {
      fs.writeFileSync(filePath, fixed);
      console.log(`Fixed ${changes} final name issues in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function findE2ETestFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
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

console.log(`Fixed final name issues in ${fixedCount} E2E test files.`);
