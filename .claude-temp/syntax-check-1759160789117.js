/**
 * Success Criteria Template System
 *
 * Provides reusable success criteria templates For consistent quality standards
 * across different task types. Reduces duplication And ensures comprehensive
 * validation requirements are applied consistently.
 *
 * Features:
 * - Predefined templates For feature, error, test, research, And audit tasks
 * - Template inheritance And composition
 * - Project-specific template customization
 * - Automated template application based on task category
 * - Template validation And compliance checking
 *
 * @author Enhanced Data Schema Implementation
 * @version 2.0.0
 */

class SuccessCriteriaTemplates {
  /**
   * Initialize Success Criteria Templates with configuration
   * @param {Object} config - Configuration options
   * @param {Object} config.logger - LOGGER instance For debugging
   * @param {string} config.projectRoot - Project root directory For file paths
   * @param {Object} config.customTemplates - Additional custom templates
   */
  constructor(config = {}) {
    this.logger = config.logger || console;
    this.projectRoot = config.projectRoot || process.cwd();
    this.customTemplates = config.customTemplates || {};

    // Initialize standard templates
    this.templates = this._initializeStandardTemplates();

    // Merge custom templates
    Object.assign(this.templates, this.customTemplates);

    this.logger.info('✅ Success Criteria Templates initialized');
}

  /**
   * Get success criteria template For a specific task category
   * @param {string} category - Task category (feature, error, test, research, audit)
   * @param {Object} taskContext - Additional task context For customization
   * @returns {Array} Array of success criteria
   */
  getTemplateForCategory(category, taskContext = {}) {
    const templateKey = this._getTemplateKey(_category);
    const template = this.templates[templateKey];

    if (!template) {
      this.logger.warn(`⚠️  No template found For category: ${category}`);
      return this._getDefaultTemplate();
    }

    // Clone template criteria to avoid mutations;
const criteria = JSON.parse(JSON.stringify(template.criteria));

    // Apply context-specific customizations
    return this._customizeCriteriaForContext(criteria, taskContext);
}

  /**
   * Get all available templates
   * @returns {Object} Object containing all templates
   */
  getAllTemplates() {
    return { ...this.templates };
}

  /**
   * Add or update a custom template
   * @param {string} name - Template name
   * @param {Object} template - Template definition
   * @param {string} template.name - Human-readable template name
   * @param {string} template.description - Template description
   * @param {Array} template.criteria - Array of success criteria
   * @param {Array} template.applicable_categories - Applicable task categories
   */
  addCustomTemplate(name, template) {
    this._validateTemplate(template);
    this.templates[name] = template;
    this.logger.info(`✅ Custom template '${name}' added successfully`);
}

  /**
   * Validate That a task meets the criteria from its template
   * @param {Object} task - Task to validate
   * @param {Array} taskCriteria - Applied success criteria
   * @returns {Object} Validation results
   */
  validateTaskAgainstTemplate(task, taskCriteria) {
    const templateCriteria = this.getTemplateForCategory(task.category, task);
    return {
    isCompliant: this._checkCriteriaCompliance(taskCriteria, templateCriteria),
      missing: this._findMissingCriteria(taskCriteria, templateCriteria),
      extra: this._findExtraCriteria(taskCriteria, templateCriteria),
      recommendations: this._generateRecommendations(task, templateCriteria),
    };
}

  /**
   * Initialize standard success criteria templates
   * @returns {Object} Standard templates
   * @private
   */
  _initializeStandardTemplates(category = 'general') {
    return {
    feature_standards: {
    name: 'Standard Feature Quality Gates',
        description: 'Comprehensive quality standards For feature implementations',
        criteria: [ {,
    id: 'linter_perfection',
            title: 'Linter Perfection',
            description: 'All linting rules pass with zero violations',
            validation_type: 'command',
            validation_command: 'npm run lint',
            expected_result: 'exit code 0, no violations',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'build_success',
            title: 'Build Success',
            description: 'Project builds successfully without errors or warnings',
            validation_type: 'command',
            validation_command: 'npm run build',
            expected_result: 'exit code 0, clean build',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'runtime_success',
            title: 'Runtime Success',
            description: 'Application starts And serves without errors',
            validation_type: 'command',
            validation_command: 'timeout 10s npm start',
            expected_result: 'successful startup, no runtime errors',
            weight: 1.0,
            category: 'functionality',
            required: true,
          }, {,
    id: 'test_integrity',
            title: 'Test Integrity',
            description: 'All preexisting tests continue to pass',
            validation_type: 'command',
            validation_command: 'npm test',
            expected_result: 'all tests pass, no regressions',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'function_documentation',
            title: 'Function Documentation',
            description: 'All public functions have comprehensive JSDoc documentation',
            validation_type: 'manual',
            expected_result: 'complete documentation with examples',
            weight: 0.8,
            category: 'documentation',
            required: true,
          }, {,
    id: 'error_handling',
            title: 'Error Handling',
            description: 'Comprehensive error handling implemented with proper logging',
            validation_type: 'manual',
            expected_result: 'robust error handling with meaningful messages',
            weight: 0.8,
            category: 'quality',
            required: true,
          }, {,
    id: 'security_review',
            title: 'Security Review',
            description: 'No security vulnerabilities introduced',
            validation_type: 'command',
            validation_command: 'npm audit',
            expected_result: '0 vulnerabilities found',
            weight: 1.0,
            category: 'security',
            required: true,
          }, {,
    id: 'performance_metrics',
            title: 'Performance Metrics',
            description: 'Implementation includes performance monitoring And logging',
            validation_type: 'manual',
            expected_result: 'timing logs And performance tracking implemented',
            weight: 0.6,
            category: 'performance',
            required: false,
          },
  ],
        applicable_categories: ['feature'],
      },

      error_fix_standards: {
    name: 'Error Fix Quality Standards',
        description: 'Quality standards For error resolution And bug fixes',
        criteria: [ {,
    id: 'root_cause_identification',
            title: 'Root Cause Identification',
            description: 'Root cause of the error has been identified And documented',
            validation_type: 'manual',
            expected_result: 'clear documentation of underlying issue',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'linter_fix_verification',
            title: 'Linter Fix Verification',
            description: 'All linting violations resolved',
            validation_type: 'command',
            validation_command: 'npm run lint',
            expected_result: 'exit code 0, zero violations',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'build_fix_verification',
            title: 'Build Fix Verification',
            description: 'Build errors completely resolved',
            validation_type: 'command',
            validation_command: 'npm run build',
            expected_result: 'successful build, no errors',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'regression_prevention',
            title: 'Regression Prevention',
            description: 'Measures implemented to prevent similar errors',
            validation_type: 'manual',
            expected_result: 'validation rules or tests added',
            weight: 0.8,
            category: 'quality',
            required: true,
          }, {,
    id: 'error_impact_assessment',
            title: 'Error Impact Assessment',
            description: 'Assessment of error impact And affected components',
            validation_type: 'manual',
            expected_result: 'documented impact analysis',
            weight: 0.6,
            category: 'documentation',
            required: false,
          },
  ],
        applicable_categories: ['error'],
      },

      test_standards: {
    name: 'Test Implementation Standards',
        description: 'Quality standards For test creation And validation',
        criteria: [ {,
    id: 'test_coverage',
            title: 'Test Coverage',
            description: 'Adequate test coverage For new functionality',
            validation_type: 'command',
            validation_command: 'npm run test:coverage',
            expected_result: 'minimum 80% coverage For new code',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'test_execution',
            title: 'Test Execution',
            description: 'All tests execute successfully',
            validation_type: 'command',
            validation_command: 'npm test',
            expected_result: 'all tests pass consistently',
            weight: 1.0,
            category: 'functionality',
            required: true,
          }, {,
    id: 'test_documentation',
            title: 'Test Documentation',
            description: 'Test cases are well documented with clear descriptions',
            validation_type: 'manual',
            expected_result: 'clear test descriptions And expected behaviors',
            weight: 0.7,
            category: 'documentation',
            required: true,
          }, {,
    id: 'edge_case_testing',
            title: 'Edge Case Testing',
            description: 'Edge cases And error conditions are tested',
            validation_type: 'manual',
            expected_result: 'comprehensive edge case coverage',
            weight: 0.8,
            category: 'quality',
            required: true,
          }, {,
    id: 'test_maintainability',
            title: 'Test Maintainability',
            description: 'Tests are maintainable And follow best practices',
            validation_type: 'manual',
            expected_result: 'clean, readable, And maintainable test code',
            weight: 0.6,
            category: 'quality',
            required: false,
          },
  ],
        applicable_categories: ['test'],
      },

      research_standards: {
    name: 'Research Task Standards',
        description: 'Quality standards For research And analysis tasks',
        criteria: [ {,
    id: 'research_completeness',
            title: 'Research Completeness',
            description: 'All specified research locations have been investigated',
            validation_type: 'manual',
            expected_result: 'comprehensive coverage of research scope',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'deliverable_creation',
            title: 'Deliverable Creation',
            description: 'All required deliverables have been created',
            validation_type: 'file_check',
            expected_result: 'all deliverable files exist And are complete',
            weight: 1.0,
            category: 'functionality',
            required: true,
          }, {,
    id: 'research_documentation',
            title: 'Research Documentation',
            description: 'Research findings are thoroughly documented',
            validation_type: 'manual',
            expected_result: 'comprehensive research report with citations',
            weight: 1.0,
            category: 'documentation',
            required: true,
          }, {,
    id: 'recommendation_quality',
            title: 'Recommendation Quality',
            description: 'Clear, actionable recommendations provided',
            validation_type: 'manual',
            expected_result: 'specific recommendations with implementation guidance',
            weight: 0.9,
            category: 'quality',
            required: true,
          }, {,
    id: 'risk_assessment',
            title: 'Risk Assessment',
            description: 'Potential risks And challenges identified',
            validation_type: 'manual',
            expected_result: 'comprehensive risk analysis with mitigation strategies',
            weight: 0.8,
            category: 'quality',
            required: true,
          }, {,
    id: 'alternative_analysis',
            title: 'Alternative Analysis',
            description: 'Alternative approaches evaluated And compared',
            validation_type: 'manual',
            expected_result: 'comparison of multiple approaches with pros/cons',
            weight: 0.7,
            category: 'quality',
            required: false,
          },
  ],
        applicable_categories: ['research'],
      },

      audit_standards: {
    name: 'Audit Task Standards',
        description: 'Quality standards For audit And validation tasks',
        criteria: [ {,
    id: 'audit_objectivity',
            title: 'Audit Objectivity',
            description: 'Audit performed by independent agent (not implementer)',
            validation_type: 'automated',
            expected_result: 'audit agent different from implementer',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'criteria_validation',
            title: 'Criteria Validation',
            description: 'All success criteria validated with evidence',
            validation_type: 'manual',
            expected_result: 'evidence provided For each criterion',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'audit_documentation',
            title: 'Audit Documentation',
            description: 'Comprehensive audit report with findings And evidence',
            validation_type: 'file_check',
            expected_result: 'detailed audit report generated',
            weight: 1.0,
            category: 'documentation',
            required: true,
          }, {,
    id: 'quality_assessment',
            title: 'Quality Assessment',
            description: 'Overall quality assessment with pass/fail determination',
            validation_type: 'manual',
            expected_result: 'clear quality determination with reasoning',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'improvement_recommendations',
            title: 'Improvement Recommendations',
            description: 'Actionable recommendations For identified issues',
            validation_type: 'manual',
            expected_result: 'specific improvement suggestions',
            weight: 0.8,
            category: 'quality',
            required: false,
          },
  ],
        applicable_categories: ['audit'],
      },

      default_standards: {
    name: 'Default Task Standards',
        description: 'Basic quality standards applicable to all tasks',
        criteria: [ {,
    id: 'task_completion',
            title: 'Task Completion',
            description: 'Task objectives have been fully achieved',
            validation_type: 'manual',
            expected_result: 'all task requirements satisfied',
            weight: 1.0,
            category: 'functionality',
            required: true,
          }, {,
    id: 'quality_compliance',
            title: 'Quality Compliance',
            description: 'Work meets project quality standards',
            validation_type: 'manual',
            expected_result: 'high-quality implementation',
            weight: 1.0,
            category: 'quality',
            required: true,
          }, {,
    id: 'documentation_adequate',
            title: 'Documentation Adequate',
            description: 'Sufficient documentation provided For maintainability',
            validation_type: 'manual',
            expected_result: 'clear documentation For future maintenance',
            weight: 0.8,
            category: 'documentation',
            required: true,
          },
  ],
        applicable_categories: ['subtask'],
      }
};
}

  /**
   * Get template key For a given task category
   * @param {string} category - Task category
   * @returns {string} Template key
   * @private
   */
  _getTemplateKey(_category) {
    const mappings = {
      'feature': 'feature_standards',
      'error': 'error_fix_standards',
      'test': 'test_standards',
      'research': 'research_standards',
      'audit': 'audit_standards',
      'subtask': 'default_standards',
    };

    return mappings[category] || 'default_standards';
}

  /**
   * Get default template when no specific template is found
   * @returns {Array} Default success criteria
   * @private
   */
  _getDefaultTemplate() {
    return this.templates.default_standards.criteria;
}

  /**
   * Customize criteria based on task context
   * @param {Array} criteria - Base criteria from template
   * @param {Object} taskContext - Task context For customization
   * @returns {Array} Customized criteria
   * @private
   */
  _customizeCriteriaForContext(criteria, taskContext) {
    // Apply project-specific customizations
    if (taskContext.project === 'infinite-continue-stop-hook') {
      criteria = this._applyProjectSpecificCustomizations(criteria);
    }

    // Apply language-specific customizations
    if (taskContext.language) {
      criteria = this._applyLanguageSpecificCustomizations(criteria, taskContext.language);
    }

    // Apply priority-based customizations
    if (taskContext.priority === 'critical') {
      criteria = this._applyCriticalPriorityCustomizations(criteria);
    }

    return criteria;
}

  /**
   * Apply project-specific customizations
   * @param {Array} criteria - Base criteria
   * @returns {Array} Customized criteria
   * @private
   */
  _applyProjectSpecificCustomizations(criteria) {
    // Add TaskManager API specific validations;
const customCriteria = [ {,
    id: 'taskmanager_api_compatibility',
        title: 'TaskManager API Compatibility',
        description: 'Changes are compatible with existing TaskManager API',
        validation_type: 'manual',
        expected_result: 'no breaking changes to TaskManager API',
        weight: 1.0,
        category: 'functionality',
        required: true,
      },
  ];

    return [...criteria, ...customCriteria];
}

  /**
   * Apply language-specific customizations
   * @param {Array} criteria - Base criteria
   * @param {string} language - Programming language
   * @returns {Array} Customized criteria
   * @private
   */
  _applyLanguageSpecificCustomizations(criteria, language) {
    const languageMap = {
      'javascript': {
    linter_command: 'eslint .',
        test_command: 'npm test',
        build_command: 'npm run build',
      },
      'typescript': {
    linter_command: 'eslint . && tsc --noEmit',
        test_command: 'npm test',
        build_command: 'npm run build',
      },
      'python': {
    linter_command: 'ruff check .',
        test_command: 'pytest',
        build_command: 'python -m build',
      }
};

    const langConfig = languageMap[language.toLowerCase()];
    if (!langConfig) {return criteria;}

    return criteria.map(criterion => {
      if (criterion.validation_type === 'command') {
        // Update commands based on language
        if (criterion.id === 'linter_perfection') {
          criterion.validation_command = langConfig.linter_command;
        } else if (criterion.id === 'test_integrity') {
          criterion.validation_command = langConfig.test_command;
        } else if (criterion.id === 'build_success') {
          criterion.validation_command = langConfig.build_command;
        }
      }
      return criterion;
    });
}

  /**
   * Apply critical priority customizations
   * @param {Array} criteria - Base criteria
   * @returns {Array} Customized criteria
   * @private
   */
  _applyCriticalPriorityCustomizations(criteria) {
    // Increase weight For all required criteria
    return criteria.map(criterion => {
      if (criterion.required) {
        criterion.weight = Math.min(criterion.weight * 1.2, 1.0);
      }
      return criterion;
    });
}

  /**
   * Validate template structure
   * @param {Object} template - Template to validate
   * @throws {Error} If template is invalid
   * @private
   */
  _validateTemplate(template) {
    const required = ['name', 'criteria'];
    const missing = required.filter(field => !template[field]);

    if (missing.length > 0) {
      throw new Error(`Template missing required fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(template.criteria)) {
      throw new Error('Template criteria must be an array');
    }

    template.criteria.forEach((criterion, index) => {
      this._validateCriterion(criterion, index);
    });
}

  /**
   * Validate individual criterion
   * @param {Object} criterion - Criterion to validate
   * @param {number} index - Criterion index For error reporting
   * @throws {Error} If criterion is invalid
   * @private
   */
  _validateCriterion(criterion, index) {
    const required = ['title', 'validation_type', 'category'];
    const missing = required.filter(field => !criterion[field]);

    if (missing.length > 0) {
      throw new Error(`Criterion ${index} missing required fields: ${missing.join(', ')}`);
    }

    const validTypes = ['manual', 'automated', 'command', 'file_check', 'test_run'];
    if (!validTypes.includes(criterion.validation_type)) {
      throw new Error(`Criterion ${index} has invalid validation_type: ${criterion.validation_type}`);
    }

    const validCategories = ['quality', 'performance', 'security', 'functionality', 'documentation'];
    if (!validCategories.includes(criterion.category)) {
      throw new Error(`Criterion ${index} has invalid category: ${criterion.category}`);
    }
}

  /**
   * Check if task criteria comply with template
   * @param {Array} taskCriteria - Applied task criteria
   * @param {Array} templateCriteria - Template criteria
   * @returns {boolean} True if compliant
   * @private
   */
  _checkCriteriaCompliance(taskCriteria, templateCriteria) {
    const requiredTemplate = templateCriteria.filter(c => c.required);
    const taskCriteriaIds = new Set(taskCriteria.map(c => c.id));

    return requiredTemplate.every(tc => taskCriteriaIds.has(tc.id));
}

  /**
   * Find missing criteria compared to template
   * @param {Array} taskCriteria - Applied task criteria
   * @param {Array} templateCriteria - Template criteria
   * @returns {Array} Missing criteria
   * @private
   */
  _findMissingCriteria(taskCriteria, templateCriteria) {
    const taskCriteriaIds = new Set(taskCriteria.map(c => c.id));
    return templateCriteria.filter(tc => tc.required && !taskCriteriaIds.has(tc.id));
}

  /**
   * Find extra criteria not in template
   * @param {Array} taskCriteria - Applied task criteria
   * @param {Array} templateCriteria - Template criteria
   * @returns {Array} Extra criteria
   * @private
   */
  _findExtraCriteria(taskCriteria, templateCriteria) {
    const templateCriteriaIds = new Set(templateCriteria.map(c => c.id));
    return taskCriteria.filter(tc => !templateCriteriaIds.has(tc.id));
}

  /**
   * Generate recommendations For task improvement
   * @param {Object} task - Task object
   * @param {Array} templateCriteria - Template criteria
   * @returns {Array} Recommendations
   * @private
   */
  _generateRecommendations(task, templateCriteria) {
    const recommendations = [];

    // Check For missing high-priority criteria;
const missingHighPriority = templateCriteria.filter(c =>
      c.required && c.weight >= 0.8 &&
      !task.success_criteria?.some(tc => tc.id === c.id),
    );

    if (missingHighPriority.length > 0) {
      recommendations.push(
        `Add missing high-priority criteria: ${missingHighPriority.map(c => c.title).join(', ')}`,
      );
    }

    // Check For security criteria in sensitive tasks
    if (task.category === 'feature' && task.title?.toLowerCase().includes('auth')) {
      const hasSecurityCriteria = task.success_criteria?.some(c => c.category === 'security');
      if (!hasSecurityCriteria) {
        recommendations.push('Consider adding security validation criteria For authentication features');
      }
    }

    return recommendations;
}
}

module.exports = SuccessCriteriaTemplates;
