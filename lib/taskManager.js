const fs = require('fs');
const path = require('path');

class TaskManager {
    constructor(todoPath) {
        this.todoPath = todoPath;
    }

    readTodo() {
        if (!fs.existsSync(this.todoPath)) {
            throw new Error(`TODO.json not found at ${this.todoPath}`);
        }
        return JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
    }

    writeTodo(data) {
        fs.writeFileSync(this.todoPath, JSON.stringify(data, null, 2));
    }

    getCurrentTask() {
        const todoData = this.readTodo();
        return todoData.tasks.find(t => t.status === 'pending' || t.status === 'in_progress');
    }

    updateTaskStatus(taskId, status) {
        const todoData = this.readTodo();
        const task = todoData.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            this.writeTodo(todoData);
        }
    }

    addSubtask(parentTaskId, subtask) {
        const todoData = this.readTodo();
        const parentTask = todoData.tasks.find(t => t.id === parentTaskId);
        if (parentTask) {
            if (!parentTask.subtasks) {
                parentTask.subtasks = [];
            }
            parentTask.subtasks.push(subtask);
            this.writeTodo(todoData);
        }
    }

    getNextMode(todoData) {
        // Alternate between TASK_CREATION and task execution
        if (todoData.last_mode === 'TASK_CREATION' || !todoData.last_mode) {
            const currentTask = this.getCurrentTask();
            return currentTask ? currentTask.mode : 'DEVELOPMENT';
        }
        return 'TASK_CREATION';
    }

    shouldRunReviewer(todoData) {
        // Check if it's time for a review strike
        const completedTasks = todoData.tasks.filter(t => 
            t.status === 'completed' && 
            t.mode !== 'REVIEWER'
        ).length;
        
        // Run reviewer every 5 completed tasks
        return completedTasks > 0 && completedTasks % 5 === 0;
    }

    handleStrikeLogic(todoData) {
        // Reset strikes if all 3 were completed in previous run
        if (todoData.review_strikes === 3 && todoData.strikes_completed_last_run) {
            todoData.review_strikes = 0;
            todoData.strikes_completed_last_run = false;
            return { action: 'reset', message: 'Resetting review strikes to 0 for new cycle' };
        }
        
        // Mark as completed if just finished third strike
        if (todoData.review_strikes === 3 && !todoData.strikes_completed_last_run) {
            todoData.strikes_completed_last_run = true;
            return { action: 'complete', message: 'Third strike completed! Project approved.' };
        }
        
        return { action: 'continue', message: null };
    }
}

module.exports = TaskManager;