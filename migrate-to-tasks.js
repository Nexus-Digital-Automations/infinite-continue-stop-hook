
/**
 * FEATURES.json to TASKS.json Migration Script
 *
 * Safely migrates existing FEATURES.json to new TASKS.json schema
 * with enhanced task types, auto-generation, and CLAUDE.md compliance
 */

const fs = require('fs').promises;
const path = require('path');

class TaskMigrator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.featuresPath = path.join(projectRoot, 'FEATURES.json');
    this.tasksPath = path.join(projectRoot, 'TASKS.json');
    this.backupPath = path.join(projectRoot, `FEATURES.json.backup.${Date.now()}`);
  }

  /**
   * Execute the complete migration process
   */
  async migrate() {
    try {
      console.log('🚀 Starting FEATURES.json → TASKS.json migration...');

      // Step 1: Validate source file exists
      await this.validateSourceFile();

      // Step 2: Create backup
      await this.createBackup();

      // Step 3: Load and parse existing data
      const featuresData = await this.loadFeaturesData();

      // Step 4: Transform to new schema
      const tasksData = await this.transformToTasksSchema(featuresData);

      // Step 5: Validate transformed data
      await this.validateTransformedData(tasksData);

      // Step 6: Write new TASKS.json
      await this.writeTasksFile(tasksData);

      // Step 7: Generate auto-tasks for existing approved features
      await this.generateAutoTasks(tasksData);

      console.log('✅ Migration completed successfully!');
      console.log(`📁 Backup created: ${this.backupPath}`);
      console.log(`📁 New file created: ${this.tasksPath}`);

      return {
        success: true,
        backup: this.backupPath,
        newFile: this.tasksPath,
        stats: await this.getMigrationStats(tasksData),
      };

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate that FEATURES.json exists and is readable
   */
  async validateSourceFile() {
    try {
      await fs.access(this.featuresPath);
      console.log('✓ Source FEATURES.json found');
    } catch {
      throw new Error(`FEATURES.json not found at ${this.featuresPath}`);
    }
  }

  /**
   * Create backup of existing FEATURES.json
   */
  async createBackup() {
    try {
      await fs.copyFile(this.featuresPath, this.backupPath);
      console.log(`✓ Backup created: ${this.backupPath}`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Load and parse existing FEATURES.json data
   */
  async loadFeaturesData() {
    try {
      const data = await fs.readFile(this.featuresPath, 'utf8');
      const parsedData = JSON.parse(data);
      console.log('✓ Features data loaded and parsed');
      return parsedData;
    } catch (error) {
      throw new Error(`Failed to load features data: ${error.message}`);
    }
  }

  /**
   * Transform FEATURES.json data to new TASKS.json schema
   */
  transformToTasksSchema(featuresData) {
    console.log('🔄 Transforming to TASKS.json schema...');

    const migrationDate = new Date().toISOString();
    const taskIdCounter = Date.now();

    // Create base TASKS.json structure
    const tasksData = {
      project: featuresData.project || path.basename(this.projectRoot),
      schema_version: '2.0.0',
      migrated_from: 'FEATURES.json',
      migration_date: migrationDate,

      tasks: [],
      completed_tasks: featuresData.completed_tasks || [],

      task_relationships: {},

      workflow_config: {
        require_approval: featuresData.workflow_config?.require_approval ?? true,
        auto_reject_timeout_hours: featuresData.workflow_config?.auto_reject_timeout_hours ?? 168,
        allowed_statuses: ['suggested', 'approved', 'in-progress', 'completed', 'blocked', 'rejected'],
        allowed_task_types: ['error', 'feature', 'test', 'audit'],
        required_fields: ['title', 'description', 'business_value', 'category', 'type'],
        auto_generation_enabled: true,
        mandatory_test_gate: true,
        security_validation_required: true,
      },

      auto_generation_config: {
        test_task_template: {
          title_pattern: 'Implement comprehensive tests for {feature_title}',
          description_pattern: 'Create unit tests, integration tests, and E2E tests to achieve >{coverage}% coverage for {feature_title}. Must validate all functionality, edge cases, and error conditions.',
          priority: 'high',
          required_capabilities: ['testing'],
          validation_requirements: {
            test_coverage: true,
            linter_pass: true,
          },
        },
        audit_task_template: {
          title_pattern: 'Security and quality audit for {feature_title}',
          description_pattern: 'Run semgrep security scan, dependency vulnerability check, code quality analysis, and compliance validation for {feature_title}. Zero tolerance for security vulnerabilities.',
          priority: 'high',
          required_capabilities: ['security', 'analysis'],
          validation_requirements: {
            security_scan: true,
            linter_pass: true,
            type_check: true,
          },
        },
      },

      priority_system: {
        order: ['USER_REQUESTS', 'ERROR', 'AUDIT', 'FEATURE', 'TEST'],
        error_priorities: {
          critical: ['build-breaking', 'security-vulnerability', 'production-down'],
          high: ['linter-errors', 'type-errors', 'test-failures'],
          normal: ['warnings', 'optimization-opportunities'],
          low: ['documentation-improvements', 'code-style'],
        },
      },

      metadata: {
        version: '2.0.0',
        created: featuresData.metadata?.created || migrationDate,
        updated: migrationDate,
        total_tasks: 0,
        tasks_by_type: {
          error: 0,
          feature: 0,
          test: 0,
          audit: 0,
        },
        approval_history: featuresData.metadata?.approval_history || [],
        migration_stats: {
          features_migrated: 0,
          tasks_created: 0,
          auto_generated_tasks: 0,
        },
        initialization_stats: featuresData.metadata?.initialization_stats || {},
      },

      agents: featuresData.agents || {},
    };

    // Transform existing features to feature tasks
    if (featuresData.features && Array.isArray(featuresData.features)) {
      for (const [index, feature] of featuresData.features.entries()) {
        const taskId = `task_${taskIdCounter + index}_${this.generateHash()}`;

        const featureTask = {
          id: taskId,
          type: 'feature',
          parent_id: null,
          linked_tasks: [],
          title: feature.title,
          description: feature.description,
          business_value: feature.business_value,
          category: feature.category,
          status: feature.status,
          priority: this.mapPriorityFromCategory(feature.category),
          auto_generated: false,
          auto_generation_rules: {
            generate_test_task: true,
            generate_audit_task: true,
            test_coverage_requirement: 80,
          },
          dependencies: [],
          estimated_effort: 5, // Default value
          required_capabilities: this.inferCapabilitiesFromCategory(feature.category),
          created_at: feature.created_at,
          updated_at: feature.updated_at,
          created_by: feature.suggested_by || 'system',
          assigned_to: null,
          assigned_at: null,
          completed_at: feature.status === 'implemented' ? feature.updated_at : null,
          validation_requirements: {
            security_scan: true,
            test_coverage: true,
            linter_pass: true,
            type_check: true,
            build_success: true,
          },
          metadata: feature.metadata || {},
        };

        tasksData.tasks.push(featureTask);
        tasksData.metadata.tasks_by_type.feature++;

        // Store for auto-generation later
        if (feature.status === 'approved') {
          tasksData.task_relationships[taskId] = {
            auto_generated_test: null,
            auto_generated_audit: null,
            dependencies: [],
            dependents: [],
          };
        }
      }

      tasksData.metadata.migration_stats.features_migrated = featuresData.features.length;
    }

    // Transform existing tasks to implementation tasks or appropriate types
    if (featuresData.tasks && Array.isArray(featuresData.tasks)) {
      for (const [_index, task] of featuresData.tasks.entries()) {
        const taskId = task.id || `task_${taskIdCounter + 1000 + _index}_${this.generateHash()}`;

        const migratedTask = {
          id: taskId,
          type: this.inferTaskTypeFromExisting(task),
          parent_id: task.feature_id || null,
          linked_tasks: [],
          title: task.title,
          description: task.description,
          business_value: task.metadata?.business_value || 'Implementation of approved feature',
          category: task.metadata?.feature_category || 'enhancement',
          status: this.mapTaskStatus(task.status),
          priority: task.priority || 'normal',
          auto_generated: task.metadata?.auto_generated || false,
          auto_generation_rules: {
            generate_test_task: false,
            generate_audit_task: false,
            test_coverage_requirement: 80,
          },
          dependencies: task.dependencies || [],
          estimated_effort: task.estimated_effort || 5,
          required_capabilities: task.required_capabilities || ['general'],
          created_at: task.created_at,
          updated_at: task.updated_at,
          created_by: task.created_by || 'system',
          assigned_to: task.assigned_to || null,
          assigned_at: task.assigned_at || null,
          completed_at: task.status === 'completed' ? task.updated_at : null,
          validation_requirements: {
            security_scan: false,
            test_coverage: false,
            linter_pass: true,
            type_check: true,
            build_success: true,
          },
          metadata: task.metadata || {},
        };

        tasksData.tasks.push(migratedTask);
        const taskType = migratedTask.type;
        tasksData.metadata.tasks_by_type[taskType]++;
      }

      tasksData.metadata.migration_stats.tasks_created = featuresData.tasks.length;
    }

    tasksData.metadata.total_tasks = tasksData.tasks.length;

    console.log(`✓ Transformed ${tasksData.tasks.length} tasks`);
    return tasksData;
  }

  /**
   * Generate auto-tasks for approved features
   */
  generateAutoTasks(tasksData) {
    console.log('🔄 Generating auto-tasks for approved features...');

    let autoTasksGenerated = 0;
    const autoTaskIdCounter = Date.now() + 10000;

    for (const [_index, task] of tasksData.tasks.entries()) {
      if (task.type === 'feature' && task.status === 'approved') {
        const testTaskId = `task_${autoTaskIdCounter + autoTasksGenerated * 2}_${this.generateHash()}`;
        const auditTaskId = `task_${autoTaskIdCounter + autoTasksGenerated * 2 + 1}_${this.generateHash()}`;

        // Generate test task
        const testTask = {
          id: testTaskId,
          type: 'test',
          parent_id: task.id,
          linked_tasks: [task.id],
          title: `Implement comprehensive tests for ${task.title}`,
          description: `Create unit tests, integration tests, and E2E tests to achieve >80% coverage for ${task.title}. Must validate all functionality, edge cases, and error conditions.`,
          business_value: `Ensures reliability and quality of ${task.title} feature`,
          category: task.category,
          status: 'suggested',
          priority: 'high',
          auto_generated: true,
          auto_generation_rules: {
            generate_test_task: false,
            generate_audit_task: false,
            test_coverage_requirement: 80,
          },
          dependencies: [task.id],
          estimated_effort: Math.ceil(task.estimated_effort * 0.6),
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
            auto_generated_for: task.id,
            generation_rule: 'mandatory_test_gate',
          },
        };

        // Generate audit task
        const auditTask = {
          id: auditTaskId,
          type: 'audit',
          parent_id: task.id,
          linked_tasks: [task.id],
          title: `Security and quality audit for ${task.title}`,
          description: `Run semgrep security scan, dependency vulnerability check, code quality analysis, and compliance validation for ${task.title}. Zero tolerance for security vulnerabilities.`,
          business_value: `Ensures security and quality compliance of ${task.title} feature`,
          category: 'security',
          status: 'suggested',
          priority: 'high',
          auto_generated: true,
          auto_generation_rules: {
            generate_test_task: false,
            generate_audit_task: false,
            test_coverage_requirement: 80,
          },
          dependencies: [task.id],
          estimated_effort: Math.ceil(task.estimated_effort * 0.4),
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
            auto_generated_for: task.id,
            generation_rule: 'mandatory_security_audit',
          },
        };

        // Add to tasks array
        tasksData.tasks.push(testTask, auditTask);

        // Update relationships
        if (!tasksData.task_relationships[task.id]) {
          tasksData.task_relationships[task.id] = {
            auto_generated_test: null,
            auto_generated_audit: null,
            dependencies: [],
            dependents: [],
          };
        }

        tasksData.task_relationships[task.id].auto_generated_test = testTaskId;
        tasksData.task_relationships[task.id].auto_generated_audit = auditTaskId;
        tasksData.task_relationships[task.id].dependents = [testTaskId, auditTaskId];

        // Update linked tasks for feature
        task.linked_tasks = [testTaskId, auditTaskId];

        // Update counters
        tasksData.metadata.tasks_by_type.test++;
        tasksData.metadata.tasks_by_type.audit++;
        autoTasksGenerated++;
      }
    }

    tasksData.metadata.total_tasks = tasksData.tasks.length;
    tasksData.metadata.migration_stats.auto_generated_tasks = autoTasksGenerated * 2;

    console.log(`✓ Generated ${autoTasksGenerated * 2} auto-tasks (${autoTasksGenerated} test + ${autoTasksGenerated} audit)`);
  }

  /**
   * Validate the transformed data structure
   */
  validateTransformedData(tasksData) {
    console.log('🔍 Validating transformed data...');

    // Check required fields
    if (!tasksData.project) {throw new Error('Missing project name');}
    if (!tasksData.schema_version) {throw new Error('Missing schema version');}
    if (!Array.isArray(tasksData.tasks)) {throw new Error('Tasks must be an array');}

    // Validate each task
    for (const [index, task] of tasksData.tasks.entries()) {
      if (!task.id) {throw new Error(`Task ${index} missing ID`);}
      if (!task.type) {throw new Error(`Task ${task.id} missing type`);}
      if (!task.title) {throw new Error(`Task ${task.id} missing title`);}
      if (!task.description) {throw new Error(`Task ${task.id} missing description`);}
      if (!['error', 'feature', 'test', 'audit'].includes(task.type)) {
        throw new Error(`Task ${task.id} has invalid type: ${task.type}`);
      }
    }

    console.log('✓ Data validation passed');
  }

  /**
   * Write the new TASKS.json file
   */
  async writeTasksFile(tasksData) {
    try {
      await fs.writeFile(this.tasksPath, JSON.stringify(tasksData, null, 2));
      console.log(`✓ TASKS.json written to ${this.tasksPath}`);
    } catch (error) {
      throw new Error(`Failed to write TASKS.json: ${error.message}`);
    }
  }

  /**
   * Get migration statistics
   */
  getMigrationStats(tasksData) {
    return {
      totalTasks: tasksData.metadata.total_tasks,
      tasksByType: tasksData.metadata.tasks_by_type,
      migrationStats: tasksData.metadata.migration_stats,
      autoGenerationEnabled: tasksData.workflow_config.auto_generation_enabled,
      mandatoryTestGate: tasksData.workflow_config.mandatory_test_gate,
    };
  }

  // Helper methods
  generateHash() {
    return Math.random().toString(36).substring(2, 10);
  }

  mapPriorityFromCategory(category) {
    const priorityMap = {
      'security': 'high',
      'bug-fix': 'high',
      'performance': 'normal',
      'enhancement': 'normal',
      'new-feature': 'normal',
      'documentation': 'low',
    };
    return priorityMap[category] || 'normal';
  }

  inferCapabilitiesFromCategory(category) {
    const capabilityMap = {
      'security': ['security', 'backend'],
      'bug-fix': ['general'],
      'performance': ['performance', 'analysis'],
      'enhancement': ['general'],
      'new-feature': ['frontend', 'backend'],
      'documentation': ['documentation'],
    };
    return capabilityMap[category] || ['general'];
  }

  inferTaskTypeFromExisting(task) {
    if (task.type === 'testing') {return 'test';}
    if (task.type === 'validation') {return 'audit';}
    if (task.type === 'analysis') {return 'audit';}
    return 'feature'; // Default for implementation tasks
  }

  mapTaskStatus(status) {
    const statusMap = {
      'queued': 'suggested',
      'assigned': 'approved',
      'in_progress': 'in-progress',
      'blocked': 'blocked',
      'completed': 'completed',
      'failed': 'blocked',
      'cancelled': 'rejected',
    };
    return statusMap[status] || status;
  }
}

// CLI execution
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const migrator = new TaskMigrator(projectRoot);

  migrator.migrate()
    .then(result => {
      console.log('\n📊 Migration Summary:');
      console.log(JSON.stringify(result.stats, null, 2));
      throw new Error('Migration completed successfully');
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    });
}

module.exports = TaskMigrator;
