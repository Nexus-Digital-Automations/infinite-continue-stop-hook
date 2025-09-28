/**
 * Fix Remaining RESULT/result Variable Issues
 *
 * This script specifically targets the remaining RESULT/result variable inconsistencies
 * identified in the linting output.
 *
 * @author Variable Consistency Agent
 * @version 1.0.0
 */

const FS = require('fs');
const path = require('path');

// Specific files with issues identified from linting output
const SPECIFIC_FIXES = [
  {
    file: '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-json-reporter.js',
    fixes: [
      // Line 121: result.testCases should be RESULT.testCases
      {
        pattern: /(\s+)(result\.testCases\s*=)/g,
        replacement: '$1RESULT.testCases =',
        description: 'Fix result.testCases to RESULT.testCases',
      },
      // Line 133: result.failureDetails should be RESULT.failureDetails
      {
        pattern: /(\s+)(result\.failureDetails\s*=)/g,
        replacement: '$1RESULT.failureDetails =',
        description: 'Fix result.failureDetails to RESULT.failureDetails',
      },
      // Line 155: return result should be return RESULT
      {
        pattern: /return\s+result;/g,
        replacement: 'return RESULT;',
        description: 'Fix return result to return RESULT',
      },
    ],
  },
  {
    file: '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-performance.js',
    fixes: [
      // Fix RESULT.duration in reduce functions to result.duration
      {
        pattern:
          /(\s+\(\s*sum,\s*result\s*\)\s*=>\s*sum\s*\+\s*)RESULT\.duration/g,
        replacement: '$1result.duration',
        description:
          'Fix RESULT.duration to result.duration in reduce functions',
      },
      // Fix RESULT.success in filter functions to result.success
      {
        pattern: /(\(\s*result\s*\)\s*=>\s*)RESULT\.success/g,
        replacement: '$1result.success',
        description: 'Fix RESULT.success to result.success in filter functions',
      },
      // Fix class Name
      {
        pattern: /class\s+ResourceMonitor/g,
        replacement: 'class ResourceMonitor',
        description: 'Fix class Name from ResourceMonitor to ResourceMonitor',
      },
      // Fix constructor call
      {
        pattern: /new\s+ResourceMonitor\(\)/g,
        replacement: 'new ResourceMonitor()',
        description: 'Fix constructor call',
      },
    ],
  },
];

// Additional files with RESULT/result issues from test files
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
    console.log('🔧 Fixing remaining RESULT/result variable issues...');

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
        '✅ Remaining RESULT/result variable issues fixed successfully',
      );
    } catch (error) {
      console.error('❌ Failed to fix remaining issues:', error.message);
      process.exit(1);
    }
  }

  applySpecificFixes(fixSpec) {
    const { file, fixes } = fixSpec;

    if (!FS.existsSync(file)) {
      console.warn(`⚠️ File not found: ${file}`);
      return;
    }

    console.log(`🔧 Processing: ${path.relative(process.cwd(), file)}`);

    let content = FS.readFileSync(file, 'utf8');
    let modified = false;
    let totalChanges = 0;

    for (const fix of fixes) {
      const beforeCount = (content.match(fix.pattern) || []).length;
      content = content.replace(fix.pattern, fix.replacement);
      const afterCount = (content.match(fix.pattern) || []).length;

      const changes = beforeCount - afterCount;
      if (changes > 0) {
        modified = true;
        totalChanges += changes;
        console.log(`  📝 ${fix.description}: ${changes} fixes`);
      }
    }

    if (modified) {
      FS.writeFileSync(file, content);
      this.fixedFiles.push({
        path: file,
        changes: totalChanges,
      });
      console.log(
        `✅ Fixed ${totalChanges} issues in ${path.relative(process.cwd(), file)}`,
      );
    } else {
      console.log(
        `✅ No issues found in ${path.relative(process.cwd(), file)}`,
      );
    }
  }

  fixTestFile(filePath) {
    console.log(
      `🔧 Processing test file: ${path.relative(process.cwd(), filePath)}`,
    );

    let content = FS.readFileSync(filePath, 'utf8');
    let modified = false;
    let totalChanges = 0;

    // Fix patterns where RESULT is declared but result is used
    const fixes = [
      // Fix cases where RESULT is declared but result is referenced
      {
        pattern:
          /(\s+const\s+RESULT\s*=\s*[^;]+;\s*)([^}]*?result\.[a-zA-Z_][a-zA-Z0-9_]*)/g,
        replacement: (match, declaration, usage) => {
          return declaration + usage.replace(/result\./g, 'RESULT.');
        },
        description: 'Fix result references in RESULT scope',
      },
      // Fix unused RESULT variables - convert to result
      {
        pattern: /const\s+RESULT\s*=\s*([^;]+);\s*([^}]*?)result\s*=/g,
        replacement: 'const result = $1;\n$2result =',
        description: 'Convert RESULT to result for consistency',
      },
      // Fix agentId/AGENT_ID inconsistencies
      {
        pattern: /const\s+agentId\s*=\s*([^;]+);\s*([^}]*?)AGENT_ID/g,
        replacement: 'const AGENT_ID = $1;\n$2_agentId',
        description: 'Fix agentId/AGENT_ID consistency',
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

    // Additional line-by-line fixes for complex cases
    const lines = content.split('\n');
    let lineModified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for RESULT declaration followed by result usage
      if (
        line.includes('const RESULT = ') ||
        line.includes('const result = ')
      ) {
        const isResultDeclaration = line.includes('const RESULT = ');
        const isresultDeclaration = line.includes('const result = ');

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
            lines[j] = nextLine.replace(/result\./g, 'RESULT.');
            lineModified = true;
            totalChanges++;
          } else if (isresultDeclaration && nextLine.includes('RESULT.')) {
            lines[j] = nextLine.replace(/RESULT\./g, 'result.');
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
        changes: totalChanges,
      });
      console.log(
        `✅ Fixed ${totalChanges} issues in ${path.relative(process.cwd(), filePath)}`,
      );
    } else {
      console.log(
        `✅ No issues found in ${path.relative(process.cwd(), filePath)}`,
      );
    }
  }

  generateReport() {
    console.log('\n📊 Remaining Fixes Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Metric                  │ Count    │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(
      `│ Files Modified          │ ${this.fixedFiles.length.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Errors Encountered      │ ${this.errors.length.toString().padEnd(8)} │`,
    );
    console.log('└─────────────────────────┴──────────┘');

    if (this.fixedFiles.length > 0) {
      console.log('\n📁 Modified Files:');
      for (const file of this.fixedFiles) {
        console.log(
          `  ✅ ${path.relative(process.cwd(), file.path)} (${file.changes} changes)`,
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
