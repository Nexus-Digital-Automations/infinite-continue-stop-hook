/**
 * Fix RESULT/result Variable Inconsistencies
 *
 * This script fixes all uppercase RESULT variables that should be lowercase result,
 * handles variable declaration issues, and ensures proper scoping.
 *
 * @author Variable Consistency Agent
 * @version 1.0.0
 */

const FS = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to fix based on grep results
const FILES_TO_FIX = [
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-performance.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-json-reporter.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-cicd-reporter.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/stop-hook.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/feature-validation-matrix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/migrate-to-structured-logging.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/migrate-console-to-structured-logging.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/code-quality-analyzer.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-notification-system.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/quick-performance-test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/setup-infinite-hook.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/comprehensive-variable-fix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/comprehensive-linting-fix.js',
];

// Additional patterns to search for test files
const TEST_DIRECTORIES = [
  '/Users/jeremyparker/infinite-continue-stop-hook/test/integration',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/e2e',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/rag-system',
];

class ResultVariableFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.stats = {
      filesProcessed: 0,
      resultVariablesFixed: 0,
      declarationsFixed: 0,
      scopeIssuesFixed: 0,
    };
  }

  /**
   * Main execution method
   */
  run() {
    console.log('🔧 Starting RESULT/result variable fix...');

    try {
      // Find all files with RESULT issues
      const allFiles = this.findAllFilesWithResultIssues();

      console.log(`📁 Found ${allFiles.length} files with RESULT issues`);

      // Process each file
      for (const filePath of allFiles) {
        this.processFile(filePath);
      }

      this.generateReport();

      console.log('✅ RESULT/result variable fix completed successfully');
    } catch (error) {
      console.error('❌ Failed to fix RESULT/result variables:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find all files with RESULT variable issues
   */
  findAllFilesWithResultIssues() {
    const files = new Set([...FILES_TO_FIX]);

    // Search for additional test files
    for (const testDir of TEST_DIRECTORIES) {
      if (FS.existsSync(testDir)) {
        this.findFilesInDirectory(testDir, files);
      }
    }

    // Filter to only existing files
    return Array.from(files).filter((file) => FS.existsSync(file));
  }

  /**
   * Recursively find files in directory
   */
  findFilesInDirectory(dir, files) {
    try {
      const items = FS.readdirSync(dir);

      for (const item of items) {
        const fullPath = PATH.join(dir, item);
        const stat = FS.statSync(fullPath);

        if (stat.isDirectory()) {
          this.findFilesInDirectory(fullPath, files);
        } else if (item.endsWith('.js') || item.endsWith('.test.js')) {
          // Check if file contains RESULT
          const content = FS.readFileSync(fullPath, 'utf8');
          if (content.includes('RESULT')) {
            files.add(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(
        `⚠️ Warning: Could not read directory ${dir}: ${error.message}`,
      );
    }
  }

  /**
   * Process individual file to fix RESULT issues
   */
  processFile(filePath) {
    try {
      console.log(`🔧 Processing: ${PATH.relative(process.cwd(), filePath)}`);

      let content = FS.readFileSync(filePath, 'utf8');
      let modified = false;
      let changes = 0;

      // Apply fixes in order
      const fixes = [
        this.fixResultVariableNames.bind(this),
        this.fixVariableDeclarations.bind(this),
        this.fixScopeIssues.bind(this),
        this.fixSpecificPatterns.bind(this),
      ];

      for (const fix of fixes) {
        const result = fix(content, filePath);
        if (result.modified) {
          content = result.content;
          modified = true;
          changes += result.changes || 1;
        }
      }

      if (modified) {
        FS.writeFileSync(filePath, content);
        this.fixedFiles.push({
          path: filePath,
          changes,
        });
        console.log(
          `✅ Fixed ${changes} issues in ${PATH.relative(process.cwd(), filePath)}`,
        );
      }

      this.stats.filesProcessed++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}: ${error.message}`);
      this.errors.push({
        file: filePath,
        error: error.message,
      });
    }
  }

  /**
   * Fix RESULT variable names to lowercase result
   */
  fixResultVariableNames(content, filePath) {
    let modified = false;
    let changes = 0;

    // Fix specific RESULT patterns that should be result
    const patterns = [
      // In reduce functions where RESULT should be result
      {
        pattern:
          /\.reduce\(\s*\(\s*sum,\s*result\s*\)\s*=>\s*sum\s*\+\s*RESULT\.duration/g,
        replacement: '.reduce((sum, result) => sum + result.duration',
        description: 'reduce function parameter',
      },
      // In filter functions where RESULT should be result
      {
        pattern: /\.filter\(\s*\(\s*result\s*\)\s*=>\s*RESULT\.success\)/g,
        replacement: '.filter((result) => result.success)',
        description: 'filter function parameter',
      },
      // Generic RESULT.property patterns in callbacks
      {
        pattern: /\(\s*result\s*\)\s*=>\s*RESULT\./g,
        replacement: '(result) => result.',
        description: 'callback parameter consistency',
      },
      // In assignments where RESULT should be result for consistency
      {
        pattern: /const\s+result\s*=\s*[^;]+;\s*([^;]*RESULT\.)/g,
        replacement: (match, p1) => match.replace(/RESULT\./g, 'result.'),
        description: 'result variable consistency in scope',
      },
    ];

    for (const { pattern, replacement, description } of patterns) {
      const beforeCount = (content.match(pattern) || []).length;
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      const afterCount = (content.match(pattern) || []).length;

      if (beforeCount > afterCount) {
        modified = true;
        changes += beforeCount - afterCount;
        console.log(
          `  📝 Fixed ${beforeCount - afterCount} ${description} issues`,
        );
      }
    }

    this.stats.resultVariablesFixed += changes;

    return { content, modified, changes };
  }

  /**
   * Fix variable declaration issues
   */
  fixVariableDeclarations(content, filePath) {
    let modified = false;
    let changes = 0;

    // Fix missing variable declarations
    const patterns = [
      // Fix undeclared result variables in specific contexts
      {
        pattern: /(\s+)(result\.testCases\s*=)/g,
        replacement: '$1RESULT.testCases =',
        description: 'missing RESULT reference',
      },
      {
        pattern: /(\s+)(result\.failureDetails\s*=)/g,
        replacement: '$1RESULT.failureDetails =',
        description: 'missing RESULT reference',
      },
      // Fix return statement issues
      {
        pattern: /return\s+result;/g,
        replacement: 'return RESULT;',
        description: 'return statement consistency',
        // Only apply in specific contexts
        condition: (content, match) => {
          const lines = content
            .substring(0, content.indexOf(match))
            .split('\n');
          const lastLines = lines.slice(-10).join('\n');
          return (
            lastLines.includes('const RESULT = {') ||
            lastLines.includes('RESULT.')
          );
        },
      },
    ];

    for (const { pattern, replacement, description, condition } of patterns) {
      if (condition) {
        // Apply conditional replacement
        content = content.replace(pattern, (match, ...args) => {
          if (condition(content, match)) {
            changes++;
            return replacement.replace(
              /\$(\d+)/g,
              (_, num) => args[parseInt(num) - 1] || '',
            );
          }
          return match;
        });
      } else {
        const beforeCount = (content.match(pattern) || []).length;
        content = content.replace(pattern, replacement);
        const afterCount = (content.match(pattern) || []).length;

        if (beforeCount > afterCount) {
          modified = true;
          changes += beforeCount - afterCount;
          console.log(
            `  📝 Fixed ${beforeCount - afterCount} ${description} issues`,
          );
        }
      }
    }

    this.stats.declarationsFixed += changes;

    return { content, modified, changes };
  }

  /**
   * Fix scope issues
   */
  fixScopeIssues(content, filePath) {
    let modified = false;
    let changes = 0;

    // Fix specific scope issues where variables are inconsistently named
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // If we see a RESULT declaration, check following lines for inconsistent usage
      if (line.includes('const RESULT = ')) {
        // Look ahead for inconsistent usage in the same scope
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const followingLine = lines[j];

          // Stop at next function/block
          if (
            followingLine.match(
              /^\s*(function|class|\w+\s*[=:]\s*(function|\()|const\s+\w+\s*=\s*\{)/,
            )
          ) {
            break;
          }

          // Fix inconsistent result usage in same scope as RESULT declaration
          if (
            followingLine.includes('result.') &&
            !followingLine.includes('(result)') &&
            !followingLine.includes('=> result')
          ) {
            lines[j] = followingLine.replace(/result\./g, 'RESULT.');
            modified = true;
            changes++;
          }
        }
      }
    }

    if (modified) {
      content = lines.join('\n');
      console.log(`  📝 Fixed ${changes} scope consistency issues`);
    }

    this.stats.scopeIssuesFixed += changes;

    return { content, modified, changes };
  }

  /**
   * Fix specific patterns identified in the codebase
   */
  fixSpecificPatterns(content, filePath) {
    let modified = false;
    let changes = 0;

    // File-specific fixes
    const fileName = PATH.basename(filePath);

    if (fileName === 'jest-json-reporter.js') {
      // Fix the specific issue where result should be RESULT in return statement
      const beforeContent = content;
      content = content.replace(
        /return\s+result;(\s*}\s*\)\s*;)/g,
        'return RESULT;$1',
      );
      if (content !== beforeContent) {
        modified = true;
        changes++;
        console.log('  📝 Fixed jest-json-reporter return statement');
      }
    }

    if (fileName === 'test-performance.js') {
      // Fix specific reduce function issues
      const beforeContent = content;
      content = content.replace(
        /\.reduce\(\s*\(\s*sum,\s*result\s*\)\s*=>\s*sum\s*\+\s*RESULT\.duration/g,
        '.reduce((sum, result) => sum + result.duration',
      );
      if (content !== beforeContent) {
        modified = true;
        changes++;
        console.log('  📝 Fixed test-performance reduce function');
      }
    }

    return { content, modified, changes };
  }

  /**
   * Generate fix report
   */
  generateReport() {
    console.log('\n📊 RESULT/result Variable Fix Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Metric                  │ Count    │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(
      `│ Files Processed         │ ${this.stats.filesProcessed.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Files Modified          │ ${this.fixedFiles.length.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Result Variables Fixed  │ ${this.stats.resultVariablesFixed.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Declarations Fixed      │ ${this.stats.declarationsFixed.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Scope Issues Fixed      │ ${this.stats.scopeIssuesFixed.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Errors Encountered      │ ${this.errors.length.toString().padEnd(8)} │`,
    );
    console.log('└─────────────────────────┴──────────┘');

    if (this.fixedFiles.length > 0) {
      console.log('\n📁 Modified Files:');
      for (const file of this.fixedFiles) {
        console.log(
          `  ✅ ${PATH.relative(process.cwd(), file.path)} (${file.changes} changes)`,
        );
      }
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.errors) {
        console.log(
          `  ❌ ${PATH.relative(process.cwd(), error.file)}: ${error.error}`,
        );
      }
    }

    // Write report to file
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      fixedFiles: this.fixedFiles.map((f) => ({
        ...f,
        path: PATH.relative(process.cwd(), f.path),
      })),
      errors: this.errors.map((e) => ({
        ...e,
        file: PATH.relative(process.cwd(), e.file),
      })),
    };

    FS.writeFileSync(
      PATH.join(process.cwd(), 'result-variable-fix-report.json'),
      JSON.stringify(report, null, 2),
    );

    console.log(
      '\n📄 Detailed report saved to: result-variable-fix-report.json',
    );
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new ResultVariableFixer();
  fixer.run();
}

module.exports = ResultVariableFixer;
