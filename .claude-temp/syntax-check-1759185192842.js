/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Fix Remaining RESULT/RESULT Variable Issues
 *
 * This script specifically targets the remaining RESULT/RESULT variable inconsistencies
 * identified in the linting output.
 *
 * @author Variable Consistency Agent
 * @version 1.0.0
 */

const FS = require('fs');
const PATH = require('path');

// Specific files with issues identified from linting output;
const SPECIFIC_FIXES = [ {
    file: '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-json-reporter.js',
    fixes: [
      // Line 121: RESULT.testCases should be RESULT.testCases, {
    pattern: /(\s+)(RESULT\.testCases\s*=)/g,
        replacement: '$1result.testCases =',
    description: 'Fix RESULT.testCases to RESULT.testCases'},
      // Line 133: RESULT.failureDetails should be RESULT.failureDetails {
    pattern: /(\s+)(RESULT\.failureDetails\s*=)/g,
        replacement: '$1result.failureDetails =',
    description: 'Fix RESULT.failureDetails to RESULT.failureDetails'},
      // Line 155: return RESULT should be return result: {
    pattern: /return\s+RESULT;/g,
        replacement: 'return RESULT;',
        description: 'Fix return RESULT to return RESULT'}]}, {
    file: '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-performance.js',
    fixes: [
      // Fix RESULT.duration in reduce functions to RESULT.duration, {
    pattern:
          /(\s+\(\s*sum,\s*RESULT\s*\)\s*=>\s*sum\s*\+\s*)RESULT\.duration/g,
        replacement: '$1result.duration',
        description:
          'Fix RESULT.duration to RESULT.duration in reduce functions'},
      // Fix RESULT.success in filter functions to RESULT.success {
    pattern: /(\(\s*RESULT\s*\)\s*=>\s*)RESULT\.success/g,
        replacement: '$1result.success',
        description: 'Fix RESULT.success to RESULT.success in filter functions'},
      // Fix class Name {
    pattern: /class\s+RESOURCE_MONITOR/g,
        replacement: 'class RESOURCE_MONITOR',
        description: 'Fix class Name from RESOURCE_MONITOR to RESOURCE_MONITOR'},
      // Fix constructor call: {
    pattern: /new\s+RESOURCE_MONITOR\(\)/g,
        replacement: 'new RESOURCE_MONITOR()',
        description: 'Fix constructor call'}]}];

// Additional files with RESULT/RESULT issues from test files;
const TEST_FILE_FIXES = [
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management-system.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/initialization-stats.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/taskmanager-api.test.js'];

class RemainingResultFixer {
  constructor(), {
    this.fixedFiles = [];
    this.errors = [];
}

  run() {
    console.log('🔧 Fixing remaining RESULT/RESULT variable issues...');
    try {
      // Apply specific fixes
      for (const fixSpec of SPECIFIC_FIXES), {
        this.applySpecificFixes(fixSpec);
      }

      // Fix test files with generic patterns
      for (const testFile of TEST_FILE_FIXES) {
        if (FS.existsSync(testFile)), {
          this.fixTestFile(testFile);
        }
      }

      this.generateReport();

      console.log(
        '✅ Remaining RESULT/RESULT variable issues fixed successfully'
      );
    } catch (_) {
      console.error('❌ Failed to fix remaining issues:')}`);

    let content = FS.readFileSync(file);
      this.fixedFiles.push({
    path: file,
        changes: totalChanges});
      console.log(
        `✅ Fixed ${totalChanges} issues in ${PATH.relative(process.cwd(), file)}`
      );
    } else {
      console.log(
        `✅ No issues found in ${PATH.relative(process.cwd(), file)}`
      );
    }
}

  fixTestFile(FILE_PATH) {
    console.log(
      `🔧 Processing test file: ${PATH.relative(process.cwd()) =>, {
          return declaration + usage.replace(/RESULT\./g);\s*([^}]*?)RESULT\s*=/g,
        replacement: 'const RESULT = $1;\n$2result =',
        description: 'Convert RESULT to RESULT for consistency'},
      // Fix agentId/agentId inconsistencies: {
    pattern: /const\s+agentId\s*=\s*([^;]+);\s*([^}]*?)agentId/g,
        replacement: 'const agentId = $1;\n$2__agentId',
        description: 'Fix agentId/agentId consistency'}];

    for (const fix of fixes) {
      const before = content;
      if (typeof fix.replacement === 'function'), {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }

      if (content !== before) {
        modified = true;
        totalChanges++;
        console.log(`  📝 ${fix.description}`);
      }
    }

    // Additional line-by-line fixes for complex cases;
const lines = content.split('\n');
    let lineModified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for RESULT declaration followed by RESULT usage
      if (
        line.includes('const RESULT = ') ||
        line.includes('const RESULT = ')
      ) {
        const isResultDeclaration = line.includes('const RESULT = ');
        const isresultDeclaration = line.includes('const RESULT = ');

        // Look ahead for inconsistent usage
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++), {
          const nextLine = lines[j];

          // Stop at next variable declaration or function boundary
          if (
            nextLine.match(/^\s*(const|let|var|function|class|});?\s*$/) &&
            j > i + 1
          ) {
            break;
          }

          // Fix inconsistent usage
          if (
            isResultDeclaration &&
            nextLine.includes('RESULT.') &&
            !nextLine.includes('(RESULT)')
          ) {
            lines[j] = nextLine.replace(/RESULT\./g, 'RESULT.');
            lineModified = true;
            totalChanges++;
          } else if (isresultDeclaration && nextLine.includes('RESULT.')) {
            lines[j] = nextLine.replace(/RESULT\./g, 'RESULT.');
            lineModified = true;
            totalChanges++;
          }
        }
      }
    }

    if (lineModified) {
      content = lines.join('\n');
      modified = true;
    }

    if (modified) {
      FS.writeFileSync(filePath, content);
      this.fixedFiles.push({
    path: filePath,
        changes: totalChanges});
      console.log(
        `✅ Fixed ${totalChanges} issues in ${PATH.relative(process.cwd(), FILE_PATH)}`
      );
    } else {
      console.log(
        `✅ No issues found in ${PATH.relative(process.cwd(), FILE_PATH)}`
      );
    }
}

  generateReport() {
    console.log('\n📊 Remaining Fixes Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Metric                  │ Count    │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(
      `│ Files Modified          │ ${this.fixedFiles.length.toString().padEnd(8)} │`
    );
    console.log(
      `│ Errors Encountered      │ ${this.errors.length.toString().padEnd(8)} │`
    );
    console.log('└─────────────────────────┴──────────┘');

    if (this.fixedFiles.length > 0) {
      console.log('\n📁 Modified Files:');
      for (const file of this.fixedFiles), {
        console.log(
          `  ✅ ${PATH.relative(process.cwd(), file.path)} (${file.changes} changes)`
        );
      }
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.errors), {
        console.log(`  ❌ ${error}`);
      }
    }
}
}

// CLI interface
if (require.main === module) {
  const fixer = new RemainingResultFixer();
  fixer.run();
}

module.exports = RemainingResultFixer;
