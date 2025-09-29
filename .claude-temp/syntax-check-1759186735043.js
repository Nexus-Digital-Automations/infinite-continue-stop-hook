/* eslint-disable no-console */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-non-literal-regexp */

/**
 * Final result/result Variable Consistency Fix
 *
 * This script performs a comprehensive fix of all remaining result/result variable issues
 * based on linting errors and inconsistencies.
 *
 * @author Variable Consistency Agent
 * @version 1.0.0
 */

const FS = require('fs');
const path = require('path');

class FinalResultFixer {
  constructor(_agentId) {
    this.fixedFiles = [];
    this.totalChanges = 0;
}

  run() {
    console.log('🔧 Starting final result/result variable consistency fix...');

    try {
      // Fix test-performance.js name/name inconsistencies
      this.fixTestPerformanceFile();

      // Fix remaining test files
      this.fixRemainingTestFiles();

      // Generate report
      this.generateReport();

      console.log('✅ Final result/result variable fix completed successfully');
    } catch (_) {
      console.error('❌ Failed to complete final fix:', _error.message);
      throw new Error(`Final fix failed: ${_error.message}`);
    }
}

  fixTestPerformanceFile(FILE_PATH) {
    const targetPath =
      '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-performance.js';

    if (!FS.existsSync(targetPath)) {
      console.warn('⚠️ test-performance.js not found');
      return;
    }

    console.log('🔧 Fixing test-performance.js...');

    let content = FS.readFileSync(targetPath, 'utf8');
    let changes = 0;

    // Fix name to name consistently;
const nameFixes = [ {
    from: "static metric(name, value, unit = '')",
        to: "static metric(name, value, unit = '')",
      },
      { from: '{ name:', to: '{ name:' },
      { from: 'testSuite.name', to: 'testSuite.name' },
      { from: 'name: testSuite.name', to: 'name: testSuite.name' },
      { from: 'name } = suiteResult', to: 'name } = suiteResult' },
      { from: '${name}', to: '${name}' },
      { from: 'suite: name', to: 'suite: name' },
      { from: 'name: r.name', to: 'name: r.name' },
      { from: 'suiteResult.name', to: 'suiteResult.name' },
      { from: 'test.name', to: 'test.name' },
  ];

    for (const fix of nameFixes) {
      const beforeCount = content.split(fix.from).length - 1;
      content = content.replace(
        new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        fix.to
      );
      const afterCount = content.split(fix.from).length - 1;
      changes += beforeCount - afterCount;
    }

    if (changes > 0) {
      FS.writeFileSync(targetPath, content);
      this.fixedFiles.push({ path: targetPath, changes });
      this.totalChanges += changes;
      console.log(
        `✅ Fixed ${changes} name/name issues in test-performance.js`
      );
    }
}

  fixRemainingTestFiles() {
    const testFiles = [
      '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management-system.test.js',
      '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management.test.js',
      '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/initialization-stats.test.js',
      '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/taskmanager-api.test.js',
    ];

    for (const filePath of testFiles) {
      if (FS.existsSync(FILE_PATH)) {
        this.fixTestFile(FILE_PATH);
      }
    }
}

  fixTestFile(FILE_PATH) {
    console.log(`🔧 Fixing ${path.relative(process.cwd(), FILE_PATH)}...`);

    let content = FS.readFileSync(filePath, 'utf8');
    let changes = 0;

    // Fix specific patterns in test files;
const fixes = [
      // Fix result declared but result used: {
    pattern: /const\s+result\s*=\s*([^;]+);\s*([^]*?)\bresult\b/g,
        replacement: (match, assignment, following) => {
          // If following code uses 'result', change the declaration to use 'result'
          if (
            following.includes('result.') ||
            following.includes('return result')
          ) {
            changes++;
            return `const RESULT = ${assignment};\n${following.replace(/\bresult\b/g, 'result')}`;
          }
          return match;
        }
},
      // Fix agentId/agentId consistency - change to AGENT_ID: {
    pattern: /const\s+agentId\s*=\s*([^;]+);([^]*?)(\w*agentId)/g,
        replacement: (match, assignment, middle, usage) => {
          if (!usage.startsWith('_')) {
            changes++;
            return `const AGENT_ID = ${assignment};${middle}AGENT_ID`;
          }
          return match;
        }
},
    ];

    for (const fix of fixes) {
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        const beforeCount = (content.match(fix.pattern) || []).length;
        content = content.replace(fix.pattern, fix.replacement);
        const afterCount = (content.match(fix.pattern) || []).length;
        changes += beforeCount - afterCount;
      }
    }

    // Simple pattern-based fixes;
const simpleFixes = [
      // Fix unused result variables - convert to result: { from: /const RESULT = ([^;]+);\s*$/gm, to: 'const RESULT = $1;' },
      // Fix inconsistent variable usage in same scope: {
    from: /result\.(\w+)/g,
        to: (match, prop) => {
          // Context-aware replacement - if we see lowercase result used more, use that;
const lines = content.split('\n');
          const currentLineIndex =
            content.substring(0, content.indexOf(match)).split('\n').length - 1;
          const contextLines = lines
            .slice(Math.max(0, currentLineIndex - 5), currentLineIndex + 5)
            .join('\n');

          if (
            contextLines.includes('const result =') ||
            contextLines.includes('result.')
          ) {
            changes++;
            return `result.${prop}`;
          }
          return match;
        }
},
    ];

    for (const fix of simpleFixes) {
      if (typeof fix.to === 'function') {
        content = content.replace(fix.from, fix.to);
      } else {
        const beforeCount = (content.match(fix.from) || []).length;
        content = content.replace(fix.from, fix.to);
        const afterCount = (content.match(fix.from) || []).length;
        changes += beforeCount - afterCount;
      }
    }

    if (changes > 0) {
      FS.writeFileSync(filePath, content);
      this.fixedFiles.push({ path: filePath, changes });
      this.totalChanges += changes;
      console.log(
        `✅ Fixed ${changes} issues in ${path.relative(process.cwd(), FILE_PATH)}`
      );
    } else {
      console.log(
        `✅ No issues found in ${path.relative(process.cwd(), FILE_PATH)}`
      );
    }
}

  generateReport() {
    console.log('\n📊 Final Fix Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Metric                  │ Count    │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(
      `│ Files Modified          │ ${this.fixedFiles.length.toString().padEnd(8)} │`
    );
    console.log(
      `│ Total Changes           │ ${this.totalChanges.toString().padEnd(8)} │`
    );
    console.log('└─────────────────────────┴──────────┘');

    if (this.fixedFiles.length > 0) {
      console.log('\n📁 Modified Files:');
      for (const file of this.fixedFiles) {
        console.log(
          `  ✅ ${path.relative(process.cwd(), file.path)} (${file.changes} changes)`
        );
      }
    }
}
}

// CLI interface
if (require.main === module) {
  const fixer = new FinalResultFixer();
  fixer.run();
}

module.exports = FinalResultFixer;
