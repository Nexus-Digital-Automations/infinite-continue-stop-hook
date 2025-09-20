/* eslint-disable no-console -- System component requires console output for debugging */
/**
 * Validation Integration Module
 * Integrates ValidationEngine with existing audit-integration.js patterns
 * and TaskManager API workflows
 *
 * This module provides:
 * - Integration with existing audit-integration.js patterns
 * - TaskManager API integration for validation workflows
 * - Agent coordination and objectivity enforcement
 * - Evidence collection and storage mechanisms
 * - Background processing coordination
 *
 * @version 1.0.0
 * @author Validation Engine Agent #3
 */

const _fs = require('fs').promises;
const _path = require('path');
const _ValidationEngine = require('./validation-engine');
const _ValidationBackgroundProcessor = require('./validation-background-processor');
const _AuditIntegration = require('../development/essentials/audit-integration');

class ValidationIntegration {
  constructor(options = {}) {
    this.projectRoot = process.cwd();
    this.config = {
      enableBackgroundProcessing: options.background !== false,
      enableAutomatedValidation: options.automated !== false,
      enableManualValidation: options.manual !== false,
      enableAgentObjectivity: options.objectivity !== false,
      evidenceRequired: options.evidence !== false,
      integrationMode: options.mode || 'full', // 'full', 'audit-only', 'validation-only'
      taskManagerIntegration: options.taskManager !== false,
      ...options,
    };

    // Initialize components
    this.validationEngine = new _ValidationEngine({
      background: this.config.enableBackgroundProcessing,
      objectivity: this.config.enableAgentObjectivity,
      evidence: this.config.evidenceRequired,
      ...options,
    });

    this.backgroundProcessor = this.config.enableBackgroundProcessing
      ? new _ValidationBackgroundProcessor({
        maxWorkers: options.maxWorkers || 3,
        ...options,
      })
      : null;

    this.auditIntegration = new _AuditIntegration();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for integration components
   */
  setupEventListeners() {
    if (this.backgroundProcessor) {
      this.backgroundProcessor.on('validation_completed', (event) => {
        this.handleBackgroundValidationComplete(event);
      });

      this.backgroundProcessor.on('validation_started', (event) => {
        console.log(`🚀 Background validation started: ${event.taskId} (worker: ${event.workerId})`);
      });

      this.backgroundProcessor.on('validation_queued', (event) => {
        console.log(`📋 Background validation queued: ${event.taskId} (position: ${event.queuePosition})`);
      });
    }
  }

  /**
   * Execute comprehensive validation workflow for a task
   * @param {string} taskId - Task identifier
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  async validateTask(taskId, options = {}) {
    console.log(`🔍 Starting comprehensive validation for task ${taskId}`);

    try {
      // Load task details and requirements
      const taskDetails = await this.loadTaskDetails(taskId);
      const validationCriteria = await this.buildValidationCriteria(taskId, taskDetails);

      // Determine validation approach
      const validationOptions = {
        automated: options.automated !== false && this.config.enableAutomatedValidation,
        manual: options.manual !== false && this.config.enableManualValidation,
        background: options.background !== false && this.config.enableBackgroundProcessing,
        objectivity: options.objectivity !== false && this.config.enableAgentObjectivity,
        evidence: options.evidence !== false && this.config.evidenceRequired,
        ...options,
      };

      let _validationResults;

      if (validationOptions.background && this.backgroundProcessor) {
        // Use background processing for complex validations
        _validationResults = await this.executeBackgroundValidation(
          taskId,
          validationCriteria,
          validationOptions,
        );
      } else {
        // Use direct validation engine
        _validationResults = await this.validationEngine.executeValidationWorkflow(
          taskId,
          validationCriteria,
          validationOptions,
        );
      }

      // Post-validation processing
      await this.postValidationProcessing(taskId, _validationResults, taskDetails);

      return _validationResults;
    } catch (error) {
      console.error(`❌ Validation failed for task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Integrate with audit system for comprehensive quality checks
   * @param {string} originalTaskId - Original implementation task ID
   * @param {string} implementerAgentId - Agent who implemented the feature
   * @param {Object} taskDetails - Task details
   * @returns {Promise<Object>} Audit task and validation results
   */
  async createIntegratedAuditTask(originalTaskId, implementerAgentId, taskDetails = {}) {
    console.log(`🔍 Creating integrated audit task for ${originalTaskId}`);

    try {
      // Create audit task using existing audit-integration.js
      const auditTask = await this.auditIntegration.createAuditTask(
        originalTaskId,
        implementerAgentId,
        taskDetails,
      );

      // Execute validation workflow for the audit task
      const validationResults = await this.validateTask(auditTask.taskId, {
        automated: true,
        manual: true,
        background: true,
        objectivity: true,
        evidence: true,
      });

      // Integrate validation results with audit task
      const integratedResults = {
        auditTask,
        validationResults,
        integration: {
          originalTaskId,
          implementerAgentId,
          auditTaskId: auditTask.taskId,
          validationCompleted: true,
          objectivityEnforced: this.config.enableAgentObjectivity,
          evidenceCollected: this.config.evidenceRequired,
          timestamp: new Date().toISOString(),
        },
      };

      // Store integrated results
      await this.storeIntegratedResults(originalTaskId, integratedResults);

      console.log(`✅ Integrated audit and validation completed for ${originalTaskId}`);
      return integratedResults;
    } catch (error) {
      console.error(`❌ Integrated audit creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute validation in background with progress tracking
   * @param {string} taskId - Task identifier
   * @param {Object} criteria - Validation criteria
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  async executeBackgroundValidation(taskId, criteria, options) {
    if (!this.backgroundProcessor) {
      throw new Error('Background processing not enabled');
    }

    console.log(`🚀 Queuing background validation for task ${taskId}`);

    const validationTask = {
      taskId,
      criteria,
      options,
      type: 'full_validation',
      priority: options.priority || 'normal',
    };

    const backgroundTaskId = await this.backgroundProcessor.queueValidation(validationTask);

    // Return promise that resolves when background validation completes
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Background validation timeout for task ${taskId}`));
      }, 300000); // 5 minute timeout

      const completionHandler = (event) => {
        if (event.taskId === backgroundTaskId) {
          clearTimeout(timeout);
          this.backgroundProcessor.off('validation_completed', completionHandler);

          if (event.success) {
            resolve(event.result);
          } else {
            reject(new Error(`Background validation failed: ${event.error.message}`));
          }
        }
      };

      this.backgroundProcessor.on('validation_completed', completionHandler);
    });
  }

  /**
   * Load task details from TaskManager
   * @param {string} taskId - Task identifier
   * @returns {Promise<Object>} Task details
   */
  async loadTaskDetails(taskId) {
    try {
      // In production, this would query the TaskManager API
      // For now, simulate task details loading
      return {
        id: taskId,
        title: 'Task Implementation',
        description: 'Feature implementation requiring validation',
        category: 'feature',
        status: 'completed',
        implementedBy: 'dev_agent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`⚠️ Could not load task details for ${taskId}: ${error.message}`);
      return { id: taskId };
    }
  }

  /**
   * Build validation criteria based on task details and project requirements
   * @param {string} taskId - Task identifier
   * @param {Object} taskDetails - Task details
   * @returns {Promise<Object>} Validation criteria
   */
  async buildValidationCriteria(taskId, taskDetails) {
    try {
      // Load success criteria configuration
      const successConfig = await this.loadSuccessCriteriaConfig();

      // Load task-specific requirements
      const taskRequirements = await this.loadTaskRequirements();

      // Build criteria based on task category and project requirements
      const criteria = {
        taskId,
        template: successConfig.default_template || '25_point_standard',
        inheritedCriteria: this.getInheritedCriteria(taskDetails.category, successConfig),
        customCriteria: this.getCustomCriteria(taskDetails, successConfig),
        validationRules: this.getValidationRules(taskDetails.category, successConfig),
        evidenceRequirements: this.getEvidenceRequirements(taskDetails.category, successConfig),
      };

      return criteria;
    } catch (error) {
      console.warn(`⚠️ Could not build validation criteria: ${error.message}`);
      return { taskId, template: '25_point_standard' };
    }
  }

  /**
   * Get inherited criteria based on task category
   * @param {string} category - Task category
   * @param {Object} config - Success criteria configuration
   * @returns {Array} Inherited criteria
   */
  getInheritedCriteria(category, config) {
    const rules = config.validation_rules?.[`${category}_tasks`];
    if (!rules || !rules.inherit_from) {
      return [];
    }

    const inheritedCriteria = [];
    for (const criteriaSet of rules.inherit_from) {
      const projectCriteria = config.project_wide_criteria?.[criteriaSet];
      if (projectCriteria) {
        inheritedCriteria.push({
          name: criteriaSet,
          description: projectCriteria.description,
          criteria: projectCriteria.criteria,
          mandatory: projectCriteria.mandatory,
          validationMethod: projectCriteria.validation_method,
        });
      }
    }

    return inheritedCriteria;
  }

  /**
   * Get custom criteria for specific task
   * @param {Object} taskDetails - Task details
   * @param {Object} config - Success criteria configuration
   * @returns {Array} Custom criteria
   */
  getCustomCriteria(taskDetails, config) {
    // In production, this would load task-specific custom criteria
    // For now, return empty array
    return [];
  }

  /**
   * Get validation rules for task category
   * @param {string} category - Task category
   * @param {Object} config - Success criteria configuration
   * @returns {Object} Validation rules
   */
  getValidationRules(category, config) {
    const rules = config.validation_rules?.[`${category}_tasks`];
    return rules || {
      inherit_from: ['quality_baseline'],
      required_evidence: ['basic_validation_suite'],
      skip_criteria: [],
    };
  }

  /**
   * Get evidence requirements for task category
   * @param {string} category - Task category
   * @param {Object} config - Success criteria configuration
   * @returns {Object} Evidence requirements
   */
  getEvidenceRequirements(category, config) {
    const rules = this.getValidationRules(category, config);
    const evidenceTypes = rules.required_evidence || ['basic_validation_suite'];

    const requirements = {};
    for (const evidenceType of evidenceTypes) {
      if (config.evidence_requirements?.[evidenceType]) {
        requirements[evidenceType] = config.evidence_requirements[evidenceType];
      }
    }

    return requirements;
  }

  /**
   * Post-validation processing and integration
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   * @param {Object} taskDetails - Task details
   */
  async postValidationProcessing(taskId, validationResults, taskDetails) {
    try {
      // Generate validation report
      const _report = await this.generateValidationReport(taskId, validationResults, taskDetails);

      // Store validation evidence
      await this.storeValidationEvidence(taskId, validationResults);

      // Update task status if TaskManager integration enabled
      if (this.config.taskManagerIntegration) {
        await this.updateTaskValidationStatus(taskId, validationResults);
      }

      // Trigger follow-up actions based on results
      await this.triggerFollowUpActions(taskId, validationResults, taskDetails);

      console.log(`✅ Post-validation processing completed for ${taskId}`);
    } catch (error) {
      console.error(`❌ Post-validation processing failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive validation report
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   * @param {Object} taskDetails - Task details
   * @returns {Promise<Object>} Validation report
   */
  async generateValidationReport(taskId, validationResults, taskDetails) {
    const report = {
      taskId,
      taskDetails,
      validationId: validationResults.validationId || `validation_${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: validationResults.summary,
      results: {
        automated: validationResults.results?.automated || {},
        manual: validationResults.results?.manual || {},
        integration: validationResults.results?.integration || {},
      },
      recommendations: validationResults.recommendations || [],
      nextSteps: validationResults.nextSteps || [],
      metadata: {
        engine: 'ValidationEngine v1.0.0',
        integration: 'ValidationIntegration v1.0.0',
        criteria: '25-point Success Criteria',
        objectivityEnforced: this.config.enableAgentObjectivity,
        evidenceCollected: this.config.evidenceRequired,
        backgroundProcessing: this.config.enableBackgroundProcessing,
      },
    };

    // Store report
    await this.storeValidationReport(report);

    return report;
  }

  /**
   * Store validation evidence in structured format
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   */
  async storeValidationEvidence(taskId, validationResults) {
    try {
      const evidenceDir = _path.join(this.projectRoot, 'development/evidence');
      const evidenceFile = _path.join(evidenceDir, `${taskId}_validation_evidence.json`);

      const evidence = {
        taskId,
        timestamp: new Date().toISOString(),
        automated: validationResults.results?.automated?.evidence || {},
        manual: validationResults.results?.manual?.evidence || {},
        metadata: {
          validationId: validationResults.validationId,
          duration: validationResults.duration,
          success: validationResults.summary?.status === 'passed',
        },
      };

      await _fs.mkdir(evidenceDir, { recursive: true });
      await _fs.writeFile(evidenceFile, JSON.stringify(evidence, null, 2));

      console.log(`📁 Validation evidence stored: ${evidenceFile}`);
    } catch (error) {
      console.error(`❌ Failed to store validation evidence: ${error.message}`);
    }
  }

  /**
   * Store validation report
   * @param {Object} report - Validation report
   */
  async storeValidationReport(report) {
    try {
      const reportsDir = _path.join(this.projectRoot, 'development/reports/success-criteria');
      const reportFile = _path.join(reportsDir, `${report.validationId}_report.json`);

      await _fs.mkdir(reportsDir, { recursive: true });
      await _fs.writeFile(reportFile, JSON.stringify(report, null, 2));

      console.log(`📊 Validation report stored: ${reportFile}`);
    } catch (error) {
      console.error(`❌ Failed to store validation report: ${error.message}`);
    }
  }

  /**
   * Update task validation status in TaskManager
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   */
  async updateTaskValidationStatus(taskId, validationResults) {
    try {
      // In production, this would update the task via TaskManager API
      console.log(`📝 Would update task ${taskId} validation status: ${validationResults.summary?.status}`);
    } catch (error) {
      console.error(`❌ Failed to update task validation status: ${error.message}`);
    }
  }

  /**
   * Trigger follow-up actions based on validation results
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   * @param {Object} taskDetails - Task details
   */
  async triggerFollowUpActions(taskId, validationResults, taskDetails) {
    const summary = validationResults.summary;

    if (!summary) {
      return;
    }

    // Create remediation tasks for failures
    if (summary.failed > 0) {
      console.log(`🔧 ${summary.failed} validation failures detected - creating remediation tasks`);
      await this.createRemediationTasks(taskId, validationResults, taskDetails);
    }

    // Schedule follow-up reviews for pending manual validations
    if (summary.pending > 0) {
      console.log(`⏳ ${summary.pending} manual validations pending - scheduling follow-up`);
      await this.scheduleFollowUpReviews(taskId, validationResults);
    }

    // Trigger notifications for critical failures
    if (this.hasCriticalFailures(validationResults)) {
      console.log(`🚨 Critical validation failures detected - triggering notifications`);
      await this.triggerCriticalFailureNotifications(taskId, validationResults);
    }
  }

  /**
   * Create remediation tasks for validation failures
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   * @param {Object} taskDetails - Task details
   */
  async createRemediationTasks(taskId, validationResults, taskDetails) {
    // In production, this would create actual remediation tasks
    const failures = this.extractValidationFailures(validationResults);

    for (const failure of failures) {
      console.log(`🔧 Would create remediation task for: ${failure.validator} - ${failure.message}`);
    }
  }

  /**
   * Schedule follow-up reviews for pending manual validations
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   */
  async scheduleFollowUpReviews(taskId, validationResults) {
    // In production, this would schedule actual follow-up reviews
    console.log(`📅 Would schedule follow-up reviews for task ${taskId}`);
  }

  /**
   * Trigger critical failure notifications
   * @param {string} taskId - Task identifier
   * @param {Object} validationResults - Validation results
   */
  async triggerCriticalFailureNotifications(taskId, _validationResults) {
    // In production, this would trigger actual notifications
    console.log(`🚨 Would trigger critical failure notifications for task ${taskId}`);
  }

  /**
   * Check if validation results contain critical failures
   * @param {Object} validationResults - Validation results
   * @returns {boolean} True if critical failures found
   */
  hasCriticalFailures(validationResults) {
    if (!validationResults.results?.automated?.validators) {
      return false;
    }

    for (const [_validator, result] of Object.entries(validationResults.results.automated.validators)) {
      if (!result.passed && result.category === 'critical') {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract validation failures for remediation
   * @param {Object} validationResults - Validation results
   * @returns {Array} List of validation failures
   */
  extractValidationFailures(validationResults) {
    const failures = [];

    if (validationResults.results?.automated?.validators) {
      for (const [validator, result] of Object.entries(validationResults.results.automated.validators)) {
        if (!result.passed) {
          failures.push({
            validator,
            category: result.category,
            message: result.message,
            evidence: result.evidence,
          });
        }
      }
    }

    return failures;
  }

  /**
   * Store integrated audit and validation results
   * @param {string} originalTaskId - Original task ID
   * @param {Object} integratedResults - Integrated results
   */
  async storeIntegratedResults(originalTaskId, integratedResults) {
    try {
      const reportsDir = _path.join(this.projectRoot, 'development/reports');
      const reportFile = _path.join(reportsDir, `${originalTaskId}_integrated_audit_validation.json`);

      await _fs.mkdir(reportsDir, { recursive: true });
      await _fs.writeFile(reportFile, JSON.stringify(integratedResults, null, 2));

      console.log(`📊 Integrated results stored: ${reportFile}`);
    } catch (error) {
      console.error(`❌ Failed to store integrated results: ${error.message}`);
    }
  }

  /**
   * Handle background validation completion
   * @param {Object} event - Completion event
   */
  handleBackgroundValidationComplete(event) {
    if (event.success) {
      console.log(`✅ Background validation completed: ${event.taskId} (${event.duration}ms)`);
    } else {
      console.error(`❌ Background validation failed: ${event.taskId} - ${event.error.message}`);
    }
  }

  /**
   * Load success criteria configuration
   * @returns {Promise<Object>} Configuration object
   */
  async loadSuccessCriteriaConfig() {
    try {
      const configPath = _path.join(
        this.projectRoot,
        'development/essentials/success-criteria-config.json',
      );
      const configContent = await _fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      console.warn(`⚠️ Could not load success criteria config: ${error.message}`);
      return {};
    }
  }

  /**
   * Load task requirements
   * @returns {Promise<Object>} Task requirements
   */
  async loadTaskRequirements() {
    try {
      const requirementsPath = _path.join(
        this.projectRoot,
        'development/essentials/task-requirements.md',
      );
      const content = await _fs.readFile(requirementsPath, 'utf-8');
      return { content, path: requirementsPath };
    } catch (error) {
      console.warn(`⚠️ Could not load task requirements: ${error.message}`);
      return {};
    }
  }

  /**
   * Get validation engine statistics
   * @returns {Object} Statistics
   */
  getValidationStats() {
    const stats = {
      engine: {
        activeValidations: this.validationEngine.activeValidations?.size || 0,
      },
      background: this.backgroundProcessor ? this.backgroundProcessor.getStats() : null,
      integration: {
        mode: this.config.integrationMode,
        features: {
          backgroundProcessing: this.config.enableBackgroundProcessing,
          automatedValidation: this.config.enableAutomatedValidation,
          manualValidation: this.config.enableManualValidation,
          agentObjectivity: this.config.enableAgentObjectivity,
          evidenceRequired: this.config.evidenceRequired,
          taskManagerIntegration: this.config.taskManagerIntegration,
        },
      },
    };

    return stats;
  }

  /**
   * Shutdown the validation integration
   */
  async shutdown() {
    console.log(`🔄 Shutting down validation integration...`);

    if (this.backgroundProcessor) {
      await this.backgroundProcessor.shutdown();
    }

    console.log(`✅ Validation integration shutdown complete`);
  }
}

module.exports = ValidationIntegration;
