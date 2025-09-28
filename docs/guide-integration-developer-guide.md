# TaskManager API Guide Integration - Developer Integration Guide

## Quick Start

The TaskManager API automatically includes comprehensive guides in API responses to enhance developer experience. This guide shows you how to effectively utilize the enhanced guide integration features.

## Basic Integration

### Working with Enhanced Responses

All TaskManager API responses now potentially include guide information. Here's how to work with them:

```javascript
// Example API response with guide integration
const response = await taskManagerAPI.init();

// Standard response data
console.log('Agent ID:', response.agentId);
console.log('Success:', response.success);

// Enhanced guide information (automatically included)
if (response.guide && response.guide.success) {
  console.log('Guide focus:', response.guide.focus);

  // Quick start commands
  if (response.guide.quickStart) {
    console.log('Next steps:');
    response.guide.quickStart.forEach((cmd) => {
      console.log(' -', cmd);
    });
  }

  // Context-specific help
  if (response.guide.initialization_help) {
    console.log('Help:', response.guide.initialization_help.message);
  }
}
```

### Detecting Guide-Enhanced Responses

```javascript
function isGuideEnhanced(response) {
  return response.guide && response.guide.success && response.guide.taskManager;
}

function extractQuickActions(response) {
  if (!isGuideEnhanced(response)) return [];

  return response.guide.quickStart || response.guide.initialization_help?.steps || [];
}

// Usage
const response = await api.init();
const quickActions = extractQuickActions(response);
console.log('Recommended actions:', quickActions);
```

## Working with Task Classification

The guide integration includes comprehensive task classification information:

```javascript
function getTaskTypeInfo(response) {
  if (!response.guide?.taskClassification) return null;

  const types = response.guide.taskClassification.types;
  return types.map((type) => ({
    name: type.name,
    value: type.value,
    priority: type.priority,
    description: type.description,
    examples: type.examples,
    triggers: type.triggers,
  }));
}

// Get task creation guidance
const response = await api.createTask({
  title: 'Example task',
  description: 'Task description',
  // Missing task_type - will get guidance
});

if (!response.success && response.guide) {
  const taskTypes = getTaskTypeInfo(response);
  console.log('Available task types:');
  taskTypes.forEach((type) => {
    console.log(`- ${type.name} (${type.value}): ${type.description}`);
  });
}
```

## Enhanced Error Handling

### Error Context Guidance

Guide integration provides contextual help for errors:

```javascript
async function handleTaskManagerOperation(operation, ...args) {
  try {
    const result = await operation(...args);

    // Success with guide
    if (result.guide) {
      logGuideInfo('Success guidance', result.guide);
    }

    return result;
  } catch (error) {
    // Enhanced error handling with guide
    if (error.guide) {
      console.log('Error context:', error.guide.focus || 'General');

      // Immediate recovery action
      if (error.guide.immediate_action) {
        console.log('Try this:', error.guide.immediate_action);
      }

      // Step-by-step recovery
      if (error.guide.next_steps) {
        console.log('Recovery steps:');
        error.guide.next_steps.forEach((step, i) => {
          console.log(`${i + 1}. ${step}`);
        });
      }

      // Context-specific commands
      if (error.guide.essential_commands) {
        console.log('Helpful commands:');
        Object.entries(error.guide.essential_commands).forEach(([name, cmd]) => {
          console.log(`- ${name}: ${cmd.usage || cmd}`);
        });
      }
    }

    throw error;
  }
}

function logGuideInfo(context, guide) {
  console.log(`[${context}] Focus: ${guide.focus || 'General'}`);

  if (guide.quickStart) {
    console.log('Quick actions:', guide.quickStart);
  }

  if (guide.initialization_help) {
    console.log('Help:', guide.initialization_help.message);
  }
}
```

### Common Error Recovery Patterns

```javascript
class TaskManagerErrorHandler {
  static async handleAgentInitError(error, api) {
    if (error.guide && error.guide.focus === 'Agent Initialization Required') {
      console.log('Agent not initialized - attempting automatic recovery');

      try {
        const initResponse = await api.init();
        console.log('Agent initialized:', initResponse.agentId);
        return initResponse;
      } catch (initError) {
        console.error('Failed to initialize agent:', initError.message);
        if (initError.guide) {
          this.logRecoverySteps(initError.guide);
        }
        throw initError;
      }
    }
    throw error;
  }

  static async handleTaskTypeError(error, taskData, api) {
    if (error.guide && error.guide.task_types) {
      const validTypes = error.guide.task_types;

      // Attempt to infer task type from title/description
      const inferredType = this.inferTaskType(taskData, error.guide);

      if (inferredType) {
        console.log(`Inferred task type: ${inferredType}`);
        return await api.createTask({
          ...taskData,
          task_type: inferredType,
        });
      }

      console.log('Available task types:', validTypes);
      console.log('Example format:', error.guide.example);
    }
    throw error;
  }

  static inferTaskType(taskData, guide) {
    const text = `${taskData.title} ${taskData.description}`.toLowerCase();

    // Use guide classification indicators
    if (guide.taskClassification?.classificationGuide) {
      for (const [category, info] of Object.entries(guide.taskClassification.classificationGuide)) {
        if (info.indicators?.some((indicator) => text.includes(indicator))) {
          return info.task_type;
        }
      }
    }

    return null;
  }

  static logRecoverySteps(guide) {
    if (guide.next_steps) {
      console.log('Recovery steps:');
      guide.next_steps.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });
    }
  }
}
```

## Workflow Integration

### Automated Workflow Execution

Use guide information to automate common workflows:

```javascript
class TaskManagerWorkflowRunner {
  constructor(api) {
    this.api = api;
  }

  async runQuickStartWorkflow() {
    try {
      // Initialize agent
      const initResponse = await this.api.init();

      if (initResponse.guide?.quickStart) {
        console.log('Running automated quick start...');

        // Execute each quick start command
        for (const commandStr of initResponse.guide.quickStart) {
          if (commandStr.includes('status')) {
            const statusResponse = await this.api.getAgentStatus();
            console.log('Agent status:', statusResponse.success ? 'OK' : 'Error');
          } else if (commandStr.includes('list')) {
            const listResponse = await this.api.listTasks();
            console.log('Available tasks:', listResponse.tasks?.length || 0);
          }
        }
      }

      return initResponse;
    } catch (error) {
      await TaskManagerErrorHandler.handleAgentInitError(error, this.api);
    }
  }

  async followWorkflowGuidance(response) {
    if (!response.guide?.workflows) return;

    const workflows = response.guide.workflows;

    // Execute agent workflow
    if (workflows.agentWorkflow) {
      console.log('Following agent workflow...');
      await this.executeWorkflowSteps(workflows.agentWorkflow);
    }

    // Execute task creation workflow
    if (workflows.taskCreationWorkflow) {
      console.log('Task creation workflow available');
      // Can be used for guided task creation
    }
  }

  async executeWorkflowSteps(steps) {
    for (const step of steps) {
      console.log('Workflow step:', step);

      // Parse and execute workflow steps
      if (step.includes("'init'")) {
        await this.api.init();
      } else if (step.includes('Check status')) {
        await this.api.getAgentStatus();
      } else if (step.includes('Claim highest priority')) {
        await this.claimNextTask();
      }
      // Add more workflow step handlers as needed
    }
  }

  async claimNextTask() {
    const tasks = await this.api.listTasks({ status: 'pending' });
    if (tasks.tasks?.length > 0) {
      const nextTask = tasks.tasks[0]; // Highest priority
      return await this.api.claimTask(nextTask.id);
    }
  }
}
```

### Context-Aware Command Execution

```javascript
class ContextAwareTaskManager {
  constructor(api) {
    this.api = api;
    this.cachedGuides = new Map();
  }

  async executeWithContext(operation, ...args) {
    const result = await operation.call(this.api, ...args);

    // Cache guide information for reuse
    if (result.guide) {
      this.cacheGuideInfo(operation.name, result.guide);
    }

    return result;
  }

  cacheGuideInfo(operation, guide) {
    this.cachedGuides.set(operation, {
      guide,
      timestamp: Date.now(),
      ttl: 15 * 60 * 1000, // 15 minutes
    });
  }

  getCachedGuide(operation) {
    const cached = this.cachedGuides.get(operation);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.guide;
    }
    this.cachedGuides.delete(operation);
    return null;
  }

  async getContextualHelp(operation) {
    // Try cache first
    let guide = this.getCachedGuide(operation);

    if (!guide) {
      // Fetch fresh guide by calling the operation with minimal impact
      try {
        const response = await this.api.guide();
        guide = response;
        this.cacheGuideInfo('guide', guide);
      } catch (error) {
        console.warn('Could not fetch contextual help:', error.message);
        return null;
      }
    }

    return guide;
  }

  async suggestNextActions(currentContext) {
    const guide = await this.getContextualHelp(currentContext);

    if (guide?.quickStart) {
      return guide.quickStart;
    }

    if (guide?.workflows?.agentWorkflow) {
      return guide.workflows.agentWorkflow.slice(0, 3); // First 3 steps
    }

    return ['Check status', 'List tasks', 'Review guide'];
  }
}
```

## Performance Optimization

### Client-Side Caching

```javascript
class GuideCache {
  constructor(ttl = 15 * 60 * 1000) {
    // 15 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, guide) {
    this.cache.set(key, {
      guide,
      timestamp: Date.now(),
    });

    // Cleanup old entries
    this.cleanup();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.guide;
    }

    this.cache.delete(key);
    return null;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Usage
const guideCache = new GuideCache();

async function cachedAPICall(api, operation, ...args) {
  const cacheKey = `${operation.name}-${JSON.stringify(args)}`;

  // Check cache first for guide information
  const cachedGuide = guideCache.get(cacheKey);

  const result = await operation.call(api, ...args);

  // Cache new guide information
  if (result.guide && !cachedGuide) {
    guideCache.set(cacheKey, result.guide);
  }

  return result;
}
```

### Selective Guide Processing

```javascript
class SelectiveGuideProcessor {
  constructor(options = {}) {
    this.options = {
      includeExamples: options.includeExamples !== false,
      includeWorkflows: options.includeWorkflows !== false,
      includeTroubleshooting: options.includeTroubleshooting !== false,
      maxGuideSize: options.maxGuideSize || 50000,
    };
  }

  processGuide(response) {
    if (!response.guide) return response;

    const processedGuide = {
      success: response.guide.success,
      focus: response.guide.focus,
    };

    // Include core information always
    if (response.guide.taskManager) {
      processedGuide.taskManager = response.guide.taskManager;
    }

    if (response.guide.quickStart) {
      processedGuide.quickStart = response.guide.quickStart;
    }

    if (response.guide.essential_commands) {
      processedGuide.essential_commands = response.guide.essential_commands;
    }

    // Conditionally include larger sections
    if (this.options.includeExamples && response.guide.examples) {
      processedGuide.examples = response.guide.examples;
    }

    if (this.options.includeWorkflows && response.guide.workflows) {
      processedGuide.workflows = response.guide.workflows;
    }

    if (this.options.includeTroubleshooting) {
      if (response.guide.initialization_help) {
        processedGuide.initialization_help = response.guide.initialization_help;
      }

      if (response.guide.next_steps) {
        processedGuide.next_steps = response.guide.next_steps;
      }
    }

    return {
      ...response,
      guide: processedGuide,
    };
  }

  estimateGuideSize(guide) {
    return JSON.stringify(guide).length;
  }

  shouldProcessGuide(response) {
    if (!response.guide) return false;

    const guideSize = this.estimateGuideSize(response.guide);
    return guideSize <= this.options.maxGuideSize;
  }
}

// Usage
const processor = new SelectiveGuideProcessor({
  includeExamples: true,
  includeWorkflows: false, // Skip workflows in mobile contexts
  maxGuideSize: 25000, // Smaller limit for bandwidth-constrained environments
});

const response = await api.init();
const processedResponse = processor.processGuide(response);
```

## Testing with Guide Integration

### Unit Testing Enhanced Responses

```javascript
// Jest tests for guide integration
describe('TaskManager API Guide Integration', () => {
  let api;

  beforeEach(() => {
    api = new TaskManagerAPI();
  });

  test('init response includes guide information', async () => {
    const response = await api.init();

    expect(response.success).toBe(true);
    expect(response.guide).toBeDefined();
    expect(response.guide.success).toBe(true);
    expect(response.guide.focus).toBe('Agent Initialization');
    expect(response.guide.quickStart).toBeDefined();
    expect(Array.isArray(response.guide.quickStart)).toBe(true);
  });

  test('error responses include contextual guidance', async () => {
    // Test without agent initialization
    try {
      await api.claimTask('non-existent-task');
    } catch (error) {
      expect(error.guide).toBeDefined();
      expect(error.guide.focus).toContain('Agent');
      expect(error.guide.immediate_action).toBeDefined();
    }
  });

  test('task creation validates with helpful guidance', async () => {
    const response = await api.createTask({
      title: 'Test task',
      description: 'Missing task_type',
      // Intentionally missing task_type
    });

    expect(response.success).toBe(false);
    expect(response.guide).toBeDefined();
    expect(response.guide.task_types).toBeDefined();
    expect(response.guide.example).toBeDefined();
  });

  test('guide caching works correctly', async () => {
    const response1 = await api.init();
    const response2 = await api.init();

    // Both should have guides
    expect(response1.guide).toBeDefined();
    expect(response2.guide).toBeDefined();

    // Content should be consistent
    expect(response1.guide.taskManager.version).toBe(response2.guide.taskManager.version);
  });
});
```

### Integration Testing

```javascript
describe('Guide Integration End-to-End', () => {
  test('complete agent workflow with guide assistance', async () => {
    const api = new TaskManagerAPI();

    // Initialize agent with guide
    const initResponse = await api.init();
    expect(initResponse.guide.quickStart).toBeDefined();

    // Follow quickStart guidance
    const quickStart = initResponse.guide.quickStart;

    // Should include status check
    const statusCommand = quickStart.find((cmd) => cmd.includes('status'));
    expect(statusCommand).toBeDefined();

    // Execute status check
    const statusResponse = await api.getAgentStatus();
    expect(statusResponse.success).toBe(true);
    expect(statusResponse.guide).toBeDefined();

    // Should include list check
    const listCommand = quickStart.find((cmd) => cmd.includes('list'));
    expect(listCommand).toBeDefined();

    // Execute list
    const listResponse = await api.listTasks();
    expect(listResponse.success).toBe(true);
  });
});
```

## Best Practices Summary

### 1. Always Check for Guide Information

```javascript
function handleResponse(response) {
  // Process standard response
  if (response.success) {
    // Handle success
  }

  // Process guide information if available
  if (response.guide) {
    processGuideInformation(response.guide);
  }
}
```

### 2. Cache Guide Information

```javascript
const guideCache = new Map();

function cacheGuide(operation, guide) {
  guideCache.set(operation, {
    guide,
    timestamp: Date.now(),
    ttl: 15 * 60 * 1000, // 15 minutes
  });
}
```

### 3. Use Contextual Error Recovery

```javascript
async function robustTaskManagerCall(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.guide?.immediate_action) {
      console.log('Suggested fix:', error.guide.immediate_action);
    }
    throw error;
  }
}
```

### 4. Implement Selective Processing

```javascript
function processGuideForContext(guide, context) {
  if (context.isMobile) {
    // Return minimal guide for mobile
    return {
      focus: guide.focus,
      quickStart: guide.quickStart?.slice(0, 3), // First 3 actions only
    };
  }

  return guide; // Full guide for desktop
}
```

### 5. Monitor Performance Impact

```javascript
function measureGuideImpact(operation) {
  const start = performance.now();
  return operation().then((result) => {
    const duration = performance.now() - start;

    if (result.guide) {
      const guideSize = JSON.stringify(result.guide).length;
      console.log(`Guide overhead: ${duration}ms, Size: ${guideSize} bytes`);
    }

    return result;
  });
}
```

This guide provides comprehensive information for effectively integrating with the TaskManager API's enhanced guide functionality, enabling developers to build more intelligent and user-friendly applications.
