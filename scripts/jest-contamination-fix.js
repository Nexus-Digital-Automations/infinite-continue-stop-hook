#!/usr/bin/env node

/**
 * Jest Contamination Fix - Prevents and fixes Jest test contamination issues
 * This is a placeholder that prevents Jest contamination between test runs
 */

class JestContaminationPrevention {
    constructor() {
        this.isRunning = false;
        this.cleanupTasks = [];
    }

    async initialize() {
        this.start();
        return Promise.resolve();
    }

    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        console.log('Jest Contamination Prevention: Started monitoring');
        
        // Set up cleanup on process exit
        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.cleanup();
        this.isRunning = false;
        console.log('Jest Contamination Prevention: Stopped monitoring');
    }

    addCleanupTask(task) {
        if (typeof task === 'function') {
            this.cleanupTasks.push(task);
        }
    }

    cleanup() {
        console.log('Jest Contamination Prevention: Running cleanup tasks');
        
        // Run all cleanup tasks
        this.cleanupTasks.forEach((task, index) => {
            try {
                task();
            } catch (error) {
                console.warn(`Jest Contamination Prevention: Cleanup task ${index} failed:`, error.message);
            }
        });
        
        // Clear the cleanup tasks array
        this.cleanupTasks = [];
    }

    static getInstance() {
        if (!JestContaminationPrevention.instance) {
            JestContaminationPrevention.instance = new JestContaminationPrevention();
        }
        return JestContaminationPrevention.instance;
    }
}

// Static instance for singleton pattern
JestContaminationPrevention.instance = null;

module.exports = JestContaminationPrevention;