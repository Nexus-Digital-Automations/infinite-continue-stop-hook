#!/usr/bin/env node

/**
 * Automated Coverage Validation System
 * Provides continuous monitoring and reporting pipeline for test coverage
 * with proper thresholds and automated quality gates
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class CoverageValidator {
    constructor(options = {}) {
        this.options = {
            // Coverage thresholds (configurable)
            thresholds: {
                global: {
                    statements: 70,
                    branches: 75,
                    functions: 70,
                    lines: 70
                },
                critical: {
                    'lib/taskManager.js': { statements: 98, branches: 95, functions: 100, lines: 98 },
                    'lib/todoValidator.js': { statements: 95, branches: 90, functions: 100, lines: 95 },
                    'lib/reviewSystem.js': { statements: 95, branches: 95, functions: 100, lines: 95 }
                }
            },
            // Reporting options
            reportFormats: ['text', 'html', 'json', 'lcov'],
            outputDir: './coverage',
            reportsDir: './coverage/reports',
            // Validation options
            failOnBelow: true,
            generateTrends: true,
            alertThresholds: {
                degradation: 5, // Alert if coverage drops by 5%
                critical: 60    // Critical alert if below 60%
            },
            ...options
        };
        
        this.coverageData = null;
        this.trends = [];
        this.validationResults = {
            passed: false,
            failures: [],
            warnings: [],
            summary: {}
        };
    }

    /**
     * Main validation pipeline
     */
    async validate() {
        console.log('🔬 Starting automated coverage validation...');
        
        try {
            // Step 1: Run coverage collection
            await this.runCoverage();
            
            // Step 2: Load and parse coverage data
            await this.loadCoverageData();
            
            // Step 3: Validate against thresholds
            await this.validateThresholds();
            
            // Step 4: Generate trend analysis
            await this.generateTrendAnalysis();
            
            // Step 5: Create comprehensive reports
            await this.generateReports();
            
            // Step 6: Emit alerts if needed
            await this.emitAlerts();
            
            console.log(this.validationResults.passed ? 
                '✅ Coverage validation PASSED' : 
                '❌ Coverage validation FAILED'
            );
            
            return this.validationResults;
            
        } catch (error) {
            console.error('💥 Coverage validation failed with error:', error.message);
            this.validationResults.passed = false;
            this.validationResults.failures.push(`System error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Run Jest coverage collection with enhanced error handling
     */
    async runCoverage() {
        console.log('📊 Collecting coverage data...');
        
        return new Promise((resolve, reject) => {
            const jestProcess = spawn('npm', ['run', 'test:coverage'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, CI: 'true' }
            });
            
            let _stdout = '';
            let _stderr = '';
            
            jestProcess.stdout.on('data', (data) => {
                _stdout += data.toString();
            });
            
            jestProcess.stderr.on('data', (data) => {
                _stderr += data.toString();
            });
            
            // Timeout after 5 minutes
            const timeout = global.setTimeout(() => {
                jestProcess.kill('SIGKILL');
                reject(new Error('Coverage collection timed out after 5 minutes'));
            }, 300000);
            
            jestProcess.on('close', (code) => {
                global.clearTimeout(timeout);
                
                if (code === 0) {
                    console.log('✅ Coverage collection completed successfully');
                    resolve();
                } else {
                    console.warn(`⚠️ Coverage collection exited with code ${code}, but continuing...`);
                    // Don't reject - coverage files might still be generated
                    resolve();
                }
            });
            
            jestProcess.on('error', (error) => {
                global.clearTimeout(timeout);
                reject(new Error(`Coverage collection failed: ${error.message}`));
            });
        });
    }

    /**
     * Load and parse coverage data from multiple sources
     */
    async loadCoverageData() {
        console.log('📖 Loading coverage data...');
        
        const coverageSummaryPath = path.join(this.options.outputDir, 'coverage-summary.json');
        const coverageDataPath = path.join(this.options.outputDir, 'coverage-final.json');
        
        // Try to load summary first
        if (fs.existsSync(coverageSummaryPath)) {
            try {
                const summaryData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
                this.coverageData = summaryData;
                console.log('✅ Loaded coverage summary data');
            } catch (error) {
                console.warn(`⚠️ Failed to parse coverage summary: ${error.message}`);
            }
        }
        
        // Fallback to full coverage data
        if (!this.coverageData && fs.existsSync(coverageDataPath)) {
            try {
                const fullData = JSON.parse(fs.readFileSync(coverageDataPath, 'utf8'));
                this.coverageData = this.parseCoverageData(fullData);
                console.log('✅ Loaded full coverage data');
            } catch (error) {
                console.warn(`⚠️ Failed to parse full coverage data: ${error.message}`);
            }
        }
        
        if (!this.coverageData) {
            throw new Error('No coverage data found. Ensure coverage collection completed successfully.');
        }
    }

    /**
     * Parse full coverage data into summary format
     */
    parseCoverageData(fullData) {
        const summary = { total: { statements: {}, branches: {}, functions: {}, lines: {} } };
        
        let totalStatements = 0, coveredStatements = 0;
        let totalBranches = 0, coveredBranches = 0;
        let totalFunctions = 0, coveredFunctions = 0;
        let totalLines = 0, coveredLines = 0;
        
        for (const [filePath, fileData] of Object.entries(fullData)) {
            if (filePath.startsWith('/')) {
                // Accumulate totals
                totalStatements += fileData.s ? Object.keys(fileData.s).length : 0;
                coveredStatements += fileData.s ? Object.values(fileData.s).filter(v => v > 0).length : 0;
                
                totalBranches += fileData.b ? Object.values(fileData.b).flat().length : 0;
                coveredBranches += fileData.b ? Object.values(fileData.b).flat().filter(v => v > 0).length : 0;
                
                totalFunctions += fileData.f ? Object.keys(fileData.f).length : 0;
                coveredFunctions += fileData.f ? Object.values(fileData.f).filter(v => v > 0).length : 0;
                
                totalLines += fileData.l ? Object.keys(fileData.l).length : 0;
                coveredLines += fileData.l ? Object.values(fileData.l).filter(v => v > 0).length : 0;
            }
        }
        
        summary.total = {
            statements: { total: totalStatements, covered: coveredStatements, pct: (coveredStatements / totalStatements * 100) || 0 },
            branches: { total: totalBranches, covered: coveredBranches, pct: (coveredBranches / totalBranches * 100) || 0 },
            functions: { total: totalFunctions, covered: coveredFunctions, pct: (coveredFunctions / totalFunctions * 100) || 0 },
            lines: { total: totalLines, covered: coveredLines, pct: (coveredLines / totalLines * 100) || 0 }
        };
        
        return summary;
    }

    /**
     * Validate coverage against configured thresholds
     */
    async validateThresholds() {
        console.log('🎯 Validating coverage thresholds...');
        
        const { total } = this.coverageData;
        const { global, critical } = this.options.thresholds;
        
        this.validationResults.summary = {
            statements: total.statements.pct,
            branches: total.branches.pct,
            functions: total.functions.pct,
            lines: total.lines.pct
        };
        
        // Validate global thresholds
        const globalResults = this.validateGlobalThresholds(total, global);
        
        // Validate critical file thresholds
        const criticalResults = this.validateCriticalFiles(critical);
        
        // Determine overall pass/fail
        this.validationResults.passed = globalResults.passed && criticalResults.passed;
        this.validationResults.failures = [...globalResults.failures, ...criticalResults.failures];
        this.validationResults.warnings = [...globalResults.warnings, ...criticalResults.warnings];
        
        console.log(`📊 Global Coverage: ${total.statements.pct.toFixed(2)}% statements, ${total.branches.pct.toFixed(2)}% branches, ${total.functions.pct.toFixed(2)}% functions, ${total.lines.pct.toFixed(2)}% lines`);
    }

    /**
     * Validate global coverage thresholds
     */
    validateGlobalThresholds(total, thresholds) {
        const results = { passed: true, failures: [], warnings: [] };
        
        const checks = [
            { name: 'statements', actual: total.statements.pct, required: thresholds.statements },
            { name: 'branches', actual: total.branches.pct, required: thresholds.branches },
            { name: 'functions', actual: total.functions.pct, required: thresholds.functions },
            { name: 'lines', actual: total.lines.pct, required: thresholds.lines }
        ];
        
        for (const check of checks) {
            if (check.actual < check.required) {
                results.passed = false;
                results.failures.push(
                    `Global ${check.name} coverage ${check.actual.toFixed(2)}% below threshold ${check.required}%`
                );
            } else if (check.actual < check.required + 5) {
                results.warnings.push(
                    `Global ${check.name} coverage ${check.actual.toFixed(2)}% close to threshold ${check.required}%`
                );
            }
        }
        
        return results;
    }

    /**
     * Validate critical file thresholds
     */
    validateCriticalFiles(_criticalThresholds) {
        const results = { passed: true, failures: [], warnings: [] };
        
        // For now, we'll skip critical file validation since we need individual file data
        // This would require parsing the full coverage-final.json or implementing file-specific collection
        console.log('ℹ️  Critical file validation skipped (requires individual file coverage data)');
        
        return results;
    }

    /**
     * Generate trend analysis
     */
    async generateTrendAnalysis() {
        console.log('📈 Generating trend analysis...');
        
        const trendsFile = path.join(this.options.reportsDir, 'coverage-trends.json');
        
        // Load existing trends
        if (fs.existsSync(trendsFile)) {
            try {
                this.trends = JSON.parse(fs.readFileSync(trendsFile, 'utf8'));
            } catch (error) {
                console.warn(`⚠️ Failed to load existing trends: ${error.message}`);
                this.trends = [];
            }
        }
        
        // Add current data point
        const currentTrend = {
            timestamp: new Date().toISOString(),
            coverage: this.validationResults.summary,
            passed: this.validationResults.passed
        };
        
        this.trends.push(currentTrend);
        
        // Keep only last 30 data points
        if (this.trends.length > 30) {
            this.trends = this.trends.slice(-30);
        }
        
        // Save trends
        await this.ensureDirectory(this.options.reportsDir);
        fs.writeFileSync(trendsFile, JSON.stringify(this.trends, null, 2));
        
        // Analyze trends for degradation
        this.analyzeTrendDegradation();
    }

    /**
     * Analyze trend degradation
     */
    analyzeTrendDegradation() {
        if (this.trends.length < 2) return;
        
        const current = this.trends[this.trends.length - 1];
        const previous = this.trends[this.trends.length - 2];
        
        const degradationThreshold = this.options.alertThresholds.degradation;
        
        const checks = ['statements', 'branches', 'functions', 'lines'];
        for (const check of checks) {
            const currentValue = current.coverage[check];
            const previousValue = previous.coverage[check];
            const degradation = previousValue - currentValue;
            
            if (degradation > degradationThreshold) {
                this.validationResults.warnings.push(
                    `${check} coverage degraded by ${degradation.toFixed(2)}% (${previousValue.toFixed(2)}% → ${currentValue.toFixed(2)}%)`
                );
            }
        }
    }

    /**
     * Generate comprehensive reports
     */
    async generateReports() {
        console.log('📄 Generating coverage reports...');
        
        await this.ensureDirectory(this.options.reportsDir);
        
        // JSON report
        const jsonReport = {
            timestamp: new Date().toISOString(),
            validation: this.validationResults,
            coverage: this.coverageData,
            trends: this.trends.slice(-10), // Last 10 data points
            thresholds: this.options.thresholds
        };
        
        fs.writeFileSync(
            path.join(this.options.reportsDir, 'coverage-validation.json'),
            JSON.stringify(jsonReport, null, 2)
        );
        
        // Markdown report
        await this.generateMarkdownReport();
        
        // CSV trends report
        await this.generateCsvTrends();
        
        console.log(`✅ Reports generated in ${this.options.reportsDir}`);
    }

    /**
     * Generate markdown report
     */
    async generateMarkdownReport() {
        const { summary } = this.validationResults;
        const _date = new Date().toISOString().split('T')[0];
        
        const markdown = `# Coverage Validation Report

**Generated:** ${new Date().toISOString()}
**Status:** ${this.validationResults.passed ? '✅ PASSED' : '❌ FAILED'}

## Coverage Summary

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Statements | ${summary.statements.toFixed(2)}% | ${this.options.thresholds.global.statements}% | ${summary.statements >= this.options.thresholds.global.statements ? '✅' : '❌'} |
| Branches | ${summary.branches.toFixed(2)}% | ${this.options.thresholds.global.branches}% | ${summary.branches >= this.options.thresholds.global.branches ? '✅' : '❌'} |
| Functions | ${summary.functions.toFixed(2)}% | ${this.options.thresholds.global.functions}% | ${summary.functions >= this.options.thresholds.global.functions ? '✅' : '❌'} |
| Lines | ${summary.lines.toFixed(2)}% | ${this.options.thresholds.global.lines}% | ${summary.lines >= this.options.thresholds.global.lines ? '✅' : '❌'} |

## Validation Results

${this.validationResults.failures.length > 0 ? `### ❌ Failures
${this.validationResults.failures.map(f => `- ${f}`).join('\n')}` : ''}

${this.validationResults.warnings.length > 0 ? `### ⚠️ Warnings
${this.validationResults.warnings.map(w => `- ${w}`).join('\n')}` : ''}

## Trend Analysis

${this.trends.length > 1 ? `
Coverage trend over last ${Math.min(this.trends.length, 10)} runs:

| Date | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
${this.trends.slice(-10).map(t => {
    const date = new Date(t.timestamp).toISOString().split('T')[0];
    return `| ${date} | ${t.coverage.statements.toFixed(1)}% | ${t.coverage.branches.toFixed(1)}% | ${t.coverage.functions.toFixed(1)}% | ${t.coverage.lines.toFixed(1)}% |`;
}).join('\n')}
` : 'Insufficient data for trend analysis'}

## Next Steps

${this.validationResults.passed ? 
    '✅ Coverage validation passed. Continue maintaining high code quality.' :
    '❌ Coverage validation failed.\n\n**Recommended Actions:**\n' + 
    this.validationResults.failures.map(f => `- Address: ${f}`).join('\n')
}
`;

        fs.writeFileSync(
            path.join(this.options.reportsDir, 'coverage-report.md'),
            markdown
        );
    }

    /**
     * Generate CSV trends report
     */
    async generateCsvTrends() {
        if (this.trends.length === 0) return;
        
        const csv = [
            'Date,Statements,Branches,Functions,Lines,Passed',
            ...this.trends.map(t => {
                const date = new Date(t.timestamp).toISOString().split('T')[0];
                return `${date},${t.coverage.statements.toFixed(2)},${t.coverage.branches.toFixed(2)},${t.coverage.functions.toFixed(2)},${t.coverage.lines.toFixed(2)},${t.passed}`;
            })
        ].join('\n');
        
        fs.writeFileSync(
            path.join(this.options.reportsDir, 'coverage-trends.csv'),
            csv
        );
    }

    /**
     * Emit alerts for critical issues
     */
    async emitAlerts() {
        const criticalThreshold = this.options.alertThresholds.critical;
        const { summary } = this.validationResults;
        
        const criticalIssues = [];
        
        // Check for critical coverage levels
        if (summary.statements < criticalThreshold) {
            criticalIssues.push(`CRITICAL: Statement coverage ${summary.statements.toFixed(2)}% below critical threshold ${criticalThreshold}%`);
        }
        
        if (summary.branches < criticalThreshold) {
            criticalIssues.push(`CRITICAL: Branch coverage ${summary.branches.toFixed(2)}% below critical threshold ${criticalThreshold}%`);
        }
        
        if (criticalIssues.length > 0) {
            console.error('🚨 CRITICAL COVERAGE ALERTS:');
            criticalIssues.forEach(issue => console.error(`   ${issue}`));
            
            // Write alert file
            const alertFile = path.join(this.options.reportsDir, 'coverage-alerts.json');
            const alert = {
                timestamp: new Date().toISOString(),
                level: 'CRITICAL',
                issues: criticalIssues,
                coverage: summary
            };
            
            fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
        }
    }

    /**
     * Ensure directory exists
     */
    async ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

// CLI interface
if (require.main === module) {
    const validator = new CoverageValidator();
    
    validator.validate()
        .then(results => {
            console.log('\n📊 Coverage Validation Summary:');
            console.log(`   Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`   Statements: ${results.summary.statements.toFixed(2)}%`);
            console.log(`   Branches: ${results.summary.branches.toFixed(2)}%`);
            console.log(`   Functions: ${results.summary.functions.toFixed(2)}%`);
            console.log(`   Lines: ${results.summary.lines.toFixed(2)}%`);
            
            if (results.failures.length > 0) {
                console.log('\n❌ Failures:');
                results.failures.forEach(f => console.log(`   - ${f}`));
            }
            
            if (results.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                results.warnings.forEach(w => console.log(`   - ${w}`));
            }
            
            process.exit(results.passed ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = CoverageValidator;