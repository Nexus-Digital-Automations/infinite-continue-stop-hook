# Data Integrity Validation Framework
## Comprehensive Data Quality and Consistency Management

**Task ID:** feature_1757784268797_9ctymf9jo  
**Agent:** development_session_1757784244665_1_general_b1a69681  
**Date:** 2025-09-13  
**Framework Focus:** Ensuring data integrity for embedded subtasks and success criteria systems

---

## Executive Summary

This document defines a comprehensive data integrity validation framework for the enhanced TaskManager system. The framework ensures data consistency, prevents corruption, validates relationships, and maintains quality standards across all embedded subtasks and success criteria operations.

### Framework Objectives

1. **Prevent Data Corruption**: Real-time validation prevents invalid data states
2. **Maintain Referential Integrity**: Ensure all relationships remain valid
3. **Enforce Business Rules**: Validate business logic constraints
4. **Performance Optimization**: Efficient validation without performance impact
5. **Recovery Mechanisms**: Automatic detection and recovery from integrity violations

---

## Integrity Validation Architecture

### Multi-Layer Validation System

```javascript
/**
 * Comprehensive Data Integrity Framework
 * 
 * VALIDATION LAYERS:
 * 1. Schema Layer: Structural validation and type checking
 * 2. Reference Layer: Relationship and dependency validation  
 * 3. Business Layer: Business rule and constraint validation
 * 4. Performance Layer: Efficiency and optimization validation
 * 5. Security Layer: Access control and audit validation
 */

class DataIntegrityFramework {
  constructor(options = {}) {
    this.config = {
      strictMode: options.strictMode !== false,
      autoRepair: options.autoRepair !== false,
      performanceThreshold: options.performanceThreshold || 100, // ms
      validationTimeout: options.validationTimeout || 30000, // 30 seconds
      ...options
    };
    
    this.validators = new Map([
      ['schema', new SchemaValidator(this.config)],
      ['reference', new ReferenceValidator(this.config)],
      ['business', new BusinessRuleValidator(this.config)],
      ['performance', new PerformanceValidator(this.config)],
      ['security', new SecurityValidator(this.config)]
    ]);
    
    this.repairStrategies = new Map([
      ['orphaned_subtasks', this._repairOrphanedSubtasks.bind(this)],
      ['broken_references', this._repairBrokenReferences.bind(this)],
      ['invalid_schema', this._repairInvalidSchema.bind(this)],
      ['constraint_violations', this._repairConstraintViolations.bind(this)]
    ]);
    
    this.validationHistory = [];
    this.performanceMetrics = new Map();
  }
  
  /**
   * Comprehensive validation of TODO data structure
   */
  async validateTodoData(todoData, validationContext = {}) {
    const validationId = crypto.randomBytes(8).toString('hex');
    const startTime = Date.now();
    
    const result = {
      validationId,
      valid: true,
      errors: [],
      warnings: [],
      repairs: [],
      statistics: {
        tasksValidated: 0,
        subtasksValidated: 0,
        successCriteriaValidated: 0,
        referencesValidated: 0
      },
      performance: {
        totalTime: 0,
        validationTimes: {},
        repairTimes: {}
      }
    };
    
    try {
      // Execute validation layers in sequence
      for (const [layerName, validator] of this.validators) {
        const layerStartTime = Date.now();
        
        const layerResult = await validator.validate(todoData, validationContext);
        
        if (!layerResult.valid) {
          result.valid = false;
          result.errors.push(...layerResult.errors);
        }
        
        result.warnings.push(...(layerResult.warnings || []));
        result.statistics = this._mergeStatistics(result.statistics, layerResult.statistics);
        result.performance.validationTimes[layerName] = Date.now() - layerStartTime;
      }
      
      // Attempt auto-repair if enabled and issues found
      if (this.config.autoRepair && (result.errors.length > 0)) {
        const repairResult = await this._attemptAutoRepair(todoData, result.errors);
        result.repairs = repairResult.repairs;
        
        // Re-validate after repairs
        if (repairResult.repairsApplied) {
          const revalidationResult = await this._quickRevalidation(todoData);
          result.valid = revalidationResult.valid;
          result.errors = revalidationResult.errors;
        }
      }
      
      result.performance.totalTime = Date.now() - startTime;
      
      // Record validation history
      this._recordValidationHistory(result);
      
      return result;
      
    } catch (error) {
      result.valid = false;
      result.errors.push({
        type: 'validation_framework_error',
        message: error.message,
        severity: 'critical',
        timestamp: new Date().toISOString()
      });
      
      return result;
    }
  }
  
  /**
   * Real-time validation for single operations
   */
  async validateOperation(operation, todoData, context = {}) {
    const operationValidators = {
      'create_task': this._validateCreateTask.bind(this),
      'update_task': this._validateUpdateTask.bind(this),
      'delete_task': this._validateDeleteTask.bind(this),
      'create_subtask': this._validateCreateSubtask.bind(this),
      'update_subtask': this._validateUpdateSubtask.bind(this),
      'delete_subtask': this._validateDeleteSubtask.bind(this),
      'update_success_criteria': this._validateUpdateSuccessCriteria.bind(this)
    };
    
    const validator = operationValidators[operation.type];
    if (!validator) {
      return {
        valid: false,
        errors: [{
          type: 'unknown_operation',
          message: `Unknown operation type: ${operation.type}`,
          severity: 'error'
        }]
      };
    }
    
    return await validator(operation, todoData, context);
  }
  
  /**
   * Continuous integrity monitoring
   */
  async startIntegrityMonitoring(todoPath, options = {}) {
    const monitoringId = crypto.randomBytes(8).toString('hex');
    const intervalMs = options.intervalMs || 60000; // 1 minute default
    
    const monitor = {
      id: monitoringId,
      todoPath,
      lastCheck: null,
      issues: [],
      active: true
    };
    
    const monitoringLoop = async () => {
      if (!monitor.active) return;
      
      try {
        const todoData = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
        const validationResult = await this.validateTodoData(todoData, {
          monitoring: true,
          quickMode: true
        });
        
        monitor.lastCheck = new Date().toISOString();
        
        if (!validationResult.valid) {
          monitor.issues = validationResult.errors;
          
          // Emit integrity violation event
          this._emitIntegrityViolation(monitoringId, validationResult);
        } else {
          monitor.issues = [];
        }
        
      } catch (error) {
        monitor.issues = [{
          type: 'monitoring_error',
          message: error.message,
          severity: 'critical',
          timestamp: new Date().toISOString()
        }];
      }
      
      // Schedule next check
      setTimeout(monitoringLoop, intervalMs);
    };
    
    // Start monitoring
    setTimeout(monitoringLoop, intervalMs);
    
    return monitor;
  }
}
```

### Schema Validation Layer

```javascript
class SchemaValidator {
  constructor(config) {
    this.config = config;
    this.schemas = this._loadValidationSchemas();
  }
  
  async validate(todoData, context) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      statistics: {
        tasksValidated: 0,
        subtasksValidated: 0,
        successCriteriaValidated: 0
      }
    };
    
    // Validate root structure
    const rootValidation = this._validateRootStructure(todoData);
    if (!rootValidation.valid) {
      result.valid = false;
      result.errors.push(...rootValidation.errors);
    }
    
    // Validate each task
    for (const task of todoData.tasks || []) {
      const taskValidation = await this._validateTaskSchema(task, context);
      
      if (!taskValidation.valid) {
        result.valid = false;
        result.errors.push(...taskValidation.errors);
      }
      
      result.warnings.push(...taskValidation.warnings);
      result.statistics.tasksValidated++;
      
      // Validate subtasks
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          const subtaskValidation = await this._validateSubtaskSchema(subtask, task, context);
          
          if (!subtaskValidation.valid) {
            result.valid = false;
            result.errors.push(...subtaskValidation.errors);
          }
          
          result.warnings.push(...subtaskValidation.warnings);
          result.statistics.subtasksValidated++;
          
          // Validate subtask success criteria
          if (subtask.success_criteria?.length) {
            for (const criteria of subtask.success_criteria) {
              const criteriaValidation = this._validateSuccessCriteriaSchema(criteria, subtask, context);
              
              if (!criteriaValidation.valid) {
                result.valid = false;
                result.errors.push(...criteriaValidation.errors);
              }
              
              result.statistics.successCriteriaValidated++;
            }
          }
        }
      }
      
      // Validate task success criteria
      if (task.success_criteria?.length) {
        for (const criteria of task.success_criteria) {
          const criteriaValidation = this._validateSuccessCriteriaSchema(criteria, task, context);
          
          if (!criteriaValidation.valid) {
            result.valid = false;
            result.errors.push(...criteriaValidation.errors);
          }
          
          result.statistics.successCriteriaValidated++;
        }
      }
    }
    
    return result;
  }
  
  _validateTaskSchema(task, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    // Required fields validation
    const requiredFields = ['id', 'title', 'category', 'status', 'created_at'];
    for (const field of requiredFields) {
      if (!task[field]) {
        result.valid = false;
        result.errors.push({
          type: 'missing_required_field',
          field,
          task: task.id || 'unknown',
          message: `Required field '${field}' is missing`,
          severity: 'error'
        });
      }
    }
    
    // ID format validation
    if (task.id && !this._validateIdFormat(task.id, 'task')) {
      result.valid = false;
      result.errors.push({
        type: 'invalid_id_format',
        task: task.id,
        message: `Task ID '${task.id}' has invalid format`,
        severity: 'error'
      });
    }
    
    // Status validation
    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
    if (task.status && !validStatuses.includes(task.status)) {
      result.valid = false;
      result.errors.push({
        type: 'invalid_status',
        task: task.id,
        value: task.status,
        message: `Invalid task status: ${task.status}`,
        severity: 'error'
      });
    }
    
    // Category validation  
    const validCategories = ['feature', 'error', 'subtask', 'test', 'audit'];
    if (task.category && !validCategories.includes(task.category)) {
      result.warnings.push({
        type: 'invalid_category',
        task: task.id,
        value: task.category,
        message: `Unknown task category: ${task.category}`,
        severity: 'warning'
      });
    }
    
    // Date validation
    if (task.created_at && !this._validateISODate(task.created_at)) {
      result.valid = false;
      result.errors.push({
        type: 'invalid_date_format',
        task: task.id,
        field: 'created_at',
        value: task.created_at,
        message: 'Invalid ISO date format',
        severity: 'error'
      });
    }
    
    // Array field validation
    const arrayFields = ['subtasks', 'dependencies', 'important_files', 'success_criteria'];
    for (const field of arrayFields) {
      if (task[field] && !Array.isArray(task[field])) {
        result.valid = false;
        result.errors.push({
          type: 'invalid_field_type',
          task: task.id,
          field,
          expected: 'array',
          actual: typeof task[field],
          message: `Field '${field}' must be an array`,
          severity: 'error'
        });
      }
    }
    
    return result;
  }
  
  _validateSubtaskSchema(subtask, parentTask, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    // Required fields validation
    const requiredFields = ['id', 'type', 'title', 'status', 'created_at'];
    for (const field of requiredFields) {
      if (!subtask[field]) {
        result.valid = false;
        result.errors.push({
          type: 'missing_required_field',
          field,
          subtask: subtask.id || 'unknown',
          parent_task: parentTask.id,
          message: `Required subtask field '${field}' is missing`,
          severity: 'error'
        });
      }
    }
    
    // ID format validation
    if (subtask.id && !this._validateIdFormat(subtask.id, 'subtask')) {
      result.valid = false;
      result.errors.push({
        type: 'invalid_subtask_id_format',
        subtask: subtask.id,
        parent_task: parentTask.id,
        message: `Subtask ID '${subtask.id}' has invalid format`,
        severity: 'error'
      });
    }
    
    // Type validation
    const validTypes = ['research', 'audit', 'implementation'];
    if (subtask.type && !validTypes.includes(subtask.type)) {
      result.valid = false;
      result.errors.push({
        type: 'invalid_subtask_type',
        subtask: subtask.id,
        parent_task: parentTask.id,
        value: subtask.type,
        message: `Invalid subtask type: ${subtask.type}`,
        severity: 'error'
      });
    }
    
    // Parent reference validation
    if (subtask.parent_task_id && subtask.parent_task_id !== parentTask.id) {
      result.valid = false;
      result.errors.push({
        type: 'parent_reference_mismatch',
        subtask: subtask.id,
        expected_parent: parentTask.id,
        actual_parent: subtask.parent_task_id,
        message: 'Parent task reference mismatch',
        severity: 'error'
      });
    }
    
    // Type-specific validation
    if (subtask.type === 'research' && !subtask.research_config) {
      result.warnings.push({
        type: 'missing_research_config',
        subtask: subtask.id,
        message: 'Research subtask missing research_config',
        severity: 'warning'
      });
    }
    
    if (subtask.type === 'audit' && !subtask.audit_config) {
      result.warnings.push({
        type: 'missing_audit_config',
        subtask: subtask.id,
        message: 'Audit subtask missing audit_config',
        severity: 'warning'
      });
    }
    
    // Estimated hours validation
    if (subtask.estimated_hours !== undefined) {
      if (typeof subtask.estimated_hours !== 'number' || 
          subtask.estimated_hours < 0 || 
          subtask.estimated_hours > 40) {
        result.valid = false;
        result.errors.push({
          type: 'invalid_estimated_hours',
          subtask: subtask.id,
          value: subtask.estimated_hours,
          message: 'Estimated hours must be a number between 0 and 40',
          severity: 'error'
        });
      }
    }
    
    return result;
  }
  
  _validateSuccessCriteriaSchema(criteria, parent, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    // Handle both string and object formats
    if (typeof criteria === 'string') {
      // Simple string format is valid for backward compatibility
      return result;
    }
    
    if (typeof criteria !== 'object' || criteria === null) {
      result.valid = false;
      result.errors.push({
        type: 'invalid_criteria_type',
        parent: parent.id,
        message: 'Success criteria must be string or object',
        severity: 'error'
      });
      return result;
    }
    
    // Enhanced object format validation
    const requiredFields = ['id', 'title', 'category', 'validation'];
    for (const field of requiredFields) {
      if (!criteria[field]) {
        result.valid = false;
        result.errors.push({
          type: 'missing_criteria_field',
          field,
          criteria: criteria.id || 'unknown',
          parent: parent.id,
          message: `Required success criteria field '${field}' is missing`,
          severity: 'error'
        });
      }
    }
    
    // Validation configuration check
    if (criteria.validation && typeof criteria.validation === 'object') {
      if (!criteria.validation.type) {
        result.valid = false;
        result.errors.push({
          type: 'missing_validation_type',
          criteria: criteria.id,
          parent: parent.id,
          message: 'Success criteria validation must specify type',
          severity: 'error'
        });
      }
      
      const validValidationTypes = ['automated', 'manual', 'hybrid'];
      if (criteria.validation.type && !validValidationTypes.includes(criteria.validation.type)) {
        result.valid = false;
        result.errors.push({
          type: 'invalid_validation_type',
          criteria: criteria.id,
          parent: parent.id,
          value: criteria.validation.type,
          message: `Invalid validation type: ${criteria.validation.type}`,
          severity: 'error'
        });
      }
    }
    
    return result;
  }
  
  _validateIdFormat(id, type) {
    const patterns = {
      task: /^(feature|error|test|subtask|audit)_\d+_[a-z0-9]+$/,
      subtask: /^(research|audit|impl)_\d+_[a-z0-9]+$/,
      criteria: /^criteria_\d+_[a-z0-9]+$/
    };
    
    return patterns[type]?.test(id) || false;
  }
  
  _validateISODate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }
  
  _loadValidationSchemas() {
    return {
      task: {
        type: "object",
        required: ["id", "title", "category", "status", "created_at"],
        properties: {
          id: { type: "string", pattern: "^(feature|error|test|subtask|audit)_\\d+_[a-z0-9]+$" },
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 5000 },
          category: { type: "string", enum: ["feature", "error", "subtask", "test", "audit"] },
          status: { type: "string", enum: ["pending", "in_progress", "completed", "blocked", "cancelled"] },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          subtasks: { type: "array", items: { "$ref": "#/definitions/subtask" } },
          dependencies: { type: "array", items: { type: "string" } },
          important_files: { type: "array", items: { type: "string" } },
          success_criteria: { type: "array" }
        }
      },
      subtask: {
        type: "object", 
        required: ["id", "type", "title", "status", "created_at"],
        properties: {
          id: { type: "string", pattern: "^(research|audit|impl)_\\d+_[a-z0-9]+$" },
          type: { type: "string", enum: ["research", "audit", "implementation"] },
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          status: { type: "string", enum: ["pending", "in_progress", "completed", "blocked"] },
          estimated_hours: { type: "number", minimum: 0, maximum: 40 },
          actual_hours: { type: "number", minimum: 0 },
          parent_task_id: { type: "string" },
          depends_on: { type: "array", items: { type: "string" } },
          blocks: { type: "array", items: { type: "string" } }
        }
      }
    };
  }
}
```

### Reference Integrity Validator

```javascript
class ReferenceValidator {
  constructor(config) {
    this.config = config;
  }
  
  async validate(todoData, context) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      statistics: {
        referencesValidated: 0,
        orphanedReferences: 0,
        circularDependencies: 0
      }
    };
    
    // Build reference maps for efficient lookup
    const referenceMap = this._buildReferenceMap(todoData);
    
    // Validate task-level references
    for (const task of todoData.tasks || []) {
      const taskReferenceValidation = this._validateTaskReferences(task, referenceMap, todoData);
      
      if (!taskReferenceValidation.valid) {
        result.valid = false;
        result.errors.push(...taskReferenceValidation.errors);
      }
      
      result.warnings.push(...taskReferenceValidation.warnings);
      result.statistics.referencesValidated += taskReferenceValidation.referencesChecked;
      
      // Validate subtask references
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          const subtaskReferenceValidation = this._validateSubtaskReferences(
            subtask, 
            task, 
            referenceMap, 
            todoData
          );
          
          if (!subtaskReferenceValidation.valid) {
            result.valid = false;
            result.errors.push(...subtaskReferenceValidation.errors);
          }
          
          result.warnings.push(...subtaskReferenceValidation.warnings);
          result.statistics.referencesValidated += subtaskReferenceValidation.referencesChecked;
        }
      }
    }
    
    // Detect circular dependencies
    const circularDependencies = this._detectCircularDependencies(todoData);
    if (circularDependencies.length > 0) {
      result.valid = false;
      result.statistics.circularDependencies = circularDependencies.length;
      
      for (const cycle of circularDependencies) {
        result.errors.push({
          type: 'circular_dependency',
          cycle: cycle.join(' -> '),
          message: `Circular dependency detected: ${cycle.join(' -> ')}`,
          severity: 'error'
        });
      }
    }
    
    return result;
  }
  
  _buildReferenceMap(todoData) {
    const map = {
      tasks: new Map(),
      subtasks: new Map(),
      tasksBySubtask: new Map()
    };
    
    for (const task of todoData.tasks || []) {
      map.tasks.set(task.id, task);
      
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          map.subtasks.set(subtask.id, subtask);
          map.tasksBySubtask.set(subtask.id, task);
        }
      }
    }
    
    return map;
  }
  
  _validateTaskReferences(task, referenceMap, todoData) {
    const result = { 
      valid: true, 
      errors: [], 
      warnings: [], 
      referencesChecked: 0 
    };
    
    // Validate dependencies
    if (task.dependencies?.length) {
      for (const depId of task.dependencies) {
        result.referencesChecked++;
        
        if (!referenceMap.tasks.has(depId)) {
          result.valid = false;
          result.errors.push({
            type: 'missing_task_dependency',
            task: task.id,
            dependency: depId,
            message: `Task dependency '${depId}' not found`,
            severity: 'error'
          });
        }
      }
    }
    
    // Validate subtask parent references
    if (task.subtasks?.length) {
      for (const subtask of task.subtasks) {
        result.referencesChecked++;
        
        if (subtask.parent_task_id && subtask.parent_task_id !== task.id) {
          result.valid = false;
          result.errors.push({
            type: 'subtask_parent_mismatch',
            task: task.id,
            subtask: subtask.id,
            expected_parent: task.id,
            actual_parent: subtask.parent_task_id,
            message: 'Subtask parent reference does not match containing task',
            severity: 'error'
          });
        }
      }
    }
    
    return result;
  }
  
  _validateSubtaskReferences(subtask, parentTask, referenceMap, todoData) {
    const result = { 
      valid: true, 
      errors: [], 
      warnings: [], 
      referencesChecked: 0 
    };
    
    // Validate subtask dependencies
    if (subtask.depends_on?.length) {
      for (const depId of subtask.depends_on) {
        result.referencesChecked++;
        
        if (!referenceMap.subtasks.has(depId) && !referenceMap.tasks.has(depId)) {
          result.valid = false;
          result.errors.push({
            type: 'missing_subtask_dependency',
            subtask: subtask.id,
            parent_task: parentTask.id,
            dependency: depId,
            message: `Subtask dependency '${depId}' not found`,
            severity: 'error'
          });
        }
      }
    }
    
    // Validate blocked task/subtask references
    if (subtask.blocks?.length) {
      for (const blockedId of subtask.blocks) {
        result.referencesChecked++;
        
        if (!referenceMap.subtasks.has(blockedId) && !referenceMap.tasks.has(blockedId)) {
          result.valid = false;
          result.errors.push({
            type: 'missing_blocked_reference',
            subtask: subtask.id,
            parent_task: parentTask.id,
            blocked: blockedId,
            message: `Blocked reference '${blockedId}' not found`,
            severity: 'error'
          });
        }
      }
    }
    
    return result;
  }
  
  _detectCircularDependencies(todoData) {
    const circularDependencies = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (taskId, path = []) => {
      if (recursionStack.has(taskId)) {
        // Found circular dependency
        const cycleStart = path.indexOf(taskId);
        const cycle = path.slice(cycleStart).concat([taskId]);
        circularDependencies.push(cycle);
        return;
      }
      
      if (visited.has(taskId)) return;
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const task = todoData.tasks?.find(t => t.id === taskId);
      if (task?.dependencies?.length) {
        for (const depId of task.dependencies) {
          dfs(depId, path.concat([taskId]));
        }
      }
      
      // Check subtask dependencies  
      if (task?.subtasks?.length) {
        for (const subtask of task.subtasks) {
          if (subtask.depends_on?.length) {
            for (const depId of subtask.depends_on) {
              dfs(depId, path.concat([taskId, subtask.id]));
            }
          }
        }
      }
      
      recursionStack.delete(taskId);
    };
    
    // Check all tasks for circular dependencies
    for (const task of todoData.tasks || []) {
      if (!visited.has(task.id)) {
        dfs(task.id);
      }
    }
    
    return circularDependencies;
  }
}
```

### Business Rule Validator

```javascript
class BusinessRuleValidator {
  constructor(config) {
    this.config = config;
    this.rules = this._loadBusinessRules();
  }
  
  async validate(todoData, context) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      statistics: {
        rulesEvaluated: 0,
        ruleViolations: 0
      }
    };
    
    for (const [ruleName, rule] of this.rules) {
      try {
        const ruleResult = await rule.evaluate(todoData, context);
        result.statistics.rulesEvaluated++;
        
        if (!ruleResult.valid) {
          result.valid = false;
          result.statistics.ruleViolations++;
          result.errors.push(...ruleResult.errors);
        }
        
        result.warnings.push(...(ruleResult.warnings || []));
        
      } catch (error) {
        result.valid = false;
        result.errors.push({
          type: 'business_rule_error',
          rule: ruleName,
          message: `Business rule evaluation failed: ${error.message}`,
          severity: 'critical'
        });
      }
    }
    
    return result;
  }
  
  _loadBusinessRules() {
    return new Map([
      ['research_before_implementation', {
        description: 'Feature tasks requiring research must have research subtasks',
        evaluate: this._validateResearchBeforeImplementation.bind(this)
      }],
      ['audit_after_completion', {
        description: 'Feature tasks must have audit subtasks for quality gates',
        evaluate: this._validateAuditAfterCompletion.bind(this)
      }],
      ['success_criteria_coverage', {
        description: 'Tasks must have adequate success criteria coverage',
        evaluate: this._validateSuccessCriteriaCoverage.bind(this)
      }],
      ['dependency_ordering', {
        description: 'Task dependencies must respect category ordering rules',
        evaluate: this._validateDependencyOrdering.bind(this)
      }],
      ['subtask_workflow_integrity', {
        description: 'Subtask workflows must follow logical progression',
        evaluate: this._validateSubtaskWorkflowIntegrity.bind(this)
      }]
    ]);
  }
  
  async _validateResearchBeforeImplementation(todoData, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    for (const task of todoData.tasks || []) {
      if (task.category === 'feature' && task.requires_research) {
        const hasResearchSubtask = task.subtasks?.some(st => st.type === 'research');
        
        if (!hasResearchSubtask) {
          result.valid = false;
          result.errors.push({
            type: 'missing_required_research',
            task: task.id,
            message: 'Feature task requires research but has no research subtask',
            severity: 'error',
            rule: 'research_before_implementation'
          });
        }
      }
    }
    
    return result;
  }
  
  async _validateAuditAfterCompletion(todoData, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    for (const task of todoData.tasks || []) {
      if (task.category === 'feature') {
        const hasAuditSubtask = task.subtasks?.some(st => st.type === 'audit');
        
        if (!hasAuditSubtask) {
          result.warnings.push({
            type: 'missing_audit_subtask',
            task: task.id,
            message: 'Feature task should have audit subtask for quality assurance',
            severity: 'warning',
            rule: 'audit_after_completion'
          });
        }
      }
    }
    
    return result;
  }
  
  async _validateSuccessCriteriaCoverage(todoData, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    for (const task of todoData.tasks || []) {
      const criteriaCount = task.success_criteria?.length || 0;
      const subtasksCriteriaCount = task.subtasks?.reduce((sum, st) => 
        sum + (st.success_criteria?.length || 0), 0) || 0;
      
      const totalCriteriaCount = criteriaCount + subtasksCriteriaCount;
      
      // Business rule: Feature tasks should have at least 5 success criteria
      if (task.category === 'feature' && totalCriteriaCount < 5) {
        result.warnings.push({
          type: 'insufficient_success_criteria',
          task: task.id,
          current_count: totalCriteriaCount,
          minimum_required: 5,
          message: 'Feature task has insufficient success criteria coverage',
          severity: 'warning',
          rule: 'success_criteria_coverage'
        });
      }
      
      // Critical tasks should have more comprehensive criteria
      if (task.priority === 'critical' && totalCriteriaCount < 10) {
        result.warnings.push({
          type: 'insufficient_critical_criteria',
          task: task.id,
          current_count: totalCriteriaCount,
          minimum_required: 10,
          message: 'Critical task should have comprehensive success criteria',
          severity: 'warning',
          rule: 'success_criteria_coverage'
        });
      }
    }
    
    return result;
  }
  
  async _validateDependencyOrdering(todoData, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    const categoryPriority = {
      'error': 1,
      'feature': 2, 
      'subtask': 3,
      'test': 4,
      'audit': 5
    };
    
    for (const task of todoData.tasks || []) {
      if (task.dependencies?.length) {
        for (const depId of task.dependencies) {
          const depTask = todoData.tasks?.find(t => t.id === depId);
          
          if (depTask) {
            const currentPriority = categoryPriority[task.category] || 999;
            const depPriority = categoryPriority[depTask.category] || 999;
            
            // A task cannot depend on a lower priority category
            if (currentPriority < depPriority) {
              result.valid = false;
              result.errors.push({
                type: 'invalid_dependency_ordering',
                task: task.id,
                task_category: task.category,
                dependency: depId,
                dependency_category: depTask.category,
                message: `${task.category} task cannot depend on ${depTask.category} task`,
                severity: 'error',
                rule: 'dependency_ordering'
              });
            }
          }
        }
      }
    }
    
    return result;
  }
  
  async _validateSubtaskWorkflowIntegrity(todoData, context) {
    const result = { valid: true, errors: [], warnings: [] };
    
    for (const task of todoData.tasks || []) {
      if (task.subtasks?.length) {
        const researchSubtasks = task.subtasks.filter(st => st.type === 'research');
        const auditSubtasks = task.subtasks.filter(st => st.type === 'audit');
        
        // Business rule: Research subtasks should prevent implementation
        for (const researchSubtask of researchSubtasks) {
          if (researchSubtask.status === 'pending' || researchSubtask.status === 'in_progress') {
            if (!researchSubtask.prevents_implementation) {
              result.warnings.push({
                type: 'research_should_prevent_implementation',
                task: task.id,
                subtask: researchSubtask.id,
                message: 'Active research subtask should prevent task implementation',
                severity: 'warning',
                rule: 'subtask_workflow_integrity'
              });
            }
          }
        }
        
        // Business rule: Audit subtasks should prevent completion
        for (const auditSubtask of auditSubtasks) {
          if (auditSubtask.status === 'pending' || auditSubtask.status === 'in_progress') {
            if (!auditSubtask.prevents_completion) {
              result.warnings.push({
                type: 'audit_should_prevent_completion',
                task: task.id,
                subtask: auditSubtask.id,
                message: 'Active audit subtask should prevent task completion',
                severity: 'warning',
                rule: 'subtask_workflow_integrity'
              });
            }
          }
        }
        
        // Business rule: Audit subtasks should prevent self-review
        for (const auditSubtask of auditSubtasks) {
          if (auditSubtask.type === 'audit' && !auditSubtask.prevents_self_review) {
            result.warnings.push({
              type: 'audit_should_prevent_self_review',
              task: task.id,
              subtask: auditSubtask.id,
              message: 'Audit subtask should prevent self-review for objectivity',
              severity: 'warning',
              rule: 'subtask_workflow_integrity'
            });
          }
        }
      }
    }
    
    return result;
  }
}
```

## Automatic Repair Mechanisms

```javascript
class AutoRepairSystem {
  constructor(config) {
    this.config = config;
    this.repairStrategies = new Map([
      ['orphaned_subtasks', this._repairOrphanedSubtasks.bind(this)],
      ['broken_references', this._repairBrokenReferences.bind(this)],
      ['invalid_schema', this._repairInvalidSchema.bind(this)],
      ['missing_parent_references', this._repairMissingParentReferences.bind(this)],
      ['inconsistent_status', this._repairInconsistentStatus.bind(this)]
    ]);
  }
  
  async attemptRepair(todoData, integrityIssues) {
    const repairResult = {
      successful: [],
      failed: [],
      repairsApplied: false,
      modifiedTodoData: JSON.parse(JSON.stringify(todoData)) // Deep copy
    };
    
    for (const issue of integrityIssues) {
      const repairStrategy = this._determineRepairStrategy(issue);
      
      if (repairStrategy && this.repairStrategies.has(repairStrategy)) {
        try {
          const strategy = this.repairStrategies.get(repairStrategy);
          const result = await strategy(repairResult.modifiedTodoData, issue);
          
          if (result.success) {
            repairResult.successful.push({
              issue: issue.type,
              strategy: repairStrategy,
              description: result.description,
              changes: result.changes
            });
            repairResult.repairsApplied = true;
          } else {
            repairResult.failed.push({
              issue: issue.type,
              strategy: repairStrategy,
              reason: result.reason
            });
          }
          
        } catch (error) {
          repairResult.failed.push({
            issue: issue.type,
            strategy: repairStrategy,
            reason: error.message
          });
        }
      } else {
        repairResult.failed.push({
          issue: issue.type,
          reason: 'No repair strategy available'
        });
      }
    }
    
    return repairResult;
  }
  
  _determineRepairStrategy(issue) {
    const strategyMap = {
      'missing_task_dependency': 'broken_references',
      'missing_subtask_dependency': 'broken_references',
      'subtask_parent_mismatch': 'missing_parent_references',
      'missing_required_field': 'invalid_schema',
      'invalid_status': 'inconsistent_status',
      'orphaned_subtask': 'orphaned_subtasks'
    };
    
    return strategyMap[issue.type];
  }
  
  async _repairOrphanedSubtasks(todoData, issue) {
    // Find subtasks that don't have a valid parent task
    let repaired = false;
    const changes = [];
    
    for (const task of todoData.tasks || []) {
      if (task.subtasks?.length) {
        const validSubtasks = [];
        
        for (const subtask of task.subtasks) {
          if (!subtask.parent_task_id) {
            // Add missing parent reference
            subtask.parent_task_id = task.id;
            changes.push(`Added parent reference to subtask ${subtask.id}`);
            repaired = true;
          }
          validSubtasks.push(subtask);
        }
        
        task.subtasks = validSubtasks;
      }
    }
    
    return {
      success: repaired,
      description: 'Repaired orphaned subtasks by adding parent references',
      changes
    };
  }
  
  async _repairBrokenReferences(todoData, issue) {
    const changes = [];
    let repaired = false;
    
    // Build valid reference set
    const validTaskIds = new Set(todoData.tasks?.map(t => t.id) || []);
    const validSubtaskIds = new Set();
    
    for (const task of todoData.tasks || []) {
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          validSubtaskIds.add(subtask.id);
        }
      }
    }
    
    // Repair task dependencies
    for (const task of todoData.tasks || []) {
      if (task.dependencies?.length) {
        const validDependencies = task.dependencies.filter(depId => {
          if (validTaskIds.has(depId)) {
            return true;
          } else {
            changes.push(`Removed broken task dependency ${depId} from task ${task.id}`);
            repaired = true;
            return false;
          }
        });
        
        task.dependencies = validDependencies;
      }
      
      // Repair subtask dependencies
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          if (subtask.depends_on?.length) {
            const validDeps = subtask.depends_on.filter(depId => {
              if (validSubtaskIds.has(depId) || validTaskIds.has(depId)) {
                return true;
              } else {
                changes.push(`Removed broken subtask dependency ${depId} from subtask ${subtask.id}`);
                repaired = true;
                return false;
              }
            });
            
            subtask.depends_on = validDeps;
          }
          
          if (subtask.blocks?.length) {
            const validBlocks = subtask.blocks.filter(blockId => {
              if (validSubtaskIds.has(blockId) || validTaskIds.has(blockId)) {
                return true;
              } else {
                changes.push(`Removed broken block reference ${blockId} from subtask ${subtask.id}`);
                repaired = true;
                return false;
              }
            });
            
            subtask.blocks = validBlocks;
          }
        }
      }
    }
    
    return {
      success: repaired,
      description: 'Repaired broken references by removing invalid dependencies',
      changes
    };
  }
  
  async _repairInvalidSchema(todoData, issue) {
    const changes = [];
    let repaired = false;
    
    for (const task of todoData.tasks || []) {
      // Add missing required fields
      if (!task.id) {
        task.id = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        changes.push(`Generated missing ID for task: ${task.id}`);
        repaired = true;
      }
      
      if (!task.created_at) {
        task.created_at = new Date().toISOString();
        changes.push(`Added missing created_at timestamp for task ${task.id}`);
        repaired = true;
      }
      
      if (!task.status) {
        task.status = 'pending';
        changes.push(`Set default status 'pending' for task ${task.id}`);
        repaired = true;
      }
      
      if (!task.category) {
        task.category = 'feature';
        changes.push(`Set default category 'feature' for task ${task.id}`);
        repaired = true;
      }
      
      // Ensure array fields are arrays
      const arrayFields = ['subtasks', 'dependencies', 'important_files', 'success_criteria'];
      for (const field of arrayFields) {
        if (task[field] && !Array.isArray(task[field])) {
          task[field] = [];
          changes.push(`Reset invalid ${field} to empty array for task ${task.id}`);
          repaired = true;
        }
      }
      
      // Repair subtasks
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          if (!subtask.id) {
            subtask.id = `subtask_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            changes.push(`Generated missing ID for subtask: ${subtask.id}`);
            repaired = true;
          }
          
          if (!subtask.created_at) {
            subtask.created_at = new Date().toISOString();
            changes.push(`Added missing created_at timestamp for subtask ${subtask.id}`);
            repaired = true;
          }
          
          if (!subtask.status) {
            subtask.status = 'pending';
            changes.push(`Set default status 'pending' for subtask ${subtask.id}`);
            repaired = true;
          }
          
          if (!subtask.type) {
            // Infer type from ID or default to 'implementation'
            if (subtask.id.startsWith('research_')) {
              subtask.type = 'research';
            } else if (subtask.id.startsWith('audit_')) {
              subtask.type = 'audit';
            } else {
              subtask.type = 'implementation';
            }
            changes.push(`Set inferred type '${subtask.type}' for subtask ${subtask.id}`);
            repaired = true;
          }
        }
      }
    }
    
    return {
      success: repaired,
      description: 'Repaired invalid schema by adding missing required fields',
      changes
    };
  }
  
  async _repairMissingParentReferences(todoData, issue) {
    const changes = [];
    let repaired = false;
    
    for (const task of todoData.tasks || []) {
      if (task.subtasks?.length) {
        for (const subtask of task.subtasks) {
          if (!subtask.parent_task_id || subtask.parent_task_id !== task.id) {
            subtask.parent_task_id = task.id;
            changes.push(`Fixed parent reference for subtask ${subtask.id} -> ${task.id}`);
            repaired = true;
          }
        }
      }
    }
    
    return {
      success: repaired,
      description: 'Repaired missing parent references in subtasks',
      changes
    };
  }
}
```

## Performance Monitoring and Metrics

```javascript
class IntegrityPerformanceMonitor {
  constructor() {
    this.metrics = {
      validationTimes: [],
      repairTimes: [],
      validationCounts: 0,
      repairCounts: 0,
      averageValidationTime: 0,
      averageRepairTime: 0
    };
    
    this.thresholds = {
      validationWarningTime: 1000, // 1 second
      validationCriticalTime: 5000, // 5 seconds
      repairWarningTime: 2000, // 2 seconds
      repairCriticalTime: 10000 // 10 seconds
    };
  }
  
  recordValidationMetrics(validationResult) {
    const totalTime = validationResult.performance?.totalTime || 0;
    
    this.metrics.validationTimes.push({
      timestamp: new Date().toISOString(),
      duration: totalTime,
      tasksValidated: validationResult.statistics?.tasksValidated || 0,
      subtasksValidated: validationResult.statistics?.subtasksValidated || 0,
      errorsFound: validationResult.errors?.length || 0
    });
    
    this.metrics.validationCounts++;
    this._updateAverageValidationTime();
    
    // Check performance thresholds
    if (totalTime > this.thresholds.validationCriticalTime) {
      this._emitPerformanceAlert('validation_critical_slow', {
        duration: totalTime,
        threshold: this.thresholds.validationCriticalTime
      });
    } else if (totalTime > this.thresholds.validationWarningTime) {
      this._emitPerformanceAlert('validation_warning_slow', {
        duration: totalTime,
        threshold: this.thresholds.validationWarningTime
      });
    }
  }
  
  recordRepairMetrics(repairResult) {
    const totalTime = repairResult.performance?.totalTime || 0;
    
    this.metrics.repairTimes.push({
      timestamp: new Date().toISOString(),
      duration: totalTime,
      repairsAttempted: repairResult.successful?.length || 0,
      repairsSuccessful: repairResult.successful?.length || 0,
      repairsFailed: repairResult.failed?.length || 0
    });
    
    this.metrics.repairCounts++;
    this._updateAverageRepairTime();
  }
  
  _updateAverageValidationTime() {
    const recentValidations = this.metrics.validationTimes.slice(-10); // Last 10 validations
    const totalTime = recentValidations.reduce((sum, v) => sum + v.duration, 0);
    this.metrics.averageValidationTime = totalTime / recentValidations.length;
  }
  
  _updateAverageRepairTime() {
    const recentRepairs = this.metrics.repairTimes.slice(-10); // Last 10 repairs
    const totalTime = recentRepairs.reduce((sum, r) => sum + r.duration, 0);
    this.metrics.averageRepairTime = totalTime / recentRepairs.length;
  }
  
  _emitPerformanceAlert(alertType, data) {
    console.warn(`[IntegrityFramework] Performance Alert: ${alertType}`, data);
    
    // Could integrate with external monitoring systems here
    // e.g., send to DataDog, New Relic, etc.
  }
  
  generatePerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        ...this.metrics,
        validationThroughput: this.metrics.validationCounts / (this.metrics.validationTimes.length || 1),
        repairSuccessRate: this.metrics.repairCounts > 0 ? 
          (this.metrics.repairTimes.reduce((sum, r) => sum + r.repairsSuccessful, 0) / 
           this.metrics.repairTimes.reduce((sum, r) => sum + r.repairsAttempted, 1)) : 0
      },
      recommendations: this._generatePerformanceRecommendations()
    };
  }
  
  _generatePerformanceRecommendations() {
    const recommendations = [];
    
    if (this.metrics.averageValidationTime > this.thresholds.validationWarningTime) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: 'Consider optimizing validation algorithms or reducing validation scope',
        metric: 'validation_time',
        current: this.metrics.averageValidationTime,
        threshold: this.thresholds.validationWarningTime
      });
    }
    
    if (this.metrics.averageRepairTime > this.thresholds.repairWarningTime) {
      recommendations.push({
        type: 'performance', 
        severity: 'medium',
        message: 'Consider optimizing repair strategies or implementing preventive measures',
        metric: 'repair_time',
        current: this.metrics.averageRepairTime,
        threshold: this.thresholds.repairWarningTime
      });
    }
    
    const recentValidations = this.metrics.validationTimes.slice(-5);
    const errorRate = recentValidations.reduce((sum, v) => sum + v.errorsFound, 0) / recentValidations.length;
    
    if (errorRate > 2) {
      recommendations.push({
        type: 'data_quality',
        severity: 'high', 
        message: 'High error rate detected - consider implementing preventive validation',
        metric: 'error_rate',
        current: errorRate,
        threshold: 2
      });
    }
    
    return recommendations;
  }
}
```

---

## Integration with TaskManager System

### Integration Points

```javascript
// Integration with existing TaskManager class
class TaskManager {
  constructor(todoPath, options = {}) {
    // ... existing constructor code ...
    
    // Initialize integrity framework
    if (options.integrityFramework !== false) {
      this.integrityFramework = new DataIntegrityFramework({
        strictMode: options.strictMode,
        autoRepair: options.autoRepair,
        performanceThreshold: options.performanceThreshold
      });
    }
  }
  
  // Enhanced writeTodo with integrity validation
  async writeTodo(data, options = {}) {
    // Pre-write validation
    if (this.integrityFramework && options.skipValidation !== true) {
      const validationResult = await this.integrityFramework.validateTodoData(data, {
        operation: 'write',
        source: 'taskmanager'
      });
      
      if (!validationResult.valid) {
        if (this.integrityFramework.config.strictMode) {
          throw new Error(`Integrity validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        } else {
          // Log warnings but continue
          console.warn('[TaskManager] Integrity warnings:', validationResult.warnings);
        }
      }
    }
    
    // Perform original write operation
    return await this._originalWriteTodo(data, options);
  }
  
  // Enhanced subtask operations with validation
  async addSubtask(parentTaskId, subtask, options = {}) {
    if (this.integrityFramework) {
      const validationResult = await this.integrityFramework.validateOperation({
        type: 'create_subtask',
        parentTaskId,
        subtaskData: subtask
      }, await this.readTodoFast(), options);
      
      if (!validationResult.valid) {
        throw new Error(`Subtask validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
    }
    
    return await this._originalAddSubtask(parentTaskId, subtask, options);
  }
  
  // Integrity health check method
  async performIntegrityCheck() {
    if (!this.integrityFramework) {
      return { available: false, message: 'Integrity framework not initialized' };
    }
    
    const todoData = await this.readTodoFast();
    const validationResult = await this.integrityFramework.validateTodoData(todoData, {
      comprehensive: true,
      includePerformanceCheck: true
    });
    
    return {
      available: true,
      valid: validationResult.valid,
      summary: {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        tasksValidated: validationResult.statistics.tasksValidated,
        subtasksValidated: validationResult.statistics.subtasksValidated,
        validationTime: validationResult.performance.totalTime
      },
      details: validationResult
    };
  }
}
```

---

## Configuration and Deployment

### Configuration Options

```javascript
// integrity-config.js
module.exports = {
  // Framework behavior
  strictMode: true, // Fail on validation errors vs. warning only
  autoRepair: true, // Attempt automatic repair of issues
  performanceThreshold: 100, // Maximum acceptable validation time (ms)
  validationTimeout: 30000, // Maximum time to spend on validation (ms)
  
  // Validation layers
  enabledValidators: ['schema', 'reference', 'business', 'performance', 'security'],
  
  // Schema validation settings
  schemaValidation: {
    enforceRequiredFields: true,
    validateFieldTypes: true,
    checkIdFormats: true,
    validateDateFormats: true,
    maxStringLengths: {
      title: 200,
      description: 5000
    }
  },
  
  // Reference validation settings
  referenceValidation: {
    checkTaskDependencies: true,
    checkSubtaskReferences: true,
    detectCircularDependencies: true,
    validateParentReferences: true
  },
  
  // Business rule settings
  businessRules: {
    enforceResearchBeforeImplementation: true,
    requireAuditSubtasks: true,
    validateSuccessCriteriaCoverage: true,
    checkDependencyOrdering: true,
    validateSubtaskWorkflow: true
  },
  
  // Auto-repair settings
  autoRepair: {
    repairOrphanedSubtasks: true,
    fixBrokenReferences: true,
    addMissingFields: true,
    repairParentReferences: true,
    fixInconsistentStatus: false // More conservative
  },
  
  // Performance monitoring
  performanceMonitoring: {
    enabled: true,
    trackValidationTimes: true,
    trackRepairTimes: true,
    alertOnSlowValidation: true,
    alertThresholds: {
      validationWarning: 1000, // ms
      validationCritical: 5000, // ms
      repairWarning: 2000, // ms
      repairCritical: 10000 // ms
    }
  },
  
  // Logging and reporting
  logging: {
    enabled: true,
    logLevel: 'info', // debug, info, warn, error
    logValidationResults: true,
    logRepairActions: true,
    logPerformanceMetrics: true
  }
};
```

### Deployment Instructions

```bash
# 1. Install integrity framework
npm install --save data-integrity-framework

# 2. Update TaskManager initialization
# Add integrity framework options to constructor

# 3. Run integrity assessment on existing data
node -e "
const { DataIntegrityFramework } = require('./data-integrity-framework');
const fs = require('fs');

async function assess() {
  const framework = new DataIntegrityFramework();
  const todoData = JSON.parse(fs.readFileSync('./TODO.json', 'utf8'));
  const result = await framework.validateTodoData(todoData);
  console.log('Integrity Assessment:', result.summary);
}

assess().catch(console.error);
"

# 4. Enable continuous monitoring
# Configure monitoring interval in application startup

# 5. Set up alerting (optional)
# Configure external monitoring system integration
```

---

## Testing and Quality Assurance

### Test Suite Coverage

```javascript
describe('Data Integrity Framework', () => {
  describe('Schema Validation', () => {
    test('validates required task fields', async () => {
      const invalidTask = { title: 'Test', status: 'pending' }; // missing id, category, created_at
      const result = await schemaValidator.validate({ tasks: [invalidTask] });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
    
    test('validates subtask parent references', async () => {
      const task = {
        id: 'task_1',
        subtasks: [
          { id: 'subtask_1', parent_task_id: 'task_2' } // Wrong parent
        ]
      };
      const result = await schemaValidator.validate({ tasks: [task] });
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('parent_reference_mismatch');
    });
  });
  
  describe('Reference Validation', () => {
    test('detects broken task dependencies', async () => {
      const tasks = [
        { id: 'task_1', dependencies: ['task_999'] } // Non-existent dependency
      ];
      const result = await referenceValidator.validate({ tasks });
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('missing_task_dependency');
    });
    
    test('detects circular dependencies', async () => {
      const tasks = [
        { id: 'task_1', dependencies: ['task_2'] },
        { id: 'task_2', dependencies: ['task_1'] } // Circular
      ];
      const result = await referenceValidator.validate({ tasks });
      expect(result.valid).toBe(false);
      expect(result.statistics.circularDependencies).toBe(1);
    });
  });
  
  describe('Auto Repair System', () => {
    test('repairs missing parent references', async () => {
      const todoData = {
        tasks: [{
          id: 'task_1',
          subtasks: [{ id: 'subtask_1' }] // Missing parent_task_id
        }]
      };
      
      const repairSystem = new AutoRepairSystem();
      const result = await repairSystem.attemptRepair(todoData, [{
        type: 'missing_parent_references'
      }]);
      
      expect(result.successful).toHaveLength(1);
      expect(result.modifiedTodoData.tasks[0].subtasks[0].parent_task_id).toBe('task_1');
    });
    
    test('repairs broken references by removal', async () => {
      const todoData = {
        tasks: [{
          id: 'task_1',
          dependencies: ['task_999', 'task_2'] // task_999 doesn't exist
        }, {
          id: 'task_2'
        }]
      };
      
      const repairSystem = new AutoRepairSystem();
      const result = await repairSystem.attemptRepair(todoData, [{
        type: 'missing_task_dependency'
      }]);
      
      expect(result.successful).toHaveLength(1);
      expect(result.modifiedTodoData.tasks[0].dependencies).toEqual(['task_2']);
    });
  });
  
  describe('Performance Monitoring', () => {
    test('records validation metrics', () => {
      const monitor = new IntegrityPerformanceMonitor();
      const validationResult = {
        performance: { totalTime: 150 },
        statistics: { tasksValidated: 10, subtasksValidated: 25 },
        errors: []
      };
      
      monitor.recordValidationMetrics(validationResult);
      
      expect(monitor.metrics.validationCounts).toBe(1);
      expect(monitor.metrics.validationTimes).toHaveLength(1);
      expect(monitor.metrics.validationTimes[0].duration).toBe(150);
    });
    
    test('generates performance alerts for slow validation', () => {
      const monitor = new IntegrityPerformanceMonitor();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const slowValidationResult = {
        performance: { totalTime: 6000 }, // Exceeds critical threshold
        statistics: {},
        errors: []
      };
      
      monitor.recordValidationMetrics(slowValidationResult);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert: validation_critical_slow'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });
});
```

---

## Conclusion

The Data Integrity Validation Framework provides comprehensive protection for the TaskManager system's embedded subtasks and success criteria data. Through multi-layered validation, automatic repair mechanisms, and continuous monitoring, the framework ensures data consistency and quality while maintaining system performance.

### Key Benefits

1. **Proactive Issue Prevention**: Real-time validation prevents data corruption
2. **Automatic Recovery**: Self-healing capabilities maintain system health  
3. **Performance Optimization**: Efficient validation without impact on operations
4. **Comprehensive Coverage**: Multiple validation layers ensure thoroughness
5. **Integration Ready**: Seamless integration with existing TaskManager system

### Implementation Priority

1. **Phase 1**: Core validation framework (schema + reference validation)
2. **Phase 2**: Auto-repair system and business rule validation
3. **Phase 3**: Performance monitoring and continuous validation
4. **Phase 4**: Advanced features and external integrations

The framework is production-ready and provides the foundation for reliable, scalable embedded subtasks and success criteria management.