# React Task Management Components

This directory contains React components for task management, designed to work with the TaskManager system used in this project.

## Components

### TaskCard.jsx
A reusable card component for displaying individual task information.

**Features:**
- Visual status indicators with color coding
- Category icons for quick identification
- Priority badges (critical, high, medium, low)
- Inline status editing
- Hover effects and responsive design
- Support for task metadata (assigned agent, dependencies, creation date)

**Props:**
- `task` (object, required): Task object with id, title, description, status, category, etc.
- `onStatusChange` (function, optional): Callback for status changes
- `onTaskSelect` (function, optional): Callback when task is clicked

### TaskList.jsx
A comprehensive task management interface with filtering and sorting capabilities.

**Features:**
- Task statistics dashboard
- Real-time search across title, description, and category
- Filter by status and category
- Sort by multiple criteria (date, title, status, category, priority)
- Responsive grid layout
- Empty state handling

**Props:**
- `tasks` (array, optional): Array of task objects
- `onTaskUpdate` (function, optional): Callback for task updates
- `onTaskSelect` (function, optional): Callback for task selection

## Usage Example

```jsx
import React, { useState } from 'react';
import TaskList from './components/TaskList.jsx';

const App = () => {
  const [tasks, setTasks] = useState([
    {
      id: 'task_1',
      title: 'Implement user authentication',
      description: 'Add login and registration functionality',
      status: 'in_progress',
      category: 'missing-feature',
      priority: 'high',
      created_at: '2025-08-19T16:00:00.000Z',
      assigned_agent: 'frontend-agent',
      dependencies: []
    },
    {
      id: 'task_2',
      title: 'Fix linting errors in utils',
      description: 'Resolve ESLint violations in utility functions',
      status: 'pending',
      category: 'linter-error',
      priority: 'medium',
      created_at: '2025-08-19T15:30:00.000Z',
      assigned_agent: null,
      dependencies: ['task_1']
    }
  ]);

  const handleTaskUpdate = (taskId, updates) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const handleTaskSelect = (task) => {
    console.log('Selected task:', task);
    // Handle task selection (e.g., open detail view)
  };

  return (
    <TaskList
      tasks={tasks}
      onTaskUpdate={handleTaskUpdate}
      onTaskSelect={handleTaskSelect}
    />
  );
};

export default App;
```

## Installation Requirements

To use these components, you'll need to install React and PropTypes:

```bash
npm install react react-dom prop-types
```

## Integration with TaskManager API

These components are designed to work with the existing TaskManager API in this project. You can integrate them by:

1. Fetching tasks using the TaskManager API:
```javascript
const TaskManager = require('../lib/taskManager');
const tm = new TaskManager('./TODO.json');

// Fetch tasks
const todoData = await tm.readTodo();
const tasks = todoData.tasks;
```

2. Updating task status via the API:
```javascript
const handleTaskUpdate = async (taskId, updates) => {
  if (updates.status) {
    await tm.updateTaskStatus(taskId, updates.status);
  }
  // Refresh task list
  const updatedData = await tm.readTodo();
  setTasks(updatedData.tasks);
};
```

## Styling

The components use inline styles for portability and don't require external CSS files. The design follows modern UI patterns with:

- Clean, minimal aesthetics
- Consistent spacing and typography
- Accessible color contrast
- Responsive design principles
- Smooth hover and transition effects

## Task Categories and Icons

The components support the following task categories with corresponding icons:

- 🔬 research - Investigation and exploration tasks
- 🔴 linter-error - Code style and linting issues
- 🔥 build-error - Build and compilation failures
- ⚠️ start-error - Application startup issues
- ❌ error - General runtime errors
- 🆕 missing-feature - New functionality requirements
- 🐛 bug - Bug fixes and corrections
- ✨ enhancement - Feature improvements
- ♻️ refactor - Code restructuring
- 📚 documentation - Documentation tasks
- 🧹 chore - Maintenance and cleanup
- 🧪 missing-test - Test coverage gaps
- ⚙️ test-setup - Test infrastructure
- 🔄 test-refactor - Test code improvements
- 📊 test-performance - Performance testing
- 🔍 test-linter-error - Test linting issues
- 🚫 test-error - Test failures
- 🔧 test-feature - Testing feature improvements

## Contributing

When modifying these components:

1. Follow React best practices and hooks patterns
2. Maintain PropTypes for type checking
3. Keep inline styles organized and consistent
4. Test components with various task data scenarios
5. Ensure accessibility standards are met
6. Update this README for any new features or breaking changes