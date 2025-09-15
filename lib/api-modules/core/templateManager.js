/**
 * Success Criteria Template Manager Module
 *
 * Comprehensive template management system for Success Criteria including:
 * - 25-point standard template system implementation
 * - Project-wide inheritance rules and cascading
 * - Custom criteria support with validation
 * - Template versioning and management
 * - Criteria categorization (Critical/Quality/Integration/Excellence)
 * - Template loading and caching mechanisms
 * - Integration with existing audit criteria from audit-criteria.md
 *
 * @author Template System Agent #2
 * @version 1.0.0
 * @since 2025-09-15
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateManager {
  /**
   * Initialize TemplateManager with comprehensive template support
   * @param {Object} dependencies - Dependency injection object
   * @param {Object} dependencies.taskManager - TaskManager instance
   * @param {Function} dependencies.withTimeout - Timeout wrapper function
   * @param {string} dependencies.projectRoot - Project root directory
   * @param {Object} dependencies.logger - Logger instance
   */
  constructor(dependencies) {
    this.taskManager = dependencies.taskManager;
    this.withTimeout = dependencies.withTimeout;
    this.projectRoot = dependencies.projectRoot;
    this.logger = dependencies.logger || console;

    // Cache for templates and configurations
    this.templateCache = new Map();
    this.configCache = new Map();
    this.inheritanceCache = new Map();

    // Template categories for organization
    this.categories = {
      CRITICAL: 'critical',
      QUALITY: 'quality',
      INTEGRATION: 'integration',
      EXCELLENCE: 'excellence',
    };

    // Initialize 25-point standard template
    this.initializeStandardTemplates();

    // Load configuration from success-criteria-config.json
    this.loadConfiguration();
  }

  /**
   * Initialize the 25-point standard template system
   */
  initializeStandardTemplates() {
    // 25-point standard template based on success-criteria.md
    this.standardTemplate = {
      id: '25_point_standard',
      name: '25-Point Standard Success Criteria Template',
      version: '1.0.0',
      description: 'Comprehensive 25-point quality and compliance template',
      categories: {
        [this.categories.CRITICAL]: {
          name: 'Core Quality Gates',
          description: 'Mandatory criteria that must pass (Points 1-10)',
          points: [
            {
              id: 1,
              title: 'Linter Perfection',
              description: 'All linting rules pass with zero violations',
              requirements: [
                'No warnings or errors from static code analysis',
                'Code style consistency maintained',
              ],
              evidence: 'Clean linter output screenshot',
              validation: 'automated',
              mandatory: true,
            },
            {
              id: 2,
              title: 'Build Success',
              description: 'Project builds successfully without errors',
              requirements: [
                'No build warnings or failures',
                'All assets generated correctly',
              ],
              evidence: 'Build log with success confirmation',
              validation: 'automated',
              mandatory: true,
            },
            {
              id: 3,
              title: 'Runtime Success',
              description: 'Application starts without errors',
              requirements: [
                'All services initialize correctly',
                'Core functionality accessible',
              ],
              evidence: 'Startup logs and health check',
              validation: 'automated',
              mandatory: true,
            },
            {
              id: 4,
              title: 'Test Integrity',
              description: 'All existing tests continue to pass',
              requirements: [
                'No test regressions introduced',
                'Coverage maintained or improved',
              ],
              evidence: 'Test results and coverage report',
              validation: 'automated',
              mandatory: true,
            },
            {
              id: 5,
              title: 'Function Documentation',
              description: 'All public functions documented with JSDoc/docstrings',
              requirements: [
                'Parameters and return values described',
                'Usage examples provided where appropriate',
              ],
              evidence: 'Documentation coverage report',
              validation: 'manual',
              mandatory: true,
            },
            {
              id: 6,
              title: 'API Documentation',
              description: 'All public interfaces documented',
              requirements: [
                'Endpoint definitions with examples',
                'Integration guides updated',
              ],
              evidence: 'API documentation completeness',
              validation: 'manual',
              mandatory: true,
            },
            {
              id: 7,
              title: 'Architecture Documentation',
              description: 'System design decisions documented',
              requirements: [
                'Integration patterns explained',
                'Data flow diagrams updated',
              ],
              evidence: 'Architecture documentation review',
              validation: 'manual',
              mandatory: true,
            },
            {
              id: 8,
              title: 'Decision Rationale',
              description: 'Technical decisions explained and justified',
              requirements: [
                'Alternative approaches considered',
                'Trade-offs documented',
              ],
              evidence: 'Decision log entries',
              validation: 'manual',
              mandatory: true,
            },
            {
              id: 9,
              title: 'Error Handling',
              description: 'Comprehensive error handling implemented',
              requirements: [
                'Error messages clear and actionable',
                'Graceful degradation where applicable',
              ],
              evidence: 'Error handling test results',
              validation: 'automated',
              mandatory: true,
            },
            {
              id: 10,
              title: 'Performance Metrics',
              description: 'No performance regressions (< 10% slower)',
              requirements: [
                'Memory usage within bounds',
                'Response times meet requirements',
              ],
              evidence: 'Performance benchmark comparison',
              validation: 'automated',
              mandatory: true,
            },
          ],
        },
        [this.categories.QUALITY]: {
          name: 'Security & Compliance',
          description: 'Security and compliance requirements (Points 11-20)',
          points: [
            {
              id: 11,
              title: 'Security Review',
              description: 'No security vulnerabilities introduced',
              requirements: [
                'Security best practices followed',
                'Threat model considerations addressed',
              ],
              evidence: 'Security scan results',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 12,
              title: 'Architectural Consistency',
              description: 'Follows established project patterns',
              requirements: [
                'Consistent with existing codebase style',
                'Maintains separation of concerns',
              ],
              evidence: 'Architecture review checklist',
              validation: 'manual',
              mandatory: false,
            },
            {
              id: 13,
              title: 'Dependency Validation',
              description: 'Dependencies properly managed',
              requirements: [
                'Version compatibility verified',
                'Licenses compatible with project',
              ],
              evidence: 'Dependency audit report',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 14,
              title: 'Version Compatibility',
              description: 'Compatible with target platform versions',
              requirements: [
                'Backward compatibility maintained',
                'Breaking changes documented',
              ],
              evidence: 'Compatibility test results',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 15,
              title: 'Security Audit',
              description: 'Dependencies scanned for vulnerabilities',
              requirements: [
                'Code scanned for security issues',
                'Authentication/authorization validated',
              ],
              evidence: 'Security audit report',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 16,
              title: 'Cross-Platform',
              description: 'Works across supported platforms',
              requirements: [
                'Platform-specific issues addressed',
                'Environment compatibility verified',
              ],
              evidence: 'Multi-platform test results',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 17,
              title: 'Environment Variables',
              description: 'Required environment variables documented',
              requirements: [
                'Default values provided where appropriate',
                'Configuration validation implemented',
              ],
              evidence: 'Environment configuration guide',
              validation: 'manual',
              mandatory: false,
            },
            {
              id: 18,
              title: 'Configuration',
              description: 'Proper configuration management',
              requirements: [
                'Settings externalized appropriately',
                'Configuration validation implemented',
              ],
              evidence: 'Configuration documentation',
              validation: 'manual',
              mandatory: false,
            },
            {
              id: 19,
              title: 'No Credential Exposure',
              description: 'No secrets or credentials in code',
              requirements: [
                'Secure credential management',
                'No sensitive data in logs',
              ],
              evidence: 'Credential scan results',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 20,
              title: 'Input Validation',
              description: 'All user inputs properly validated',
              requirements: [
                'Sanitization implemented where needed',
                'Boundary conditions handled',
              ],
              evidence: 'Input validation test results',
              validation: 'automated',
              mandatory: false,
            },
          ],
        },
        [this.categories.INTEGRATION]: {
          name: 'Final Validation',
          description: 'Integration and operational criteria (Points 21-25)',
          points: [
            {
              id: 21,
              title: 'Output Encoding',
              description: 'Proper output encoding to prevent injection',
              requirements: [
                'Data sanitization before output',
                'Context-appropriate encoding used',
              ],
              evidence: 'Output validation test results',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 22,
              title: 'Authentication/Authorization',
              description: 'Proper access controls implemented',
              requirements: [
                'User permissions validated',
                'Security boundaries enforced',
              ],
              evidence: 'Auth/authz test results',
              validation: 'automated',
              mandatory: false,
            },
            {
              id: 23,
              title: 'License Compliance',
              description: 'All code compatible with project license',
              requirements: [
                'Third-party licenses compatible',
                'License headers present where required',
              ],
              evidence: 'License compliance report',
              validation: 'manual',
              mandatory: false,
            },
            {
              id: 24,
              title: 'Data Privacy',
              description: 'No unauthorized data collection',
              requirements: [
                'Privacy policies followed',
                'Data minimization principles applied',
              ],
              evidence: 'Privacy compliance review',
              validation: 'manual',
              mandatory: false,
            },
            {
              id: 25,
              title: 'Regulatory Compliance',
              description: 'Applicable regulations considered',
              requirements: [
                'Compliance requirements met',
                'Audit trails maintained where required',
              ],
              evidence: 'Regulatory compliance checklist',
              validation: 'manual',
              mandatory: false,
            },
          ],
        },
      },
    };

    // Cache the standard template
    this.templateCache.set('25_point_standard', this.standardTemplate);
  }

  /**
   * Load configuration from success-criteria-config.json
   */
  async loadConfiguration() {
    try {
      const configPath = path.join(this.projectRoot, 'development', 'essentials', 'success-criteria-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);

      this.config = config;
      this.configCache.set('main', config);

      this.logger.info('TemplateManager: Configuration loaded successfully');
    } catch (error) {
      this.logger.warn('TemplateManager: Could not load configuration, using defaults', error.message);
      this.config = this.getDefaultConfiguration();
    }
  }

  /**
   * Get default configuration if file is not available
   */
  getDefaultConfiguration() {
    return {
      default_template: '25_point_standard',
      validation_timeout: 300,
      auto_inheritance: true,
      mandatory_validation: true,
      project_wide_criteria: {},
      validation_rules: {},
    };
  }

  /**
   * Load template by ID with caching
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Template object or null
   */
  async loadTemplate(templateId) {
    try {
      // Check cache first
      if (this.templateCache.has(templateId)) {
        return this.templateCache.get(templateId);
      }

      // Handle standard template
      if (templateId === '25_point_standard') {
        return this.standardTemplate;
      }

      // Try to load custom template from file system
      const templatePath = path.join(this.projectRoot, 'development', 'templates', `${templateId}.json`);

      try {
        const templateData = await fs.readFile(templatePath, 'utf8');
        const template = JSON.parse(templateData);

        // Validate template structure
        const validationResult = this.validateTemplateStructure(template);
        if (!validationResult.valid) {
          this.logger.error(`TemplateManager: Invalid template structure for ${templateId}:`, validationResult.errors);
          return null;
        }

        // Cache the template
        this.templateCache.set(templateId, template);
        return template;
      } catch (fileError) {
        this.logger.warn(`TemplateManager: Template file not found for ${templateId}:`, fileError.message);
        return null;
      }
    } catch (error) {
      this.logger.error(`TemplateManager: Error loading template ${templateId}:`, error.message);
      return null;
    }
  }

  /**
   * Apply inheritance rules to create final criteria set for a task
   * @param {string} taskId - Task identifier
   * @param {Object} taskData - Task data object
   * @param {Array} customCriteria - Custom criteria to add
   * @returns {Promise<Object>} Final criteria set with inheritance applied
   */
  async applyInheritance(taskId, taskData, customCriteria = []) {
    try {
      const cacheKey = `${taskId}_${JSON.stringify(customCriteria)}`;

      // Check inheritance cache
      if (this.inheritanceCache.has(cacheKey)) {
        return this.inheritanceCache.get(cacheKey);
      }

      const result = {
        templateCriteria: [],
        projectWideCriteria: [],
        customCriteria: customCriteria,
        finalCriteria: [],
        inheritance: {
          template: null,
          projectWide: [],
          applied: [],
        },
      };

      // 1. Load template criteria
      const templateId = this.config.default_template || '25_point_standard';
      const template = await this.loadTemplate(templateId);

      if (template) {
        result.templateCriteria = this.extractCriteriaFromTemplate(template);
        result.inheritance.template = templateId;
      }

      // 2. Apply project-wide inheritance rules
      const taskCategory = taskData.category || 'feature';
      const projectWideRules = this.config.validation_rules[`${taskCategory}_tasks`];

      if (projectWideRules && projectWideRules.inherit_from) {
        for (const ruleSetName of projectWideRules.inherit_from) {
          const ruleSet = this.config.project_wide_criteria[ruleSetName];
          if (ruleSet && ruleSet.applies_to.includes(taskCategory)) {
            result.projectWideCriteria.push(...ruleSet.criteria);
            result.inheritance.projectWide.push(ruleSetName);
          }
        }
      }

      // 3. Combine all criteria with precedence: Template < Project-wide < Custom
      const allCriteria = [
        ...result.templateCriteria,
        ...result.projectWideCriteria,
        ...result.customCriteria,
      ];

      // Remove duplicates while preserving order
      result.finalCriteria = [...new Set(allCriteria)];
      result.inheritance.applied = result.finalCriteria.length;

      // Cache the result
      this.inheritanceCache.set(cacheKey, result);

      this.logger.info(`TemplateManager: Applied inheritance for task ${taskId}:`, {
        template: result.inheritance.template,
        projectWide: result.inheritance.projectWide.length,
        custom: result.customCriteria.length,
        final: result.finalCriteria.length,
      });

      return result;
    } catch (error) {
      this.logger.error(`TemplateManager: Error applying inheritance for task ${taskId}:`, error.message);
      return {
        templateCriteria: [],
        projectWideCriteria: [],
        customCriteria: customCriteria,
        finalCriteria: customCriteria,
        inheritance: {
          template: null,
          projectWide: [],
          applied: customCriteria.length,
        },
      };
    }
  }

  /**
   * Extract criteria strings from template object
   * @param {Object} template - Template object
   * @returns {Array<string>} Array of criteria strings
   */
  extractCriteriaFromTemplate(template) {
    const criteria = [];

    if (template.categories) {
      Object.values(template.categories).forEach(category => {
        if (category.points) {
          category.points.forEach(point => {
            criteria.push(point.title);
          });
        }
      });
    }

    return criteria;
  }

  /**
   * Get criteria categorization from template
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Categorized criteria object
   */
  async getCriteriaCategories(templateId = '25_point_standard') {
    try {
      const template = await this.loadTemplate(templateId);
      if (!template || !template.categories) {
        return null;
      }

      const categorized = {};

      Object.entries(template.categories).forEach(([categoryKey, category]) => {
        categorized[categoryKey] = {
          name: category.name,
          description: category.description,
          count: category.points.length,
          criteria: category.points.map(point => ({
            id: point.id,
            title: point.title,
            description: point.description,
            mandatory: point.mandatory,
            validation: point.validation,
            evidence: point.evidence,
          })),
        };
      });

      return categorized;
    } catch (error) {
      this.logger.error(`TemplateManager: Error getting categories for template ${templateId}:`, error.message);
      return null;
    }
  }

  /**
   * Validate custom criteria against project standards
   * @param {Array} criteria - Array of criteria to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateCriteria(criteria, options = {}) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(criteria)) {
      errors.push('Criteria must be an array');
      return { valid: false, errors, warnings };
    }

    criteria.forEach((criterion, index) => {
      // Basic validation
      if (typeof criterion !== 'string') {
        errors.push(`Criterion at index ${index} must be a string`);
        return;
      }

      if (criterion.trim().length === 0) {
        errors.push(`Criterion at index ${index} cannot be empty`);
        return;
      }

      if (criterion.length > 200) {
        errors.push(`Criterion at index ${index} exceeds maximum length of 200 characters`);
        return;
      }

      // Content validation
      if (!/^[A-Z]/.test(criterion.trim())) {
        warnings.push(`Criterion at index ${index} should start with a capital letter`);
      }

      // Check for common issues
      if (criterion.includes('TODO') || criterion.includes('FIXME')) {
        warnings.push(`Criterion at index ${index} contains TODO/FIXME - ensure it's finalized`);
      }
    });

    // Check for duplicates
    const uniqueCriteria = new Set(criteria);
    if (uniqueCriteria.size !== criteria.length) {
      errors.push('Criteria must be unique (no duplicates found)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template structure
   * @param {Object} template - Template object to validate
   * @returns {Object} Validation result
   */
  validateTemplateStructure(template) {
    const errors = [];

    if (!template.id) {
      errors.push('Template must have an id field');
    }

    if (!template.name) {
      errors.push('Template must have a name field');
    }

    if (!template.version) {
      errors.push('Template must have a version field');
    }

    if (!template.categories || typeof template.categories !== 'object') {
      errors.push('Template must have a categories object');
    } else {
      Object.entries(template.categories).forEach(([categoryKey, category]) => {
        if (!category.name) {
          errors.push(`Category ${categoryKey} must have a name field`);
        }

        if (!category.points || !Array.isArray(category.points)) {
          errors.push(`Category ${categoryKey} must have a points array`);
        } else {
          category.points.forEach((point, index) => {
            if (!point.id) {
              errors.push(`Point at index ${index} in category ${categoryKey} must have an id`);
            }
            if (!point.title) {
              errors.push(`Point at index ${index} in category ${categoryKey} must have a title`);
            }
            if (!point.description) {
              errors.push(`Point at index ${index} in category ${categoryKey} must have a description`);
            }
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new custom template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Creation result
   */
  async createCustomTemplate(templateData) {
    try {
      // Validate template structure
      const validationResult = this.validateTemplateStructure(templateData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: 'Invalid template structure',
          validationErrors: validationResult.errors,
        };
      }

      // Ensure templates directory exists
      const templatesDir = path.join(this.projectRoot, 'development', 'templates');
      await fs.mkdir(templatesDir, { recursive: true });

      // Save template to file
      const templatePath = path.join(templatesDir, `${templateData.id}.json`);
      await fs.writeFile(templatePath, JSON.stringify(templateData, null, 2), 'utf8');

      // Add to cache
      this.templateCache.set(templateData.id, templateData);

      this.logger.info(`TemplateManager: Created custom template ${templateData.id}`);

      return {
        success: true,
        templateId: templateData.id,
        message: 'Custom template created successfully',
      };
    } catch (error) {
      this.logger.error('TemplateManager: Error creating custom template:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update template versioning
   * @param {string} templateId - Template identifier
   * @param {string} newVersion - New version string
   * @returns {Promise<Object>} Update result
   */
  async updateTemplateVersion(templateId, newVersion) {
    try {
      const template = await this.loadTemplate(templateId);
      if (!template) {
        return {
          success: false,
          error: `Template ${templateId} not found`,
        };
      }

      // Update version
      template.version = newVersion;
      template.lastUpdated = new Date().toISOString();

      // Save updated template
      if (templateId !== '25_point_standard') {
        const templatePath = path.join(this.projectRoot, 'development', 'templates', `${templateId}.json`);
        await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf8');
      }

      // Update cache
      this.templateCache.set(templateId, template);

      this.logger.info(`TemplateManager: Updated template ${templateId} to version ${newVersion}`);

      return {
        success: true,
        templateId,
        version: newVersion,
        message: 'Template version updated successfully',
      };
    } catch (error) {
      this.logger.error(`TemplateManager: Error updating template version for ${templateId}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.templateCache.clear();
    this.configCache.clear();
    this.inheritanceCache.clear();
    this.logger.info('TemplateManager: All caches cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStatistics() {
    return {
      templates: this.templateCache.size,
      configurations: this.configCache.size,
      inheritance: this.inheritanceCache.size,
      totalMemoryFootprint: JSON.stringify({
        templates: [...this.templateCache.values()],
        configs: [...this.configCache.values()],
        inheritance: [...this.inheritanceCache.values()],
      }).length,
    };
  }
}

module.exports = TemplateManager;
