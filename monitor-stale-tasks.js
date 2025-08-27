#!/usr/bin/env node

/**
 * Simple wrapper script for stale task monitoring
 * Usage: node monitor-stale-tasks.js [project-path]
 */

// const path = require('path'); // Removed - not used in this simple wrapper
const StaleTaskMonitor = require('./stale-task-monitor');

async function main() {
    const projectPath = process.argv[2] || process.cwd();
    
    console.log(`🔍 Monitoring stale tasks for: ${projectPath}\n`);
    
    const monitor = new StaleTaskMonitor(projectPath);
    const report = await monitor.monitor();
    
    // Quick summary output
    const summary = report.summary;
    const statusEmoji = {
        'excellent': '✅',
        'good': '😊', 
        'fair': '⚠️',
        'poor': '😞',
        'critical': '🚨'
    };

    console.log(`\n${statusEmoji[summary.overallHealthStatus]} Status: ${summary.overallHealthStatus.toUpperCase()}`);
    
    if (summary.staleTasksFound > 0) {
        console.log(`🔄 ${summary.staleTasksFound} stale tasks auto-reverted`);
    }
    
    if (summary.problemPatternsDetected > 0) {
        console.log(`⚠️ ${summary.problemPatternsDetected} problem patterns detected`);
    } else {
        console.log(`✅ No problem patterns detected`);
    }
    
    await monitor.saveReport(report);
    console.log(`📄 Full report saved to development/reports/`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Monitoring failed:', error.message);
        process.exit(1);
    });
}