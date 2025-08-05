#!/usr/bin/env node

/**
 * Jest Contamination Prevention System
 * 
 * This script provides real-time protection against JSON contamination
 * that occurs during Jest exit process
 */

const fs = require('fs');
const path = require('path');
const ContaminationResolver = require('../lib/contaminationResolver');

class JestContaminationPrevention {
    constructor() {
        this.resolver = new ContaminationResolver();
        this.monitorInterval = null;
        this.exitHandlersRegistered = false;
    }

    async initialize() {
        console.log('🛡️ Initializing Jest contamination prevention system...');
        
        // Store original contents immediately
        await this.resolver.storeOriginalContents();
        
        // Start continuous monitoring
        await this.setupContinuousMonitoring();
        
        // Register exit handlers for emergency cleanup
        this.registerExitHandlers();
        
        console.log('✅ Jest contamination prevention system active');
    }

    async setupContinuousMonitoring() {
        // Check every 50ms for very fast detection and resolution
        this.monitorInterval = setInterval(async () => {
            try {
                const contaminated = await this.resolver.detectContamination();
                if (contaminated.length > 0) {
                    console.log(`🚨 Real-time contamination detected! Fixing ${contaminated.length} files...`);
                    await this.resolver.restoreContaminatedFiles();
                    console.log(`✅ Real-time fix completed`);
                }
            } catch (error) {
                // Silent fail to prevent breaking the main process
                if (process.env.VERBOSE_CONTAMINATION_DEBUG) {
                    console.warn('Monitoring error:', error.message);
                }
            }
        }, 50);
    }

    registerExitHandlers() {
        if (this.exitHandlersRegistered) return;
        
        const emergencyCleanup = () => {
            try {
                if (this.monitorInterval) {
                    clearInterval(this.monitorInterval);
                }
                
                // Synchronous emergency restoration
                this.resolver.criticalFiles.forEach(file => {
                    const fullPath = path.join(this.resolver.projectRoot, file);
                    if (fs.existsSync(fullPath)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            if (!this.resolver.isValidJavaScript(content)) {
                                const originalContent = this.resolver.originalContents.get(fullPath);
                                if (originalContent) {
                                    fs.writeFileSync(fullPath, originalContent, 'utf8');
                                    if (process.env.VERBOSE_CONTAMINATION_DEBUG) {
                                        console.log(`🚑 Emergency restored: ${file}`);
                                    }
                                } else {
                                    // Use known good content
                                    this.resolver.restoreFromKnownGood(fullPath, file);
                                }
                            }
                        } catch {
                            // Silent fail during exit cleanup
                        }
                    }
                });
            } catch {
                // Silent fail during exit
            }
        };

        // Register for all possible exit scenarios
        process.on('exit', emergencyCleanup);
        process.on('SIGINT', () => {
            emergencyCleanup();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            emergencyCleanup();
            process.exit(0);
        });
        process.on('uncaughtException', (error) => {
            emergencyCleanup();
            console.error('Uncaught exception after contamination cleanup:', error.message);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            emergencyCleanup();
            console.error('Unhandled rejection after contamination cleanup:', reason);
            process.exit(1);
        });

        this.exitHandlersRegistered = true;
    }

    async stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        // Final cleanup check
        const contaminated = await this.resolver.detectContamination();
        if (contaminated.length > 0) {
            console.log(`🧹 Final cleanup: fixing ${contaminated.length} files...`);
            await this.resolver.restoreContaminatedFiles();
        }
        
        console.log('✅ Jest contamination prevention system stopped');
    }
}

// If running as main script
if (require.main === module) {
    const prevention = new JestContaminationPrevention();
    prevention.initialize().catch(error => {
        console.error('❌ Failed to initialize contamination prevention:', error.message);
        process.exit(1);
    });

    // Keep the script running
    process.stdin.resume();
}

module.exports = JestContaminationPrevention;