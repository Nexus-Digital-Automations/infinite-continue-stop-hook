/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Fix Remaining result/result Variable Issues
 *
 * This script specifically targets the remaining result/result variable inconsistencies
 * identified in the linting output.
 *
 * @author Variable Consistency Agent
 * @version 1.0.0
 */

const FS = require('fs');
const PATH = require('path');

// Specific files with issues identified from linting output;
const SPECIFIC_FIXES = [ {,
    file: '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-json-reporter.js',
    fixes: [
      // Line 121: result.testCases should be result.testCases {,
    pattern: /(\s+)(result\.testCases\s*=)/g,
        replacement: '$1result.testCases =',
    description: 'Fix result.testCases to result.testCases',
      },
      // Line 133: result.failureDetails should be result.failureDetails {,
    pattern: /(\s+)(result\.failureDetails\s*=)/g,
        replacement: '$1result.failureDetails =',
    description: 'Fix result.failureDetails to result.failureDetails',
      },
      // Line 155: return result should be return result: {
    pattern: /return\s+result;/g,
        replacement: 'return result;',
        description: 'Fix return result to return result',
      },
  ],
}, {,
    file: '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-performance.js',
    fixes: [
      // Fix result.duration in reduce functions to result.duration {,
    pattern:
          /(\s+\(\s*sum,\s*result\s*\)\s*=>\s*sum\s*\+\s*)result\.duration/g,
        replacement: '$1result.duration',
        description:
          'Fix result.duration to result.duration in reduce functions',
      },
      // Fix result.success in filter functions to result.success {,
    pattern: /(\(\s*result\s*\)\s*=>\s*)result\.success/g,
        replacement: '$1result.success',
        description: 'Fix result.success to result.success in filter functions',
      },
      // Fix class Name {,
    pattern: /class\s+RESOURCE_MONITOR/g,
        replacement: 'class RESOURCE_MONITOR',
        description: 'Fix class Name from RESOURCE_MONITOR to RESOURCE_MONITOR',
      },
      // Fix constructor call: {
    pattern: /new\s+RESOURCE_MONITOR\(\)/g,
        replacement: 'new RESOURCE_MONITOR()',
        description: 'Fix constructor call',
      },
  ],
},
  ];

// Additional files with result/result issues from test files;
const TEST_FILE_FIXES = [
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management-system.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/initialization-stats.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/taskmanager-api.test.js',
];

class RemainingResultFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
}

  run() {
    console.log('🔧 Fixing remaining result/result variable issues...');
    try {
      // Apply specific fixes
      for (const fixSpec of SPECIFIC_FIXES) {
        this.applySpecificFixes(fixSpec);
      }

      // Fix test files with generic patterns
      for (const testFile of TEST_FILE_FIXES) {
        if (FS.existsSync(testFile)) {
          this.fixTestFile(testFile);
        }
      }

      this.generateReport();

      console.log(
        '✅ Remaining result/result variable issues fixed successfully'
      );
    } catch (_) {
      console.error('❌ Failed to fix remaining issues:')}`);

    let content = FS.readFileSync(file);
      this.fixedFiles.push({,
    path: file,
        changes: totalChanges,
      });
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
      `🔧 Processing test file: ${PATH.relative(process.cwd()) => {
          return declaration + usage.replace(/result\./g);\s*([^}]*?)result\s*=/g,
        replacement: 'const RESULT = $1;\n$2result =',
        description: 'Convert result to result for consistency',
      },
      // Fix agentId/agentId inconsistencies: {
    pattern: /const\s+agentId\s*=\s*([^;]+);\s*([^}]*?)agentId/g,
        replacement: 'const agentId = $1;\n$2__agentId',
        description: 'Fix agentId/agentId consistency',
      },
  ];

    for (const fix of fixes) {
      const before = content;
      if (typeof fix.replacement === 'function') {
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

      // Look for result declaration followed by result usage
      if (
        line.includes('const RESULT = ') ||
        line.includes('const RESULT = ')
      ) {
        const isResultDeclaration = line.includes('const RESULT = ');
        const isresultDeclaration = line.includes('const RESULT = ');

        // Look ahead for inconsistent usage
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
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
            nextLine.includes('result.') &&
            !nextLine.includes('(result)')
          ) {
            lines[j] = nextLine.replace(/result\./g, 'result.');
            lineModified = true;
            totalChanges++;
          } else if (isresultDeclaration && nextLine.includes('result.')) {
            lines[j] = nextLine.replace(/result\./g, 'result.');
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
      this.fixedFiles.push({,
    path: filePath,
        changes: totalChanges,
      });
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
      for (const file of this.fixedFiles) {
        console.log(
          `  ✅ ${PATH.relative(process.cwd(), file.path)} (${file.changes} changes)`
        );
      }
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.errors) {
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
