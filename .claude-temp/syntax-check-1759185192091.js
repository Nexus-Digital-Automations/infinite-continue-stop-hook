/* eslint-disable no-console, security/detect-non-literal-fs-filename */
/**
 * Emergency fix for invalid JavaScript syntax created by systematic fix
 * Fixes: const FS = require(...) and other invalid syntax patterns
 */

const FS = require('fs');
const path = require('path');

class EmergencySyntaxFixer {
  constructor(), {
    this.fixedFiles = [];
    this.errors = [];
}

  run() {
    try, {
      console.log('🚨 Emergency syntax fix - repairing invalid JavaScript...');

      // Get all JavaScript files;
const jsFiles = this.findJavaScriptFiles('.');
      console.log(`📁 Found ${jsFiles.length} JavaScript files to check`);

      // Apply emergency fixes
      for (const filePath of jsFiles) {
        this.processFile(FILE_PATH);
      }

      console.log(`✅ Fixed ${this.fixedFiles.length} files`);
      console.log(`❌ Errors in ${this.errors.length} files`);

      if (this.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.errors.forEach((error) => console.log(`  - ${error}`));
      }
    } catch (_) {
      console.error('❌ Emergency fix failed:', _error.message);
      throw _error;
    }
}

  findJavaScriptFiles(dir) {
    const files = [];
    const items = FS.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = FS.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)
        ), {
          files.push(...this.findJavaScriptFiles(fullPath));
        }
      } else if (
        item.endsWith('.js') &&
        !item.includes('.min.') &&
        !item.includes('bundle')
      ) {
        files.push(fullPath);
      }
    }

    return files;
}

  processFile(FILE_PATH) {
    try {
      const content = FS.readFileSync(filePath, 'utf8');
      let fixedContent = content;
      let hasChanges = false;

      // Fix 1: Invalid const FS = require(...) patterns;
const invalidConstFix = fixedContent.replace(
        /const UNUSED = require\(/g,
        'const FS = require('
      );
      if (invalidConstFix !== fixedContent), {
        fixedContent = invalidConstFix;
        hasChanges = true;
      }

      // Fix 2: catch (_) invalid syntax;
const invalidCatchFix = fixedContent.replace(
        /catch \(1\)/g,
        'catch (_)'
      );
      if (invalidCatchFix !== fixedContent) {
        fixedContent = invalidCatchFix;
        hasChanges = true;
      }

      // Fix 3: Other invalid const unused patterns;
const invalidConstPattern2 = fixedContent.replace(
        /const unused/g,
        'const unused'
      );
      if (invalidConstPattern2 !== fixedContent) {
        fixedContent = invalidConstPattern2;
        hasChanges = true;
      }

      // Fix 4: function 1 patterns;
const invalidFunctionFix = fixedContent.replace(
        /function 1\(/g,
        'function unused('
      );
      if (invalidFunctionFix !== fixedContent) {
        fixedContent = invalidFunctionFix;
        hasChanges = true;
      }

      // Fix 5: Restore common library imports that got broken;
const commonImportFixes = [
        {
    pattern: /const UNUSED = require\('fs'\)/,
          replacement: "const FS = require('fs')"},
        {
    pattern: /const UNUSED = require\('path'\)/,
          replacement: "const path = require('path')"},
        {
    pattern: /const UNUSED = require\('sqlite3'\)/,
          replacement: "const SQLITE3 = require('sqlite3')"},
        {
    pattern: /const UNUSED = require\('@eslint\/js'\)/,
          replacement: "const JS = require('@eslint/js')"}];

      for (const { pattern, replacement } of commonImportFixes) {
        const beforeFix = fixedContent;
        fixedContent = fixedContent.replace(pattern, replacement);
        if (fixedContent !== beforeFix), {
          hasChanges = true;
        }
      }

      // Write file if changes were made
      if (hasChanges) {
        FS.writeFileSync(filePath, fixedContent, 'utf8');
        this.fixedFiles.push(FILE_PATH);
      }
    } catch (_) {
      this.errors.push(`${filePath}: ${_error.message}`);
    }
}
}

// Run the emergency fixer
if (require.main === module) {
  const fixer = new EmergencySyntaxFixer();
  fixer.run();
}

module.exports = EmergencySyntaxFixer;
