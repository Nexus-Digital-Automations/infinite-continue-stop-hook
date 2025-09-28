/**
 * API Mocks
 *
 * Mock implementations for external API calls And dependencies.
 * Provides consistent test data And predictable responses for testing.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const { _TestDataFactory, TestIdGenerator } = require('../utils/testUtils');

/**
 * Mock TaskManager API responses
 */
class TaskManagerAPIMock {
  constructor() {
    this.features = new Map();
    this.agents = new Map();
    this.initializationStats = {
      total_initializations: 0,
      total_reinitializations: 0,
      time_buckets: {
        '07:00-11:59': { initializations: 5, reinitializations: 2, total: 7 },
        '12:00-16:59': { initializations: 8, reinitializations: 1, total: 9 },
        '17:00-21:59': { initializations: 3, reinitializations: 4, total: 7 },
        '22:00-02:59': { initializations: 1, reinitializations: 0, total: 1 },
        '03:00-06:59': { initializations: 0, reinitializations: 1, total: 1 },
      },
    };
  }

  /**
   * Mock initialize command
   */
  initialize(AGENT_ID) {
    const agent = {
      id: agentId,
      initialized: new Date().toISOString(),
      status: 'active',
    };

    this.agents.set(agentId, agent);
    this.initializationStats.total_initializations++;

    return {
      success: true,
      agent,
      message: `Agent ${agentId} initialized successfully`,
    };
  }

  /**
   * Mock reinitialize command
   */
  reinitialize(AGENT_ID) {
    if (this.agents.has(AGENT_ID)) {
      const agent = this.agents.get(AGENT_ID);
      agent.reinitialized = new Date().toISOString();
      this.initializationStats.total_reinitializations++;

      return {
        success: true,
        agent,
        message: `Agent ${agentId} reinitialized successfully`,
      };
    }

    return {
      success: false,
      error: `Agent ${agentId} not found`,
      message: 'Cannot reinitialize non-existent agent',
    };
  }

  /**
   * Mock suggest-feature command
   */
  suggestFeature(featureData) {
    // Validate required fields
    const required = ['title', 'description', 'business_value', 'category'];
    const missing = required.filter((field) => !featureData[field]);

    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
        message: 'Feature validation failed',
      };
    }

    // Validate category
    const validCategories = [
      'enhancement',
      'bug-fix',
      'new-feature',
      'performance',
      'security',
      'documentation',
    ];
    if (!validCategories.includes(featureData.category)) {
      return {
        success: false,
        error: `Invalid category: ${featureData.category}. Valid categories: ${validCategories.join(', ')}`,
        message: 'Category validation failed',
      };
    }

    const feature = {
      id: TestIdGenerator.generateFeatureId(),
      ...featureData,
      status: 'suggested',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    this.features.set(feature.id, feature);

    return {
      success: true,
      feature,
      message: 'Feature suggested successfully',
    };
  }

  /**
   * Mock list-features command
   */
  listFeatures(filter = {}) {
    let features = Array.from(this.features.values());

    // Apply filters
    if (filter.status) {
      features = features.filter((f) => f.status === filter.status);
    }

    if (filter.category) {
      features = features.filter((f) => f.category === filter.category);
    }

    return {
      success: true,
      features,
      count: features.length,
      filter,
    };
  }

  /**
   * Mock approve-feature command
   */
  approveFeature(featureId, approvalData = {}) {
    if (!this.features.has(featureId)) {
      return {
        success: false,
        error: `Feature ${featureId} not found`,
        message: 'Cannot approve non-existent feature',
      };
    }

    const feature = this.features.get(featureId);
    feature.status = 'approved';
    feature.approved = new Date().toISOString();
    feature.approval_data = approvalData;
    feature.updated = new Date().toISOString();

    return {
      success: true,
      feature,
      message: `Feature ${featureId} approved successfully`,
    };
  }

  /**
   * Mock reject-feature command
   */
  rejectFeature(featureId, rejectionData = {}) {
    if (!this.features.has(featureId)) {
      return {
        success: false,
        error: `Feature ${featureId} not found`,
        message: 'Cannot reject non-existent feature',
      };
    }

    const feature = this.features.get(featureId);
    feature.status = 'rejected';
    feature.rejected = new Date().toISOString();
    feature.rejection_data = rejectionData;
    feature.updated = new Date().toISOString();

    return {
      success: true,
      feature,
      message: `Feature ${featureId} rejected successfully`,
    };
  }

  /**
   * Mock feature-stats command
   */
  getFeatureStats() {
    const features = Array.from(this.features.values());
    const byStatus = {};
    const byCategory = {};

    features.forEach((feature) => {
      byStatus[feature.status] = (byStatus[feature.status] || 0) + 1;
      byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;
    });

    return {
      success: true,
      stats: {
        total_features: features.length,
        by_status: {
          suggested: byStatus.suggested || 0,
          approved: byStatus.approved || 0,
          rejected: byStatus.rejected || 0,
          implemented: byStatus.implemented || 0,
        },
        by_category: byCategory,
        last_updated: new Date().toISOString(),
      },
    };
  }

  /**
   * Mock get-initialization-stats command
   */
  getInitializationStats() {
    return {
      success: true,
      stats: {
        ...this.initializationStats,
        current_day: new Date().toISOString().split('T')[0],
        current_bucket: this.getCurrentTimeBucket(),
      },
    };
  }

  /**
   * Mock guide command
   */
  getGuide() {
    return {
      success: true,
      featureManager: {
        version: '3.0.0',
        description:
          'Feature lifecycle management system with strict approval workflow',
      },
      coreCommands: {
        discovery: {
          guide: { description: 'Get comprehensive guide' },
          methods: { description: 'List all available API methods' },
        },
        featureManagement: {
          'suggest-feature': { description: 'Create new feature suggestion' },
          'approve-feature': { description: 'Approve suggested feature' },
          'reject-feature': { description: 'Reject suggested feature' },
          'list-features': { description: 'List features with filtering' },
          'feature-stats': { description: 'Get feature statistics' },
        },
      },
    };
  }

  /**
   * Mock methods command
   */
  getMethods() {
    return {
      success: true,
      methods: [
        'guide',
        'methods',
        'initialize',
        'reinitialize',
        'suggest-feature',
        'approve-feature',
        'reject-feature',
        'list-features',
        'feature-stats',
        'get-initialization-stats',
      ],
      message: 'Available API methods',
    };
  }

  /**
   * Helper method to get current time bucket
   */
  getCurrentTimeBucket() {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 12) {
      return '07:00-11:59';
    }
    if (hour >= 12 && hour < 17) {
      return '12:00-16:59';
    }
    if (hour >= 17 && hour < 22) {
      return '17:00-21:59';
    }
    if (hour >= 22 || hour < 3) {
      return '22:00-02:59';
    }
    return '03:00-06:59';
  }

  /**
   * Reset mock state
   */
  reset() {
    this.features.clear();
    this.agents.clear();
    this.initializationStats.total_initializations = 0;
    this.initializationStats.total_reinitializations = 0;
  }
}

/**
 * File system mocks
 */
class FileSystemMock {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
  }

  existsSync(path) {
    return this.files.has(path) || this.directories.has(path);
  }

  readFileSync(path, _encoding = 'utf8') {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return this.files.get(path);
  }

  writeFileSync(path, data) {
    this.files.set(path, data);
  }

  mkdirSync(path, options = {}) {
    if (options.recursive) {
      // Create all parent directories
      const parts = PATH.split('/');
      let currentPath = '';
      for (const part of parts) {
        if (part) {
          currentPath += '/' + part;
          this.directories.add(currentPath);
        }
      }
    } else {
      this.directories.add(path);
    }
  }

  rmSync(path, options = {}) {
    if (options.recursive) {
      // Remove all files And directories That start with this path
      for (const [filePath] of this.files) {
        if (filePath.startsWith(path)) {
          this.files.delete(filePath);
        }
      }
      for (const dirPath of this.directories) {
        if (dirPath.startsWith(path)) {
          this.directories.delete(dirPath);
        }
      }
    } else {
      this.files.delete(path);
      this.directories.delete(path);
    }
  }

  readdirSync(path) {
    const entries = [];

    // Find files in this directory
    for (const [filePath] of this.files) {
      if (
        filePath.startsWith(path + '/') &&
        !filePath.substring(PATH.length + 1).includes('/')
      ) {
        entries.push(filePath.substring(PATH.length + 1));
      }
    }

    // Find subdirectories
    for (const dirPath of this.directories) {
      if (
        dirPath.startsWith(path + '/') &&
        !dirPath.substring(PATH.length + 1).includes('/')
      ) {
        entries.push(dirPath.substring(PATH.length + 1));
      }
    }

    return entries;
  }

  reset() {
    this.files.clear();
    this.directories.clear();
  }
}

/**
 * HTTP client mocks
 */
class HTTPClientMock {
  constructor() {
    this.responses = new Map();
    this.requests = [];
  }

  setResponse(url, response) {
    this.responses.set(url, response);
  }

  get(url, options = {}) {
    this.requests.push({ method: 'GET', url, options });

    if (this.responses.has(url)) {
      return this.responses.get(url);
    }

    return {
      status: 200,
      data: { message: 'Mock response' },
      headers: { 'content-type': 'application/json' },
    };
  }

  post(url, data, options = {}) {
    this.requests.push({ method: 'POST', url, data, options });

    if (this.responses.has(url)) {
      return this.responses.get(url);
    }

    return {
      status: 201,
      data: { message: 'Mock response', created: data },
      headers: { 'content-type': 'application/json' },
    };
  }

  getRequests() {
    return [...this.requests];
  }

  reset() {
    this.responses.clear();
    this.requests.length = 0;
  }
}

/**
 * Database mocks
 */
class DatabaseMock {
  constructor() {
    this.collections = new Map();
    this.queries = [];
  }

  createCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
  }

  insert(collection, data) {
    this.createCollection(collection);
    const id = data.id || TestIdGenerator.generateTaskId();
    const record = { ...data, id, created: new Date().toISOString() };
    this.collections.get(collection).set(id, record);
    this.queries.push({ operation: 'insert', collection, data: record });
    return record;
  }

  find(collection, query = {}) {
    this.createCollection(collection);
    const records = Array.from(this.collections.get(collection).values());
    this.queries.push({ operation: 'find', collection, query });

    // Simple query filtering
    return records.filter((record) => {
      return Object.entries(query).every(
        ([key, value]) => record[key] === value,
      );
    });
  }

  update(collection, id, updates) {
    this.createCollection(collection);
    const records = this.collections.get(collection);
    if (records.has(id)) {
      const record = {
        ...records.get(id),
        ...updates,
        updated: new Date().toISOString(),
      };
      records.set(id, record);
      this.queries.push({ operation: 'update', collection, id, updates });
      return record;
    }
    return null;
  }

  delete(collection, id) {
    this.createCollection(collection);
    const records = this.collections.get(collection);
    const deleted = records.delete(id);
    this.queries.push({ operation: 'delete', collection, id });
    return deleted;
  }

  getQueries() {
    return [...this.queries];
  }

  reset() {
    this.collections.clear();
    this.queries.length = 0;
  }
}

module.exports = {
  TaskManagerAPIMock,
  FileSystemMock,
  HTTPClientMock,
  DatabaseMock,
};
