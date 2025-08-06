#!/usr/bin/env node

/**
 * Robust Build System
 * 
 * Integrated build system that combines enhanced build validation
 * with build recovery management to ensure reliable builds that
 * prevent contamination and provide automatic recovery.
 */

const BuildValidator = require('./build-validator');
const BuildRecoveryManager = require('../lib/buildRecoveryManager');

class RobustBuildSystem {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.buildValidator = new BuildValidator({ projectRoot: this.projectRoot });
        this.recoveryManager = new BuildRecoveryManager({ 
            projectRoot: this.projectRoot,
            maxRetries: options.maxRetries || 2,
            retryDelay: options.retryDelay || 3000
        });
        this.buildCommand = options.buildCommand || 'npm run lint && npm run test';
        this.verbose = options.verbose || false;
    }
    
    /**
     * Execute robust build with comprehensive validation and recovery
     */
    async executeBuild() {
        const startTime = Date.now();
        this.log('🚀 Starting robust build system...');
        
        try {
            // Phase 1: Pre-build validation
            this.log('\n📋 Phase 1: Pre-build validation');
            const validationResult = await this.buildValidator.validateBuildEnvironment();
            
            if (!validationResult.success) {
                throw new Error(`Pre-build validation failed: ${validationResult.error || 'Unknown validation error'}`);
            }
            
            this.log('✅ Pre-build validation passed');
            
            // Phase 2: Protected build execution with recovery
            this.log('\n🛡️  Phase 2: Protected build execution with recovery');
            const buildResult = await this.recoveryManager.executeBuildWithRecovery(this.buildCommand);
            
            if (!buildResult.success) {
                throw new Error(`Build execution failed: ${buildResult.message || buildResult.error}`);
            }
            
            this.log('✅ Build execution completed successfully');
            
            // Phase 3: Post-build validation
            this.log('\n🔍 Phase 3: Post-build validation');
            const postValidationResult = await this.buildValidator.validateBuildEnvironment();
            
            if (!postValidationResult.success) {
                this.log('⚠️  Post-build validation failed - attempting cleanup...');
                
                // Attempt cleanup and re-validation
                const cleanupResult = await this.performPostBuildCleanup();
                if (cleanupResult.success) {
                    this.log('✅ Post-build cleanup successful');
                } else {
                    throw new Error('Post-build validation and cleanup failed');
                }
            } else {
                this.log('✅ Post-build validation passed');
            }
            
            const executionTime = Date.now() - startTime;
            
            // Generate comprehensive report
            const report = {
                success: true,
                executionTime,
                preValidation: validationResult,
                buildExecution: buildResult,
                postValidation: postValidationResult,
                summary: this.generateBuildSummary(validationResult, buildResult, postValidationResult)
            };
            
            this.displayBuildResults(report);
            
            return report;
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            this.log(`\n❌ Robust build failed: ${error.message}`);
            
            const report = {
                success: false,
                executionTime,
                error: error.message,
                summary: { status: 'FAILED', error: error.message }
            };
            
            this.displayBuildResults(report);
            
            return report;
        }
    }
    
    /**
     * Perform post-build cleanup if validation fails
     */
    async performPostBuildCleanup() {
        try {
            this.log('🧹 Performing post-build cleanup...');
            
            // Use the recovery manager for cleanup
            const recoveryResult = await this.recoveryManager.performEnhancedBuildRecovery();
            
            return {
                success: recoveryResult.success,
                details: recoveryResult
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Generate build summary
     */
    generateBuildSummary(preValidation, buildExecution, postValidation) {
        const summary = {
            status: 'SUCCESS',
            phases: {
                preValidation: preValidation.report.overallStatus,
                buildExecution: buildExecution.success ? 'PASSED' : 'FAILED',
                postValidation: postValidation.report.overallStatus
            },
            metrics: {
                validationTime: preValidation.report.executionTime,
                buildTime: buildExecution.executionTime,
                totalPhases: 6, // From enhanced validation
                passedPhases: preValidation.report.summary.passedPhases
            }
        };
        
        if (buildExecution.contaminationDetected) {
            summary.contaminationDetected = true;
            summary.recoveryApplied = true;
        }
        
        if (buildExecution.attempt > 1) {
            summary.retriesRequired = buildExecution.attempt - 1;
        }
        
        return summary;
    }
    
    /**
     * Display comprehensive build results
     */
    displayBuildResults(report) {
        console.log('\n🎯 Robust Build Results');
        console.log('========================');
        console.log(`Status: ${report.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Total Time: ${report.executionTime}ms`);
        
        if (report.summary) {
            if (report.summary.contaminationDetected) {
                console.log('🛡️  Contamination detected and recovered');
            }
            
            if (report.summary.retriesRequired) {
                console.log(`🔄 Retries required: ${report.summary.retriesRequired}`);
            }
            
            if (report.summary.phases) {
                console.log('\nPhase Results:');
                console.log(`  Pre-validation: ${report.summary.phases.preValidation}`);
                console.log(`  Build execution: ${report.summary.phases.buildExecution}`);
                console.log(`  Post-validation: ${report.summary.phases.postValidation}`);
            }
        }
        
        if (report.success) {
            console.log('\n🎉 Robust build completed successfully!');
            console.log('   Build environment is clean and validated');
            console.log('   All contamination prevention measures active');
        } else {
            console.log('\n💥 Robust build failed');
            console.log(`   Error: ${report.error}`);
            console.log('   Review logs above for detailed information');
        }
    }
    
    /**
     * Logging helper
     */
    log(message) {
        if (this.verbose || process.env.VERBOSE_BUILD) {
            console.log(message);
        } else if (message.includes('Phase') || message.includes('✅') || message.includes('❌')) {
            console.log(message);
        }
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        buildCommand: process.env.BUILD_COMMAND || 'npm run lint && npm run test'
    };
    
    // Parse custom build command if provided
    const buildCommandIndex = args.findIndex(arg => arg === '--command' || arg === '-c');
    if (buildCommandIndex !== -1 && args[buildCommandIndex + 1]) {
        options.buildCommand = args[buildCommandIndex + 1];
    }
    
    const robustBuilder = new RobustBuildSystem(options);
    const result = await robustBuilder.executeBuild();
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
}

// Export for use as module
module.exports = RobustBuildSystem;

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Robust build system crashed:', error.message);
        process.exit(1);
    });
}