/* eslint-disable no-console, security/detect-non-literal-fs-filename */
/**
 * Final Systematic result/result Variable Pattern Fix
 *
 * This script applies comprehensive fixes to standardize all variable naming
 * patterns across the codebase, focusing on:
 * - result -> result (standardize to lowercase)
 * - Variable declaration/usage consistency
 * - Consistent naming patterns in test files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FinalSystematicResultFix {
  constructor() {
    this.processedFiles = 0;
    this.fixedFiles = 0;
    this.totalReplacements = 0;
    this.projectRoot = process.cwd();
}

  /**
   * Apply systematic result variable fixes
   */
  async applySystematicFixes() {
    console.log(
      '🔧 Starting final systematic result/result variable pattern fixes...'
    );

    try {
      // Get all relevant files;
      const sourceFiles = await this.getAllSourceFiles();

      for (const filePath of sourceFiles) {
        await this.processFile(_filePath);
      }

      this.reportResults();
    } catch (_) {
      console.error('❌ Error during systematic fixes:', _1.message);
      throw new Error(`Systematic fixes failed: ${_1.message}`);,
    }
}

  /**
   * Get all source files that need processing
   */
  async getAllSourceFiles() {
    const extensions = ['.js', '.ts', '.jsx', '.tsx'];
    const excludePatterns = [
      'node_modules',
      '.git',
      'coverage',
      'dist',
      'build',
      '.nyc_output',
    ];

    const files = [];

    // Find all source files;
    const findCommand = `find "${this.projectRoot}" -type f \\( ${extensions.map((ext) => `-name "*${ext}"`).join(' -o ')} \\) ${excludePatterns.map((pattern) => `! -path "*/${pattern}/*"`).join(' ')}`;

    try {
      const _output = execSync(findCommand, { encoding: 'utf8' });
      const foundFiles = output
        .trim()
        .split('\n')
        .filter((file) => file.trim());

      for (const file of foundFiles) {
        if (this.shouldProcessFile(file)) {
          files.push(file);
        }
      }
    } catch (_) {
      console.error('Error finding files:', _error.message);
    }

    return files;
}

  /**
   * Check if file should be processed
   */
  shouldProcessFile(_filePath) {
    // Skip if file doesn't exist or is not readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (_) {
      return false;
    }

    return true;
}

  /**
   * Process individual file
   */
  async processFile(_filePath) {
    this.processedFiles++;

    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const fixedContent = this.applyResultFixes(originalContent, _filePath);

      if (fixedContent !== originalContent) {
        fs.writeFileSync(filePath, fixedContent);
        this.fixedFiles++;
        console.log(`✅ Fixed: ${path.relative(this.projectRoot, _filePath)}`);
      }
    } catch (_) {
      console.error(`❌ Error processing ${filePath}:`, _error.message);
    }
}

  /**
   * Apply all result variable fixes
   */
  applyResultFixes(content, _filePath) {
    let fixed = content;

    // Apply systematic fixes;
    const fixes = this.getSystematicFixes();

    for (const fix of fixes) {
      const before = fixed;
      fixed = fixed.replace(fix.pattern, fix.replacement);

      if (fixed !== before) {
        const count = (before.match(fix.pattern) || []).length;
        this.totalReplacements += count;
      }
    }

    // Apply context-specific fixes
    fixed = this.applyContextSpecificFixes(fixed);

    // Final validation and cleanup
    fixed = this.validateAndCleanup(fixed);

    return fixed;
}

  /**
   * Get systematic fix patterns
   */
  getSystematicFixes() {
    return [
      // Primary fix: result -> result (declarations) {
        pattern: /const result =/g,
        replacement: 'const result =',
      },

      // Fix: let _result = {
        pattern: /let result =/g,
        replacement: 'let result =',
      },

      // Fix: var result = {
        pattern: /var result =/g,
        replacement: 'var result =',
      },

      // Fix: result usage in assignments {
        pattern: /(\s+)result(\s*=\s*)/g,
        replacement: '$1result$2',
      },

      // Fix: result in return statements {
        pattern: /return result;/g,
        replacement: 'return result;',
      },

      // Fix: result in object/array access {
        pattern: /result\./g,
        replacement: 'result.',
      }, {
        pattern: /result\[/g,
        replacement: 'result[',
      },

      // Fix: result in function calls {
        pattern: /result\(/g,
        replacement: 'result(',
      },

      // Fix: result in conditionals {
        pattern: /if\s*\(\s*result\s*\)/g,
        replacement: 'if (result)',
      }, {
        pattern: /if\s*\(\s*!result\s*\)/g,
        replacement: 'if (!result)',
      },

      // Fix: result in logical operations {
        pattern: /(\s+)result(\s*&&\s*)/g,
        replacement: '$1result$2',
      }, {
        pattern: /(\s+)result(\s*\|\|\s*)/g,
        replacement: '$1result$2',
      },

      // Fix: result in template literals {
        pattern: /\$\{result\}/g,
        replacement: '${result}',
      },

      // Fix: result in console/logging {
        pattern: /console\.(log|error|warn|info)\(.*result.*\)/g,
        replacement: (match) => match.replace(/result/g, 'result'),
      },

      // Fix: result in expect/assert statements {
        pattern: /expect\(result\)/g,
        replacement: 'expect(result)',
      }, {
        pattern: /assert\(result\)/g,
        replacement: 'assert(result)',
      },
    ];
}

  /**
   * Apply context-specific fixes
   */
  applyContextSpecificFixes(content, _filePath) {
    let fixed = content;

    // Handle test files specifically
    if (
      _filePath.includes('/test/') ||
      _filePath.includes('.test.') ||
      _filePath.includes('.spec.')
    ) {
      fixed = this.applyTestFileFixes(fixed);
    }

    // Handle API files specifically
    if (_filePath.includes('api') || _filePath.includes('API')) {
      fixed = this.applyApiFixes(fixed);
    }

    // Handle complex variable declaration patterns
    fixed = this.fixComplexDeclarations(fixed);

    return fixed;
}

  /**
   * Apply test file specific fixes
   */
  applyTestFileFixes(content) {
    let fixed = content;

    // Fix test assertion patterns
    const testPatterns = [
      // expect(result).toBe -> expect(result).toBe {
        pattern:
          /expect\(result\)\.(toBe|toEqual|toMatch|toContain|toHaveProperty)/g,
        replacement: 'expect(result).$1',
      },

      // result.should.* -> result.should.* {
        pattern: /result\.should\./g,
        replacement: 'result.should.',
      },

      // assert.equal(result, -> assert.equal(result, {
        pattern: /assert\.(equal|deepEqual|strictEqual)\(result,/g,
        replacement: 'assert.$1(result,',
      },
    ];

    for (const pattern of testPatterns) {
      fixed = fixed.replace(pattern.pattern, pattern.replacement);
    }

    return fixed;
}

  /**
   * Apply API-specific fixes
   */
  applyApiFixes(content) {
    let fixed = content;

    // API response patterns
    const apiPatterns = [
      // API response handling {
        pattern: /result\.data/g,
        replacement: 'result.data',
      }, {
        pattern: /result\.status/g,
        replacement: 'result.status',
      }, {
        pattern: /result\.error/g,
        replacement: 'result.error',
      },
    ];

    for (const pattern of apiPatterns) {
      fixed = fixed.replace(pattern.pattern, pattern.replacement);
    }

    return fixed;
}

  /**
   * Fix complex declaration patterns
   */
  fixComplexDeclarations(content) {
    let fixed = content;

    // Handle multiline declarations
    fixed = fixed.replace(
      /const _result = ([^;]+);\s*([^=\n]+)\s*=\s*result/gm,
      'const _result = $1;\n$2 = result'
    );

    // Handle destructuring
    fixed = fixed.replace(/const \{([^}]+)\} = result/g, 'const {$1} = result');

    // Handle array destructuring
    fixed = fixed.replace(
      /const \[([^\]]+)\] = result/g,
      'const [$1] = result'
    );

    return fixed;
}

  /**
   * Validate and cleanup final content
   */
  validateAndCleanup(content) {
    let cleaned = content;

    // Remove any duplicate result declarations
    cleaned = cleaned.replace(
      /const _result = [^;]+;\s*const _result = [^;]+;/g,
      (match) => {
        const lines = match.split('\n');
        return lines[lines.length - 1] || match;
      }
    );

    // Fix spacing issues
    cleaned = cleaned.replace(/result\s*=/g, 'result =');
    cleaned = cleaned.replace(/=\s*result/g, '= result');

    // Ensure consistent semicolons
    cleaned = cleaned.replace(
      /const _result = ([^;]+)(?!;)/gm,
      'const _result = $1;'
    );

    return cleaned;
}

  /**
   * Report results
   */
  reportResults() {
    console.log('\n📊 Final Systematic Result Fix Results:');
    console.log(`   📁 Files Processed: ${this.processedFiles}`);
    console.log(`   ✅ Files Fixed: ${this.fixedFiles}`);
    console.log(`   🔄 Total Replacements: ${this.totalReplacements}`);

    if (this.fixedFiles > 0) {
      console.log(
        '\n✅ All result/result variable patterns have been systematically fixed!'
      );
      console.log(
        '🎯 Codebase now has consistent lowercase "result" variable naming.'
      );
    } else {
      console.log(
        '\n✅ No result/result inconsistencies found - codebase is already consistent!'
      );
    }
}
}

// Execute if run directly
if (require.main === module) {
  const fixer = new FinalSystematicResultFix();
  fixer.applySystematicFixes().catch((error) => {
    console.error('❌ Failed to apply systematic fixes:', error);
    throw new Error(`Script execution failed: ${error.message}`);,
});
}

module.exports = FinalSystematicResultFix;
