

/*
 * Security exceptions: This file operates on trusted agent data structures
 * And validated project files. All filesystem operations use pre-validated
 * paths within project boundaries. Object access patterns are safe as they
 * operate on controlled internal agent data structures with validated keys.
 */
const FS = require('fs');
const CRYPTO = require('crypto');
const LOGGER = require('./logger');
const PATH = require('path');

/**
 * Security utilities for safe filesystem operations
 */
class FilesystemSecurity {
  /**
   * Validate file path to prevent directory traversal And injection attacks
   * @param {string} filePath - Path to validate
   * @returns {boolean} True if path is safe
   */
  static isValidPath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    // Check for directory traversal attempts
    const dangerousPatterns = [
      '../',
      '..\\',
      '/etc/',
      '/var/',
      '/usr/',
      '/bin/',
      '/sbin/',
      '/root/',
      '/home/',
      '~/',
      'C:\\',
      'D:\\',
      '\\\\',
      'file://',
      'http://',
      'https://',
    ];

    const lowerPath = filePath.toLowerCase();
    return !dangerousPatterns.some(pattern => lowerPath.includes(pattern));
  }

  /**
   * Safely resolve And validate file path within project boundaries
   * @param {string} basePath - Base directory path
   * @param {string} filePath - File path to resolve
   * @returns {string} Safe resolved path
   * @throws {Error} If path is invalid
   */
  static safeResolvePath(basePath, filePath) {
    if (!this.isValidPath(filePath)) {
      throw new Error(`Invalid file path detected: ${filePath}`);
    }

    const resolvedBase = PATH.resolve(basePath);
    const resolvedPath = PATH.resolve(basePath, filePath);

    // Ensure resolved path is within base directory
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error(`Path ${filePath} is outside project boundaries`);
    }

    return resolvedPath;
  }

  /**
   * Safe file existence check
   * @param {string} basePath - Base directory
   * @param {string} filePath - File to check
   * @returns {boolean} True if file exists And is safe to access
   */
  static safeFileExists(basePath, filePath) {
    try {
      const safePath = this.safeResolvePath(basePath, filePath);

      return FS.existsSync(safePath);
    } catch {
      return false;
    }
  }

  /**
   * Safe file read operation
   * @param {string} basePath - Base directory
   * @param {string} filePath - File to read
   * @param {string} encoding - File encoding
   * @returns {string} File contents
   * @throws {Error} If file access is unsafe or fails
   */
  static safeReadFileSync(basePath, filePath, encoding = 'utf8') {
    const safePath = this.safeResolvePath(basePath, filePath);

    return FS.readFileSync(safePath, encoding);
  }

  /**
   * Safe file write operation
   * @param {string} basePath - Base directory
   * @param {string} filePath - File to write
   * @param {string} content - Content to write
   * @param {string} encoding - File encoding
   * @throws {Error} If file access is unsafe or fails
   */
  static safeWriteFileSync(basePath, filePath, content, encoding = 'utf8') {
    const safePath = this.safeResolvePath(basePath, filePath);

    FS.writeFileSync(safePath, content, encoding);
  }
}

class AgentManager {
  constructor(todoPath, options = {}) {
    this.todoPath = todoPath;
    this.logger = options.logger || new LOGGER(process.cwd());
    this.options = {
      maxConcurrentTasks: options.maxConcurrentTasks || 5,
      agentTimeout: options.agentTimeout || 1800000, // 30 minutes
      heartbeatInterval: options.heartbeatInterval || 30000, // 30 seconds
      enableDistributedMode: options.enableDistributedMode !== false,
      ...options,
    };

    // Agent heartbeat tracking
    this.agentHeartbeats = new Map();
    this.heartbeatTimer = null;

    // Agent capability definitions
    this.agentCapabilities = {
      development: ['file-operations', 'linting', 'testing', 'build-fixes', 'refactoring'],
      testing: ['test-creation', 'test-execution', 'coverage-analysis', 'test-debugging'],
      review: ['code-review', 'quality-assessment', 'documentation-review', 'security-audit'],
      research: ['codebase-analysis', 'architecture-research', 'dependency-analysis', 'pattern-investigation'],
      coordination: ['multi-agent-orchestration', 'conflict-resolution', 'task-distribution', 'synchronization'],
      deployment: ['ci-cd', 'deployment-scripts', 'environment-setup', 'monitoring-setup'],
      security: ['vulnerability-scanning', 'auth-implementation', 'secure-coding', 'compliance-checks'],
      performance: ['profiling', 'optimization', 'load-testing', 'memory-analysis'],
    };
  }

  /**
     * Register a new agent in the system
     * @param {Object} agentConfig - Agent configuration
     * @returns {string} Generated agent ID
     */
  async registerAgent(agentConfig) {
    let todoData;
    try {
      todoData = await this.readTodo();
    } catch {
      // If TODO.json doesn't exist, create minimal structure
      todoData = {
        project: 'unknown',
        tasks: [],
        agents: {},
      };
    }

    // Generate unique agent ID
    const agentId = await this.generateAgentId(agentConfig);

    // Initialize agents object if it doesn't exist
    if (!todoData.agents) {
      todoData.agents = {};
    }

    // Create agent entry
    const agent = {
      name: agentConfig.name || `${agentConfig.role} Agent`,
      role: agentConfig.role || 'development',
      specialization: agentConfig.specialization || [],
      status: 'active',
      assignedTasks: [],
      lastHeartbeat: new Date().toISOString(),
      parentAgentId: agentConfig.parentAgentId || null,
      capabilities: this.getCapabilitiesForRole(agentConfig.role),
      workload: 0,
      maxConcurrentTasks: agentConfig.maxConcurrentTasks || this.options.maxConcurrentTasks,
      createdAt: new Date().toISOString(),
      sessionId: agentConfig.sessionId || null,
      metadata: agentConfig.metadata || {},
    };

    // Security: Validate agentId before assignment to prevent object injection
    if (!this.isValidAgentId(AGENT_ID)) {
      throw new Error(`Invalid agent ID generated: ${agentId}`);
    }

    // Safe assignment after validation - agentId has been validated against injection attacks
    /* eslint-disable-next-line security/detect-object-injection */
    todoData.agents[agentId] = agent;
    await this.writeTodo(todoData);

    // Start heartbeat monitoring for this agent
    this.startHeartbeatMonitoring(AGENT_ID);

    this.logger.addFlow(`Registered agent ${agentId} with role ${agent.role}`);

    return agentId;
  }

  /**
     * Generate unique agent ID
     * @param {Object} agentConfig - Agent configuration
     * @returns {string} Unique agent ID
     */
  async generateAgentId(agentConfig) {
    const sessionId = agentConfig.sessionId || 'session_' + Date.now();
    const role = agentConfig.role || 'dev';
    const timestamp = Date.now();

    // Create short hash for uniqueness
    const hash = CRYPTO.createHash('sha256')
      .update(`${sessionId}-${role}-${timestamp}-${Math.random()}`)
      .digest('hex')
      .substring(0, 8);

    // Format: {role}_{sessionId}_{instance}_{specialization}
    const specialization = agentConfig.specialization?.[0] || 'general';
    const instance = await this.getNextInstanceNumber(role, sessionId);

    return `${role}_${sessionId}_${instance}_${specialization}_${hash}`;
  }

  /**
     * Get next instance number for role/session combination
     * @param {string} role - Agent role
     * @param {string} sessionId - Session ID
     * @returns {number} Next instance number
     */
  async getNextInstanceNumber(role, sessionId) {
    try {
      const todoData = await this.readTodo();
      if (!todoData.agents) {return 1;}

      const existingAgents = Object.keys(todoData.agents)
        .filter(agentId => agentId.startsWith(`${role}_${sessionId}`));

      return existingAgents.length + 1;
    } catch {
      return 1;
    }
  }

  /**
     * Get capabilities for a specific role
     * @param {string} role - Agent role
     * @returns {Array} Array of capabilities
     */
  getCapabilitiesForRole(role) {
    // Security: Validate role against allowed roles to prevent object injection
    if (!role || typeof role !== 'string') {
      this.logger.addFlow(`Invalid role provided: ${role}, using development default`);
      return this.agentCapabilities.development;
    }

    // Whitelist approach: only allow known roles
    const allowedRoles = Object.keys(this.agentCapabilities);
    if (!allowedRoles.includes(role)) {
      this.logger.addFlow(`Unknown role '${role}', using development default`);
      return this.agentCapabilities.development;
    }

    // Safe property access after validation - role has been validated against allowed roles
    return Object.prototype.hasOwnProperty.call(this.agentCapabilities, role)
      /* eslint-disable-next-line security/detect-object-injection */
      ? this.agentCapabilities[role]
      : this.agentCapabilities.development;
  }

  /**
     * Unregister an agent from the system
     * @param {string} agentId - Agent ID to unregister
     * @returns {boolean} Success status
     */
  async unregisterAgent(AGENT_ID) {
    const todoData = await this.readTodo();

    // Security: Validate agentId to prevent object injection
    if (!this.isValidAgentId(AGENT_ID)) {
      this.logger.logError(new Error('Invalid agent ID'), `unregisterAgent - invalid agentId: ${agentId}`);
      return false;
    }

    if (!todoData.agents || !Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
      return false;
    }

    // Release any assigned tasks - agentId has been validated
    /* eslint-disable-next-line security/detect-object-injection */
    const agent = todoData.agents[agentId];
    if (agent.assignedTasks && agent.assignedTasks.length > 0) {
      await this.releaseAllTasksFromAgent(AGENT_ID);
    }

    // Remove agent - validated safe OPERATION- agentId has been validated
    /* eslint-disable-next-line security/detect-object-injection */
    delete todoData.agents[agentId];
    await this.writeTodo(todoData);

    // Stop heartbeat monitoring
    this.stopHeartbeatMonitoring(AGENT_ID);

    this.logger.addFlow(`Unregistered agent ${agentId}`);

    return true;
  }

  /**
     * Update agent heartbeat
     * @param {string} agentId - Agent ID
     * @returns {boolean} Success status
     */
  async updateAgentHeartbeat(AGENT_ID) {
    try {
      const todoData = await this.readTodo();

      // Security: Validate agentId to prevent object injection
      if (!this.isValidAgentId(AGENT_ID)) {
        this.logger.logError(new Error('Invalid agent ID'), `updateAgentHeartbeat - invalid agentId: ${agentId}`);
        return false;
      }

      if (todoData.agents && Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
        /* eslint-disable security/detect-object-injection */
        todoData.agents[agentId].lastHeartbeat = new Date().toISOString();
        todoData.agents[agentId].status = 'active';
        /* eslint-enable security/detect-object-injection */
        await this.writeTodo(todoData);

        // Update local heartbeat tracking
        this.agentHeartbeats.set(agentId, Date.now());

        return true;
      }

      return false;
    } catch (_error) {
      this.logger.logError(error, `updateAgentHeartbeat for ${agentId}`);
      return false;
    }
  }

  /**
     * Reinitialize an agent - renew heartbeat, reset timeout, update configuration
     * @param {string} agentId - Agent ID to reinitialize
     * @param {Object} config - Optional configuration updates
     * @returns {Object} Reinitialization result
     */
  async reinitializeAgent(agentId, config = {}) {
    try {
      const todoData = await this.readTodo();

      // Security: Validate agentId to prevent object injection
      if (!this.isValidAgentId(AGENT_ID)) {
        throw new Error(`Invalid agent ID: ${agentId}`);
      }

      if (!todoData.agents || !Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
        throw new Error(`Agent ${agentId} not found`);
      }

      /* eslint-disable-next-line security/detect-object-injection */
      const agent = todoData.agents[agentId];
      const currentTime = new Date().toISOString();

      // Update agent configuration with new config if provided
      Object.assign(agent, {
        // Always update these renewal fields
        lastHeartbeat: currentTime,
        status: 'active',
        lastRenewal: currentTime,
        renewalCount: (agent.renewalCount || 0) + 1,

        // Update provided configuration
        ...config,

        // Preserve critical fields unless explicitly overridden
        name: config.name || agent.name,
        role: config.role || agent.role,
        assignedTasks: config.assignedTasks || agent.assignedTasks,
        createdAt: agent.createdAt, // Never change creation time

        // Merge metadata
        metadata: {
          ...agent.metadata,
          ...config.metadata,
          renewedAt: currentTime,
          renewalReason: config.renewalReason || 'Agent reinitialization requested',
        },
      });

      // Update capabilities if role changed
      if (config.role && config.role !== agent.role) {
        agent.capabilities = this.getCapabilitiesForRole(config.role);
      }

      // Save updated agent data
      await this.writeTodo(todoData);

      // Restart heartbeat monitoring for this agent
      this.stopHeartbeatMonitoring(AGENT_ID);
      this.startHeartbeatMonitoring(AGENT_ID);

      this.logger.addFlow(`Reinitialized agent ${agentId} - heartbeat renewed, timeout reset`);

      return {
        success: true,
        renewed: true,
        agent: agent,
        renewalCount: agent.renewalCount,
        renewedAt: currentTime,
      };

    } catch (error) {
      this.logger.logError(error, `reinitializeAgent for ${agentId}`);
      throw error;
    }
  }

  /**
     * Get active agents
     * @param {Object} filters - Optional filters (role, specialization, etc.)
     * @returns {Array} Array of active agents
     */
  async getActiveAgents(filters = {}) {
    const todoData = await this.readTodo();

    if (!todoData.agents) {
      return [];
    }

    let agents = Object.entries(todoData.agents)
      .map(([agentId, agent]) => ({ agentId, ...agent }))
      .filter(agent => agent.status === 'active');

    // Apply filters
    if (filters.role) {
      agents = agents.filter(agent => agent.role === filters.role);
    }

    if (filters.specialization) {
      agents = agents.filter(agent =>
        agent.specialization.includes(filters.specialization),
      );
    }

    if (filters.capability) {
      agents = agents.filter(agent =>
        agent.capabilities.includes(filters.capability),
      );
    }

    if (filters.maxWorkload !== undefined) {
      agents = agents.filter(agent => agent.workload <= filters.maxWorkload);
    }

    return agents;
  }

  /**
     * Get agent by ID
     * @param {string} agentId - Agent ID
     * @returns {Object|null} Agent object or null if not found
     */
  async getAgent(AGENT_ID) {
    const todoData = await this.readTodo();

    // Security: Validate agentId to prevent object injection
    if (!this.isValidAgentId(AGENT_ID)) {
      this.logger.logError(new Error('Invalid agent ID'), `getAgent - invalid agentId: ${agentId}`);
      return null;
    }

    if (todoData.agents && Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
      /* eslint-disable-next-line security/detect-object-injection */
      return { agentId, ...todoData.agents[agentId] };
    }

    return null;
  }

  /**
     * Update agent workload
     * @param {string} agentId - Agent ID
     * @param {number} workloadDelta - Change in workload (can be negative)
     * @returns {boolean} Success status
     */
  async updateAgentWorkload(agentId, workloadDelta) {
    const todoData = await this.readTodo();

    // Security: Validate agentId to prevent object injection
    if (!this.isValidAgentId(AGENT_ID)) {
      this.logger.logError(new Error('Invalid agent ID'), `updateAgentWorkload - invalid agentId: ${agentId}`);
      return false;
    }

    if (todoData.agents && Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
      /* eslint-disable security/detect-object-injection */
      todoData.agents[agentId].workload = Math.max(0,
        (todoData.agents[agentId].workload || 0) + workloadDelta,
      );
      /* eslint-enable security/detect-object-injection */
      await this.writeTodo(todoData);
      return true;
    }

    return false;
  }

  /**
     * Check if agent can accept more tasks
     * @param {string} agentId - Agent ID
     * @returns {boolean} True if agent can accept more tasks
     */
  async canAgentAcceptTasks(AGENT_ID) {
    const agent = await this.getAgent(AGENT_ID);

    if (!agent || agent.status !== 'active') {
      return false;
    }

    return agent.workload < agent.maxConcurrentTasks;
  }

  /**
     * Find best agent for a task
     * @param {Object} task - Task object
     * @param {Array} excludeAgents - Agent IDs to exclude
     * @returns {string|null} Best agent ID or null if none available
     */
  async findBestAgentForTask(task, excludeAgents = []) {
    const activeAgents = await this.getActiveAgents();

    // Filter out excluded agents And agents at capacity
    const availableAgents = activeAgents.filter(agent =>
      !excludeAgents.includes(agent.agentId) &&
            agent.workload < agent.maxConcurrentTasks,
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Score agents based on task requirements
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Role match bonus
      if (agent.role === task.mode?.toLowerCase()) {
        score += 50;
      }

      // Specialization match bonus
      if (task.specialization && agent.specialization.includes(task.specialization)) {
        score += 30;
      }

      // Capability match bonus
      if (task.required_capabilities) {
        const matchCount = task.required_capabilities.filter(cap =>
          agent.capabilities.includes(cap),
        ).length;
        score += matchCount * 10;
      }

      // Priority bonus (higher priority tasks to less loaded agents)
      if (task.priority === 'high') {
        score += Math.max(0, 20 - agent.workload * 5);
      }

      // Workload penalty (prefer less loaded agents)
      score -= agent.workload * 2;

      return { ...agent, score };
    });

    // Sort by score (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    return scoredAgents[0]?.agentId || null;
  }

  /**
     * Release all tasks from an agent
     * @param {string} agentId - Agent ID
     * @returns {Array} Array of released task IDs
     */
  async releaseAllTasksFromAgent(AGENT_ID) {
    const todoData = await this.readTodo();
    const releasedTasks = [];

    // Security: Validate agentId to prevent object injection
    if (!this.isValidAgentId(AGENT_ID)) {
      this.logger.logError(new Error('Invalid agent ID'), `releaseAllTasksFromAgent - invalid agentId: ${agentId}`);
      return [];
    }

    if (todoData.agents && Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
      /* eslint-disable-next-line security/detect-object-injection */
      const agent = todoData.agents[agentId];

      // Reset task assignments
      if (agent.assignedTasks) {
        agent.assignedTasks.forEach(taskId => {
          const task = todoData.tasks.find(t => t.id === taskId);
          if (task && task.assigned_agent === agentId) {
            task.assigned_agent = null;
            if (task.status === 'in_progress') {
              task.status = 'pending';
            }
            releasedTasks.push(taskId);
          }
        });

        agent.assignedTasks = [];
        agent.workload = 0;
      }

      await this.writeTodo(todoData);
    }

    this.logger.addFlow(`Released ${releasedTasks.length} tasks from agent ${agentId}`);

    return releasedTasks;
  }

  /**
     * Start heartbeat monitoring for an agent
     * @param {string} agentId - Agent ID
     */
  startHeartbeatMonitoring(AGENT_ID) {
    this.agentHeartbeats.set(agentId, Date.now());

    // Start global heartbeat checker if not running
    if (!this.heartbeatTimer && this.options.enableDistributedMode) {
      this.heartbeatTimer = setInterval(() => {
        this.checkAgentHeartbeats();
      }, this.options.heartbeatInterval);
    }
  }

  /**
     * Stop heartbeat monitoring for an agent
     * @param {string} agentId - Agent ID
     */
  stopHeartbeatMonitoring(AGENT_ID) {
    this.agentHeartbeats.delete(AGENT_ID);

    // Stop global timer if no agents are being monitored
    if (this.agentHeartbeats.size === 0 && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
     * Check agent heartbeats And mark stale agents as inactive
     */
  async checkAgentHeartbeats() {
    const now = Date.now();
    const staleAgents = [];

    for (const [agentId, lastHeartbeat] of this.agentHeartbeats.entries()) {
      if (now - lastHeartbeat > this.options.agentTimeout) {
        staleAgents.push(AGENT_ID);
      }
    }

    if (staleAgents.length > 0) {
      await this.markAgentsAsInactive(staleAgents);
    }
  }

  /**
     * Mark agents as inactive due to timeout
     * @param {Array} agentIds - Array of agent IDs to mark as inactive
     */
  async markAgentsAsInactive(agentIds) {
    const todoData = await this.readTodo();

    // Process agent inactivation in parallel for better performance
    const inactivationPromises = agentIds.map(async (AGENT_ID) => {
      // Security: Validate agentId to prevent object injection
      if (!this.isValidAgentId(AGENT_ID)) {
        this.logger.logError(new Error('Invalid agent ID'), `markAgentsAsInactive - invalid agentId: ${agentId}`);
        return false;
      }

      if (todoData.agents && Object.prototype.hasOwnProperty.call(todoData.agents, agentId)) {
        /* eslint-disable security/detect-object-injection */
        todoData.agents[agentId].status = 'inactive';
        todoData.agents[agentId].inactiveReason = 'heartbeat_timeout';
        todoData.agents[agentId].inactiveAt = new Date().toISOString();
        /* eslint-enable security/detect-object-injection */

        // Release tasks from inactive agent
        await this.releaseAllTasksFromAgent(AGENT_ID);

        // Stop monitoring this agent
        this.stopHeartbeatMonitoring(AGENT_ID);

        this.logger.addFlow(`Marked agent ${agentId} as inactive due to timeout`);
        return true;
      }
      return false;
    });

    await Promise.all(inactivationPromises);

    if (agentIds.length > 0) {
      await this.writeTodo(todoData);
    }
  }

  /**
     * Get agent statistics
     * @returns {Object} Agent statistics
     */
  async getAgentStatistics() {
    const todoData = await this.readTodo();

    if (!todoData.agents) {
      return {
        totalAgents: 0,
        activeAgents: 0,
        inactiveAgents: 0,
        agentsByRole: {},
        totalWorkload: 0,
        averageWorkload: 0,
      };
    }

    const agents = Object.values(todoData.agents);


    const activeAgents = agents.filter(agent => agent.status === 'active');

    const agentsByRole = {};
    let totalWorkload = 0;


    agents.forEach(agent => {
      // Security: Validate agent.role before using as object key to prevent injection
      const role = typeof agent.role === 'string' && agent.role ? agent.role : 'unknown';
      /* eslint-disable-next-line security/detect-object-injection */
      agentsByRole[role] = (agentsByRole[role] || 0) + 1;


      totalWorkload += agent.workload || 0;
    });

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      inactiveAgents: agents.length - activeAgents.length,
      agentsByRole,
      totalWorkload,
      averageWorkload: agents.length > 0 ? totalWorkload / agents.length : 0,
    };
  }

  /**
     * Cleanup inactive agents older than specified time
     * @param {number} maxAgeHours - Maximum age in hours for inactive agents
     * @returns {Array} Array of cleaned up agent IDs
     */
  async cleanupInactiveAgents(maxAgeHours = 24) {
    const todoData = await this.readTodo();
    const cleanedUp = [];

    if (!todoData.agents) {
      return cleanedUp;
    }

    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));

    for (const [agentId, agent] of Object.entries(todoData.agents)) {
      if (agent.status === 'inactive' && agent.inactiveAt) {
        const inactiveTime = new Date(agent.inactiveAt);
        if (inactiveTime < cutoffTime) {
          // Security: Validate agentId before deletion to prevent object injection
          if (!this.isValidAgentId(AGENT_ID)) {
            this.logger.logError(new Error('Invalid agent ID'), `cleanupInactiveAgents - invalid agentId: ${agentId}`);
            continue;
          }

          /* eslint-disable-next-line security/detect-object-injection */
          delete todoData.agents[agentId];
          cleanedUp.push(AGENT_ID);
        }
      }
    }

    if (cleanedUp.length > 0) {
      await this.writeTodo(todoData);
      this.logger.addFlow(`Cleaned up ${cleanedUp.length} inactive agents`);
    }

    return cleanedUp;
  }

  /**
     * Read TODO.json file
     * @returns {Object} TODO.json data
     */
  readTodo() {
    try {
      // Use safe file read with validation
      const projectRoot = PATH.dirname(this.todoPath);
      const filename = PATH.basename(this.todoPath);
      const content = FilesystemSecurity.safeReadFileSync(projectRoot, filename, 'utf8');
      const parsed = JSON.parse(content);
      // DEBUG: Temporary logging removed
      return parsed;
    } catch (error) {
      throw new Error(`Failed to read TODO.json: ${error.message}`);
    }
  }

  /**
     * Write TODO.json file
     * @param {Object} data - Data to write
     */
  writeTodo(data) {
    try {
      // Use safe file write with validation
      const projectRoot = PATH.dirname(this.todoPath);
      const filename = PATH.basename(this.todoPath);
      FilesystemSecurity.safeWriteFileSync(projectRoot, filename, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to write TODO.json: ${error.message}`);
    }
  }

  /**
     * Cleanup resources
     */
  /**
   * Validate agent ID to prevent object injection attacks
   * @param {string} agentId - Agent ID to validate
   * @returns {boolean} True if valid agent ID
   */
  isValidAgentId(AGENT_ID) {
    // Check basic type And existence
    if (!agentId || typeof agentId !== 'string') {
      return false;
    }

    // Check length (reasonable bounds)
    if (agentId.length < 10 || agentId.length > 200) {
      return false;
    }

    // Check format: role_sessionId_instance_specialization_hash
    const agentIdPattern = /^[a-zA-Z_]+_session_\d+_\d+_[a-zA-Z0-9_]+_[a-f0-9]{8}$/;
    if (!agentIdPattern.test(AGENT_ID)) {
      return false;
    }

    // Check for suspicious patterns That could be injection attempts
    const suspiciousPatterns = [
      '__proto__',
      'constructor',
      'prototype',
      '../',
      '..\\',
      '<script',
      'javascript:',
      'eval(',
      'function(',
    ];

    const lowerAgentId = agentId.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (lowerAgentId.includes(pattern)) {
        this.logger.logError(new Error('Suspicious agent ID pattern detected'), `agentId: ${agentId}, pattern: ${pattern}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all active agents
   * @returns {Array} Array of active agents with their IDs
   */
  async getAllActiveAgents() {
    const todoData = await this.readTodo();

    if (!todoData.agents) {
      return [];
    }

    const activeAgents = [];
    const now = new Date();

    Object.entries(todoData.agents).forEach(([agentId, agent]) => {
      if (agent.status === 'active') {
        const lastHeartbeat = new Date(agent.lastHeartbeat);
        const timeSinceLastHeartbeat = now - lastHeartbeat;

        activeAgents.push({
          agentId,
          agent,
          timeSinceLastHeartbeat,
          isStale: timeSinceLastHeartbeat > this.options.agentTimeout,
        });
      }
    });

    // Sort by most recently active
    return activeAgents.sort((a, b) => a.timeSinceLastHeartbeat - b.timeSinceLastHeartbeat);
  }

  /**
   * Find the most suitable agent for reinitialization
   * @param {string} preferredRole - Preferred agent role
   * @returns {Object|null} Best agent candidate or null
   */
  async findBestAgentForReinitialization(preferredRole = 'development') {
    const activeAgents = await this.getAllActiveAgents();

    if (activeAgents.length === 0) {
      return null;
    }

    // If only one agent, return it
    if (activeAgents.length === 1) {
      return activeAgents[0];
    }

    // Prefer agents with matching role
    const roleMatches = activeAgents.filter(a => a.agent.role === preferredRole);
    if (roleMatches.length > 0) {
      return roleMatches[0]; // Most recently active with matching role
    }

    // Return most recently active agent
    return activeAgents[0];
  }

  /**
   * Clean up stale agents And return count
   * @returns {Promise<{cleanedCount: number, remainingAgents: Array}>}
   */
  async cleanupStaleAgents() {
    const todoData = await this.readTodo();

    if (!todoData.agents) {
      return { cleanedCount: 0, remainingAgents: [] };
    }

    const now = new Date();
    const staleAgentIds = [];
    const remainingAgents = [];

    Object.entries(todoData.agents).forEach(([agentId, agent]) => {
      const lastHeartbeat = new Date(agent.lastHeartbeat);
      const timeSinceLastHeartbeat = now - lastHeartbeat;

      if (timeSinceLastHeartbeat > this.options.agentTimeout) {
        staleAgentIds.push(AGENT_ID);
        this.logger.addFlow(`Cleaning up stale agent ${agentId} (inactive for ${Math.round(timeSinceLastHeartbeat / 1000 / 60)} minutes)`);
      } else {
        remainingAgents.push({ agentId, agent });
      }
    });

    // Remove stale agents
    staleAgentIds.forEach(agentId => {
      /* eslint-disable-next-line security/detect-object-injection */
      delete todoData.agents[agentId];
    });

    if (staleAgentIds.length > 0) {
      await this.writeTodo(todoData);
    }

    return {
      cleanedCount: staleAgentIds.length,
      remainingAgents,
    };
  }

  /**
   * ADAPTER METHODS - Bridge between AgentManagement module And existing AgentManager methods
   * These methods provide the API expected by the modular AgentManagement system
   */

  /**
   * Create a new agent (adapter for registerAgent)
   * @param {Object} config - Agent configuration
   * @returns {Promise<Object>} Agent object with agentId
   */
  async createAgent(config = {}) {
    try {
      const agentId = await this.registerAgent(config);
      const agent = await this.getAgent(AGENT_ID);

      return {
        agentId,
        sessionId: agent.sessionId,
        createdAt: agent.createdAt,
        capabilities: agent.capabilities,
        workload: agent.workload,
        maxConcurrentTasks: agent.maxConcurrentTasks,
        role: agent.role,
        status: agent.status,
        ...agent,
      };
    } catch (error) {
      this.logger.logError(error, 'createAgent adapter failed');
      throw error;
    }
  }

  /**
   * Renew an existing agent (adapter for reinitializeAgent)
   * @param {string} agentId - Agent ID to renew
   * @param {Object} config - Optional configuration updates
   * @returns {Promise<Object>} Renewal result
   */
  async renewAgent(agentId, config = {}) {
    try {
      const RESULT = await this.reinitializeAgent(agentId, config);
      return {
        success: true,
        agentId,
        renewed: true,
        message: 'Agent renewed successfully',
        ...result,
      };
    } catch (error) {
      this.logger.logError(error, `renewAgent adapter failed for agent ${agentId}`);
      throw error;
    }
  }

  /**
   * List all active agents (adapter for getAllActiveAgents)
   * @returns {Promise<Array>} Array of active agent objects
   */
  async listActiveAgents() {
    try {
      const agents = await this.getAllActiveAgents();
      return agents.map(({ agentId, agent }) => ({
        agentId,
        role: agent.role,
        status: agent.status,
        createdAt: agent.createdAt,
        lastHeartbeat: agent.lastHeartbeat,
        workload: agent.workload,
        assignedTasks: agent.assignedTasks || [],
        capabilities: agent.capabilities,
        ...agent,
      }));
    } catch (error) {
      this.logger.logError(error, 'listActiveAgents adapter failed');
      throw error;
    }
  }

  cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.agentHeartbeats.clear();
  }
}

module.exports = AgentManager;
