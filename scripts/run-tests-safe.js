#!/usr/bin/env node

/**
 * Safe test runner that handles JSON contamination
 * 
 * This script runs Jest tests and immediately fixes any contamination
 * that occurs during the Jest exit process
 */

const { spawn } = require('child_process');
const ContaminationResolver = require('../lib/contaminationResolver');

class SafeTestRunner {
    constructor() {
        this.resolver = new ContaminationResolver();
    }

    async runTestsSafely(jestArgs = []) {
        console.log('🛡️ Starting safe test execution...');
        
        // Store original file contents before testing
        await this.resolver.storeOriginalContents();
        
        // Run Jest in a child process with enhanced worker management (no forceExit)
        const jestProcess = spawn('npx', ['jest', '--detectOpenHandles', '--maxWorkers=2', ...jestArgs], {
            stdio: 'pipe',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'test',
                WORKER_CLEANUP_ENABLED: 'true'
            }
        });

        let testOutput = '';
        let _testErrors = '';
        
        // Capture Jest output
        jestProcess.stdout.on('data', (data) => {
            const output = data.toString();
            process.stdout.write(output);
            testOutput += output;
        });

        jestProcess.stderr.on('data', (data) => {
            const error = data.toString();
            process.stderr.write(error);
            _testErrors += error;
        });

        // Wait for Jest to complete with timeout and graceful shutdown
        const exitCode = await new Promise((resolve) => {
            let resolved = false;
            
            // Set up timeout for Jest process (5 minutes max)
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn('\n⚠️ Jest process timeout - attempting graceful shutdown...');
                    
                    // Try graceful shutdown first
                    jestProcess.kill('SIGTERM');
                    
                    // If still running after 10 seconds, force kill
                    setTimeout(() => {
                        if (!jestProcess.killed) {
                            console.warn('⚠️ Force killing Jest process...');
                            jestProcess.kill('SIGKILL');
                        }
                    }, 10000);
                    
                    resolve(1); // Exit with error code
                }
            }, 300000); // 5 minute timeout
            
            jestProcess.on('close', (code) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve(code);
                }
            });
            
            jestProcess.on('error', (error) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.error('Jest process error:', error.message);
                    resolve(1);
                }
            });
        });

        console.log('\n🧹 Jest completed. Running contamination cleanup...');
        
        // Immediate contamination cleanup
        let cleanupAttempts = 0;
        const maxCleanupAttempts = 5;
        
        while (cleanupAttempts < maxCleanupAttempts) {
            cleanupAttempts++;
            
            try {
                const contaminated = await this.resolver.detectContamination();
                
                if (contaminated.length === 0) {
                    if (cleanupAttempts === 1) {
                        console.log('✅ No contamination detected after Jest execution');
                    } else {
                        console.log(`✅ Cleanup attempt ${cleanupAttempts}: No contamination detected`);
                    }
                    break;
                }
                
                console.log(`🚨 Cleanup attempt ${cleanupAttempts}: Contamination detected in ${contaminated.length} files`);
                for (const item of contaminated) {
                    console.log(`   - ${item.file}: ${item.content.substring(0, 100)}...`);
                }
                
                const result = await this.resolver.restoreContaminatedFiles();
                
                if (result.restored > 0) {
                    console.log(`✅ Cleanup attempt ${cleanupAttempts}: Restored ${result.restored} files`);
                } else {
                    console.log(`⚠️ Cleanup attempt ${cleanupAttempts}: No files were restored`);
                }
                
                // Brief pause between cleanup attempts
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.warn(`Warning during cleanup attempt ${cleanupAttempts}:`, error.message);
            }
        }
        
        // Final verification
        try {
            const finalContamination = await this.resolver.detectContamination();
            if (finalContamination.length > 0) {
                console.error(`❌ Final check: ${finalContamination.length} files still contaminated`);
                for (const item of finalContamination) {
                    console.error(`   - ${item.file}`);
                }
            } else {
                console.log('✅ Final check: All files clean');
            }
        } catch (error) {
            console.warn('Warning during final check:', error.message);
        }
        
        console.log('🎉 Safe test execution completed');
        
        // Extract test results from output
        const testResults = this.parseTestResults(testOutput);
        if (testResults) {
            console.log(`\n📊 Test Summary: ${testResults}`);
        }
        
        // Return the original Jest exit code
        return exitCode;
    }

    parseTestResults(output) {
        // Extract test summary from Jest output
        const summaryMatch = output.match(/Tests:\s+(.+)/);
        const suiteMatch = output.match(/Test Suites:\s+(.+)/);
        
        if (summaryMatch || suiteMatch) {
            return `${summaryMatch ? summaryMatch[1] : ''} | ${suiteMatch ? suiteMatch[1] : ''}`.trim();
        }
        
        return null;
    }
}

// If running as main script
if (require.main === module) {
    const args = process.argv.slice(2);
    const runner = new SafeTestRunner();
    
    runner.runTestsSafely(args).then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('❌ Safe test runner error:', error.message);
        process.exit(1);
    });
}

module.exports = SafeTestRunner;