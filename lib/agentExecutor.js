const fs = require('fs');
const path = require('path');

class AgentExecutor {
    constructor(modesDir) {
        this.modesDir = modesDir;
    }

    buildPrompt(task, mode, todoData) {
        // Create minimal prompt that instructs reading files
        let fullPrompt = '# INFINITE CONTINUE HOOK - ACTIVE TASK\n\n';
        fullPrompt += this.buildTaskContext(task, mode, todoData);
        fullPrompt += '\n\n---\n\n';
        
        // Critical instructions to read files
        fullPrompt += `## Critical Instructions\n\n`;
        fullPrompt += `IMMEDIATELY read ALL files in the development directory:\n`;
        fullPrompt += `1. Read ALL files in \`./development/\` directory\n`;
        const modeFileName = `${mode.toLowerCase().replace('_', '-')}.md`;
        fullPrompt += `2. Read the mode-specific file: \`./development/modes/${modeFileName}\`\n\n`;
        
        // Add task-specific file reading instructions
        fullPrompt += this.buildTaskFileInstructions(task);
        
        fullPrompt += `These files contain ALL necessary context and instructions.\n`;
        fullPrompt += `Follow the guidance in these files exactly.\n`;
        
        return fullPrompt;
    }

    readModeFile(filename) {
        const filePath = path.join(this.modesDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Mode file not found: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf8');
    }

    buildTaskContext(task, mode, todoData) {
        let context = '';
        
        // Add prominent task summary box
        context += `┌─────────────────────────────────────────────────────────────────┐\n`;
        context += `│ CURRENT TASK: ${task.description.padEnd(49)} │\n`;
        context += `│ Mode: ${mode.padEnd(58)} │\n`;
        context += `│ Task ID: ${task.id.padEnd(55)} │\n`;
        context += `│ Status: ${task.status.padEnd(56)} │\n`;
        context += `│ Project: ${todoData.project.padEnd(55)} │\n`;
        const summary = this.getTaskSummary(todoData);
        context += `│ Progress: ${summary.completed}/${summary.total} tasks (${summary.percentage}%)`.padEnd(66) + '│\n';
        context += `└─────────────────────────────────────────────────────────────────┘\n\n`;
        
        if (mode === 'TASK_CREATION') {
            context += `## Intelligent Task Creation Context\n\n`;
            context += `**CRITICAL REQUIREMENT**: Create at least 4 tasks/subtasks if the project is incomplete. If fewer than 4 are needed to complete the project, create only what's necessary.\n\n`;
            context += `Analyze the project state and determine what type of task creation is needed:\n`;
            context += `- **New standalone tasks** for missing functionality, features, or technical debt\n`;
            context += `- **Subtasks** to decompose the current task if it's too large/complex\n`;
            context += `- **No task creation** if current tasks adequately cover the project scope\n\n`;
            context += `**Current Task Context** (may need decomposition into subtasks):\n`;
            context += `**Task ID:** ${task.id}\n`;
            context += `**Description:** ${task.description}\n`;
            context += `**Current Prompt:** ${task.prompt}\n`;
            context += `**Mode:** ${task.mode}\n`;
            context += `**Dependencies:** ${JSON.stringify(task.dependencies)}\n`;
            context += `**Important Files:** ${JSON.stringify(task.important_files)}\n\n`;
            context += `**Project Analysis Required**: Read the full TODO.json and assess project completeness, gaps, and needs.\n`;
            context += `Follow the decision framework in the task-creation mode file to determine appropriate action.\n`;
            context += `If no task creation is needed, proceed to the next pending task in the workflow.\n`;
        } else if (mode === 'REVIEWER') {
            context += `## Review Context\n\n`;
            context += `**Current Review Strike:** ${todoData.review_strikes + 1}/3\n\n`;
            context += this.getReviewFocus(todoData.review_strikes + 1);
        } else {
            context += `## Current Task Details\n\n`;
            context += `**Task ID:** ${task.id}\n`;
            context += `**Mode:** ${task.mode}\n`;
            context += `**Description:** ${task.description}\n\n`;
            context += `**Task Prompt:**\n${task.prompt}\n\n`;
            
            if (task.dependencies && task.dependencies.length > 0) {
                context += `**Dependencies to consider:** ${task.dependencies.join(', ')}\n`;
            }
            
            if (task.important_files && task.important_files.length > 0) {
                context += `**Important files to read first:** ${task.important_files.join(', ')}\n`;
            }
            
            if (task.requires_research) {
                context += `\n**Note:** This task requires research. Ensure you have the necessary information before implementation.\n`;
            }
            
            if (task.subtasks && task.subtasks.length > 0) {
                context += `\n**Subtasks created:**\n`;
                task.subtasks.forEach((st, idx) => {
                    context += `${idx + 1}. [${st.status}] ${st.description}\n`;
                });
            }
        }
        
        context += `\n**Review Strikes:** ${todoData.review_strikes}/3\n`;
        
        // Add task completion reminder for all modes
        context += this.buildTaskCompletionReminder(task, mode);
        
        return context;
    }

    getReviewFocus(strikeNumber) {
        const focuses = {
            1: `**Strike 1 Focus:** Build Verification
- Ensure the project builds completely without errors
- Check all dependencies are properly installed
- Verify build artifacts are generated correctly
- No compilation or build-time errors`,
            
            2: `**Strike 2 Focus:** Lint and Code Quality
- Run all linters and ensure zero errors
- Check code style consistency
- Verify no console.log statements in production code
- Ensure proper error handling throughout`,
            
            3: `**Strike 3 Focus:** Test Coverage and Success
- Verify all tests pass without failures
- Check test coverage meets requirements:
  - Critical modules: 100% coverage
  - Business logic: 95%+ coverage
  - Other modules: 90%+ coverage
- No skipped tests`
        };
        
        return focuses[strikeNumber] || focuses[1];
    }

    getTaskSummary(todoData) {
        const total = todoData.tasks.length;
        const completed = todoData.tasks.filter(t => t.status === 'completed').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, completed, percentage };
    }

    buildTaskFileInstructions(task) {
        let instructions = '';
        
        // Check if task has dependencies or important_files
        const hasFiles = (task.dependencies && task.dependencies.length > 0) || 
                        (task.important_files && task.important_files.length > 0);
        
        if (!hasFiles) {
            return instructions;
        }
        
        instructions += `ALSO read the following task-specific files:\n`;
        let fileIndex = 3; // Continue from development directory instructions (1, 2)
        
        // Add important files first (these are highest priority)
        if (task.important_files && task.important_files.length > 0) {
            task.important_files.forEach(file => {
                if (file && file.trim()) {
                    instructions += `${fileIndex}. Read \`${file.trim()}\`\n`;
                    fileIndex++;
                }
            });
        }
        
        // Add dependencies files
        if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach(dep => {
                if (dep && dep.trim()) {
                    instructions += `${fileIndex}. Read \`${dep.trim()}\`\n`;
                    fileIndex++;
                }
            });
        }
        
        instructions += `\n`;
        return instructions;
    }

    buildTaskCompletionReminder(task, mode) {
        let reminder = `\n\n## 🔴 CRITICAL: TASK COMPLETION REMINDER\n\n`;
        
        if (mode === 'TASK_CREATION') {
            reminder += `**AFTER CREATING TASKS**: You MUST mark this task-creation task as completed once you finish creating/updating tasks.\n\n`;
        } else if (mode === 'REVIEWER') {
            reminder += `**AFTER COMPLETING REVIEW**: You MUST mark this review task as completed once you finish the review process.\n\n`;
        } else {
            reminder += `**AFTER COMPLETING THIS TASK**: You MUST mark this task as completed when all work is finished.\n\n`;
        }
        
        reminder += `### Quick Completion Code\n`;
        reminder += `\`\`\`javascript\n`;
        reminder += `// Initialize TaskManager and mark current task as completed\n`;
        reminder += `const TaskManager = require('./lib/taskManager');\n`;
        reminder += `const taskManager = new TaskManager('./TODO.json');\n`;
        reminder += `await taskManager.updateTaskStatus("${task.id}", "completed");\n`;
        reminder += `console.log("✅ Task ${task.id} marked as completed");\n`;
        reminder += `\`\`\`\n\n`;
        
        reminder += `### Completion Criteria Checklist\n`;
        reminder += `✅ **Mark as completed ONLY when:**\n`;
        reminder += `- All success criteria are met\n`;
        reminder += `- Implementation is working correctly\n`;
        reminder += `- Tests pass (if applicable)\n`;
        reminder += `- Code quality standards are met\n`;
        reminder += `- No known issues remain\n\n`;
        
        reminder += `❌ **Do NOT mark as completed if:**\n`;
        reminder += `- Any success criteria remain unmet\n`;
        reminder += `- Implementation has known issues\n`;
        reminder += `- Tests are failing\n`;
        reminder += `- Code needs further refinement\n\n`;
        
        reminder += `**Remember**: The hook system expects tasks to be marked complete for proper workflow management.\n`;
        
        return reminder;
    }

    formatSubagentPrompt(task, subtaskPrompt) {
        // Format prompt for subagent execution
        return `Execute the following subtask as part of the larger task "${task.description}":

${subtaskPrompt}

Important context from parent task:
- Dependencies: ${JSON.stringify(task.dependencies)}
- Important files: ${JSON.stringify(task.important_files)}

Focus on completing this specific subtask efficiently and report back with results.`;
    }
}

module.exports = AgentExecutor;