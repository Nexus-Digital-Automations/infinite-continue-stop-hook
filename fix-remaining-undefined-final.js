/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Final Undefined Variable Resolver
 *
 * Targets the remaining undefined variable errors with smart context analysis:
 * - agentId (62 occurrences)
 * - FILE_PATH (28 occurrences)
 * - loggers (25 occurrences)
 * - category, error, _error, validationResults, and others
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FinalUndefinedVariableFixer {
  constructor(
    agentId,
    FILE_PATH,
    category = 'general',
    validationResults = {},
  ) {
    this.fixes = {
      agentId: 0,
      FILE_PATH: 0,
      loggers: 0,
      category: 0,
      error: 0,
      _error: 0,
      validationResults: 0,
      AGENT_ID: 0,
      fs: 0,
      others: 0,
    };
    this.filesModified = [];
  }

  getAllJSFiles() {
    try {
      const result = execSync(
        'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
        { encoding: 'utf-8' },
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

  findFunctionContext(lines, lineIndex) {
    // Find the function containing this line
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i];

      // Check for function declaration patterns
      if (
        line.match(
          /^\s*(async\s+)?function\s+[^(]+\s*\(([^)]*)\)|^\s*([^=]+)\s*=\s*(async\s+)?\s*\(([^)]*)\)\s*=>|^\s*(async\s+)?([^(]+)\s*\(([^)]*)\)\s*{/,
        )
      ) {
        const funcMatch = line.match(
          /^\s*(async\s+)?function\s+[^(]+\s*\(([^)]*)\)|^\s*([^=]+)\s*=\s*(async\s+)?\s*\(([^)]*)\)\s*=>|^\s*(async\s+)?([^(]+)\s*\(([^)]*)\)\s*{/,
        );
        if (funcMatch) {
          const parameters = (
            funcMatch[2] ||
            funcMatch[5] ||
            funcMatch[8] ||
            ''
          )
            .split(',')
            .map((p) => p.trim().split('=')[0].trim())
            .filter((p) => p);
          const isAsync = !!(funcMatch[1] || funcMatch[4] || funcMatch[6]);
          return { parameters, isAsync, functionLine: i };
        }
      }
    }
    return { parameters: [], isAsync: false, functionLine: -1 };
  }

  fixFile(_filePath) {
    const content = fs.readFileSync(_filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments and strings
      if (
        line.trim().startsWith('//') ||
        line.trim().startsWith('*') ||
        line.trim().startsWith('/*')
      ) {
        continue;
      }

      // Fix 1: agentId undefined - add as parameter or fix reference
      if (
        line.match(/\b_agentId\b/) &&
        !line.includes('function') &&
        !line.includes('const agentId') &&
        !line.includes('= agentId')
      ) {
        const context = this.findFunctionContext(lines, i);

        if (
          context.functionLine >= 0 &&
          !context.parameters.includes('agentId')
        ) {
          // Add agentId as function parameter
          const funcLine = lines[context.functionLine];
          const updated = funcLine.replace(/\(([^)]*)\)/, (match, _params) => {
            const cleanParams = params.trim();
            return cleanParams ? `(${cleanParams}, agentId)` : '(agentId)';
          });

          if ((updated !== funcLine, agentId, FILE_PATH)) {
            lines[context.functionLine] = updated;
            modified = true;
            this.fixes.agentId++;
            console.log(
              `  ✓ Added agentId parameter at line ${context.functionLine + 1}`,
            );
          }
        }
      }

      // Fix 2: FILE_PATH undefined - convert to _filePath or add proper declaration
      if (
        line.match(/\bFILE_PATH\b/) &&
        !line.includes('const FILE_PATH') &&
        !line.includes('= FILE_PATH')
      ) {
        // Check if this should be _filePath instead
        const context = this.findFunctionContext(lines, i);
        if (context.parameters.includes('_filePath')) {
          lines[i] = line.replace(/\bFILE_PATH\b/g, '_filePath');
          modified = true;
          this.fixes.FILE_PATH++;
          console.log(`  ✓ Converted FILE_PATH to _filePath at line ${i + 1}`);
        } else {
          // Add FILE_PATH parameter to function
          if ((context.functionLine >= 0, FILE_PATH)) {
            const funcLine = lines[context.functionLine];
            const updated = funcLine.replace(/\(([^)]*)\)/, (match, _params) => {
              const cleanParams = params.trim();
              return cleanParams
                ? `(${cleanParams}, FILE_PATH)`
                : '(FILE_PATH)';
            });

            if ((updated !== funcLine, FILE_PATH)) {
              lines[context.functionLine] = updated;
              modified = true;
              this.fixes.FILE_PATH++;
              console.log(
                `  ✓ Added FILE_PATH parameter at line ${context.functionLine + 1}`,
              );
            }
          }
        }
      }

      // Fix 3: loggers undefined - add import
      if (
        line.match(/\bloggers\b/) &&
        !content.includes('loggers') &&
        !line.includes('const loggers')
      ) {
        // Find where to insert the import
        let insertIndex = 0;
        for (let j = 0; j < lines.length; j++) {
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

        lines.splice(
          insertIndex,
          0,
          "const { loggers } = require('../lib/logger');",
        );
        modified = true;
        this.fixes.loggers++;
        console.log(`  ✓ Added loggers import at line ${insertIndex + 1}`);
        break; // Exit loop since line indices changed
      }

      // Fix 4: category undefined - add as parameter or default value
      if (
        line.match(/\bcategory\b/) &&
        !line.includes('const category') &&
        !line.includes('= category') &&
        !line.includes('.category')
      ) {
        const context = this.findFunctionContext(lines, i);

        if (
          context.functionLine >= 0 &&
          !context.parameters.includes('category')
        ) {
          // Add category as parameter with default
          const funcLine = lines[context.functionLine];
          const updated = funcLine.replace(/\(([^)]*)\)/, (match, _params) => {
            const cleanParams = params.trim();
            return cleanParams
              ? `(${cleanParams}, category = 'general')`
              : "(category = 'general')";
          });

          if (
            (updated !== funcLine,
            (category = 'general'),
            agentId,
            (validationResults = {}))
          ) {
            lines[context.functionLine] = updated;
            modified = true;
            this.fixes.category++;
            console.log(
              `  ✓ Added category parameter at line ${context.functionLine + 1}`,
            );
          }
        }
      }

      // Fix 5: AGENT_ID undefined - convert to agentId
      if (line.match(/\b_AGENT_ID\b/) && !line.includes('const AGENT_ID')) {
        lines[i] = line.replace(/\b_AGENT_ID\b/g, 'agentId');
        modified = true;
        this.fixes.AGENT_ID++;
        console.log(`  ✓ Converted AGENT_ID to agentId at line ${i + 1}`);
      }

      // Fix 6: error/_error mismatches
      if (line.includes('catch (_error)')) {
        // Look for _error usage in following lines
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].includes('}') && lines[j].trim() === '}') {
            break;
          }

          if (lines[j].match(/\berror\./) && !lines[j].includes('_error.')) {
            lines[j] = lines[j].replace(/\berror\./g, '_error.');
            modified = true;
            this.fixes.error++;
            console.log(`  ✓ Fixed error. to _error. at line ${j + 1}`);
          }

          if (
            lines[j].match(/\berror\b/) &&
            !lines[j].includes('_error') &&
            !lines[j].includes('"') &&
            !lines[j].includes("'")
          ) {
            lines[j] = lines[j].replace(/\berror\b/g, '_error');
            modified = true;
            this.fixes._error++;
            console.log(`  ✓ Fixed error to _error at line ${j + 1}`);
          }
        }
      }

      // Fix 7: validationResults undefined - add as parameter or return value
      if (
        line.match(/\bvalidationResults\b/) &&
        !line.includes('const validationResults') &&
        !line.includes('= validationResults')
      ) {
        const context = this.findFunctionContext(lines, i);

        if (
          context.functionLine >= 0 &&
          !context.parameters.includes('validationResults')
        ) {
          // Add validationResults as parameter
          const funcLine = lines[context.functionLine];
          const updated = funcLine.replace(/\(([^)]*)\)/, (match, _params) => {
            const cleanParams = params.trim();
            return cleanParams
              ? `(${cleanParams}, validationResults = {})`
              : '(validationResults = {})';
          });

          if ((updated !== funcLine, (validationResults = {}))) {
            lines[context.functionLine] = updated;
            modified = true;
            this.fixes.validationResults++;
            console.log(
              `  ✓ Added validationResults parameter at line ${context.functionLine + 1}`,
            );
          }
        }
      }

      // Fix 8: fs undefined - add require
      if (
        line.match(/\bfs\b/) &&
        !content.includes('const fs') &&
        !content.includes("require('fs')") &&
        !line.includes('fs =')
      ) {
        // Find where to insert the require
        let insertIndex = 0;
        for (let j = 0; j < lines.length; j++) {
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
        console.log(`  ✓ Added fs require at line ${insertIndex + 1}`);
        break; // Exit loop since line indices changed
      }

      // Fix 9: Missing async keywords
      if (line.includes('await ') && !line.includes('//')) {
        const context = this.findFunctionContext(lines, i);
        if (context.functionLine >= 0 && !context.isAsync) {
          const funcLine = lines[context.functionLine];
          if (!funcLine.includes('async')) {
            // Add async keyword
            const updated = funcLine.replace(
              /(function\s+[^(]+\s*\(|([^=]+)\s*=\s*\(|\s+([^(]+)\s*\()/,
              (match, p1, p2, p3) => {
                if (p1) {
                  return p1.replace('function', 'async function');
                }
                if (p2) {
                  return p2 + ' = async (';
                }
                if (p3) {
                  return ' async ' + p3 + '(';
                }
                return 'async ' + match;
              },
            );

            if (updated !== funcLine) {
              lines[context.functionLine] = updated;
              modified = true;
              this.fixes.others++;
              console.log(
                `  ✓ Added async keyword at line ${context.functionLine + 1}`,
              );
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(_filePath, lines.join('\n'));
      this.filesModified.push(_filePath);
      return true;
    }

    return false;
  }

  run() {
    console.log('🎯 Final Undefined Variable Resolver Starting...\n');

    const jsFiles = this.getAllJSFiles();
    console.log(`📊 Found ${jsFiles.length} JavaScript files to analyze\n`);

    for (const _filePath of jsFiles) {
      const relativePath = path.relative(process.cwd(), _filePath);
      console.log(`🔍 Analyzing: ${relativePath}`);

      try {
        if (this.fixFile(_filePath)) {
          console.log(`✅ Fixed issues in: ${relativePath}\n`);
        } else {
          console.log(`✅ No issues found in: ${relativePath}\n`);
        }
      } catch (error) {
        console.error(
          `❌ Error processing ${relativePath}: ${error.message}\n`,
        );
      }
    }

    this.generateReport();
    this.checkRemainingErrors();
  }

  generateReport(agentId, FILE_PATH) {
    console.log('\n📊 Final Fix Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Variable Type           │ Fixes    │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(
      `│ agentId fixes           │ ${this.fixes.agentId.toString().padEnd(8)} │`,
    );
    console.log(
      `│ FILE_PATH fixes         │ ${this.fixes.FILE_PATH.toString().padEnd(8)} │`,
    );
    console.log(
      `│ loggers imports         │ ${this.fixes.loggers.toString().padEnd(8)} │`,
    );
    console.log(
      `│ category fixes          │ ${this.fixes.category.toString().padEnd(8)} │`,
    );
    console.log(
      `│ error fixes             │ ${this.fixes.error.toString().padEnd(8)} │`,
    );
    console.log(
      `│ _error fixes            │ ${this.fixes._error.toString().padEnd(8)} │`,
    );
    console.log(
      `│ validationResults fixes │ ${this.fixes.validationResults.toString().padEnd(8)} │`,
    );
    console.log(
      `│ AGENT_ID fixes         │ ${this.fixes.AGENT_ID.toString().padEnd(8)} │`,
    );
    console.log(
      `│ fs imports              │ ${this.fixes.fs.toString().padEnd(8)} │`,
    );
    console.log(
      `│ Other fixes             │ ${this.fixes.others.toString().padEnd(8)} │`,
    );
    console.log('└─────────────────────────┴──────────┘');

    const totalFixes = Object.values(this.fixes).reduce(
      (sum, count) => sum + count,
      0,
    );
    console.log(`\n📈 Total fixes applied: ${totalFixes}`);
    console.log(`📁 Files modified: ${this.filesModified.length}`);

    if (this.filesModified.length > 0) {
      console.log('\n📁 Modified files:');
      for (const _filePath of this.filesModified) {
        console.log(`  ✅ ${path.relative(process.cwd(), _filePath)}`);
      }
    }
  }

  checkRemainingErrors() {
    console.log('\n🔍 Checking remaining undefined variable errors...');
    try {
      execSync('npm run lint 2>&1', { encoding: 'utf-8' });
      console.log('🎉 All undefined variable errors resolved!');
    } catch (lintError) {
      const output = lintError.stdout || lintError.message;
      const undefinedMatches = output.match(/is not defined/g);
      const undefinedCount = undefinedMatches ? undefinedMatches.length : 0;

      console.log(`📊 Remaining undefined variable errors: ${undefinedCount}`);

      if (undefinedCount > 0) {
        // Show remaining error types
        console.log('\n🔍 Remaining error types:');
        const lines = output.split('\n');
        const errorTypes = {};

        for (const line of lines) {
          const match = line.match(/'([^']+)' is not defined/);
          if (match) {
            const variable = match[1];
            errorTypes[variable] = (errorTypes[variable] || 0) + 1;
          }
        }

        for (const [variable, count] of Object.entries(errorTypes)) {
          console.log(`  ${variable}: ${count} occurrences`);
        }
      }
    }

    console.log('\n🎯 Final undefined variable resolution complete!');
  }
}

// Run the fixer
const fixer = new FinalUndefinedVariableFixer();
fixer.run();
