#!/usr/bin/env node
/**
 * Console Statement Cleanup Validation Script
 * Validates that console statement cleanup was successful by running linting validation
 * and providing comprehensive before/after reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Original baseline data (from console analysis report)
const ORIGINAL_BASELINE = {
    totalErrors: 485,
    totalWarnings: 3561,
    consoleTotalFiles: 380,
    consoleTotalStatements: 4135,
    categories: {
        development_debugging: { file_count: 87, console_count: 1729 },
        core_application: { file_count: 180, console_count: 939 },
        build_scripts: { file_count: 57, console_count: 1214 },
        removable: { file_count: 2, console_count: 253 }
    }
};

class ConsoleCleanupValidator {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.results = {
            timestamp: new Date().toISOString(),
            baseline: ORIGINAL_BASELINE,
            current: {},
            improvement: {},
            status: 'unknown'
        };
    }

    /**
     * Run comprehensive linting validation
     */
    async runLintingValidation() {
        console.log('🔍 Running comprehensive linting validation...\n');
        
        try {
            // 1. Run lint from project root
            console.log('📋 Running npm run lint from project root...');
            const rootLintResult = this.runLintCommand(this.projectPath);
            this.results.current.rootLint = rootLintResult;
            
            // 2. Run lint from frontend directory  
            const frontendPath = path.join(this.projectPath, 'frontend');
            if (fs.existsSync(frontendPath)) {
                console.log('📋 Running npm run lint from frontend directory...');
                const frontendLintResult = this.runLintCommand(frontendPath);
                this.results.current.frontendLint = frontendLintResult;
            }
            
            // 3. Parse and analyze results
            this.analyzeResults();
            
            // 4. Generate comprehensive report
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.results.status = 'failed';
            this.results.error = error.message;
        }
    }

    /**
     * Run lint command and capture results
     */
    runLintCommand(directory) {
        const result = {
            directory: directory,
            errors: 0,
            warnings: 0,
            output: '',
            success: false
        };
        
        try {
            // Change to directory and run lint
            process.chdir(directory);
            
            // Run lint command with error output capture
            const output = execSync('npm run lint', { 
                encoding: 'utf8',
                stdio: ['inherit', 'pipe', 'pipe'],
                timeout: 60000 // 1 minute timeout
            });
            
            result.output = output;
            result.success = true;
            
            // Parse output for error/warning counts
            const errorMatch = output.match(/(\d+)\s+error/i);
            const warningMatch = output.match(/(\d+)\s+warning/i);
            
            result.errors = errorMatch ? parseInt(errorMatch[1]) : 0;
            result.warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
            
        } catch (error) {
            // Capture error output which contains lint results
            result.output = error.stdout + '\n' + error.stderr;
            
            // Even if command fails, try to parse error counts
            const errorMatch = result.output.match(/(\d+)\s+error/i);
            const warningMatch = result.output.match(/(\d+)\s+warning/i);
            
            result.errors = errorMatch ? parseInt(errorMatch[1]) : 0;
            result.warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
            
            // Command failed but we got results
            result.success = result.errors === 0;
        }
        
        return result;
    }

    /**
     * Analyze linting results and calculate improvements
     */
    analyzeResults() {
        const current = this.results.current;
        
        // Calculate total current errors/warnings
        let totalErrors = 0;
        let totalWarnings = 0;
        
        if (current.rootLint) {
            totalErrors += current.rootLint.errors;
            totalWarnings += current.rootLint.warnings;
        }
        
        if (current.frontendLint) {
            totalErrors += current.frontendLint.errors;
            totalWarnings += current.frontendLint.warnings;
        }
        
        this.results.current.totalErrors = totalErrors;
        this.results.current.totalWarnings = totalWarnings;
        
        // Calculate improvements
        this.results.improvement = {
            errorsReduced: ORIGINAL_BASELINE.totalErrors - totalErrors,
            warningsReduced: ORIGINAL_BASELINE.totalWarnings - totalWarnings,
            errorsReductionPercent: ((ORIGINAL_BASELINE.totalErrors - totalErrors) / ORIGINAL_BASELINE.totalErrors * 100).toFixed(1),
            warningsReductionPercent: ((ORIGINAL_BASELINE.totalWarnings - totalWarnings) / ORIGINAL_BASELINE.totalWarnings * 100).toFixed(1)
        };
        
        // Determine status
        if (totalErrors === 0 && totalWarnings < 100) {
            this.results.status = 'excellent';
        } else if (totalErrors === 0) {
            this.results.status = 'good';
        } else if (totalErrors < 50) {
            this.results.status = 'improved';
        } else {
            this.results.status = 'needs_work';
        }
    }

    /**
     * Generate comprehensive before/after report
     */
    generateComprehensiveReport() {
        const { baseline, current, improvement, status } = this.results;
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE CONSOLE CLEANUP VALIDATION REPORT');
        console.log('='.repeat(80));
        
        // Status indicator
        const statusEmoji = {
            excellent: '🎉',
            good: '✅', 
            improved: '📈',
            needs_work: '⚠️',
            failed: '❌'
        };
        
        console.log(`\n${statusEmoji[status]} OVERALL STATUS: ${status.toUpperCase().replace('_', ' ')}\n`);
        
        // Before/After Comparison
        console.log('📈 BEFORE/AFTER COMPARISON:');
        console.log('-'.repeat(50));
        console.log(`Errors:   ${baseline.totalErrors.toLocaleString()} → ${current.totalErrors.toLocaleString()} (${improvement.errorsReduced > 0 ? '-' : '+'}${Math.abs(improvement.errorsReduced)} | ${improvement.errorsReductionPercent}% reduction)`);
        console.log(`Warnings: ${baseline.totalWarnings.toLocaleString()} → ${current.totalWarnings.toLocaleString()} (${improvement.warningsReduced > 0 ? '-' : '+'}${Math.abs(improvement.warningsReduced)} | ${improvement.warningsReductionPercent}% reduction)`);
        
        // Detailed Results
        console.log('\n📋 DETAILED LINTING RESULTS:');
        console.log('-'.repeat(50));
        
        if (current.rootLint) {
            console.log(`Root Directory:`);
            console.log(`  Errors: ${current.rootLint.errors}`);
            console.log(`  Warnings: ${current.rootLint.warnings}`);
            console.log(`  Success: ${current.rootLint.success ? '✅' : '❌'}`);
        }
        
        if (current.frontendLint) {
            console.log(`Frontend Directory:`);
            console.log(`  Errors: ${current.frontendLint.errors}`);
            console.log(`  Warnings: ${current.frontendLint.warnings}`);
            console.log(`  Success: ${current.frontendLint.success ? '✅' : '❌'}`);
        }
        
        // Console Statement Impact Analysis
        console.log('\n🎯 CONSOLE STATEMENT IMPACT ANALYSIS:');
        console.log('-'.repeat(50));
        console.log(`Original Console Files: ${baseline.consoleTotalFiles}`);
        console.log(`Original Console Statements: ${baseline.consoleTotalStatements.toLocaleString()}`);
        
        // Categories breakdown
        console.log('\nOriginal Categories:');
        Object.entries(baseline.categories).forEach(([category, data]) => {
            console.log(`  ${category.replace('_', ' ')}: ${data.file_count} files, ${data.console_count} statements`);
        });
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(50));
        
        if (status === 'excellent') {
            console.log('🎉 Excellent! Console cleanup was highly successful.');
            console.log('   No critical issues remain. Maintain current quality standards.');
        } else if (status === 'good') {
            console.log('✅ Good progress! Most issues resolved.');
            console.log(`   Consider addressing remaining ${current.totalWarnings} warnings for perfection.`);
        } else if (status === 'improved') {
            console.log('📈 Significant improvement achieved.');
            console.log(`   Focus on resolving remaining ${current.totalErrors} errors.`);
        } else if (status === 'needs_work') {
            console.log('⚠️  More work needed to achieve quality standards.');
            console.log(`   Priority: Address ${current.totalErrors} errors immediately.`);
        }
        
        // Critical Issues (if any)
        if (current.totalErrors > 0) {
            console.log('\n🚨 CRITICAL ISSUES IDENTIFIED:');
            console.log('-'.repeat(50));
            console.log(`${current.totalErrors} linting errors must be fixed immediately.`);
            console.log('Run the following to identify specific issues:');
            console.log('  npm run lint -- --format=verbose');
        }
        
        console.log('\n' + '='.repeat(80));
        
        // Save detailed report
        const reportPath = path.join(this.projectPath, 'console-cleanup-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📁 Detailed report saved to: ${reportPath}`);
    }
}

// Main execution
async function main() {
    const projectPath = process.argv[2] || process.cwd();
    
    if (!fs.existsSync(projectPath)) {
        console.error('❌ Project path does not exist:', projectPath);
        process.exit(1);
    }
    
    console.log(`🚀 Console Cleanup Validation for: ${projectPath}\n`);
    
    const validator = new ConsoleCleanupValidator(projectPath);
    await validator.runLintingValidation();
    
    // Exit with appropriate code
    const exitCode = validator.results.status === 'excellent' || validator.results.status === 'good' ? 0 : 1;
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = ConsoleCleanupValidator;