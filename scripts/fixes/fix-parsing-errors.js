/* eslint-disable no-console, security/detect-non-literal-fs-filename */
/**
 * Fix Parsing Errors Script
 * Systematically fixes all syntax/parsing errors in the specified fix files
 */

const fs = require('fs');
const path = require('path');

const files = [
  'temp-fix-scripts/final-systematic-result-fix.js',
  'temp-fix-scripts/final-unused-vars-fix.js',
  'temp-fix-scripts/fix-all-catch-blocks.js',
  'temp-fix-scripts/fix-all-linting-errors.js',
];

const fixes = [
  // Fix 1: Missing closing brace after constructor
  { search: /}\n\n {2}\/\*\*\n {3}\* Apply systematic result variable fixes/g, replace: '  }\n\n  /**\n   * Apply systematic result variable fixes' },

  // Fix 2: Wrong variable reference _1 instead of _error
  { search: /_1\.message\b/g, replace: '_error.message' },

  // Fix 3: Wrong variable reference output instead of _output (in getAllSourceFiles)
  { search: /const foundFiles = output\n/g, replace: 'const foundFiles = _output\n' },

  // Fix 4: Missing closing brace in getAllSourceFiles
  { search: /return files;\n}/g, replace: 'return files;\n  }' },

  // Fix 5: Wrong variable reference filePath instead of _filePath
  { search: /fs\.accessSync\(filePath, fs\.constants/g, replace: 'fs.accessSync(_filePath, fs.constants' },

  // Fix 6: Missing closing brace in shouldProcessFile
  { search: /return true;\n}\n\n {2}\/\*\*\n {3}\* Process individual file/g, replace: 'return true;\n  }\n\n  /**\n   * Process individual file' },

  // Fix 7: Wrong variable reference in processFile
  { search: /fs\.readFileSync\(filePath, 'utf8'\);/g, replace: 'fs.readFileSync(_filePath, \'utf8\');' },
  { search: /fs\.writeFileSync\(filePath, fixedContent\);/g, replace: 'fs.writeFileSync(_filePath, fixedContent);' },

  // Fix 8: Template literal error
  { search: /\$\{ filePath: _filePath \}/g, replace: '${_filePath}' },

  // Fix 9: Missing closing brace in processFile
  { search: /}\n}\n\n {2}\/\*\*\n {3}\* Apply all result variable fixes/g, replace: '    }\n  }\n\n  /**\n   * Apply all result variable fixes' },

  // Fix 10: Missing closing brace in applyResultFixes
  { search: /return fixed;\n}\n\n {2}\/\*\*\n {3}\* Get systematic fix patterns/g, replace: 'return fixed;\n  }\n\n  /**\n   * Get systematic fix patterns' },

  // Fix 11: Object literal syntax errors - missing commas
  { search: /},\n\n {6}\/\/ Fix:/g, replace: '},\n\n      // Fix:' },
  { search: /\}, \{/g, replace: '},\n      {' },

  // Fix 12: Comment syntax in arrays
  { search: /\/\/ Primary fix: result -> result \(declarations\) \{/g, replace: '// Primary fix: result -> result (declarations)\n      {' },
  { search: /\/\/ Fix: let _result = \{/g, replace: '// Fix: let _result =\n      {' },
  { search: /\/\/ Fix: var result = \{/g, replace: '// Fix: var result =\n      {' },
  { search: /\/\/ Fix: result usage in assignments \{/g, replace: '// Fix: result usage in assignments\n      {' },
  { search: /\/\/ Fix: result in return statements \{/g, replace: '// Fix: result in return statements\n      {' },
  { search: /\/\/ Fix: result in object\/array access \{/g, replace: '// Fix: result in object/array access\n      {' },
  { search: /\/\/ Fix: result in function calls \{/g, replace: '// Fix: result in function calls\n      {' },
  { search: /\/\/ Fix: result in conditionals \{/g, replace: '// Fix: result in conditionals\n      {' },
  { search: /\/\/ Fix: result in logical operations \{/g, replace: '// Fix: result in logical operations\n      {' },
  { search: /\/\/ Fix: result in template literals \{/g, replace: '// Fix: result in template literals\n      {' },
  { search: /\/\/ Fix: result in console\/logging \{/g, replace: '// Fix: result in console/logging\n      {' },
  { search: /\/\/ Fix: result in expect\/assert statements \{/g, replace: '// Fix: result in expect/assert statements\n      {' },

  // Fix 13: Missing closing brace in getSystematicFixes
  { search: /];\n}\n\n {2}\/\*\*\n {3}\* Apply context-specific fixes/g, replace: '];\n  }\n\n  /**\n   * Apply context-specific fixes' },

  // Fix 14: Missing closing brace in applyContextSpecificFixes
  { search: /return fixed;\n}\n\n {2}\/\*\*\n {3}\* Apply test file specific fixes/g, replace: 'return fixed;\n  }\n\n  /**\n   * Apply test file specific fixes' },

  // Fix 15: Array syntax error in applyTestFileFixes
  { search: /\/\/ expect\(result\)\.toBe -> expect\(result\)\.toBe \{/g, replace: '// expect(result).toBe -> expect(result).toBe\n      {' },
  { search: /\/\/ result\.should\.\* -> result\.should\.\* \{/g, replace: '// result.should.* -> result.should.*\n      {' },
  { search: /\/\/ assert\.equal\(result, -> assert\.equal\(result, \{/g, replace: '// assert.equal(result, -> assert.equal(result,\n      {' },

  // Fix 16: Missing closing brace in applyTestFileFixes
  { search: /return fixed;\n}\n\n {2}\/\*\*\n {3}\* Apply API-specific fixes/g, replace: 'return fixed;\n  }\n\n  /**\n   * Apply API-specific fixes' },

  // Fix 17: Array syntax error in applyApiFixes
  { search: /\/\/ API response handling \{/g, replace: '// API response handling\n      {' },

  // Fix 18: Missing closing brace in applyApiFixes
  { search: /return fixed;\n}\n\n {2}\/\*\*\n {3}\* Fix complex declaration patterns/g, replace: 'return fixed;\n  }\n\n  /**\n   * Fix complex declaration patterns' },

  // Fix 19: Missing closing brace in fixComplexDeclarations
  { search: /return fixed;\n}\n\n {2}\/\*\*\n {3}\* Validate and cleanup final content/g, replace: 'return fixed;\n  }\n\n  /**\n   * Validate and cleanup final content' },

  // Fix 20: Missing closing brace in validateAndCleanup
  { search: /return cleaned;\n}\n\n {2}\/\*\*\n {3}\* Report results/g, replace: 'return cleaned;\n  }\n\n  /**\n   * Report results' },

  // Fix 21: Missing closing braces in reportResults
  { search: /}\n}\n}\n\n\/\/ Execute if run directly/g, replace: '    }\n  }\n}\n\n// Execute if run directly' },

  // Fix 22: Wrong variable in catch block
  { search: /console\.error\('❌ Failed to apply systematic fixes:', error\);/g, replace: 'console.error(\'❌ Failed to apply systematic fixes:\', _error);' },
  { search: /throw new Error\(`Script execution failed: \$\{error\.message\}`\);/g, replace: 'throw new Error(`Script execution failed: ${_error.message}`);' },

  // Fix for final-unused-vars-fix.js

  // Fix 23: Extra comma after closing brace
  { search: /},\n\n {2}\/\/ execSync patterns \{/g, replace: '},\n\n  // execSync patterns\n  {' },

  // Fix 24: Missing closing brace in getAllJSFiles
  { search: /files\.push\(fullPath\);\n {4}}\n}\n\n {2}return files;/g, replace: 'files.push(fullPath);\n    }\n  }\n\n  return files;' },

  // Fix 25: Template literal and variable error in fixFileUnusedVars
  { search: /console\.error\(` {2}✗ Error processing \$\{ filePath: _filePath \}:`, error\.message\);/g, replace: 'console.error(`  ✗ Error processing ${_filePath}:`, _error.message);' },
  { search: /} catch \(_error\) \{\n {4}console\.error\(` {2}✗ Error processing/g, replace: '  } catch (_error) {\n    console.error(`  ✗ Error processing' },

  // Fix 26: Missing closing brace after for loop in main()
  { search: /totalModified\+\+;\n {4}}\n}\n\n {2}console\.log\(`\\n🎉 Processing complete/g, replace: 'totalModified++;\n    }\n  }\n\n  console.log(`\\n🎉 Processing complete' },

  // Fix 27: Wrong variable reference in main()
  { search: /execSync\('npm run lint'/g, replace: '_execSync(\'npm run lint\'' },
  { search: /const _output = execSync\(/g, replace: 'const _output = _execSync(' },
  { search: /if \(output\.trim\(\)\)/g, replace: 'if (_output.trim())' },
  { search: /console\.log\(output\);/g, replace: 'console.log(_output);' },

  // Fix 28: Missing closing brace after catch in main()
  { search: /console\.log\('✅ All no-unused-vars errors resolved!'\);\n {4}}\n}\n}\n\nif \(require\.main === module\)/g, replace: 'console.log(\'✅ All no-unused-vars errors resolved!\');\n    }\n  }\n}\n\nif (require.main === module)' },

  // Fix for fix-all-catch-blocks.js

  // Fix 29: Wrong variable references in getAllJsFiles
  { search: /return output\n {6}\.trim/g, replace: 'return _output\n      .trim' },
  { search: /console\.error\('Failed to get JS files:', error\.message\);/g, replace: 'console.error(\'Failed to get JS files:\', _error.message);' },

  // Fix 30: Missing try block opening in getAllJsFiles
  { search: /function getAllJsFiles\(\) \{\n {2}try \{/g, replace: 'function getAllJsFiles() {\n  try {' },

  // Fix 31: Template literal error in fixAllCatchBlocks
  { search: /console\.error\(`Error fixing catch blocks in \$\{ filePath: _filePath \}:`, error\.message\);/g, replace: 'console.error(`Error fixing catch blocks in ${_filePath}:`, _error.message);' },

  // Fix 32: Wrong function call in main execution
  { search: /execSync\('npm run lint -- --fix'/g, replace: '_execSync(\'npm run lint -- --fix\'' },
  { search: /execSync\('npm run lint 2>&1'/g, replace: '_execSync(\'npm run lint 2>&1\'' },

  // Fix 33: Wrong variable references in final status check
  { search: /const _output = error\.stdout \|\| error\.message;/g, replace: 'const _output = _error.stdout || _error.message;' },
  { search: /const errorMatches = output\.match/g, replace: 'const errorMatches = _output.match' },
  { search: /const warningMatches = output\.match/g, replace: 'const warningMatches = _output.match' },

  // Fix for fix-all-linting-errors.js

  // Fix 34: Extra comma after string in getAllJSFiles
  { search: /,\n {7}, \{ encoding: 'utf8' \},/g, replace: ',\n        { encoding: \'utf8\' }' },

  // Fix 35: Wrong execSync reference
  { search: /const output = execSync\(/g, replace: 'const output = _execSync(' },

  // Fix 36: Wrong try syntax in fixFile
  { search: /fixFile\(filePath\) \{\n {4}try, \{/g, replace: 'fixFile(filePath) {\n    try {' },

  // Fix 37: Array syntax errors in undefinedPatterns
  { search: /fix: \(m\) => m\.replace\('try \{', 'try, \{\\n {6}let result;'\)\},/g, replace: 'fix: (m) => m.replace(\'try {\', \'try {\\n      let result;\'),\n        },\n        ' },
  { search: /fix: \(m\) => m\.replace\(\/\\boutput\\b\/g, '_output'\)\}\];/g, replace: 'fix: (m) => m.replace(/\\boutput\\b/g, \'_output\'),\n        },\n      ];' },

  // Fix 38: Syntax error in unusedVars loop
  { search: /if \(usages && usages\.length === 1\), \{/g, replace: 'if (usages && usages.length === 1) {' },

  // Fix 39: Extra comma in run() method
  { search: /execSync\('npm run lint',, \{ stdio: 'pipe' \}\);/g, replace: '_execSync(\'npm run lint\', { stdio: \'pipe\' });' },
];

console.log('🔧 Fixing parsing errors in fix scripts...\n');

let totalFixes = 0;

for (const fileName of files) {
  const filePath = path.join(process.cwd(), fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${fileName} - file not found`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileFixCount = 0;

  for (const fix of fixes) {
    const before = content;
    content = content.replace(fix.search, fix.replace);
    if (content !== before) {
      fileFixCount++;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixes += fileFixCount;
    console.log(`✅ Fixed ${fileFixCount} issues in ${fileName}`);
  } else {
    console.log(`ℹ️  No changes needed in ${fileName}`);
  }
}

console.log(`\n📊 Total fixes applied: ${totalFixes}`);
console.log('✅ Parsing error fixes complete!');
