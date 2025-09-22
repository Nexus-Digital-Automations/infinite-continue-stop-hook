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

    // Initialize features file if it doesn't exist (call async init later)
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
      // Ensure features file exists
      await this._ensureFeaturesFile();

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
        metadata: featureData.metadata || {},
      };

      const features = await this._loadFeatures();
      features.features.push(feature);
      features.metadata.total_features = features.features.length;
      features.metadata.updated = new Date().toISOString();

      await this._saveFeatures(features);

      return {
        success: true,
        feature,
        message: 'Feature suggestion created successfully',
      };
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

  async initializeAgent(agentId) {
    try {
      const features = await this._loadFeatures();

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

      await this._saveFeatures(features);

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
      const features = await this._loadFeatures();

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

      await this._saveFeatures(features);

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

  // =================== UTILITY METHODS ===================
  // Helper methods for feature management

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
      },
      availableCommands: [
        // Discovery Commands
        'guide', 'methods',

        // Feature Management
        'suggest-feature', 'approve-feature', 'reject-feature', 'list-features', 'feature-stats',
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
      ],
    };
  }

  cleanup() {
    // Cleanup resources if needed
    // No active connections to clean up in this simplified version
  }
}

// CLI interface
async function main() {
  // Use the already parsed args (with --project-root removed)
  const command = args[0];
  const api = new FeatureManagerAPI();

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
      default:
        throw new Error(`Unknown command: ${command}. Available commands: guide, methods, suggest-feature, approve-feature, bulk-approve-features, reject-feature, list-features, feature-stats, initialize, reinitialize, authorize-stop`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const errorResponse = {
      success: false,
      error: error.message,
      command,
      timestamp: new Date().toISOString(),
      guide: api._getFallbackGuide('feature-management'),
    };

    console.error(JSON.stringify(errorResponse, null, 2));
    throw new Error('Feature Management API execution failed');
  } finally {
    await api.cleanup();
  }
}

// Export for programmatic use
module.exports = FeatureManagerAPI;

// Run CLI if called directly (CommonJS equivalent)
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    throw error;
  });
}
