/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Fix Structured Logging Migration Errors
 *
 * Fixes common issues from the console.log to structured logging migration:
 * - Corrects import paths for logger based on file location
 * - Fixes syntax errors
 * - Adds missing imports
 */

const FS = require('fs');
const PATH = require('path');

function fixImportPaths() {
  console.log('🔧 Fixing import paths for logger...');

  const fixes = [
    // Files in lib/api-modules/* subdirectories need ../../logger
    {
      pattern: /lib\/api-modules\/.*\.js$/,
      findImport: "const { loggers } = require('./lib/logger');",
      replaceImport: "const { loggers } = require('../../logger');",
    },
    // Files in lib/* need ./logger
    {
      pattern: /lib\/[^/]+\.js$/,
      findImport: "const { loggers } = require('./lib/logger');",
      replaceImport: "const { loggers } = require('./logger');",
    },
    // Files in root need ./lib/logger
    {
      pattern: /^[^/]+\.js$/,
      findImport: "const { loggers } = require('./lib/logger');",
      replaceImport: "const { loggers } = require('./lib/logger');",
    },
  ];

  const files = findJavaScriptFiles('.');
  let fixedCount = 0;

  for (const file of files) {
    const relativePath = PATH.relative('.', file);

    for (const fix of fixes) {
      if (fix.pattern.test(relativePath)) {
        const content = FS.readFileSync(file, 'utf8');
        if (content.includes(fix.findImport)) {
          const newContent = content.replace(fix.findImport, fix.replaceImport);
          FS.writeFileSync(file, newContent);
          console.log(`  ✅ Fixed import path in ${relativePath}`);
          fixedCount++;
          break;
        }
      }
    }
  }

  console.log(`📊 Fixed ${fixedCount} import paths`);
}

function fixSyntaxErrors() {
  console.log('🔧 Fixing syntax errors...');

  const syntaxFixes = [
    // Fix malformed loggers calls That lost proper syntax
    {
      pattern: /loggers\.(\w+)\.(\w+)\s+\((.+?)\);?\s*$/gm,
      replacement: 'loggers.$1.$2($3);',
    },
    // Fix incomplete try-catch blocks
    {
      pattern: /}\s*catch\s*\{\s*$/gm,
      replacement: '} catch {',
    },
    // Fix missing catch blocks
    {
      pattern: /}\s*catch\s*$/gm,
      replacement: '} catch {',
    },
    // Fix unexpected tokens in specific patterns
    {
      pattern: /loggers\s+\(/g,
      replacement: 'loggers.app.info(',
    },
  ];

  const files = findJavaScriptFiles('.');
  let fixedCount = 0;

  for (const file of files) {
    let content = FS.readFileSync(file, 'utf8');
    let hasChanges = false;

    for (const fix of syntaxFixes) {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      FS.writeFileSync(file, content);
      console.log(`  ✅ Fixed syntax in ${PATH.relative('.', file)}`);
      fixedCount++;
    }
  }

  console.log(`📊 Fixed syntax in ${fixedCount} files`);
}

function addMissingImports() {
  console.log('🔧 Adding missing logger imports...');

  const files = findJavaScriptFiles('.');
  let fixedCount = 0;

  for (const file of files) {
    const content = FS.readFileSync(file, 'utf8');
    const relativePath = PATH.relative('.', file);

    // Skip if already has logger import
    if (
      content.includes("require('./logger')") ||
      content.includes("require('../../logger')") ||
      content.includes("require('./lib/logger')") ||
      content.includes('LOGGER') ||
      content.includes('test') || // Skip test files
      relativePath.includes('node_modules') ||
      relativePath.includes('coverage')
    ) {
      continue;
    }

    // Check if file uses loggers
    if (content.includes('loggers.')) {
      // Determine correct import path
      let importPath = './lib/logger';
      if (relativePath.startsWith('lib/api-modules/')) {
        importPath = '../../logger';
      } else if (relativePath.startsWith('lib/')) {
        importPath = './logger';
      }

      // Add import after other requires
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find where to insert (after existing requires)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('const ')) {
          insertIndex = i + 1;
        } else if (
          lines[i].trim() === '' ||
          lines[i].startsWith('//') ||
          lines[i].startsWith('/*')
        ) {
          continue;
        } else {
          break;
        }
      }

      lines.splice(
        insertIndex,
        0,
        `const { loggers } = require('${importPath}');`,
      );

      FS.writeFileSync(file, lines.join('\n'));
      console.log(`  ✅ Added import to ${relativePath}`);
      fixedCount++;
    }
  }

  console.log(`📊 Added imports to ${fixedCount} files`);
}

function findJavaScriptFiles(rootDir) {
  const files = [];

  function walkDir(dir) {
    const entries = FS.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = PATH.join(dir, entry);
      const stat = FS.statSync(fullPath);

      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && entry.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  walkDir(rootDir);
  return files;
}

function fixSpecificFiles() {
  console.log('🔧 Fixing specific known issues...');

  // Fix append-text-hook.js
  const appendHookPath = './append-text-hook.js';
  if (FS.existsSync(appendHookPath)) {
    let content = FS.readFileSync(appendHookPath, 'utf8');

    // Add proper import
    if (!content.includes("require('./lib/logger')")) {
      content = "const { loggers } = require('./lib/logger');\n" + content;
    }

    // Fix the log calls
    content = content.replace(
      /loggers\.stopHook\.log\(/g,
      'loggers.stopHook.info(',
    );
    content = content.replace(
      /loggers\.stopHook\.error\(/g,
      'loggers.stopHook.error(',
    );

    FS.writeFileSync(appendHookPath, content);
    console.log('  ✅ Fixed append-text-hook.js');
  }

  // Fix lib/utils/logger.js to add missing newline
  const utilsLoggerPath = './lib/utils/logger.js';
  if (FS.existsSync(utilsLoggerPath)) {
    let content = FS.readFileSync(utilsLoggerPath, 'utf8');
    if (!content.endsWith('\n')) {
      content += '\n';
      FS.writeFileSync(utilsLoggerPath, content);
      console.log('  ✅ Fixed missing newline in lib/utils/logger.js');
    }
  }
}

function main() {
  console.log('🚀 Starting structured logging migration error fixes\n');

  fixImportPaths();
  console.log();

  fixSyntaxErrors();
  console.log();

  addMissingImports();
  console.log();

  fixSpecificFiles();
  console.log();

  console.log('✅ Migration error fixes complete!\n');

  // Run linter to check results
  console.log('🔍 Running linter to check for remaining issues...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run lint -- --quiet', { stdio: 'inherit' });
    console.log('✅ Linter passed! Migration successful.');
    // eslint-disable-next-line no-unused-vars -- Catch parameter intentionally unused
  } catch (_error) {
    console.log(
      '⚠️  Some linting issues remain. You may need to fix them manually.',
    );
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fixImportPaths,
  fixSyntaxErrors,
  addMissingImports,
  fixSpecificFiles,
};
