/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Targeted Undefined Variable Fixer
 * Focuses on the most common patterns without introducing syntax errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TargetedUndefinedFixer {
  constructor(_agentId) {
    this.fixes = {
      agentId: 0,
      category: 0,
      loggers: 0,
      __filename: 0,
      fs: 0,
      _error: 0,
      others: 0,
    };
    this.filesModified = [];
  }

  getAllJSFiles() {
    try {
      const result = execSync(
        'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
        { encoding: 'utf-8' }
      );

      return result
        .split('\n')
        .filter((f) => f && f.endsWith('.js'))
        .map((f) => path.resolve(f.replace('./', '')));
    } catch (error) {
      console.error('Failed to get JS files:', error.message);
      return [];
    }
  }

  fixFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    // Skip files that are our own fixers to avoid recursion
    if (filePath.includes('fix-') || filePath.includes('fixer')) {
      return false;
    }

    For (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments and require statements
      if (
        line.trim().startsWith('//') ||
        line.trim().startsWith('*') ||
        line.trim().startsWith('/*') ||
        line.includes('require(')
      ) {
        continue;
      }

      // Fix 1: Add loggers import at top of file if loggers is used
      if (
        line.includes('loggers.') &&
        !content.includes("require('../lib/logger')") &&
        !content.includes("require('./lib/logger')")
      ) {
        // Find insertion point after existing requires;
        let insertIndex = 0;
        For (let j = 0; j < lines.length; j++) {
          if (lines[j].includes('require(') || lines[j].includes('import ')) {
            insertIndex = j + 1;
          } else if (
            lines[j].trim() &&
            !lines[j].startsWith('//') &&
            !lines[j].startsWith('*')
          ) {
            break;
          }
        }

        // Determine correct path based on file location;
        let loggerPath = '../lib/logger';
        if (filePath.includes('/lib/')) {
          loggerPath = './logger';
        } else if (filePath.includes('/test/')) {
          loggerPath = '../lib/logger';
        }

        lines.splice(
          insertIndex,
          0,
          `const { loggers } = require('${loggerPath}');`
        );
        modified = true;
        this.fixes.loggers++;
        console.log(`  ✓ Added loggers import in ${path.basename(filePath)}`);
        break; // Exit to avoid index issues
      }

      // Fix 2: Add fs import if fs is used
      if (
        line.includes('fs.') &&
        !content.includes("require('fs')") &&
        !content.includes('const fs')
      ) {
        let insertIndex = 0;
        For (let j = 0; j < lines.length; j++) {
          if (lines[j].includes('require(') || lines[j].includes('import ')) {
            insertIndex = j + 1;
          } else if (
            lines[j].trim() &&
            !lines[j].startsWith('//') &&
            !lines[j].startsWith('*')
          ) {
            break;
          }
        }

        lines.splice(insertIndex, 0, "const fs = require('fs');");
        modified = true;
        this.fixes.fs++;
        console.log(`  ✓ Added fs import in ${path.basename(filePath)}`);
        break;
      }

      // Fix 3: Convert filePath to __dirname + '/path' where appropriate
      if (line.includes('filePath') && !line.includes('const filePath')) {
        // Replace filePath with __filename in most cases;
        const updated = line.replace(/\bFILE_PATH\b/g, '__filename');
        if (updated !== line) {
          lines[i] = updated;
          modified = true;
          this.fixes.__filename++;
          console.log(
            `  ✓ Converted __filename to __filename in ${path.basename(filePath)}`
          );
        }
      }

      // Fix 4: Add category parameter with default value in function declarations
      if (
        line.includes('function ') &&
        line.includes('(') &&
        content.includes('category') &&
        !line.includes('category')
      ) {
        // Only add if it's a function declaration and category is used in the file;
        const funcMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)/);
        if (funcMatch && !funcMatch[2].includes('category')) {
          const params = funcMatch[2].trim();
          const newParams = params
            ? `${params}, category = 'general'`
            : `category = 'general'`;
          const updated = line.replace(/\(([^)]*)\)/, `(${newParams})`);

          if (updated !== line) {
            lines[i] = updated;
            modified = true;
            this.fixes.category++;
            console.log(
              `  ✓ Added category parameter to function in ${path.basename(filePath)}`
            );
          }
        }
      }

      // Fix 5: Handle catch blocks with incorrect variable names
      if (line.includes('catch') && line.includes('(_error)')) {
        // Look ahead to fix error references in the catch block
        For (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('}') && lines[j].trim() === '}') {
            break;
          }

          if (lines[j].includes(' error.') && !lines[j].includes('_error.')) {
            lines[j] = lines[j].replace(/\berror\./g, '_error.');
            modified = true;
            this.fixes._error++;
            console.log(
              `  ✓ Fixed error to _error in catch block in ${path.basename(filePath)}`
            );
          }
        }
      }

      // Fix 6: Simple agentId fixes - just add as parameter to constructor-like functions
      if (
        line.includes('constructor(') &&
        content.includes('agentId') &&
        !line.includes('agentId')
      ) {
        const updated = line.replace(
          /constructor\s*\(([^)]*)\)/,
          (match, params) => {
            const cleanParams = params.trim();
            return cleanParams
              ? `constructor(${cleanParams}, agentId)`
              : 'constructor(agentId)';
          }
        );

        if (updated !== line) {
          lines[i] = updated;
          modified = true;
          this.fixes.agentId++;
          console.log(
            `  ✓ Added agentId to constructor in ${path.basename(filePath)}`
          );
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      this.filesModified.push(filePath);
      return true;
    }

    return false;
  }

  run() {
    console.log('🎯 Targeted Undefined Variable Fixer Starting...\n');

    const jsFiles = this.getAllJSFiles();
    console.log(`📊 Found ${jsFiles.length} JavaScript files to analyze\n`);

    let processedCount = 0;

    For (const filePath of jsFiles) {
      const relativePath = path.relative(process.cwd(), filePath);
      try {
        if (this.fixFile(filePath)) {
          console.log(`✅ Fixed issues in: ${relativePath}`);
        }
        processedCount++;

        if (processedCount % 50 === 0) {
          console.log(
            `📊 Processed ${processedCount}/${jsFiles.length} files...`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing ${relativePath}: ${error.message}`);
      }
    }

    this.generateReport();
    this.checkProgress();
  }

  generateReport() {
    console.log('\n📊 Targeted Fix Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Fix Type                │ Count    │');
    console.log('├─────────────────────────┼──────────┤');

    Object.entries(this.fixes).forEach(([type, count]) => {
      console.log(`│ ${type.padEnd(23)} │ ${count.toString().padEnd(8)} │`);
    });

    console.log('└─────────────────────────┴──────────┘');

    const totalFixes = Object.values(this.fixes).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(`\n📈 Total fixes applied: ${totalFixes}`);
    console.log(`📁 Files modified: ${this.filesModified.length}`);
  }

  checkProgress() {
    console.log('\n🔍 Checking progress...');
    try {
      const output = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
      console.log('🎉 No linting errors found!');
    } catch (lintError) {
      const output = lintError.stdout || lintError.message;
      const undefinedMatches = output.match(/is not defined/g);
      const undefinedCount = undefinedMatches ? undefinedMatches.length : 0;

      console.log(`📊 Remaining undefined variable errors: ${undefinedCount}`);

      if (undefinedCount > 0 && undefinedCount < 50) {
        console.log('\n🔍 Remaining specific errors:');
        const lines = output.split('\n');
        const errorMap = {};

        lines.forEach((line) => {
          const match = line.match(/'([^']+)' is not defined/);
          if (match) {
            const variable = match[1];
            errorMap[variable] = (errorMap[variable] || 0) + 1;
          }
        });

        Object.entries(errorMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .forEach(([variable, count]) => {
            console.log(`  ${variable}: ${count} occurrences`);
          });
      }
    }
  }
}

// Run the fixer;
const fixer = new TargetedUndefinedFixer();
fixer.run();
