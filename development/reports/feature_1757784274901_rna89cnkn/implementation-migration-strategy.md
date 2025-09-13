# Implementation & Migration Strategy: Embedded Subtasks and Success Criteria

**Task ID**: feature_1757784274901_rna89cnkn  
**Document Type**: Technical Implementation Guide  
**Target Audience**: Development Team, System Architects  
**Implementation Phase**: Design & Planning

## Implementation Architecture

### 1. Enhanced Data Schema Evolution

#### Current Schema (Compatible Base)
```json
{
  "subtasks": [],           // Currently strings/basic objects
  "success_criteria": []    // Currently strings
}
```

#### Target Schema (Fully Enhanced)
```json
{
  "subtasks": [
    {
      "id": "subtask_{{timestamp}}_{{hash8}}",
      "type": "research|implementation|audit|test",
      "title": "Subtask Title",
      "description": "Detailed subtask description",
      "status": "pending|in_progress|completed|blocked",
      "priority": "high|medium|low",
      "assigned_agent": "agent_id_or_null",
      "parent_task": "parent_task_id",
      "dependencies": ["other_subtask_ids"],
      "created_at": "ISO_timestamp",
      "started_at": "ISO_timestamp_or_null", 
      "completed_at": "ISO_timestamp_or_null",
      "estimated_duration": "time_estimate",
      "actual_duration": "time_taken",
      "metadata": {
        "complexity": "low|medium|high",
        "requires_research": boolean,
        "blocking_dependencies": []
      }
    }
  ],
  "success_criteria": [
    {
      "id": "criteria_{{timestamp}}_{{hash8}}",
      "description": "Human-readable criteria description", 
      "category": "code_quality|testing|performance|security|documentation",
      "requirement_level": "mandatory|recommended|optional",
      "status": "pending|validating|met|failed|skipped",
      "validation_method": "automated|manual|hybrid",
      "validation_script": "command_or_null",
      "expected_result": "expected_outcome",
      "actual_result": "actual_outcome_or_null",
      "validated_at": "ISO_timestamp_or_null",
      "validated_by": "agent_id_or_null",
      "evidence": {
        "type": "log|screenshot|report|test_result",
        "data": "evidence_data",
        "location": "file_path_or_url"
      },
      "retry_count": 0,
      "max_retries": 3
    }
  ]
}
```

### 2. API Endpoint Design

#### Core Subtask Endpoints
```bash
# Subtask Lifecycle Management
node taskmanager-api.js create-subtask <parentTaskId> <subtaskData>
timeout 10s node taskmanager-api.js claim-subtask <subtaskId> <agentId> [priority]
timeout 10s node taskmanager-api.js complete-subtask <subtaskId> [completionData]
timeout 10s node taskmanager-api.js update-subtask <subtaskId> <updateData>

# Subtask Query Operations  
node taskmanager-api.js list-subtasks <parentTaskId> [filter]
timeout 10s node taskmanager-api.js get-subtask <subtaskId>
node taskmanager-api.js subtask-status <parentTaskId>
node taskmanager-api.js subtask-tree <parentTaskId> [depth]

# Subtask Coordination
timeout 10s node taskmanager-api.js assign-subtask <subtaskId> <agentId>
timeout 10s node taskmanager-api.js reassign-subtask <subtaskId> <newAgentId>
node taskmanager-api.js block-subtask <subtaskId> <reason>
node taskmanager-api.js unblock-subtask <subtaskId>
```

#### Success Criteria Endpoints
```bash  
# Criteria Management
node taskmanager-api.js add-criteria <taskId> <criteriaData>
timeout 10s node taskmanager-api.js validate-criteria <taskId> <criteriaId> <validationData>
node taskmanager-api.js update-criteria <taskId> <criteriaId> <updateData>
node taskmanager-api.js remove-criteria <taskId> <criteriaId>

# Criteria Validation
timeout 10s node taskmanager-api.js run-validation <taskId> [criteriaId]
timeout 10s node taskmanager-api.js retry-validation <taskId> <criteriaId>
node taskmanager-api.js validation-report <taskId>
node taskmanager-api.js criteria-status <taskId>

# Batch Operations
timeout 10s node taskmanager-api.js validate-all-criteria <taskId>
timeout 10s node taskmanager-api.js reset-failed-criteria <taskId>
```

## Backward Compatibility Implementation

### 1. Dual-Format Support Strategy

#### Parser Enhancement (lib/taskManager.js)
```javascript
class TaskManager {
  /**
   * Normalize task data to support both legacy and enhanced formats
   * @param {Object} taskData - Raw task data
   * @returns {Object} Normalized task data
   */
  normalizeTaskData(taskData) {
    const normalized = { ...taskData };
    
    // Handle subtasks array normalization
    if (normalized.subtasks) {
      normalized.subtasks = normalized.subtasks.map(subtask => {
        if (typeof subtask === 'string') {
          // Legacy format: convert string to object
          return {
            id: this.generateSubtaskId(),
            type: 'implementation',
            title: subtask,
            description: subtask,
            status: 'pending',
            created_at: new Date().toISOString()
          };
        } else if (subtask.id && !subtask.parent_task) {
          // Partial format: ensure parent reference
          return {
            ...subtask,
            parent_task: taskData.id
          };
        }
        return subtask; // Already in enhanced format
      });
    }
    
    // Handle success_criteria normalization  
    if (normalized.success_criteria) {
      normalized.success_criteria = normalized.success_criteria.map(criteria => {
        if (typeof criteria === 'string') {
          // Legacy format: convert string to object
          return {
            id: this.generateCriteriaId(), 
            description: criteria,
            category: 'code_quality',
            requirement_level: 'mandatory',
            status: 'pending',
            validation_method: 'manual',
            created_at: new Date().toISOString()
          };
        }
        return criteria; // Already in enhanced format
      });
    }
    
    return normalized;
  }
  
  /**
   * Legacy-compatible task creation
   */
  async create(taskData) {
    const normalizedData = this.normalizeTaskData(taskData);
    return this._createInternal(normalizedData);
  }
}
```

### 2. API Response Compatibility

#### Response Format Strategy
```javascript
class TaskManagerAPI {
  /**
   * Format API responses based on client capabilities
   * @param {Object} taskData - Internal task data
   * @param {string} clientVersion - Client API version 
   * @returns {Object} Formatted response
   */
  formatResponse(taskData, clientVersion = 'v2.0.0') {
    if (clientVersion < 'v2.1.0') {
      // Legacy client: simplified format
      return {
        ...taskData,
        subtasks: taskData.subtasks?.map(s => s.title || s.description) || [],
        success_criteria: taskData.success_criteria?.map(c => c.description) || []
      };
    } else {
      // Enhanced client: full format
      return taskData;
    }
  }
  
  /**
   * Backward-compatible list operation
   */
  async list(filter = {}, clientVersion) {
    const tasks = await this.taskManager.listTasks(filter);
    return tasks.map(task => this.formatResponse(task, clientVersion));
  }
}
```

## Migration Phases Implementation

### Phase 1: Foundation Enhancement (Week 1)

#### 1.1 Schema Validation Updates
```javascript
// lib/taskValidator.js
const ENHANCED_TASK_SCHEMA = {
  type: 'object',
  properties: {
    subtasks: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },           // Legacy support
          { $ref: '#/definitions/SubtaskObject' }  // Enhanced format
        ]
      }
    },
    success_criteria: {
      type: 'array', 
      items: {
        oneOf: [
          { type: 'string' },           // Legacy support
          { $ref: '#/definitions/CriteriaObject' }  // Enhanced format
        ]
      }
    }
  },
  definitions: {
    SubtaskObject: {
      type: 'object',
      required: ['id', 'title', 'status'],
      properties: {
        id: { type: 'string', pattern: '^subtask_\\d+_[a-z0-9]+$' },
        type: { enum: ['research', 'implementation', 'audit', 'test'] },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        status: { enum: ['pending', 'in_progress', 'completed', 'blocked'] }
        // ... additional properties
      }
    },
    CriteriaObject: {
      type: 'object',
      required: ['id', 'description', 'status'],
      properties: {
        id: { type: 'string', pattern: '^criteria_\\d+_[a-z0-9]+$' },
        description: { type: 'string', minLength: 1 },
        requirement_level: { enum: ['mandatory', 'recommended', 'optional'] },
        status: { enum: ['pending', 'validating', 'met', 'failed', 'skipped'] }
        // ... additional properties
      }
    }
  }
};
```

#### 1.2 Data Migration Utilities
```javascript
// lib/migrationUtils.js
class DataMigrationUtil {
  /**
   * Migrate existing TODO.json to enhanced format
   * @param {string} todoPath - Path to TODO.json
   * @returns {Promise<Object>} Migration result
   */
  static async migrateToEnhanced(todoPath) {
    const backup = await this.createBackup(todoPath);
    const data = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
    
    let migratedCount = 0;
    data.tasks = data.tasks.map(task => {
      const originalTask = { ...task };
      
      // Migrate subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        const hasStringSubtasks = task.subtasks.some(s => typeof s === 'string');
        if (hasStringSubtasks) {
          task.subtasks = task.subtasks.map(subtask => 
            typeof subtask === 'string' ? this.stringToSubtaskObject(subtask, task.id) : subtask
          );
          migratedCount++;
        }
      }
      
      // Migrate success criteria
      if (task.success_criteria && task.success_criteria.length > 0) {
        const hasStringCriteria = task.success_criteria.some(c => typeof c === 'string');
        if (hasStringCriteria) {
          task.success_criteria = task.success_criteria.map(criteria =>
            typeof criteria === 'string' ? this.stringToCriteriaObject(criteria) : criteria
          );
          migratedCount++;
        }
      }
      
      return task;
    });
    
    // Write migrated data
    fs.writeFileSync(todoPath, JSON.stringify(data, null, 2));
    
    return {
      success: true,
      backupPath: backup,
      migratedTasks: migratedCount,
      timestamp: new Date().toISOString()
    };
  }
  
  static stringToSubtaskObject(subtaskString, parentId) {
    return {
      id: `subtask_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      type: 'implementation',
      title: subtaskString,
      description: subtaskString,
      status: 'pending',
      parent_task: parentId,
      created_at: new Date().toISOString()
    };
  }
  
  static stringToCriteriaObject(criteriaString) {
    return {
      id: `criteria_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      description: criteriaString,
      category: 'code_quality',
      requirement_level: 'mandatory',
      status: 'pending',
      validation_method: 'manual',
      created_at: new Date().toISOString()
    };
  }
}
```

### Phase 2: API Extension Implementation (Week 2)

#### 2.1 Subtask Management Module
```javascript
// lib/api-modules/subtasks/subtaskManager.js
class SubtaskManager {
  constructor(taskManager, options = {}) {
    this.taskManager = taskManager;
    this.options = {
      enableNesting: options.enableNesting !== false,
      maxDepth: options.maxDepth || 3,
      enableDependencies: options.enableDependencies !== false,
      ...options
    };
  }
  
  /**
   * Create new subtask within parent task
   */
  async createSubtask(parentTaskId, subtaskData) {
    const parentTask = await this.taskManager.getTask(parentTaskId);
    if (!parentTask) {
      throw new Error(`Parent task not found: ${parentTaskId}`);
    }
    
    const subtask = {
      id: this.generateSubtaskId(),
      parent_task: parentTaskId,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...subtaskData
    };
    
    // Add subtask to parent's subtasks array
    if (!parentTask.subtasks) parentTask.subtasks = [];
    parentTask.subtasks.push(subtask);
    
    // Update parent task
    await this.taskManager.updateTask(parentTaskId, parentTask);
    
    return {
      success: true,
      subtaskId: subtask.id,
      parentTaskId,
      subtask
    };
  }
  
  /**
   * Claim subtask for agent execution
   */
  async claimSubtask(subtaskId, agentId, priority = 'normal') {
    const { parentTask, subtask, subtaskIndex } = await this.findSubtask(subtaskId);
    
    if (subtask.status !== 'pending') {
      throw new Error(`Subtask ${subtaskId} is not available for claiming (status: ${subtask.status})`);
    }
    
    // Update subtask with agent assignment
    subtask.status = 'in_progress';
    subtask.assigned_agent = agentId;
    subtask.started_at = new Date().toISOString();
    subtask.claim_priority = priority;
    
    // Update parent task
    parentTask.subtasks[subtaskIndex] = subtask;
    await this.taskManager.updateTask(parentTask.id, parentTask);
    
    return {
      success: true,
      subtaskId,
      agentId,
      subtask
    };
  }
  
  /**
   * Complete subtask with optional completion data
   */
  async completeSubtask(subtaskId, completionData = {}) {
    const { parentTask, subtask, subtaskIndex } = await this.findSubtask(subtaskId);
    
    if (subtask.status !== 'in_progress') {
      throw new Error(`Cannot complete subtask ${subtaskId} with status: ${subtask.status}`);
    }
    
    // Update subtask completion
    subtask.status = 'completed';
    subtask.completed_at = new Date().toISOString();
    subtask.completion_data = completionData;
    
    if (subtask.started_at) {
      const duration = new Date() - new Date(subtask.started_at);
      subtask.actual_duration = duration;
    }
    
    // Update parent task
    parentTask.subtasks[subtaskIndex] = subtask;
    await this.taskManager.updateTask(parentTask.id, parentTask);
    
    // Check if all subtasks are complete
    const allSubtasksComplete = parentTask.subtasks.every(st => st.status === 'completed');
    
    return {
      success: true,
      subtaskId,
      subtask,
      parentTaskComplete: allSubtasksComplete
    };
  }
  
  /**
   * Helper method to find subtask within parent task
   */
  async findSubtask(subtaskId) {
    const todoData = await this.taskManager.readData();
    
    for (const task of todoData.tasks) {
      if (task.subtasks) {
        const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
        if (subtaskIndex !== -1) {
          return {
            parentTask: task,
            subtask: task.subtasks[subtaskIndex],
            subtaskIndex
          };
        }
      }
    }
    
    throw new Error(`Subtask not found: ${subtaskId}`);
  }
  
  generateSubtaskId() {
    return `subtask_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
}
```

#### 2.2 Success Criteria Management Module  
```javascript
// lib/api-modules/criteria/criteriaManager.js
class SuccessCriteriaManager {
  constructor(taskManager, options = {}) {
    this.taskManager = taskManager;
    this.options = {
      enableAutoValidation: options.enableAutoValidation !== false,
      validationTimeout: options.validationTimeout || 30000,
      maxRetries: options.maxRetries || 3,
      ...options
    };
  }
  
  /**
   * Add success criteria to task
   */
  async addCriteria(taskId, criteriaData) {
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    const criteria = {
      id: this.generateCriteriaId(),
      created_at: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
      max_retries: this.options.maxRetries,
      ...criteriaData
    };
    
    if (!task.success_criteria) task.success_criteria = [];
    task.success_criteria.push(criteria);
    
    await this.taskManager.updateTask(taskId, task);
    
    return {
      success: true,
      criteriaId: criteria.id,
      taskId,
      criteria
    };
  }
  
  /**
   * Validate success criteria
   */
  async validateCriteria(taskId, criteriaId, validationData) {
    const { task, criteria, criteriaIndex } = await this.findCriteria(taskId, criteriaId);
    
    criteria.status = 'validating';
    criteria.validation_started_at = new Date().toISOString();
    
    try {
      let validationResult;
      
      if (criteria.validation_method === 'automated' && criteria.validation_script) {
        validationResult = await this.runAutomatedValidation(criteria.validation_script);
      } else {
        validationResult = validationData;
      }
      
      criteria.status = validationResult.success ? 'met' : 'failed';
      criteria.actual_result = validationResult.result;
      criteria.validated_at = new Date().toISOString();
      criteria.validated_by = validationData.agentId;
      criteria.evidence = validationResult.evidence;
      
      if (!validationResult.success) {
        criteria.retry_count = (criteria.retry_count || 0) + 1;
      }
      
    } catch (error) {
      criteria.status = 'failed';
      criteria.validation_error = error.message;
      criteria.retry_count = (criteria.retry_count || 0) + 1;
    }
    
    // Update task
    task.success_criteria[criteriaIndex] = criteria;
    await this.taskManager.updateTask(taskId, task);
    
    return {
      success: criteria.status === 'met',
      criteriaId,
      taskId,
      criteria,
      canRetry: criteria.retry_count < criteria.max_retries
    };
  }
  
  /**
   * Run automated validation script
   */
  async runAutomatedValidation(script) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Validation timeout'));
      }, this.options.validationTimeout);
      
      const child = spawn('bash', ['-c', script]);
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', data => stdout += data);
      child.stderr.on('data', data => stderr += data);
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          success: code === 0,
          result: stdout,
          error: stderr,
          exitCode: code,
          evidence: {
            type: 'script_output',
            data: { stdout, stderr, exitCode: code },
            timestamp: new Date().toISOString()
          }
        });
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
  
  async findCriteria(taskId, criteriaId) {
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    if (!task.success_criteria) {
      throw new Error(`No success criteria found for task: ${taskId}`);
    }
    
    const criteriaIndex = task.success_criteria.findIndex(c => c.id === criteriaId);
    if (criteriaIndex === -1) {
      throw new Error(`Criteria not found: ${criteriaId}`);
    }
    
    return {
      task,
      criteria: task.success_criteria[criteriaIndex],
      criteriaIndex
    };
  }
  
  generateCriteriaId() {
    return `criteria_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
}
```

### Phase 3: Testing & Validation Strategy

#### 3.1 Comprehensive Test Suite
```javascript
// test/api-compatibility.test.js
describe('API Compatibility Testing', () => {
  describe('Backward Compatibility', () => {
    test('legacy string subtasks continue to work', async () => {
      const taskData = {
        title: 'Legacy Task',
        category: 'feature',
        subtasks: ['Subtask 1', 'Subtask 2'],
        success_criteria: ['All tests pass', 'Code reviewed']
      };
      
      const result = await api.create(taskData);
      expect(result.success).toBe(true);
      
      const task = await api.getTask(result.taskId);
      expect(task.subtasks).toHaveLength(2);
      expect(task.subtasks[0].title).toBe('Subtask 1');
      expect(task.success_criteria[0].description).toBe('All tests pass');
    });
    
    test('mixed legacy and enhanced formats coexist', async () => {
      const taskData = {
        title: 'Mixed Task',
        category: 'feature',
        subtasks: [
          'Legacy subtask',
          {
            id: 'subtask_123_abc',
            title: 'Enhanced subtask',
            type: 'research'
          }
        ]
      };
      
      const result = await api.create(taskData);
      const task = await api.getTask(result.taskId);
      
      expect(task.subtasks[0].title).toBe('Legacy subtask');
      expect(task.subtasks[1].type).toBe('research');
    });
  });
  
  describe('Enhanced Functionality', () => {
    test('subtask lifecycle management works', async () => {
      const parentTask = await api.create({
        title: 'Parent Task',
        category: 'feature'
      });
      
      const subtask = await api.createSubtask(parentTask.taskId, {
        title: 'Test Subtask',
        type: 'implementation'
      });
      
      expect(subtask.success).toBe(true);
      expect(subtask.subtask.parent_task).toBe(parentTask.taskId);
      
      const claimResult = await api.claimSubtask(subtask.subtaskId, 'test_agent');
      expect(claimResult.success).toBe(true);
      
      const completeResult = await api.completeSubtask(subtask.subtaskId);
      expect(completeResult.success).toBe(true);
    });
  });
});
```

### Phase 4: Deployment & Monitoring

#### 4.1 Feature Flag Implementation
```javascript
// lib/featureFlags.js  
class FeatureFlags {
  static EMBEDDED_SUBTASKS = 'embedded_subtasks_v2';
  static SUCCESS_CRITERIA_AUTOMATION = 'success_criteria_automation';
  
  static isEnabled(flag, context = {}) {
    const envVar = `FEATURE_${flag.toUpperCase()}`;
    const envValue = process.env[envVar];
    
    if (envValue !== undefined) {
      return envValue === 'true';
    }
    
    // Default rollout strategy
    const rolloutConfig = {
      [this.EMBEDDED_SUBTASKS]: {
        defaultEnabled: true,
        rolloutPercentage: 100
      },
      [this.SUCCESS_CRITERIA_AUTOMATION]: {
        defaultEnabled: false,
        rolloutPercentage: 50
      }
    };
    
    const config = rolloutConfig[flag];
    if (!config) return false;
    
    if (config.rolloutPercentage === 100) {
      return config.defaultEnabled;
    }
    
    // Gradual rollout based on agent ID hash
    const hash = crypto.createHash('md5').update(context.agentId || 'default').digest('hex');
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    const percentage = (hashNumber % 100) + 1;
    
    return percentage <= config.rolloutPercentage;
  }
}
```

#### 4.2 Performance Monitoring
```javascript
// lib/performanceMonitor.js
class EnhancedPerformanceMonitor {
  constructor() {
    this.metrics = {
      subtaskOperations: {
        create: { count: 0, totalTime: 0, errors: 0 },
        claim: { count: 0, totalTime: 0, errors: 0 },
        complete: { count: 0, totalTime: 0, errors: 0 }
      },
      criteriaOperations: {
        add: { count: 0, totalTime: 0, errors: 0 },
        validate: { count: 0, totalTime: 0, errors: 0 },
        autoValidate: { count: 0, totalTime: 0, errors: 0 }
      },
      memoryUsage: {
        baseline: process.memoryUsage(),
        peak: process.memoryUsage(),
        current: process.memoryUsage()
      }
    };
  }
  
  startTimer(operation) {
    return {
      operation,
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage()
    };
  }
  
  endTimer(timer, error = null) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - timer.startTime) / 1e6; // Convert to milliseconds
    const endMemory = process.memoryUsage();
    
    const [category, action] = timer.operation.split('.');
    if (this.metrics[category] && this.metrics[category][action]) {
      const metric = this.metrics[category][action];
      metric.count++;
      metric.totalTime += duration;
      if (error) metric.errors++;
    }
    
    // Track memory usage
    this.metrics.memoryUsage.current = endMemory;
    if (endMemory.heapUsed > this.metrics.memoryUsage.peak.heapUsed) {
      this.metrics.memoryUsage.peak = endMemory;
    }
    
    return {
      duration,
      memoryDelta: endMemory.heapUsed - timer.startMemory.heapUsed,
      success: !error
    };
  }
  
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: {
        totalOperations: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        memoryGrowth: this.metrics.memoryUsage.current.heapUsed - this.metrics.memoryUsage.baseline.heapUsed
      }
    };
    
    // Calculate summaries
    Object.values(this.metrics.subtaskOperations).concat(Object.values(this.metrics.criteriaOperations))
      .forEach(metric => {
        report.summary.totalOperations += metric.count;
        report.summary.totalErrors += metric.errors;
      });
    
    if (report.summary.totalOperations > 0) {
      const totalTime = Object.values(this.metrics.subtaskOperations).concat(Object.values(this.metrics.criteriaOperations))
        .reduce((sum, metric) => sum + metric.totalTime, 0);
      report.summary.averageResponseTime = totalTime / report.summary.totalOperations;
    }
    
    return report;
  }
}
```

## Rollback Strategy

### Emergency Rollback Plan
```javascript
// lib/rollbackManager.js
class RollbackManager {
  static async emergencyRollback(todoPath, reason) {
    const timestamp = new Date().toISOString();
    const backupPath = `${todoPath}.rollback.${Date.now()}`;
    
    // 1. Create backup of current state
    fs.copyFileSync(todoPath, backupPath);
    
    // 2. Find most recent compatible backup
    const compatibleBackup = await this.findLatestCompatibleBackup(todoPath);
    
    if (!compatibleBackup) {
      throw new Error('No compatible backup found for rollback');
    }
    
    // 3. Restore compatible state
    fs.copyFileSync(compatibleBackup, todoPath);
    
    // 4. Log rollback event
    this.logRollback({
      timestamp,
      reason,
      restoredFrom: compatibleBackup,
      backupCreated: backupPath
    });
    
    return {
      success: true,
      restoredFrom: compatibleBackup,
      backupPath,
      timestamp
    };
  }
  
  static async findLatestCompatibleBackup(todoPath) {
    const backupDir = path.dirname(todoPath);
    const files = fs.readdirSync(backupDir);
    
    const compatibleBackups = files
      .filter(file => file.startsWith('TODO.json.backup.'))
      .map(file => ({
        path: path.join(backupDir, file),
        timestamp: this.extractTimestamp(file)
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    for (const backup of compatibleBackups) {
      if (await this.validateBackupCompatibility(backup.path)) {
        return backup.path;
      }
    }
    
    return null;
  }
  
  static async validateBackupCompatibility(backupPath) {
    try {
      const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      // Check for basic structure
      if (!data.tasks || !Array.isArray(data.tasks)) return false;
      
      // Validate that tasks can be parsed without enhanced features
      for (const task of data.tasks) {
        // Ensure subtasks/success_criteria are arrays (not necessarily objects)
        if (task.subtasks && !Array.isArray(task.subtasks)) return false;
        if (task.success_criteria && !Array.isArray(task.success_criteria)) return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Conclusion

This implementation strategy provides a comprehensive roadmap for adding embedded subtasks and success criteria functionality to the TaskManager API while maintaining full backward compatibility. The phased approach ensures minimal disruption to existing clients while providing a smooth path for enhanced functionality adoption.

Key success factors:
1. **Dual-format support** ensures existing clients continue working
2. **Progressive enhancement** allows gradual feature adoption
3. **Comprehensive testing** validates both legacy and enhanced scenarios
4. **Performance monitoring** ensures system stability
5. **Emergency rollback** provides safety net for critical issues

The architecture is designed to be resilient, extensible, and production-ready.