/**
 * Fix Remaining No-Undef Errors Comprehensively
 *
 * Targets the remaining variable issues: loggers, result, error, _error, etc.
 */

const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

class RemainingErrorsFixer {
  constructor() {
    this.fixedFiles = [];
  }

  /**
   * Fix loggers import issues
   */
  fixLoggersImport(filePath, content) {
    let newContent = content;
    let hasChanges = false;

    // Skip if already has loggers import
    if (
      content.includes('loggers') &&
      (content.includes("require('./lib/logger')") ||
        content.includes("require('../lib/logger')") ||
        content.includes("require('../../lib/logger')") ||
        content.includes("require('./logger')"))
    ) {
      return { content, hasChanges: false };
    }

    // Check if file uses loggers
    if (!content.includes('loggers.')) {
      return { content, hasChanges: false };
    }

    // Determine the correct import path
    const relativePath = path.relative(process.cwd(), filePath);
    let loggerPath;

    if (
      relativePath.startsWith('test/unit/') ||
      relativePath.startsWith('test/integration/')
    ) {
      loggerPath = "const { loggers } = require('../../lib/logger');";
    } else if (relativePath.startsWith('test/')) {
      loggerPath = "const { loggers } = require('../lib/logger');";
    } else if (relativePath.startsWith('lib/')) {
      const depth = (relativePath.match(/\//g) || []).length - 1;
      if (depth === 0) {
        loggerPath = "const { loggers } = require('./logger');";
      } else {
        loggerPath = `const { loggers } = require('${'../'.repeat(depth)}logger');`;
      }
    } else if (relativePath.startsWith('scripts/')) {
      loggerPath = "const { loggers } = require('../lib/logger');";
    } else {
      loggerPath = "const { loggers } = require('./lib/logger');";
    }

    // Find where to insert import
    const lines = content.split('\n');
    let insertIndex = -1;

    // Look for other require statements
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i].trim();

      if (
        line.startsWith('const ') &&
        line.includes('require(') &&
        !line.includes('loggers')
      ) {
        insertIndex = i + 1;
      } else if (
        line.startsWith('#!/') ||
        line.startsWith('//') ||
        line.startsWith('/*') ||
        line === ''
      ) {
        continue;
      } else if (insertIndex === -1 && line.length > 0) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      insertIndex = 0;
    }

    lines.splice(insertIndex, 0, loggerPath);
    newContent = lines.join('\n');
    hasChanges = true;

    return { content: newContent, hasChanges };
  }

  /**
   * Fix remaining catch block error issues
   */
  fixRemainingCatchErrors(filePath, content) {
    let newContent = content;
    let hasChanges = false;

    // More comprehensive catch block fixes
    const patterns = [
      // } catch { ... error ... }
      {
        pattern: /(\}\s*catch\s*\{[^}]*?)error(\.[^}]*?\})/g,
        replacement: (match, before, after) => {
          // Change catch { to catch (error) {
          const fixed =
            before.replace(/\}\s*catch\s*\{/, '} catch {') + 'error' + after;
          return fixed;
        },
      },
      // catch (_error) { ... _error ... }
      {
        pattern: /(catch\s*\(\s*_error\s*\)[^}]*?)error(?!\w)/g,
        replacement: '$1_error',
      },
      // } catch () { ... error ... }
      {
        pattern: /(\}\s*catch\s*\(\s*\)\s*\{[^}]*?)error(\.[^}]*?\})/g,
        replacement: (match, before, after) => {
          return (
            before.replace(/\}\s*catch\s*\(\s*\)\s*\{/, '} catch {') +
            'error' +
            after
          );
        },
      },
    ];

    patterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        newContent = newContent.replace(pattern, replacement);
        hasChanges = true;
      }
    });

    return { content: newContent, hasChanges };
  }

  /**
   * Fix result variable inconsistencies
   */
  fixResultVariables(filePath, content) {
    let newContent = content;
    let hasChanges = false;

    // Fix RESULT vs result inconsistencies (prefer result)
    const lines = content.split('\n');
    const newLines = [];

    for (let line of lines) {
      const original = line;

      // Fix const result = ... patterns
      if (line.includes('const result =')) {
        line = line.replace(/const result =/g, 'const result =');
        hasChanges = true;
      }

      // Fix result. references to result.
      if (line.includes('RESULT.') && !line.includes('const RESULT')) {
        line = line.replace(/RESULT\./g, 'result.');
        hasChanges = true;
      }

      // Fix return result to return result
      if (line.includes('return RESULT') && !line.includes('const RESULT')) {
        line = line.replace(/return result(?!\w)/g, 'return result');
        hasChanges = true;
      }

      newLines.push(line);
    }

    if (hasChanges) {
      newContent = newLines.join('\n');
    }

    return { content: newContent, hasChanges };
  }

  /**
   * Fix path variable issues (usually PATH vs path)
   */
  fixPathVariables(filePath, content) {
    let newContent = content;
    let hasChanges = false;

    // Check if PATH is imported as const PATH = require('path')
    if (content.includes("const PATH = require('path')")) {
      // Replace path. with PATH. where PATH is the import
      if (content.includes('path.') && !content.includes("require('path')")) {
        newContent = newContent.replace(/(?<!require\('|\.)path\./g, 'PATH.');
        hasChanges = true;
      }
    }

    return { content: newContent, hasChanges };
  }

  /**
   * Process a single file with all fixes
   */
  processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let totalChanges = false;

      // Apply all fixes
      const fixes = [
        () => this.fixLoggersImport(filePath, content),
        (content) => this.fixRemainingCatchErrors(filePath, content),
        (content) => this.fixResultVariables(filePath, content),
        (content) => this.fixPathVariables(filePath, content),
      ];

      for (const fix of fixes) {
        const result = fix(content);
        if (result.hasChanges) {
          content = result.content;
          totalChanges = true;
        }
      }

      if (totalChanges) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles.push(filePath);
        console.log(`✅ Fixed errors in ${path.relative('.', filePath)}`);
      }

      return totalChanges;
    } catch {
      console.error(`Error processing ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Find all JavaScript files
   */
  findJavaScriptFiles() {
    const files = [];
    const excludeDirs = ['node_modules', '.git', 'coverage', 'dist', 'build'];

    function walkDir(dir) {
      try {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (!excludeDirs.includes(entry)) {
              walkDir(fullPath);
            }
          } else if (stat.isFile() && entry.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    walkDir('.');
    return files;
  }

  /**
   * Get current error counts
   */
  getCurrentErrorCounts() {
    try {
      const result = execSync('npm run lint 2>&1 | grep "is not defined"', {
        encoding: 'utf8',
      });

      const counts = {};
      const lines = result.split('\n').filter((line) => line.trim());

      lines.forEach((line) => {
        const match = line.match(/'([^']+)' is not defined/);
        if (match) {
          const variable = match[1];
          counts[variable] = (counts[variable] || 0) + 1;
        }
      });

      return counts;
    } catch {
      return {};
    }
  }

  /**
   * Run comprehensive fix
   */
  run() {
    console.log('🚀 Fixing remaining no-undef errors comprehensively...\n');

    const initialCounts = this.getCurrentErrorCounts();
    console.log('📊 Initial error counts:');
    Object.entries(initialCounts).forEach(([variable, count]) => {
      console.log(`   ${variable}: ${count}`);
    });
    console.log();

    const files = this.findJavaScriptFiles();
    console.log(`📁 Processing ${files.length} JavaScript files...\n`);

    let fixedCount = 0;
    files.forEach((file) => {
      if (this.processFile(file)) {
        fixedCount++;
      }
    });

    const finalCounts = this.getCurrentErrorCounts();
    console.log('\n🎉 Comprehensive fix completed!');
    console.log(`📊 Files modified: ${fixedCount}`);
    console.log('\n📊 Final error counts:');
    Object.entries(finalCounts).forEach(([variable, count]) => {
      const initial = initialCounts[variable] || 0;
      const fixed = initial - count;
      console.log(`   ${variable}: ${count} (fixed: ${fixed})`);
    });
  }
}

if (require.main === module) {
  const fixer = new RemainingErrorsFixer();
  fixer.run();
}

module.exports = RemainingErrorsFixer;
