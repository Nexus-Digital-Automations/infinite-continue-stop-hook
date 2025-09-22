#!/usr/bin/env node
/* eslint-disable no-console -- CLI API requires console output for user interaction */
/**
 * Feature Management API - Streamlined Feature Lifecycle Management
 *
 * === OVERVIEW ===
 * Focused API for feature lifecycle management with strict approval workflow.
 * This system manages feature suggestions, approvals, and implementation tracking
 * with complete audit trails and governance controls.
 *
 * === KEY FEATURES ===
 * • Feature suggestion and approval workflow
 * • Strict status transitions: suggested → approved → implemented
 * • Complete audit trail for all feature lifecycle changes
 * • FEATURES.json-based persistence
 * • Business value tracking and validation
 * • Implementation status monitoring
 *
 * === FEATURE WORKFLOW ===
 * 1. suggest-feature - Create new feature suggestion
 * 2. approve-feature - Approve suggested feature for implementation
 * 3. reject-feature - Reject feature suggestion with reason
 * 4. Implementation tracking for approved features
 * 5. Complete lifecycle analytics and reporting
 *
 * @author Feature Management System
 * @version 3.0.0
 * @since 2025-09-22
 *
 * Usage: node taskmanager-api.js <command> [args...] [--project-root /path/to/project]
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

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

/**
 * FeatureManagerAPI - Feature lifecycle management system
 *
 * Manages feature suggestions, approvals, and implementation tracking
 * with strict approval workflow and complete audit trails.
 */
class FeatureManagerAPI {
  constructor() {
    // Core feature data persistence
    this.featuresPath = FEATURES_PATH;

    // Performance configuration - 10 second timeout for all operations
    this.timeout = 10000;

    // Feature validation configuration
    this.validStatuses = FEATURE_STATUSES;
    this.validCategories = FEATURE_CATEGORIES;
    this.requiredFields = REQUIRED_FEATURE_FIELDS;

    // Initialize features file if it doesn't exist
    this._ensureFeaturesFile();
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
          approval_history: []
        },
        workflow_config: {
          require_approval: true,
          auto_reject_timeout_hours: 168,
          allowed_statuses: this.validStatuses,
          required_fields: this.requiredFields
        }
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
      // Validate required fields
      this._validateFeatureData(featureData);

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
        metadata: featureData.metadata || {}
      };

      const features = await this._loadFeatures();
      features.features.push(feature);
      features.metadata.total_features = features.features.length;
      features.metadata.updated = new Date().toISOString();

      await this._saveFeatures(features);

      return {
        success: true,
        feature,
        message: 'Feature suggestion created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Approve a suggested feature for implementation
   */
  async approveFeature(featureId, approvalData = {}) {
    try {
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

      // Add to approval history
      features.metadata.approval_history.push({
        feature_id: featureId,
        action: 'approved',
        timestamp: new Date().toISOString(),
        approved_by: feature.approved_by,
        notes: feature.approval_notes
      });

      features.metadata.updated = new Date().toISOString();
      await this._saveFeatures(features);

      return {
        success: true,
        feature,
        message: 'Feature approved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reject a suggested feature
   */
  async rejectFeature(featureId, rejectionData = {}) {
    try {
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

      // Add to approval history
      features.metadata.approval_history.push({
        feature_id: featureId,
        action: 'rejected',
        timestamp: new Date().toISOString(),
        rejected_by: feature.rejected_by,
        reason: feature.rejection_reason
      });

      features.metadata.updated = new Date().toISOString();
      await this._saveFeatures(features);

      return {
        success: true,
        feature,
        message: 'Feature rejected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List features with optional filtering
   */
  async listFeatures(filter = {}) {
    try {
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
        metadata: features.metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get feature statistics and analytics
   */
  async getFeatureStats() {
    try {
      const features = await this._loadFeatures();
      const stats = {
        total: features.features.length,
        by_status: {},
        by_category: {},
        recent_activity: []
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
        metadata: features.metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }






  // =================== REMAINING METHODS ===================
  // Methods that haven't been extracted yet

  async getApiMethods() {
    // Get guide information for response
    let guide = null;
    try {
      guide = await this._getGuideForError('api-methods');
    } catch {
      // Continue without guide if it fails
    }

    return {
      success: true,
      message: 'TaskManager API Methods - All available operations',
      cliMapping: {
        // Discovery Commands
        guide: 'getComprehensiveGuide',
        methods: 'getApiMethods',

        // Agent Lifecycle
        init: 'initAgent',
        reinitialize: 'reinitializeAgent',
        'list-agents': 'listAgents',
        status: 'getAgentStatus',
        current: 'getCurrentTask',
        stats: 'getStats',
        'usage-analytics': 'getUsageAnalytics',

        // Task Operations
        list: 'listTasks',
        create: 'createTask',
        'create-error': 'createErrorTask',
        claim: 'claimTask',
        complete: 'completeTask',
        delete: 'deleteTask',

        // Task Management
        'move-top': 'moveTaskToTop',
        'move-up': 'moveTaskUp',
        'move-down': 'moveTaskDown',
        'move-bottom': 'moveTaskToBottom',

        // Feature Management
        'suggest-feature': 'suggestFeature',
        'approve-feature': 'approveFeature',
        'reject-feature': 'rejectFeature',
        'list-suggested-features': 'listSuggestedFeatures',
        'list-features': 'listFeatures',
        'feature-stats': 'getFeatureStats',

        // Phase Management
        'create-phase': 'createPhase',
        'update-phase': 'updatePhase',
        'progress-phase': 'progressPhase',
        'list-phases': 'listPhases',
        'current-phase': 'getCurrentPhase',
        'phase-stats': 'getPhaseStats',

        // Agent Swarm Coordination
        'get-tasks': 'getTasksForAgentSwarm',

        // Embedded Subtasks
        'create-subtask': 'createSubtask',
        'list-subtasks': 'listSubtasks',
        'update-subtask': 'updateSubtask',
        'delete-subtask': 'deleteSubtask',

        // Success Criteria Management
        'add-success-criteria': 'addSuccessCriteria',
        'get-success-criteria': 'getSuccessCriteria',
        'update-success-criteria': 'updateSuccessCriteria',
        'set-project-criteria': 'setProjectCriteria',
        'validate-criteria': 'validateCriteria',
        'criteria-report': 'getCriteriaReport',

        // Research & Audit
        'research-task': 'manageResearchTask',
        'audit-task': 'manageAuditTask',

        // RAG Operations
        'store-lesson': 'storeLesson',
        'store-error': 'storeError',
        'search-lessons': 'searchLessons',
        'find-similar-errors': 'findSimilarErrors',
        'get-relevant-lessons': 'getRelevantLessons',
        'rag-analytics': 'getRagAnalytics',

        // RAG Command Aliases (CLAUDE.md compatibility)
        'rag-health': 'getRagAnalytics',
        'rag-search': 'searchLessons',
        'rag-similar-errors': 'findSimilarErrors',
        'rag-get-relevant': 'getRelevantLessons',
        'rag-store-lesson': 'storeLesson',
      },
      availableCommands: [
        // Discovery Commands
        'guide', 'methods',

        // Agent Lifecycle
        'init', 'reinitialize', 'list-agents', 'status', 'current', 'stats', 'usage-analytics',

        // Task Operations
        'list', 'create', 'create-error', 'claim', 'complete', 'delete',

        // Task Management
        'move-top', 'move-up', 'move-down', 'move-bottom',

        // Feature Management
        'suggest-feature', 'approve-feature', 'reject-feature', 'list-suggested-features', 'list-features', 'feature-stats',

        // Phase Management
        'create-phase', 'update-phase', 'progress-phase', 'list-phases', 'current-phase', 'phase-stats',

        // Agent Swarm Coordination
        'get-tasks',

        // Embedded Subtasks
        'create-subtask', 'list-subtasks', 'update-subtask', 'delete-subtask',

        // Success Criteria Management
        'add-success-criteria', 'get-success-criteria', 'update-success-criteria', 'set-project-criteria', 'validate-criteria', 'criteria-report',

        // Research & Audit
        'research-task', 'audit-task',

        // RAG Operations
        'store-lesson', 'store-error', 'search-lessons', 'find-similar-errors', 'get-relevant-lessons', 'rag-analytics',
        'rag-health', 'rag-search', 'rag-similar-errors', 'rag-get-relevant', 'rag-store-lesson',
      ],
      guide: guide || this._getFallbackGuide('api-methods'),
    };
  }

  async getComprehensiveGuide() {
    try {
      return await this.withTimeout(
        (() => {
          return {
            success: true,
            taskManager: {
              version: '2.0.0',
              description:
                'Universal TaskManager API for agent-driven development workflows',
            },
            taskClassification: {
              required: true,
              parameter: 'category',
              description:
                'All tasks MUST include explicit category parameter during creation',
              types: [
                {
                  value: 'error',
                  name: 'Error Task',
                  priority: 1,
                  description:
                    'System errors, linter violations, build failures, runtime bugs - HIGHEST PRIORITY',
                  examples: [
                    'Fix ESLint violations',
                    'Resolve build compilation errors',
                    'Fix runtime exceptions',
                  ],
                  triggers: [
                    'linter errors',
                    'build failures',
                    'startup errors',
                    'runtime bugs',
                    'security vulnerabilities',
                  ],
                },
                {
                  value: 'feature',
                  name: 'Feature Task',
                  priority: 2,
                  description:
                    'New functionality, enhancements, refactoring, documentation - HIGH PRIORITY',
                  examples: [
                    'Add user authentication',
                    'Implement dark mode',
                    'Refactor API endpoints',
                  ],
                  triggers: [
                    'new features requested',
                    'enhancements needed',
                    'code refactoring',
                    'documentation updates',
                  ],
                },
                {
                  value: 'subtask',
                  name: 'Subtask',
                  priority: 3,
                  description:
                    'Implementation of specific subtasks for preexisting features from TODO.json features array - MEDIUM PRIORITY',
                  examples: [
                    'Implement login form for auth feature',
                    'Add validation to signup process',
                  ],
                  triggers: [
                    'implementing approved feature components',
                    'feature breakdown tasks',
                  ],
                },
                {
                  value: 'test',
                  name: 'Test Task',
                  priority: 4,
                  description:
                    'Test coverage, test creation, test setup, test performance - LOWEST PRIORITY (ONLY AFTER ERRORS/FEATURES COMPLETE)',
                  examples: [
                    'Add unit tests for UserService',
                    'Implement E2E tests for login flow',
                  ],
                  triggers: [
                    'test coverage gaps',
                    'test setup needs',
                    'test performance issues',
                  ],
                  restrictions:
                    'BLOCKED until all error and feature tasks are resolved',
                },
              ],
              priorityRules: {
                '1_error':
                  'Always executed first - highest priority - can interrupt other work',
                '2_feature': 'Executed after all errors resolved',
                '3_subtask': 'Executed after new features complete',
                '4_test':
                  'Only executed when errors, features, and subtasks are complete',
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
                status: {
                  description: 'Get agent status and current tasks',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status <agentId>',
                  output: 'Agent state, assigned tasks, and system status',
                  agentIdRequirement: 'Agent ID is REQUIRED - no default or stored agent ID exists',
                },
              },
              agentLifecycle: {
                init: {
                  description: 'Initialize agent with TaskManager system',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init [config]',
                  required: 'Must be called before any task operations',
                  output: 'Agent ID and registration confirmation',
                },
                reinitialize: {
                  description:
                    'Agent reinitialization with explicit agent ID requirement',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [agentId] [config]',
                  required_parameter:
                    'agentId - Agent ID to reinitialize (REQUIRED - must be provided explicitly)',
                  when: 'After task completion, before long operations, after idle periods, or when unsure of agent status',
                  output:
                    'Updated agent status and renewed registration with scenario detection',
                  features: [
                    'Requires explicit agent ID for security and clarity',
                    'Cleans up stale agents automatically',
                    'Provides clear scenario feedback',
                    'Works with single or multiple agents',
                  ],
                  scenarios: {
                    explicit_agent: 'reinitialize specific_agent_id (required)',
                    with_config: 'reinitialize agent_id \'{"role":"testing"}\'',
                  },
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize development_session_123_general_abc',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize development_session_123_general_abc \'{"role":"testing"}\'',
                  ],
                  requirement:
                    'Agent ID must be provided explicitly - use your agent ID from previous init command',
                },
              },
              taskOperations: {
                create: {
                  description: 'Create new task with explicit classification',
                  usage:
                    'node taskmanager-api.js create \'{"title":"Task name", "description":"Details", "category":"error|feature|subtask|test"}\'',
                  required_fields: ['title', 'description', 'category'],
                  optional_fields: [
                    'priority',
                    'dependencies',
                    'important_files',
                  ],
                  validation:
                    'category must be specified for proper task classification',
                },
                claim: {
                  description: 'Claim task for agent execution',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim <taskId> <agentId> [priority]',
                  required_parameters: ['taskId', 'agentId'],
                  optional_parameters: ['priority'],
                  output: 'Task assignment confirmation',
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim task_123 agent_456',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim error_789 development_session_123_agent high',
                  ],
                  agentIdRequirement:
                    "Agent ID is ALWAYS REQUIRED and must be provided explicitly. No storage mechanism exists - you must provide the agent ID from the 'init' command output every time.",
                  agentIdSource: [
                    "Use agent ID from 'init' command output",
                    "Use 'list-agents' to find existing agent IDs",
                    'Agent IDs are not stored - must be provided with every command',
                  ],
                },
                complete: {
                  description:
                    'Mark task as completed with optional completion data',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete <taskId> [completionData]',
                  required: 'Only after full implementation and validation',
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 \'{"message": "Successfully implemented feature"}\'',
                    'node taskmanager-api.js complete error_456 \'{"fixed": true, "details": "Resolved linting errors in auth.js"}\'',
                    'node taskmanager-api.js complete feature_789 \'{"outcome": "Feature completed with full test coverage", "files_modified": ["src/auth.js", "tests/auth.test.js"]}\'',
                  ],
                  completionDataFormat: {
                    description: 'Optional JSON object with completion details',
                    commonFields: [
                      'message - Brief completion description',
                      'outcome - Detailed result explanation',
                      'files_modified - Array of files changed',
                      'details - Additional implementation notes',
                      'evidence - Proof of completion (test results, etc.)',
                      'fixed - Boolean for error tasks',
                      'tested - Boolean indicating if tests were run',
                    ],
                    validation: 'Must be valid JSON if provided',
                  },
                  errorHandling: {
                    invalidJson: 'Returns error with JSON parsing details',
                    missingTask: 'Returns error if taskId not found',
                    alreadyCompleted: 'Returns error if task already completed',
                  },
                },
                list: {
                  description: 'List tasks with optional filtering',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list [filter]',
                  examples: [
                    'node taskmanager-api.js list \'{"status":"pending"}\'',
                    'node taskmanager-api.js list \'{"category":"error"}\'',
                  ],
                },
              },
            },
            workflows: {
              taskCreationWorkflow: [
                "1. Call 'guide' endpoint to understand task classification",
                '2. Analyze request to determine appropriate category',
                '3. Create task with explicit category parameter',
                '4. System automatically assigns priority based on category',
                '5. Task added to appropriate priority queue',
              ],
              agentWorkflow: [
                "1. Initialize agent with 'init' command",
                '2. Check status and available tasks',
                '3. Claim highest priority available task',
                '4. Execute task implementation',
                '5. Complete task with evidence',
                '6. Reinitialize before next task',
              ],
              priorityEnforcement: [
                'ERROR tasks bypass all other ordering - executed immediately',
                'FEATURE tasks blocked until all errors resolved',
                'SUBTASK tasks blocked until all features complete',
                'TEST tasks blocked until errors, features, subtasks complete',
              ],
            },
            examples: {
              taskCreation: {
                errorTask:
                  'node taskmanager-api.js create \'{"title":"Fix ESLint violations in auth.js", "description":"Resolve linting errors", "category":"error"}\'',
                featureTask:
                  'node taskmanager-api.js create \'{"title":"Add dark mode toggle", "description":"Implement theme switching", "category":"feature"}\'',
                subtaskTask:
                  'node taskmanager-api.js create \'{"title":"Implement login form", "description":"Create login UI for auth feature", "category":"subtask"}\'',
                testTask:
                  'node taskmanager-api.js create \'{"title":"Add UserService tests", "description":"Unit test coverage", "category":"test"}\'',
              },
              commonWorkflows: {
                newAgent: [
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status',
                ],
                taskExecution: [
                  'node taskmanager-api.js list \'{"status":"pending"}\'',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim <taskId> <agentId>',
                  '# ... implement task ...',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete <taskId>',
                ],
              },
            },
            requirements: {
              mandatory: [
                'All task creation MUST include explicit category parameter',
                'Agent MUST call init before any task operations',
                'Agent MUST reinitialize after task completion',
                'Test tasks MUST NOT be created until errors/features complete',
              ],
              bestPractices: [
                'Use guide endpoint to understand system before starting',
                'Check status regularly to monitor system state',
                'Provide detailed task descriptions for better coordination',
                'Include important_files for tasks that modify specific files',
              ],
            },
            troubleshooting: {
              commonIssues: {
                completionErrors: {
                  problem: 'Task completion fails with JSON formatting errors',
                  cause: 'Invalid JSON format in completion data parameter',
                  solutions: [
                    'Ensure JSON is properly quoted: \'{"message": "Task completed"}\'',
                    'Use double quotes inside JSON, single quotes outside',
                    'Validate JSON format before passing to complete command',
                    'Use minimal completion: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete taskId',
                  ],
                  examples: {
                    correct:
                      'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 \'{"message": "Success"}\'',
                    incorrect:
                      'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 {"message": "Success"}',
                  },
                },
                methodConfusion: {
                  problem: 'Confusion between CLI commands and API methods',
                  explanation:
                    "CLI command 'complete' maps to API method 'completeTask'",
                  solution:
                    'Use CLI commands in terminal, API methods are internal implementations',
                  reference:
                    'See cliMapping in methods output for complete mapping',
                },
                agentInitialization: {
                  problem: 'Agent ID is required errors',
                  explanation:
                    'ALL task operations ALWAYS require explicit agent ID parameter - NO storage mechanism exists',
                  keyPoints: [
                    'Agent IDs are NEVER stored automatically',
                    'You MUST provide agent ID with every command',
                    'No auto-detection, no defaults, no session storage',
                  ],
                  solutions: [
                    "FIRST TIME: Run 'timeout 10s node taskmanager-api.js init' and COPY the returned agentId",
                    'SAVE AGENT ID: Store the agent ID somewhere you can reference it',
                    'EXISTING AGENT: Always provide your agent ID: claim <taskId> <yourAgentId>',
                    'FOR REINITIALIZATION: Always include agent ID: reinitialize <yourAgentId>',
                    'FOR STATUS: Always include agent ID: status <yourAgentId>',
                    "FIND EXISTING AGENTS: Use 'list-agents' to see all available agent IDs",
                    "IF LOST AGENT ID: Run 'init' to create new agent OR use 'list-agents' to find existing ones",
                  ],
                },
              },
            },
            taskConversion: {
              description:
                'Guidelines for converting existing tasks to proper category classification',
              legacyTaskHandling: {
                message: 'Converting tasks without category classification',
                steps: [
                  '1. Identify task purpose and complexity',
                  '2. Determine appropriate category (error/feature/subtask/test)',
                  '3. Delete legacy task if needed',
                  '4. Create new task with explicit category parameter',
                  '5. Verify task appears in correct priority position',
                ],
                categoryDetermination: {
                  error: 'System failures, linter violations, critical bugs',
                  feature: 'New functionality, enhancements, refactoring',
                  subtask: 'Components of larger features already approved',
                  test: 'Testing, coverage, test improvements',
                },
              },
              validationWorkflow: [
                '1. Check that all tasks have category parameter',
                '2. Verify priority order matches category rules',
                '3. Ensure error tasks can bypass feature ordering',
                '4. Verify task claiming follows priority rules',
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

  async getStatistics() {
    try {
      const result = await this.withTimeout(
        (async () => {
          const tasks = await this.taskManager.listTasks({});
          const agents = await this.agentManager.listActiveAgents();

          return {
            success: true,
            statistics: {
              totalTasks: tasks.length,
              activeAgents: agents.length,
              tasksByStatus: this._groupTasksByStatus(tasks),
              tasksByCategory: this._groupTasksByCategory(tasks),
            },
          };
        })(),
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get usage analytics for TaskManager initialization and reinitialization calls
   * Provides 5-hour window analytics starting from 11:00 AM CDT daily
   */
  async getUsageAnalytics(options = {}) {
    try {
      const result = await this.withTimeout(
        this.usageTracker.getAnalytics(options),
        10000,
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        usageTracking: 'error',
      };
    }
  }

  // =================== HELPER METHODS ===================

  _groupTasksByStatus(tasks) {
    const groups = {};
    tasks.forEach((task) => {
      const status = task.status || 'unknown';
      // eslint-disable-next-line security/detect-object-injection -- Task status accessed for analytics grouping with controlled values
      groups[status] = (groups[status] || 0) + 1;
    });
    return groups;
  }

  _groupTasksByCategory(tasks) {
    const groups = {};
    tasks.forEach((task) => {
      const category = task.category || 'unknown';
      // eslint-disable-next-line security/detect-object-injection -- Task category accessed for analytics grouping with controlled values
      groups[category] = (groups[category] || 0) + 1;
    });
    return groups;
  }

  _getGuideForError(errorContext) {
    // Simple fallback guide
    return this._getFallbackGuide(errorContext);
  }

  _getFallbackGuide(context = 'general') {
    return {
      message: `TaskManager API Guide - ${context}`,
      helpText: 'For complete API usage guidance, run the guide command',
      commands: [
        'init - Initialize agent',
        'list - List tasks',
        'create - Create task',
        'claim - Claim task',
        'complete - Complete task',
      ],
    };
  }

  _validateAgentScope(task, agentId) {
    return this.agentManagement.validateAgentScope(task, agentId);
  }

  _broadcastTaskCompletion(completionEvent) {
    // Placeholder for task completion broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('taskCompleted', completionEvent);
    }
  }

  _broadcastTaskFailed(failureEvent) {
    // Placeholder for task failure broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('taskFailed', failureEvent);
    }
  }

  _broadcastSubtaskUpdate(subtaskEvent) {
    // Placeholder for subtask update broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('subtaskUpdated', subtaskEvent);
    }
  }

  _broadcastCriteriaUpdate(criteriaEvent) {
    // Placeholder for success criteria update broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('criteriaUpdated', criteriaEvent);
    }
  }

  _broadcastToWebSocket(eventType, data) {
    // Simple WebSocket broadcasting
    const message = JSON.stringify({ type: eventType, data });
    this.webSocketClients.forEach((client) => {
      try {
        client.send(message);
      } catch {
        // Remove failed clients
        this.webSocketClients.delete(client);
      }
    });
  }

  cleanup() {
    // Cleanup resources
    if (this.webSocketServer) {
      this.webSocketServer.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// CLI interface
async function main() {
  // Use the already parsed args (with --project-root removed)
  const command = args[0];

  const api = new TaskManagerAPI();

  try {
    // Use the modular CLI interface instead of inline command parsing
    await cliInterface.executeCommand(api, args);
    return; // Early return to skip the rest of the switch logic
  } catch (error) {
    let errorContext = 'general';

    // Determine error context for better guidance
    if (command) {
      if (['init', 'reinitialize', 'status', 'list-agents'].includes(command)) {
        errorContext = 'agent-lifecycle';
      } else if (
        ['create', 'list', 'claim', 'complete', 'delete'].includes(command)
      ) {
        errorContext = 'task-operations';
      } else if (
        ['move-top', 'move-up', 'move-down', 'move-bottom'].includes(command)
      ) {
        errorContext = 'task-ordering';
      }
    }

    // Try to get contextual guide for the error
    let guide;
    try {
      guide = await api._getGuideForError(errorContext);
    } catch {
      // If contextual guide fails, try fallback
      try {
        guide = api._getFallbackGuide(errorContext);
      } catch {
        // If everything fails, use basic guide
      }
    }

    const errorResponse = {
      success: false,
      error: error.message,
      command,
      errorContext,
      timestamp: new Date().toISOString(),
      guide: guide || {
        message:
          'For complete API usage guidance, run: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
        helpText:
          'The guide provides comprehensive information about task classification, workflows, and all API capabilities',
      },
    };


    console.error(JSON.stringify(errorResponse, null, 2));
    throw new Error('TaskManager API execution failed');
  } finally {
    await api.cleanup();
  }
}

// Export for programmatic use
module.exports = TaskManagerAPI;

// Run CLI if called directly (CommonJS equivalent)
if (require.main === module) {
  main().catch((error) => {

    console.error('Fatal error:', error.message);
    throw error;
  });
}
