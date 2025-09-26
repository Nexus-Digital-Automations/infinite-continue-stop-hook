/**
 * Test Utilities for FeatureManagerAPI Unit Tests
 *
 * Provides mock objects, fixtures, and helper functions for comprehensive
 * unit testing of the FeatureManagerAPI class.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Mock File System Operations
 * Provides controlled file system behavior for testing
 */
class MockFileSystem {
  constructor() {
    this.files = new Map();
    this.accessErrors = new Map();
    this.writeErrors = new Map();
    this.readErrors = new Map();
  }

  // Mock fs.access
  async access(filePath) {
    if (this.accessErrors.has(filePath)) {
      const error = new Error(this.accessErrors.get(filePath));
      error.code = 'ENOENT';
      throw error;
    }
    if (!this.files.has(filePath)) {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      throw error;
    }
  }

  // Mock fs.readFile
  async readFile(filePath, encoding = 'utf8') {
    if (this.readErrors.has(filePath)) {
      const error = new Error(this.readErrors.get(filePath));
      error.code = this.readErrors.get(filePath) === 'File not found' ? 'ENOENT' : 'EIO';
      throw error;
    }
    if (!this.files.has(filePath)) {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      throw error;
    }
    return this.files.get(filePath);
  }

  // Mock fs.writeFile
  async writeFile(filePath, data) {
    if (this.writeErrors.has(filePath)) {
      throw new Error(this.writeErrors.get(filePath));
    }
    this.files.set(filePath, data);
  }

  // Helper methods for test control
  setFile(filePath, content) {
    this.files.set(filePath, content);
  }

  deleteFile(filePath) {
    this.files.delete(filePath);
  }

  setAccessError(filePath, error) {
    this.accessErrors.set(filePath, error);
  }

  setReadError(filePath, error) {
    this.readErrors.set(filePath, error);
  }

  setWriteError(filePath, error) {
    this.writeErrors.set(filePath, error);
  }

  clearErrors() {
    this.accessErrors.clear();
    this.writeErrors.clear();
    this.readErrors.clear();
  }

  clearAll() {
    this.files.clear();
    this.clearErrors();
  }

  hasFile(filePath) {
    return this.files.has(filePath);
  }

  getFile(filePath) {
    return this.files.get(filePath);
  }
}

/**
 * Test Fixtures for consistent test data
 */
const TEST_FIXTURES = {
  // Valid feature data
  validFeature: {
    title: 'Test Feature Implementation',
    description: 'A comprehensive test feature for unit testing purposes with detailed implementation requirements',
    business_value: 'Provides significant value to users by improving system functionality and user experience',
    category: 'enhancement',
    suggested_by: 'test-agent',
    metadata: {
      priority: 'high',
      estimated_effort: 'medium',
    },
  },

  // Invalid feature data for validation testing
  invalidFeatures: {
    missingTitle: {
      description: 'Feature without title',
      business_value: 'Some business value',
      category: 'enhancement',
    },
    emptyTitle: {
      title: '',
      description: 'Feature with empty title',
      business_value: 'Some business value',
      category: 'enhancement',
    },
    shortTitle: {
      title: 'Short',
      description: 'Feature with title too short',
      business_value: 'Some business value',
      category: 'enhancement',
    },
    longTitle: {
      title: 'A'.repeat(201),
      description: 'Feature with title too long',
      business_value: 'Some business value',
      category: 'enhancement',
    },
    missingDescription: {
      title: 'Feature without description',
      business_value: 'Some business value',
      category: 'enhancement',
    },
    shortDescription: {
      title: 'Valid Feature Title',
      description: 'Too short',
      business_value: 'Some business value',
      category: 'enhancement',
    },
    longDescription: {
      title: 'Valid Feature Title',
      description: 'A'.repeat(2001),
      business_value: 'Some business value',
      category: 'enhancement',
    },
    missingBusinessValue: {
      title: 'Feature without business value',
      description: 'A feature description that meets minimum length requirements for testing',
      category: 'enhancement',
    },
    shortBusinessValue: {
      title: 'Valid Feature Title',
      description: 'A feature description that meets minimum length requirements for testing',
      business_value: 'Too short',
      category: 'enhancement',
    },
    longBusinessValue: {
      title: 'Valid Feature Title',
      description: 'A feature description that meets minimum length requirements for testing',
      business_value: 'A'.repeat(1001),
      category: 'enhancement',
    },
    missingCategory: {
      title: 'Feature without category',
      description: 'A feature description that meets minimum length requirements for testing',
      business_value: 'Some business value',
    },
    invalidCategory: {
      title: 'Feature with invalid category',
      description: 'A feature description that meets minimum length requirements for testing',
      business_value: 'Some business value',
      category: 'invalid-category',
    },
  },

  // Empty TASKS.json structure
  emptyFeaturesFile: {
    project: 'test-project',
    schema_version: '2.0.0',
    migrated_from: 'test-initialization',
    migration_date: '2025-09-23T12:00:00.000Z',
    tasks: [],
    completed_tasks: [],
    task_relationships: {},
    workflow_config: {
      require_approval: true,
      auto_reject_timeout_hours: 168,
      allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
      allowed_task_types: ['error', 'feature', 'test', 'audit'],
      auto_generation_enabled: true,
      mandatory_test_gate: true,
      security_validation_required: true,
      required_fields: ['title', 'description', 'business_value', 'category', 'type'],
    },
    metadata: {
      version: '2.0.0',
      created: '2025-09-23T12:00:00.000Z',
      updated: '2025-09-23T12:00:00.000Z',
      total_tasks: 0,
      tasks_by_type: {
        error: 0,
        feature: 0,
        test: 0,
        audit: 0
      },
      approval_history: [],
    },
    agents: {}
  },

  // Tasks file with sample data
  featuresWithData: {
    project: 'test-project',
    schema_version: '2.0.0',
    migrated_from: 'test-initialization',
    migration_date: '2025-09-23T08:00:00.000Z',
    tasks: [
      {
        id: 'feature_1695123456789_abc123',
        type: 'feature',
        parent_id: null,
        linked_tasks: [],
        title: 'Existing Suggested Feature',
        description: 'A feature that exists in suggested status for testing purposes',
        business_value: 'Provides testing capabilities for the feature management system',
        category: 'enhancement',
        status: 'suggested',
        priority: 'normal',
        auto_generated: false,
        auto_generation_rules: {
          generate_test_task: true,
          generate_audit_task: true,
          test_coverage_requirement: 80
        },
        dependencies: [],
        estimated_effort: 5,
        required_capabilities: ['general'],
        created_at: '2025-09-23T10:00:00.000Z',
        updated_at: '2025-09-23T10:00:00.000Z',
        created_by: 'test-agent',
        assigned_to: null,
        assigned_at: null,
        completed_at: null,
        validation_requirements: {
          security_scan: true,
          test_coverage: true,
          linter_pass: true,
          type_check: true,
          build_success: true
        },
        metadata: {},
      },
      {
        id: 'feature_1695123456790_def456',
        type: 'feature',
        parent_id: null,
        linked_tasks: [],
        title: 'Existing Approved Feature',
        description: 'A feature that exists in approved status for testing purposes',
        business_value: 'Provides testing capabilities for the feature management system',
        category: 'new-feature',
        status: 'approved',
        priority: 'normal',
        auto_generated: false,
        auto_generation_rules: {
          generate_test_task: true,
          generate_audit_task: true,
          test_coverage_requirement: 80
        },
        dependencies: [],
        estimated_effort: 5,
        required_capabilities: ['frontend', 'backend'],
        created_at: '2025-09-23T09:00:00.000Z',
        updated_at: '2025-09-23T11:00:00.000Z',
        created_by: 'test-agent',
        assigned_to: null,
        assigned_at: null,
        completed_at: null,
        validation_requirements: {
          security_scan: true,
          test_coverage: true,
          linter_pass: true,
          type_check: true,
          build_success: true
        },
        metadata: {
          approved_by: 'test-approver',
          approval_date: '2025-09-23T11:00:00.000Z',
          approval_notes: 'Approved for implementation'
        },
      },
      {
        id: 'feature_1695123456791_ghi789',
        type: 'feature',
        parent_id: null,
        linked_tasks: [],
        title: 'Existing Rejected Feature',
        description: 'A feature that exists in rejected status for testing purposes',
        business_value: 'Would have provided testing capabilities but was rejected',
        category: 'documentation',
        status: 'rejected',
        priority: 'low',
        auto_generated: false,
        auto_generation_rules: {
          generate_test_task: false,
          generate_audit_task: false,
          test_coverage_requirement: 80
        },
        dependencies: [],
        estimated_effort: 2,
        required_capabilities: ['documentation'],
        created_at: '2025-09-23T08:00:00.000Z',
        updated_at: '2025-09-23T09:30:00.000Z',
        created_by: 'test-agent',
        assigned_to: null,
        assigned_at: null,
        completed_at: null,
        validation_requirements: {
          security_scan: false,
          test_coverage: false,
          linter_pass: true,
          type_check: true,
          build_success: true
        },
        metadata: {
          rejected_by: 'test-rejector',
          rejection_date: '2025-09-23T09:30:00.000Z',
          rejection_reason: 'Not aligned with project goals'
        },
      },
    ],
    completed_tasks: [],
    task_relationships: {},
    workflow_config: {
      require_approval: true,
      auto_reject_timeout_hours: 168,
      allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
      allowed_task_types: ['error', 'feature', 'test', 'audit'],
      auto_generation_enabled: true,
      mandatory_test_gate: true,
      security_validation_required: true,
      required_fields: ['title', 'description', 'business_value', 'category', 'type'],
    },
    metadata: {
      version: '2.0.0',
      created: '2025-09-23T08:00:00.000Z',
      updated: '2025-09-23T11:00:00.000Z',
      total_tasks: 3,
      tasks_by_type: {
        error: 0,
        feature: 3,
        test: 0,
        audit: 0
      },
      approval_history: [
        {
          task_id: 'feature_1695123456790_def456',
          action: 'approved',
          timestamp: '2025-09-23T11:00:00.000Z',
          approved_by: 'test-approver',
          notes: 'Approved for implementation',
        },
        {
          task_id: 'feature_1695123456791_ghi789',
          action: 'rejected',
          timestamp: '2025-09-23T09:30:00.000Z',
          rejected_by: 'test-rejector',
          reason: 'Not aligned with project goals',
        },
      ],
      initialization_stats: {
        total_initializations: 15,
        total_reinitializations: 8,
        current_day: '2025-09-23',
        time_buckets: {
          '07:00-11:59': { init: 3, reinit: 1 },
          '12:00-16:59': { init: 5, reinit: 2 },
          '17:00-21:59': { init: 4, reinit: 3 },
          '22:00-02:59': { init: 2, reinit: 1 },
          '03:00-06:59': { init: 1, reinit: 1 },
        },
        daily_history: [
          {
            date: '2025-09-22',
            total_init: 8,
            total_reinit: 4,
            buckets: {
              '07:00-11:59': { init: 2, reinit: 1 },
              '12:00-16:59': { init: 3, reinit: 1 },
              '17:00-21:59': { init: 2, reinit: 2 },
              '22:00-02:59': { init: 1, reinit: 0 },
              '03:00-06:59': { init: 0, reinit: 0 },
            },
          },
        ],
        last_reset: '2025-09-23T07:00:00.000Z',
        last_updated: '2025-09-23T12:00:00.000Z',
      },
    },
    agents: {
      'agent-123': {
        lastHeartbeat: '2025-09-23T12:00:00.000Z',
        status: 'active',
        initialized: '2025-09-23T10:00:00.000Z',
        sessionId: 'session123',
      },
      'agent-456': {
        lastHeartbeat: '2025-09-23T11:30:00.000Z',
        status: 'active',
        initialized: '2025-09-23T09:00:00.000Z',
        reinitialized: '2025-09-23T11:30:00.000Z',
        sessionId: 'session456',
        previousSessions: ['session789'],
      },
    },
  },

  // Valid approval data
  validApprovalData: {
    approved_by: 'test-approver',
    notes: 'Feature approved after thorough review and meets all requirements',
  },

  // Valid rejection data
  validRejectionData: {
    rejected_by: 'test-rejector',
    reason: 'Feature does not align with current project priorities and roadmap',
  },

  // Agent IDs for testing
  testAgents: {
    primary: 'test-agent-primary',
    secondary: 'test-agent-secondary',
    invalid: 'invalid-agent-id',
    empty: '',
  },
};

/**
 * Time manipulation utilities for testing time-based features
 */
class TimeTestUtils {
  constructor() {
    this.originalDateNow = Date.now;
    this.originalDate = global.Date;
    this.mockTime = null;
  }

  /**
   * Mock current time to a specific timestamp
   */
  mockCurrentTime(timestamp) {
    this.mockTime = timestamp;
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(timestamp);
        } else {
          super(...args);
        }
      }

      static now() {
        return timestamp;
      }
    };
    Date.now = () => timestamp;
  }

  /**
   * Mock current time to a specific ISO string
   */
  mockCurrentTimeISO(isoString) {
    const timestamp = new Date(isoString).getTime();
    this.mockCurrentTime(timestamp);
  }

  /**
   * Mock time bucket scenarios for initialization stats testing
   */
  mockTimeBucket(bucketName) {
    const timeBuckets = {
      '07:00-11:59': '2025-09-23T10:30:00.000Z',
      '12:00-16:59': '2025-09-23T14:30:00.000Z',
      '17:00-21:59': '2025-09-23T19:30:00.000Z',
      '22:00-02:59': '2025-09-23T23:30:00.000Z',
      '03:00-06:59': '2025-09-23T05:30:00.000Z',
    };

    if (!timeBuckets[bucketName]) {
      throw new Error(`Invalid time bucket: ${bucketName}`);
    }

    this.mockCurrentTimeISO(timeBuckets[bucketName]);
  }

  /**
   * Restore original time behavior
   */
  restoreTime() {
    global.Date = this.originalDate;
    Date.now = this.originalDateNow;
    this.mockTime = null;
  }
}

/**
 * Test helper functions
 */
const testHelpers = {
  /**
   * Generate a valid feature ID for testing
   */
  generateTestFeatureId() {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString('hex');
    return `feature_${timestamp}_${randomString}`;
  },

  /**
   * Generate a test session ID
   */
  generateTestSessionId() {
    return crypto.randomBytes(8).toString('hex');
  },

  /**
   * Create a deep copy of an object for mutation testing
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Wait for a specified time (for testing async operations)
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Assert that an error is thrown with specific message
   */
  async expectError(asyncFn, expectedMessage) {
    let error = null;
    try {
      await asyncFn();
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
    expect(error.message).toContain(expectedMessage);
    return error;
  },

  /**
   * Validate feature object structure
   */
  validateFeatureStructure(feature) {
    expect(feature).toHaveProperty('id');
    expect(feature).toHaveProperty('title');
    expect(feature).toHaveProperty('description');
    expect(feature).toHaveProperty('business_value');
    expect(feature).toHaveProperty('category');
    expect(feature).toHaveProperty('status');
    expect(feature).toHaveProperty('created_at');
    expect(feature).toHaveProperty('updated_at');
    expect(feature).toHaveProperty('suggested_by');
    expect(feature).toHaveProperty('metadata');

    // Validate timestamps are valid ISO strings
    expect(new Date(feature.created_at).toISOString()).toBe(feature.created_at);
    expect(new Date(feature.updated_at).toISOString()).toBe(feature.updated_at);

    // Validate status is one of allowed values
    expect(['suggested', 'approved', 'rejected', 'implemented']).toContain(feature.status);
  },

  /**
   * Validate FEATURES.json file structure
   */
  validateFeaturesFileStructure(featuresData) {
    expect(featuresData).toHaveProperty('project');
    expect(featuresData).toHaveProperty('features');
    expect(featuresData).toHaveProperty('metadata');
    expect(featuresData).toHaveProperty('workflow_config');

    expect(Array.isArray(featuresData.features)).toBe(true);
    expect(featuresData.metadata).toHaveProperty('version');
    expect(featuresData.metadata).toHaveProperty('created');
    expect(featuresData.metadata).toHaveProperty('updated');
    expect(featuresData.metadata).toHaveProperty('total_features');
    expect(featuresData.metadata).toHaveProperty('approval_history');
  },

  /**
   * Create mock console methods for testing output
   */
  createMockConsole() {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    const mockConsole = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };

    // Replace console methods
    console.log = mockConsole.log;
    console.error = mockConsole.error;
    console.warn = mockConsole.warn;
    console.info = mockConsole.info;

    return {
      mockConsole,
      restore: () => {
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
      },
    };
  },
};

module.exports = {
  MockFileSystem,
  TEST_FIXTURES,
  TimeTestUtils,
  testHelpers,
};
