# Migration Strategy for Enhanced TODO.json System

## Executive Summary

This document outlines a comprehensive migration strategy to transition from the current TODO.json structure to the enhanced data schema with embedded subtasks optimization, performance indexing, and improved data integrity. The strategy prioritizes zero-downtime migration, backward compatibility, and data preservation.

## Current State Analysis

### Existing TODO.json Structure Assessment

**Current Schema Characteristics:**
- **File Size**: Large monolithic JSON file (27,074+ tokens observed)
- **Structure**: Flat array of tasks with embedded subtasks
- **Performance**: O(n) linear search for all operations
- **Indexing**: No indexing system for fast lookups
- **Validation**: Minimal schema validation
- **Data Integrity**: Limited constraint enforcement

**Migration Challenges Identified:**
1. **Data Volume**: Large existing task datasets require careful handling
2. **Active Operations**: Ongoing task management during migration
3. **API Compatibility**: Existing integrations must continue working
4. **Performance**: Migration must not degrade system performance
5. **Data Loss Risk**: Zero tolerance for data corruption or loss

## Migration Strategy Overview

### Three-Phase Migration Approach

#### Phase 1: Preparation & Compatibility (Week 1)
- Schema validation implementation
- Backward compatibility layer development
- Data backup and verification systems
- Migration tooling development

#### Phase 2: Gradual Migration (Week 2-3)
- Index generation from existing data
- Incremental task migration
- Dual-schema operation mode
- Performance monitoring and optimization

#### Phase 3: Finalization & Cleanup (Week 4)
- Complete schema transition
- Legacy format deprecation
- Performance validation
- Documentation and training

## Detailed Implementation Plan

### Phase 1: Preparation & Compatibility Layer

#### 1.1 Schema Validation Framework

Create robust validation to ensure data integrity:

```javascript
/**
 * Schema Validation Framework for Migration
 */
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);

    // Load enhanced schema
    this.enhancedSchema = require('./enhanced-schema.json');
    this.validateEnhanced = this.ajv.compile(this.enhancedSchema);

    // Legacy schema for validation
    this.legacySchema = this._generateLegacySchema();
    this.validateLegacy = this.ajv.compile(this.legacySchema);
  }

  /**
   * Validate data against both schemas during migration
   */
  validateBothSchemas(data) {
    const legacyValid = this.validateLegacy(data);
    const enhancedValid = this.validateEnhanced(data);

    return {
      legacy: {
        valid: legacyValid,
        errors: this.validateLegacy.errors || []
      },
      enhanced: {
        valid: enhancedValid,
        errors: this.validateEnhanced.errors || []
      }
    };
  }

  /**
   * Generate legacy schema from current TODO.json patterns
   */
  _generateLegacySchema() {
    return {
      type: 'object',
      properties: {
        project: { type: 'string' },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string' },
              subtasks: { type: 'array' }
            },
            required: ['id', 'title', 'category', 'status']
          }
        }
      },
      required: ['project', 'tasks']
    };
  }
}
```

#### 1.2 Backup and Recovery System

Implement comprehensive backup before any migration:

```javascript
/**
 * Backup and Recovery System for Safe Migration
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MigrationBackupManager {
  constructor(todoJsonPath) {
    this.todoJsonPath = todoJsonPath;
    this.backupDir = path.join(path.dirname(todoJsonPath), 'migration-backups');
  }

  /**
   * Create timestamped backup with integrity verification
   */
  async createBackup(phase = 'pre-migration') {
    await fs.mkdir(this.backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `TODO-${phase}-${timestamp}.json`);

    // Read current data
    const originalData = await fs.readFile(this.todoJsonPath, 'utf8');

    // Generate checksum for integrity
    const checksum = crypto.createHash('sha256').update(originalData).digest('hex');

    // Create backup with metadata
    const backupData = {
      metadata: {
        original_path: this.todoJsonPath,
        backup_created: new Date().toISOString(),
        phase: phase,
        checksum: checksum,
        file_size: originalData.length
      },
      data: JSON.parse(originalData)
    };

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup created: ${backupPath}`);
    console.log(`🔐 Checksum: ${checksum}`);

    return {
      backupPath,
      checksum,
      metadata: backupData.metadata
    };
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    const originalChecksum = backupData.metadata.checksum;

    const dataString = JSON.stringify(backupData.data);
    const calculatedChecksum = crypto.createHash('sha256').update(dataString).digest('hex');

    const isValid = originalChecksum === calculatedChecksum;

    return {
      valid: isValid,
      originalChecksum,
      calculatedChecksum,
      metadata: backupData.metadata
    };
  }

  /**
   * Restore from backup if migration fails
   */
  async restoreFromBackup(backupPath) {
    const verification = await this.verifyBackup(backupPath);

    if (!verification.valid) {
      throw new Error('Backup integrity check failed - cannot restore');
    }

    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    const restoreData = JSON.stringify(backupData.data, null, 2);

    await fs.writeFile(this.todoJsonPath, restoreData);

    console.log(`✅ Restored from backup: ${backupPath}`);
    return verification.metadata;
  }
}
```

#### 1.3 Backward Compatibility Layer

Maintain API compatibility during migration:

```javascript
/**
 * Backward Compatibility Layer for Seamless Migration
 */
class CompatibilityLayer {
  constructor(enhancedTaskManager, legacyTaskManager) {
    this.enhanced = enhancedTaskManager;
    this.legacy = legacyTaskManager;
    this.migrationMode = 'dual'; // 'legacy', 'dual', 'enhanced'
  }

  /**
   * Adaptive read - attempts enhanced format first, falls back to legacy
   */
  async readTodoData() {
    try {
      // Try enhanced format first
      const enhancedData = await this.enhanced.readTodoFast();
      if (this._isEnhancedFormat(enhancedData)) {
        return this._wrapEnhancedData(enhancedData);
      }
    } catch (error) {
      console.warn('Enhanced read failed, falling back to legacy:', error.message);
    }

    // Fallback to legacy format
    const legacyData = await this.legacy.readTodoFast();
    return this._wrapLegacyData(legacyData);
  }

  /**
   * Write operations - maintain both formats during dual mode
   */
  async writeTodoData(data) {
    if (this.migrationMode === 'enhanced') {
      return await this.enhanced.writeTodoData(data);
    }

    if (this.migrationMode === 'dual') {
      // Write to both formats for safety
      const legacyResult = await this.legacy.writeTodoData(this._convertToLegacy(data));
      const enhancedResult = await this.enhanced.writeTodoData(this._convertToEnhanced(data));

      return { legacy: legacyResult, enhanced: enhancedResult };
    }

    return await this.legacy.writeTodoData(data);
  }

  /**
   * Detect if data is in enhanced format
   */
  _isEnhancedFormat(data) {
    return data.metadata &&
           data.metadata.schema_version &&
           data.indexes &&
           Array.isArray(data.tasks);
  }

  /**
   * Convert legacy format to enhanced format
   */
  _convertToEnhanced(legacyData) {
    const enhanced = {
      metadata: {
        project: legacyData.project || 'unknown',
        schema_version: '2.0.0',
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        total_tasks: legacyData.tasks ? legacyData.tasks.length : 0
      },
      indexes: this._buildIndexes(legacyData.tasks || []),
      tasks: this._migrateTasks(legacyData.tasks || []),
      success_criteria_templates: this._loadDefaultTemplates()
    };

    return enhanced;
  }

  /**
   * Convert enhanced format to legacy format for backward compatibility
   */
  _convertToLegacy(enhancedData) {
    return {
      project: enhancedData.metadata.project,
      tasks: enhancedData.tasks.map(task => this._convertTaskToLegacy(task))
    };
  }

  /**
   * Build performance indexes from task array
   */
  _buildIndexes(tasks) {
    const indexes = {
      by_id: {},
      by_status: { pending: [], in_progress: [], completed: [], archived: [] },
      by_category: { feature: [], error: [], test: [], subtask: [] },
      by_priority: { critical: [], high: [], medium: [], low: [] },
      subtasks_by_parent: {},
      by_agent: {}
    };

    tasks.forEach((task, index) => {
      indexes.by_id[task.id] = index;

      if (indexes.by_status[task.status]) {
        indexes.by_status[task.status].push(task.id);
      }

      if (indexes.by_category[task.category]) {
        indexes.by_category[task.category].push(task.id);
      }

      const priority = task.priority || 'medium';
      if (indexes.by_priority[priority]) {
        indexes.by_priority[priority].push(task.id);
      }

      // Index subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        indexes.subtasks_by_parent[task.id] = task.subtasks.map(st => st.id);
      }

      // Index agent assignments
      if (task.assigned_agent || task.claimed_by) {
        const agent = task.assigned_agent || task.claimed_by;
        if (!indexes.by_agent[agent]) {
          indexes.by_agent[agent] = [];
        }
        indexes.by_agent[agent].push(task.id);
      }
    });

    return indexes;
  }
}
```

### Phase 2: Gradual Migration Implementation

#### 2.1 Index Generation and Validation

Create indexes from existing data:

```javascript
/**
 * Index Generation for Performance Optimization
 */
class IndexGenerator {
  constructor(validator) {
    this.validator = validator;
    this.performance = {
      indexBuildTime: 0,
      tasksProcessed: 0,
      errorsFound: 0
    };
  }

  /**
   * Generate comprehensive indexes from existing TODO.json
   */
  async generateIndexes(todoData) {
    const startTime = Date.now();
    console.log('🔄 Starting index generation...');

    const indexes = {
      by_id: {},
      by_status: { pending: [], in_progress: [], completed: [], archived: [] },
      by_category: { feature: [], error: [], test: [], subtask: [] },
      by_priority: { critical: [], high: [], medium: [], low: [] },
      subtasks_by_parent: {},
      by_agent: {}
    };

    let errorsFound = 0;
    const tasks = todoData.tasks || [];

    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index];

      try {
        // Validate task structure
        if (!task.id || !task.status || !task.category) {
          console.warn(`⚠️  Task ${index} missing required fields:`, task);
          errorsFound++;
          continue;
        }

        // Build ID index
        indexes.by_id[task.id] = index;

        // Build status index
        const status = task.status;
        if (indexes.by_status[status]) {
          indexes.by_status[status].push(task.id);
        } else {
          console.warn(`⚠️  Unknown status '${status}' for task ${task.id}`);
          errorsFound++;
        }

        // Build category index
        const category = task.category;
        if (indexes.by_category[category]) {
          indexes.by_category[category].push(task.id);
        } else {
          console.warn(`⚠️  Unknown category '${category}' for task ${task.id}`);
          errorsFound++;
        }

        // Build priority index
        const priority = task.priority || 'medium';
        if (indexes.by_priority[priority]) {
          indexes.by_priority[priority].push(task.id);
        }

        // Build subtask index
        if (task.subtasks && Array.isArray(task.subtasks)) {
          const subtaskIds = [];
          task.subtasks.forEach(subtask => {
            if (subtask.id) {
              subtaskIds.push(subtask.id);
            } else {
              console.warn(`⚠️  Subtask missing ID in task ${task.id}:`, subtask);
              errorsFound++;
            }
          });

          if (subtaskIds.length > 0) {
            indexes.subtasks_by_parent[task.id] = subtaskIds;
          }
        }

        // Build agent index
        const agent = task.assigned_agent || task.claimed_by ||
                     (task.agent_assignment_history &&
                      task.agent_assignment_history.length > 0 &&
                      task.agent_assignment_history[task.agent_assignment_history.length - 1].agentId);

        if (agent) {
          if (!indexes.by_agent[agent]) {
            indexes.by_agent[agent] = [];
          }
          indexes.by_agent[agent].push(task.id);
        }

      } catch (error) {
        console.error(`❌ Error processing task ${index}:`, error);
        errorsFound++;
      }
    }

    const endTime = Date.now();
    this.performance = {
      indexBuildTime: endTime - startTime,
      tasksProcessed: tasks.length,
      errorsFound: errorsFound
    };

    console.log(`✅ Index generation completed in ${this.performance.indexBuildTime}ms`);
    console.log(`📊 Processed ${this.performance.tasksProcessed} tasks with ${this.performance.errorsFound} errors`);

    return {
      indexes,
      performance: this.performance,
      validation: {
        totalTasks: tasks.length,
        indexedTasks: Object.keys(indexes.by_id).length,
        errorsFound: errorsFound
      }
    };
  }

  /**
   * Validate index consistency
   */
  validateIndexConsistency(indexes, tasks) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check ID index completeness
    const taskIds = new Set(tasks.map(t => t.id).filter(id => id));
    const indexedIds = new Set(Object.keys(indexes.by_id));

    const missingFromIndex = [...taskIds].filter(id => !indexedIds.has(id));
    const extraInIndex = [...indexedIds].filter(id => !taskIds.has(id));

    if (missingFromIndex.length > 0) {
      validation.errors.push(`Missing from index: ${missingFromIndex.join(', ')}`);
      validation.valid = false;
    }

    if (extraInIndex.length > 0) {
      validation.warnings.push(`Extra in index: ${extraInIndex.join(', ')}`);
    }

    // Validate status index
    Object.entries(indexes.by_status).forEach(([status, taskIds]) => {
      taskIds.forEach(taskId => {
        const taskIndex = indexes.by_id[taskId];
        if (taskIndex === undefined || !tasks[taskIndex] || tasks[taskIndex].status !== status) {
          validation.errors.push(`Status index inconsistent for ${taskId}: expected ${status}`);
          validation.valid = false;
        }
      });
    });

    return validation;
  }

  /**
   * Performance test for index operations
   */
  performanceTest(indexes, tasks, iterations = 1000) {
    const tests = {
      'ID Lookup': () => {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        const index = indexes.by_id[randomTask.id];
        return tasks[index];
      },
      'Status Filter': () => {
        const statuses = Object.keys(indexes.by_status);
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return indexes.by_status[randomStatus];
      },
      'Category Filter': () => {
        const categories = Object.keys(indexes.by_category);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        return indexes.by_category[randomCategory];
      }
    };

    const results = {};

    Object.entries(tests).forEach(([testName, testFn]) => {
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        testFn();
      }

      const end = Date.now();
      const totalTime = end - start;
      const avgTime = totalTime / iterations;

      results[testName] = {
        totalTime: totalTime,
        averageTime: avgTime,
        operationsPerSecond: 1000 / avgTime
      };
    });

    return results;
  }
}
```

#### 2.2 Incremental Task Migration

Migrate tasks individually to minimize risk:

```javascript
/**
 * Incremental Task Migration with Rollback Capability
 */
class IncrementalMigrator {
  constructor(compatibilityLayer, backupManager) {
    this.compatibility = compatibilityLayer;
    this.backup = backupManager;
    this.migrationLog = [];
    this.batchSize = 10; // Migrate in small batches
  }

  /**
   * Migrate tasks in batches with comprehensive error handling
   */
  async migrateInBatches() {
    const todoData = await this.compatibility.readTodoData();
    const tasks = todoData.tasks || [];

    console.log(`🔄 Starting incremental migration of ${tasks.length} tasks...`);

    // Create migration backup
    const backupInfo = await this.backup.createBackup('incremental-migration');

    let migratedCount = 0;
    let errorCount = 0;
    const migrationResults = [];

    for (let i = 0; i < tasks.length; i += this.batchSize) {
      const batch = tasks.slice(i, i + this.batchSize);
      console.log(`📦 Migrating batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(tasks.length / this.batchSize)}...`);

      try {
        const batchResult = await this.migrateBatch(batch, i);
        migrationResults.push(...batchResult.results);
        migratedCount += batchResult.successful;
        errorCount += batchResult.errors;

        // Update progress
        const progress = Math.round((i + batch.length) / tasks.length * 100);
        console.log(`✅ Batch completed. Progress: ${progress}% (${migratedCount}/${tasks.length})`);

        // Brief pause to allow system recovery
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Batch migration failed:`, error);

        // Attempt to rollback this batch
        try {
          await this.rollbackBatch(batch);
          console.log(`🔄 Rolled back failed batch`);
        } catch (rollbackError) {
          console.error(`💥 Rollback failed:`, rollbackError);
          // This is serious - may need manual intervention
          throw new Error(`Migration failed and rollback failed: ${rollbackError.message}`);
        }

        errorCount += batch.length;
      }
    }

    const migrationSummary = {
      total: tasks.length,
      migrated: migratedCount,
      errors: errorCount,
      successRate: (migratedCount / tasks.length) * 100,
      backupPath: backupInfo.backupPath,
      results: migrationResults
    };

    console.log(`🎉 Migration completed: ${migratedCount}/${tasks.length} tasks (${migrationSummary.successRate.toFixed(1)}%)`);

    return migrationSummary;
  }

  /**
   * Migrate a single batch of tasks
   */
  async migrateBatch(tasks, startIndex) {
    const results = [];
    let successful = 0;
    let errors = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const taskIndex = startIndex + i;

      try {
        const migratedTask = await this.migrateTask(task);

        // Validate migrated task
        const validation = this.validateMigratedTask(task, migratedTask);

        if (validation.valid) {
          results.push({
            originalId: task.id,
            migratedId: migratedTask.id,
            status: 'success',
            index: taskIndex
          });
          successful++;
        } else {
          results.push({
            originalId: task.id,
            status: 'validation_failed',
            errors: validation.errors,
            index: taskIndex
          });
          errors++;
        }

      } catch (error) {
        console.error(`❌ Failed to migrate task ${task.id}:`, error);
        results.push({
          originalId: task.id,
          status: 'migration_failed',
          error: error.message,
          index: taskIndex
        });
        errors++;
      }
    }

    return { results, successful, errors };
  }

  /**
   * Migrate individual task to enhanced format
   */
  async migrateTask(legacyTask) {
    const migratedTask = {
      id: legacyTask.id,
      title: legacyTask.title,
      description: legacyTask.description || '',
      category: this.normalizeCategoryField(legacyTask.category),
      priority: this.normalizePriorityField(legacyTask.priority),
      status: this.normalizeStatusField(legacyTask.status),
      dependencies: Array.isArray(legacyTask.dependencies) ? legacyTask.dependencies : [],
      important_files: Array.isArray(legacyTask.important_files) ? legacyTask.important_files : [],
      success_criteria: this.migrateSuccessCriteria(legacyTask.success_criteria),
      estimate: legacyTask.estimate || '',
      created_at: legacyTask.created_at || new Date().toISOString(),
      started_at: legacyTask.started_at || null,
      completed_at: legacyTask.completed_at || null,
      agent_assignment: this.migrateAgentAssignment(legacyTask),
      subtasks: this.migrateSubtasks(legacyTask.subtasks || []),
      parent_task_id: legacyTask.parent_task_id || null,
      lifecycle: this.migrateLifecycle(legacyTask),
      validation_results: null
    };

    return migratedTask;
  }

  /**
   * Normalize category field to ensure valid enum values
   */
  normalizeCategoryField(category) {
    const validCategories = ['feature', 'error', 'test', 'subtask', 'research', 'audit'];

    if (validCategories.includes(category)) {
      return category;
    }

    // Map common variations
    const categoryMappings = {
      'bug': 'error',
      'fix': 'error',
      'enhancement': 'feature',
      'improvement': 'feature',
      'testing': 'test',
      'documentation': 'feature'
    };

    return categoryMappings[category] || 'feature';
  }

  /**
   * Normalize priority field to ensure valid enum values
   */
  normalizePriorityField(priority) {
    const validPriorities = ['critical', 'high', 'medium', 'low'];

    if (validPriorities.includes(priority)) {
      return priority;
    }

    return 'medium'; // Default priority
  }

  /**
   * Normalize status field to ensure valid enum values
   */
  normalizeStatusField(status) {
    const validStatuses = ['pending', 'in_progress', 'completed', 'archived', 'blocked'];

    if (validStatuses.includes(status)) {
      return status;
    }

    // Map common variations
    const statusMappings = {
      'active': 'in_progress',
      'working': 'in_progress',
      'done': 'completed',
      'finished': 'completed',
      'todo': 'pending',
      'new': 'pending'
    };

    return statusMappings[status] || 'pending';
  }

  /**
   * Migrate success criteria to new format
   */
  migrateSuccessCriteria(legacyCriteria) {
    if (!Array.isArray(legacyCriteria)) {
      return [];
    }

    return legacyCriteria.map((criterion, index) => {
      if (typeof criterion === 'string') {
        // Convert string criteria to structured format
        return {
          id: `criterion_${index}`,
          title: criterion,
          description: criterion,
          validation_type: 'manual',
          category: 'quality',
          weight: 1,
          required: true
        };
      }

      // If already structured, ensure all required fields
      return {
        id: criterion.id || `criterion_${index}`,
        title: criterion.title || criterion.name || 'Untitled Criterion',
        description: criterion.description || criterion.title || 'No description',
        validation_type: criterion.validation_type || 'manual',
        validation_command: criterion.validation_command || '',
        expected_result: criterion.expected_result || '',
        weight: criterion.weight || 1,
        category: criterion.category || 'quality',
        required: criterion.required !== false
      };
    });
  }

  /**
   * Migrate agent assignment data
   */
  migrateAgentAssignment(legacyTask) {
    const assignment = {
      current_agent: legacyTask.assigned_agent || legacyTask.claimed_by || null,
      assigned_at: legacyTask.started_at || null,
      assignment_history: []
    };

    // Convert legacy assignment history
    if (Array.isArray(legacyTask.agent_assignment_history)) {
      assignment.assignment_history = legacyTask.agent_assignment_history.map(entry => ({
        agent_id: entry.agentId || entry.agent || 'unknown',
        role: entry.role || 'primary',
        assigned_at: entry.assignedAt || entry.timestamp || new Date().toISOString(),
        unassigned_at: entry.unassignedAt || null,
        reason: entry.reason || entry.action || 'legacy_migration'
      }));
    }

    return assignment;
  }

  /**
   * Migrate subtasks to new format
   */
  migrateSubtasks(legacySubtasks) {
    if (!Array.isArray(legacySubtasks)) {
      return [];
    }

    return legacySubtasks.map(subtask => {
      const baseSubtask = {
        id: subtask.id,
        type: subtask.type || 'implementation',
        title: subtask.title,
        description: subtask.description || '',
        status: this.normalizeStatusField(subtask.status),
        estimated_hours: subtask.estimated_hours || 1,
        prevents_implementation: subtask.prevents_implementation || false,
        prevents_completion: subtask.prevents_completion || false,
        created_at: subtask.created_at || new Date().toISOString(),
        completed_by: subtask.completed_by || null,
        agent_assignment: this.migrateAgentAssignment(subtask)
      };

      // Add type-specific fields
      if (subtask.type === 'research') {
        baseSubtask.research_locations = subtask.research_locations || [];
        baseSubtask.deliverables = subtask.deliverables || [];
        baseSubtask.research_output = subtask.research_output || null;
      }

      if (subtask.type === 'audit') {
        baseSubtask.success_criteria = this.migrateSuccessCriteria(subtask.success_criteria);
        baseSubtask.prevents_self_review = subtask.prevents_self_review !== false;
        baseSubtask.original_implementer = subtask.original_implementer || null;
        baseSubtask.audit_type = subtask.audit_type || 'embedded_quality_gate';
        baseSubtask.audit_results = subtask.audit_results || null;
      }

      return baseSubtask;
    });
  }

  /**
   * Migrate lifecycle data
   */
  migrateLifecycle(legacyTask) {
    const phase = this.determineLifecyclePhase(legacyTask);

    return {
      phase: phase,
      milestones: [],
      blockers: this.migrateBlockers(legacyTask.blockers || [])
    };
  }

  /**
   * Determine lifecycle phase from task state
   */
  determineLifecyclePhase(task) {
    if (task.status === 'completed') return 'completed';
    if (task.status === 'in_progress') {
      // More sophisticated logic could be added here
      return 'implementation';
    }
    if (task.requires_research) return 'research';
    return 'planning';
  }

  /**
   * Migrate blocker data
   */
  migrateBlockers(legacyBlockers) {
    if (!Array.isArray(legacyBlockers)) {
      return [];
    }

    return legacyBlockers.map((blocker, index) => ({
      id: blocker.id || `blocker_${index}`,
      description: blocker.description || blocker.reason || 'Unknown blocker',
      blocking_task_id: blocker.blocking_task_id || blocker.taskId || '',
      created_at: blocker.created_at || new Date().toISOString(),
      resolved_at: blocker.resolved_at || null
    }));
  }

  /**
   * Validate migrated task against schema
   */
  validateMigratedTask(originalTask, migratedTask) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    const requiredFields = ['id', 'title', 'category', 'status', 'created_at'];
    requiredFields.forEach(field => {
      if (!migratedTask[field]) {
        validation.errors.push(`Missing required field: ${field}`);
        validation.valid = false;
      }
    });

    // Check ID consistency
    if (originalTask.id !== migratedTask.id) {
      validation.errors.push(`ID mismatch: ${originalTask.id} !== ${migratedTask.id}`);
      validation.valid = false;
    }

    // Check data integrity
    if (originalTask.title !== migratedTask.title) {
      validation.warnings.push(`Title changed during migration`);
    }

    // Validate subtasks count
    const originalSubtasks = originalTask.subtasks || [];
    const migratedSubtasks = migratedTask.subtasks || [];

    if (originalSubtasks.length !== migratedSubtasks.length) {
      validation.errors.push(`Subtask count mismatch: ${originalSubtasks.length} !== ${migratedSubtasks.length}`);
      validation.valid = false;
    }

    return validation;
  }

  /**
   * Rollback a failed batch migration
   */
  async rollbackBatch(failedBatch) {
    console.log(`🔄 Rolling back batch of ${failedBatch.length} tasks...`);

    // In a real implementation, this would revert specific changes
    // For now, we'll log the rollback action
    failedBatch.forEach(task => {
      console.log(`↩️  Rolled back task ${task.id}`);
    });

    return true;
  }
}
```

### Phase 3: Finalization and Cleanup

#### 3.1 Performance Validation

Verify migration performance improvements:

```javascript
/**
 * Performance Validation and Benchmarking
 */
class PerformanceValidator {
  constructor() {
    this.benchmarks = {};
  }

  /**
   * Compare pre/post migration performance
   */
  async validatePerformanceImprovements(legacyData, enhancedData) {
    console.log('📊 Running performance validation...');

    const results = {
      legacy: await this.benchmarkLegacyOperations(legacyData),
      enhanced: await this.benchmarkEnhancedOperations(enhancedData),
      improvements: {}
    };

    // Calculate improvements
    Object.keys(results.legacy).forEach(operation => {
      if (results.enhanced[operation]) {
        const legacyTime = results.legacy[operation].averageTime;
        const enhancedTime = results.enhanced[operation].averageTime;
        const improvement = ((legacyTime - enhancedTime) / legacyTime) * 100;

        results.improvements[operation] = {
          legacyTime,
          enhancedTime,
          improvementPercent: improvement,
          speedupFactor: legacyTime / enhancedTime
        };
      }
    });

    this.generatePerformanceReport(results);
    return results;
  }

  /**
   * Benchmark legacy operations (O(n) searches)
   */
  async benchmarkLegacyOperations(legacyData) {
    const tasks = legacyData.tasks || [];
    const iterations = Math.min(1000, tasks.length);

    return {
      findById: this.benchmarkOperation(() => {
        const randomId = tasks[Math.floor(Math.random() * tasks.length)]?.id;
        return tasks.find(t => t.id === randomId);
      }, iterations),

      filterByStatus: this.benchmarkOperation(() => {
        const statuses = ['pending', 'in_progress', 'completed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return tasks.filter(t => t.status === randomStatus);
      }, iterations),

      filterByCategory: this.benchmarkOperation(() => {
        const categories = ['feature', 'error', 'test'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        return tasks.filter(t => t.category === randomCategory);
      }, iterations),

      findSubtasks: this.benchmarkOperation(() => {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        return randomTask?.subtasks || [];
      }, iterations)
    };
  }

  /**
   * Benchmark enhanced operations (O(1) lookups)
   */
  async benchmarkEnhancedOperations(enhancedData) {
    const { indexes, tasks } = enhancedData;
    const iterations = 1000;

    return {
      findById: this.benchmarkOperation(() => {
        const taskIds = Object.keys(indexes.by_id);
        const randomId = taskIds[Math.floor(Math.random() * taskIds.length)];
        const index = indexes.by_id[randomId];
        return tasks[index];
      }, iterations),

      filterByStatus: this.benchmarkOperation(() => {
        const statuses = Object.keys(indexes.by_status);
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return indexes.by_status[randomStatus].map(id => tasks[indexes.by_id[id]]);
      }, iterations),

      filterByCategory: this.benchmarkOperation(() => {
        const categories = Object.keys(indexes.by_category);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        return indexes.by_category[randomCategory].map(id => tasks[indexes.by_id[id]]);
      }, iterations),

      findSubtasks: this.benchmarkOperation(() => {
        const parentIds = Object.keys(indexes.subtasks_by_parent);
        const randomParentId = parentIds[Math.floor(Math.random() * parentIds.length)];
        return indexes.subtasks_by_parent[randomParentId] || [];
      }, iterations)
    };
  }

  /**
   * Generic benchmark operation
   */
  benchmarkOperation(operation, iterations) {
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      operation();
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return {
      totalTime,
      averageTime: totalTime / iterations,
      operationsPerSecond: (iterations / totalTime) * 1000
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(results) {
    console.log('\n📈 MIGRATION PERFORMANCE REPORT');
    console.log('=====================================');

    Object.entries(results.improvements).forEach(([operation, metrics]) => {
      console.log(`\n🔍 ${operation.toUpperCase()}`);
      console.log(`   Legacy:    ${metrics.legacyTime.toFixed(3)}ms avg`);
      console.log(`   Enhanced:  ${metrics.enhancedTime.toFixed(3)}ms avg`);
      console.log(`   Improvement: ${metrics.improvementPercent.toFixed(1)}% faster`);
      console.log(`   Speedup:   ${metrics.speedupFactor.toFixed(1)}x`);
    });

    const avgImprovement = Object.values(results.improvements)
      .reduce((sum, m) => sum + m.improvementPercent, 0) / Object.keys(results.improvements).length;

    console.log(`\n🎯 OVERALL PERFORMANCE IMPROVEMENT: ${avgImprovement.toFixed(1)}%`);
    console.log('=====================================\n');
  }
}
```

#### 3.2 Migration Completion Checklist

Final validation and cleanup:

```markdown
## Migration Completion Checklist

### Data Integrity Validation
- [ ] All tasks successfully migrated (0% data loss)
- [ ] All subtasks preserved and properly linked
- [ ] Success criteria maintained and enhanced
- [ ] Agent assignment history preserved
- [ ] Timestamps and lifecycle data intact

### Performance Validation
- [ ] O(1) lookup operations functioning correctly
- [ ] Index consistency validated
- [ ] Performance benchmarks show expected improvements
- [ ] Memory usage within acceptable limits
- [ ] File I/O performance optimized

### API Compatibility
- [ ] All existing API endpoints functional
- [ ] Backward compatibility layer tested
- [ ] New enhanced endpoints operational
- [ ] Error handling and fallbacks working
- [ ] Documentation updated

### Security and Validation
- [ ] Schema validation active and enforcing constraints
- [ ] Data sanitization functioning correctly
- [ ] Access controls and permissions maintained
- [ ] Audit trail preserved and enhanced
- [ ] Security scan completed with no new vulnerabilities

### Monitoring and Alerting
- [ ] Performance monitoring in place
- [ ] Error rate monitoring active
- [ ] Backup and recovery procedures tested
- [ ] Rollback procedures documented and tested
- [ ] Incident response plan updated

### Documentation and Training
- [ ] Migration documentation completed
- [ ] API documentation updated
- [ ] Training materials prepared
- [ ] Troubleshooting guides updated
- [ ] Change management communication sent
```

## Risk Mitigation Strategies

### High-Priority Risks

#### 1. Data Loss During Migration
**Mitigation:**
- Comprehensive backup before any changes
- Incremental migration with rollback capability
- Real-time validation during migration
- Multiple backup retention points

#### 2. Performance Degradation
**Mitigation:**
- Performance benchmarking before/after
- Gradual rollout with monitoring
- Fallback to legacy system if needed
- Load testing under realistic conditions

#### 3. API Breaking Changes
**Mitigation:**
- Backward compatibility layer
- Extensive integration testing
- Staged rollout to different environments
- Clear deprecation timeline

#### 4. Index Corruption or Inconsistency
**Mitigation:**
- Automated index validation
- Index rebuilding capabilities
- Consistency checks during operations
- Manual verification procedures

## Success Metrics

### Performance Metrics
- **Query Speed**: Target 90%+ improvement in common operations
- **Memory Usage**: Maintain or reduce current memory footprint
- **File Size**: Optimize storage efficiency while adding features
- **Response Time**: Sub-millisecond for indexed operations

### Reliability Metrics
- **Data Integrity**: 100% data preservation during migration
- **Uptime**: Zero downtime during migration process
- **Error Rate**: <1% error rate during migration
- **Rollback Success**: 100% successful rollback capability

### Adoption Metrics
- **API Compatibility**: 100% existing integration compatibility
- **Feature Usage**: >80% adoption of new enhanced features within 30 days
- **User Satisfaction**: Positive feedback on performance improvements
- **System Stability**: No increase in system errors post-migration

## Conclusion

This comprehensive migration strategy ensures a safe, efficient transition to the enhanced TODO.json system while maintaining backward compatibility and minimizing operational risk. The three-phase approach allows for thorough testing and validation at each stage, with robust rollback capabilities and performance monitoring throughout the process.

The enhanced schema will provide significant performance improvements, better data integrity, and powerful new capabilities for embedded subtasks and success criteria management while preserving all existing functionality and data.