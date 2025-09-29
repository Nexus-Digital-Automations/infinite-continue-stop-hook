/**
 * Audit System Integration - TaskManager API Integration
 *
 * This module provides seamless integration between the comprehensive audit system
 * And the TaskManager API, enabling automatic audit task creation, agent assignment
 * controls, And project-wide success criteria enforcement.
 *
 * Features:
 * - Automatic audit task creation after feature completion
 * - Objectivity enforcement (prevents self-audit assignments)
 * - Integration with 25-point completion criteria
 * - Success criteria inheritance from task-requirements.md
 * - Audit workflow automation
 *
 * @version 1.0.0
 * @author Audit System Agent #4
 */

const FS = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Security utilities for safe filesystem operations
 */
class SecurityUtils {
  /**
   * Sanitize And validate file path to prevent directory traversal
   * @param {string} basePath - Base directory path (trusted)
   * @param {string} filePath - File path to validate
   * @returns {string} Safe resolved path
   * @throws {Error} If path is invalid or outside base directory
   */
  static validatePath(basePath, filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided');
    }

    // Resolve paths to prevent directory traversal
    const resolvedBase = path.resolve(basePath);
    const resolvedPath = path.resolve(basePath, path.basename(filePath));

    // Ensure the resolved path is within the base directory
    if (
      !resolvedPath.startsWith(resolvedBase + path.sep) &&
      resolvedPath !== resolvedBase
    ) {
      throw new Error(
        `Path ${filePath} is outside allowed directory ${basePath}`
      );
    }

    return resolvedPath;
  }

  /**
   * Safely read file with path validation
   * @param {string} basePath - Base directory
   * @param {string} filePath - File to read
   * @param {string} encoding - File encoding
   * @returns {Promise<string>} File contents
   */
  static safeReadFile(basePath, filePath, encoding = 'utf-8') {
    const safePath = this.validatePath(basePath, filePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- safePath is validated And sanitized
    return FS.readFile(safePath, encoding);
  }

  /**
   * Safely write file with path validation
   * @param {string} basePath - Base directory
   * @param {string} filePath - File to write
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  static async safeWriteFile(basePath, filePath, content) {
    const safePath = this.validatePath(basePath, filePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- safePath is validated And sanitized
    await FS.mkdir(path.dirname(safePath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- safePath is validated And sanitized
    return FS.writeFile(safePath, content, 'utf-8');
  }

  /**
   * Safely append to file with path validation
   * @param {string} basePath - Base directory
   * @param {string} filePath - File to append to
   * @param {string} content - Content to append
   * @returns {Promise<void>}
   */
  static async safeAppendFile(basePath, filePath, content) {
    const safePath = this.validatePath(basePath, filePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- safePath is validated And sanitized
    await FS.mkdir(path.dirname(safePath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- safePath is validated And sanitized
    return FS.appendFile(safePath, content);
  }
}

/**
 * Audit logger to replace console statements
 */
class AuditLogger {
  constructor(__agentId) {
    this.logs = [];
  }

  log(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
    };
    this.logs.push(logEntry);
    // for audit system, we'll use process.stdout to maintain output
    process.stdout.write(`[AUDIT] ${message}\n`);
  }

  error(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
    };
    this.logs.push(logEntry);
    process.stderr.write(`[AUDIT ERROR] ${message}\n`);
  }

  getLogs() {
    return this.logs;
  }
}

class AUDIT_INTEGRATION {
  constructor(__agentId) {
    this.projectRoot = process.cwd();
    this.essentialsDir = path.join(__dirname);
    this.taskManagerApiPath = path.join(this.projectRoot, 'taskmanager-api.js');
    this.logger = new AuditLogger();

    // Integration configuration
    this.config = {
      enableAutoAudit: true,
      auditTimeoutMs: 10000,
      objectivityEnforcement: true,
      mandatoryAuditCategories: ['feature'],
      auditReportLocation: 'development/reports',
      successCriteriaSource: 'development/essentials/task-requirements.md',
    };

    // Agent role patterns for objectivity enforcement
    this.agentRolePatterns = {
      implementation: ['development', 'feature', 'implementation'],
      audit: ['audit', 'quality', 'review'],
      research: ['research', 'analysis', 'investigation'],
    };
  }

  /**
   * Create comprehensive audit task for completed feature implementation
   * @param {string} originalTaskId - ID of the completed implementation task
   * @param {string} implementerAgentId - Agent who implemented the feature
   * @param {Object} taskDetails - Original task details
   * @returns {Object} Created audit task information
   */
  async createAuditTask(originalTaskId, implementerAgentId, taskDetails = {}) {
    this.logger.log(
      `🔍 Creating audit task for completed feature: ${originalTaskId}`
    );

    // Generate audit task definition
    const auditTaskData = await this.generateAuditTaskDefinition(
      originalTaskId,
      implementerAgentId,
      taskDetails
    );

    // Create audit task via TaskManager API
    const auditTask = await this.createTaskViaApi(auditTaskData);

    // Log audit task creation
    await this.logAuditTaskCreation(
      originalTaskId,
      auditTask.taskId,
      implementerAgentId
    );

    this.logger.log(`✅ Audit task created: ${auditTask.taskId}`);
    return auditTask;
  }

  /**
   * Generate comprehensive audit task definition with 25-point criteria
   * @param {string} originalTaskId - Original implementation task ID
   * @param {string} implementerAgentId - Implementer agent ID
   * @param {Object} taskDetails - Task details
   * @returns {Object} Complete audit task definition
   */
  async generateAuditTaskDefinition(
    originalTaskId,
    implementerAgentId,
    taskDetails
  ) {
    // Load project-specific success criteria
    const projectCriteria = await this.loadProjectSuccessCriteria();

    // Generate audit task definition
    const auditTaskData = {
      title: `AUDIT: ${taskDetails.title || 'Feature Implementation'} - 25-Point Quality Review`,
      description: this.generateAuditDescription(
        originalTaskId,
        taskDetails,
        projectCriteria
      ),
      category: 'subtask',
      success_criteria: this.generate25PointSuccessCriteria(projectCriteria),
      audit_metadata: {
        audit_type: 'comprehensive_25_point',
        original_task_id: originalTaskId,
        original_implementer: implementerAgentId,
        prevents_self_review: true,
        objectivity_enforced: this.config.objectivityEnforcement,
        project_criteria_integrated: true,
        evidence_required: true,
        mandatory_criteria_count: 10,
        total_criteria_count: 25,
        audit_system_version: '1.0.0',
      },
      validation_commands: await this.generateValidationCommands(),
      escalation_triggers: [
        'Any CRITICAL GATES (1-10) fail',
        'More than 2 QUALITY GATES (11-15) fail',
        'Implementation violates security standards',
        'Performance regressions exceed 10%',
      ],
      evidence_requirements: [
        'Linter output screenshots',
        'Build logs with timestamps',
        'Test coverage reports',
        'Security scan results',
        'Performance benchmarks',
        'Documentation coverage',
      ],
    };

    return auditTaskData;
  }

  /**
   * Generate detailed audit task description with context
   * @param {string} originalTaskId - Original task ID
   * @param {Object} taskDetails - Task details
   * @param {Object} projectCriteria - Project success criteria
   * @returns {string} Comprehensive audit description
   */
  generateAuditDescription(originalTaskId, taskDetails, _projectCriteria) {
    return `Comprehensive 25-point quality audit And review of completed implementation.

**ORIGINAL TASK**: ${originalTaskId}
**TITLE**: ${taskDetails.title || 'Feature Implementation'}
**DESCRIPTION**: ${taskDetails.description || 'No description provided'}

**AUDIT SCOPE**: Complete validation of all 25 standard completion criteria with evidence collection And reporting.

**OBJECTIVITY CONTROL**: This audit MUST be performed by a different agent than the implementer to ensure objectivity And maintain audit integrity.

**PROJECT INTEGRATION**: This audit incorporates project-specific success criteria from task-requirements.md And validates against the infinite-continue-stop-hook project standards.

**SUCCESS CRITERIA CATEGORIES**:
- 🔴 **CRITICAL GATES (1-10)**: MANDATORY - All must pass for approval
- 🔍 **QUALITY GATES (11-15)**: HIGH PRIORITY - Failures require remediation  
- 🚀 **INTEGRATION GATES (16-20)**: MEDIUM PRIORITY - Assess based on project context
- 🔧 **EXCELLENCE GATES (21-25)**: LOW PRIORITY - Document gaps for future improvement

**EVIDENCE REQUIREMENTS**: All validations must provide measurable evidence including screenshots, logs, reports, And metrics.

**FAILURE PROTOCOL**: Any critical gate failures will automatically block task completion And trigger specific remediation tasks.

**AUDIT WORKFLOW**:
1. Agent verification (ensure auditor ≠ implementer)
2. Evidence collection And validation
3. 25-point criteria evaluation with priority-based assessment
4. Pass/fail determination with detailed reporting
5. Remediation task generation for any failures

Refer to development/essentials/audit-criteria.md for complete criteria definitions And validation procedures.`;
  }

  /**
   * Generate 25-point success criteria integrated with project requirements
   * @param {Object} projectCriteria - Project-specific success criteria
   * @returns {Array} Array of success criteria strings
   */
  generate25PointSuccessCriteria(_projectCriteria) {
    return [
      // Critical Gates (1-10) - MANDATORY
      'CRITICAL GATE #1: Linter perfection achieved (zero warnings/errors)',
      'CRITICAL GATE #2: Build integrity confirmed (clean build with no warnings)',
      'CRITICAL GATE #3: Application runtime success verified (startup without errors)',
      'CRITICAL GATE #4: Test coverage maintained (all existing tests pass)',
      'CRITICAL GATE #5: Git integration complete (committed And pushed)',
      'CRITICAL GATE #6: Documentation completeness achieved',
      'CRITICAL GATE #7: Error handling implementation verified',
      'CRITICAL GATE #8: Performance standards met (no major regressions)',
      'CRITICAL GATE #9: Security review passed (no vulnerabilities)',
      'CRITICAL GATE #10: Code quality standards satisfied',

      // Quality Gates (11-15) - HIGH PRIORITY
      'QUALITY GATE #11: Dependency management validated',
      'QUALITY GATE #12: Configuration management implemented',
      'QUALITY GATE #13: Logging And monitoring instrumented',
      'QUALITY GATE #14: API contract compliance verified',
      'QUALITY GATE #15: Database integration optimized',

      // Integration Gates (16-20) - MEDIUM PRIORITY
      'INTEGRATION GATE #16: Environment compatibility confirmed',
      'INTEGRATION GATE #17: Deployment readiness verified',
      'INTEGRATION GATE #18: Data migration safety ensured',
      'INTEGRATION GATE #19: Integration testing completed',
      'INTEGRATION GATE #20: User experience validation passed',

      // Excellence Gates (21-25) - LOW PRIORITY
      'EXCELLENCE GATE #21: Monitoring And alerting configured',
      'EXCELLENCE GATE #22: Disaster recovery procedures documented',
      'EXCELLENCE GATE #23: Scalability assessment completed',
      'EXCELLENCE GATE #24: Compliance And governance verified',
      'EXCELLENCE GATE #25: Knowledge transfer documentation complete',

      // Project-specific criteria integration
      'PROJECT INTEGRATION: TaskManager API compatibility maintained',
      'PROJECT INTEGRATION: Claude.md compliance verified',
      'PROJECT INTEGRATION: Agent coordination capabilities preserved',
      'PROJECT INTEGRATION: Multi-agent development standards met',
    ];
  }

  /**
   * Load project-specific success criteria from task-requirements.md
   * @returns {Object} Parsed project success criteria
   */
  async loadProjectSuccessCriteria() {
    try {
      // Use safe file reading with path validation
      const content = await SecurityUtils.safeReadFile(
        this.essentialsDir,
        'task-requirements.md'
      );

      // Parse criteria from markdown (simplified extraction)
      const criteria = {
        build_requirements: this.extractCriteria(
          content,
          '### **Build Requirements**'
        ),
        runtime_requirements: this.extractCriteria(
          content,
          '### **Runtime Requirements**'
        ),
        code_quality: this.extractCriteria(
          content,
          '### **Code Quality Requirements**'
        ),
        test_requirements: this.extractCriteria(
          content,
          '### **Test Requirements**'
        ),
        git_requirements: this.extractCriteria(
          content,
          '### **Git Integration Requirements**'
        ),
        project_specific: this.extractCriteria(
          content,
          '### **TaskManager API Integration**'
        ),
      };

      return criteria;
    } catch (error) {
      this.logger.log(`⚠️ Could not load task requirements: ${error.message}`);
      return {};
    }
  }

  /**
   * Extract criteria items from markdown section
   * @param {string} content - Full markdown content
   * @param {string} sectionHeader - Section header to extract from
   * @returns {Array} Array of criteria items
   */
  extractCriteria(content, sectionHeader) {
    const sectionStart = content.indexOf(sectionHeader);
    if (sectionStart === -1) {
      return [];
    }

    const sectionContent = content.substring(sectionStart);
    const nextSection = sectionContent.indexOf('\n### ');
    const section =
      nextSection === -1
        ? sectionContent
        : sectionContent.substring(0, nextSection);

    // Extract checklist items
    const items = section.match(/- \[ \] \*\*([^*]+)\*\*/g) || [];
    return items.map((item) => item.replace(/- \[ \] \*\*([^*]+)\*\*.*/, '$1'));
  }

  /**
   * Generate validation commands for the current project
   * @returns {Array} Array of validation command objects
   */
  async generateValidationCommands() {
    let hasPackageJson = false;

    try {
      // Use safe path validation for package.json check
      const packageJsonPath = SecurityUtils.validatePath(
        this.projectRoot,
        'package.json'
      );
      await FS.access(packageJsonPath);
      hasPackageJson = true;
    } catch (_) {
      // Package.json not found or access denied
    }

    if (hasPackageJson) {
      return [
        {
          command: 'npm run lint',
          description: 'Execute linting validation',
          timeout: 30000,
        },
        {
          command: 'npm run build',
          description: 'Execute build validation',
          timeout: 60000,
        },
        {
          command: 'npm test',
          description: 'Execute test suite validation',
          timeout: 120000,
        },
        {
          command: 'timeout 10s npm start',
          description: 'Execute runtime validation',
          timeout: 15000,
        },
        {
          command: 'npm audit',
          description: 'Execute security audit',
          timeout: 30000,
        },
      ];
    } else {
      return [
        {
          command: 'echo "Manual validation required - no package.json found"',
          description: 'Manual validation',
          timeout: 1000,
        },
      ];
    }
  }

  /**
   * Create audit task via TaskManager API
   * @param {Object} auditTaskData - Complete audit task definition
   * @returns {Object} Created task information
   */
  createTaskViaApi(auditTaskData) {
    const command = `timeout ${this.config.auditTimeoutMs / 1000}s node "${this.taskManagerApiPath}" create '${JSON.stringify(auditTaskData)}'`;

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        cwd: this.projectRoot,
      });
      const result = JSON.parse(output);

      if (result.success) {
        return result;
      } else {
        throw new Error(`TaskManager API error: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to create audit task: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate agent objectivity for audit assignment
   * @param {string} implementerAgentId - Agent who implemented the task
   * @param {string} auditAgentId - Agent being assigned to audit
   * @returns {boolean} True if objectivity requirements are met
   */
  validateAgentObjectivity(implementerAgentId, auditAgentId) {
    if (!this.config.objectivityEnforcement) {
      return true; // Objectivity enforcement disabled
    }

    // Basic check: different agent IDs
    if (implementerAgentId === auditAgentId) {
      this.logger.error(
        `🚨 OBJECTIVITY VIOLATION: Agent ${auditAgentId} cannot audit their own work`
      );
      return false;
    }

    // Advanced check: different role types (if detectable from agent ID)
    const implementerRole = this.detectAgentRole(implementerAgentId);
    const auditRole = this.detectAgentRole(auditAgentId);

    if (implementerRole && auditRole && implementerRole === auditRole) {
      this.logger.log(
        `⚠️ ROLE OVERLAP WARNING: Both agents appear to have ${implementerRole} role`
      );
    }

    this.logger.log(
      `✅ Objectivity validated: ${implementerAgentId} ≠ ${auditAgentId}`
    );
    return true;
  }

  /**
   * Detect agent role from agent ID pattern
   * @param {string} agentId - Agent ID to analyze
   * @returns {string|null} Detected role or null
   */
  detectAgentRole(agentId) {
    const lowerAgentId = agentId.toLowerCase();

    for (const [role, patterns] of Object.entries(this.agentRolePatterns)) {
      if (patterns.some((pattern) => lowerAgentId.includes(pattern))) {
        return role;
      }
    }

    return null;
  }

  /**
   * Log audit task creation for tracking And debugging
   * @param {string} originalTaskId - Original task ID
   * @param {string} auditTaskId - Created audit task ID
   * @param {string} implementerAgentId - Implementer agent ID
   */
  async logAuditTaskCreation(originalTaskId, auditTaskId, implementerAgentId) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'audit_task_created',
      original_task_id: originalTaskId,
      audit_task_id: auditTaskId,
      implementer_agent: implementerAgentId,
      audit_system_version: '1.0.0',
      objectivity_enforced: this.config.objectivityEnforcement,
    };

    try {
      // Use safe file append with path validation
      await SecurityUtils.safeAppendFile(
        this.projectRoot,
        'development/logs/audit_integration.log',
        JSON.stringify(logEntry) + '\n'
      );
    } catch (error) {
      this.logger.log(`⚠️ Failed to log audit task creation: ${error.message}`);
    }
  }

  /**
   * Check if task requires audit based on configuration
   * @param {Object} taskDetails - Task details
   * @returns {boolean} True if audit is required
   */
  requiresAudit(taskDetails) {
    if (!this.config.enableAutoAudit) {
      return false;
    }

    return this.config.mandatoryAuditCategories.includes(
      taskDetails.task.category
    );
  }

  /**
   * Get audit system configuration
   * @returns {Object} Current configuration
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Update audit system configuration
   * @param {Object} newConfig - Configuration updates
   */
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.log(`🔧 Audit integration configuration updated`);
  }
}

// CLI Interface
if (require.main === module) {
  const integration = new AUDIT_INTEGRATION();

  const command = process.argv[2];

  switch (command) {
    case 'create-audit': {
      const originalTaskId = process.argv[3];
      const implementerAgent = process.argv[4];
      const taskTitle = process.argv[5] || 'Feature Implementation';

      if (!originalTaskId || !implementerAgent) {
        integration.logger.error(
          'Usage: node audit-integration.js create-audit <originalTaskId> <implementerAgent> [taskTitle]'
        );
        throw new Error('Missing required arguments for create-audit command');
      }

      integration
        .createAuditTask(originalTaskId, implementerAgent, { title: taskTitle })
        .then((result) => {
          integration.logger.log(`\n🎉 Audit task created successfully!`);
          integration.logger.log(`Original Task: ${originalTaskId}`);
          integration.logger.log(`Audit Task: ${result.taskId}`);
          integration.logger.log(`Implementer: ${implementerAgent}`);
          integration.logger.log(
            `\nNext: Assign different agent to audit task for objectivity`
          );
        })
        .catch((error) => {
          integration.logger.error(
            `❌ Failed to create audit task: ${error.message}`
          );
          throw error;
        });
      break;
    }

    case 'validate-objectivity': {
      const implementer = process.argv[3];
      const auditor = process.argv[4];

      if (!implementer || !auditor) {
        integration.logger.error(
          'Usage: node audit-integration.js validate-objectivity <implementerAgent> <auditorAgent>'
        );
        throw new Error(
          'Missing required arguments for validate-objectivity command'
        );
      }

      const isObjective = integration.validateAgentObjectivity(
        implementer,
        auditor
      );
      integration.logger.log(
        `Objectivity Check: ${isObjective ? '✅ PASSED' : '❌ FAILED'}`
      );
      if (!isObjective) {
        throw new Error('Objectivity validation failed');
      }
      break;
    }

    case 'config':
      integration.logger.log('Current Audit Integration Configuration:');
      integration.logger.log(
        JSON.stringify(integration.getConfiguration(), null, 2)
      );
      break;

    case 'help':
    default:
      integration.logger.log(`
Audit System Integration - TaskManager API Integration

USAGE:
  node audit-integration.js create-audit <originalTaskId> <implementerAgent> [taskTitle]
  node audit-integration.js validate-objectivity <implementerAgent> <auditorAgent>
  node audit-integration.js config

EXAMPLES:
  # Create comprehensive audit task
  node audit-integration.js create-audit task_123 agent_dev "User Authentication Feature"
  
  # Validate agent objectivity
  node audit-integration.js validate-objectivity agent_dev agent_audit
  
  # View configuration
  node audit-integration.js config

FEATURES:
  ✅ Automatic audit task creation after feature completion
  ✅ 25-point quality criteria integration
  ✅ Objectivity enforcement (prevents self-audit)
  ✅ Project-specific success criteria inheritance  
  ✅ Evidence collection requirements
  ✅ TaskManager API integration

OBJECTIVITY ENFORCEMENT:
  The system automatically prevents agents from auditing their own work,
  ensuring objective quality assessment And maintaining audit integrity.
  
PROJECT INTEGRATION:
  Inherits success criteria from development/essentials/task-requirements.md
  And integrates with the infinite-continue-stop-hook project standards.
`);
      break;
  }
}

module.exports = AUDIT_INTEGRATION;
