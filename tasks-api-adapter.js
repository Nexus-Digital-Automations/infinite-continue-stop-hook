/**
 * TASKS.json API Adapter
 *
 * Provides adaptation layer between legacy FEATURES.json API calls
 * and new TASKS.json schema, enabling backward compatibility during migration
 */

class TasksApiAdapter {
  constructor() {
    this.taskIdCounter = Date.now();
  }

  /**
   * Convert TASKS.json data to legacy features format for backward compatibility
   */
  adaptTasksToFeaturesFormat(tasksData) {
    const adapted = {
      project: tasksData.project,
      features: [],
      metadata: {
        version: tasksData.metadata?.version || '2.0.0',
        created: tasksData.metadata?.created || new Date().toISOString(),
        updated: tasksData.metadata?.updated || new Date().toISOString(),
        total_features: 0,
        approval_history: tasksData.metadata?.approval_history || [],
        initialization_stats: tasksData.metadata?.initialization_stats || {},
      },
      workflow_config: tasksData.workflow_config || {},
      tasks: [],
      completed_tasks: tasksData.completed_tasks || [],
      agents: tasksData.agents || {},
    };

    // Convert feature tasks to legacy features format
    if (tasksData.tasks) {
      for (const task of tasksData.tasks) {
        if (task.type === 'feature') {
          const feature = {
            id: task.id,
            title: task.title,
            description: task.description,
            business_value: task.business_value,
            category: task.category,
            status: task.status,
            created_at: task.created_at,
            updated_at: task.updated_at,
            suggested_by: task.created_by,
            metadata: task.metadata || {},
          };

          // Add approval/rejection fields based on status
          if (task.status === 'approved') {
            feature.approved_by = task.metadata?.approved_by || 'system';
            feature.approval_date =
              task.metadata?.approval_date || task.updated_at;
            feature.approval_notes = task.metadata?.approval_notes || '';
          } else if (task.status === 'rejected') {
            feature.rejected_by = task.metadata?.rejected_by || 'system';
            feature.rejection_date =
              task.metadata?.rejection_date || task.updated_at;
            feature.rejection_reason = task.metadata?.rejection_reason || '';
          }

          adapted.features.push(feature);
        } else {
          // Non-feature tasks go to tasks array
          adapted.tasks.push(task);
        }
      }
    }

    adapted.metadata.total_features = adapted.features.length;
    return adapted;
  }

  /**
   * Convert feature data to new task format
   */
  adaptFeatureToTask(featureData, taskType = 'feature') {
    const taskId = `task_${this.taskIdCounter++}_${this.generateHash()}`;

    return {
      id: taskId,
      type: taskType,
      parent_id: null,
      linked_tasks: [],
      title: featureData.title,
      description: featureData.description,
      business_value: featureData.business_value,
      category: featureData.category,
      status: 'suggested',
      priority: this.mapPriorityFromCategory(featureData.category),
      auto_generated: false,
      auto_generation_rules: {
        generate_test_task: taskType === 'feature',
        generate_audit_task: taskType === 'feature',
        test_coverage_requirement: 80,
      },
      dependencies: [],
      estimated_effort: 5,
      required_capabilities: this.inferCapabilitiesFromCategory(
        featureData.category
      ),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user',
      assigned_to: null,
      assigned_at: null,
      completed_at: null,
      validation_requirements: {
        security_scan: true,
        test_coverage: true,
        linter_pass: true,
        type_check: true,
        build_success: true,
      },
      metadata: {},
    };
  }

  /**
   * Generate auto-tasks for a feature task
   */
  generateAutoTasksForFeature(featureTask, tasksData) {
    const autoTasks = [];
    const testTaskId = `task_${this.taskIdCounter++}_${this.generateHash()}`;
    const auditTaskId = `task_${this.taskIdCounter++}_${this.generateHash()}`;

    // Generate test task
    const testTask = {
      id: testTaskId,
      type: 'test',
      parent_id: featureTask.id,
      linked_tasks: [featureTask.id],
      title: `Implement comprehensive tests for ${featureTask.title}`,
      description: `Create unit tests, integration tests, and E2E tests to achieve >80% coverage for ${featureTask.title}. Must validate all functionality, edge cases, and error conditions.`,
      business_value: `Ensures reliability and quality of ${featureTask.title} feature`,
      category: featureTask.category,
      status: 'suggested',
      priority: 'high',
      auto_generated: true,
      auto_generation_rules: {
        generate_test_task: false,
        generate_audit_task: false,
        test_coverage_requirement: 80,
      },
      dependencies: [featureTask.id],
      estimated_effort: Math.ceil(featureTask.estimated_effort * 0.6),
      required_capabilities: ['testing'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'auto_generation_system',
      assigned_to: null,
      assigned_at: null,
      completed_at: null,
      validation_requirements: {
        security_scan: false,
        test_coverage: true,
        linter_pass: true,
        type_check: true,
        build_success: true,
      },
      metadata: {
        auto_generated_for: featureTask.id,
        generation_rule: 'mandatory_test_gate',
      },
    };

    // Generate audit task
    const auditTask = {
      id: auditTaskId,
      type: 'audit',
      parent_id: featureTask.id,
      linked_tasks: [featureTask.id],
      title: `Security and quality audit for ${featureTask.title}`,
      description: `Run semgrep security scan, dependency vulnerability check, code quality analysis, and compliance validation for ${featureTask.title}. Zero tolerance for security vulnerabilities.`,
      business_value: `Ensures security and quality compliance of ${featureTask.title} feature`,
      category: 'security',
      status: 'suggested',
      priority: 'high',
      auto_generated: true,
      auto_generation_rules: {
        generate_test_task: false,
        generate_audit_task: false,
        test_coverage_requirement: 80,
      },
      dependencies: [featureTask.id],
      estimated_effort: Math.ceil(featureTask.estimated_effort * 0.4),
      required_capabilities: ['security', 'analysis'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'auto_generation_system',
      assigned_to: null,
      assigned_at: null,
      completed_at: null,
      validation_requirements: {
        security_scan: true,
        test_coverage: false,
        linter_pass: true,
        type_check: true,
        build_success: true,
      },
      metadata: {
        auto_generated_for: featureTask.id,
        generation_rule: 'mandatory_security_audit',
      },
    };

    autoTasks.push(testTask, auditTask);

    // Update task relationships
    if (!tasksData.task_relationships) {
      tasksData.task_relationships = {};
    }

    tasksData.task_relationships[featureTask.id] = {
      auto_generated_test: testTaskId,
      auto_generated_audit: auditTaskId,
      dependencies: [],
      dependents: [testTaskId, auditTaskId],
    };

    // Update feature task's linked tasks
    featureTask.linked_tasks = [testTaskId, auditTaskId];

    // Update metadata
    if (tasksData.metadata) {
      tasksData.metadata.tasks_by_type = tasksData.metadata.tasks_by_type || {};
      tasksData.metadata.tasks_by_type.test =
        (tasksData.metadata.tasks_by_type.test || 0) + 1;
      tasksData.metadata.tasks_by_type.audit =
        (tasksData.metadata.tasks_by_type.audit || 0) + 1;
      tasksData.metadata.total_tasks =
        (tasksData.metadata.total_tasks || 0) + 2;
      tasksData.metadata.updated = new Date().toISOString();
    }

    return autoTasks;
  }

  /**
   * Sort tasks by priority order (CLAUDE.md compliant)
   */
  sortTasksByPriority(tasks) {
    const priorityOrder = {
      USER_REQUESTS: 0,
      error: 1,
      audit: 2,
      feature: 3,
      test: 4,
    };

    const priorityWeight = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    return tasks.sort((a, b) => {
      // First sort by task type
      const typeA = priorityOrder[a.type] || 999;
      const typeB = priorityOrder[b.type] || 999;

      if (typeA !== typeB) {
        return typeA - typeB;
      }

      // Then sort by priority within same type
      const priorityA = priorityWeight[a.priority] || 999;
      const priorityB = priorityWeight[b.priority] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Finally sort by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  // Helper methods
  generateHash() {
    return Math.random().toString(36).substring(2, 10);
  }

  mapPriorityFromCategory(category) {
    const priorityMap = {
      security: 'high',
      'bug-fix': 'high',
      performance: 'normal',
      enhancement: 'normal',
      'new-feature': 'normal',
      documentation: 'low',
    };
    return priorityMap[category] || 'normal';
  }

  inferCapabilitiesFromCategory(category) {
    const capabilityMap = {
      security: ['security', 'backend'],
      'bug-fix': ['general'],
      performance: ['performance', 'analysis'],
      enhancement: ['general'],
      'new-feature': ['frontend', 'backend'],
      documentation: ['documentation'],
    };
    return capabilityMap[category] || ['general'];
  }
}

module.exports = TasksApiAdapter;
