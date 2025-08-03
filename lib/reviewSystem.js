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
     * Creates a task creation task to improve quality before strikes
     */
    createQualityImprovementTask(qualityResults, _projectName) {
        const issues = [];
        
        Object.values(qualityResults).forEach(strike => {
            if (strike.quality < 100 && strike.issues) {
                issues.push(...strike.issues.map(issue => `${strike.name}: ${issue}`));
            }
        });

        return {
            id: `quality-improvement-${Date.now()}`,
            title: 'Create Quality Improvement Tasks',
            description: 'Analyze project quality issues and create specific tasks to reach 100% quality for all strikes',
            mode: 'TASK-CREATION',
            priority: 'high',
            status: 'pending',
            prompt: `Project quality assessment shows issues preventing 100% strike success:

Quality Status:
- Strike 1 (Build): ${qualityResults.strike1?.quality || 0}%
- Strike 2 (Lint): ${qualityResults.strike2?.quality || 0}%  
- Strike 3 (Tests): ${qualityResults.strike3?.quality || 0}%

Issues Found:
${issues.map(issue => `- ${issue}`).join('\n')}

TASK: Analyze these quality gaps and create specific improvement tasks to bring ALL strikes to 100% quality. Create tasks for:
1. Build issues (missing dependencies, build failures, configuration)
2. Code quality issues (lint errors, style violations, code standards)
3. Testing issues (failing tests, missing coverage, test setup)

Insert all improvement tasks BEFORE the strike review tasks. Strikes should always remain last in the task list.`,
            success_criteria: [
                'All quality issues identified and analyzed',
                'Specific improvement tasks created for each quality gap',
                'Tasks properly prioritized and ordered before strikes',
                'Clear path to 100% quality established'
            ],
            important_files: ['package.json', 'eslint.config.js', '**/*.test.js'],
            requires_research: true,
            is_quality_improvement_task: true,
            quality_analysis: qualityResults
        };
    }

    /**
     * Ensures strike review tasks are always at the end of the task list
     * Inserts improvement tasks before strikes
     */
    insertTasksBeforeStrikes(todoData, newTasks) {
        // Separate strike tasks from other tasks
        const strikeTasks = todoData.tasks.filter(task => task.is_review_task);
        const nonStrikeTasks = todoData.tasks.filter(task => !task.is_review_task);
        
        // Combine non-strike tasks with new tasks, then add strikes at the end
        todoData.tasks = [
            ...nonStrikeTasks,
            ...newTasks,
            ...strikeTasks
        ];
        
        return todoData;
    }

    /**
     * Inserts a quality improvement task before strikes and returns updated todo data
     */
    injectQualityImprovementTask(todoData, qualityResults, projectName) {
        const qualityTask = this.createQualityImprovementTask(qualityResults, projectName);
        
        // Insert the quality improvement task before strikes
        return this.insertTasksBeforeStrikes(todoData, [qualityTask]);
    }

    createReviewTask(strikeNumber, _projectName) {
        const criteria = this.reviewCriteria[strikeNumber];
        if (!criteria) {
            throw new Error(`Invalid strike number: ${strikeNumber}`);
        }

        return {
            id: `review-strike-${strikeNumber}`,
            mode: 'REVIEWER',
            description: `Review Strike ${strikeNumber}: ${criteria.name}`,
            prompt: this.buildReviewPrompt(strikeNumber, criteria),
            dependencies: ['**/*.js', '**/*.ts', 'package.json', 'tsconfig.json'],
            important_files: ['package.json', '.eslintrc', 'jest.config.js'],
            status: 'pending',
            requires_research: false,
            subtasks: [],
            is_review_task: true,
            strike_number: strikeNumber
        };
    }

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

    shouldInjectReviewTask(todoData) {
        // Check if we should inject a review task
        if (!todoData || !todoData.tasks) {
            return false;
        }
        
        const nonReviewTasks = todoData.tasks.filter(t => !t.is_review_task);
        const completedNonReviewTasks = nonReviewTasks.filter(t => t.status === 'completed').length;
        const pendingReviewTasks = todoData.tasks.filter(t => 
            t.is_review_task && t.status === 'pending'
        ).length;
        
        // Inject review task every 5 completed tasks, if no review pending
        return completedNonReviewTasks > 0 && 
               completedNonReviewTasks % 5 === 0 && 
               pendingReviewTasks === 0;
    }

    getNextStrikeNumber(todoData) {
        const completedStrikes = todoData.tasks.filter(t => 
            t.is_review_task && t.status === 'completed'
        ).length;
        
        return (completedStrikes % 3) + 1;
    }

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

    createRemediationTasks(failures) {
        const tasks = [];
        
        if (failures.build_errors) {
            failures.build_errors.forEach(error => {
                tasks.push({
                    id: `fix-build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    mode: 'DEBUGGING',
                    description: `Fix build error: ${error.error}`,
                    prompt: `Fix the build error in ${error.file}: ${error.error}\n\nSuggested fix: ${error.fix}`,
                    dependencies: [error.file],
                    important_files: ['package.json', 'tsconfig.json'],
                    status: 'pending',
                    priority: 'high',
                    requires_research: false,
                    subtasks: []
                });
            });
        }
        
        if (failures.lint_errors) {
            tasks.push({
                id: `fix-lint-${Date.now()}`,
                mode: 'REFACTORING',
                description: 'Fix all lint errors',
                prompt: `Fix the following lint errors:\n${failures.lint_errors.map(e => `- ${e}`).join('\n')}`,
                dependencies: failures.lint_files || [],
                important_files: ['.eslintrc', 'tslint.json'],
                status: 'pending',
                priority: 'high',
                requires_research: false,
                subtasks: []
            });
        }
        
        if (failures.test_failures) {
            failures.test_failures.forEach(test => {
                tasks.push({
                    id: `fix-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    mode: 'DEBUGGING',
                    description: `Fix failing test: ${test.name}`,
                    prompt: `Fix the failing test: ${test.name}\n\nError: ${test.error}`,
                    dependencies: [test.file],
                    important_files: test.related_files || [],
                    status: 'pending',
                    priority: 'high',
                    requires_research: false,
                    subtasks: []
                });
            });
        }
        
        if (failures.coverage_gaps) {
            failures.coverage_gaps.forEach(gap => {
                tasks.push({
                    id: `improve-coverage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    mode: 'TESTING',
                    description: `Improve test coverage for ${gap.file}`,
                    prompt: `Improve test coverage for ${gap.file} from ${gap.current}% to ${gap.required}%.\n\nFocus on: ${gap.uncovered_lines}`,
                    dependencies: [gap.file],
                    important_files: gap.test_files || [],
                    status: 'pending',
                    priority: gap.is_critical ? 'high' : 'medium',
                    requires_research: false,
                    subtasks: []
                });
            });
        }
        
        return tasks;
    }
}

module.exports = ReviewSystem;