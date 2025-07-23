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

    createReviewTask(strikeNumber, projectName) {
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