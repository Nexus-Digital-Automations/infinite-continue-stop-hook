#!/usr/bin/env node
/* eslint-disable no-console -- CLI API requires console output for user interaction */
/**
 * Autonomous Task Management API - Advanced Feature Lifecycle & Task Orchestration
 *
 * === OVERVIEW ===
 * Comprehensive API combining feature lifecycle management with autonomous task orchestration.
 * This system manages feature suggestions, approvals, implementation tracking, autonomous task
 * queues, multi-agent coordination, cross-session persistence, and real-time status updates.
 *
 * === KEY FEATURES ===
 * • Feature suggestion and approval workflow
 * • Autonomous task queue with priority scheduling
 * • Multi-agent coordination and workload balancing
 * • Cross-session task persistence and resumption
 * • Real-time task status monitoring and updates
 * • Intelligent task breakdown and dependency management
 * • Agent capability matching and task assignment
 * • Complete audit trails and analytics
 *
 * === WORKFLOWS ===
 * 1. Feature Management: suggest → approve → implement → track
 * 2. Autonomous Tasks: create → queue → assign → execute → validate → complete
 * 3. Agent Coordination: initialize → register capabilities → receive assignments → report progress
 * 4. Cross-Session: persist state → resume on reconnect → maintain continuity
 *
 * @author Autonomous Task Management System
 * @version 4.0.0
 * @since 2025-09-25
 *
 * Usage: node taskmanager-api.js <command> [args...] [--project-root /path/to/project]
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// File locking mechanism to prevent race conditions across processes
class FileLock {
  constructor() {
    this.maxRetries = 200;
    this.retryDelay = 5; // milliseconds
  }

  async acquire(filePath) {
    const lockPath = `${filePath}.lock`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Try to create lock file exclusively
        await fs.writeFile(lockPath, process.pid.toString(), { flag: 'wx' });

        // Successfully acquired lock
        return async () => {
          try {
            await fs.unlink(lockPath);
          } catch {
            // Lock file already removed or doesn't exist
          }
        };
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock file exists, check if process is still alive
          try {
            const lockContent = await fs.readFile(lockPath, 'utf8');
            const lockPid = parseInt(lockContent);

            // Check if process is still running
            try {
              process.kill(lockPid, 0); // Signal 0 just checks if process exists
              // Process exists, wait and retry
              await new Promise(resolve => {
                setTimeout(resolve, this.retryDelay);
              });
              continue;
            } catch {
              // Process doesn't exist, remove stale lock
              try {
                await fs.unlink(lockPath);
              } catch {
                // Someone else removed it
              }
              continue;
            }
          } catch {
            // Can't read lock file, wait and retry
            await new Promise(resolve => {
              setTimeout(resolve, this.retryDelay);
            });
            continue;
          }
        } else {
          // Other error, wait and retry
          await new Promise(resolve => {
            setTimeout(resolve, this.retryDelay);
          });
          continue;
        }
      }
    }

    throw new Error(`Could not acquire lock for ${filePath} after ${this.maxRetries} attempts`);
  }
}

const fileLock = new FileLock();

// Parse project root from --project-root flag or use current directory
const args = process.argv.slice(2);
const projectRootIndex = args.indexOf('--project-root');
const PROJECT_ROOT =
  projectRootIndex !== -1 && projectRootIndex + 1 < args.length
    ? args[projectRootIndex + 1]
    : process.cwd();
const FEATURES_PATH = path.join(PROJECT_ROOT, 'FEATURES.json');

// Remove --project-root and its value from args for command parsing
if (projectRootIndex !== -1) {
  args.splice(projectRootIndex, 2);
}

// Feature validation schemas
const FEATURE_STATUSES = ['suggested', 'approved', 'rejected', 'implemented'];
const FEATURE_CATEGORIES = ['enhancement', 'bug-fix', 'new-feature', 'performance', 'security', 'documentation'];
const REQUIRED_FEATURE_FIELDS = ['title', 'description', 'business_value', 'category'];

// Task management schemas
const TASK_STATUSES = ['queued', 'assigned', 'in_progress', 'blocked', 'completed', 'failed', 'cancelled'];
const TASK_PRIORITIES = ['critical', 'high', 'normal', 'low'];
const TASK_TYPES = ['implementation', 'testing', 'documentation', 'validation', 'deployment', 'analysis'];
const AGENT_CAPABILITIES = ['frontend', 'backend', 'testing', 'documentation', 'security', 'performance', 'analysis', 'validation'];

/**
 * AutonomousTaskManagerAPI - Advanced Feature & Task Management System
 *
 * Comprehensive system managing feature lifecycle, autonomous task orchestration,
 * multi-agent coordination, cross-session persistence, and real-time monitoring.
 * Integrates FEATURES.json workflow with autonomous task queue management.
 */
class AutonomousTaskManagerAPI {
  constructor() {
    // Core data persistence paths
    this.featuresPath = FEATURES_PATH;

    // Performance configuration - 10 second timeout for all operations
    this.timeout = 10000;

    // Feature validation configuration
    this.validStatuses = FEATURE_STATUSES;
    this.validCategories = FEATURE_CATEGORIES;
    this.requiredFields = REQUIRED_FEATURE_FIELDS;

    // Task management configuration
    this.validTaskStatuses = TASK_STATUSES;
    this.validTaskPriorities = TASK_PRIORITIES;
    this.validTaskTypes = TASK_TYPES;
    this.validAgentCapabilities = AGENT_CAPABILITIES;

    // Task queue and agent management state
    this.taskQueue = [];
    this.activeAgents = new Map();
    this.taskAssignments = new Map();
    this.taskDependencies = new Map();

    // Initialize features file and task structures if they don't exist
  }

  /**
   * Ensure FEATURES.json exists with proper structure
   */
  async _ensureFeaturesFile() {
    try {
      await fs.access(this.featuresPath);
    } catch {
      // File doesn't exist, create it
      const initialStructure = {
        project: path.basename(PROJECT_ROOT),
        features: [],
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          total_features: 0,
          approval_history: [],
        },
        workflow_config: {
          require_approval: true,
          auto_reject_timeout_hours: 168,
          allowed_statuses: this.validStatuses,
          required_fields: this.requiredFields,
        },
      };

      await fs.writeFile(this.featuresPath, JSON.stringify(initialStructure, null, 2));
    }
  }

  /**
   * Wrap any async operation with a timeout to prevent hanging operations
   */
  withTimeout(promise, timeoutMs = this.timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  }

  // =================== FEATURE MANAGEMENT METHODS ===================
  // Core feature lifecycle management operations

  /**
   * Suggest a new feature for approval
   */
  async suggestFeature(featureData) {
    try {
      // Validate required fields before atomic operation
      this._validateFeatureData(featureData);

      const result = await this._atomicFeatureOperation((features) => {
        const feature = {
          id: this._generateFeatureId(),
          title: featureData.title,
          description: featureData.description,
          business_value: featureData.business_value,
          category: featureData.category,
          status: 'suggested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          suggested_by: featureData.suggested_by || 'system',
          metadata: featureData.metadata || {},
        };

        features.features.push(feature);
        features.metadata.total_features = features.features.length;
        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          feature,
          message: 'Feature suggestion created successfully',
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Approve a suggested feature for implementation
   */
  async approveFeature(featureId, approvalData = {}) {
    try {
      // Ensure features file exists
      await this._ensureFeaturesFile();

      const features = await this._loadFeatures();
      const feature = features.features.find(f => f.id === featureId);

      if (!feature) {
        throw new Error(`Feature with ID ${featureId} not found`);
      }

      if (feature.status !== 'suggested') {
        throw new Error(`Feature must be in 'suggested' status to approve. Current status: ${feature.status}`);
      }

      feature.status = 'approved';
      feature.updated_at = new Date().toISOString();
      feature.approved_by = approvalData.approved_by || 'system';
      feature.approval_date = new Date().toISOString();
      feature.approval_notes = approvalData.notes || '';

      // Ensure metadata structure exists (defensive programming)
      if (!features.metadata) {
        features.metadata = {
          version: '1.0.0',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          total_features: features.features.length,
          approval_history: [],
        };
      }
      if (!features.metadata.approval_history) {
        features.metadata.approval_history = [];
      }

      // Add to approval history
      features.metadata.approval_history.push({
        feature_id: featureId,
        action: 'approved',
        timestamp: new Date().toISOString(),
        approved_by: feature.approved_by,
        notes: feature.approval_notes,
      });

      features.metadata.updated = new Date().toISOString();
      await this._saveFeatures(features);

      return {
        success: true,
        feature,
        message: 'Feature approved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reject a suggested feature
   */
  async rejectFeature(featureId, rejectionData = {}) {
    try {
      // Ensure features file exists
      await this._ensureFeaturesFile();

      const features = await this._loadFeatures();
      const feature = features.features.find(f => f.id === featureId);

      if (!feature) {
        throw new Error(`Feature with ID ${featureId} not found`);
      }

      if (feature.status !== 'suggested') {
        throw new Error(`Feature must be in 'suggested' status to reject. Current status: ${feature.status}`);
      }

      feature.status = 'rejected';
      feature.updated_at = new Date().toISOString();
      feature.rejected_by = rejectionData.rejected_by || 'system';
      feature.rejection_date = new Date().toISOString();
      feature.rejection_reason = rejectionData.reason || 'No reason provided';

      // Ensure metadata structure exists (defensive programming)
      if (!features.metadata) {
        features.metadata = {
          version: '1.0.0',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          total_features: features.features.length,
          approval_history: [],
        };
      }
      if (!features.metadata.approval_history) {
        features.metadata.approval_history = [];
      }

      // Add to approval history
      features.metadata.approval_history.push({
        feature_id: featureId,
        action: 'rejected',
        timestamp: new Date().toISOString(),
        rejected_by: feature.rejected_by,
        reason: feature.rejection_reason,
      });

      features.metadata.updated = new Date().toISOString();
      await this._saveFeatures(features);

      return {
        success: true,
        feature,
        message: 'Feature rejected successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk approve multiple features at once
   */
  async bulkApproveFeatures(featureIds, approvalData = {}) {
    try {
      await this._ensureFeaturesFile();

      const features = await this._loadFeatures();
      const results = [];
      const errors = [];

      for (const featureId of featureIds) {
        try {
          const feature = features.features.find(f => f.id === featureId);

          if (!feature) {
            errors.push(`Feature with ID ${featureId} not found`);
            continue;
          }

          if (feature.status !== 'suggested') {
            errors.push(`Feature ${featureId} must be in 'suggested' status to approve. Current status: ${feature.status}`);
            continue;
          }

          feature.status = 'approved';
          feature.updated_at = new Date().toISOString();
          feature.approved_by = approvalData.approved_by || 'system';
          feature.approval_date = new Date().toISOString();
          feature.approval_notes = approvalData.notes || '';

          // Ensure metadata structure exists (defensive programming)
          if (!features.metadata) {
            features.metadata = {
              version: '1.0.0',
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              total_features: features.features.length,
              approval_history: [],
            };
          }
          if (!features.metadata.approval_history) {
            features.metadata.approval_history = [];
          }

          // Add to approval history
          features.metadata.approval_history.push({
            feature_id: featureId,
            action: 'approved',
            timestamp: new Date().toISOString(),
            approved_by: feature.approved_by,
            notes: feature.approval_notes,
          });

          results.push({
            feature_id: featureId,
            title: feature.title,
            status: 'approved',
            success: true,
          });

        } catch (error) {
          errors.push(`Error approving ${featureId}: ${error.message}`);
        }
      }

      features.metadata.updated = new Date().toISOString();
      await this._saveFeatures(features);

      return {
        success: true,
        approved_count: results.length,
        error_count: errors.length,
        approved_features: results,
        errors: errors,
        message: `Bulk approval completed: ${results.length} approved, ${errors.length} errors`,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List features with optional filtering
   */
  async listFeatures(filter = {}) {
    try {
      // Ensure features file exists
      await this._ensureFeaturesFile();

      const features = await this._loadFeatures();
      let filteredFeatures = features.features;

      // Apply status filter
      if (filter.status) {
        filteredFeatures = filteredFeatures.filter(f => f.status === filter.status);
      }

      // Apply category filter
      if (filter.category) {
        filteredFeatures = filteredFeatures.filter(f => f.category === filter.category);
      }

      return {
        success: true,
        features: filteredFeatures,
        total: filteredFeatures.length,
        metadata: features.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get feature statistics and analytics
   */
  async getFeatureStats() {
    try {
      // Ensure features file exists
      await this._ensureFeaturesFile();

      const features = await this._loadFeatures();
      const stats = {
        total: features.features.length,
        by_status: {},
        by_category: {},
        recent_activity: [],
      };

      // Count by status
      features.features.forEach(feature => {
        stats.by_status[feature.status] = (stats.by_status[feature.status] || 0) + 1;
      });

      // Count by category
      features.features.forEach(feature => {
        stats.by_category[feature.category] = (stats.by_category[feature.category] || 0) + 1;
      });

      // Recent activity from approval history
      stats.recent_activity = features.metadata.approval_history
        .slice(-10)
        .reverse();

      return {
        success: true,
        stats,
        metadata: features.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get initialization usage statistics organized by 5-hour time buckets
   */
  async getInitializationStats() {
    try {
      // Ensure features file exists
      await this._ensureFeaturesFile();

      const features = await this._loadFeatures();
      await this._ensureInitializationStatsStructure(features);
      await this._resetDailyBucketsIfNeeded(features);

      const stats = features.metadata.initialization_stats;
      const currentBucket = this._getCurrentTimeBucket();

      // Calculate today's totals
      const todayTotal = Object.values(stats.time_buckets).reduce(
        (acc, bucket) => ({
          init: acc.init + bucket.init,
          reinit: acc.reinit + bucket.reinit,
        }),
        { init: 0, reinit: 0 },
      );

      // Get recent activity (last 7 days from history)
      const recentActivity = stats.daily_history.slice(-7);

      // Build dynamic time buckets response
      const timeBucketsResponse = {};
      Object.keys(stats.time_buckets).forEach(bucket => {
        const bucketData = stats.time_buckets[bucket];
        timeBucketsResponse[bucket] = {
          initializations: bucketData.init,
          reinitializations: bucketData.reinit,
          total: bucketData.init + bucketData.reinit,
        };
      });

      const response = {
        success: true,
        stats: {
          total_initializations: stats.total_initializations,
          total_reinitializations: stats.total_reinitializations,
          current_day: stats.current_day,
          current_bucket: currentBucket,
          today_totals: {
            initializations: todayTotal.init,
            reinitializations: todayTotal.reinit,
            combined: todayTotal.init + todayTotal.reinit,
          },
          time_buckets: timeBucketsResponse,
          recent_activity: recentActivity,
          last_updated: stats.last_updated,
          last_reset: stats.last_reset,
        },
        message: 'Initialization statistics retrieved successfully',
      };

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async initializeAgent(agentId) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        // Initialize agents section if it doesn't exist
        if (!features.agents) {
          features.agents = {};
        }

        const timestamp = new Date().toISOString();

        // Create or update agent entry
        features.agents[agentId] = {
          lastHeartbeat: timestamp,
          status: 'active',
          initialized: timestamp,
          sessionId: crypto.randomBytes(8).toString('hex'),
        };

        return {
          success: true,
          agent: {
            id: agentId,
            status: 'initialized',
            sessionId: features.agents[agentId].sessionId,
            timestamp,
          },
          message: `Agent ${agentId} successfully initialized`,
        };
      });

      // Track initialization usage in time buckets (separate atomic operation)
      await this._updateTimeBucketStats('init');

      // Include comprehensive guide in initialization response
      const guideData = await this.getComprehensiveGuide();
      result.comprehensiveGuide = guideData;

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize agent: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async reinitializeAgent(agentId) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        // Initialize agents section if it doesn't exist
        if (!features.agents) {
          features.agents = {};
        }

        const timestamp = new Date().toISOString();
        const existingAgent = features.agents[agentId];

        // Update or create agent entry (reinitialize preserves some data)
        features.agents[agentId] = {
          ...existingAgent,
          lastHeartbeat: timestamp,
          status: 'active',
          reinitialized: timestamp,
          sessionId: crypto.randomBytes(8).toString('hex'),
          previousSessions: existingAgent?.sessionId ? [
            ...(existingAgent.previousSessions || []),
            existingAgent.sessionId,
          ] : [],
        };

        return {
          success: true,
          agent: {
            id: agentId,
            status: 'reinitialized',
            sessionId: features.agents[agentId].sessionId,
            timestamp,
            previousSessions: features.agents[agentId].previousSessions?.length || 0,
          },
          message: `Agent ${agentId} successfully reinitialized`,
        };
      });

      // Track reinitialization usage in time buckets (separate atomic operation)
      await this._updateTimeBucketStats('reinit');

      // Include comprehensive guide in reinitialization response
      const guideData = await this.getComprehensiveGuide();
      result.comprehensiveGuide = guideData;

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to reinitialize agent: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async authorizeStop(agentId, reason) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // Create stop authorization flag
      const stopFlagPath = path.join(PROJECT_ROOT, '.stop-allowed');
      const stopData = {
        stop_allowed: true,
        authorized_by: agentId,
        reason: reason || 'Agent authorized stop after completing all tasks and achieving project perfection',
        timestamp: new Date().toISOString(),
        session_type: 'self_authorized',
      };

      await fs.writeFile(stopFlagPath, JSON.stringify(stopData, null, 2));

      return {
        success: true,
        authorization: {
          authorized_by: agentId,
          reason: stopData.reason,
          timestamp: stopData.timestamp,
          stop_flag_created: true,
        },
        message: `Stop authorized by agent ${agentId} - stop hook will allow termination on next trigger`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to authorize stop: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // =================== AUTONOMOUS TASK MANAGEMENT METHODS ===================
  // Core autonomous task orchestration and management operations

  /**
   * Create autonomous task from approved feature
   */
  async createTaskFromFeature(featureId, taskOptions = {}) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        const feature = features.features.find(f => f.id === featureId);

        if (!feature) {
          throw new Error(`Feature with ID ${featureId} not found`);
        }

        if (feature.status !== 'approved') {
          throw new Error(`Feature must be approved to create tasks. Current status: ${feature.status}`);
        }

        // Initialize tasks array if it doesn't exist
        if (!features.tasks) {
          features.tasks = [];
        }

        const task = {
          id: this._generateTaskId(),
          feature_id: featureId,
          title: taskOptions.title || `Implement: ${feature.title}`,
          description: taskOptions.description || feature.description,
          type: taskOptions.type || this._inferTaskType(feature),
          priority: taskOptions.priority || this._inferTaskPriority(feature),
          status: 'queued',
          dependencies: taskOptions.dependencies || [],
          estimated_effort: taskOptions.estimated_effort || this._estimateEffort(feature),
          required_capabilities: taskOptions.required_capabilities || this._inferCapabilities(feature),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: taskOptions.created_by || 'autonomous_system',
          metadata: {
            auto_generated: true,
            feature_category: feature.category,
            business_value: feature.business_value,
            ...taskOptions.metadata
          }
        };

        features.tasks.push(task);
        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          task,
          message: 'Autonomous task created successfully from approved feature'
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-generate tasks from all approved features
   */
  async generateTasksFromApprovedFeatures(options = {}) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        const approvedFeatures = features.features.filter(f => f.status === 'approved');

        if (approvedFeatures.length === 0) {
          return {
            success: true,
            generated_tasks: [],
            message: 'No approved features found to generate tasks'
          };
        }

        // Initialize tasks array if it doesn't exist
        if (!features.tasks) {
          features.tasks = [];
        }

        const generatedTasks = [];

        for (const feature of approvedFeatures) {
          // Check if tasks already exist for this feature
          const existingTasks = features.tasks.filter(t => t.feature_id === feature.id);
          if (existingTasks.length > 0 && !options.force) {
            continue;
          }

          // Generate main implementation task
          const mainTask = {
            id: this._generateTaskId(),
            feature_id: feature.id,
            title: `Implement: ${feature.title}`,
            description: feature.description,
            type: this._inferTaskType(feature),
            priority: this._inferTaskPriority(feature),
            status: 'queued',
            dependencies: [],
            estimated_effort: this._estimateEffort(feature),
            required_capabilities: this._inferCapabilities(feature),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'autonomous_system',
            metadata: {
              auto_generated: true,
              feature_category: feature.category,
              business_value: feature.business_value,
              generation_batch: new Date().toISOString()
            }
          };

          features.tasks.push(mainTask);
          generatedTasks.push(mainTask);

          // Generate supporting tasks based on feature complexity
          if (this._isComplexFeature(feature)) {
            const supportingTasks = this._generateSupportingTasks(feature, mainTask.id);
            for (const supportingTask of supportingTasks) {
              features.tasks.push(supportingTask);
              generatedTasks.push(supportingTask);
            }
          }
        }

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          generated_tasks: generatedTasks,
          approved_features_processed: approvedFeatures.length,
          message: `Generated ${generatedTasks.length} tasks from ${approvedFeatures.length} approved features`
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get task queue with filtering and sorting
   */
  async getTaskQueue(filters = {}) {
    try {
      await this._ensureFeaturesFile();
      const features = await this._loadFeatures();

      if (!features.tasks) {
        return {
          success: true,
          tasks: [],
          total: 0,
          message: 'No tasks in queue'
        };
      }

      let tasks = features.tasks;

      // Apply filters
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }

      if (filters.assigned_to) {
        tasks = tasks.filter(task => task.assigned_to === filters.assigned_to);
      }

      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }

      if (filters.type) {
        tasks = tasks.filter(task => task.type === filters.type);
      }

      if (filters.feature_id) {
        tasks = tasks.filter(task => task.feature_id === filters.feature_id);
      }

      // Sort by priority (critical > high > normal > low) and created date
      const priorityOrder = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };
      tasks.sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      return {
        success: true,
        tasks,
        total: tasks.length,
        filters_applied: filters,
        message: `Retrieved ${tasks.length} tasks from queue`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Assign task to agent based on capabilities
   */
  async assignTask(taskId, agentId, assignmentOptions = {}) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.tasks) {
          throw new Error('No tasks exist in the system');
        }

        const task = features.tasks.find(t => t.id === taskId);
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        if (!features.agents || !features.agents[agentId]) {
          throw new Error(`Agent ${agentId} not found or not initialized`);
        }

        if (!['queued', 'assigned'].includes(task.status)) {
          throw new Error(`Task must be queued or assigned to reassign. Current status: ${task.status}`);
        }

        // Check if agent capabilities match task requirements
        const agent = features.agents[agentId];
        const agentCapabilities = agent.capabilities || [];
        const requiredCapabilities = task.required_capabilities || [];

        const hasRequiredCapabilities = requiredCapabilities.every(cap =>
          agentCapabilities.includes(cap) || agentCapabilities.includes('general')
        );

        if (!hasRequiredCapabilities && !assignmentOptions.force) {
          return {
            success: false,
            error: `Agent ${agentId} lacks required capabilities: ${requiredCapabilities.join(', ')}`,
            agent_capabilities: agentCapabilities,
            required_capabilities: requiredCapabilities
          };
        }

        // Assign task
        task.assigned_to = agentId;
        task.status = 'assigned';
        task.assigned_at = new Date().toISOString();
        task.updated_at = new Date().toISOString();
        task.assignment_metadata = {
          forced: assignmentOptions.force || false,
          assignment_reason: assignmentOptions.reason || 'capability_match',
          ...assignmentOptions.metadata
        };

        // Update agent assignment count
        if (!agent.assigned_tasks) {
          agent.assigned_tasks = [];
        }
        agent.assigned_tasks.push(taskId);
        agent.lastHeartbeat = new Date().toISOString();

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          task,
          agent: { id: agentId, capabilities: agentCapabilities },
          message: `Task ${taskId} successfully assigned to agent ${agentId}`
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update task progress and status
   */
  async updateTaskProgress(taskId, progressUpdate) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.tasks) {
          throw new Error('No tasks exist in the system');
        }

        const task = features.tasks.find(t => t.id === taskId);
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        // Initialize progress tracking if it doesn't exist
        if (!task.progress_history) {
          task.progress_history = [];
        }

        // Add progress entry
        const progressEntry = {
          timestamp: new Date().toISOString(),
          status: progressUpdate.status || task.status,
          progress_percentage: progressUpdate.progress_percentage || 0,
          notes: progressUpdate.notes || '',
          updated_by: progressUpdate.updated_by || 'autonomous_system',
          metadata: progressUpdate.metadata || {}
        };

        task.progress_history.push(progressEntry);

        // Update task status if provided
        if (progressUpdate.status && this.validTaskStatuses.includes(progressUpdate.status)) {
          task.status = progressUpdate.status;
        }

        // Update completion fields if task is completed
        if (progressUpdate.status === 'completed') {
          task.completed_at = new Date().toISOString();
          task.progress_percentage = 100;

          // Move to completed_tasks if it doesn't exist there
          if (!features.completed_tasks) {
            features.completed_tasks = [];
          }

          // Add reference to completed tasks
          features.completed_tasks.push({
            task_id: taskId,
            completed_at: task.completed_at,
            assigned_to: task.assigned_to,
            feature_id: task.feature_id
          });
        }

        task.updated_at = new Date().toISOString();
        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          task,
          progress_entry: progressEntry,
          message: 'Task progress updated successfully'
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register agent capabilities for task matching
   */
  async registerAgentCapabilities(agentId, capabilities) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.agents) {
          features.agents = {};
        }

        if (!features.agents[agentId]) {
          throw new Error(`Agent ${agentId} not found. Initialize agent first.`);
        }

        // Validate capabilities
        const validCapabilities = capabilities.filter(cap =>
          this.validAgentCapabilities.includes(cap) || cap === 'general'
        );

        if (validCapabilities.length !== capabilities.length) {
          const invalidCaps = capabilities.filter(cap => !validCapabilities.includes(cap));
          return {
            success: false,
            error: `Invalid capabilities: ${invalidCaps.join(', ')}`,
            valid_capabilities: this.validAgentCapabilities
          };
        }

        features.agents[agentId].capabilities = capabilities;
        features.agents[agentId].capabilities_registered_at = new Date().toISOString();
        features.agents[agentId].lastHeartbeat = new Date().toISOString();

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          agent_id: agentId,
          capabilities,
          message: `Capabilities registered for agent ${agentId}`
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =================== DIRECT TASK MANAGEMENT METHODS ===================

  /**
   * Create a new task directly (not from feature)
   */
  async createTask(taskData) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        // Initialize tasks array if it doesn't exist
        if (!features.tasks) {
          features.tasks = [];
        }

        // Validate required task fields
        if (!taskData.title || !taskData.description) {
          throw new Error('Task title and description are required');
        }

        const task = {
          id: this._generateTaskId(),
          feature_id: taskData.feature_id || null,
          title: taskData.title,
          description: taskData.description,
          type: taskData.type || 'implementation',
          priority: taskData.priority || 'normal',
          status: 'queued',
          dependencies: taskData.dependencies || [],
          estimated_effort: taskData.estimated_effort || 5,
          required_capabilities: taskData.required_capabilities || ['general'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: taskData.created_by || 'manual_creation',
          metadata: {
            auto_generated: false,
            ...taskData.metadata
          }
        };

        features.tasks.push(task);
        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          task,
          message: 'Task created successfully'
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId) {
    try {
      const features = await this._loadFeatures();

      if (!features.tasks) {
        throw new Error('No tasks exist in the system');
      }

      const task = features.tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      return {
        success: true,
        task,
        message: 'Task retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId, updates) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.tasks) {
          throw new Error('No tasks exist in the system');
        }

        const task = features.tasks.find(t => t.id === taskId);
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        // Update allowed fields
        const allowedFields = ['title', 'description', 'status', 'priority', 'progress_percentage', 'metadata'];
        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            task[field] = updates[field];
          }
        }

        task.updated_at = new Date().toISOString();
        if (updates.updated_by) {
          task.updated_by = updates.updated_by;
        }

        // Handle status changes
        if (updates.status === 'completed' && !task.completed_at) {
          task.completed_at = new Date().toISOString();
          task.progress_percentage = 100;
        }

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          task,
          message: 'Task updated successfully'
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  /**
   * Complete a task with result data
   */
  async completeTask(taskId, resultData) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.tasks) {
          throw new Error('No tasks exist in the system');
        }

        const task = features.tasks.find(t => t.id === taskId);
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        if (task.status === 'completed') {
          return {
            success: true,
            task,
            message: 'Task was already completed'
          };
        }

        // Update task completion fields
        task.status = 'completed';
        task.completed_at = new Date().toISOString();
        task.progress_percentage = 100;
        task.result = resultData;
        task.updated_at = new Date().toISOString();

        // Initialize completed_tasks if it doesn't exist
        if (!features.completed_tasks) {
          features.completed_tasks = [];
        }

        // Add to completed tasks
        features.completed_tasks.push({
          task_id: taskId,
          completed_at: task.completed_at,
          assigned_to: task.assigned_to,
          feature_id: task.feature_id,
          result: resultData
        });

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          task,
          message: 'Task completed successfully'
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }
  }

  /**
   * Get tasks assigned to a specific agent
   */
  async getAgentTasks(agentId) {
    try {
      const features = await this._loadFeatures();

      if (!features.tasks) {
        return {
          success: true,
          tasks: [],
          message: 'No tasks exist in the system'
        };
      }

      const agentTasks = features.tasks.filter(t => t.assigned_to === agentId);

      return {
        success: true,
        tasks: agentTasks,
        count: agentTasks.length,
        message: `Found ${agentTasks.length} tasks for agent ${agentId}`
      };
    } catch (error) {
      throw new Error(`Failed to get agent tasks: ${error.message}`);
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status) {
    try {
      const features = await this._loadFeatures();

      if (!features.tasks) {
        return {
          success: true,
          tasks: [],
          message: 'No tasks exist in the system'
        };
      }

      const statusTasks = features.tasks.filter(t => t.status === status);

      return {
        success: true,
        tasks: statusTasks,
        count: statusTasks.length,
        message: `Found ${statusTasks.length} tasks with status '${status}'`
      };
    } catch (error) {
      throw new Error(`Failed to get tasks by status: ${error.message}`);
    }
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority) {
    try {
      const features = await this._loadFeatures();

      if (!features.tasks) {
        return {
          success: true,
          tasks: [],
          message: 'No tasks exist in the system'
        };
      }

      const priorityTasks = features.tasks.filter(t => t.priority === priority);

      return {
        success: true,
        tasks: priorityTasks,
        count: priorityTasks.length,
        message: `Found ${priorityTasks.length} tasks with priority '${priority}'`
      };
    } catch (error) {
      throw new Error(`Failed to get tasks by priority: ${error.message}`);
    }
  }

  /**
   * Get available tasks for an agent based on capabilities
   */
  async getAvailableTasksForAgent(agentId) {
    try {
      const features = await this._loadFeatures();

      if (!features.tasks || !features.agents) {
        return {
          success: true,
          tasks: [],
          message: 'No tasks or agents exist in the system'
        };
      }

      const agent = features.agents[agentId];
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Find unassigned tasks that match agent capabilities
      const availableTasks = features.tasks.filter(task => {
        if (task.status !== 'queued') return false;
        if (task.assigned_to) return false;

        // Check if agent has required capabilities
        const hasCapabilities = task.required_capabilities.every(cap =>
          agent.capabilities.includes(cap) || agent.capabilities.includes('general')
        );

        return hasCapabilities;
      });

      return {
        success: true,
        tasks: availableTasks,
        count: availableTasks.length,
        message: `Found ${availableTasks.length} available tasks for agent ${agentId}`
      };
    } catch (error) {
      throw new Error(`Failed to get available tasks: ${error.message}`);
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics() {
    try {
      const features = await this._loadFeatures();

      if (!features.tasks) {
        return {
          success: true,
          statistics: {
            total_tasks: 0,
            by_status: {},
            by_priority: {},
            by_type: {},
            completion_rate: 0
          },
          message: 'No tasks exist in the system'
        };
      }

      const stats = {
        total_tasks: features.tasks.length,
        by_status: {},
        by_priority: {},
        by_type: {},
        by_agent: {},
        completion_rate: 0
      };

      // Calculate statistics
      features.tasks.forEach(task => {
        // Status statistics
        stats.by_status[task.status] = (stats.by_status[task.status] || 0) + 1;

        // Priority statistics
        stats.by_priority[task.priority] = (stats.by_priority[task.priority] || 0) + 1;

        // Type statistics
        stats.by_type[task.type] = (stats.by_type[task.type] || 0) + 1;

        // Agent statistics
        if (task.assigned_to) {
          stats.by_agent[task.assigned_to] = (stats.by_agent[task.assigned_to] || 0) + 1;
        }
      });

      // Calculate completion rate
      const completedTasks = stats.by_status.completed || 0;
      stats.completion_rate = features.tasks.length > 0
        ? Math.round((completedTasks / features.tasks.length) * 100)
        : 0;

      return {
        success: true,
        statistics: stats,
        message: 'Task statistics calculated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get task statistics: ${error.message}`);
    }
  }

  /**
   * Create tasks from all approved features
   */
  async createTasksFromApprovedFeatures(options = {}) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        const approvedFeatures = features.features.filter(f => f.status === 'approved');

        if (approvedFeatures.length === 0) {
          return {
            success: true,
            created_tasks: [],
            message: 'No approved features found to create tasks from'
          };
        }

        // Initialize tasks array if it doesn't exist
        if (!features.tasks) {
          features.tasks = [];
        }

        const createdTasks = [];

        approvedFeatures.forEach(feature => {
          // Skip if task already exists for this feature (unless force option is set)
          const existingTask = features.tasks.find(t => t.feature_id === feature.id);
          if (existingTask && !options.force) {
            return;
          }

          const mainTask = {
            id: this._generateTaskId(),
            feature_id: feature.id,
            title: `Implement: ${feature.title}`,
            description: feature.description,
            type: this._inferTaskType(feature),
            priority: this._inferTaskPriority(feature),
            status: 'queued',
            dependencies: [],
            estimated_effort: this._estimateEffort(feature),
            required_capabilities: this._inferCapabilities(feature),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'autonomous_system',
            metadata: {
              auto_generated: true,
              feature_category: feature.category,
              business_value: feature.business_value
            }
          };

          features.tasks.push(mainTask);
          createdTasks.push(mainTask);

          // Create supporting tasks if this is a complex feature
          if (this._isComplexFeature(feature)) {
            const supportingTasks = this._generateSupportingTasks(feature, mainTask.id);
            features.tasks.push(...supportingTasks);
            createdTasks.push(...supportingTasks);
          }
        });

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          created_tasks: createdTasks,
          message: `Created ${createdTasks.length} tasks from ${approvedFeatures.length} approved features`
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to create tasks from features: ${error.message}`);
    }
  }

  /**
   * Optimize task assignments based on agent capabilities and workload
   */
  async optimizeTaskAssignments() {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.tasks || !features.agents) {
          return {
            success: true,
            assignments: [],
            message: 'No tasks or agents available for optimization'
          };
        }

        const assignments = [];
        const unassignedTasks = features.tasks.filter(t =>
          t.status === 'queued' && !t.assigned_to
        );

        const activeAgents = Object.keys(features.agents).map(agentId => ({
          id: agentId,
          ...features.agents[agentId],
          workload: features.tasks.filter(t =>
            t.assigned_to === agentId && ['queued', 'in_progress'].includes(t.status)
          ).length
        }));

        // Sort agents by workload (least busy first)
        activeAgents.sort((a, b) => a.workload - b.workload);

        // Assign tasks to agents based on capabilities and workload
        unassignedTasks.forEach(task => {
          const suitableAgent = activeAgents.find(agent =>
            task.required_capabilities.every(cap =>
              agent.capabilities.includes(cap) || agent.capabilities.includes('general')
            )
          );

          if (suitableAgent) {
            task.assigned_to = suitableAgent.id;
            task.assigned_at = new Date().toISOString();
            task.status = 'assigned';
            task.updated_at = new Date().toISOString();

            suitableAgent.workload += 1;
            assignments.push({
              task_id: task.id,
              agent_id: suitableAgent.id,
              task_title: task.title,
              reason: 'capability_match_and_workload_balance'
            });
          }
        });

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          assignments,
          message: `Optimized assignments for ${assignments.length} tasks`
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to optimize task assignments: ${error.message}`);
    }
  }

  /**
   * Register agent with capabilities
   */
  async registerAgent(agentId, capabilities) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.agents) {
          features.agents = {};
        }

        features.agents[agentId] = {
          id: agentId,
          capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
          registered_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          status: 'active'
        };

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          agent: features.agents[agentId],
          message: `Agent ${agentId} registered successfully with capabilities: ${capabilities.join(', ')}`
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to register agent: ${error.message}`);
    }
  }

  /**
   * Unregister agent
   */
  async unregisterAgent(agentId) {
    try {
      const result = await this._atomicFeatureOperation((features) => {
        if (!features.agents || !features.agents[agentId]) {
          throw new Error(`Agent ${agentId} not found`);
        }

        delete features.agents[agentId];

        // Unassign any tasks assigned to this agent
        if (features.tasks) {
          features.tasks.forEach(task => {
            if (task.assigned_to === agentId) {
              task.assigned_to = null;
              task.status = 'queued';
              task.updated_at = new Date().toISOString();
            }
          });
        }

        features.metadata.updated = new Date().toISOString();

        return {
          success: true,
          message: `Agent ${agentId} unregistered successfully`
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to unregister agent: ${error.message}`);
    }
  }

  /**
   * Get active agents
   */
  async getActiveAgents() {
    try {
      const features = await this._loadFeatures();

      if (!features.agents) {
        return {
          success: true,
          agents: [],
          message: 'No agents registered in the system'
        };
      }

      const agents = Object.values(features.agents);

      return {
        success: true,
        agents,
        count: agents.length,
        message: `Found ${agents.length} registered agents`
      };
    } catch (error) {
      throw new Error(`Failed to get active agents: ${error.message}`);
    }
  }

  /**
   * Start WebSocket server for real-time updates
   */
  async startWebSocketServer(port = 8080) {
    try {
      if (this.wss) {
        return {
          success: true,
          message: 'WebSocket server is already running',
          port: this.wsPort
        };
      }

      const WebSocket = require('ws');
      this.wss = new WebSocket.Server({ port });
      this.wsPort = port;

      this.wss.on('connection', (ws) => {
        console.log('New WebSocket client connected');

        // Send initial status
        ws.send(JSON.stringify({
          type: 'connection_established',
          timestamp: new Date().toISOString(),
          message: 'Connected to TaskManager WebSocket server'
        }));

        ws.on('close', () => {
          console.log('WebSocket client disconnected');
        });
      });

      // Set up periodic status updates
      this.statusUpdateInterval = setInterval(() => {
        this._broadcastStatusUpdate();
      }, 30000); // Every 30 seconds

      return {
        success: true,
        message: `WebSocket server started on port ${port}`,
        port,
        endpoint: `ws://localhost:${port}`
      };
    } catch (error) {
      throw new Error(`Failed to start WebSocket server: ${error.message}`);
    }
  }

  /**
   * Broadcast status update to all connected WebSocket clients
   */
  async _broadcastStatusUpdate() {
    if (!this.wss) return;

    try {
      const stats = await this.getTaskStatistics();
      const agents = await this.getActiveAgents();

      const statusUpdate = {
        type: 'status_update',
        timestamp: new Date().toISOString(),
        task_statistics: stats.statistics,
        active_agents: agents.count,
        system_status: 'operational'
      };

      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(statusUpdate));
        }
      });
    } catch (error) {
      console.error('Failed to broadcast status update:', error);
    }
  }

  // =================== UTILITY METHODS ===================
  // Helper methods for feature management and task orchestration

  /**
   * Validate feature data structure and required fields
   */
  _validateFeatureData(featureData) {
    if (!featureData || typeof featureData !== 'object') {
      throw new Error('Feature data must be a valid object');
    }

    // Check required fields
    for (const field of this.requiredFields) {
      if (!featureData[field] || (typeof featureData[field] === 'string' && featureData[field].trim() === '')) {
        throw new Error(`Required field '${field}' is missing or empty`);
      }
    }

    // Validate category
    if (!this.validCategories.includes(featureData.category)) {
      throw new Error(`Invalid category '${featureData.category}'. Must be one of: ${this.validCategories.join(', ')}`);
    }

    // Validate title length
    if (featureData.title.length < 10 || featureData.title.length > 200) {
      throw new Error('Feature title must be between 10 and 200 characters');
    }

    // Validate description length
    if (featureData.description.length < 20 || featureData.description.length > 2000) {
      throw new Error('Feature description must be between 20 and 2000 characters');
    }

    // Validate business value length
    if (featureData.business_value.length < 10 || featureData.business_value.length > 1000) {
      throw new Error('Business value must be between 10 and 1000 characters');
    }
  }

  /**
   * Generate unique feature ID
   */
  _generateFeatureId() {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString('hex');
    return `feature_${timestamp}_${randomString}`;
  }

  /**
   * Load features from FEATURES.json
   */
  async _loadFeatures() {
    try {
      const data = await fs.readFile(this.featuresPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it
        await this._ensureFeaturesFile();
        return this._loadFeatures();
      }
      throw new Error(`Failed to load features: ${error.message}`);
    }
  }

  /**
   * Save features to FEATURES.json
   */
  async _saveFeatures(features) {
    try {
      await fs.writeFile(this.featuresPath, JSON.stringify(features, null, 2));
    } catch (error) {
      throw new Error(`Failed to save features: ${error.message}`);
    }
  }

  /**
   * Atomic operation: Load, modify, and save features with file locking
   * @param {Function} modifier - Function that modifies the features object
   * @returns {Promise<Object>} Result from the modifier function
   */
  async _atomicFeatureOperation(modifier) {
    const releaseLock = await fileLock.acquire(this.featuresPath);

    try {
      await this._ensureFeaturesFile();
      const features = await this._loadFeatures();
      const result = await modifier(features);
      await this._saveFeatures(features);
      return result;
    } finally {
      releaseLock();
    }
  }

  getApiMethods() {
    return {
      success: true,
      message: 'Feature Management API - Feature lifecycle operations',
      cliMapping: {
        // Discovery Commands
        guide: 'getComprehensiveGuide',
        methods: 'getApiMethods',

        // Feature Management
        'suggest-feature': 'suggestFeature',
        'approve-feature': 'approveFeature',
        'reject-feature': 'rejectFeature',
        'list-features': 'listFeatures',
        'feature-stats': 'getFeatureStats',
        'get-initialization-stats': 'getInitializationStats',
      },
      availableCommands: [
        // Discovery Commands
        'guide', 'methods',

        // Feature Management
        'suggest-feature', 'approve-feature', 'reject-feature', 'list-features', 'feature-stats', 'get-initialization-stats',
      ],
      guide: this._getFallbackGuide('api-methods'),
    };
  }

  async getComprehensiveGuide() {
    try {
      return await this.withTimeout(
        (() => {
          return {
            success: true,
            featureManager: {
              version: '3.0.0',
              description:
                'Feature lifecycle management system with strict approval workflow',
            },
            featureWorkflow: {
              description: 'Strict feature approval and implementation workflow',
              statuses: {
                suggested: 'Initial feature suggestion - requires approval',
                approved: 'Feature approved for implementation',
                rejected: 'Feature rejected with reason',
                implemented: 'Feature successfully implemented',
              },
              transitions: {
                'suggested → approved': 'Via approve-feature command',
                'suggested → rejected': 'Via reject-feature command',
                'approved → implemented': 'Manual status update after implementation',
              },
            },
            coreCommands: {
              discovery: {
                guide: {
                  description: 'Get this comprehensive guide',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
                  output: 'Complete API documentation and usage information',
                },
                methods: {
                  description: 'List all available API methods',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" methods',
                  output: 'Available methods and usage examples',
                },
              },
              featureManagement: {
                'suggest-feature': {
                  description: 'Create new feature suggestion',
                  usage:
                    'node taskmanager-api.js suggest-feature \'{"title":"Feature name", "description":"Details", "business_value":"Value proposition", "category":"enhancement|bug-fix|new-feature|performance|security|documentation"}\'',
                  required_fields: ['title', 'description', 'business_value', 'category'],
                  validation: 'All required fields must be provided with proper lengths',
                },
                'approve-feature': {
                  description: 'Approve suggested feature for implementation',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" approve-feature <featureId> [approvalData]',
                  required_parameters: ['featureId'],
                  optional_parameters: ['approvalData'],
                  output: 'Feature approval confirmation',
                },
                'reject-feature': {
                  description: 'Reject suggested feature with reason',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reject-feature <featureId> [rejectionData]',
                  required_parameters: ['featureId'],
                  optional_parameters: ['rejectionData'],
                  output: 'Feature rejection confirmation',
                },
                'list-features': {
                  description: 'List features with optional filtering',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-features [filter]',
                  examples: [
                    'node taskmanager-api.js list-features \'{"status":"suggested"}\'',
                    'node taskmanager-api.js list-features \'{"category":"enhancement"}\'',
                  ],
                },
                'feature-stats': {
                  description: 'Get feature statistics and analytics',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats',
                  output: 'Feature counts by status, category, and recent activity',
                },
                'get-initialization-stats': {
                  description: 'Get initialization usage statistics organized by 5-hour time buckets with daily advancing start times',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats',
                  output: 'Initialization and reinitialization counts by time buckets, daily totals, and recent activity',
                  time_buckets_info: 'Start time advances by 1 hour daily - Today starts at 7am, tomorrow at 8am, etc.',
                  features: ['General usage tracking', 'Daily advancing time buckets', 'Historical data (30 days)', 'Current bucket indication'],
                },
              },
              agentManagement: {
                'initialize': {
                  description: 'Initialize a new agent session',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize <agentId>',
                  required_parameters: ['agentId'],
                  output: 'Agent initialization confirmation with session details',
                },
                'reinitialize': {
                  description: 'Reinitialize existing agent session',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize <agentId>',
                  required_parameters: ['agentId'],
                  output: 'Agent reinitialization confirmation with new session details',
                },
                'authorize-stop': {
                  description: 'Self-authorize stop when all TodoWrite tasks complete and project is perfect',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" authorize-stop <agentId> [reason]',
                  required_parameters: ['agentId'],
                  optional_parameters: ['reason'],
                  output: 'Stop authorization confirmation - creates .stop-allowed flag',
                  requirements: ['All TodoWrite tasks completed', 'Linter passes', 'Build succeeds', 'Start works', 'Tests pass'],
                },
              },
            },
            workflows: {
              featureLifecycle: [
                "1. Create feature suggestion with 'suggest-feature'",
                '2. Review and approve/reject with approval workflow',
                '3. Implement approved features',
                '4. Update status to implemented after completion',
              ],
              approvalWorkflow: [
                "1. Features start in 'suggested' status",
                "2. Use 'approve-feature' to approve for implementation",
                "3. Use 'reject-feature' to reject with reason",
                '4. Only approved features should be implemented',
              ],
              agentLifecycle: [
                "1. Initialize agent with 'initialize' command",
                '2. Agent claims features or focuses on codebase review',
                '3. Complete all TodoWrite tasks with validation cycles',
                "4. Self-authorize stop with 'authorize-stop' when project perfect",
                "5. Use 'reinitialize' to restart existing agent sessions",
              ],
            },
            examples: {
              featureCreation: {
                enhancement:
                  'node taskmanager-api.js suggest-feature \'{"title":"Add dark mode toggle", "description":"Implement theme switching functionality", "business_value":"Improves user experience and accessibility", "category":"enhancement"}\'',
                newFeature:
                  'node taskmanager-api.js suggest-feature \'{"title":"User authentication system", "description":"Complete login/logout functionality", "business_value":"Enables user-specific features and security", "category":"new-feature"}\'',
                bugFix:
                  'node taskmanager-api.js suggest-feature \'{"title":"Fix login form validation", "description":"Resolve email validation issues", "business_value":"Prevents user frustration and data issues", "category":"bug-fix"}\'',
              },
              approvalWorkflow: {
                approve: [
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" approve-feature feature_123',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" approve-feature feature_123 \'{"approved_by":"product-owner", "notes":"High priority for next release"}\'',
                ],
                reject: [
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reject-feature feature_456',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reject-feature feature_456 \'{"rejected_by":"architect", "reason":"Technical complexity too high"}\'',
                ],
              },
              initializationTracking: {
                getStats: 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats',
                description: 'Retrieve initialization usage statistics organized by 5-hour time buckets with daily advancing start times',
                timeBucketInfo: 'Start time advances by 1 hour each day - Today: 7am start, Tomorrow: 8am start, etc.',
                sampleOutput: {
                  success: true,
                  stats: {
                    total_initializations: 45,
                    total_reinitializations: 23,
                    current_day: '2025-09-23',
                    current_bucket: '07:00-11:59',
                    time_buckets: {
                      '07:00-11:59': { initializations: 5, reinitializations: 2, total: 7 },
                      '12:00-16:59': { initializations: 8, reinitializations: 1, total: 9 },
                      '17:00-21:59': { initializations: 3, reinitializations: 4, total: 7 },
                      '22:00-02:59': { initializations: 1, reinitializations: 0, total: 1 },
                      '03:00-06:59': { initializations: 0, reinitializations: 1, total: 1 },
                    },
                  },
                },
              },
            },
            requirements: {
              mandatory: [
                'All features MUST include required fields: title, description, business_value, category',
                'Features MUST be approved before implementation',
                'Feature suggestions MUST include clear business value',
                'Categories MUST be valid: enhancement, bug-fix, new-feature, performance, security, documentation',
              ],
              bestPractices: [
                'Provide detailed descriptions explaining the feature thoroughly',
                'Include clear business justification in business_value field',
                'Use appropriate categories for better organization',
                'Review feature suggestions regularly for approval/rejection',
              ],
            },
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: this._getFallbackGuide('general'),
      };
    }
  }

  // =================== INITIALIZATION TRACKING METHODS ===================

  /**
   * Get current 5-hour time bucket with daily advancing start time
   * Today starts at 7am, tomorrow at 8am, day after at 9am, etc.
   */
  _getCurrentTimeBucket() {
    const now = new Date();
    const currentHour = now.getHours();

    // Use September 23, 2025 as reference date when start time was 7am
    const referenceDate = new Date('2025-09-23');
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate days since reference date
    const daysSinceReference = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

    // Starting hour advances by 1 each day, starting from 7am on reference date
    const todayStartHour = (7 + daysSinceReference) % 24;

    // Calculate which 5-hour bucket we're in (0-4)
    const hourOffset = (currentHour - todayStartHour + 24) % 24;
    const bucketIndex = Math.floor(hourOffset / 5);

    // Generate bucket label based on today's start hour
    const bucketStartHours = [];
    for (let i = 0; i < 5; i++) {
      bucketStartHours.push((todayStartHour + (i * 5)) % 24);
    }

    const startHour = bucketStartHours[bucketIndex];
    const endHour = (startHour + 4) % 24;

    // Format hours as HH:MM
    const formatHour = (h) => h.toString().padStart(2, '0') + ':00';
    const formatEndHour = (h) => h.toString().padStart(2, '0') + ':59';

    return `${formatHour(startHour)}-${formatEndHour(endHour)}`;
  }

  /**
   * Get all 5-hour time bucket labels for the current day
   */
  _getTodayTimeBuckets() {
    const now = new Date();

    // Use September 23, 2025 as reference date when start time was 7am
    const referenceDate = new Date('2025-09-23');
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate days since reference date
    const daysSinceReference = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

    // Starting hour advances by 1 each day, starting from 7am on reference date
    const todayStartHour = (7 + daysSinceReference) % 24;

    const buckets = [];
    for (let i = 0; i < 5; i++) {
      const startHour = (todayStartHour + (i * 5)) % 24;
      const endHour = (startHour + 4) % 24;

      const formatHour = (h) => h.toString().padStart(2, '0') + ':00';
      const formatEndHour = (h) => h.toString().padStart(2, '0') + ':59';

      buckets.push(`${formatHour(startHour)}-${formatEndHour(endHour)}`);
    }

    return buckets;
  }

  /**
   * Ensure initialization stats structure exists in features data
   */
  _ensureInitializationStatsStructure(features) {
    if (!features.metadata) {
      features.metadata = {
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        total_features: features.features ? features.features.length : 0,
        approval_history: [],
      };
    }

    if (!features.metadata.initialization_stats) {
      // Generate today's time buckets dynamically
      const todayBuckets = this._getTodayTimeBuckets();
      const timeBuckets = {};
      todayBuckets.forEach(bucket => {
        timeBuckets[bucket] = { init: 0, reinit: 0 };
      });

      features.metadata.initialization_stats = {
        total_initializations: 0,
        total_reinitializations: 0,
        current_day: new Date().toISOString().split('T')[0],
        time_buckets: timeBuckets,
        daily_history: [],
        last_reset: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };
    } else {
      // Check if we need to update bucket labels for today
      const todayBuckets = this._getTodayTimeBuckets();
      const currentBuckets = Object.keys(features.metadata.initialization_stats.time_buckets);

      // If bucket labels don't match today's labels, we need to migrate
      const bucketsMatch = todayBuckets.every(bucket => currentBuckets.includes(bucket)) &&
                          currentBuckets.every(bucket => todayBuckets.includes(bucket));

      if (!bucketsMatch) {
        // Migrate existing data to new bucket structure if possible
        const stats = features.metadata.initialization_stats;
        const newTimeBuckets = {};

        todayBuckets.forEach(bucket => {
          newTimeBuckets[bucket] = { init: 0, reinit: 0 };
        });

        // If this is a day change, preserve the data in history but reset buckets
        const currentDay = new Date().toISOString().split('T')[0];
        if (stats.current_day !== currentDay) {
          // Save old data to history before resetting
          const oldTotal = Object.values(stats.time_buckets).reduce(
            (acc, bucket) => ({
              init: acc.init + bucket.init,
              reinit: acc.reinit + bucket.reinit,
            }),
            { init: 0, reinit: 0 },
          );

          if (oldTotal.init > 0 || oldTotal.reinit > 0) {
            stats.daily_history.push({
              date: stats.current_day,
              total_init: oldTotal.init,
              total_reinit: oldTotal.reinit,
              buckets: { ...stats.time_buckets },
            });

            // Keep only last 30 days of history
            if (stats.daily_history.length > 30) {
              stats.daily_history = stats.daily_history.slice(-30);
            }
          }

          stats.current_day = currentDay;
        }

        stats.time_buckets = newTimeBuckets;
        stats.last_reset = new Date().toISOString();
      }
    }

    return features;
  }

  /**
   * Update time bucket statistics for initialization or reinitialization
   */
  async _updateTimeBucketStats(type) {
    try {
      await this._atomicFeatureOperation((features) => {
        this._ensureInitializationStatsStructure(features);
        this._resetDailyBucketsIfNeeded(features);

        const currentBucket = this._getCurrentTimeBucket();
        const stats = features.metadata.initialization_stats;

        // Update counters
        if (type === 'init') {
          stats.total_initializations++;
          stats.time_buckets[currentBucket].init++;
        } else if (type === 'reinit') {
          stats.total_reinitializations++;
          stats.time_buckets[currentBucket].reinit++;
        }

        stats.last_updated = new Date().toISOString();
        return true;
      });

      return true;
    } catch (error) {
      console.error('Failed to update time bucket stats:', error.message);
      return false;
    }
  }

  /**
   * Reset daily buckets if we've crossed 7am
   */
  _resetDailyBucketsIfNeeded(features) {
    const now = new Date();
    const currentDay = now.toISOString().split('T')[0];
    const stats = features.metadata.initialization_stats;

    // Check if we need to reset (new day and past 7am, or last reset was yesterday)
    const lastResetDate = new Date(stats.last_reset);
    const lastResetDay = lastResetDate.toISOString().split('T')[0];

    if (currentDay !== stats.current_day && currentDay !== lastResetDay) {
      // Save yesterday's data to history
      const yesterdayTotal = Object.values(stats.time_buckets).reduce(
        (acc, bucket) => ({
          init: acc.init + bucket.init,
          reinit: acc.reinit + bucket.reinit,
        }),
        { init: 0, reinit: 0 },
      );

      if (yesterdayTotal.init > 0 || yesterdayTotal.reinit > 0) {
        stats.daily_history.push({
          date: stats.current_day,
          total_init: yesterdayTotal.init,
          total_reinit: yesterdayTotal.reinit,
          buckets: { ...stats.time_buckets },
        });

        // Keep only last 30 days of history
        if (stats.daily_history.length > 30) {
          stats.daily_history = stats.daily_history.slice(-30);
        }
      }

      // Reset buckets for new day with updated bucket labels
      const newBuckets = this._getTodayTimeBuckets();
      const newTimeBuckets = {};
      newBuckets.forEach(bucket => {
        newTimeBuckets[bucket] = { init: 0, reinit: 0 };
      });

      stats.time_buckets = newTimeBuckets;
      stats.current_day = currentDay;
      stats.last_reset = now.toISOString();
    }
  }

  // =================== HELPER METHODS ===================

  _getFallbackGuide(context = 'general') {
    return {
      message: `Feature Management API Guide - ${context}`,
      helpText: 'For complete API usage guidance, run the guide command',
      commands: [
        'guide - Get comprehensive guide',
        'methods - List available methods',
        'suggest-feature - Create feature suggestion',
        'approve-feature - Approve feature',
        'reject-feature - Reject feature',
        'list-features - List features',
        'feature-stats - Get feature statistics',
        'get-initialization-stats - Get initialization usage statistics by time buckets',
      ],
    };
  }

/**
 * Generate unique task ID
 */
_generateTaskId() {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  return `task_${timestamp}_${randomString}`;
}

/**
 * Infer task type from feature characteristics
 */
_inferTaskType(feature) {
  if (feature.category === 'bug-fix') return 'implementation';
  if (feature.category === 'security') return 'analysis';
  if (feature.category === 'performance') return 'analysis';
  if (feature.category === 'documentation') return 'documentation';
  return 'implementation';
}

/**
 * Infer task priority from feature characteristics
 */
_inferTaskPriority(feature) {
  if (feature.category === 'security') return 'critical';
  if (feature.category === 'bug-fix') return 'high';
  if (feature.category === 'performance') return 'high';
  if (feature.business_value && feature.business_value.toLowerCase().includes('critical')) return 'critical';
  if (feature.business_value && feature.business_value.toLowerCase().includes('essential')) return 'high';
  return 'normal';
}

/**
 * Estimate effort required for feature implementation
 */
_estimateEffort(feature) {
  let baseEffort = 5; // Base effort in hours

  // Adjust based on category
  if (feature.category === 'new-feature') baseEffort *= 2;
  if (feature.category === 'enhancement') baseEffort *= 1.5;
  if (feature.category === 'security') baseEffort *= 1.8;

  // Adjust based on description length (complexity indicator)
  const complexityMultiplier = Math.min(feature.description.length / 500, 3);
  baseEffort *= (1 + complexityMultiplier);

  return Math.ceil(baseEffort);
}

/**
 * Infer required capabilities from feature characteristics
 */
_inferCapabilities(feature) {
  const capabilities = [];

  if (feature.category === 'security') capabilities.push('security');
  if (feature.category === 'performance') capabilities.push('performance');
  if (feature.category === 'documentation') capabilities.push('documentation');
  if (feature.category === 'bug-fix') capabilities.push('analysis');

  // Check description for technology hints
  const description = feature.description.toLowerCase();
  if (description.includes('frontend') || description.includes('ui') || description.includes('interface')) {
    capabilities.push('frontend');
  }
  if (description.includes('backend') || description.includes('api') || description.includes('server')) {
    capabilities.push('backend');
  }
  if (description.includes('test') || description.includes('testing')) {
    capabilities.push('testing');
  }

  return capabilities.length > 0 ? capabilities : ['general'];
}

/**
 * Determine if feature is complex enough to warrant supporting tasks
 */
_isComplexFeature(feature) {
  return feature.category === 'new-feature' ||
         feature.description.length > 800 ||
         feature.business_value.toLowerCase().includes('comprehensive');
}

/**
 * Generate supporting tasks for complex features
 */
_generateSupportingTasks(feature, mainTaskId) {
  const supportingTasks = [];

  // Always add testing task for complex features
  supportingTasks.push({
    id: this._generateTaskId(),
    feature_id: feature.id,
    title: `Test: ${feature.title}`,
    description: `Comprehensive testing for ${feature.title}`,
    type: 'testing',
    priority: this._inferTaskPriority(feature),
    status: 'queued',
    dependencies: [mainTaskId],
    estimated_effort: Math.ceil(this._estimateEffort(feature) * 0.6),
    required_capabilities: ['testing'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'autonomous_system',
    metadata: {
      auto_generated: true,
      supporting_task: true,
      main_task_id: mainTaskId
    }
  });

  // Add documentation task for new features
  if (feature.category === 'new-feature') {
    supportingTasks.push({
      id: this._generateTaskId(),
      feature_id: feature.id,
      title: `Document: ${feature.title}`,
      description: `Documentation for ${feature.title}`,
      type: 'documentation',
      priority: 'normal',
      status: 'queued',
      dependencies: [mainTaskId],
      estimated_effort: Math.ceil(this._estimateEffort(feature) * 0.3),
      required_capabilities: ['documentation'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'autonomous_system',
      metadata: {
        auto_generated: true,
        supporting_task: true,
        main_task_id: mainTaskId
      }
    });
  }

  return supportingTasks;
}

  /**
   * Cleanup resources and connections
   */
  cleanup() {
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.wss.close();
    }

    // Clear any intervals or timers
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
  }
}

// CLI interface
async function main() {
  // Use the already parsed args (with --project-root removed)
  const command = args[0];
  const api = new AutonomousTaskManagerAPI();

  try {
    let result;

    // Handle commands directly
    switch (command) {
      case 'guide':
        result = await api.getComprehensiveGuide();
        break;
      case 'methods':
        result = api.getApiMethods();
        break;
      case 'suggest-feature': {
        if (!args[1]) {
          throw new Error('Feature data required. Usage: suggest-feature \'{"title":"...", "description":"...", "business_value":"...", "category":"..."}\'');
        }
        const featureData = JSON.parse(args[1]);
        result = await api.suggestFeature(featureData);
        break;
      }
      case 'approve-feature': {
        if (!args[1]) {
          throw new Error('Feature ID required. Usage: approve-feature <featureId> [approvalData]');
        }
        const approvalData = args[2] ? JSON.parse(args[2]) : {};
        result = await api.approveFeature(args[1], approvalData);
        break;
      }
      case 'bulk-approve-features': {
        if (!args[1]) {
          throw new Error('Feature IDs required. Usage: bulk-approve-features \'["id1","id2","id3"]\' [approvalData]');
        }
        const featureIds = JSON.parse(args[1]);
        const approvalData = args[2] ? JSON.parse(args[2]) : {};
        result = await api.bulkApproveFeatures(featureIds, approvalData);
        break;
      }
      case 'reject-feature': {
        if (!args[1]) {
          throw new Error('Feature ID required. Usage: reject-feature <featureId> [rejectionData]');
        }
        const rejectionData = args[2] ? JSON.parse(args[2]) : {};
        result = await api.rejectFeature(args[1], rejectionData);
        break;
      }
      case 'list-features': {
        const filter = args[1] ? JSON.parse(args[1]) : {};
        result = await api.listFeatures(filter);
        break;
      }
      case 'feature-stats':
        result = await api.getFeatureStats();
        break;
      case 'get-initialization-stats':
        result = await api.getInitializationStats();
        break;
      case 'initialize':
        if (!args[1]) {
          throw new Error('Agent ID required. Usage: initialize <agentId>');
        }
        result = await api.initializeAgent(args[1]);
        break;
      case 'reinitialize':
        if (!args[1]) {
          throw new Error('Agent ID required. Usage: reinitialize <agentId>');
        }
        result = await api.reinitializeAgent(args[1]);
        break;
      case 'authorize-stop': {
        if (!args[1]) {
          throw new Error('Agent ID required. Usage: authorize-stop <agentId> [reason]');
        }
        const stopReason = args[2] || 'Agent authorized stop after completing all tasks and achieving project perfection';
        result = await api.authorizeStop(args[1], stopReason);
        break;
      }

      // New autonomous task management commands
      case 'create-task': {
        if (!args[1]) {
          throw new Error('Task data required. Usage: create-task \'{"title":"...", "description":"...", "type":"...", "priority":"..."}\'');
        }
        const taskData = JSON.parse(args[1]);
        result = await api.createTask(taskData);
        break;
      }
      case 'get-task': {
        if (!args[1]) {
          throw new Error('Task ID required. Usage: get-task <taskId>');
        }
        result = await api.getTask(args[1]);
        break;
      }
      case 'update-task': {
        if (!args[1] || !args[2]) {
          throw new Error('Task ID and updates required. Usage: update-task <taskId> \'{"status":"...", "progress":"..."}\'');
        }
        const updates = JSON.parse(args[2]);
        result = await api.updateTask(args[1], updates);
        break;
      }
      case 'assign-task': {
        if (!args[1] || !args[2]) {
          throw new Error('Task ID and Agent ID required. Usage: assign-task <taskId> <agentId>');
        }
        result = await api.assignTask(args[1], args[2]);
        break;
      }
      case 'complete-task': {
        if (!args[1] || !args[2]) {
          throw new Error('Task ID and result data required. Usage: complete-task <taskId> \'{"result":"...", "output":"..."}\'');
        }
        const resultData = JSON.parse(args[2]);
        result = await api.completeTask(args[1], resultData);
        break;
      }
      case 'get-agent-tasks': {
        if (!args[1]) {
          throw new Error('Agent ID required. Usage: get-agent-tasks <agentId>');
        }
        result = await api.getAgentTasks(args[1]);
        break;
      }
      case 'get-tasks-by-status': {
        if (!args[1]) {
          throw new Error('Status required. Usage: get-tasks-by-status <status>');
        }
        result = await api.getTasksByStatus(args[1]);
        break;
      }
      case 'get-tasks-by-priority': {
        if (!args[1]) {
          throw new Error('Priority required. Usage: get-tasks-by-priority <priority>');
        }
        result = await api.getTasksByPriority(args[1]);
        break;
      }
      case 'get-available-tasks': {
        if (!args[1]) {
          throw new Error('Agent ID required. Usage: get-available-tasks <agentId>');
        }
        result = await api.getAvailableTasksForAgent(args[1]);
        break;
      }
      case 'create-tasks-from-features': {
        const options = args[1] ? JSON.parse(args[1]) : {};
        result = await api.createTasksFromApprovedFeatures(options);
        break;
      }
      case 'get-task-queue': {
        const filters = args[1] ? JSON.parse(args[1]) : {};
        result = await api.getTaskQueue(filters);
        break;
      }
      case 'get-task-stats':
        result = await api.getTaskStatistics();
        break;
      case 'optimize-assignments':
        result = await api.optimizeTaskAssignments();
        break;
      case 'start-websocket': {
        if (!args[1]) {
          throw new Error('Port required. Usage: start-websocket <port>');
        }
        const port = parseInt(args[1]);
        result = await api.startWebSocketServer(port);
        // Keep process alive for WebSocket server
        console.log(JSON.stringify(result, null, 2));
        console.log('WebSocket server running. Press Ctrl+C to stop.');
        process.on('SIGINT', () => {
          console.log('\nShutting down WebSocket server...');
          api.cleanup();
          process.exit(0);
        });
        // Don't exit for WebSocket server
        return;
      }
      case 'register-agent': {
        if (!args[1] || !args[2]) {
          throw new Error('Agent ID and capabilities required. Usage: register-agent <agentId> \'["capability1","capability2"]\'');
        }
        const capabilities = JSON.parse(args[2]);
        result = await api.registerAgent(args[1], capabilities);
        break;
      }
      case 'unregister-agent': {
        if (!args[1]) {
          throw new Error('Agent ID required. Usage: unregister-agent <agentId>');
        }
        result = await api.unregisterAgent(args[1]);
        break;
      }
      case 'get-active-agents':
        result = await api.getActiveAgents();
        break;

      default:
        throw new Error(`Unknown command: ${command}. Available commands: guide, methods, suggest-feature, approve-feature, bulk-approve-features, reject-feature, list-features, feature-stats, get-initialization-stats, initialize, reinitialize, authorize-stop, create-task, get-task, update-task, assign-task, complete-task, get-agent-tasks, get-tasks-by-status, get-tasks-by-priority, get-available-tasks, create-tasks-from-features, get-task-queue, get-task-stats, optimize-assignments, start-websocket, register-agent, unregister-agent, get-active-agents`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const errorResponse = {
      success: false,
      error: error.message,
      command,
      timestamp: new Date().toISOString(),
      guide: api._getFallbackGuide('autonomous-task-management'),
    };

    console.error(JSON.stringify(errorResponse, null, 2));
    throw new Error('Autonomous Task Management API execution failed');
  } finally {
    await api.cleanup();
  }
}

// Export for programmatic use
module.exports = AutonomousTaskManagerAPI;

// Run CLI if called directly (CommonJS equivalent)
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    throw error;
  });
}