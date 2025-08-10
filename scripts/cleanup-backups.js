#!/usr/bin/env node

/**
 * Jest Haste Map Collision Cleanup Script
 * 
 * Removes old backup directories to prevent Jest haste map naming conflicts.
 * Keeps only the most recent N backups (configurable).
 */

const fs = require('fs');
const path = require('path');

class BackupCleanup {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.backupDir = path.join(this.projectRoot, '.node-modules-backup');
        this.maxBackups = options.maxBackups || 2; // Keep only 2 most recent backups
        this.dryRun = options.dryRun || false;
    }

    async cleanup() {
        console.log('🧹 Jest Haste Map Collision Cleanup');
        console.log('====================================');
        
        if (!fs.existsSync(this.backupDir)) {
            console.log('✅ No backup directory found. Nothing to clean up.');
            return { removed: 0, kept: 0 };
        }

        const backups = this.getBackupDirectories();
        console.log(`📁 Found ${backups.length} backup directories`);

        if (backups.length <= this.maxBackups) {
            console.log(`✅ Only ${backups.length} backups found (limit: ${this.maxBackups}). No cleanup needed.`);
            return { removed: 0, kept: backups.length };
        }

        // Sort backups by timestamp (newest first)
        const sortedBackups = backups.sort((a, b) => {
            const dateA = this.parseTimestamp(a);
            const dateB = this.parseTimestamp(b);
            return dateB - dateA;
        });

        const backupsToKeep = sortedBackups.slice(0, this.maxBackups);
        const backupsToRemove = sortedBackups.slice(this.maxBackups);

        console.log(`🔒 Keeping ${backupsToKeep.length} most recent backups:`);
        backupsToKeep.forEach(backup => {
            const date = this.parseTimestamp(backup);
            console.log(`   • ${backup} (${date.toISOString()})`);
        });

        console.log(`🗑️ Removing ${backupsToRemove.length} old backups:`);
        let removedCount = 0;

        for (const backup of backupsToRemove) {
            const backupPath = path.join(this.backupDir, backup);
            const date = this.parseTimestamp(backup);
            
            if (this.dryRun) {
                console.log(`   [DRY RUN] Would remove: ${backup} (${date.toISOString()})`);
            } else {
                try {
                    fs.rmSync(backupPath, { recursive: true, force: true });
                    console.log(`   ✅ Removed: ${backup} (${date.toISOString()})`);
                    removedCount++;
                } catch (error) {
                    console.warn(`   ⚠️ Failed to remove ${backup}: ${error.message}`);
                }
            }
        }

        // Clean up empty backup directory if no backups remain
        const remainingBackups = this.getBackupDirectories();
        if (remainingBackups.length === 0) {
            if (this.dryRun) {
                console.log(`   [DRY RUN] Would remove empty backup directory`);
            } else {
                try {
                    fs.rmdirSync(this.backupDir);
                    console.log(`   ✅ Removed empty backup directory`);
                } catch (error) {
                    console.warn(`   ⚠️ Failed to remove empty backup directory: ${error.message}`);
                }
            }
        }

        const summary = { 
            removed: this.dryRun ? 0 : removedCount, 
            kept: backupsToKeep.length,
            dryRun: this.dryRun
        };

        console.log('\n📊 Cleanup Summary:');
        console.log(`   • Backups removed: ${summary.removed}`);
        console.log(`   • Backups kept: ${summary.kept}`);
        if (this.dryRun) {
            console.log(`   • Mode: DRY RUN (no changes made)`);
        }

        console.log('\n🎉 Jest haste map collision cleanup completed!');
        return summary;
    }

    getBackupDirectories() {
        try {
            return fs.readdirSync(this.backupDir)
                .filter(item => {
                    const itemPath = path.join(this.backupDir, item);
                    return fs.statSync(itemPath).isDirectory() && this.isTimestampDirectory(item);
                });
        } catch (error) {
            console.warn(`Warning: Could not read backup directory: ${error.message}`);
            return [];
        }
    }

    isTimestampDirectory(name) {
        // Check if directory name matches ISO timestamp format with dashes
        // Example: 2025-08-10T21-49-39.925Z
        const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/;
        return timestampPattern.test(name);
    }

    parseTimestamp(backupName) {
        try {
            // Convert backup directory name to valid ISO timestamp
            // 2025-08-10T21-49-39.925Z -> 2025-08-10T21:49:39.925Z
            const isoString = backupName.replace(/T(\d{2})-(\d{2})-(\d{2})\./, 'T$1:$2:$3.');
            return new Date(isoString);
        } catch {
            console.warn(`Warning: Could not parse timestamp from ${backupName}`);
            return new Date(0); // Fallback to epoch time
        }
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-d');
    const maxBackups = parseInt(args.find(arg => arg.startsWith('--max-backups='))?.split('=')[1]) || 2;
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Jest Haste Map Collision Cleanup Script

Usage:
  node scripts/cleanup-backups.js [options]

Options:
  --dry-run, -d           Show what would be removed without making changes
  --max-backups=N         Keep N most recent backups (default: 2)
  --help, -h              Show this help message

Examples:
  node scripts/cleanup-backups.js                    # Clean up keeping 2 backups
  node scripts/cleanup-backups.js --dry-run          # Preview cleanup without changes
  node scripts/cleanup-backups.js --max-backups=3    # Keep 3 most recent backups
`);
        process.exit(0);
    }

    const cleanup = new BackupCleanup({ maxBackups, dryRun });
    cleanup.cleanup()
        .then(result => {
            const exitCode = result.dryRun ? 0 : (result.removed >= 0 ? 0 : 1);
            process.exit(exitCode);
        })
        .catch(error => {
            console.error(`💥 Cleanup failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = BackupCleanup;