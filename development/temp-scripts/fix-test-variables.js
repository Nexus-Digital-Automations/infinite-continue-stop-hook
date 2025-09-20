#!/usr/bin/env node

/**
 * Script to fix undefined variable violations in test files
 *
 * This script addresses the pattern where variables are declared with underscores
 * but referenced without underscores, causing undefined variable errors.
 */

const fs = require('fs');
const path = require('path');

const TEST_FILE = '/Users/jeremyparker/infinite-continue-stop-hook/test/taskmanager-api-comprehensive.test.js';

function fixTestVariables() {
  console.log('Reading test file...');
  let content = fs.readFileSync(TEST_FILE, 'utf8');

  // Track changes
  let changeCount = 0;

  // Common variable patterns to fix
  const variableFixes = [
    // Test variables
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
    { from: /const _task1Data = /g, to: 'const task1Data = ' },
    { from: /const _task2Data = /g, to: 'const task2Data = ' },
    { from: /const _create1Result = /g, to: 'const create1Result = ' },
    { from: /const _create2Result = /g, to: 'const create2Result = ' },
    { from: /const _claim1Result = /g, to: 'const claim1Result = ' },
    { from: /const _claim2Result = /g, to: 'const claim2Result = ' },
    { from: /const _status1Result = /g, to: 'const status1Result = ' },
    { from: /const _status2Result = /g, to: 'const status2Result = ' },
    { from: /const _agent1Id = /g, to: 'const agent1Id = ' },
    { from: /const _agent2Id = /g, to: 'const agent2Id = ' },
    { from: /const _finalListResult = /g, to: 'const finalListResult = ' },
  ];

  // Apply variable declaration fixes
  variableFixes.forEach(fix => {
    const matches = content.match(fix.from);
    if (matches) {
      content = content.replace(fix.from, fix.to);
      changeCount += matches.length;
      console.log(`Fixed ${matches.length} instances of ${fix.from.toString()}`);
    }
  });

  console.log(`Total changes made: ${changeCount}`);

  // Write back to file
  fs.writeFileSync(TEST_FILE, content, 'utf8');
  console.log('Test file updated successfully');
}

// Run the fix
try {
  fixTestVariables();
  console.log('Variable fixing completed successfully');
} catch (error) {
  console.error('Error fixing variables:', error.message);
  process.exit(1);
}