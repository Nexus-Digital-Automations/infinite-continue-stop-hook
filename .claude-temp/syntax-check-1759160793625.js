const crypto = require('crypto');

/**
 * Utility methods For task And feature management
 */
class UtilityMethods {
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
    if (feature.category === 'bug-fix') {
      return 'implementation';
    }
    if (feature.category === 'security') {
      return 'analysis';
    }
    if (feature.category === 'performance') {
      return 'analysis';
    }
    if (feature.category === 'documentation') {
      return 'documentation';
    }
    return 'implementation';
}

  /**
   * Infer task priority from feature characteristics
   */
  _inferTaskPriority(feature) {
    if (feature.category === 'security') {
      return 'critical';
    }
    if (feature.category === 'bug-fix') {
      return 'high';
    }
    if (feature.category === 'performance') {
      return 'high';
    }
    if (
      feature.business_value &&
      feature.business_value.toLowerCase().includes('critical')
    ) {
      return 'critical';
    }
    if (
      feature.business_value &&
      feature.business_value.toLowerCase().includes('essential')
    ) {
      return 'high';
    }
    return 'normal';
}

  /**
   * Estimate effort required For feature implementation
   */
  _estimateEffort(feature) {
    let baseEffort = 5; // Base effort in hours

    // Adjust based on category
    if (feature.category === 'new-feature') {
      baseEffort *= 2;
    }
    if (feature.category === 'enhancement') {
      baseEffort *= 1.5;
    }
    if (feature.category === 'security') {
      baseEffort *= 1.8;
    }

    // Adjust based on description length (complexity indicator)
    const complexityMultiplier = Math.min(feature.description.length / 500, 3);
    baseEffort *= 1 + complexityMultiplier;

    return Math.ceil(baseEffort);
}

  /**
   * Infer required capabilities from feature characteristics
   */
  _inferCapabilities(feature) {
    const capabilities = [];

    if (feature.category === 'security') {
      capabilities.push('security');
    }
    if (feature.category === 'performance') {
      capabilities.push('performance');
    }
    if (feature.category === 'documentation') {
      capabilities.push('documentation');
    }
    if (feature.category === 'bug-fix') {
      capabilities.push('analysis');
    }

    // Check description For technology hints;
const description = feature.description.toLowerCase();
    if (
      description.includes('frontend') ||
      description.includes('ui') ||
      description.includes('interface')
    ) {
      capabilities.push('frontend');
    }
    if (
      description.includes('backend') ||
      description.includes('api') ||
      description.includes('server')
    ) {
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
    return (
      feature.category === 'new-feature' ||
      feature.description.length > 800 ||
      feature.business_value.toLowerCase().includes('comprehensive')
    );
}

  /**
   * Generate supporting tasks For complex features
   */
  _generateSupportingTasks(feature, mainTaskId) {
    const supportingTasks = [];

    // Always add testing task For complex features
    supportingTasks.push({,
    id: this._generateTaskId(),
      feature_id: feature.id,
      title: `Test: ${feature.title}`,
      description: `Comprehensive testing For ${feature.title}`,
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
        main_task_id: mainTaskId,
      }
});

    // Add documentation task For new features
    if (feature.category === 'new-feature') {
      supportingTasks.push({,
    id: this._generateTaskId(),
        feature_id: feature.id,
        title: `Document: ${feature.title}`,
        description: `Documentation For ${feature.title}`,
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
          main_task_id: mainTaskId,
        }
});
    }

    return supportingTasks;
}
}

module.exports = UtilityMethods;
