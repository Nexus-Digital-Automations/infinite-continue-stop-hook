/**
 * Script to fix undefined variable violations across all test files
 *
 * This script addresses common patterns where variables are declared with underscores
 * but referenced without underscores, causing undefined variable errors in test files.
 */

const fs = require('fs');
const path = require('path');

// Security helper for safe file operations
function validateAndResolvePath(filePath, baseDir = process.cwd()) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('File path must be a non-empty string');
  }

  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);

  // Ensure path is within project directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('File path must be within project directory');
  }

  return resolvedPath;
}
const { execSync } = require('child_process');

const TEST_DIR = '/Users/jeremyparker/infinite-continue-stop-hook/test';

function findTestFiles() {
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log('Finding test files...');
  try {
    const output = execSync(`find ${TEST_DIR} -name "*.test.js" -not -path "*/node_modules/*"`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    // eslint-disable-next-line no-console -- Legitimate script output for debugging
    console.error('Error finding test files:', error.message);
    return [];
  }
}

function fixTestFile(filePath) {
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log(`\nProcessing: ${filePath}`);

  try {
    // Security: Validate file path before reading
    const validatedPath = validateAndResolvePath(filePath);
    let content = fs.readFileSync(validatedPath, 'utf8');
    let changeCount = 0;

    // Common variable patterns to fix (similar to previous script but more comprehensive)
    const variableFixes = [
      // Function parameters
      { from: /function execAPI\(_command,/g, to: 'function execAPI(command,' },
      { from: /function.*\(_([a-zA-Z][a-zA-Z0-9_]*),/g, to: (match, p1) => match.replace(`_${p1}`, p1) },

      // Variable declarations
      { from: /const _result = /g, to: 'const result = ' },
      { from: /const _taskData = /g, to: 'const taskData = ' },
      { from: /const _initResult = /g, to: 'const initResult = ' },
      { from: /const _createResult = /g, to: 'const createResult = ' },
      { from: /const _listResult = /g, to: 'const listResult = ' },
      { from: /const _claimResult = /g, to: 'const claimResult = ' },
      { from: /const _completeResult = /g, to: 'const completeResult = ' },
      { from: /const _statusResult = /g, to: 'const statusResult = ' },
      { from: /const _currentResult = /g, to: 'const currentResult = ' },
      { from: /const _featureData = /g, to: 'const featureData = ' },
      { from: /const _suggestResult = /g, to: 'const suggestResult = ' },
      { from: /const _approvedResult = /g, to: 'const approvedResult = ' },
      { from: /const _agent1Result = /g, to: 'const agent1Result = ' },
      { from: /const _agent2Result = /g, to: 'const agent2Result = ' },
      { from: /const _secondInitResult = /g, to: 'const secondInitResult = ' },
      { from: /const _secondAgentId = /g, to: 'const secondAgentId = ' },
      { from: /const _depTaskData = /g, to: 'const depTaskData = ' },
      { from: /const _depResult = /g, to: 'const depResult = ' },
      { from: /const _depTaskId = /g, to: 'const depTaskId = ' },
      { from: /const _mainTaskId = /g, to: 'const mainTaskId = ' },
      { from: /const _completionData = /g, to: 'const completionData = ' },
      { from: /const _featureTaskData = /g, to: 'const featureTaskData = ' },
      { from: /const _featureTaskId = /g, to: 'const featureTaskId = ' },
      { from: /const _tasks = /g, to: 'const tasks = ' },
      { from: /const _taskTypes = /g, to: 'const taskTypes = ' },
      { from: /const _createResults = /g, to: 'const createResults = ' },
      { from: /const _lastTask = /g, to: 'const lastTask = ' },
      { from: /const _deletedTask = /g, to: 'const deletedTask = ' },
      { from: /const _fakeTaskId = /g, to: 'const fakeTaskId = ' },
      { from: /const _stats = /g, to: 'const stats = ' },
      { from: /const _features = /g, to: 'const features = ' },
      { from: /const _reason = /g, to: 'const reason = ' },
      { from: /const _config = /g, to: 'const config = ' },
      { from: /const _updateConfig = /g, to: 'const updateConfig = ' },
      { from: /const _jsonStart = /g, to: 'const jsonStart = ' },
      { from: /const _stderrJson = /g, to: 'const stderrJson = ' },

      // Let declarations
      { from: /let _result = /g, to: 'let result = ' },
      { from: /let _taskData = /g, to: 'let taskData = ' },
      { from: /let _error = /g, to: 'let error = ' },

      // Catch blocks missing error parameter
      { from: /} catch \{\s*expect\(error/g, to: '} catch (error) {\n        expect(error' },
      { from: /} catch \{\s*console/g, to: '} catch (error) {\n        console' },
    ];

    // Apply variable declaration fixes
    variableFixes.forEach(fix => {
      if (typeof fix.to === 'string') {
        const matches = content.match(fix.from);
        if (matches) {
          content = content.replace(fix.from, fix.to);
          changeCount += matches.length;
          // eslint-disable-next-line no-console -- Legitimate script output for debugging
          console.log(`  Fixed ${matches.length} instances of ${fix.from.toString()}`);
        }
      } else {
        // Handle function replacement
        content = content.replace(fix.from, fix.to);
      }
    });

    if (changeCount > 0) {
      // Security: Use already validated path for writing
      fs.writeFileSync(validatedPath, content, 'utf8');
      // eslint-disable-next-line no-console -- Legitimate script output for debugging
      console.log(`  ✅ Applied ${changeCount} fixes to ${path.basename(filePath)}`);
    } else {
      // eslint-disable-next-line no-console -- Legitimate script output for debugging
      console.log(`  ✓ No changes needed for ${path.basename(filePath)}`);
    }

    return changeCount;
  } catch (error) {
    // eslint-disable-next-line no-console -- Legitimate script output for debugging
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log('🔧 Test Code Cleanup Specialist - Fixing undefined variables across test files');
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log('='*80);

  const testFiles = findTestFiles();
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log(`Found ${testFiles.length} test files to process\n`);

  let totalChanges = 0;
  let processedFiles = 0;

  testFiles.forEach(filePath => {
    const changes = fixTestFile(filePath);
    totalChanges += changes;
    if (changes > 0) {
      processedFiles++;
    }
  });

  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log('\n' + '='*80);
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log(`📊 Summary:`);
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log(`  • Files processed: ${testFiles.length}`);
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log(`  • Files modified: ${processedFiles}`);
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log(`  • Total changes: ${totalChanges}`);
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.log('\n✅ Test variable cleanup completed!');
}

// Run the cleanup
try {
  main();
} catch (error) {
  // eslint-disable-next-line no-console -- Legitimate script output for debugging
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}

