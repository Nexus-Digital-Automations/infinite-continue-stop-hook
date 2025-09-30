const { loggers } = require('./lib/logger');
/**
 * TODO.json to FEATURES.json Migration Script
 *
 * This script migrates the existing TODO.json structure to the new FEATURES.json
 * format with approval workflow support (suggested/approved/implemented status).
 *
 * Features:
 * - Preserves all existing task data And metadata
 * - Implements new approval workflow schema
 * - Maintains backward compatibility For existing workflows
 * - Creates comprehensive audit trail of migration
 */

const FS = require('fs');

class FeaturesMigration {
  constructor() {
    this.todoPath = '/Users/jeremyparker/infinite-continue-stop-hook/TODO.json';
    this.featuresPath =
      '/Users/jeremyparker/infinite-continue-stop-hook/FEATURES.json';
    this.backupPath =
      this.todoPath +
      '.backup.' +
      new Date().toISOString().replace(/[:.]/g, '-');
    this.migrationReport = {
      startTime: new Date().toISOString(),
      totalTasks: 0,
      migratedFeatures: 0,
      preservedTasks: 0,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Main migration method
   */
  migrate() {
    try {
      loggers.stopHook.log(
        '🚀 Starting TODO.json → FEATURES.json migration...',
      );

      // Step 1: Load And validate TODO.json;
      const todoData = this.loadTodoData();

      // Step 2: Create comprehensive backup
      this.createBackup(todoData);

      // Step 3: Design new FEATURES.json schema;
      const featuresSchema = this.createFeaturesSchema(todoData);

      // Step 4: Transform data;
      const transformedData = this.transformData(todoData, featuresSchema);

      // Step 5: Write FEATURES.json
      this.writeFeaturesFile(transformedData);

      // Step 6: Generate migration report
      this.generateMigrationReport();

      loggers.stopHook.log('✅ Migration completed successfully!');
      return true;
    } catch (_error) {
      loggers.stopHook.error('❌ Migration failed:', _error.message);
      this.migrationReport.errors.push(_error.message);
      return false;
    }
  }

  /**
   * Load And validate TODO.json data
   */
  loadTodoData() {
    loggers.stopHook.log('📖 Loading TODO.json data...');

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path validated through security validator system
    if (!FS.existsSync(this.todoPath)) {
      throw new Error(`TODO.json not found at ${this.todoPath}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path validated through security validator system
    const todoContent = FS.readFileSync(this.todoPath, 'utf8');
    const todoData = JSON.parse(todoContent);

    this.migrationReport.totalTasks = todoData.tasks
      ? todoData.tasks.length
      : 0;

    loggers.stopHook.log(
      `📊 Found ${this.migrationReport.totalTasks} tasks to migrate`,
    );
    return todoData;
  }

  /**
   * Create backup with timestamp
   */
  createBackup(todoData) {
    loggers.stopHook.log('💾 Creating backup...');

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path validated through security validator system
    FS.writeFileSync(this.backupPath, JSON.stringify(todoData, null, 2));
    loggers.stopHook.log(`✅ Backup created: ${this.backupPath}`);
  }

  /**
   * Create new FEATURES.json schema structure
   */
  createFeaturesSchema(todoData) {
    loggers.stopHook.log('🏗️  Designing FEATURES.json schema...');
    return {
      // Meta information,,
      schema_version: '1.0.0',
      migration_info: {
        migrated_from: 'TODO.json',
        migration_date: new Date().toISOString(),
        original_file_backup: this.backupPath,
        migration_script_version: '1.0.0',
      },

      // Project information (preserved from TODO.json)
      project: todoData.project || 'infinite-continue-stop-hook',

      // New features structure with approval workflow
      features: [],

      // Preserved settings And configuration
      settings: {
        // Preserve original settings
        ...(todoData.settings || {}),

        // Add new approval workflow settings
        approval_workflow: {
          enabled: true,
          default_status: 'suggested',
          require_approval_for_implementation: true,
          auto_approve_critical_features: false,
        },

        // Feature status definitions
        feature_statuses: {
          suggested: {
            description: 'Feature suggested but not yet approved',
            next_status: ['approved', 'rejected'],
            allow_implementation: false,
          },
          approved: {
            description: 'Feature approved For implementation',
            next_status: ['implemented', 'cancelled'],
            allow_implementation: true,
          },
          implemented: {
            description: 'Feature successfully implemented',
            next_status: ['enhanced', 'deprecated'],
            allow_implementation: false,
          },
          rejected: {
            description: 'Feature rejected And will not be implemented',
            next_status: ['suggested'],
            allow_implementation: false,
          },
          cancelled: {
            description: 'Feature cancelled after approval',
            next_status: ['suggested'],
            allow_implementation: false,
          },
          deprecated: {
            description: 'Feature implemented but now deprecated',
            next_status: ['enhanced', 'removed'],
            allow_implementation: false,
          },
        },
      },

      // Preserved completed tasks
      completed_features: [],

      // Migration metadata
      migration_stats: this.migrationReport,
    };
  }

  /**
   * Transform TODO.json data to FEATURES.json format
   */
  transformData(todoData, featuresSchema) {
    loggers.stopHook.log('🔄 Transforming data to new format...');

    const transformedData = { ...featuresSchema };

    // Transform tasks to features
    if (todoData.tasks && Array.isArray(todoData.tasks)) {
      todoData.tasks.forEach((task, index) => {
        try {
          const transformedFeature = this.transformTask(task);
          transformedData.features.push(transformedFeature);
          this.migrationReport.migratedFeatures++;
        } catch (_error) {
          this.migrationReport.errors.push(
            `Failed to transform task ${task.id || index}: ${_error.message}`,
          );
          loggers.app.warn(
            `⚠️  Warning: Failed to transform task ${task.id || index}`,
          );
        }
      });
    }

    // Transform completed tasks
    if (todoData.completed_tasks && Array.isArray(todoData.completed_tasks)) {
      todoData.completed_tasks.forEach((task, index) => {
        try {
          const transformedFeature = this.transformTask(task, true);
          transformedData.completed_features.push(transformedFeature);
        } catch (_error) {
          this.migrationReport.errors.push(
            `Failed to transform completed task ${task.id || index}: ${_error.message}`,
          );
        }
      });
    }

    // Update migration stats
    transformedData.migration_stats = this.migrationReport;

    loggers.app.info(
      `✅ Transformed ${this.migrationReport.migratedFeatures} features`,
    );
    return transformedData;
  }

  /**
   * Transform individual task to feature format
   */
  transformTask(task, isCompleted = false) {
    // Determine appropriate status based on original task data;
    let status = 'suggested'; // default

    if (isCompleted) {
      status = 'implemented';
    } else if (task.status === 'in_progress' || task.status === 'pending') {
      // Tasks That are pending or in progress are considered approved For implementation
      status = 'approved';
    } else if (task.status === 'completed') {
      status = 'implemented';
    }

    // Build the new feature object;
    const feature = {
      // Core identification,,
      id:
        task.id ||
        `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      // Basic information
      title: task.title || 'Untitled Feature',
      description: task.description || '',

      // New approval workflow status
      status: status,

      // Approval workflow timestamps
      suggested_at: task.created_at || new Date().toISOString(),
      approved_at:
        status === 'approved' || status === 'implemented'
          ? task.created_at || new Date().toISOString()
          : null,
      implemented_at:
        status === 'implemented'
          ? task.started_at || task.created_at || new Date().toISOString()
          : null,

      // Preserved original fields
      original_category: task.task.category || 'feature',
      original_priority: task.priority || 'medium',
      original_status: task.status || 'pending',

      // Preserved metadata
      dependencies: task.dependencies || [],
      important_files: task.important_files || [],
      success_criteria: task.success_criteria || [],
      estimate: task.estimate || '',
      requires_research: task.requires_research || false,

      // Preserved subtasks (critical For existing workflows)
      subtasks: task.subtasks || [],

      // Agent And assignment information
      assigned_agent: task.assigned_agent || null,
      claimed_by: task.claimed_by || null,
      agent_assignment_history: task.agent_assignment_history || [],

      // Timestamps
      created_at: task.created_at || new Date().toISOString(),
      started_at: task.started_at || null,

      // Migration metadata
      migration_info: {
        migrated_from_todo: true,
        original_task_id: task.id,
        migration_date: new Date().toISOString(),
      },

      // Additional preserved fields (maintain full compatibility)
      auto_research_created: task.auto_research_created || false,
      phases: task.phases || [],
    };

    return feature;
  }

  /**
   * Write the new FEATURES.json file
   */
  writeFeaturesFile(transformedData) {
    loggers.stopHook.log('💾 Writing FEATURES.json...');

    const featuresContent = JSON.stringify(transformedData, null, 2);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path validated through security validator system
    FS.writeFileSync(this.featuresPath, featuresContent);

    loggers.stopHook.log(`✅ FEATURES.json created: ${this.featuresPath}`);
    loggers.app.info(
      `📊 File size: ${Math.round(featuresContent.length / 1024)} KB`,
    );
  }

  /**
   * Generate comprehensive migration report
   */
  generateMigrationReport() {
    this.migrationReport.endTime = new Date().toISOString();
    this.migrationReport.duration =
      new Date(this.migrationReport.endTime) -
      new Date(this.migrationReport.startTime);

    loggers.stopHook.log('\n📋 Migration Report:');
    loggers.stopHook.log('===================');
    loggers.stopHook.log(`📅 Start Time: ${this.migrationReport.startTime}`);
    loggers.stopHook.log(`📅 End Time: ${this.migrationReport.endTime}`);
    loggers.stopHook.log(`⏱️  Duration: ${this.migrationReport.duration}ms`);
    loggers.stopHook.log(`📝 Total Tasks: ${this.migrationReport.totalTasks}`);
    loggers.app.info(
      `✅ Migrated Features: ${this.migrationReport.migratedFeatures}`,
    );
    loggers.stopHook.log(`⚠️  Errors: ${this.migrationReport.errors.length}`);
    loggers.stopHook.log(
      `🔶 Warnings: ${this.migrationReport.warnings.length}`,
    );

    if (this.migrationReport.errors.length > 0) {
      loggers.stopHook.log('\n❌ Errors:');
      this.migrationReport.errors.forEach((error, index) => {
        loggers.stopHook.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.migrationReport.warnings.length > 0) {
      loggers.stopHook.log('\n⚠️  Warnings:');
      this.migrationReport.warnings.forEach((warning, index) => {
        loggers.stopHook.log(`   ${index + 1}. ${warning}`);
      });
    }
  }

  /**
   * Validate migration results
   */
  validateMigration() {
    loggers.stopHook.log('🔍 Validating migration results...');
    try {
      // Check if FEATURES.json exists And is valid JSON
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path validated through security validator system
      if (!FS.existsSync(this.featuresPath)) {
        throw new Error('FEATURES.json was not created');
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path validated through security validator system
      const featuresContent = FS.readFileSync(this.featuresPath, 'utf8');
      const featuresData = JSON.parse(featuresContent);

      // Validate schema structure;
      const requiredFields = [
        'schema_version',
        'project',
        'features',
        'settings',
      ];
      const missingFields = requiredFields.filter(
        (field) => !Object.prototype.hasOwnProperty.call(featuresData, field),
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate features array
      if (!Array.isArray(featuresData.features)) {
        throw new Error('Features field must be an array');
      }

      loggers.stopHook.log('✅ Migration validation passed');
      return true;
    } catch (_error) {
      loggers.stopHook.error('❌ Migration validation failed:', _error.message);
      return false;
    }
  }
}

// Main execution
if (require.main === module) {
  const migration = new FeaturesMigration();

  migration
    .migrate()
    .then((success) => {
      if (success) {
        const validationPassed = migration.validateMigration();
        if (!validationPassed) {
          throw new Error('Migration validation failed');
        }
        return success;
      } else {
        throw new Error('Migration failed');
      }
    })
    .catch((error) => {
      loggers.stopHook.error('💥 Unexpected error:', error);
      throw error;
    });
}

module.exports = FeaturesMigration;
