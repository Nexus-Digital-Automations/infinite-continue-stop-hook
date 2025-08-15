const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReviewSystem {
    constructor() {
        this.reviewCriteria = {
            1: {
                name: 'Build Verification',
                tasks: [
                    'Run clean build from scratch',
                    'Verify zero build errors',
                    'Check all dependencies installed',
                    'Ensure build artifacts generated'
                ]
            },
            2: {
                name: 'Lint and Code Quality',
                tasks: [
                    'Run all linters',
                    'Ensure zero lint errors',
                    'Check for console.log statements',
                    'Verify code style consistency'
                ]
            },
            3: {
                name: 'Test Coverage and Success',
                tasks: [
                    'Run all tests',
                    'Verify 100% coverage on critical modules',
                    'Check 90%+ coverage on other modules',
                    'Ensure no skipped or failing tests'
                ]
            }
        };
    }

    /**
     * Detects the project type based on configuration files
     * Returns 'python', 'javascript', or 'unknown'
     */
    detectProjectType(workingDir) {
        // Check for Python project indicators
        const pythonIndicators = [
            'pyproject.toml',
            'setup.py',
            'requirements.txt',
            'Pipfile',
            'poetry.lock'
        ];
        
        const jsIndicators = [
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'npm-shrinkwrap.json'
        ];
        
        // Check for Python indicators first (pyproject.toml takes precedence)
        for (const indicator of pythonIndicators) {
            if (fs.existsSync(path.join(workingDir, indicator))) {
                return 'python';
            }
        }
        
        // Then check for JavaScript indicators
        for (const indicator of jsIndicators) {
            if (fs.existsSync(path.join(workingDir, indicator))) {
                return 'javascript';
            }
        }
        
        return 'unknown';
    }

    /**
     * Gets language-appropriate important files for tasks
     */
    _getImportantFilesForProject(workingDir) {
        const projectType = this.detectProjectType(workingDir);
        
        if (projectType === 'python') {
            return ['pyproject.toml', 'setup.py', 'requirements.txt', '**/*.py', 'tests/**/*.py'];
        } else if (projectType === 'javascript') {
            return ['package.json', 'eslint.config.js', '**/*.test.js', '**/*.ts'];
        } else {
            return ['**/*'];
        }
    }

    /**
     * Checks if all strikes would pass at 100% quality
     * Returns quality assessment for each strike
     */
    async checkStrikeQuality(workingDir) {
        
        const results = {
            strike1: { name: 'Build Verification', quality: 100, issues: [] },
            strike2: { name: 'Lint and Code Quality', quality: 100, issues: [] },
            strike3: { name: 'Test Coverage and Success', quality: 100, issues: [] },
            overallReady: true
        };

        try {
            // Strike 1: Build Quality Check
            try {
                // Check for package.json and basic build capability
                const packagePath = path.join(workingDir, 'package.json');
                if (fs.existsSync(packagePath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    
                    // Check if build script exists
                    if (!packageJson.scripts || !packageJson.scripts.build) {
                        results.strike1.issues.push('No build script defined in package.json');
                        results.strike1.quality = 80;
                    }
                    
                    // Check node_modules exists
                    if (!fs.existsSync(path.join(workingDir, 'node_modules'))) {
                        results.strike1.issues.push('node_modules not found - dependencies not installed');
                        results.strike1.quality = Math.min(results.strike1.quality, 60);
                    }
                    
                    // Try a quick build check if build script exists
                    if (packageJson.scripts && packageJson.scripts.build) {
                        try {
                            execSync('npm run build', { 
                                cwd: workingDir, 
                                stdio: 'pipe', 
                                timeout: 30000 
                            });
                        } catch {
                            results.strike1.issues.push('Build command fails');
                            results.strike1.quality = 50;
                        }
                    }
                }
            } catch (error) {
                results.strike1.issues.push(`Build check error: ${error.message}`);
                results.strike1.quality = 50;
            }

            // Strike 2: Lint Quality Check - Language-aware
            try {
                const projectType = this.detectProjectType(workingDir);
                
                if (projectType === 'python') {
                    // Python project - use Ruff
                    try {
                        // Check if ruff is available
                        execSync('ruff --version', { 
                            cwd: workingDir, 
                            stdio: 'pipe',
                            timeout: 5000
                        });
                        
                        // Run ruff check
                        const ruffOutput = execSync('ruff check .', { 
                            cwd: workingDir, 
                            stdio: 'pipe',
                            timeout: 15000,
                            encoding: 'utf8'
                        });
                        
                        // Check if output indicates success
                        if (ruffOutput.includes('All checks passed!') || ruffOutput.trim() === '') {
                            // Perfect - no issues found
                            results.strike2.quality = 100;
                        } else {
                            // Parse output for violations
                            const violations = ruffOutput.split('\n').filter(line => line.trim()).length;
                            results.strike2.issues.push(`${violations} ruff violations found`);
                            results.strike2.quality = Math.max(20, 100 - violations * 5);
                        }
                    } catch (ruffError) {
                        if (ruffError.message.includes('command not found') || ruffError.message.includes('not found')) {
                            results.strike2.issues.push('Ruff linter not installed or not available');
                            results.strike2.quality = 70;
                        } else {
                            // Ruff found violations (exit code != 0)
                            const errorOutput = ruffError.stdout || ruffError.stderr || '';
                            if (errorOutput.includes('All checks passed!')) {
                                results.strike2.quality = 100;
                            } else {
                                const violations = errorOutput.split('\n').filter(line => line.trim() && !line.includes('Found')).length;
                                if (violations > 0) {
                                    results.strike2.issues.push(`${violations} ruff violations found`);
                                    results.strike2.quality = Math.max(20, 100 - violations * 5);
                                } else {
                                    results.strike2.quality = 100;
                                }
                            }
                        }
                    }
                } else if (projectType === 'javascript') {
                    // JavaScript project - use ESLint
                    const eslintConfigs = [
                        'eslint.config.js', '.eslintrc.js', '.eslintrc.json', '.eslintrc'
                    ];
                    const hasEslintConfig = eslintConfigs.some(config => 
                        fs.existsSync(path.join(workingDir, config))
                    );
                    
                    if (!hasEslintConfig) {
                        results.strike2.issues.push('No ESLint configuration found');
                        results.strike2.quality = 70;
                    } else {
                        // Try running eslint
                        try {
                            execSync('npx eslint . --format json --no-warn-ignored', { 
                                cwd: workingDir, 
                                stdio: 'pipe',
                                timeout: 15000
                            });
                        } catch (lintError) {
                            // Parse ESLint output to count errors
                            if (lintError.stdout) {
                                try {
                                    const lintResults = JSON.parse(lintError.stdout);
                                    const totalErrors = lintResults.reduce((sum, file) => sum + file.errorCount, 0);
                                    const totalWarnings = lintResults.reduce((sum, file) => sum + file.warningCount, 0);
                                    
                                    if (totalErrors > 0) {
                                        results.strike2.issues.push(`${totalErrors} ESLint errors found`);
                                        results.strike2.quality = Math.max(20, 100 - totalErrors * 5);
                                    }
                                    if (totalWarnings > 0) {
                                        results.strike2.issues.push(`${totalWarnings} ESLint warnings found`);
                                        results.strike2.quality = Math.min(results.strike2.quality, 100 - totalWarnings * 2);
                                    }
                                } catch {
                                    results.strike2.issues.push('ESLint check failed');
                                    results.strike2.quality = 60;
                                }
                            } else {
                                results.strike2.issues.push('ESLint command failed');
                                results.strike2.quality = 60;
                            }
                        }
                    }
                } else {
                    // Unknown project type
                    results.strike2.issues.push('Unknown project type - cannot determine appropriate linter');
                    results.strike2.quality = 50;
                }
            } catch (error) {
                results.strike2.issues.push(`Lint check error: ${error.message}`);
                results.strike2.quality = 60;
            }

            // Strike 3: Test Quality Check
            try {
                const packagePath = path.join(workingDir, 'package.json');
                if (fs.existsSync(packagePath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    
                    // Check if test script exists
                    if (!packageJson.scripts || !packageJson.scripts.test) {
                        results.strike3.issues.push('No test script defined');
                        results.strike3.quality = 40;
                    } else {
                        // Try running tests
                        try {
                            execSync('npm test', { 
                                cwd: workingDir, 
                                stdio: 'pipe',
                                timeout: 30000
                            });
                        } catch {
                            results.strike3.issues.push('Tests are failing');
                            results.strike3.quality = 30;
                        }
                        
                        // Check for coverage script
                        if (packageJson.scripts['test:coverage']) {
                            try {
                                execSync('npm run test:coverage', { 
                                    cwd: workingDir, 
                                    stdio: 'pipe',
                                    timeout: 45000
                                });
                            } catch {
                                results.strike3.issues.push('Coverage check failed');
                                results.strike3.quality = Math.min(results.strike3.quality, 70);
                            }
                        } else {
                            results.strike3.issues.push('No coverage script defined');
                            results.strike3.quality = Math.min(results.strike3.quality, 80);
                        }
                    }
                }
            } catch (error) {
                results.strike3.issues.push(`Test check error: ${error.message}`);
                results.strike3.quality = 40;
            }

            // Determine overall readiness
            results.overallReady = results.strike1.quality >= 100 && 
                                 results.strike2.quality >= 100 && 
                                 results.strike3.quality >= 100;

        } catch (error) {
            console.error('Error in strike quality check:', error);
            results.overallReady = false;
        }

        return results;
    }

    /**
     * Ensures strike review tasks are always at the end of the task list
     * Inserts tasks before strikes (used for review task injection)
     */
    // Task insertion methods removed - no automatic task injection

    // Review task creation method removed - no automatic task injection

    buildReviewPrompt(strikeNumber, criteria) {
        let prompt = `Perform a comprehensive code review for Strike ${strikeNumber}: ${criteria.name}\n\n`;
        prompt += `Review Checklist:\n`;
        
        criteria.tasks.forEach((task, idx) => {
            prompt += `${idx + 1}. ${task}\n`;
        });
        
        prompt += `\nProvide a detailed review report with:\n`;
        prompt += `- Clear PASS/FAIL status for each criterion\n`;
        prompt += `- Specific issues found with file locations\n`;
        prompt += `- Remediation steps if review fails\n`;
        prompt += `- Overall recommendation\n\n`;
        
        prompt += `If the review fails, create specific tasks to address each issue found.\n`;
        prompt += `Be thorough but fair - focus on objective criteria.`;
        
        return prompt;
    }

    // Task injection methods removed - no automatic task creation

    // Strike number calculation removed - no automatic task injection

    handleReviewResult(todoData, reviewPassed) {
        if (reviewPassed) {
            todoData.review_strikes++;
            
            // Check if this was the third strike
            if (todoData.review_strikes === 3) {
                return {
                    action: 'strikes_complete',
                    message: 'All three review strikes passed! Project meets quality standards.'
                };
            } else {
                return {
                    action: 'continue',
                    message: `Strike ${todoData.review_strikes} passed. ${3 - todoData.review_strikes} strikes remaining.`
                };
            }
        } else {
            return {
                action: 'remediation_needed',
                message: 'Review failed. Remediation tasks have been created.'
            };
        }
    }

    // Remediation task creation removed - no automatic task generation
}

module.exports = ReviewSystem;