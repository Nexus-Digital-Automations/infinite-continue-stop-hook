/**
 * Inheritance Manager - Project-Wide Criteria Inheritance
 *
 * Manages project-wide success criteria inheritance rules, allowing for
 * consistent application of quality standards across all tasks while
 * supporting custom overrides and task-specific requirements.
 *
 * Features:
 * - Project-wide inheritance rules by task type
 * - Custom inheritance sets and configurations
 * - Hierarchical inheritance with precedence rules
 * - Task category-based automatic application
 * - Override and customization support
 * - Caching for performance optimization
 *
 * @class InheritanceManager
 * @author API Infrastructure Agent #1
 * @version 3.0.0
 * @since 2025-09-15
 */

const _fs = require('fs').promises;
// Path dependency removed as unused in this implementation

class InheritanceManager {
  /**
   * Initialize InheritanceManager
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.taskManager - TaskManager instance
   * @param {Object} dependencies.templateManager - TemplateManager instance
   */
  constructor(dependencies) {
    this.taskManager = dependencies.taskManager;
    this.templateManager = dependencies.templateManager;

    // Inheritance configuration
    this.configPath = '/Users/jeremyparker/infinite-continue-stop-hook/development/essentials/success-criteria-config.json';
    this.inheritanceCache = new Map();
    this.projectRulesCache = new Map();

    // Default inheritance rules
    this.defaultInheritanceRules = {
      // Task type inheritance rules
      feature: {
        template: '25_point_standard',
        mandatory_categories: ['critical'],
        optional_categories: ['security', 'excellence'],
        project_wide_sets: ['security_baseline', 'documentation_standards'],
        priority: 'normal',
      },
      subtask: {
        template: 'basic',
        mandatory_categories: ['critical'],
        optional_categories: [],
        project_wide_sets: ['security_baseline'],
        priority: 'normal',
      },
      error: {
        template: 'basic',
        mandatory_categories: ['critical'],
        optional_categories: [],
        project_wide_sets: ['error_resolution'],
        priority: 'high',
      },
      test: {
        template: 'comprehensive',
        mandatory_categories: ['critical', 'security'],
        optional_categories: ['excellence'],
        project_wide_sets: ['testing_standards', 'security_baseline'],
        priority: 'high',
      },
    };

    // Default project-wide criteria sets
    this.defaultProjectWideSets = {
      security_baseline: {
        name: 'Security Baseline',
        description: 'Minimum security requirements for all tasks',
        criteria: [
          'Security Review',
          'No Credential Exposure',
          'Input Validation',
          'Output Encoding',
        ],
        applies_to: ['feature', 'subtask', 'test'],
        mandatory: true,
        priority: 1,
      },
      documentation_standards: {
        name: 'Documentation Standards',
        description: 'Documentation requirements for features',
        criteria: [
          'Function Documentation',
          'API Documentation',
          'Decision Rationale',
        ],
        applies_to: ['feature'],
        mandatory: false,
        priority: 2,
      },
      testing_standards: {
        name: 'Testing Standards',
        description: 'Additional testing requirements',
        criteria: [
          'Test Integrity',
          'Performance Metrics',
          'Cross-Platform',
        ],
        applies_to: ['test'],
        mandatory: true,
        priority: 1,
      },
      error_resolution: {
        name: 'Error Resolution',
        description: 'Requirements for error resolution tasks',
        criteria: [
          'Linter Perfection',
          'Build Success',
          'Runtime Success',
          'Error Handling',
        ],
        applies_to: ['error'],
        mandatory: true,
        priority: 1,
      },
    };

    // Load configuration
    this.loadInheritanceConfiguration().catch(err => {
      console.warn('Could not load inheritance configuration:', err.message);
    });
  }

  /**
   * Load inheritance configuration from file
   */
  async loadInheritanceConfiguration() {
    try {
      const configData = await _fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);

      // Merge with defaults
      this.inheritanceRules = {
        ...this.defaultInheritanceRules,
        ...(config.inheritance_rules || {}),
      };

      this.projectWideSets = {
        ...this.defaultProjectWideSets,
        ...(config.project_wide_criteria || {}),
      };

      // Cache the configuration
      this.projectRulesCache.set('main', {
        inheritanceRules: this.inheritanceRules,
        projectWideSets: this.projectWideSets,
        loaded: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      // Use defaults
      this.inheritanceRules = this.defaultInheritanceRules;
      this.projectWideSets = this.defaultProjectWideSets;
      return { success: false, error: error.message };
    }
  }

  /**
   * Get inherited criteria for a task
   * @param {string} taskId - Target task ID
   * @returns {Promise<Array<string>>} Inherited criteria
   */
  async getInheritedCriteria(taskId) {
    try {
      // Check cache first
      if (this.inheritanceCache.has(taskId)) {
        const cached = this.inheritanceCache.get(taskId);
        // Cache for 5 minutes
        if (Date.now() - cached.timestamp < 300000) {
          return cached.criteria;
        }
      }

      // Get task data
      const taskData = await this.taskManager.getTask(taskId);
      if (!taskData) {
        return [];
      }

      // Apply inheritance rules
      const inheritedCriteria = await this.applyInheritance(taskId, taskData.category || 'feature');

      // Cache the result
      this.inheritanceCache.set(taskId, {
        criteria: inheritedCriteria,
        timestamp: Date.now(),
      });

      return inheritedCriteria;
    } catch (error) {
      console.warn(`Failed to get inherited criteria for task ${taskId}:`, error.message);
      return [];
    }
  }

  /**
   * Apply inheritance rules to get criteria for a task
   * @param {string} taskId - Target task ID
   * @param {string} taskCategory - Task category (feature, subtask, error, test)
   * @param {Array<string>} inheritanceSets - Optional specific inheritance sets to apply
   * @returns {Promise<Object>} Inheritance application result
   */
  async applyInheritance(taskId, taskCategory, inheritanceSets = null) {
    try {
      const result = {
        success: true,
        taskId,
        taskCategory,
        appliedCriteria: [],
        sources: {
          template: null,
          mandatoryCategories: [],
          optionalCategories: [],
          projectWideSets: [],
        },
        metadata: {
          totalCriteria: 0,
          inheritanceLevel: 'full',
          appliedAt: new Date().toISOString(),
        },
      };

      // Get inheritance rules for task category
      const categoryRules = this.inheritanceRules[taskCategory] || this.inheritanceRules.feature;

      // 1. Apply template criteria
      if (categoryRules.template) {
        const templateResult = await this.templateManager.getTemplate(categoryRules.template);
        if (templateResult.success) {
          result.appliedCriteria.push(...templateResult.criteria);
          result.sources.template = categoryRules.template;
        }
      }

      // 2. Apply mandatory category criteria from 25-point template
      if (categoryRules.mandatory_categories && categoryRules.mandatory_categories.length > 0) {
        const mandatoryCriteria = await this.getCriteriaFromCategories(
          categoryRules.mandatory_categories,
          true,
        );
        result.appliedCriteria.push(...mandatoryCriteria);
        result.sources.mandatoryCategories = categoryRules.mandatory_categories;
      }

      // 3. Apply optional category criteria
      if (categoryRules.optional_categories && categoryRules.optional_categories.length > 0) {
        const optionalCriteria = await this.getCriteriaFromCategories(
          categoryRules.optional_categories,
          false,
        );
        result.appliedCriteria.push(...optionalCriteria);
        result.sources.optionalCategories = categoryRules.optional_categories;
      }

      // 4. Apply project-wide criteria sets
      const setsToApply = inheritanceSets || categoryRules.project_wide_sets || [];
      for (const setName of setsToApply) {
        const setResult = await this.applyProjectWideSet(setName, taskCategory);
        if (setResult.success) {
          result.appliedCriteria.push(...setResult.criteria);
          result.sources.projectWideSets.push(setName);
        }
      }

      // Remove duplicates while preserving order
      result.appliedCriteria = [...new Set(result.appliedCriteria)];
      result.metadata.totalCriteria = result.appliedCriteria.length;

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'INHERITANCE_APPLICATION_FAILED',
      };
    }
  }

  /**
   * Get criteria from specific template categories
   * @param {Array<string>} categories - Category names to extract
   * @param {boolean} mandatoryOnly - Only include mandatory criteria
   * @returns {Promise<Array<string>>} Criteria from categories
   */
  async getCriteriaFromCategories(categories, mandatoryOnly = false) {
    try {
      const templateResult = await this.templateManager.getTemplate('25_point_standard');
      if (!templateResult.success) {
        return [];
      }

      const categorizedCriteria = await this.templateManager.getCriteriaCategories('25_point_standard');
      if (!categorizedCriteria) {
        return [];
      }

      const criteria = [];

      for (const categoryKey of categories) {
        const category = categorizedCriteria[categoryKey];
        if (category && category.criteria) {
          for (const criterion of category.criteria) {
            if (!mandatoryOnly || criterion.mandatory) {
              criteria.push(criterion.title);
            }
          }
        }
      }

      return criteria;
    } catch (error) {
      console.warn('Failed to get criteria from categories:', error.message);
      return [];
    }
  }

  /**
   * Apply project-wide criteria set
   * @param {string} setName - Project-wide set name
   * @param {string} taskCategory - Task category
   * @returns {Object} Application result
   */
  applyProjectWideSet(setName, taskCategory) {
    try {
      const criteriaSet = this.projectWideSets[setName];
      if (!criteriaSet) {
        return {
          success: false,
          error: `Project-wide criteria set '${setName}' not found`,
        };
      }

      // Check if set applies to this task category
      if (criteriaSet.applies_to && !criteriaSet.applies_to.includes(taskCategory)) {
        return {
          success: false,
          error: `Criteria set '${setName}' does not apply to ${taskCategory} tasks`,
        };
      }

      return {
        success: true,
        setName,
        criteria: criteriaSet.criteria,
        mandatory: criteriaSet.mandatory,
        priority: criteriaSet.priority,
        appliedTo: taskCategory,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get project inheritance rules
   * @returns {Object} Project rules
   */
  getProjectRules() {
    try {
      return {
        success: true,
        inheritanceRules: this.inheritanceRules,
        projectWideSets: this.projectWideSets,
        availableCategories: Object.keys(this.inheritanceRules),
        availableSets: Object.keys(this.projectWideSets),
        configuration: {
          configPath: this.configPath,
          lastLoaded: this.projectRulesCache.get('main')?.loaded || null,
          cacheSize: this.inheritanceCache.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PROJECT_RULES_RETRIEVAL_FAILED',
      };
    }
  }

  /**
   * Update project-wide criteria set
   * @param {string} setName - Set name
   * @param {Object} setData - Set configuration
   * @returns {Promise<Object>} Update result
   */
  async updateProjectWideSet(setName, setData) {
    try {
      // Validate set data
      const validation = this.validateProjectWideSet(setData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid project-wide set data: ${validation.errors.join(', ')}`,
          errorCode: 'INVALID_SET_DATA',
        };
      }

      // Update in memory
      this.projectWideSets[setName] = {
        ...setData,
        lastUpdated: new Date().toISOString(),
      };

      // Save to configuration file
      await this.saveInheritanceConfiguration();

      // Clear relevant caches
      this.clearInheritanceCache();

      return {
        success: true,
        setName,
        message: `Project-wide criteria set '${setName}' updated successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'SET_UPDATE_FAILED',
      };
    }
  }

  /**
   * Update inheritance rules for a task category
   * @param {string} category - Task category
   * @param {Object} rules - Inheritance rules
   * @returns {Promise<Object>} Update result
   */
  async updateInheritanceRules(category, rules) {
    try {
      // Validate rules
      const validation = this.validateInheritanceRules(rules);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid inheritance rules: ${validation.errors.join(', ')}`,
          errorCode: 'INVALID_RULES',
        };
      }

      // Update in memory
      this.inheritanceRules[category] = {
        ...rules,
        lastUpdated: new Date().toISOString(),
      };

      // Save to configuration file
      await this.saveInheritanceConfiguration();

      // Clear relevant caches
      this.clearInheritanceCache();

      return {
        success: true,
        category,
        message: `Inheritance rules for '${category}' tasks updated successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'RULES_UPDATE_FAILED',
      };
    }
  }

  /**
   * Save inheritance configuration to file
   */
  async saveInheritanceConfiguration() {
    try {
      // Load existing config
      let config = {};
      try {
        const configData = await _fs.readFile(this.configPath, 'utf8');
        config = JSON.parse(configData);
      } catch {
        // File doesn't exist or is invalid, start with empty config
      }

      // Update inheritance sections
      config.inheritance_rules = this.inheritanceRules;
      config.project_wide_criteria = this.projectWideSets;
      config.last_updated = new Date().toISOString();

      // Write back to file
      await _fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

      return { success: true };
    } catch (error) {
      console.warn('Failed to save inheritance configuration:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate project-wide set data
   * @param {Object} setData - Set data to validate
   * @returns {Object} Validation result
   */
  validateProjectWideSet(setData) {
    const errors = [];

    if (!setData.name) {errors.push('Set must have a name');}
    if (!setData.description) {errors.push('Set must have a description');}
    if (!setData.criteria || !Array.isArray(setData.criteria)) {
      errors.push('Set must have a criteria array');
    }
    if (!setData.applies_to || !Array.isArray(setData.applies_to)) {
      errors.push('Set must specify which task types it applies to');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate inheritance rules
   * @param {Object} rules - Rules to validate
   * @returns {Object} Validation result
   */
  validateInheritanceRules(rules) {
    const errors = [];

    if (rules.template && typeof rules.template !== 'string') {
      errors.push('Template must be a string');
    }
    if (rules.mandatory_categories && !Array.isArray(rules.mandatory_categories)) {
      errors.push('Mandatory categories must be an array');
    }
    if (rules.optional_categories && !Array.isArray(rules.optional_categories)) {
      errors.push('Optional categories must be an array');
    }
    if (rules.project_wide_sets && !Array.isArray(rules.project_wide_sets)) {
      errors.push('Project-wide sets must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear inheritance cache
   */
  clearInheritanceCache() {
    this.inheritanceCache.clear();
  }

  /**
   * Get inheritance statistics
   * @returns {Object} Inheritance statistics
   */
  getInheritanceStatistics() {
    return {
      cacheSize: this.inheritanceCache.size,
      ruleCategories: Object.keys(this.inheritanceRules).length,
      projectWideSets: Object.keys(this.projectWideSets).length,
      totalInheritanceRules: Object.values(this.inheritanceRules).reduce(
        (total, rule) => total + (rule.project_wide_sets?.length || 0), 0,
      ),
      memoryUsage: {
        cache: JSON.stringify([...this.inheritanceCache.values()]).length,
        rules: JSON.stringify(this.inheritanceRules).length,
        sets: JSON.stringify(this.projectWideSets).length,
      },
    };
  }
}

module.exports = InheritanceManager;
