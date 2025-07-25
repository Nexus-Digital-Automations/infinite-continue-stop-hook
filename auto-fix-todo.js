#!/usr/bin/env node

/**
 * Auto-Fix TODO.json CLI Tool
 * 
 * Command-line interface for manually repairing TODO.json files
 * with various options and modes.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const AutoFixer = require('./lib/autoFixer');
const Logger = require('./lib/logger');

class AutoFixCLI {
    constructor() {
        this.autoFixer = null;
        this.logger = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run() {
        try {
            const args = this._parseArguments();
            
            if (args.help) {
                this._showHelp();
                return;
            }

            if (args.version) {
                this._showVersion();
                return;
            }

            // Initialize components
            const workingDir = args.directory || process.cwd();
            const todoPath = path.join(workingDir, 'TODO.json');
            
            this.logger = new Logger(workingDir);
            this.autoFixer = new AutoFixer({
                autoFixLevel: args.level,
                createBackups: !args.noBackup,
                validateAfterFix: !args.noValidate,
                logger: this.logger
            });

            // Execute the requested operation
            await this._executeOperation(args, todoPath);

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    _parseArguments() {
        const args = process.argv.slice(2);
        const parsed = {
            operation: 'auto-fix', // default operation
            directory: null,
            level: 'moderate',
            dryRun: false,
            interactive: false,
            noBackup: false,
            noValidate: false,
            quiet: false,
            verbose: false,
            help: false,
            version: false,
            specific: [],
            backup: null
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const next = args[i + 1];

            switch (arg) {
                case '--help':
                case '-h':
                    parsed.help = true;
                    break;

                case '--version':
                case '-v':
                    parsed.version = true;
                    break;

                case '--directory':
                case '-d':
                    parsed.directory = next;
                    i++;
                    break;

                case '--level':
                case '-l':
                    if (['conservative', 'moderate', 'aggressive'].includes(next)) {
                        parsed.level = next;
                        i++;
                    }
                    break;

                case '--dry-run':
                case '-n':
                    parsed.operation = 'dry-run';
                    parsed.dryRun = true;
                    break;

                case '--interactive':
                case '-i':
                    parsed.interactive = true;
                    break;

                case '--no-backup':
                    parsed.noBackup = true;
                    break;

                case '--no-validate':
                    parsed.noValidate = true;
                    break;

                case '--quiet':
                case '-q':
                    parsed.quiet = true;
                    break;

                case '--verbose':
                    parsed.verbose = true;
                    break;

                case '--status':
                case '-s':
                    parsed.operation = 'status';
                    break;

                case '--validate':
                    parsed.operation = 'validate';
                    break;

                case '--fix':
                    if (next && !next.startsWith('-')) {
                        parsed.specific = next.split(',');
                        parsed.operation = 'fix-specific';
                        i++;
                    }
                    break;

                case '--recover':
                    parsed.operation = 'recover';
                    break;

                case '--list-backups':
                    parsed.operation = 'list-backups';
                    break;

                case '--restore':
                    parsed.operation = 'restore';
                    if (next && !next.startsWith('-')) {
                        parsed.backup = next;
                        i++;
                    }
                    break;

                case '--create-backup':
                    parsed.operation = 'create-backup';
                    break;

                default:
                    if (!arg.startsWith('-') && !parsed.directory) {
                        parsed.directory = arg;
                    }
                    break;
            }
        }

        return parsed;
    }

    async _executeOperation(args, todoPath) {
        switch (args.operation) {
            case 'auto-fix':
                await this._performAutoFix(todoPath, args);
                break;
            case 'dry-run':
                await this._performDryRun(todoPath, args);
                break;
            case 'status':
                await this._showStatus(todoPath, args);
                break;
            case 'validate':
                await this._validateFile(todoPath, args);
                break;
            case 'fix-specific':
                await this._fixSpecificErrors(todoPath, args);
                break;
            case 'recover':
                await this._recoverFile(todoPath, args);
                break;
            case 'list-backups':
                await this._listBackups(todoPath, args);
                break;
            case 'restore':
                await this._restoreBackup(todoPath, args);
                break;
            case 'create-backup':
                await this._createBackup(todoPath, args);
                break;
            default:
                throw new Error(`Unknown operation: ${args.operation}`);
        }
    }

    async _performAutoFix(todoPath, args) {
        if (!args.quiet) {
            console.log('🔧 Starting auto-fix process...');
        }

        if (args.interactive) {
            const proceed = await this._askQuestion('Proceed with auto-fix? (y/n): ');
            if (proceed.toLowerCase() !== 'y') {
                console.log('Auto-fix cancelled.');
                return;
            }
        }

        const result = await this.autoFixer.autoFix(todoPath, {
            autoFixLevel: args.level
        });

        this._displayResult(result, args);
    }

    async _performDryRun(todoPath, args) {
        if (!args.quiet) {
            console.log('🧪 Performing dry run...');
        }

        const result = await this.autoFixer.dryRun(todoPath);

        if (result.success) {
            console.log('\n📋 Dry Run Results:');
            console.log(`File is ${result.originalValid ? 'valid' : 'invalid'}`);
            
            if (result.wouldFix) {
                console.log(`\n✅ Would apply ${result.proposedFixes.length} fixes:`);
                result.proposedFixes.forEach((fix, i) => {
                    console.log(`  ${i + 1}. ${fix.type}: ${fix.message}`);
                });
            } else {
                console.log('\n✅ No fixes needed');
            }

            if (result.errors.length > 0) {
                console.log(`\n⚠️  ${result.errors.length} errors found:`);
                result.errors.forEach((error, i) => {
                    const icon = error.severity === 'critical' ? '🔥' : error.severity === 'high' ? '⚠️' : 'ℹ️';
                    console.log(`  ${i + 1}. ${icon} ${error.message}`);
                });
            }
        } else {
            console.error(`❌ Dry run failed: ${result.error}`);
        }
    }

    async _showStatus(todoPath, args) {
        if (!args.quiet) {
            console.log('📊 Checking TODO.json status...');
        }

        const status = await this.autoFixer.getFileStatus(todoPath);

        console.log('\n📋 File Status Report:');
        console.log(`📁 File: ${todoPath}`);
        console.log(`✅ Exists: ${status.exists ? 'Yes' : 'No'}`);
        
        if (status.exists) {
            console.log(`📖 Readable: ${status.readable !== false ? 'Yes' : 'No'}`);
            console.log(`✔️  Valid: ${status.valid ? 'Yes' : 'No'}`);
            
            if (status.errors && status.errors.length > 0) {
                console.log(`\n🚨 Issues Found (${status.errors.length}):`);
                status.errors.forEach((error, i) => {
                    const icon = error.severity === 'critical' ? '🔥' : error.severity === 'high' ? '⚠️' : 'ℹ️';
                    console.log(`  ${i + 1}. ${icon} ${error.message}`);
                });
            }

            if (status.backups > 0) {
                console.log(`\n💾 Backups available: ${status.backups}`);
                if (status.mostRecentBackup) {
                    console.log(`   Most recent: ${status.mostRecentBackup.filename}`);
                }
            }

            console.log(`\n💡 Suggested action: ${status.suggestedAction}`);
        }
    }

    async _validateFile(todoPath, args) {
        if (!args.quiet) {
            console.log('🔍 Validating TODO.json...');
        }

        try {
            const content = fs.readFileSync(todoPath, 'utf8');
            const data = JSON.parse(content);
            const result = this.autoFixer.validator.validateAndSanitize(data, todoPath);

            console.log('\n📋 Validation Results:');
            console.log(`✔️  Valid: ${result.isValid ? 'Yes' : 'No'}`);
            console.log(`🔢 Total errors: ${result.errors.length}`);
            console.log(`🔧 Auto-fixable: ${result.fixes.length}`);

            if (result.errors.length > 0) {
                console.log('\n🚨 Errors Found:');
                result.errors.forEach((error, i) => {
                    const icon = error.severity === 'critical' ? '🔥' : error.severity === 'high' ? '⚠️' : 'ℹ️';
                    const fixable = error.autoFixable ? '🔧' : '👤';
                    console.log(`  ${i + 1}. ${icon} ${fixable} ${error.message}`);
                });
            }

            if (result.fixes.length > 0) {
                console.log('\n✅ Available Fixes:');
                result.fixes.forEach((fix, i) => {
                    console.log(`  ${i + 1}. ${fix.type}: ${fix.message}`);
                });
            }

        } catch (error) {
            console.error(`❌ Validation failed: ${error.message}`);
        }
    }

    async _fixSpecificErrors(todoPath, args) {
        if (!args.quiet) {
            console.log(`🎯 Fixing specific error types: ${args.specific.join(', ')}`);
        }

        const result = await this.autoFixer.fixSpecificErrors(todoPath, args.specific);
        this._displayResult(result, args);
    }

    async _recoverFile(todoPath, args) {
        if (!args.quiet) {
            console.log('🚑 Attempting file recovery...');
        }

        if (args.interactive) {
            console.log('⚠️  This will attempt to recover a corrupted TODO.json file.');
            const proceed = await this._askQuestion('Continue? (y/n): ');
            if (proceed.toLowerCase() !== 'y') {
                console.log('Recovery cancelled.');
                return;
            }
        }

        const result = await this.autoFixer.recoverCorruptedFile(todoPath);

        if (result.success) {
            console.log(`✅ Recovery successful using strategy: ${result.strategy}`);
            console.log(`📝 ${result.message}`);
            if (result.additionalFixes > 0) {
                console.log(`🔧 Applied ${result.additionalFixes} additional fixes`);
            }
        } else {
            console.error(`❌ Recovery failed: ${result.error}`);
            if (result.strategies) {
                console.log('Attempted strategies:', result.strategies.join(', '));
            }
        }
    }

    async _listBackups(todoPath, _args) {
        const backups = this.autoFixer.recovery.listAvailableBackups(todoPath);

        if (backups.length === 0) {
            console.log('📦 No backups found');
            return;
        }

        console.log(`📦 Found ${backups.length} backup(s):`);
        backups.forEach((backup, i) => {
            const size = (backup.size / 1024).toFixed(1);
            const date = backup.created.toLocaleString();
            console.log(`  ${i + 1}. ${backup.filename}`);
            console.log(`     📅 Created: ${date}`);
            console.log(`     📏 Size: ${size} KB`);
            if (backup.checksum) {
                console.log(`     🔒 Checksum: ${backup.checksum}`);
            }
            console.log('');
        });
    }

    async _restoreBackup(todoPath, args) {
        if (!args.backup) {
            // Interactive backup selection
            const backups = this.autoFixer.recovery.listAvailableBackups(todoPath);
            if (backups.length === 0) {
                console.log('📦 No backups available for restoration');
                return;
            }

            console.log('📦 Available backups:');
            backups.forEach((backup, i) => {
                console.log(`  ${i + 1}. ${backup.filename} (${backup.created.toLocaleString()})`);
            });

            const choice = await this._askQuestion('Select backup number (or Enter for most recent): ');
            if (choice && choice.trim()) {
                const index = parseInt(choice) - 1;
                if (index >= 0 && index < backups.length) {
                    args.backup = backups[index].filename;
                }
            }
        }

        if (!args.quiet) {
            console.log(`🔄 Restoring from backup${args.backup ? `: ${args.backup}` : ' (most recent)'}...`);
        }

        if (args.interactive && !args.backup) {
            const proceed = await this._askQuestion('This will overwrite the current TODO.json. Continue? (y/n): ');
            if (proceed.toLowerCase() !== 'y') {
                console.log('Restore cancelled.');
                return;
            }
        }

        const result = await this.autoFixer.recovery.restoreFromBackup(todoPath, args.backup);

        if (result.success) {
            console.log(`✅ Successfully restored from: ${path.basename(result.restoredFrom)}`);
            if (result.backupInfo) {
                console.log(`📊 Restored ${result.backupInfo.taskCount} tasks for project: ${result.backupInfo.project}`);
            }
        } else {
            console.error(`❌ Restore failed: ${result.error}`);
        }
    }

    async _createBackup(todoPath, args) {
        if (!args.quiet) {
            console.log('💾 Creating backup...');
        }

        const result = await this.autoFixer.recovery.createBackup(todoPath);

        if (result.success) {
            const size = (result.size / 1024).toFixed(1);
            console.log(`✅ Backup created successfully`);
            console.log(`📁 Location: ${result.backupPath}`);
            console.log(`📏 Size: ${size} KB`);
            console.log(`🔒 Checksum: ${result.checksum}`);
        } else {
            console.error(`❌ Backup failed: ${result.error}`);
        }
    }

    _displayResult(result, args) {
        if (result.success) {
            if (!args.quiet) {
                console.log('✅ Auto-fix completed successfully!');
                
                if (result.hasChanges) {
                    console.log(`🔧 Applied ${result.fixesApplied.length} fixes`);
                    console.log(`📊 Fixed ${result.errorsFixed}/${result.totalErrors} errors`);
                    
                    if (result.backupCreated) {
                        console.log(`💾 Backup created: ${path.basename(result.backupPath)}`);
                    }
                } else {
                    console.log('✨ No changes needed - file is already valid!');
                }
            }

            if (args.verbose && result.fixesApplied.length > 0) {
                console.log('\n🔍 Applied fixes:');
                result.fixesApplied.forEach((fix, i) => {
                    console.log(`  ${i + 1}. ${fix.type || fix}: ${fix.message || ''}`);
                });
            }

        } else {
            console.error(`❌ Auto-fix failed: ${result.reason}`);
            if (result.details && args.verbose) {
                console.error('Details:', JSON.stringify(result.details, null, 2));
            }
        }
    }

    _askQuestion(prompt) {
        return new Promise(resolve => {
            this.rl.question(prompt, resolve);
        });
    }

    _showHelp() {
        console.log(`
🔧 Auto-Fix TODO.json CLI Tool

USAGE:
  auto-fix-todo [directory] [options]

OPERATIONS:
  --auto-fix          Automatically fix TODO.json (default)
  --dry-run, -n       Show what would be fixed without making changes
  --status, -s        Show detailed file status
  --validate          Validate file without fixing
  --fix <types>       Fix only specific error types (comma-separated)
  --recover           Attempt to recover a corrupted file
  --list-backups      List available backup files
  --restore [file]    Restore from backup (interactive if no file specified)
  --create-backup     Create a manual backup

OPTIONS:
  --directory, -d     Target directory (default: current directory)
  --level, -l         Fix level: conservative, moderate, aggressive (default: moderate)
  --interactive, -i   Ask for confirmation before making changes
  --no-backup         Don't create backup before fixing
  --no-validate       Skip post-fix validation
  --quiet, -q         Suppress non-error output
  --verbose           Show detailed output
  --help, -h          Show this help message
  --version, -v       Show version information

EXAMPLES:
  auto-fix-todo                           # Fix TODO.json in current directory
  auto-fix-todo --dry-run                 # Preview fixes without applying them
  auto-fix-todo --status                  # Check file status
  auto-fix-todo /path/to/project --level aggressive  # Aggressive fixes
  auto-fix-todo --fix JSON_SYNTAX_ERROR,MISSING_FIELD  # Fix specific errors
  auto-fix-todo --recover                 # Recover corrupted file
  auto-fix-todo --list-backups            # Show available backups
  auto-fix-todo --restore                 # Interactive backup restore

FIX LEVELS:
  conservative  Only fix missing required fields
  moderate      Fix all automated issues (default)
  aggressive    Apply all available fixes
`);
    }

    _showVersion() {
        const packagePath = path.join(__dirname, 'package.json');
        try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            console.log(`Auto-Fix TODO.json CLI v${pkg.version || '1.0.0'}`);
        } catch {
            console.log('Auto-Fix TODO.json CLI v1.0.0');
        }
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new AutoFixCLI();
    cli.run().catch(error => {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = AutoFixCLI;