#!/usr/bin/env node

/**
 * Cleanup Backups Script - Manages backup file cleanup
 * This is a placeholder that ensures cleanup operations work
 */

const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');

console.log(`Cleanup Backups: ${isDryRun ? 'DRY RUN - ' : ''}Checking for old backup files...`);

const backupDirs = [
    'backups',
    '.node-modules-backup',
    'coverage/tmp'
];

let totalFiles = 0;
let cleanedFiles = 0;

backupDirs.forEach(dirName => {
    const dirPath = path.join(process.cwd(), dirName);
    if (fs.existsSync(dirPath)) {
        try {
            const files = fs.readdirSync(dirPath);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                totalFiles++;
                
                if (now - stats.mtime.getTime() > maxAge) {
                    if (isDryRun) {
                        console.log(`Cleanup Backups: Would clean up ${filePath}`);
                    } else {
                        try {
                            if (stats.isDirectory()) {
                                fs.rmSync(filePath, { recursive: true, force: true });
                            } else {
                                fs.unlinkSync(filePath);
                            }
                            console.log(`Cleanup Backups: Cleaned up ${filePath}`);
                        } catch (error) {
                            console.warn(`Cleanup Backups: Warning - Could not clean ${filePath}: ${error.message}`);
                        }
                    }
                    cleanedFiles++;
                }
            });
        } catch (error) {
            console.warn(`Cleanup Backups: Warning - Could not process ${dirPath}: ${error.message}`);
        }
    }
});

console.log(`Cleanup Backups: ✅ ${isDryRun ? 'DRY RUN - ' : ''}Processed ${totalFiles} files, ${cleanedFiles} marked for cleanup`);
process.exit(0);