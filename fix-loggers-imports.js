/**
 * Fix Missing Loggers Import Script
 *
 * Adds missing logger imports to files that reference 'loggers' but don't import it
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixLoggersImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let hasChanges = false;

  // Check if file already has loggers import
  if (
    content.includes("require('../../lib/logger')") ||
    content.includes("require('../lib/logger')") ||
    content.includes("require('./lib/logger')") ||
    content.includes("require('./logger')") ||
    content.includes("from '../../lib/logger'") ||
    content.includes("from '../lib/logger'") ||
    content.includes("from './lib/logger'") ||
    content.includes("from './logger'")
  ) {
    // Already has logger import
    return false;
  }

  // Check if file uses loggers
  if (!content.includes('loggers.')) {
    // Doesn't use loggers
    return false;
  }

  // Determine the correct import path based on file location
  const relativePath = path.relative(process.cwd(), filePath);
  let loggerPath;

  if (relativePath.startsWith('test/')) {
    // Test files - usually need ../../lib/logger
    if (
      relativePath.startsWith('test/unit/') ||
      relativePath.startsWith('test/integration/')
    ) {
      loggerPath = "require('../../lib/logger')";
    } else {
      loggerPath = "require('../lib/logger')";
    }
  } else if (relativePath.startsWith('lib/')) {
    // Lib files - usually need ./logger or relative path
    if (relativePath === 'lib/logger.js') {
      // Don't add import to logger.js itself
      return false;
    }

    const depth = (relativePath.match(/\//g) || []).length - 1;
    if (depth === 0) {
      loggerPath = "require('./logger')";
    } else {
      const relativeDots = '../'.repeat(depth);
      loggerPath = `require('${relativeDots}logger')`;
    }
  } else if (relativePath.startsWith('scripts/')) {
    loggerPath = "require('../lib/logger')";
  } else {
    // Root level files
    loggerPath = "require('./lib/logger')";
  }

  // Find where to insert the import
  const lines = content.split('\n');
  let insertIndex = 0;

  // Look for existing require statements
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines at the top
    if (
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line === ''
    ) {
      continue;
    }

    // If this is a require statement, insert after the last one
    if (line.includes('require(') && !line.includes('=')) {
      insertIndex = i + 1;
    } else if (line.includes('require(')) {
      insertIndex = i + 1;
    } else if (insertIndex === 0) {
      // First non-comment, non-empty line - insert here
      insertIndex = i;
      break;
    }
  }

  // Insert the loggers import
  const importLine = `const { loggers } = ${loggerPath};`;

  // Check if we need to add it after other imports or at the beginning
  if (insertIndex > 0 && lines[insertIndex - 1].trim() !== '') {
    lines.splice(insertIndex, 0, '', importLine);
  } else {
    lines.splice(insertIndex, 0, importLine);
  }

  newContent = lines.join('\n');
  hasChanges = true;

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Added loggers import to ${path.relative('.', filePath)}`);
    return true;
  }

  return false;
}

function findFilesWithLoggersIssues() {
  try {
    const result = execSync(
      'npm run lint 2>&1 | grep "\'loggers\' is not defined"',
      {
        encoding: 'utf8',
      }
    );

    const files = new Set();
    const lines = result.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      // Extract file path from ESLint output - try different patterns
      const match = line.match(/^([^:]+):/);
      if (match) {
        files.add(match[1]);
      }
    }

    return Array.from(files);
  } catch (error) {
    // If grep finds no matches, execSync throws an error
    if (error.status === 1) {
      return [];
    }
    console.error('Error finding files with loggers issues:', error.message);
    return [];
  }
}

function getCurrentLoggersErrorCount() {
  try {
    const result = execSync(
      'npm run lint 2>&1 | grep "\'loggers\' is not defined" | wc -l',
      { encoding: 'utf8' }
    );
    return parseInt(result.trim());
  } catch {
    return 0;
  }
}

async function main() {
  console.log('🚀 Fixing loggers import issues...\n');

  const initialErrors = getCurrentLoggersErrorCount();
  console.log(`📊 Initial 'loggers' variable errors: ${initialErrors}\n`);

  const files = findFilesWithLoggersIssues();
  console.log(`📁 Found ${files.length} files with loggers import issues\n`);

  let fixedFiles = 0;

  for (const file of files) {
    if (fs.existsSync(file)) {
      if (fixLoggersImport(file)) {
        fixedFiles++;
      }
    }
  }

  const finalErrors = getCurrentLoggersErrorCount();
  const errorsFixed = initialErrors - finalErrors;

  console.log('\n🎉 Loggers import fix completed!');
  console.log(`📊 Files modified: ${fixedFiles}`);
  console.log(`📊 Loggers import issues fixed: ${errorsFixed}`);
  console.log(`📊 Remaining 'loggers' variable errors: ${finalErrors}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixLoggersImport, findFilesWithLoggersIssues };
