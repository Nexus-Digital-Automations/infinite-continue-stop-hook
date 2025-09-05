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

    /**
     * Creates a review task for the specified strike number
     * @param {number} strikeNumber - Strike number (1, 2, or 3)
     * @param {string} projectName - Name of the project
     * @returns {object} Review task object
     */
    createReviewTask(strikeNumber, _projectName) {
        if (strikeNumber < 1 || strikeNumber > 3) {
            throw new Error(`Invalid strike number: ${strikeNumber}. Must be 1, 2, or 3.`);
        }

        const reviewCriteria = this.reviewCriteria[strikeNumber];
        
        return {
            id: `review-strike-${strikeNumber}`,
            title: `Review Strike ${strikeNumber}: ${reviewCriteria.name}`,
            description: `Review Strike ${strikeNumber}: ${reviewCriteria.name}`,
            mode: 'REVIEWER',
            status: 'pending',
            is_review_task: true,
            strike_number: strikeNumber,
            requires_research: false,
            subtasks: [],
            dependencies: ['**/*.js', 'package.json'],
            important_files: ['package.json', '.eslintrc', 'jest.config.js'],
            created_at: new Date().toISOString()
        };
    }

    /**
     * Determines if a review task should be injected
     * @param {object} todoData - TODO.json data
     * @returns {boolean} True if review task should be injected
     */
    shouldInjectReviewTask(todoData) {
        if (!todoData || !todoData.tasks) {
            return false;
        }

        // Check if there's already a pending review task
        const hasPendingReviewTask = todoData.tasks.some(task => 
            task.is_review_task && task.status === 'pending'
        );
        
        if (hasPendingReviewTask) {
            return false;
        }

        // Count completed non-review tasks
        const completedNonReviewTasks = todoData.tasks.filter(task => 
            task.status === 'completed' && !task.is_review_task
        ).length;

        // Inject review task after every 5 completed non-review tasks
        return completedNonReviewTasks > 0 && completedNonReviewTasks % 5 === 0;
    }

    /**
     * Gets the next strike number based on current review tasks
     * @param {object} todoData - TODO.json data
     * @returns {number} Next strike number (1, 2, or 3)
     */
    getNextStrikeNumber(todoData) {
        if (!todoData || !todoData.tasks) {
            return 1;
        }

        // Count completed review tasks (regardless of explicit strike_number)
        const completedReviewTasks = todoData.tasks.filter(task => 
            task.is_review_task && task.status === 'completed'
        );

        // Next strike is based on count: 0 completed = strike 1, 1 completed = strike 2, etc.
        const nextStrike = completedReviewTasks.length + 1;
        
        // Cycle back to 1 if we've completed all 3 strikes
        return nextStrike > 3 ? 1 : nextStrike;
    }

    /**
     * Creates remediation tasks based on failure data
     * @param {object} failures - Failure data from review process
     * @returns {Array} Array of remediation task objects
     */
    createRemediationTasks(failures) {
        if (!failures || Object.keys(failures).length === 0) {
            return [];
        }

        const tasks = [];

        // Handle build errors
        if (failures.build_errors && failures.build_errors.length > 0) {
            failures.build_errors.forEach((error) => {
                tasks.push({
                    id: `fix-build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Fix build error: ${error.error}`,
                    description: `Fix build error: ${error.error}`,
                    mode: 'DEBUGGING',
                    status: 'pending',
                    priority: 'high',
                    dependencies: [error.file],
                    important_files: [error.file],
                    created_at: new Date().toISOString()
                });
            });
        }

        // Handle lint errors
        if (failures.lint_errors && failures.lint_errors.length > 0) {
            // Handle case where lint_files is provided separately
            const lintFiles = failures.lint_files || [];
            const importantFiles = [...lintFiles, '.eslintrc'];
            const prompt = failures.lint_errors.join('\n');
            
            tasks.push({
                id: `fix-lint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: `Fix all lint errors`,
                description: `Fix all lint errors`,
                mode: 'REFACTORING',
                status: 'pending',
                dependencies: lintFiles,
                important_files: importantFiles,
                prompt: prompt,
                created_at: new Date().toISOString()
            });
        }

        // Handle test failures
        if (failures.test_failures && failures.test_failures.length > 0) {
            failures.test_failures.forEach((error) => {
                // Include both test file and source file (inferred from test path)
                const importantFiles = [error.file];
                if (error.file && error.file.includes('test/') || error.file.includes('.test.')) {
                    // Try to infer source file from test file name
                    const sourceFile = error.file.replace(/test[/\\]/, 'src/').replace('.test', '');
                    importantFiles.push(sourceFile);
                }
                
                tasks.push({
                    id: `fix-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Fix failing test: ${error.name}`,
                    description: `Fix failing test: ${error.name}`,
                    mode: 'DEBUGGING',
                    status: 'pending',
                    dependencies: [error.file],
                    important_files: importantFiles,
                    created_at: new Date().toISOString()
                });
            });
        }

        // Handle coverage gaps
        if (failures.coverage_gaps && failures.coverage_gaps.length > 0) {
            failures.coverage_gaps.forEach((gap) => {
                // Create test file path from source file
                const testFile = gap.file.replace('src/', 'test/').replace('.js', '.test.js');
                const prompt = `Improve test coverage from ${gap.current}% to ${gap.required}%`;
                
                tasks.push({
                    id: `fix-coverage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Improve test coverage for ${gap.file}`,
                    description: `Improve test coverage for ${gap.file}`,
                    mode: 'TESTING',
                    status: 'pending',
                    dependencies: [gap.file],
                    important_files: [testFile],
                    priority: gap.is_critical ? 'high' : 'medium',
                    prompt: prompt,
                    created_at: new Date().toISOString()
                });
            });
        }

        return tasks;
    }
}

module.exports = ReviewSystem;