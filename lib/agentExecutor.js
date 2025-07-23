const fs = require('fs');
const path = require('path');

class AgentExecutor {
    constructor(modesDir) {
        this.modesDir = modesDir;
    }

    buildPrompt(task, mode, todoData) {
        // Start with task context FIRST for visibility
        let fullPrompt = '# INFINITE CONTINUE HOOK - ACTIVE TASK\n\n';
        fullPrompt += this.buildTaskContext(task, mode, todoData);
        fullPrompt += '\n\n---\n\n';
        
        // Get mode-specific prompt
        const modeFile = `${mode.toLowerCase().replace('_', '-')}.md`;
        const modePrompt = this.readModeFile(modeFile);
        fullPrompt += modePrompt + '\n\n';
        
        // Always include general.md at the end
        const generalPrompt = this.readModeFile('general.md');
        fullPrompt += generalPrompt;
        
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
            context += `## Task Creation Context\n\n`;
            context += `You are creating subtasks for the following task:\n\n`;
            context += `**Task ID:** ${task.id}\n`;
            context += `**Description:** ${task.description}\n`;
            context += `**Current Prompt:** ${task.prompt}\n`;
            context += `**Mode:** ${task.mode}\n`;
            context += `**Dependencies:** ${JSON.stringify(task.dependencies)}\n`;
            context += `**Important Files:** ${JSON.stringify(task.important_files)}\n\n`;
            context += `Please analyze this task and create appropriate subtasks using the Task tool.\n`;
            context += `Each subtask should be focused, completable in 2-4 hours, and have clear success criteria.\n`;
            context += `If the task requires external API knowledge, create a RESEARCH subtask first.\n`;
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