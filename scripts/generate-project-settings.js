
/**
 * Claude Code Project Settings Generator
 *
 * Generates project-specific .claude/settings.json with relative path stop hook.
 * Copies stop-hook.js to project root for self-contained, cloud-compatible setup.
 *
 * Usage:
 *   node generate-project-settings.js [options]
 *
 * Options:
 *   --force           Overwrite existing files
 *   --minimal         Minimal settings (no global inheritance)
 *   --no-copy-hook    Don't copy stop-hook.js (use existing)
 *   --project-root    Target project directory (default: cwd)
 *
 * @generated-by: infinite-continue-stop-hook
 * @version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const logger = require('../lib/logger');

// Configuration
const GLOBAL_SETTINGS_PATH = path.join(process.env.HOME, '.claude', 'settings.json');
const HOOK_SOURCE_PATH = path.join(__dirname, '..', 'stop-hook.js');
const GENERATOR_VERSION = '1.0.0';
const INFINITE_HOOK_VERSION = require('../package.json').version;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    force: false,
    minimal: false,
    copyHook: true,
    projectRoot: process.cwd(),
    batchDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--force':
        options.force = true;
        break;
      case '--minimal':
        options.minimal = true;
        break;
      case '--no-copy-hook':
        options.copyHook = false;
        break;
      case '--project-root':
        options.projectRoot = args[++i];
        break;
      case '--batch-dir':
        options.batchDir = args[++i];
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        logger.error('Unknown argument:', arg);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Claude Code Project Settings Generator v${GENERATOR_VERSION}

Usage: node generate-project-settings.js [options]

Options:
  --force           Overwrite existing files
  --minimal         Minimal settings (no global inheritance)
  --no-copy-hook    Don't copy stop-hook.js (use existing)
  --project-root    Target project directory (default: current directory)
  --batch-dir       Process all projects in specified directory
  -h, --help        Show this help message

Examples:
  # Generate settings for current project
  node generate-project-settings.js

  # Generate with overwrite
  node generate-project-settings.js --force

  # Minimal settings (no global inheritance)
  node generate-project-settings.js --minimal

  # Use existing stop-hook.js (don't copy)
  node generate-project-settings.js --no-copy-hook

  # Process all projects in Claude Coding Projects directory
  node generate-project-settings.js --batch-dir "/Users/jeremyparker/Desktop/Claude Coding Projects"

  # Batch process with force overwrite
  node generate-project-settings.js --batch-dir "/Users/jeremyparker/Desktop/Claude Coding Projects" --force
`);
}

/**
 * Read global settings as template
 */
function readGlobalSettings() {
  const startTime = Date.now();
  logger.info('Reading global settings', {
    function: 'readGlobalSettings',
    path: GLOBAL_SETTINGS_PATH,
  });

  try {
    if (!fs.existsSync(GLOBAL_SETTINGS_PATH)) {
      logger.warn('Global settings not found, using defaults', {
        function: 'readGlobalSettings',
        path: GLOBAL_SETTINGS_PATH,
      });
      return null;
    }

    const content = fs.readFileSync(GLOBAL_SETTINGS_PATH, 'utf8');
    const settings = JSON.parse(content);

    logger.info('Global settings loaded successfully', {
      function: 'readGlobalSettings',
      duration: Date.now() - startTime,
      hasEnv: !!settings.env,
      hasPermissions: !!settings.permissions,
      hasHooks: !!settings.hooks,
    });

    return settings;
  } catch (error) {
    logger.error('Failed to read global settings', {
      function: 'readGlobalSettings',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to read global settings: ${error.message}`);
  }
}

/**
 * Copy stop-hook.js to project root
 */
function copyStopHook(projectRoot, force) {
  const startTime = Date.now();
  const targetPath = path.join(projectRoot, 'stop-hook.js');

  logger.info('Copying stop-hook.js to project', {
    function: 'copyStopHook',
    source: HOOK_SOURCE_PATH,
    target: targetPath,
  });

  try {
    // Check if source exists
    if (!fs.existsSync(HOOK_SOURCE_PATH)) {
      throw new Error(`Stop hook source not found: ${HOOK_SOURCE_PATH}`);
    }

    // Check if target already exists
    if (fs.existsSync(targetPath) && !force) {
      logger.warn('stop-hook.js already exists (use --force to overwrite)', {
        function: 'copyStopHook',
        path: targetPath,
      });
      return false;
    }

    // Read source, add generation metadata
    let hookContent = fs.readFileSync(HOOK_SOURCE_PATH, 'utf8');

    // Add metadata header
    const metadata = `/**
 * @generated-from: infinite-continue-stop-hook v${INFINITE_HOOK_VERSION}
 * @generated-on: ${new Date().toISOString()}
 * @generator-version: ${GENERATOR_VERSION}
 *
 * This file was auto-generated by generate-project-settings.js
 * To update: re-run the generator with --force flag
 */

`;

    hookContent = metadata + hookContent;

    // Write to target
    fs.writeFileSync(targetPath, hookContent, 'utf8');

    // Make executable (chmod +x)
    fs.chmodSync(targetPath, 0o755);

    logger.info('stop-hook.js copied successfully', {
      function: 'copyStopHook',
      duration: Date.now() - startTime,
      path: targetPath,
      size: hookContent.length,
    });

    return true;
  } catch (error) {
    logger.error('Failed to copy stop-hook.js', {
      function: 'copyStopHook',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to copy stop-hook.js: ${error.message}`);
  }
}

/**
 * Generate project settings
 */
function generateSettings(projectRoot, globalSettings, minimal) {
  const startTime = Date.now();
  logger.info('Generating project settings', {
    function: 'generateSettings',
    projectRoot,
    minimal,
  });

  try {
    const settings = {
      $schema: 'https://json.schemastore.org/claude-code-settings.json',
      $generated: {
        version: GENERATOR_VERSION,
        timestamp: new Date().toISOString(),
        generator: 'infinite-continue-stop-hook/scripts/generate-project-settings.js',
        hookStrategy: 'relative-path',
        infiniteHookVersion: INFINITE_HOOK_VERSION,
      },
    };

    // Add environment variables (inherit from global unless minimal)
    if (!minimal && globalSettings?.env) {
      settings.env = { ...globalSettings.env };
    } else {
      settings.env = {
        BASH_DEFAULT_TIMEOUT_MS: '300000',
        BASH_MAX_TIMEOUT_MS: '300000',
        CLAUDE_CODE_DISABLE_TELEMETRY: '1',
        CLAUDE_CODE_SECURE_MODE: '1',
        NODE_OPTIONS: '--max-old-space-size=8192',
      };
    }

    // Add permissions reference (inherit from global unless minimal)
    if (!minimal && globalSettings?.permissions) {
      settings.permissions = {
        $inherited: GLOBAL_SETTINGS_PATH,
        ...globalSettings.permissions,
      };
    }

    // Add stop hook with RELATIVE PATH
    settings.hooks = {
      Stop: [{
        matcher: '',
        hooks: [{
          type: 'command',
          command: 'node ./stop-hook.js',  // RELATIVE PATH!
          timeout: 10000,
        }],
      }],
    };

    // Add feature flags
    settings.alwaysThinkingEnabled = true;

    logger.info('Project settings generated', {
      function: 'generateSettings',
      duration: Date.now() - startTime,
      hasEnv: !!settings.env,
      hasPermissions: !!settings.permissions,
      hookCommand: settings.hooks.Stop[0].hooks[0].command,
    });

    return settings;
  } catch (error) {
    logger.error('Failed to generate settings', {
      function: 'generateSettings',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to generate settings: ${error.message}`);
  }
}

/**
 * Write settings to .claude/settings.json
 */
function writeSettings(projectRoot, settings, force) {
  const startTime = Date.now();
  const claudeDir = path.join(projectRoot, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');

  logger.info('Writing project settings', {
    function: 'writeSettings',
    path: settingsPath,
  });

  try {
    // Create .claude directory if it doesn't exist
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
      logger.info('.claude directory created', {
        function: 'writeSettings',
        path: claudeDir,
      });
    }

    // Check if settings already exist
    if (fs.existsSync(settingsPath) && !force) {
      logger.warn('settings.json already exists (use --force to overwrite)', {
        function: 'writeSettings',
        path: settingsPath,
      });
      return false;
    }

    // Write settings
    const content = JSON.stringify(settings, null, 2);
    fs.writeFileSync(settingsPath, content, 'utf8');

    // Validate JSON
    JSON.parse(content);

    logger.info('Project settings written successfully', {
      function: 'writeSettings',
      duration: Date.now() - startTime,
      path: settingsPath,
      size: content.length,
    });

    return true;
  } catch (error) {
    logger.error('Failed to write settings', {
      function: 'writeSettings',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to write settings: ${error.message}`);
  }
}

/**
 * Validate project structure
 */
function validateProject(projectRoot) {
  const startTime = Date.now();
  logger.info('Validating project structure', {
    function: 'validateProject',
    projectRoot,
  });

  try {
    // Check if directory exists
    if (!fs.existsSync(projectRoot)) {
      throw new Error(`Project root does not exist: ${projectRoot}`);
    }

    // Check if it's a directory
    const stats = fs.statSync(projectRoot);
    if (!stats.isDirectory()) {
      throw new Error(`Project root is not a directory: ${projectRoot}`);
    }

    // Check for TASKS.json (recommended but not required)
    const tasksPath = path.join(projectRoot, 'TASKS.json');
    const hasTasksJson = fs.existsSync(tasksPath);

    if (!hasTasksJson) {
      logger.warn('TASKS.json not found - is this a Claude Code project?', {
        function: 'validateProject',
        projectRoot,
        tasksPath,
      });
    }

    logger.info('Project validation complete', {
      function: 'validateProject',
      duration: Date.now() - startTime,
      hasTasksJson,
    });

    return { valid: true, hasTasksJson };
  } catch (error) {
    logger.error('Project validation failed', {
      function: 'validateProject',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Process a single project - generate settings and copy hook
 */
function processSingleProject(projectRoot, globalSettings, options) {
  const startTime = Date.now();
  const projectName = path.basename(projectRoot);

  logger.info('Processing single project', {
    function: 'processSingleProject',
    projectRoot,
    projectName,
  });

  try {
    // Validate project
    const validation = validateProject(projectRoot);

    // Copy stop-hook.js if requested
    let hookCopied = false;
    if (options.copyHook) {
      hookCopied = copyStopHook(projectRoot, options.force);
    }

    // Generate settings
    const settings = generateSettings(projectRoot, globalSettings, options.minimal);

    // Write settings
    const settingsWritten = writeSettings(projectRoot, settings, options.force);

    logger.info('Project processed successfully', {
      function: 'processSingleProject',
      duration: Date.now() - startTime,
      projectName,
      hookCopied,
      settingsWritten,
    });

    return {
      success: true,
      projectName,
      projectRoot,
      hookCopied,
      settingsWritten,
      hasTasksJson: validation.hasTasksJson,
    };
  } catch (error) {
    logger.error('Failed to process project', {
      function: 'processSingleProject',
      duration: Date.now() - startTime,
      projectName,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      projectName,
      projectRoot,
      error: error.message,
    };
  }
}

/**
 * Process all projects in a directory (batch mode)
 */
function processBatchDirectory(batchDir, globalSettings, options) {
  const startTime = Date.now();
  logger.info('Starting batch processing', {
    function: 'processBatchDirectory',
    batchDir,
  });

  try {
    // Validate batch directory exists
    if (!fs.existsSync(batchDir)) {
      throw new Error(`Batch directory does not exist: ${batchDir}`);
    }

    const stats = fs.statSync(batchDir);
    if (!stats.isDirectory()) {
      throw new Error(`Batch path is not a directory: ${batchDir}`);
    }

    // Read all subdirectories
    const entries = fs.readdirSync(batchDir, { withFileTypes: true });
    const projectDirs = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.'))  // Skip hidden directories
      .filter(entry => entry.name !== 'node_modules')  // Skip node_modules
      .map(entry => path.join(batchDir, entry.name));

    logger.info('Found project directories', {
      function: 'processBatchDirectory',
      batchDir,
      count: projectDirs.length,
      projects: projectDirs.map(d => path.basename(d)),
    });

    // Process each project
    const results = [];
    for (const projectDir of projectDirs) {
      console.log(`\nProcessing: ${path.basename(projectDir)}...`);
      const result = processSingleProject(projectDir, globalSettings, options);
      results.push(result);
    }

    // Generate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    logger.info('Batch processing complete', {
      function: 'processBatchDirectory',
      duration: Date.now() - startTime,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
    });

    return {
      total: results.length,
      successful,
      failed,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Batch processing failed', {
      function: 'processBatchDirectory',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  logger.info('Starting project settings generator', {
    function: 'main',
    version: GENERATOR_VERSION,
  });

  try {
    // Parse arguments
    const options = parseArgs();

    logger.info('Options parsed', {
      function: 'main',
      options,
    });

    // Read global settings
    const globalSettings = options.minimal ? null : readGlobalSettings();

    // Check if batch mode
    if (options.batchDir) {
      // BATCH MODE - Process all projects in directory
      console.log(`\n📦 Batch Processing Mode\n`);
      console.log(`Directory: ${options.batchDir}\n`);
      console.log('═'.repeat(60));

      const batchResults = processBatchDirectory(options.batchDir, globalSettings, options);

      // Print summary
      console.log('\n' + '═'.repeat(60));
      console.log(`\n📊 Batch Processing Summary\n`);
      console.log(`Total Projects: ${batchResults.total}`);
      console.log(`✅ Successful: ${batchResults.successful.length}`);
      console.log(`❌ Failed: ${batchResults.failed.length}`);
      console.log(`⏱️  Duration: ${(batchResults.duration / 1000).toFixed(2)}s\n`);

      if (batchResults.successful.length > 0) {
        console.log('✅ Successfully Processed:');
        for (const result of batchResults.successful) {
          const flags = [];
          if (result.hookCopied) {flags.push('hook copied');}
          if (result.settingsWritten) {flags.push('settings created');}
          const flagStr = flags.length > 0 ? ` (${flags.join(', ')})` : '';
          console.log(`   ✓ ${result.projectName}${flagStr}`);
        }
        console.log('');
      }

      if (batchResults.failed.length > 0) {
        console.log('❌ Failed Projects:');
        for (const result of batchResults.failed) {
          console.log(`   ✗ ${result.projectName}: ${result.error}`);
        }
        console.log('');
      }

      console.log('Next steps for each project:');
      console.log('  cd <project-directory>');
      console.log('  git add .claude/settings.json stop-hook.js');
      console.log('  git commit -m "Add Claude Code project configuration"');
      console.log('\nAll configurations use RELATIVE PATHS and are cloud-compatible! 🚀\n');

      process.exit(batchResults.failed.length > 0 ? 1 : 0);
    } else {
      // SINGLE PROJECT MODE
      // Validate project
      const validation = validateProject(options.projectRoot);

      // Copy stop-hook.js if requested
      let hookCopied = false;
      if (options.copyHook) {
        hookCopied = copyStopHook(options.projectRoot, options.force);
      }

      // Generate settings
      const settings = generateSettings(options.projectRoot, globalSettings, options.minimal);

      // Write settings
      const settingsWritten = writeSettings(options.projectRoot, settings, options.force);

      // Summary
      logger.info('Project settings generation complete', {
        function: 'main',
        duration: Date.now() - startTime,
        projectRoot: options.projectRoot,
        hookCopied,
        settingsWritten,
        hasTasksJson: validation.hasTasksJson,
      });

      console.log('\n✅ Project settings generated successfully!\n');
      console.log(`Project: ${options.projectRoot}`);
      if (hookCopied) {
        console.log('✅ stop-hook.js copied to project root');
      } else {
        console.log('ℹ️  stop-hook.js not copied (already exists or --no-copy-hook)');
      }
      if (settingsWritten) {
        console.log('✅ .claude/settings.json created with relative path');
      } else {
        console.log('ℹ️  .claude/settings.json not created (already exists)');
      }
      console.log('\nNext steps:');
      console.log('  git add .claude/settings.json stop-hook.js');
      console.log('  git commit -m "Add Claude Code project configuration"');
      console.log('\nConfiguration uses RELATIVE PATH and is cloud-compatible! 🚀\n');

      process.exit(0);
    }
  } catch (error) {
    logger.error('Project settings generation failed', {
      function: 'main',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack,
    });

    console.error('\n❌ Failed to generate project settings\n');
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes('TASKS.json')) {
      console.error('⚠️  Warning: This may not be a Claude Code project.');
      console.error('   Continue anyway? Re-run with --force\n');
    }

    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { generateSettings, copyStopHook, writeSettings };
