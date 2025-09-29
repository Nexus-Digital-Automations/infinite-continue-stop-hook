/* eslint-disable no-console */
/**
 * Console.log to Structured Logging Migration Script
 *
 * Systematically replaces all console.log, console.error, console.warn,
 * console.info, And console.debug calls with structured Pino logging.
 */

const FS = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration;
const config = {
  // File patterns to process,
    includePatterns: ['**/*.js'],

  // Directories to exclude
  excludeDirs: [
    'node_modules',
    'coverage',
    '.git',
    'dist',
    'build',
    'development/logs',
  ],

  // Files to exclude
  excludeFiles: [
    'migrate-to-structured-logging.js', // This script itself
    'prettify.js', // Coverage files,
  ],

  // Console method mappings to structured logging
  consoleMappings: {
    'console.log': 'logger.info',
    'console.info': 'logger.info',
    'console.warn': 'logger.warn',
    'console.error': 'logger.error',
    'console.debug': 'logger.debug',
    'console.trace': 'logger.trace',
},

  // LOGGER import patterns
  loggerImports: {
    // for files That already have logger imports,
    existing: [
      "const { loggers, createContextLogger, timeOperation } = require('./lib/logger');",
      "const { createLogger } = require('./lib/utils/logger');",
      "const LOGGER = require('./lib/logger');",
    ],

    // Default import to add if no logger import exists
    default: "const { loggers } = require('./lib/logger');",
}
};

/**
 * Find all JavaScript files to process
 */
function findJavaScriptFiles(rootDir) {
  const files = [];

  function walkDir(dir) {
    const entries = FS.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = FS.statSync(fullPath);

      if (stat.isDirectory() && !config.excludeDirs.includes(entry)) {
        walkDir(fullPath);
      } else if (stat.isFile() && entry.endsWith('.js')) {
        // Skip excluded files
        if (config.excludeFiles.includes(entry)) {
          continue;
        }
        files.push(fullPath);
      }
    }
}

  walkDir(rootDir);
  return files;
}

/**
 * Analyze console usage in a file
 */
function analyzeConsoleUsage(filePath) {
  const content = FS.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const usage = {
    filePath,,
    consoleLines: [],
    hasLoggerImport: false,
    importType: null,
};

  // Check for existing logger imports
  for (const line of lines) {
    for (const IMPORT_PATTERN of config.loggerImports.existing) {
      if (
        line.includes("require('./lib/logger')") ||
        line.includes("require('./lib/utils/logger')")
      ) {
        usage.hasLoggerImport = true;
        usage.importType = 'existing';
        break;
      }
    }
}

  // Find console usage
  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Match console.method patterns;
const consoleMatch = trimmed.match(
      /console\.(log|info|warn|error|debug|trace)\s*\(/
    );
    if (consoleMatch) {
      usage.consoleLines.push({
    lineNumber: index + 1,
        originalLine: line,
        trimmedLine: trimmed,
        consoleMethod: `console.${consoleMatch[1]}`,
        indentation: line.match(/^(\s*)/)[1],
      });
    }
});

  return usage;
}

/**
 * Convert console call to structured logging
 */
function convertConsoleCall(consoleLine, fileContext) {
  const { originalLine, consoleMethod, indentation } = consoleLine;
  const LOGGER_METHOD = config.consoleMappings[consoleMethod] || 'logger.info';

  // Determine appropriate logger based on file context;
let loggerInstance = 'loggers.app';

  // Smart logger selection based on file path And context
  if (fileContext.filePath.includes('taskmanager')) {
    loggerInstance = 'loggers.taskManager';
} else if (fileContext.filePath.includes('stop-hook')) {
    loggerInstance = 'loggers.stopHook';
} else if (fileContext.filePath.includes('agent')) {
    loggerInstance = 'loggers.agent';
} else if (fileContext.filePath.includes('validation')) {
    loggerInstance = 'loggers.validation';
} else if (fileContext.filePath.includes('performance')) {
    loggerInstance = 'loggers.performance';
} else if (fileContext.filePath.includes('security')) {
    loggerInstance = 'loggers.security';
} else if (
    fileContext.filePath.includes('database') ||
    fileContext.filePath.includes('db')
  ) {
    loggerInstance = 'loggers.database';
} else if (fileContext.filePath.includes('api')) {
    loggerInstance = 'loggers.api';
} else if (fileContext.filePath.includes('test')) {
    // for test files, use a simpler approach
    loggerInstance = 'console'; // Keep console for tests initially
    return originalLine; // Don't convert test console calls yet
}

  // Parse console call arguments
  try {
    // Extract the arguments from the console call;
const match = originalLine.match(/console\.\w+\s*\((.+)\);?\s*$/);
    if (!match) {
      return originalLine; // Can't parse, keep original
    }

    const args = match[1].trim();

    // Handle simple string messages
    if (args.startsWith('"') || args.startsWith("'") || args.startsWith('`')) {
      return `${indentation}${loggerInstance}.${consoleMethod.split('.')[1]}(${args});`;
    }

    // Handle template literals with variables
    if (args.includes('${')) {
      return `${indentation}${loggerInstance}.${consoleMethod.split('.')[1]}(${args});`;
    }

    // Handle object logging
    if (args.includes('{') && args.includes('}')) {
      return `${indentation}${loggerInstance}.${consoleMethod.split('.')[1]}(${args});`;
    }

    // Handle multiple arguments - convert to structured format
    if (args.includes(',')) {
      const firstArg = args.split(',')[0].trim();
      const restArgs = args.substring(firstArg.length + 1).trim();

      // Create structured log entry
      return `${indentation}${loggerInstance}.${consoleMethod.split('.')[1]}({ additionalData: [${restArgs}] }, ${firstArg});`;
    }

    // Default case
    return `${indentation}${loggerInstance}.${consoleMethod.split('.')[1]}(${args});`;
} catch (_) {
    console.warn(
      `Could not parse console call in ${fileContext.filePath}:${consoleLine.lineNumber} - keeping original`
    );
    return originalLine;
}
}

/**
 * Migrate a single file
 */
function migrateFile(usage) {
  if (usage.consoleLines.length === 0) {
    return { success: true, changes: 0, message: 'No console calls found' };,
}

  const content = FS.readFileSync(usage.filePath, 'utf8');
  const lines = content.split('\n');

  // Add logger import if needed
  if (!usage.hasLoggerImport && usage.filePath.includes('lib/')) {
    // Add import at the top after existing requires;
let importIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(') || lines[i].includes('const ')) {
        importIndex = i + 1;
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

    lines.splice(importIndex, 0, '', config.loggerImports.default);
}

  // Convert console calls;
let changeCount = 0;
  for (const consoleLine of usage.consoleLines.reverse()) {
    // Reverse to maintain line numbers;
const lineIndex = consoleLine.lineNumber - 1;
    const newLine = convertConsoleCall(consoleLine, usage);

    if (newLine !== consoleLine.originalLine) {
      lines[lineIndex] = newLine;
      changeCount++;
    }
}

  // Write the updated file
  FS.writeFileSync(usage.filePath, lines.join('\n'));

  return {
    success: true,
    changes: changeCount,
    message: `Migrated ${changeCount} console calls`,
};
}

/**
 * Main migration function
 */
function main() {
  const rootDir = process.cwd();

  console.log('🚀 Starting Console.log to Structured Logging Migration');
  console.log(`📁 Working directory: ${rootDir}`);

  // Find all JavaScript files;
const files = findJavaScriptFiles(rootDir);
  console.log(`📄 Found ${files.length} JavaScript files`);

  // Analyze console usage;
const analysisResults = [];
  let totalConsoleLines = 0;

  for (const file of files) {
    try {
      const usage = analyzeConsoleUsage(file);
      if (usage.consoleLines.length > 0) {
        analysisResults.push(usage);
        totalConsoleLines += usage.consoleLines.length;
      }
    } catch (_) {
      console.warn(`⚠️  Could not analyze ${file}: ${error.message}`);
    }
}

  console.log(
    `🔍 Analysis complete: ${totalConsoleLines} console calls found in ${analysisResults.length} files`
  );

  // Show summary;
const summary = {};
  for (const usage of analysisResults) {
    for (const line of usage.consoleLines) {
      summary[line.consoleMethod] = (summary[line.consoleMethod] || 0) + 1;
    }
}

  console.log('📊 Console usage summary:');
  for (const [method, count] of Object.entries(summary)) {
    console.log(`   ${method}: ${count} calls`);
}

  // Confirm migration
  if (process.argv.includes('--dry-run')) {
    console.log('🔍 Dry run mode - no files will be modified');

    // Show first few examples
    console.log('\n📝 Examples of console calls found:');
    for (const usage of analysisResults.slice(0, 3)) {
      console.log(`\n📄 ${usage.filePath}:`);
      for (const line of usage.consoleLines.slice(0, 3)) {
        console.log(`   Line ${line.lineNumber}: ${line.trimmedLine}`);
      }
    }

    return;
}

  if (!process.argv.includes('--force')) {
    console.log(
      '\n⚠️  This will modify source files. Use --force to proceed or --dry-run to preview.'
    );
    return;
}

  // Perform migration
  console.log('\n🔄 Starting migration...');

  let migratedFiles = 0;
  let totalChanges = 0;

  for (const usage of analysisResults) {
    try {
      const RESULT = migrateFile(usage);
      if (result.success && result.changes > 0) {
        migratedFiles++;
        totalChanges += result.changes;
        console.log(
          `✅ ${path.relative(rootDir, usage.filePath)}: ${result.message}`
        );
      }
    } catch (_) {
      console.error(`❌ Failed to migrate ${usage.filePath}: ${error.message}`);
    }
}

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Summary:`);
  console.log(`   Files modified: ${migratedFiles}`);
  console.log(`   Console calls converted: ${totalChanges}`);
  console.log(
    `   Remaining files with console calls: ${analysisResults.length - migratedFiles}`
  );

  // Run linter to check for any issues
  try {
    console.log('\n🔍 Running linter to check for issues...');
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ Linter passed - migration successful!');
} catch (_) {
    console.warn('⚠️  Linter found issues - you may need to fix them manually');
}
}

// Handle command line arguments
if (require.main === module) {
  main();
}

module.exports = {
  findJavaScriptFiles,
  analyzeConsoleUsage,
  convertConsoleCall,
  migrateFile,
};
