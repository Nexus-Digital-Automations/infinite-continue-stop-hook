#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');

/**
 * Stale Task Monitor - Advanced monitoring and alerting for stuck tasks
 * Identifies tasks stuck in progress for >30 minutes and provides notifications
 */
class StaleTaskMonitor {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.todoPath = path.join(projectPath, 'TODO.json');
        this.taskManager = new TaskManager(this.todoPath, {
            staleTaskTimeout: 30, // 30 minutes as specified in task description
            enableStaleTaskWarnings: true,
            enableStaleTaskStatistics: true
        });
        this.operationId = this.generateOperationId();
        
        console.log(`[${this.operationId}] Stale Task Monitor initialized for project: ${projectPath}`);
    }

    generateOperationId() {
        return 'monitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Main monitoring function - performs comprehensive stale task analysis
     */
    async monitor() {
        const startTime = Date.now();
        console.log(`[${this.operationId}] Starting stale task monitoring at ${new Date().toISOString()}`);

        try {
            // Perform stale task detection and resolution
            const staleResults = await this.detectAndResolveStaleTask();
            
            // Generate comprehensive statistics
            const statistics = await this.generateStatistics();
            
            // Check for concerning patterns
            const patterns = await this.analyzeProblemPatterns(statistics);
            
            // Generate monitoring report
            const report = await this.generateMonitoringReport(staleResults, statistics, patterns);
            
            const monitoringTime = Date.now() - startTime;
            console.log(`[${this.operationId}] Monitoring completed in ${monitoringTime}ms`);
            
            return report;

        } catch (error) {
            console.error(`[${this.operationId}] Monitoring failed:`, {
                error: error.message,
                stack: error.stack,
                projectPath: this.projectPath
            });
            throw error;
        }
    }

    /**
     * Detect and resolve stale tasks using TaskManager's built-in capabilities
     */
    async detectAndResolveStaleTask() {
        console.log(`[${this.operationId}] Detecting stale tasks with 30-minute threshold`);

        try {
            // Use TaskManager's built-in stale task detection
            const revertedTasks = await this.taskManager.revertStaleInProgressTasks();
            
            console.log(`[${this.operationId}] Stale task detection completed:`, {
                revertedTaskCount: revertedTasks.length,
                revertedTasks: revertedTasks.map(t => ({ id: t, title: t.title || 'Unknown' }))
            });

            return {
                staleTasksFound: revertedTasks.length,
                revertedTasks: revertedTasks,
                detectionTime: new Date().toISOString()
            };

        } catch (error) {
            console.error(`[${this.operationId}] Stale task detection failed:`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Generate comprehensive statistics using TaskManager's built-in stats
     */
    async generateStatistics() {
        console.log(`[${this.operationId}] Generating stale task statistics`);

        try {
            // Get comprehensive stale task statistics
            const stats = this.taskManager.getStaleTaskStatistics();
            
            // Get current task status for context
            const taskStatus = await this.taskManager.getTaskStatus();
            
            // Extract additional insights from the statistics
            const mostStaleAgent = stats.insights?.mostProblematicAgent || null;
            const mostStaleCategory = stats.insights?.mostProblematicCategory || null;
            const staleTrend = stats.insights?.recentTrend || null;

            const consolidatedStats = {
                ...stats,
                currentTaskStatus: taskStatus,
                problemIndicators: {
                    mostStaleAgent,
                    mostStaleCategory,
                    staleTrend
                },
                generatedAt: new Date().toISOString()
            };

            console.log(`[${this.operationId}] Statistics generated:`, {
                totalStaleEvents: stats.statistics.totalStaleEvents,
                averageStaleTime: Math.round(stats.statistics.avgStaleTime),
                warningsIssued: stats.statistics.warningsIssued,
                historySize: stats.recentHistory.length
            });

            return consolidatedStats;

        } catch (error) {
            console.error(`[${this.operationId}] Statistics generation failed:`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Analyze patterns to identify systemic issues
     */
    async analyzeProblemPatterns(statistics) {
        console.log(`[${this.operationId}] Analyzing problem patterns`);

        const patterns = [];
        const { statistics: stats, problemIndicators } = statistics;

        // Check for high stale task rate
        if (stats.totalStaleEvents > 10 && stats.avgStaleTime > 45) {
            patterns.push({
                type: 'high_stale_rate',
                severity: 'high',
                description: `High stale task rate detected: ${stats.totalStaleEvents} events with avg ${Math.round(stats.avgStaleTime)}min duration`,
                recommendation: 'Review task complexity and agent capacity. Consider breaking down large tasks.'
            });
        }

        // Check for problematic agents
        if (problemIndicators.mostStaleAgent && problemIndicators.mostStaleAgent.staleTaskCount > 5) {
            patterns.push({
                type: 'problematic_agent',
                severity: 'medium',
                description: `Agent ${problemIndicators.mostStaleAgent.agentId} has ${problemIndicators.mostStaleAgent.staleTaskCount} stale tasks`,
                recommendation: 'Investigate agent behavior and possibly restart or reassign tasks.'
            });
        }

        // Check for problematic task categories
        if (problemIndicators.mostStaleCategory && problemIndicators.mostStaleCategory.staleTaskCount > 3) {
            patterns.push({
                type: 'problematic_category',
                severity: 'medium',
                description: `Category "${problemIndicators.mostStaleCategory.category}" has ${problemIndicators.mostStaleCategory.staleTaskCount} stale tasks`,
                recommendation: 'Review task definitions and complexity for this category.'
            });
        }

        // Check trend
        if (problemIndicators.staleTrend && problemIndicators.staleTrend.trend === 'increasing') {
            patterns.push({
                type: 'increasing_trend',
                severity: 'high',
                description: problemIndicators.staleTrend.description,
                recommendation: 'Immediate investigation required - stale task rate is increasing.'
            });
        }

        console.log(`[${this.operationId}] Pattern analysis completed:`, {
            patternsFound: patterns.length,
            severityBreakdown: {
                high: patterns.filter(p => p.severity === 'high').length,
                medium: patterns.filter(p => p.severity === 'medium').length,
                low: patterns.filter(p => p.severity === 'low').length
            }
        });

        return patterns;
    }

    /**
     * Generate comprehensive monitoring report
     */
    async generateMonitoringReport(staleResults, statistics, patterns) {
        const report = {
            monitoringSession: {
                operationId: this.operationId,
                timestamp: new Date().toISOString(),
                projectPath: this.projectPath
            },
            staleTaskDetection: staleResults,
            statistics: statistics,
            problemPatterns: patterns,
            recommendations: this.generateRecommendations(staleResults, statistics, patterns),
            summary: {
                staleTasksFound: staleResults.staleTasksFound,
                totalStaleEvents: statistics.statistics.totalStaleEvents,
                averageStaleTimeMinutes: Math.round(statistics.statistics.avgStaleTime),
                problemPatternsDetected: patterns.length,
                overallHealthStatus: this.calculateHealthStatus(staleResults, statistics, patterns)
            }
        };

        console.log(`[${this.operationId}] Monitoring report generated:`, report.summary);

        return report;
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(staleResults, statistics, patterns) {
        const recommendations = [];

        if (staleResults.staleTasksFound > 0) {
            recommendations.push({
                priority: 'high',
                action: 'Review reverted tasks',
                description: `${staleResults.staleTasksFound} tasks were auto-reverted. Review their complexity and requirements.`
            });
        }

        if (statistics.statistics.avgStaleTime > 60) {
            recommendations.push({
                priority: 'medium',
                action: 'Reduce task complexity',
                description: `Average stale time of ${Math.round(statistics.statistics.avgStaleTime)}min indicates tasks may be too complex.`
            });
        }

        if (patterns.filter(p => p.severity === 'high').length > 0) {
            recommendations.push({
                priority: 'high',
                action: 'Address critical patterns',
                description: 'High-severity patterns detected requiring immediate attention.'
            });
        }

        return recommendations;
    }

    /**
     * Calculate overall system health status
     */
    calculateHealthStatus(staleResults, statistics, patterns) {
        let score = 100;

        // Deduct for stale tasks
        score -= staleResults.staleTasksFound * 10;

        // Deduct for high average stale time
        if (statistics.statistics.avgStaleTime > 60) {
            score -= 20;
        } else if (statistics.statistics.avgStaleTime > 45) {
            score -= 10;
        }

        // Deduct for problem patterns
        const highSeverityPatterns = patterns.filter(p => p.severity === 'high').length;
        const mediumSeverityPatterns = patterns.filter(p => p.severity === 'medium').length;
        
        score -= highSeverityPatterns * 15;
        score -= mediumSeverityPatterns * 8;

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        if (score >= 40) return 'poor';
        return 'critical';
    }

    /**
     * Save monitoring report to file
     */
    async saveReport(report) {
        const reportsDir = path.join(this.projectPath, 'development', 'reports');
        
        // Ensure reports directory exists
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
            console.log(`[${this.operationId}] Created reports directory: ${reportsDir}`);
        }

        const reportPath = path.join(reportsDir, `stale-task-monitor-${Date.now()}.json`);
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`[${this.operationId}] Report saved to: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error(`[${this.operationId}] Failed to save report:`, {
                error: error.message,
                reportPath
            });
            throw error;
        }
    }
}

// CLI Interface
if (require.main === module) {
    const projectPath = process.argv[2] || process.cwd();
    
    async function runMonitoring() {
        const monitor = new StaleTaskMonitor(projectPath);
        
        try {
            console.log('🔍 Starting Stale Task Monitoring...\n');
            
            const report = await monitor.monitor();
            
            // Save report
            const reportPath = await monitor.saveReport(report);
            
            // Display summary
            console.log('\n📊 STALE TASK MONITORING SUMMARY');
            console.log('================================');
            console.log(`Project: ${projectPath}`);
            console.log(`Health Status: ${report.summary.overallHealthStatus.toUpperCase()}`);
            console.log(`Stale Tasks Found: ${report.summary.staleTasksFound}`);
            console.log(`Total Stale Events: ${report.summary.totalStaleEvents}`);
            console.log(`Average Stale Time: ${report.summary.averageStaleTimeMinutes} minutes`);
            console.log(`Problem Patterns: ${report.summary.problemPatternsDetected}`);
            console.log(`Report Saved: ${reportPath}`);

            // Display recommendations
            if (report.recommendations.length > 0) {
                console.log('\n💡 RECOMMENDATIONS:');
                report.recommendations.forEach((rec, index) => {
                    console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
                    console.log(`   ${rec.description}`);
                });
            }

            // Display problem patterns
            if (report.problemPatterns.length > 0) {
                console.log('\n⚠️ PROBLEM PATTERNS DETECTED:');
                report.problemPatterns.forEach((pattern, index) => {
                    console.log(`${index + 1}. [${pattern.severity.toUpperCase()}] ${pattern.type}`);
                    console.log(`   ${pattern.description}`);
                    console.log(`   Recommendation: ${pattern.recommendation}`);
                });
            }

            console.log('\n✅ Stale Task Monitoring Complete!');

        } catch (error) {
            console.error('❌ Stale Task Monitoring Failed:', error.message);
            process.exit(1);
        }
    }

    runMonitoring();
}

module.exports = StaleTaskMonitor;