# Infinite Continue Stop Hook - Development Guide

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Code Standards](#code-standards) 
3. [Extension Patterns](#extension-patterns)
4. [Testing Strategies](#testing-strategies)
5. [Debugging Guide](#debugging-guide)
6. [Performance Optimization](#performance-optimization)
7. [Security Guidelines](#security-guidelines)

---

## Development Workflow

### Overview

The infinite-continue-stop-hook project uses a sophisticated TaskManager system with multi-agent coordination, distributed locking, and automatic error recovery. Understanding the development workflow is crucial for contributing to the system.

### Core System Architecture

```
infinite-continue-stop-hook/
├── lib/                     # Core system components
│   ├── taskManager.js       # Central task management
│   ├── agentRegistry.js     # Multi-agent coordination
│   ├── autoFixer.js         # Automatic error recovery
│   └── distributedLockManager.js # Prevents race conditions
├── taskmanager-api.js       # CLI API interface
├── stop-hook.js            # Infinite continue logic
├── setup-infinite-hook.js  # Project initialization
└── development/            # Development resources
    ├── essentials/         # Critical project constraints
    ├── reports/           # Generated reports
    └── research-reports/  # Research documentation
```

### Essential First Steps

Before beginning any development work:

1. **Read Essential Documentation**
   ```bash
   # MANDATORY: Review essential project constraints
   find development/essentials/ -name "*.md" -exec cat {} \;
   ```

2. **Initialize TaskManager System**
   ```bash
   # Initialize your development agent
   timeout 10s node "taskmanager-api.js" init
   
   # Get comprehensive API guide
   timeout 10s node "taskmanager-api.js" guide
   ```

3. **Check Current Project Status**
   ```bash
   # Review existing tasks and agent status
   timeout 10s node "taskmanager-api.js" status
   timeout 10s node "taskmanager-api.js" list '{"status": "pending"}'
   ```

### Development Lifecycle

#### 1. Task Creation and Management

**Create Tasks with Proper Classification:**
```bash
# ERROR tasks (highest priority)
timeout 10s node "taskmanager-api.js" create '{
  "title": "Fix ESLint violations in auth.js",
  "description": "Resolve linting errors", 
  "category": "error"
}'

# FEATURE tasks
timeout 10s node "taskmanager-api.js" create '{
  "title": "Add dark mode toggle",
  "description": "Implement theme switching",
  "category": "feature"
}'

# SUBTASK tasks (for feature implementation)
timeout 10s node "taskmanager-api.js" create '{
  "title": "Implement login form",
  "description": "Create login UI for auth feature",
  "category": "subtask"
}'

# TEST tasks (lowest priority)
timeout 10s node "taskmanager-api.js" create '{
  "title": "Add UserService tests",
  "description": "Unit test coverage",
  "category": "test"
}'
```

**Task Priority System:**
- **ERROR** (priority 1): Linter violations, build failures, critical bugs
- **FEATURE** (priority 2): New functionality, enhancements, refactoring
- **SUBTASK** (priority 3): Implementation of feature components
- **TEST** (priority 4): Test coverage, validation (blocked until errors/features complete)

#### 2. Task Claiming and Execution

```bash
# Claim highest priority pending task
timeout 10s node "taskmanager-api.js" claim "task_id" "agent_id"

# Check current assigned task
timeout 10s node "taskmanager-api.js" current "agent_id"

# Complete task with evidence
timeout 10s node "taskmanager-api.js" complete "task_id" '{
  "message": "Task completed successfully",
  "validation": "All tests pass, linting clean",
  "files_modified": ["src/component.js", "test/component.test.js"]
}'
```

#### 3. Multi-Agent Coordination

**Deploy Concurrent Agents:**
```javascript
// Example: Deploy multiple specialized agents
const agents = [
  { role: "frontend", specialization: ["react", "css"] },
  { role: "backend", specialization: ["api", "database"] },
  { role: "testing", specialization: ["jest", "e2e"] },
  { role: "documentation", specialization: ["markdown", "api-docs"] }
];

// Initialize multiple agents for complex tasks
agents.forEach(async (config, index) => {
  await execAPI('init', [JSON.stringify(config)]);
});
```

### Agent State Management

**Agent Lifecycle:**
```bash
# Initialize new agent
timeout 10s node "taskmanager-api.js" init '{"role": "development"}'

# Reinitialize existing agent (renew heartbeat)
timeout 10s node "taskmanager-api.js" reinitialize "agent_id"

# Check agent status and assignments
timeout 10s node "taskmanager-api.js" status "agent_id"

# Get orchestration statistics
timeout 10s node "taskmanager-api.js" stats
```

---

## Code Standards

### ESLint Configuration

The project uses ESLint 9 flat configuration with strict security and quality rules:

#### Core Configuration Features

**File: `eslint.config.js`**
- **Base Config**: @eslint/js recommended
- **Security**: eslint-plugin-security for vulnerability detection  
- **Node.js**: eslint-plugin-n for Node.js best practices
- **CommonJS**: Optimized for Node.js CommonJS modules

#### Key Rules and Standards

**Code Quality Rules:**
```javascript
// Mandatory semicolons and single quotes
"semi": ["error", "always"],
"quotes": ["error", "single", { 
  "avoidEscape": true, 
  "allowTemplateLiterals": true 
}],

// Variable and function naming
"no-unused-vars": ["error", { 
  "argsIgnorePattern": "^_",
  "varsIgnorePattern": "^_" 
}],
"no-var": "error",
"prefer-const": "error",

// Async/await patterns
"require-await": "error",
"no-await-in-loop": "warn", // Use Promise.all() instead
"no-async-promise-executor": "error",
```

**Security Rules:**
```javascript
// File system security
"security/detect-non-literal-fs-filename": "warn",
"security/detect-non-literal-require": "warn",

// Code injection prevention
"security/detect-object-injection": "warn", 
"security/detect-unsafe-regex": "error",
"security/detect-eval-with-expression": "error",

// Process security
"security/detect-child-process": "warn",
"security/detect-buffer-noassert": "error",
```

**Formatting Standards:**
```javascript
// Indentation: 2 spaces
"indent": ["error", 2, {
  "SwitchCase": 1,
  "VariableDeclarator": 1,
  "outerIIFEBody": 1
}],

// Function spacing
"space-before-function-paren": ["error", {
  "anonymous": "always",
  "named": "never", 
  "asyncArrow": "always"
}],

// Object and array formatting
"comma-dangle": ["error", "always-multiline"],
"object-curly-spacing": ["error", "always"],
"array-bracket-spacing": ["error", "never"],
```

#### Environment-Specific Configurations

**Test Files (`**/*.test.js`, `**/*.spec.js`):**
- Relaxed `no-console` rules
- Disabled security rules for test scenarios
- Jest globals enabled

**Development Scripts (`development/temp-scripts/**/*.js`):**
- Console statements allowed
- Process.exit permitted
- Reduced severity for experimental code

#### Linting Workflow

**Pre-commit Validation:**
```bash
# Run full project linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix  

# Focus on core files only
npm run lint:focused
```

**Post-Edit Linting (Mandatory):**
```bash
# After editing any file, immediately run:
eslint path/to/modified/file.js

# Fix all errors before continuing
eslint path/to/modified/file.js --fix
```

### Documentation Standards

#### Function Documentation Template

```javascript
/**
 * Brief description of function purpose
 * 
 * Detailed explanation of functionality, business logic,
 * and any important implementation notes.
 * 
 * @param {string} paramName - Description of parameter
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enableFeature] - Optional feature flag
 * @returns {Promise<Object>} Description of return value
 * 
 * @example
 * const result = await functionName('input', { enableFeature: true });
 * console.log(result.data);
 * 
 * @throws {Error} When invalid input provided
 * @since 2.0.0
 */
function functionName(paramName, options = {}) {
  // Implementation with extensive logging
  const operationId = generateOperationId();
  logger.info(`[${operationId}] Starting ${functionName.name}`, {
    paramName, 
    options: JSON.stringify(options),
    timestamp: new Date().toISOString()
  });
  
  try {
    // Core logic here
    const result = processLogic(paramName, options);
    
    logger.info(`[${operationId}] Operation completed successfully`, {
      resultSize: JSON.stringify(result).length,
      duration: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    logger.error(`[${operationId}] Operation failed`, {
      error: error.message,
      stack: error.stack,
      input: { paramName, options }
    });
    throw error;
  }
}
```

#### Class Documentation Template

```javascript
/**
 * Class Name - Brief description
 * 
 * === OVERVIEW ===
 * Detailed explanation of class purpose, architecture decisions,
 * and how it fits into the larger system.
 * 
 * === KEY FEATURES ===
 * • Feature 1: Description
 * • Feature 2: Description
 * • Feature 3: Description
 * 
 * === USAGE PATTERNS ===
 * • Pattern 1: When and how to use
 * • Pattern 2: Common scenarios
 * 
 * === PERFORMANCE CHARACTERISTICS ===
 * • Memory usage patterns
 * • Time complexity considerations
 * • Scaling behavior
 * 
 * @example
 * const instance = new ClassName(options);
 * const result = await instance.method();
 * 
 * @since 2.0.0
 */
class ClassName {
  constructor(options = {}) {
    // Comprehensive initialization logging
    this.operationId = generateOperationId();
    this.logger = getLogger('ClassName');
    
    this.logger.info(`[${this.operationId}] Initializing ClassName`, {
      options: JSON.stringify(options),
      timestamp: new Date().toISOString()
    });
    
    // Initialize properties with validation
    this.validateOptions(options);
    this.initializeComponents(options);
  }
}
```

---

## Extension Patterns

### Adding New Features

#### 1. Feature Suggestion and Approval Workflow

**Step 1: Suggest Feature via API**
```bash
# Suggest new feature for user approval
timeout 10s node "taskmanager-api.js" suggest-feature '{
  "title": "Real-time Log Streaming",
  "description": "Live log monitoring and streaming capabilities",
  "rationale": "Enhanced debugging and system observability",
  "category": "enhancement",
  "estimated_effort": "medium"
}' "agent_id"
```

**Step 2: List and Review Suggestions**
```bash
# View all suggested features awaiting approval
timeout 10s node "taskmanager-api.js" list-suggested-features

# Get feature statistics
timeout 10s node "taskmanager-api.js" feature-stats
```

**Step 3: User Approval Process**
```bash
# Approve feature (user action)
timeout 10s node "taskmanager-api.js" approve-feature "feature_id" "user_id"

# Reject feature (user action) 
timeout 10s node "taskmanager-api.js" reject-feature "feature_id" "user_id" "reason"
```

#### 2. Feature Implementation Pattern

**Phase-Based Implementation:**
```bash
# Create phases for complex features
timeout 10s node "taskmanager-api.js" create-phase "feature_id" '{
  "title": "Phase 1: Planning & Requirements", 
  "description": "Gather requirements and design architecture"
}'

# Progress through phases
timeout 10s node "taskmanager-api.js" progress-phase "feature_id" 1

# Track phase completion
timeout 10s node "taskmanager-api.js" phase-stats "feature_id"
```

### Adding New Commands

#### 1. TaskManager API Extension Pattern

**File: `taskmanager-api.js`**

```javascript
// Add new command to command mapping
const commandMap = {
  // ... existing commands
  'new-command': 'handleNewCommand',
};

/**
 * Handle new command implementation
 * @param {Array} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function handleNewCommand(args) {
  const operationId = generateOperationId();
  logger.info(`[${operationId}] Executing new-command`, { args });
  
  try {
    // Parse command arguments
    const [param1, param2] = args;
    if (!param1) {
      throw new Error('Parameter 1 is required');
    }
    
    // Initialize TaskManager with project validation
    const projectRoot = findProjectRoot();
    const taskManager = await initializeTaskManager(projectRoot);
    
    // Execute command logic
    const result = await taskManager.executeNewFeature(param1, param2);
    
    // Return consistent response format
    return {
      success: true,
      result,
      operationId,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error(`[${operationId}] New command failed`, { 
      error: error.message, 
      stack: error.stack 
    });
    
    return {
      success: false,
      error: error.message,
      operationId,
      timestamp: new Date().toISOString()
    };
  }
}
```

#### 2. Core TaskManager Extension Pattern

**File: `lib/taskManager.js`**

```javascript
/**
 * Add new method to TaskManager class
 * @param {string} param1 - Description
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Method result
 */
async function executeNewFeature(param1, options = {}) {
  const operationId = generateOperationId();
  
  // Acquire distributed lock for thread safety
  await this.acquireLock('new-feature-operation');
  
  try {
    // Validate input parameters
    if (!param1 || typeof param1 !== 'string') {
      throw new Error('Invalid param1: must be non-empty string');
    }
    
    // Read current TODO.json with auto-fix
    const todoData = await this.readTodo();
    
    // Implement feature logic
    const result = this.processNewFeature(todoData, param1, options);
    
    // Write changes atomically
    await this.writeTodo(todoData);
    
    // Log success
    logger.info(`[${operationId}] New feature executed successfully`, {
      param1,
      resultSize: JSON.stringify(result).length
    });
    
    return result;
    
  } finally {
    // Always release lock
    await this.releaseLock('new-feature-operation');
  }
}
```

### Adding New Library Components

#### 1. Create Modular Component

**File: `lib/newComponent.js`**

```javascript
/**
 * NewComponent - Brief description
 * 
 * === PURPOSE ===
 * Explanation of component functionality and integration points
 * 
 * === DEPENDENCIES ===
 * • Component 1: Why it's needed
 * • Component 2: How it's used
 * 
 * === PERFORMANCE ===
 * • Time complexity: O(n)
 * • Memory usage: Constant  
 * • Scaling characteristics
 */

const logger = require('./appLogger');

class NewComponent {
  constructor(options = {}) {
    this.operationId = generateOperationId();
    this.logger = logger.getLogger('NewComponent');
    
    // Validate and store configuration
    this.validateOptions(options);
    this.config = { 
      ...this.getDefaults(), 
      ...options 
    };
    
    this.logger.info(`[${this.operationId}] NewComponent initialized`, {
      config: JSON.stringify(this.config)
    });
  }
  
  /**
   * Get default configuration options
   * @returns {Object} Default configuration
   */
  getDefaults() {
    return {
      enableFeature: true,
      timeout: 5000,
      retryAttempts: 3
    };
  }
  
  /**
   * Validate constructor options
   * @param {Object} options - Options to validate
   * @throws {Error} If validation fails
   */
  validateOptions(options) {
    if (options.timeout && (typeof options.timeout !== 'number' || options.timeout < 0)) {
      throw new Error('Timeout must be a non-negative number');
    }
    
    if (options.retryAttempts && !Number.isInteger(options.retryAttempts)) {
      throw new Error('Retry attempts must be an integer');
    }
  }
}

module.exports = NewComponent;
```

#### 2. Integration with TaskManager

**File: `lib/taskManager.js`**

```javascript
// Add component to TaskManager imports
const NewComponent = require('./newComponent');

class TaskManager {
  constructor(todoPath, options = {}) {
    // ... existing constructor
    
    // Lazy-load new component
    this._newComponent = null;
    this._newComponentOptions = {
      ...options.newComponent,
      projectRoot: options.projectRoot
    };
  }
  
  /**
   * Get or initialize new component (lazy loading)
   * @returns {NewComponent} Component instance
   */
  getNewComponent() {
    if (!this._newComponent) {
      this._newComponent = new NewComponent(this._newComponentOptions);
    }
    return this._newComponent;
  }
  
  /**
   * Use new component in TaskManager methods
   * @param {string} input - Input parameter
   * @returns {Promise<Object>} Processing result
   */
  async processWithNewComponent(input) {
    const component = this.getNewComponent();
    return await component.process(input);
  }
}
```

---

## Testing Strategies

### Test Architecture

The project uses Jest for comprehensive testing with multiple test categories:

#### 1. Unit Tests

**Test File Structure:**
```
test/
├── unit/
│   ├── taskManager.unit.test.js
│   ├── agentRegistry.unit.test.js
│   └── autoFixer.unit.test.js
├── integration/
│   ├── api-workflow.integration.test.js
│   └── multi-agent.integration.test.js
└── e2e/
    └── complete-workflow.e2e.test.js
```

**Unit Test Template:**
```javascript
/**
 * Unit Tests for ComponentName
 * 
 * Tests individual methods and functionality in isolation
 * with mocked dependencies and controlled inputs.
 */

const ComponentName = require('../lib/componentName');
const logger = require('../lib/appLogger');

// Mock dependencies
jest.mock('../lib/appLogger');

describe('ComponentName', () => {
  let component;
  let mockLogger;
  
  beforeEach(() => {
    // Set up fresh mocks for each test
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    logger.getLogger.mockReturnValue(mockLogger);
    
    // Initialize component with test configuration
    component = new ComponentName({
      testMode: true,
      timeout: 1000
    });
  });
  
  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultComponent = new ComponentName();
      
      expect(defaultComponent.config.enableFeature).toBe(true);
      expect(defaultComponent.config.timeout).toBe(5000);
    });
    
    it('should validate options and throw on invalid input', () => {
      expect(() => {
        new ComponentName({ timeout: -1 });
      }).toThrow('Timeout must be a non-negative number');
    });
  });
  
  describe('processData', () => {
    it('should process valid data successfully', async () => {
      const input = { type: 'test', data: 'value' };
      const result = await component.processData(input);
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing completed'),
        expect.objectContaining({ input })
      );
    });
    
    it('should handle errors gracefully', async () => {
      const invalidInput = null;
      
      await expect(component.processData(invalidInput))
        .rejects.toThrow('Invalid input');
        
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Processing failed'),
        expect.objectContaining({ error: 'Invalid input' })
      );
    });
  });
});
```

#### 2. Integration Tests

**API Integration Test Pattern:**
```javascript
/**
 * TaskManager API Integration Tests
 * 
 * Tests complete workflows involving multiple components
 * working together in realistic scenarios.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_PROJECT = path.join(__dirname, 'test-project');
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');

describe('TaskManager API Integration', () => {
  beforeEach(async () => {
    // Create clean test environment
    await setupTestProject();
  });
  
  afterEach(async () => {
    // Clean up test environment
    await cleanupTestProject();
  });
  
  describe('complete task workflow', () => {
    it('should create, claim, and complete task successfully', async () => {
      // Step 1: Initialize agent
      const initResult = await execAPI('init');
      expect(initResult.success).toBe(true);
      
      const agentId = initResult.agentId;
      
      // Step 2: Create task
      const createResult = await execAPI('create', [JSON.stringify({
        title: 'Test Task',
        description: 'Integration test task',
        category: 'feature'
      })]);
      expect(createResult.success).toBe(true);
      
      const taskId = createResult.taskId;
      
      // Step 3: Claim task
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);
      
      // Step 4: Complete task
      const completeResult = await execAPI('complete', [taskId, JSON.stringify({
        message: 'Task completed successfully',
        validation: 'All checks passed'
      })]);
      expect(completeResult.success).toBe(true);
      
      // Step 5: Verify completion
      const statusResult = await execAPI('status', [agentId]);
      expect(statusResult.assignedTasks).toHaveLength(0);
    });
  });
});

/**
 * Execute API command and return parsed result
 */
function execAPI(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('timeout', ['10s', 'node', API_PATH, command, ...args, '--project-root', TEST_PROJECT], {
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => stdout += data);
    child.stderr.on('data', (data) => stderr += data);
    
    child.on('close', (code) => {
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Parse failed: ${stdout}\n${stderr}`));
      }
    });
    
    child.on('error', reject);
  });
}
```

#### 3. End-to-End Tests

**Multi-Agent Coordination Test:**
```javascript
/**
 * End-to-End Multi-Agent Tests
 * 
 * Tests complete system functionality with multiple
 * agents working concurrently on complex scenarios.
 */

describe('Multi-Agent E2E Workflow', () => {
  it('should coordinate multiple agents on complex task', async () => {
    const agents = [];
    
    // Initialize multiple agents with different specializations
    for (let i = 0; i < 3; i++) {
      const agentResult = await execAPI('init', [JSON.stringify({
        role: `agent-${i}`,
        specialization: [`skill-${i}`],
        maxConcurrentTasks: 2
      })]);
      
      agents.push(agentResult.agentId);
    }
    
    // Create multiple tasks of different priorities
    const taskIds = [];
    
    const taskTypes = [
      { category: 'error', title: 'Fix critical bug' },
      { category: 'feature', title: 'Implement new feature' },
      { category: 'subtask', title: 'Create component' },
      { category: 'test', title: 'Add test coverage' }
    ];
    
    for (const taskType of taskTypes) {
      const createResult = await execAPI('create', [JSON.stringify({
        ...taskType,
        description: `E2E test ${taskType.category} task`,
      })]);
      
      taskIds.push(createResult.taskId);
    }
    
    // Agents claim tasks based on priority
    const claims = [];
    for (let i = 0; i < agents.length; i++) {
      const claimResult = await execAPI('claim', [taskIds[i], agents[i]]);
      claims.push(claimResult);
    }
    
    // Verify proper priority ordering (error task claimed first)
    expect(claims[0].task.category).toBe('error');
    
    // Complete tasks and verify coordination
    for (let i = 0; i < claims.length; i++) {
      if (claims[i].success) {
        await execAPI('complete', [taskIds[i], JSON.stringify({
          message: `E2E test completion by ${agents[i]}`
        })]);
      }
    }
    
    // Verify system state
    const stats = await execAPI('stats');
    expect(stats.activeAgents).toBe(3);
    expect(stats.completedTasks).toBeGreaterThan(0);
  });
});
```

### Testing Best Practices

#### 1. Test Environment Setup

**Jest Configuration (`jest.config.js`):**
```javascript
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // 30 seconds for integration tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/test-projects/'],
  collectCoverageFrom: [
    'lib/**/*.js',
    'taskmanager-api.js',
    '!lib/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85
    }
  }
};
```

**Test Setup (`test/setup.js`):**
```javascript
/**
 * Global test setup and utilities
 */

const fs = require('fs');
const path = require('path');

// Increase timeout for slower systems
jest.setTimeout(30000);

// Global test utilities
global.generateTestId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

global.createTestProject = async (projectName) => {
  const testDir = path.join(__dirname, 'test-projects', projectName);
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create minimal TODO.json
  const todoData = {
    project: projectName,
    tasks: [],
    current_mode: 'TEST',
    agents: {},
    features: []
  };
  
  fs.writeFileSync(
    path.join(testDir, 'TODO.json'),
    JSON.stringify(todoData, null, 2)
  );
  
  return testDir;
};

global.cleanupTestProject = async (projectPath) => {
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
};

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
```

#### 2. Component Testing Strategies

**TaskManager Component Testing:**
```bash
# Run focused component tests
npm run test -- --testPathPattern="taskManager"

# Run with coverage
npm run test -- --coverage --testPathPattern="lib/"

# Run integration tests only
npm run test -- --testPathPattern="integration"

# Watch mode for development
npm run test -- --watch --testPathPattern="unit"
```

**Test Categories:**
1. **Unit Tests**: Individual methods, pure functions, isolated logic
2. **Integration Tests**: Component interaction, API workflows, data flow
3. **E2E Tests**: Complete user scenarios, multi-agent coordination
4. **Performance Tests**: Load testing, memory usage, concurrent operations

---

## Debugging Guide

### Debug Tools and Techniques

#### 1. Logging System

The project uses a comprehensive logging system for debugging:

**Logger Configuration:**
```javascript
const logger = require('./lib/appLogger');

// Create component-specific logger
const componentLogger = logger.getLogger('ComponentName');

// Use structured logging with operation IDs
const operationId = generateOperationId();

componentLogger.info(`[${operationId}] Operation starting`, {
  input: JSON.stringify(input),
  timestamp: new Date().toISOString(),
  context: { userId, sessionId }
});
```

**Log Levels and Usage:**
- **ERROR**: Exceptions, failures, critical issues
- **WARN**: Performance issues, deprecated usage, recoverable errors  
- **INFO**: Normal operation flow, business logic milestones
- **DEBUG**: Detailed execution flow, variable states

#### 2. Debug Environment Setup

**Enable Debug Mode:**
```bash
# Set debug environment
export NODE_ENV=development
export DEBUG=true
export LOG_LEVEL=debug

# Enable detailed TaskManager logging
export TASKMANAGER_DEBUG=true
export AGENT_DEBUG=true
```

**Debug-Specific Logging:**
```javascript
if (process.env.TASKMANAGER_DEBUG) {
  logger.debug(`[${operationId}] Task state transition`, {
    taskId: task.id,
    oldStatus: task.status,
    newStatus: newStatus,
    agentId: agentId,
    stackTrace: new Error().stack
  });
}
```

#### 3. Common Debugging Scenarios

**Task Assignment Issues:**
```bash
# Debug task claiming problems
timeout 10s node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  console.log('=== TASK ASSIGNMENT DEBUG ===');
  data.tasks.forEach(task => {
    console.log(\`Task: \${task.id}\`);
    console.log(\`  Status: \${task.status}\`);
    console.log(\`  Assigned Agent: \${task.assigned_agent || 'None'}\`);
    console.log(\`  Claimed By: \${task.claimed_by || 'None'}\`);
    console.log(\`  Started At: \${task.started_at || 'Never'}\`);
    console.log('');
  });
});"
```

**Agent Status Debugging:**
```bash
# Debug agent heartbeat and status
timeout 10s node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  console.log('=== AGENT STATUS DEBUG ===');
  Object.entries(data.agents || {}).forEach(([agentId, agent]) => {
    const lastHeartbeat = new Date(agent.lastHeartbeat || 0);
    const timeSince = Date.now() - lastHeartbeat.getTime();
    const isStale = timeSince > 900000; // 15 minutes
    
    console.log(\`Agent: \${agentId}\`);
    console.log(\`  Status: \${agent.status}\`);
    console.log(\`  Role: \${agent.role}\`);
    console.log(\`  Last Heartbeat: \${lastHeartbeat.toISOString()}\`);
    console.log(\`  Time Since Heartbeat: \${Math.round(timeSince/1000)}s\`);
    console.log(\`  Is Stale: \${isStale}\`);
    console.log(\`  Assigned Tasks: \${agent.assignedTasks?.length || 0}\`);
    console.log('');
  });
});"
```

**Lock Debugging:**
```javascript
/**
 * Debug distributed lock issues
 */
class DistributedLockManager {
  async acquireLock(lockKey, agentId, timeout = 2000) {
    const operationId = generateOperationId();
    
    if (process.env.LOCK_DEBUG) {
      logger.debug(`[${operationId}] Attempting to acquire lock`, {
        lockKey,
        agentId,
        timeout,
        existingLocks: Object.keys(this.locks)
      });
    }
    
    const startTime = Date.now();
    
    try {
      // Lock acquisition logic
      const result = await this.tryAcquireLock(lockKey, agentId, timeout);
      
      if (process.env.LOCK_DEBUG) {
        logger.debug(`[${operationId}] Lock acquired successfully`, {
          lockKey,
          agentId,
          acquisitionTime: Date.now() - startTime,
          lockDetails: this.locks[lockKey]
        });
      }
      
      return result;
      
    } catch (error) {
      if (process.env.LOCK_DEBUG) {
        logger.debug(`[${operationId}] Lock acquisition failed`, {
          lockKey,
          agentId,
          error: error.message,
          attemptDuration: Date.now() - startTime,
          currentLocks: Object.keys(this.locks)
        });
      }
      throw error;
    }
  }
}
```

#### 4. Performance Debugging

**Performance Profiling:**
```javascript
/**
 * Performance debugging with timing and memory tracking
 */
async function debugPerformance(operation, ...args) {
  const operationId = generateOperationId();
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  logger.info(`[${operationId}] Performance tracking started`, {
    operation: operation.name,
    args: JSON.stringify(args),
    startMemory: {
      rss: Math.round(startMemory.rss / 1024 / 1024),
      heapUsed: Math.round(startMemory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(startMemory.heapTotal / 1024 / 1024)
    }
  });
  
  try {
    const result = await operation(...args);
    
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    logger.info(`[${operationId}] Performance tracking completed`, {
      operation: operation.name,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: {
        rss: Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024),
        heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024)
      },
      resultSize: JSON.stringify(result).length
    });
    
    return result;
    
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000;
    
    logger.error(`[${operationId}] Performance tracking failed`, {
      operation: operation.name,
      duration: `${duration.toFixed(2)}ms`,
      error: error.message
    });
    
    throw error;
  }
}
```

#### 5. System Health Monitoring

**Health Check Implementation:**
```javascript
/**
 * System health monitoring for debugging
 */
async function performHealthCheck() {
  const healthReport = {
    timestamp: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    taskManager: {},
    agents: {},
    performance: {}
  };
  
  try {
    // Check TaskManager health
    const taskManager = new TaskManager('./TODO.json');
    const todoData = await taskManager.readTodo();
    
    healthReport.taskManager = {
      status: 'healthy',
      totalTasks: todoData.tasks.length,
      pendingTasks: todoData.tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: todoData.tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: todoData.tasks.filter(t => t.status === 'completed').length
    };
    
    // Check agent health
    const activeAgents = Object.values(todoData.agents || {});
    const staleAgents = activeAgents.filter(agent => {
      const timeSince = Date.now() - new Date(agent.lastHeartbeat || 0).getTime();
      return timeSince > 900000; // 15 minutes
    });
    
    healthReport.agents = {
      total: activeAgents.length,
      active: activeAgents.length - staleAgents.length,
      stale: staleAgents.length,
      avgWorkload: activeAgents.reduce((sum, a) => sum + (a.workload || 0), 0) / activeAgents.length
    };
    
    // Performance metrics
    healthReport.performance = {
      avgTaskCompletionTime: await calculateAvgCompletionTime(todoData),
      systemLoad: await getSystemLoad(),
      diskUsage: await getDiskUsage()
    };
    
  } catch (error) {
    healthReport.error = error.message;
    healthReport.status = 'unhealthy';
  }
  
  logger.info('System health check completed', healthReport);
  return healthReport;
}
```

### Debugging Tools

#### 1. Built-in Debug Commands

```bash
# Get comprehensive system status
timeout 10s node "taskmanager-api.js" stats

# Debug agent orchestration
timeout 10s node -e "
const TaskManager = require('./lib/taskManager');
console.log('=== ORCHESTRATION DEBUG ===');
// Debug logic here
"

# Check distributed locks
timeout 10s node -e "
const DistributedLockManager = require('./lib/distributedLockManager');
const dm = new DistributedLockManager();
console.log('Active locks:', dm.getActiveLocks());
"
```

#### 2. Log Analysis Tools

**Log Parsing for Errors:**
```bash
# Find all error entries in logs
grep "ERROR" logs/application.log | tail -20

# Find performance issues
grep "slow\|timeout\|exceeded" logs/application.log

# Track specific operation
grep "operation_123" logs/application.log | sort
```

**Log Analysis Script:**
```javascript
/**
 * Log analysis tool for debugging
 */
const fs = require('fs');

function analyzeLogFile(logPath) {
  const logContent = fs.readFileSync(logPath, 'utf8');
  const lines = logContent.split('\n').filter(line => line.trim());
  
  const analysis = {
    totalEntries: lines.length,
    errorCount: 0,
    warningCount: 0,
    operationFrequency: {},
    performanceIssues: [],
    agentActivity: {}
  };
  
  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      
      // Count log levels
      if (entry.level === 'ERROR') analysis.errorCount++;
      if (entry.level === 'WARN') analysis.warningCount++;
      
      // Track operations
      if (entry.operation) {
        analysis.operationFrequency[entry.operation] = 
          (analysis.operationFrequency[entry.operation] || 0) + 1;
      }
      
      // Detect performance issues
      if (entry.duration && parseFloat(entry.duration) > 1000) {
        analysis.performanceIssues.push({
          operation: entry.operation,
          duration: entry.duration,
          timestamp: entry.timestamp
        });
      }
      
      // Track agent activity
      if (entry.agentId) {
        if (!analysis.agentActivity[entry.agentId]) {
          analysis.agentActivity[entry.agentId] = 0;
        }
        analysis.agentActivity[entry.agentId]++;
      }
      
    } catch (e) {
      // Skip invalid JSON lines
    }
  });
  
  return analysis;
}
```

---

## Performance Optimization

### System Performance Characteristics

#### 1. TaskManager Performance

**Core Optimizations:**
- **Aggressive Caching**: File modification time tracking prevents unnecessary reads
- **Lazy Loading**: Heavy components (AutoFixer, LockManager) loaded on demand
- **Optimized JSON**: Validation skipping for trusted internal operations
- **Memory Efficiency**: Large task sets handled with streaming and pagination

**Cache Implementation:**
```javascript
class TaskManager {
  constructor(todoPath, options = {}) {
    // Performance optimization: Add aggressive caching
    this._cache = {
      data: null,
      lastModified: 0,
      enabled: options.enableCache !== false,
    };
  }
  
  /**
   * Read TODO.json with intelligent caching
   * @param {boolean} skipValidation - Skip expensive validation
   * @returns {Promise<Object>} TODO data
   */
  async readTodo(skipValidation = false) {
    const startTime = process.hrtime.bigint();
    
    try {
      // Check if cached data is still valid
      if (this._cache.enabled) {
        const stats = fs.statSync(this.todoPath);
        const currentModified = stats.mtime.getTime();
        
        if (this._cache.data && currentModified <= this._cache.lastModified) {
          const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          logger.debug('Cache hit for TODO.json read', { 
            duration: `${duration.toFixed(2)}ms`,
            cacheAge: Date.now() - this._cache.lastModified 
          });
          return this._cache.data;
        }
        
        // Cache miss - update cache
        const data = JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
        
        if (!skipValidation) {
          await this.validateTodoStructure(data);
        }
        
        this._cache.data = data;
        this._cache.lastModified = currentModified;
        
        const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        logger.debug('Cache updated for TODO.json read', { 
          duration: `${duration.toFixed(2)}ms`,
          dataSize: JSON.stringify(data).length 
        });
        
        return data;
      }
      
      // Cache disabled - direct read
      const data = JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
      if (!skipValidation) {
        await this.validateTodoStructure(data);
      }
      return data;
      
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      logger.error('TODO.json read failed', { 
        duration: `${duration.toFixed(2)}ms`,
        error: error.message 
      });
      throw error;
    }
  }
}
```

#### 2. Distributed Locking Optimization

**Lock Performance Tuning:**
```javascript
class DistributedLockManager {
  constructor(options = {}) {
    this.options = {
      lockTimeout: options.lockTimeout || 2000, // Reduced from 30s
      lockRetryInterval: options.lockRetryInterval || 5, // 5ms (very fast)
      maxRetries: options.maxRetries || 10, // Reduced from 50
      enableDeadlockDetection: options.enableDeadlockDetection !== false,
      ...options
    };
    
    // Performance optimization: Pre-allocate lock tracking
    this.locks = new Map(); // Use Map for better performance
    this.lockQueue = new Map(); // Track waiting operations
  }
  
  /**
   * Optimized lock acquisition with fast retries
   */
  async acquireLock(lockKey, agentId, timeout = null) {
    const effectiveTimeout = timeout || this.options.lockTimeout;
    const startTime = Date.now();
    let attempts = 0;
    
    while (attempts < this.options.maxRetries) {
      if (Date.now() - startTime > effectiveTimeout) {
        throw new Error(`Lock acquisition timeout for ${lockKey}`);
      }
      
      // Fast path: try to acquire immediately
      if (!this.locks.has(lockKey)) {
        this.locks.set(lockKey, {
          agentId,
          acquiredAt: Date.now(),
          key: lockKey
        });
        
        logger.debug(`Lock acquired`, { 
          lockKey, 
          agentId, 
          attempts: attempts + 1,
          duration: Date.now() - startTime 
        });
        return true;
      }
      
      // Wait before retry (exponential backoff for contested locks)
      const waitTime = Math.min(
        this.options.lockRetryInterval * Math.pow(1.5, attempts),
        100
      );
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempts++;
    }
    
    throw new Error(`Failed to acquire lock ${lockKey} after ${attempts} attempts`);
  }
}
```

#### 3. Agent Registry Performance

**Efficient Agent Management:**
```javascript
class AgentRegistry {
  constructor(options = {}) {
    // Performance optimization: Use efficient data structures
    this.agents = new Map(); // O(1) lookups
    this.activeAgents = new Set(); // O(1) membership tests
    this.agentsByRole = new Map(); // Role-based indexing
    this.heartbeatIndex = new Map(); // Fast heartbeat tracking
    
    // Batch cleanup optimization
    this.cleanupBatchSize = options.cleanupBatchSize || 50;
    this.cleanupInterval = options.cleanupInterval || 30000; // 30 seconds
    
    this.startCleanupScheduler();
  }
  
  /**
   * Batch cleanup of stale agents for better performance
   */
  async batchCleanupStaleAgents() {
    const startTime = process.hrtime.bigint();
    const staleThreshold = Date.now() - (15 * 60 * 1000); // 15 minutes
    const staleAgents = [];
    
    // Efficiently find stale agents using heartbeat index
    for (const [agentId, lastHeartbeat] of this.heartbeatIndex) {
      if (lastHeartbeat < staleThreshold) {
        staleAgents.push(agentId);
        
        // Batch processing - don't process too many at once
        if (staleAgents.length >= this.cleanupBatchSize) {
          break;
        }
      }
    }
    
    // Batch remove stale agents
    let removedCount = 0;
    for (const agentId of staleAgents) {
      if (await this.removeAgent(agentId)) {
        removedCount++;
      }
    }
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    
    if (removedCount > 0) {
      logger.info('Batch cleanup completed', {
        removedAgents: removedCount,
        totalProcessed: staleAgents.length,
        duration: `${duration.toFixed(2)}ms`,
        remainingAgents: this.agents.size
      });
    }
    
    return { removed: removedCount, processed: staleAgents.length };
  }
}
```

### Memory Optimization

#### 1. Large Dataset Handling

**Streaming JSON Processing:**
```javascript
/**
 * Handle large TODO.json files efficiently
 */
class LargeDataHandler {
  /**
   * Stream-process large task arrays
   * @param {Array} tasks - Large task array
   * @param {Function} processor - Processing function
   * @param {number} batchSize - Batch processing size
   */
  async processBatches(tasks, processor, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(processor)
      );
      
      results.push(...batchResults);
      
      // Allow event loop to breathe
      if (i % (batchSize * 5) === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    return results;
  }
  
  /**
   * Memory-efficient task filtering
   */
  findTasksStreaming(tasks, predicate, limit = null) {
    const results = [];
    
    for (let i = 0; i < tasks.length; i++) {
      if (predicate(tasks[i])) {
        results.push(tasks[i]);
        
        if (limit && results.length >= limit) {
          break;
        }
      }
      
      // Periodically check memory usage
      if (i % 1000 === 0) {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
          logger.warn('High memory usage during task filtering', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            processedTasks: i,
            foundTasks: results.length
          });
        }
      }
    }
    
    return results;
  }
}
```

#### 2. Memory Profiling Tools

**Memory Monitoring:**
```javascript
/**
 * Memory profiling utilities
 */
class MemoryProfiler {
  static profileOperation(operationName, operation) {
    return async function profiledOperation(...args) {
      const initialMemory = process.memoryUsage();
      const startTime = process.hrtime.bigint();
      
      try {
        const result = await operation.apply(this, args);
        
        const finalMemory = process.memoryUsage();
        const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        
        const memoryDelta = {
          rss: finalMemory.rss - initialMemory.rss,
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external
        };
        
        logger.debug(`Memory profile: ${operationName}`, {
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: {
            rss: `${Math.round(memoryDelta.rss / 1024)}KB`,
            heapUsed: `${Math.round(memoryDelta.heapUsed / 1024)}KB`,
            heapTotal: `${Math.round(memoryDelta.heapTotal / 1024)}KB`
          },
          finalMemory: {
            heapUsed: `${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(finalMemory.heapTotal / 1024 / 1024)}MB`
          }
        });
        
        return result;
        
      } catch (error) {
        logger.error(`Memory profile error: ${operationName}`, {
          error: error.message
        });
        throw error;
      }
    };
  }
  
  static async takeHeapSnapshot(filename) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Heap snapshot skipped in production');
      return;
    }
    
    try {
      const v8 = require('v8');
      const fs = require('fs');
      
      const snapshot = v8.writeHeapSnapshot();
      const destination = filename || `heap-${Date.now()}.heapsnapshot`;
      
      fs.copyFileSync(snapshot, destination);
      fs.unlinkSync(snapshot);
      
      logger.info(`Heap snapshot saved: ${destination}`);
      
    } catch (error) {
      logger.error('Failed to take heap snapshot', { error: error.message });
    }
  }
}
```

### Concurrent Processing Optimization

#### 1. Task Parallelization

**Optimized Multi-Agent Task Processing:**
```javascript
/**
 * Parallel task processing with controlled concurrency
 */
class ParallelTaskProcessor {
  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.activeTasks = new Set();
    this.taskQueue = [];
  }
  
  /**
   * Process tasks with controlled concurrency
   * @param {Array} tasks - Tasks to process
   * @param {Function} processor - Task processing function
   * @returns {Promise<Array>} Processing results
   */
  async processParallel(tasks, processor) {
    const results = [];
    const startTime = process.hrtime.bigint();
    
    // Create task promises
    const taskPromises = tasks.map((task, index) => 
      this.queueTask(task, processor, index)
    );
    
    // Wait for all tasks to complete
    const allResults = await Promise.allSettled(taskPromises);
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    
    // Process results and separate successes from failures
    const successes = [];
    const failures = [];
    
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successes.push({ index, result: result.value });
      } else {
        failures.push({ index, error: result.reason.message });
      }
    });
    
    logger.info('Parallel task processing completed', {
      totalTasks: tasks.length,
      successful: successes.length,
      failed: failures.length,
      duration: `${duration.toFixed(2)}ms`,
      avgTaskTime: `${(duration / tasks.length).toFixed(2)}ms`
    });
    
    return { successes, failures, duration };
  }
  
  /**
   * Queue task with concurrency control
   */
  async queueTask(task, processor, index) {
    // Wait for available slot
    while (this.activeTasks.size >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const taskId = `task-${index}-${Date.now()}`;
    this.activeTasks.add(taskId);
    
    try {
      const result = await processor(task, index);
      return result;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }
}
```

#### 2. Database-Style Indexing for Fast Lookups

**Task Indexing for Performance:**
```javascript
/**
 * Task indexing system for fast queries
 */
class TaskIndex {
  constructor() {
    this.indexes = {
      byId: new Map(),
      byStatus: new Map(),
      byCategory: new Map(),
      byAgent: new Map(),
      byCreatedDate: new Map()
    };
  }
  
  /**
   * Build indexes from task array
   * @param {Array} tasks - Tasks to index
   */
  buildIndexes(tasks) {
    const startTime = process.hrtime.bigint();
    
    // Clear existing indexes
    Object.values(this.indexes).forEach(index => index.clear());
    
    tasks.forEach(task => {
      // Index by ID
      this.indexes.byId.set(task.id, task);
      
      // Index by status
      if (!this.indexes.byStatus.has(task.status)) {
        this.indexes.byStatus.set(task.status, []);
      }
      this.indexes.byStatus.get(task.status).push(task);
      
      // Index by category
      if (task.category) {
        if (!this.indexes.byCategory.has(task.category)) {
          this.indexes.byCategory.set(task.category, []);
        }
        this.indexes.byCategory.get(task.category).push(task);
      }
      
      // Index by assigned agent
      if (task.assigned_agent) {
        if (!this.indexes.byAgent.has(task.assigned_agent)) {
          this.indexes.byAgent.set(task.assigned_agent, []);
        }
        this.indexes.byAgent.get(task.assigned_agent).push(task);
      }
      
      // Index by creation date (day granularity)
      if (task.created_at) {
        const dateKey = new Date(task.created_at).toDateString();
        if (!this.indexes.byCreatedDate.has(dateKey)) {
          this.indexes.byCreatedDate.set(dateKey, []);
        }
        this.indexes.byCreatedDate.get(dateKey).push(task);
      }
    });
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    
    logger.debug('Task indexes built', {
      totalTasks: tasks.length,
      indexTypes: Object.keys(this.indexes).length,
      duration: `${duration.toFixed(2)}ms`
    });
  }
  
  /**
   * Fast lookup by status with O(1) complexity
   * @param {string} status - Task status
   * @returns {Array} Tasks with matching status
   */
  findByStatus(status) {
    return this.indexes.byStatus.get(status) || [];
  }
  
  /**
   * Complex query with multiple filters
   * @param {Object} filters - Query filters
   * @returns {Array} Matching tasks
   */
  query(filters) {
    let candidates = null;
    
    // Start with most selective index
    if (filters.id) {
      const task = this.indexes.byId.get(filters.id);
      candidates = task ? [task] : [];
    } else if (filters.assigned_agent) {
      candidates = this.indexes.byAgent.get(filters.assigned_agent) || [];
    } else if (filters.status) {
      candidates = this.indexes.byStatus.get(filters.status) || [];
    } else if (filters.category) {
      candidates = this.indexes.byCategory.get(filters.category) || [];
    }
    
    // Apply additional filters
    if (candidates && Object.keys(filters).length > 1) {
      candidates = candidates.filter(task => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'created_after') {
            return new Date(task.created_at) > new Date(value);
          }
          if (key === 'created_before') {
            return new Date(task.created_at) < new Date(value);
          }
          return task[key] === value;
        });
      });
    }
    
    return candidates || [];
  }
}
```

---

## Security Guidelines

### Input Validation and Sanitization

#### 1. TaskManager API Security

**Parameter Validation:**
```javascript
/**
 * Input validation for TaskManager API
 */
class APIValidator {
  /**
   * Validate task creation data
   * @param {Object} taskData - Raw task data from API
   * @returns {Object} Validated and sanitized task data
   * @throws {Error} If validation fails
   */
  static validateTaskCreation(taskData) {
    const errors = [];
    
    // Required field validation
    if (!taskData.title || typeof taskData.title !== 'string') {
      errors.push('Title is required and must be a string');
    } else if (taskData.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }
    
    if (!taskData.description || typeof taskData.description !== 'string') {
      errors.push('Description is required and must be a string');
    } else if (taskData.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }
    
    if (!taskData.category || typeof taskData.category !== 'string') {
      errors.push('Category is required and must be a string');
    } else if (!['error', 'feature', 'subtask', 'test'].includes(taskData.category)) {
      errors.push('Category must be one of: error, feature, subtask, test');
    }
    
    // Optional field validation
    if (taskData.priority && !['low', 'medium', 'high', 'critical'].includes(taskData.priority)) {
      errors.push('Priority must be one of: low, medium, high, critical');
    }
    
    if (taskData.dependencies && !Array.isArray(taskData.dependencies)) {
      errors.push('Dependencies must be an array');
    }
    
    if (taskData.important_files && !Array.isArray(taskData.important_files)) {
      errors.push('Important files must be an array');
    }
    
    // Security validation
    if (taskData.title && this.containsSuspiciousContent(taskData.title)) {
      errors.push('Title contains potentially unsafe content');
    }
    
    if (taskData.description && this.containsSuspiciousContent(taskData.description)) {
      errors.push('Description contains potentially unsafe content');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    // Sanitize input
    return {
      title: this.sanitizeString(taskData.title),
      description: this.sanitizeString(taskData.description),
      category: taskData.category.toLowerCase(),
      priority: taskData.priority || 'medium',
      dependencies: taskData.dependencies || [],
      important_files: this.sanitizeFileList(taskData.important_files || [])
    };
  }
  
  /**
   * Detect suspicious content that could indicate injection attacks
   * @param {string} input - Input string to check
   * @returns {boolean} True if suspicious content detected
   */
  static containsSuspiciousContent(input) {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript URLs
      /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
      /eval\s*\(/gi, // eval() calls
      /setTimeout\s*\(/gi, // setTimeout calls
      /setInterval\s*\(/gi, // setInterval calls
      /Function\s*\(/gi, // Function constructor
      /import\s*\(/gi, // Dynamic imports
      /require\s*\(/gi, // Require calls in descriptions
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Sanitize string input
   * @param {string} input - Raw input string
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .slice(0, 2000); // Limit length
  }
  
  /**
   * Sanitize file path list
   * @param {Array} files - List of file paths
   * @returns {Array} Sanitized file paths
   */
  static sanitizeFileList(files) {
    if (!Array.isArray(files)) return [];
    
    return files
      .map(file => {
        if (typeof file !== 'string') return null;
        
        // Remove dangerous path components
        const sanitized = file
          .replace(/\.\./g, '') // Remove parent directory references
          .replace(/[<>:"|?*]/g, '') // Remove Windows-illegal characters
          .replace(/^\//g, '') // Remove leading slashes
          .trim();
          
        return sanitized.length > 0 ? sanitized : null;
      })
      .filter(Boolean)
      .slice(0, 20); // Limit array size
  }
}
```

#### 2. File System Security

**Path Validation:**
```javascript
/**
 * Secure file system operations
 */
class PathValidator {
  constructor(projectRoot) {
    this.projectRoot = path.resolve(projectRoot);
    this.allowedExtensions = new Set(['.json', '.md', '.js', '.ts', '.txt', '.log']);
    this.forbiddenPaths = new Set([
      '/etc',
      '/usr',
      '/var',
      '/root',
      'node_modules',
      '.git'
    ]);
  }
  
  /**
   * Validate and resolve file path securely
   * @param {string} inputPath - User-provided path
   * @returns {string} Validated absolute path
   * @throws {Error} If path is invalid or unsafe
   */
  validatePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Path must be a non-empty string');
    }
    
    // Resolve path to absolute form
    const resolvedPath = path.resolve(this.projectRoot, inputPath);
    
    // Ensure path is within project root (prevent directory traversal)
    if (!resolvedPath.startsWith(this.projectRoot)) {
      throw new Error('Path must be within project directory');
    }
    
    // Check for forbidden path components
    const relativePath = path.relative(this.projectRoot, resolvedPath);
    for (const forbidden of this.forbiddenPaths) {
      if (relativePath.startsWith(forbidden)) {
        throw new Error(`Access to ${forbidden} is forbidden`);
      }
    }
    
    // Validate file extension for security
    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext && !this.allowedExtensions.has(ext)) {
      throw new Error(`File extension ${ext} is not allowed`);
    }
    
    // Additional security checks
    const basename = path.basename(resolvedPath);
    if (basename.startsWith('.') && basename !== '.gitignore' && basename !== '.eslintrc') {
      throw new Error('Hidden files are not allowed');
    }
    
    return resolvedPath;
  }
  
  /**
   * Secure file existence check
   * @param {string} filePath - Path to check
   * @returns {boolean} True if file exists and is accessible
   */
  secureFileExists(filePath) {
    try {
      const validatedPath = this.validatePath(filePath);
      return fs.existsSync(validatedPath);
    } catch (error) {
      logger.warn('Path validation failed in existence check', {
        inputPath: filePath,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Secure file reading with size limits
   * @param {string} filePath - Path to read
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {Promise<string>} File contents
   */
  async secureReadFile(filePath, maxSize = 10 * 1024 * 1024) { // 10MB default
    const validatedPath = this.validatePath(filePath);
    
    // Check file size before reading
    const stats = fs.statSync(validatedPath);
    if (stats.size > maxSize) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size ${maxSize}`);
    }
    
    // Read with encoding to prevent binary file issues
    try {
      const content = fs.readFileSync(validatedPath, 'utf8');
      
      logger.debug('Secure file read completed', {
        path: path.relative(this.projectRoot, validatedPath),
        size: stats.size,
        contentLength: content.length
      });
      
      return content;
      
    } catch (error) {
      if (error.code === 'EISDIR') {
        throw new Error('Cannot read directory as file');
      }
      if (error.code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw error;
    }
  }
}
```

#### 3. Command Injection Prevention

**Safe Command Execution:**
```javascript
/**
 * Secure command execution utilities
 */
class SecureExecutor {
  constructor() {
    this.allowedCommands = new Set([
      'node',
      'npm',
      'git',
      'timeout',
      'eslint'
    ]);
  }
  
  /**
   * Execute command with security controls
   * @param {string} command - Command to execute
   * @param {Array} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeSecurely(command, args = [], options = {}) {
    // Validate command
    if (!this.allowedCommands.has(command)) {
      throw new Error(`Command '${command}' is not allowed`);
    }
    
    // Sanitize arguments
    const sanitizedArgs = args.map(arg => this.sanitizeArgument(arg));
    
    // Set security options
    const secureOptions = {
      ...options,
      shell: false, // Never use shell to prevent injection
      timeout: options.timeout || 30000, // 30 second default timeout
      maxBuffer: 1024 * 1024 * 5, // 5MB output limit
      env: { 
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production',
        // Remove potentially dangerous env vars
        LD_PRELOAD: undefined,
        LD_LIBRARY_PATH: undefined
      }
    };
    
    const operationId = generateOperationId();
    const startTime = process.hrtime.bigint();
    
    logger.info(`[${operationId}] Executing secure command`, {
      command,
      args: sanitizedArgs,
      timeout: secureOptions.timeout
    });
    
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const child = spawn(command, sanitizedArgs, secureOptions);
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
          // Prevent memory exhaustion from large outputs
          if (stdout.length > secureOptions.maxBuffer) {
            child.kill();
            reject(new Error('Command output exceeded maximum buffer size'));
          }
        });
        
        child.stderr.on('data', (data) => {
          stderr += data.toString();
          if (stderr.length > secureOptions.maxBuffer) {
            child.kill();
            reject(new Error('Command error output exceeded maximum buffer size'));
          }
        });
        
        child.on('close', (code) => {
          const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          
          const result = {
            code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration: `${duration.toFixed(2)}ms`
          };
          
          logger.info(`[${operationId}] Command execution completed`, {
            command,
            exitCode: code,
            duration: result.duration,
            outputSize: stdout.length,
            errorSize: stderr.length
          });
          
          resolve(result);
        });
        
        child.on('error', (error) => {
          const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          
          logger.error(`[${operationId}] Command execution failed`, {
            command,
            error: error.message,
            duration: `${duration.toFixed(2)}ms`
          });
          
          reject(error);
        });
        
        // Set up timeout
        setTimeout(() => {
          child.kill();
          reject(new Error(`Command timeout after ${secureOptions.timeout}ms`));
        }, secureOptions.timeout);
      });
      
    } catch (error) {
      logger.error(`[${operationId}] Secure execution error`, {
        command,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Sanitize command line argument
   * @param {string} arg - Raw argument
   * @returns {string} Sanitized argument
   */
  sanitizeArgument(arg) {
    if (typeof arg !== 'string') {
      throw new Error('Command arguments must be strings');
    }
    
    // Remove dangerous characters
    const sanitized = arg
      .replace(/[;&|`$(){}[\]<>]/g, '') // Remove shell metacharacters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Check for command injection attempts
    if (sanitized !== arg) {
      logger.warn('Command argument was sanitized', {
        original: arg,
        sanitized
      });
    }
    
    return sanitized;
  }
}
```

#### 4. JSON Security

**Safe JSON Processing:**
```javascript
/**
 * Secure JSON processing with validation
 */
class SecureJSONProcessor {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 10;
    this.maxKeys = options.maxKeys || 1000;
    this.maxStringLength = options.maxStringLength || 10000;
    this.maxArrayLength = options.maxArrayLength || 1000;
  }
  
  /**
   * Parse JSON with security validation
   * @param {string} jsonString - JSON string to parse
   * @returns {Object} Parsed and validated JSON
   * @throws {Error} If JSON is invalid or unsafe
   */
  parseSecurely(jsonString) {
    if (typeof jsonString !== 'string') {
      throw new Error('Input must be a string');
    }
    
    if (jsonString.length > 1024 * 1024) { // 1MB limit
      throw new Error('JSON string too large');
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    
    // Validate structure
    this.validateStructure(parsed, 0);
    
    return parsed;
  }
  
  /**
   * Validate JSON structure recursively
   * @param {*} obj - Object to validate
   * @param {number} depth - Current recursion depth
   * @throws {Error} If structure is invalid
   */
  validateStructure(obj, depth) {
    if (depth > this.maxDepth) {
      throw new Error(`JSON depth exceeds maximum allowed depth of ${this.maxDepth}`);
    }
    
    if (obj === null || typeof obj !== 'object') {
      // Primitive values are safe
      if (typeof obj === 'string' && obj.length > this.maxStringLength) {
        throw new Error(`String length exceeds maximum of ${this.maxStringLength}`);
      }
      return;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length > this.maxArrayLength) {
        throw new Error(`Array length exceeds maximum of ${this.maxArrayLength}`);
      }
      
      obj.forEach(item => this.validateStructure(item, depth + 1));
      
    } else {
      const keys = Object.keys(obj);
      
      if (keys.length > this.maxKeys) {
        throw new Error(`Object has too many keys (${keys.length} > ${this.maxKeys})`);
      }
      
      keys.forEach(key => {
        // Validate key names
        if (typeof key !== 'string' || key.length > 100) {
          throw new Error('Invalid object key');
        }
        
        // Check for prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new Error('Potentially dangerous object key');
        }
        
        this.validateStructure(obj[key], depth + 1);
      });
    }
  }
  
  /**
   * Stringify JSON with security controls
   * @param {*} obj - Object to stringify
   * @returns {string} Safe JSON string
   */
  stringifySecurely(obj) {
    try {
      // Use replacer to filter dangerous properties
      const jsonString = JSON.stringify(obj, (key, value) => {
        // Filter out functions and undefined values
        if (typeof value === 'function' || value === undefined) {
          return null;
        }
        
        // Filter out dangerous keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        
        return value;
      }, 2);
      
      if (jsonString.length > 1024 * 1024) { // 1MB limit
        throw new Error('Resulting JSON string too large');
      }
      
      return jsonString;
      
    } catch (error) {
      if (error.message.includes('circular')) {
        throw new Error('Cannot stringify object with circular references');
      }
      throw error;
    }
  }
}
```

### Authentication and Authorization

#### 1. Agent Authentication

**Agent Identity Verification:**
```javascript
/**
 * Agent authentication and session management
 */
class AgentAuthenticator {
  constructor(options = {}) {
    this.sessionTimeout = options.sessionTimeout || 15 * 60 * 1000; // 15 minutes
    this.maxSessionsPerAgent = options.maxSessionsPerAgent || 3;
    this.sessions = new Map();
  }
  
  /**
   * Create authenticated agent session
   * @param {string} agentId - Agent identifier
   * @param {Object} agentConfig - Agent configuration
   * @returns {Object} Session token and metadata
   */
  createSession(agentId, agentConfig = {}) {
    // Validate agent ID format
    if (!this.isValidAgentId(agentId)) {
      throw new Error('Invalid agent ID format');
    }
    
    // Check session limits
    const existingSessions = Array.from(this.sessions.values())
      .filter(session => session.agentId === agentId && !this.isSessionExpired(session));
      
    if (existingSessions.length >= this.maxSessionsPerAgent) {
      throw new Error(`Maximum sessions exceeded for agent ${agentId}`);
    }
    
    // Generate secure session token
    const sessionToken = this.generateSecureToken();
    const now = Date.now();
    
    const session = {
      agentId,
      sessionToken,
      createdAt: now,
      lastActivity: now,
      config: this.sanitizeAgentConfig(agentConfig),
      capabilities: this.determineCapabilities(agentConfig),
      ipAddress: this.getCurrentIP(), // Track for security
      userAgent: process.env.CLAUDE_USER_AGENT || 'unknown'
    };
    
    this.sessions.set(sessionToken, session);
    
    logger.info('Agent session created', {
      agentId,
      sessionToken: sessionToken.substring(0, 8) + '...',
      capabilities: session.capabilities
    });
    
    return {
      sessionToken,
      expiresAt: now + this.sessionTimeout,
      capabilities: session.capabilities
    };
  }
  
  /**
   * Validate agent session
   * @param {string} sessionToken - Session token to validate
   * @returns {Object} Session information if valid
   * @throws {Error} If session is invalid
   */
  validateSession(sessionToken) {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      throw new Error('Invalid session token');
    }
    
    if (this.isSessionExpired(session)) {
      this.sessions.delete(sessionToken);
      throw new Error('Session expired');
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    
    return {
      agentId: session.agentId,
      capabilities: session.capabilities,
      config: session.config
    };
  }
  
  /**
   * Check if agent ID format is valid
   * @param {string} agentId - Agent ID to validate
   * @returns {boolean} True if valid
   */
  isValidAgentId(agentId) {
    if (typeof agentId !== 'string' || agentId.length < 5 || agentId.length > 100) {
      return false;
    }
    
    // Must match expected format: role_session_timestamp_sequence_id
    const validFormat = /^[a-z_]+_session_\d+_\d+_[a-z_]+_[a-z0-9]+$/i;
    return validFormat.test(agentId);
  }
  
  /**
   * Generate cryptographically secure session token
   * @returns {string} Secure session token
   */
  generateSecureToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Determine agent capabilities based on configuration
   * @param {Object} config - Agent configuration
   * @returns {Array} List of capabilities
   */
  determineCapabilities(config) {
    const capabilities = ['file-operations', 'task-management'];
    
    if (config.role === 'development') {
      capabilities.push('linting', 'testing', 'build-fixes', 'refactoring');
    }
    
    if (config.role === 'documentation') {
      capabilities.push('markdown-editing', 'api-documentation');
    }
    
    if (config.specialization && Array.isArray(config.specialization)) {
      capabilities.push(...config.specialization.filter(s => 
        typeof s === 'string' && s.length > 0 && s.length < 50
      ));
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }
}
```

#### 2. Task Authorization

**Task Access Control:**
```javascript
/**
 * Task-level authorization system
 */
class TaskAuthorizer {
  constructor() {
    this.taskPermissions = new Map();
    this.roleHierarchy = {
      'admin': ['development', 'documentation', 'testing', 'research'],
      'development': ['testing'],
      'documentation': [],
      'testing': [],
      'research': []
    };
  }
  
  /**
   * Check if agent can perform action on task
   * @param {string} agentId - Agent requesting access
   * @param {string} taskId - Task to access
   * @param {string} action - Action to perform (read, claim, modify, complete)
   * @param {Object} context - Additional context
   * @returns {boolean} True if authorized
   */
  isAuthorized(agentId, taskId, action, context = {}) {
    try {
      // Get agent information
      const agent = context.agent || this.getAgentInfo(agentId);
      if (!agent) {
        logger.warn('Authorization failed: unknown agent', { agentId, taskId, action });
        return false;
      }
      
      // Get task information
      const task = context.task || this.getTaskInfo(taskId);
      if (!task) {
        logger.warn('Authorization failed: unknown task', { agentId, taskId, action });
        return false;
      }
      
      // Check basic permissions
      switch (action) {
        case 'read':
          return this.canReadTask(agent, task);
        case 'claim':
          return this.canClaimTask(agent, task);
        case 'modify':
          return this.canModifyTask(agent, task);
        case 'complete':
          return this.canCompleteTask(agent, task);
        default:
          logger.warn('Unknown action requested', { agentId, taskId, action });
          return false;
      }
      
    } catch (error) {
      logger.error('Authorization check failed', {
        agentId,
        taskId,
        action,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Check if agent can read task
   * @param {Object} agent - Agent information
   * @param {Object} task - Task information
   * @returns {boolean} True if authorized
   */
  canReadTask(agent, task) {
    // All agents can read most tasks
    if (task.status === 'completed' || task.status === 'pending') {
      return true;
    }
    
    // In-progress tasks can only be read by assigned agent or higher roles
    if (task.status === 'in_progress') {
      return task.assigned_agent === agent.id || 
             this.hasHigherRole(agent.role, this.getTaskOwnerRole(task));
    }
    
    return true;
  }
  
  /**
   * Check if agent can claim task
   * @param {Object} agent - Agent information
   * @param {Object} task - Task information
   * @returns {boolean} True if authorized
   */
  canClaimTask(agent, task) {
    // Task must be pending
    if (task.status !== 'pending') {
      return false;
    }
    
    // Task must not be already assigned
    if (task.assigned_agent && task.assigned_agent !== agent.id) {
      return false;
    }
    
    // Check workload limits
    if (agent.workload >= (agent.maxConcurrentTasks || 5)) {
      return false;
    }
    
    // Check capability requirements
    if (task.required_capabilities) {
      const hasCapabilities = task.required_capabilities.every(capability =>
        agent.capabilities.includes(capability)
      );
      if (!hasCapabilities) {
        return false;
      }
    }
    
    // Check category-specific permissions
    return this.canWorkOnCategory(agent, task.category);
  }
  
  /**
   * Check if agent can work on task category
   * @param {Object} agent - Agent information
   * @param {string} category - Task category
   * @returns {boolean} True if authorized
   */
  canWorkOnCategory(agent, category) {
    switch (category) {
      case 'error':
        // Error tasks can be handled by most agents
        return agent.capabilities.includes('file-operations');
        
      case 'feature':
        // Feature tasks require development capabilities
        return agent.role === 'development' || 
               agent.capabilities.includes('development');
               
      case 'subtask':
        // Subtasks can be handled by various agents
        return true;
        
      case 'test':
        // Test tasks require testing capabilities
        return agent.role === 'testing' || 
               agent.capabilities.includes('testing') ||
               agent.role === 'development';
               
      default:
        return true;
    }
  }
  
  /**
   * Create audit log entry
   * @param {string} agentId - Agent performing action
   * @param {string} taskId - Task being accessed
   * @param {string} action - Action performed
   * @param {boolean} authorized - Whether action was authorized
   * @param {string} reason - Reason for decision
   */
  logAuthorizationEvent(agentId, taskId, action, authorized, reason = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      taskId,
      action,
      authorized,
      reason,
      sessionInfo: this.getSessionInfo(agentId)
    };
    
    logger.info('Authorization event', logEntry);
    
    // Store in audit trail
    this.storeAuditEntry(logEntry);
  }
}
```

---

## Conclusion

This comprehensive development guide provides the foundation for extending and maintaining the infinite-continue-stop-hook system. The guide covers:

- **Development Workflow**: Complete task management lifecycle with TaskManager API
- **Code Standards**: ESLint configuration, documentation requirements, and quality gates
- **Extension Patterns**: How to add features, commands, and library components safely
- **Testing Strategies**: Unit, integration, and E2E testing with real examples
- **Debugging Guide**: Comprehensive logging, performance profiling, and troubleshooting
- **Performance Optimization**: Caching, concurrent processing, and memory management
- **Security Guidelines**: Input validation, authentication, authorization, and safe practices

### Key Principles

1. **Security First**: All extensions must follow input validation and security practices
2. **Performance Conscious**: Use caching, lazy loading, and efficient algorithms
3. **Comprehensive Logging**: Every operation must be logged with operation IDs
4. **Multi-Agent Ready**: All components must work in concurrent multi-agent scenarios
5. **Error Recovery**: Build in automatic error detection and recovery mechanisms
6. **Testing Required**: All code must have comprehensive test coverage

### Development Resources

- **TaskManager API Guide**: `timeout 10s node "taskmanager-api.js" guide`
- **Project Essentials**: Always read `development/essentials/` before starting work
- **Code Quality**: Run `npm run lint` and `npm test` before committing
- **Documentation**: Update documentation when adding features

For questions or contributions, refer to the TaskManager API comprehensive guide and the project's existing patterns demonstrated in the codebase.