#!/usr/bin/env node

/**
 * Build Validation System
 * 
 * Comprehensive validation and recovery system for the build process.
 * Validates node_modules integrity, detects contamination, and performs
 * automatic recovery before allowing the build to proceed.
 */

const ContaminationResolver = require('../lib/contaminationResolver');
const { getGlobalMonitor } = require('../lib/nodeModulesMonitor');
const ErrorRecovery = require('../lib/errorRecovery');
const fs = require('fs');
const path = require('path');

class BuildValidator {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.contaminationResolver = new ContaminationResolver(this.projectRoot);
        this.nodeModulesMonitor = getGlobalMonitor({
            enableBackup: true,
            enableRestore: true,
            enableDetailed: true
        });
        this.errorRecovery = new ErrorRecovery();
        this.validationResults = [];
    }
    
    /**
     * Run comprehensive build validation with enhanced contamination protection
     */
    async validateBuildEnvironment() {
        console.log('🔍 Enhanced Build Environment Validation');
        console.log('=========================================');
        
        const startTime = Date.now();
        let overallStatus = 'PASSED';
        
        try {
            // Phase 0: Pre-validation Setup and Protection
            console.log('\n🛡️  Phase 0: Build Environment Protection Setup');
            const protectionResult = await this.setupBuildProtection();
            this.validationResults.push(protectionResult);
            
            if (protectionResult.status !== 'PASSED') {
                console.log('⚠️  Build protection setup failed - attempting recovery...');
                const recoveryResult = await this.performContaminationRecovery();
                this.validationResults.push(recoveryResult);
                
                if (recoveryResult.status !== 'PASSED') {
                    overallStatus = 'FAILED';
                }
            }
            
            // Phase 1: Node Modules Integrity Check
            console.log('\n📦 Phase 1: Node Modules Integrity Validation');
            const integrityResult = await this.validateNodeModulesIntegrity();
            this.validationResults.push(integrityResult);
            
            if (integrityResult.status !== 'PASSED') {
                console.log('⚠️  Node modules contamination detected - attempting recovery...');
                const recoveryResult = await this.performContaminationRecovery();
                this.validationResults.push(recoveryResult);
                
                if (recoveryResult.status !== 'PASSED') {
                    overallStatus = 'FAILED';
                }
            }
            
            // Phase 2: Critical File Validation
            console.log('\n🔧 Phase 2: Critical File Validation');
            const fileResult = await this.validateCriticalFiles();
            this.validationResults.push(fileResult);
            
            if (fileResult.status !== 'PASSED') {
                overallStatus = 'FAILED';
            }
            
            // Phase 3: Build Dependencies Check
            console.log('\n⚙️  Phase 3: Build Dependencies Validation');
            const depsResult = await this.validateBuildDependencies();
            this.validationResults.push(depsResult);
            
            if (depsResult.status !== 'PASSED') {
                overallStatus = 'FAILED';
            }
            
            // Phase 4: Process Protection Validation
            console.log('\n🔒 Phase 4: Build Process Protection Validation');
            const processProtectionResult = await this.validateProcessProtection();
            this.validationResults.push(processProtectionResult);
            
            if (processProtectionResult.status !== 'PASSED') {
                overallStatus = 'FAILED';
            }
            
            // Phase 5: Final Verification
            if (overallStatus === 'PASSED') {
                console.log('\n✅ Phase 5: Final Integrity Verification');
                const finalResult = await this.performFinalVerification();
                this.validationResults.push(finalResult);
                
                if (finalResult.status !== 'PASSED') {
                    overallStatus = 'FAILED';
                }
            }
            
            const executionTime = Date.now() - startTime;
            
            // Generate validation report
            const report = {
                timestamp: new Date().toISOString(),
                overallStatus,
                executionTime,
                phases: this.validationResults,
                summary: this.generateSummary()
            };
            
            this.displayResults(report);
            
            if (overallStatus === 'PASSED') {
                console.log('\n🎉 Build environment validation PASSED - build can proceed safely');
                return { success: true, report };
            } else {
                console.log('\n❌ Build environment validation FAILED - build cannot proceed');
                return { success: false, report };
            }
            
        } catch (error) {
            console.error('\n💥 Build validation failed with error:', error.message);
            return { 
                success: false, 
                error: error.message,
                report: { overallStatus: 'ERROR', error: error.message }
            };
        }
    }
    
    /**
     * Validate node_modules integrity
     */
    async validateNodeModulesIntegrity() {
        const result = {
            phase: 'Node Modules Integrity',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            // Check for contamination
            const contamination = await this.contaminationResolver.detectContamination();
            
            if (contamination.length > 0) {
                result.status = 'FAILED';
                result.details.contamination = contamination;
                
                for (const item of contamination) {
                    result.issues.push({
                        type: 'CONTAMINATION',
                        file: item.file,
                        message: 'JSON contamination detected in JavaScript file',
                        severity: 'HIGH'
                    });
                }
                
                console.log(`❌ Found contamination in ${contamination.length} files`);
                contamination.forEach(item => {
                    console.log(`   - ${item.file}: ${item.content.substring(0, 100)}...`);
                });
            } else {
                console.log('✅ No contamination detected');
                result.details.contamination = [];
            }
            
            // Check critical files exist and are readable
            const criticalFiles = [
                'node_modules/exit/lib/exit.js',
                'node_modules/jest-worker/build/index.js',
                'node_modules/jest/package.json'
            ];
            
            const missingFiles = [];
            for (const file of criticalFiles) {
                const fullPath = path.join(this.projectRoot, file);
                if (!fs.existsSync(fullPath)) {
                    missingFiles.push(file);
                }
            }
            
            if (missingFiles.length > 0) {
                result.status = 'FAILED';
                result.details.missingFiles = missingFiles;
                result.issues.push({
                    type: 'MISSING_FILES',
                    files: missingFiles,
                    message: 'Critical node_modules files are missing',
                    severity: 'HIGH'
                });
                console.log(`❌ Missing critical files: ${missingFiles.join(', ')}`);
            } else {
                console.log('✅ All critical files present');
                result.details.missingFiles = [];
            }
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            console.log(`❌ Integrity check failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Perform contamination recovery
     */
    async performContaminationRecovery() {
        const result = {
            phase: 'Contamination Recovery',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            console.log('🧹 Attempting contamination recovery...');
            
            // Store original contents first
            await this.contaminationResolver.storeOriginalContents();
            
            // Perform recovery
            const recoveryResult = await this.contaminationResolver.restoreContaminatedFiles();
            
            result.details.recoveryResult = recoveryResult;
            
            if (recoveryResult.restored > 0) {
                console.log(`✅ Successfully restored ${recoveryResult.restored} files:`);
                recoveryResult.files.forEach(file => {
                    console.log(`   - ${file}`);
                });
            } else {
                console.log('ℹ️  No files needed restoration');
            }
            
            // Verify recovery worked
            const remainingContamination = await this.contaminationResolver.detectContamination();
            
            if (remainingContamination.length > 0) {
                result.status = 'FAILED';
                result.details.remainingContamination = remainingContamination;
                result.issues.push({
                    type: 'RECOVERY_INCOMPLETE',
                    files: remainingContamination.map(c => c.file),
                    message: 'Some contamination could not be recovered',
                    severity: 'HIGH'
                });
                console.log(`❌ Recovery incomplete - ${remainingContamination.length} files still contaminated`);
            } else {
                console.log('✅ Recovery successful - all contamination resolved');
            }
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            console.log(`❌ Recovery failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Validate critical files
     */
    async validateCriticalFiles() {
        const result = {
            phase: 'Critical Files',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            const criticalFiles = [
                { file: 'package.json', required: true },
                { file: 'stop-hook.js', required: true },
                { file: 'lib/taskManager.js', required: true },
                { file: 'lib/nodeModulesMonitor.js', required: true },
                { file: 'scripts/fix-contamination.js', required: true }
            ];
            
            const fileStatus = [];
            
            for (const { file, required } of criticalFiles) {
                const fullPath = path.join(this.projectRoot, file);
                const exists = fs.existsSync(fullPath);
                
                fileStatus.push({ file, exists, required });
                
                if (required && !exists) {
                    result.status = 'FAILED';
                    result.issues.push({
                        type: 'MISSING_CRITICAL_FILE',
                        file,
                        message: `Required file ${file} is missing`,
                        severity: 'HIGH'
                    });
                    console.log(`❌ Missing required file: ${file}`);
                } else if (exists) {
                    console.log(`✅ ${file} exists`);
                } else {
                    console.log(`⚠️  Optional file ${file} not found`);
                }
            }
            
            result.details.fileStatus = fileStatus;
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            console.log(`❌ Critical files check failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Validate build dependencies
     */
    async validateBuildDependencies() {
        const result = {
            phase: 'Build Dependencies',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            // Check package.json exists and is valid
            const packagePath = path.join(this.projectRoot, 'package.json');
            if (!fs.existsSync(packagePath)) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'MISSING_PACKAGE_JSON',
                    message: 'package.json file is missing',
                    severity: 'HIGH'
                });
                console.log('❌ package.json is missing');
                return result;
            }
            
            // Validate package.json structure
            const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            result.details.packageJson = {
                name: packageContent.name,
                version: packageContent.version,
                hasScripts: !!packageContent.scripts,
                hasDependencies: !!packageContent.dependencies || !!packageContent.devDependencies
            };
            
            // Check required scripts
            const requiredScripts = ['test', 'lint', 'build', 'fix-contamination'];
            const missingScripts = [];
            
            for (const script of requiredScripts) {
                if (!packageContent.scripts || !packageContent.scripts[script]) {
                    missingScripts.push(script);
                }
            }
            
            if (missingScripts.length > 0) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'MISSING_SCRIPTS',
                    scripts: missingScripts,
                    message: `Missing required npm scripts: ${missingScripts.join(', ')}`,
                    severity: 'MEDIUM'
                });
                console.log(`❌ Missing required scripts: ${missingScripts.join(', ')}`);
            } else {
                console.log('✅ All required scripts present');
            }
            
            // Check node_modules exists
            const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'MISSING_NODE_MODULES',
                    message: 'node_modules directory is missing - run npm install',
                    severity: 'HIGH'
                });
                console.log('❌ node_modules directory is missing');
            } else {
                console.log('✅ node_modules directory exists');
            }
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            console.log(`❌ Dependencies check failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Setup build environment protection
     */
    async setupBuildProtection() {
        const result = {
            phase: 'Build Environment Protection',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            // Initialize monitoring systems
            if (this.nodeModulesMonitor && typeof this.nodeModulesMonitor.startMonitoring === 'function') {
                await this.nodeModulesMonitor.startMonitoring();
                console.log('✅ Node modules monitoring initialized');
            } else {
                console.log('⚠️  Node modules monitoring not available');
            }
            
            // Store original file contents for recovery
            await this.contaminationResolver.storeOriginalContents();
            console.log('✅ Original file contents stored');
            
            // Create initial backup
            await this.contaminationResolver.createBackups();
            console.log('✅ Initial backup created');
            
            // Set up protection flags
            process.env.BUILD_PROTECTION_ACTIVE = 'true';
            process.env.CONTAMINATION_MONITORING = 'enabled';
            
            result.details.protectionEnabled = true;
            result.details.monitoringActive = true;
            result.details.backupCreated = true;
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            result.issues.push({
                type: 'PROTECTION_SETUP_FAILED',
                message: `Failed to setup build protection: ${error.message}`,
                severity: 'HIGH'
            });
            console.log(`❌ Build protection setup failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Validate process protection mechanisms
     */
    async validateProcessProtection() {
        const result = {
            phase: 'Process Protection',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            // Check environment protection flags
            const protectionActive = process.env.BUILD_PROTECTION_ACTIVE === 'true';
            const monitoringEnabled = process.env.CONTAMINATION_MONITORING === 'enabled';
            
            result.details.protectionActive = protectionActive;
            result.details.monitoringEnabled = monitoringEnabled;
            
            if (!protectionActive) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'PROTECTION_NOT_ACTIVE',
                    message: 'Build protection is not active',
                    severity: 'HIGH'
                });
                console.log('❌ Build protection not active');
            } else {
                console.log('✅ Build protection is active');
            }
            
            if (!monitoringEnabled) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'MONITORING_NOT_ENABLED',
                    message: 'Contamination monitoring is not enabled',
                    severity: 'HIGH'
                });
                console.log('❌ Contamination monitoring not enabled');
            } else {
                console.log('✅ Contamination monitoring enabled');
            }
            
            // Validate exit handler protection
            const exitHandlerProtected = await this.validateExitHandlerProtection();
            result.details.exitHandlerProtected = exitHandlerProtected;
            
            if (!exitHandlerProtected) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'EXIT_HANDLER_VULNERABLE',
                    message: 'Exit handler is not protected from contamination',
                    severity: 'CRITICAL'
                });
                console.log('❌ Exit handler vulnerable to contamination');
            } else {
                console.log('✅ Exit handler protected');
            }
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            console.log(`❌ Process protection validation failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Validate exit handler protection specifically
     */
    async validateExitHandlerProtection() {
        try {
            const exitLibPath = path.join(this.projectRoot, 'node_modules/exit/lib/exit.js');
            
            if (!fs.existsSync(exitLibPath)) {
                return false; // Exit library not found
            }
            
            const content = fs.readFileSync(exitLibPath, 'utf8');
            
            // Check if content starts with valid JavaScript (not JSON)
            const startsWithComment = content.trim().startsWith('/*') || content.trim().startsWith('//');
            const startsWithCode = /^(module|var|const|let|function|'use strict')/.test(content.trim());
            const notJson = !content.trim().startsWith('{') && !content.trim().startsWith('[');
            
            return startsWithComment || startsWithCode || notJson;
            
        } catch {
            return false;
        }
    }
    
    /**
     * Perform final verification
     */
    async performFinalVerification() {
        const result = {
            phase: 'Final Verification',
            status: 'PASSED',
            details: {},
            issues: []
        };
        
        try {
            // Final contamination check
            const finalContamination = await this.contaminationResolver.detectContamination();
            
            if (finalContamination.length > 0) {
                result.status = 'FAILED';
                result.details.finalContamination = finalContamination;
                result.issues.push({
                    type: 'FINAL_CONTAMINATION_CHECK_FAILED',
                    files: finalContamination.map(c => c.file),
                    message: 'Contamination still present after recovery attempts',
                    severity: 'HIGH'
                });
                console.log(`❌ Final check failed - ${finalContamination.length} files still contaminated`);
            } else {
                console.log('✅ Final contamination check passed');
            }
            
            // Verify critical systems are intact
            const criticalSystemsIntact = await this.verifyCriticalSystems();
            result.details.criticalSystemsIntact = criticalSystemsIntact;
            
            if (!criticalSystemsIntact) {
                result.status = 'FAILED';
                result.issues.push({
                    type: 'CRITICAL_SYSTEMS_COMPROMISED',
                    message: 'Critical build systems are compromised',
                    severity: 'CRITICAL'
                });
                console.log('❌ Critical systems compromised');
            } else {
                console.log('✅ Critical systems intact');
            }
            
            // Create final backup before build
            console.log('📦 Creating final pre-build backup...');
            await this.contaminationResolver.createBackups();
            console.log('✅ Final pre-build backup created');
            
        } catch (error) {
            result.status = 'ERROR';
            result.error = error.message;
            console.log(`❌ Final verification failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Verify critical systems are intact
     */
    async verifyCriticalSystems() {
        try {
            // Check Jest exit handling
            const jestRunPath = path.join(this.projectRoot, 'node_modules/jest-cli/build/run.js');
            const exitPath = path.join(this.projectRoot, 'node_modules/exit/lib/exit.js');
            
            const criticalFiles = [jestRunPath, exitPath];
            
            for (const file of criticalFiles) {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Ensure files contain valid JavaScript, not JSON
                    if (content.trim().startsWith('{') && content.includes('"project"')) {
                        return false; // Found JSON contamination
                    }
                }
            }
            
            return true;
            
        } catch {
            return false;
        }
    }
    
    /**
     * Generate validation summary
     */
    generateSummary() {
        const totalPhases = this.validationResults.length;
        const passedPhases = this.validationResults.filter(r => r.status === 'PASSED').length;
        const failedPhases = this.validationResults.filter(r => r.status === 'FAILED').length;
        const errorPhases = this.validationResults.filter(r => r.status === 'ERROR').length;
        
        const totalIssues = this.validationResults.reduce((sum, r) => sum + (r.issues ? r.issues.length : 0), 0);
        const highSeverityIssues = this.validationResults.reduce((sum, r) => {
            return sum + (r.issues ? r.issues.filter(i => i.severity === 'HIGH').length : 0);
        }, 0);
        
        return {
            totalPhases,
            passedPhases,
            failedPhases,
            errorPhases,
            totalIssues,
            highSeverityIssues
        };
    }
    
    /**
     * Display validation results
     */
    displayResults(report) {
        console.log('\n📊 Build Validation Results');
        console.log('============================');
        console.log(`Overall Status: ${report.overallStatus}`);
        console.log(`Execution Time: ${report.executionTime}ms`);
        console.log(`Phases: ${report.summary.passedPhases}/${report.summary.totalPhases} passed`);
        
        if (report.summary.totalIssues > 0) {
            console.log(`Issues: ${report.summary.totalIssues} total (${report.summary.highSeverityIssues} high severity)`);
        }
        
        console.log('\nPhase Details:');
        for (const phase of report.phases) {
            const statusIcon = phase.status === 'PASSED' ? '✅' : phase.status === 'FAILED' ? '❌' : '⚠️';
            console.log(`  ${statusIcon} ${phase.phase}: ${phase.status}`);
            
            if (phase.issues && phase.issues.length > 0) {
                for (const issue of phase.issues) {
                    console.log(`    - ${issue.type}: ${issue.message}`);
                }
            }
        }
    }
}

// Main execution
async function main() {
    const validator = new BuildValidator();
    const result = await validator.validateBuildEnvironment();
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
}

// Export for use as module
module.exports = BuildValidator;

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Build validator crashed:', error.message);
        process.exit(1);
    });
}