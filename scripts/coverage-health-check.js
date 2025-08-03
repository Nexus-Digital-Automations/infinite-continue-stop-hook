#!/usr/bin/env node

/**
 * Coverage Health Check System
 * 
 * Validates the health of the coverage collection system and detects issues
 * before they cause problems during coverage runs.
 */

const fs = require('fs');
const path = require('path');

class CoverageHealthChecker {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.passed = true;
    }

    /**
     * Run comprehensive health check
     */
    async check() {
        console.log('🏥 Coverage Health Check System');
        console.log('================================');
        
        try {
            await this.checkFileSystem();
            await this.checkConfiguration();
            await this.checkDependencies();
            await this.checkContamination();
            await this.checkPermissions();
            
            this.reportResults();
            return { passed: this.passed, issues: this.issues, warnings: this.warnings };
            
        } catch (error) {
            console.error('💥 Health check failed:', error.message);
            return { passed: false, issues: [error.message], warnings: this.warnings };
        }
    }

    /**
     * Check file system health
     */
    async checkFileSystem() {
        console.log('📁 Checking file system health...');
        
        // Check critical directories
        const criticalDirs = [
            'lib',
            'test',
            'scripts',
            'node_modules'
        ];
        
        for (const dir of criticalDirs) {
            if (!fs.existsSync(dir)) {
                this.addIssue(`Critical directory missing: ${dir}`);
            }
        }
        
        // Check for cache contamination
        const cacheDir = '.jest-cache';
        if (fs.existsSync(cacheDir)) {
            const cacheFiles = fs.readdirSync(cacheDir, { recursive: true });
            const suspiciousFiles = cacheFiles.filter(file => 
                file.includes('TODO.json') || 
                file.includes('infinite-continue-stop-hook') ||
                (typeof file === 'string' && file.length > 100)
            );
            
            if (suspiciousFiles.length > 0) {
                this.addWarning(`Suspicious cache files detected: ${suspiciousFiles.length} files`);
            }
        }
        
        // Check exit.js integrity
        const exitJsPath = 'node_modules/exit/lib/exit.js';
        if (fs.existsSync(exitJsPath)) {
            const content = fs.readFileSync(exitJsPath, 'utf8');
            if (content.includes('TODO.json') || content.includes('infinite-continue-stop-hook')) {
                this.addIssue('exit.js file is contaminated');
            }
        }
        
        console.log('✅ File system check complete');
    }

    /**
     * Check Jest configuration health
     */
    async checkConfiguration() {
        console.log('⚙️ Checking Jest configuration...');
        
        const configs = [
            'jest.config.js',
            'jest.coverage.config.js',
            'jest.coverage.robust.config.js'
        ];
        
        for (const configFile of configs) {
            if (fs.existsSync(configFile)) {
                try {
                    const config = require(path.resolve(configFile));
                    
                    // Check for risky settings
                    if (config.cache !== false && configFile.includes('coverage')) {
                        this.addWarning(`${configFile}: cache should be disabled for coverage`);
                    }
                    
                    if (config.maxWorkers > 1 && configFile.includes('coverage')) {
                        this.addWarning(`${configFile}: maxWorkers should be 1 for coverage`);
                    }
                    
                    if (!config.forceExit) {
                        this.addWarning(`${configFile}: forceExit should be enabled`);
                    }
                    
                } catch (error) {
                    this.addIssue(`Invalid configuration in ${configFile}: ${error.message}`);
                }
            }
        }
        
        console.log('✅ Configuration check complete');
    }

    /**
     * Check dependencies health
     */
    async checkDependencies() {
        console.log('📦 Checking dependencies...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Check critical dependencies
            const criticalDeps = ['jest', 'exit'];
            for (const dep of criticalDeps) {
                if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
                    this.addIssue(`Missing critical dependency: ${dep}`);
                }
            }
            
            // Check for package-lock.json
            if (!fs.existsSync('package-lock.json')) {
                this.addWarning('package-lock.json missing - dependencies may be unstable');
            }
            
        } catch (error) {
            this.addIssue(`Cannot read package.json: ${error.message}`);
        }
        
        console.log('✅ Dependencies check complete');
    }

    /**
     * Check for existing contamination
     */
    async checkContamination() {
        console.log('🧪 Checking for contamination...');
        
        const sensitiveFiles = [
            'node_modules/exit/lib/exit.js',
            'package.json',
            'package-lock.json'
        ];
        
        for (const file of sensitiveFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for JSON contamination patterns
                if (this.detectContamination(content)) {
                    this.addIssue(`Contamination detected in: ${file}`);
                }
            }
        }
        
        // Check cache files
        if (fs.existsSync('.jest-cache')) {
            const cacheFiles = this.getAllFiles('.jest-cache');
            let contaminatedCount = 0;
            
            for (const file of cacheFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    if (this.detectContamination(content)) {
                        contaminatedCount++;
                    }
                } catch {
                    // Ignore binary files or read errors
                }
            }
            
            if (contaminatedCount > 0) {
                this.addWarning(`${contaminatedCount} contaminated cache files detected`);
            }
        }
        
        console.log('✅ Contamination check complete');
    }

    /**
     * Check file permissions
     */
    async checkPermissions() {
        console.log('🔐 Checking file permissions...');
        
        const criticalPaths = [
            'lib',
            'test',
            'scripts',
            'coverage',
            '.jest-cache'
        ];
        
        for (const checkPath of criticalPaths) {
            if (fs.existsSync(checkPath)) {
                try {
                    // Test read/write access
                    const stats = fs.statSync(checkPath);
                    if (!stats.isDirectory()) continue;
                    
                    // Try to create a test file
                    const testFile = path.join(checkPath, '.permission-test');
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                    
                } catch (error) {
                    this.addIssue(`Permission issue with ${checkPath}: ${error.message}`);
                }
            }
        }
        
        console.log('✅ Permissions check complete');
    }

    /**
     * Detect contamination in content
     */
    detectContamination(content) {
        const contaminationPatterns = [
            /"tasks":\s*\[\s*\{/,
            /"infinite-continue-stop-hook"/,
            /"TODO\.json"/,
            /"mode":\s*"(DEVELOPMENT|TESTING|RESEARCH)"/,
            /duplicates.*files.*map.*infinite-continue-stop-hook/,
            /gaI.*package\.json.*II@/
        ];
        
        for (const pattern of contaminationPatterns) {
            if (pattern.test(content)) {
                return true;
            }
        }
        
        // Check for control characters
        for (let i = 0; i < Math.min(content.length, 1000); i++) {
            const charCode = content.charCodeAt(i);
            if ((charCode >= 0 && charCode <= 8) || 
                charCode === 11 || charCode === 12 || 
                (charCode >= 14 && charCode <= 31) || 
                charCode === 127) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get all files recursively
     */
    getAllFiles(dir) {
        const files = [];
        
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    files.push(...this.getAllFiles(fullPath));
                } else {
                    files.push(fullPath);
                }
            }
        } catch {
            // Ignore errors
        }
        
        return files;
    }

    /**
     * Add an issue (causes failure)
     */
    addIssue(message) {
        this.issues.push(message);
        this.passed = false;
        console.error(`❌ ${message}`);
    }

    /**
     * Add a warning (doesn't cause failure)
     */
    addWarning(message) {
        this.warnings.push(message);
        console.warn(`⚠️ ${message}`);
    }

    /**
     * Report final results
     */
    reportResults() {
        console.log('\n📊 Health Check Results:');
        console.log(`Status: ${this.passed ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
        console.log(`Issues: ${this.issues.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        
        if (this.issues.length > 0) {
            console.log('\n❌ Issues:');
            this.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        if (this.passed) {
            console.log('\n✅ Coverage system is healthy and ready for use');
        } else {
            console.log('\n❌ Coverage system has issues that should be resolved before use');
        }
    }
}

// CLI interface
if (require.main === module) {
    const checker = new CoverageHealthChecker();
    
    checker.check()
        .then(results => {
            process.exit(results.passed ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Health check failed:', error.message);
            process.exit(1);
        });
}

module.exports = CoverageHealthChecker;