#!/usr/bin/env node

/**
 * Backend REST API Server for TaskManager System
 * 
 * Provides REST endpoints for task management, agent operations, and system status.
 * Integrates with the existing TaskManager, Agent Registry, and stop-hook systems.
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const NodeCache = require('node-cache');
const TaskManager = require('./lib/taskManager');
const AgentRegistry = require('./lib/agentRegistry');
const Logger = require('./lib/logger');
const AuthMiddleware = require('./lib/authMiddleware');
const createAuthRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Performance monitoring
const performanceMetrics = {
  requests: 0,
  responseTimes: [],
  errorCount: 0,
  startTime: Date.now()
};

// Initialize response cache (TTL: 60 seconds, check period: 120 seconds)
const responseCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Performance and Security Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance Monitoring Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  performanceMetrics.requests++;
  
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    performanceMetrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times for rolling average
    if (performanceMetrics.responseTimes.length > 1000) {
      performanceMetrics.responseTimes.shift();
    }
    
    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      logger.logFlow(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`, 'performance');
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
});

// Cache middleware for GET requests
const cacheMiddleware = (duration = 60) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = req.originalUrl || req.url;
    const cached = responseCache.get(key);
    
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    res.originalJson = res.json;
    res.json = function(body) {
      responseCache.set(key, body, duration);
      res.set('X-Cache', 'MISS');
      res.originalJson(body);
    };
    
    next();
  };
};

// Initialize TaskManager and Logger
const todoPath = path.join(process.cwd(), 'TODO.json');
const agentRegistryPath = path.join(process.cwd(), 'agent-registry.json');
const taskManager = new TaskManager(todoPath);
const agentRegistry = new AgentRegistry(agentRegistryPath);
const logger = new Logger(process.cwd());

// Initialize Authentication System
const authMiddleware = new AuthMiddleware({
  publicRoutes: [
    '/api/health',
    '/api/auth/login',
    '/api/auth/callback',
    '/api/auth/providers',
    '/api/auth/status',
    '/api/auth/verify'
  ]
});

// Enhanced error handling with structured errors
class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Enhanced async handler with performance tracking
const asyncHandler = (fn) => (req, res, next) => {
  const startTime = Date.now();
  Promise.resolve(fn(req, res, next))
    .catch(error => {
      performanceMetrics.errorCount++;
      
      // Log error with context
      logger.logError(error, 'api-endpoint', {
        endpoint: `${req.method} ${req.path}`,
        duration: Date.now() - startTime,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      
      next(error);
    });
};

// Global middleware
app.use(authMiddleware.securityHeaders());
app.use(authMiddleware.requestLogger());
app.use(authMiddleware.rateLimit());

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// Mount authentication routes
app.use('/api/auth', createAuthRoutes());

// Apply JWT authentication to all routes except public ones
app.use(authMiddleware.optionalAuth());

// ============================================================================
// TASK MANAGEMENT ENDPOINTS
// ============================================================================

// ============================================================================
// ENHANCED PERFORMANCE & MONITORING ENDPOINTS
// ============================================================================

/**
 * GET /api/performance - Get detailed performance metrics
 */
app.get('/api/performance', cacheMiddleware(30), asyncHandler(async (req, res) => {
  const uptime = Date.now() - performanceMetrics.startTime;
  const avgResponseTime = performanceMetrics.responseTimes.length > 0
    ? performanceMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / performanceMetrics.responseTimes.length
    : 0;
  
  const p95ResponseTime = performanceMetrics.responseTimes.length > 0
    ? performanceMetrics.responseTimes.sort((a, b) => a - b)[Math.floor(performanceMetrics.responseTimes.length * 0.95)]
    : 0;

  const requestsPerMinute = performanceMetrics.requests / (uptime / 60000);
  const errorRate = performanceMetrics.requests > 0 
    ? (performanceMetrics.errorCount / performanceMetrics.requests * 100)
    : 0;

  res.json({
    success: true,
    data: {
      uptime: uptime,
      uptimeFormatted: formatDuration(uptime),
      requests: {
        total: performanceMetrics.requests,
        perMinute: Math.round(requestsPerMinute * 100) / 100,
        errorCount: performanceMetrics.errorCount,
        errorRate: Math.round(errorRate * 100) / 100
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        slowRequests: performanceMetrics.responseTimes.filter(t => t > 1000).length
      },
      cache: {
        hits: responseCache.getStats().hits || 0,
        misses: responseCache.getStats().misses || 0,
        keys: responseCache.getStats().keys || 0,
        hitRate: calculateCacheHitRate()
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/health/detailed - Enhanced health check with system diagnostics
 */
app.get('/api/health/detailed', asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version,
    checks: []
  };

  // Task system health
  try {
    const todoData = await taskManager.readTodo();
    health.checks.push({
      name: 'task_system',
      status: 'healthy',
      details: {
        totalTasks: todoData.tasks ? todoData.tasks.length : 0,
        pendingTasks: todoData.tasks ? todoData.tasks.filter(t => t.status === 'pending').length : 0
      }
    });
  } catch (error) {
    health.status = 'degraded';
    health.checks.push({
      name: 'task_system',
      status: 'unhealthy',
      error: error.message
    });
  }

  // Agent registry health
  try {
    const agents = agentRegistry.getAllAgents();
    const activeAgents = agents.filter(agent => {
      const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat || agent.lastActivity;
      const heartbeatTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
      return Date.now() - heartbeatTime < 900000; // 15 minutes
    });

    health.checks.push({
      name: 'agent_registry',
      status: 'healthy',
      details: {
        totalAgents: agents.length,
        activeAgents: activeAgents.length
      }
    });
  } catch (error) {
    health.status = 'degraded';
    health.checks.push({
      name: 'agent_registry',
      status: 'unhealthy',
      error: error.message
    });
  }

  // Performance health
  const avgResponseTime = performanceMetrics.responseTimes.length > 0
    ? performanceMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / performanceMetrics.responseTimes.length
    : 0;

  const performanceStatus = avgResponseTime > 2000 ? 'degraded' : 'healthy';
  if (performanceStatus === 'degraded') health.status = 'degraded';

  health.checks.push({
    name: 'performance',
    status: performanceStatus,
    details: {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: performanceMetrics.requests > 0 
        ? Math.round(performanceMetrics.errorCount / performanceMetrics.requests * 10000) / 100
        : 0
    }
  });

  res.json({
    success: true,
    data: health
  });
}));

// Helper functions
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function calculateCacheHitRate() {
  const stats = responseCache.getStats();
  const total = (stats.hits || 0) + (stats.misses || 0);
  return total > 0 ? Math.round((stats.hits || 0) / total * 10000) / 100 : 0;
}

// ============================================================================
// TASK MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/tasks - List all tasks with optional filtering
 */
app.get('/api/tasks', cacheMiddleware(30), asyncHandler(async (req, res) => {
  const { status, category, assigned_agent, limit, offset } = req.query;
  
  const todoData = await taskManager.readTodo();
  let tasks = todoData.tasks || [];
  
  // Apply filters
  if (status) {
    tasks = tasks.filter(task => task.status === status);
  }
  if (category) {
    tasks = tasks.filter(task => task.category === category);
  }
  if (assigned_agent) {
    tasks = tasks.filter(task => task.assigned_agent === assigned_agent);
  }
  
  // Apply pagination
  const startIndex = parseInt(offset) || 0;
  const maxResults = parseInt(limit) || tasks.length;
  const paginatedTasks = tasks.slice(startIndex, startIndex + maxResults);
  
  res.json({
    success: true,
    data: {
      tasks: paginatedTasks,
      pagination: {
        total: tasks.length,
        offset: startIndex,
        limit: maxResults,
        hasMore: startIndex + maxResults < tasks.length
      }
    }
  });
}));

/**
 * GET /api/tasks/:taskId - Get specific task details
 */
app.get('/api/tasks/:taskId', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  
  const todoData = await taskManager.readTodo();
  const task = todoData.tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found',
      taskId
    });
  }
  
  res.json({
    success: true,
    data: { task }
  });
}));

/**
 * POST /api/tasks - Create new task
 */
app.post('/api/tasks', asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    priority,
    mode,
    dependencies,
    important_files,
    success_criteria,
    estimate,
    requires_research,
    subtasks
  } = req.body;
  
  if (!title || !category) {
    return res.status(400).json({
      success: false,
      error: 'Title and category are required',
      required: ['title', 'category']
    });
  }
  
  const taskData = {
    title,
    description: description || '',
    category,
    priority: priority || 'medium',
    mode: mode || 'DEVELOPMENT',
    dependencies: dependencies || [],
    important_files: important_files || [],
    success_criteria: success_criteria || [],
    estimate: estimate || '',
    requires_research: requires_research || false,
    subtasks: subtasks || []
  };
  
  const taskId = await taskManager.createTask(taskData);
  
  res.status(201).json({
    success: true,
    data: {
      taskId,
      message: 'Task created successfully'
    }
  });
}));

/**
 * PUT /api/tasks/:taskId/status - Update task status
 */
app.put('/api/tasks/:taskId/status', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { status, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required',
      validStatuses: ['pending', 'in_progress', 'completed', 'blocked']
    });
  }
  
  await taskManager.updateTaskStatus(taskId, status, notes);
  
  res.json({
    success: true,
    data: {
      taskId,
      status,
      message: 'Task status updated successfully'
    }
  });
}));

/**
 * POST /api/tasks/:taskId/claim - Claim a task for an agent
 */
app.post('/api/tasks/:taskId/claim', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { agentId, priority } = req.body;
  
  if (!agentId) {
    throw new APIError('Agent ID is required', 400, 'MISSING_AGENT_ID');
  }
  
  const result = await taskManager.claimTask(taskId, agentId, priority || 'normal');
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/tasks/bulk - Create multiple tasks in a single request
 */
app.post('/api/tasks/bulk', asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new APIError('Tasks array is required and cannot be empty', 400, 'INVALID_BULK_DATA');
  }
  
  if (tasks.length > 50) {
    throw new APIError('Cannot create more than 50 tasks in a single request', 400, 'BULK_LIMIT_EXCEEDED');
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < tasks.length; i++) {
    try {
      const task = tasks[i];
      
      if (!task.title || !task.category) {
        errors.push({
          index: i,
          error: 'Title and category are required',
          task: task
        });
        continue;
      }
      
      const taskData = {
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority || 'medium',
        mode: task.mode || 'DEVELOPMENT',
        dependencies: task.dependencies || [],
        important_files: task.important_files || [],
        success_criteria: task.success_criteria || [],
        estimate: task.estimate || '',
        requires_research: task.requires_research || false,
        subtasks: task.subtasks || []
      };
      
      const taskId = await taskManager.createTask(taskData);
      results.push({
        index: i,
        taskId,
        title: task.title
      });
      
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
        task: tasks[i]
      });
    }
  }
  
  // Clear cache for task-related endpoints
  responseCache.flushAll();
  
  res.status(201).json({
    success: true,
    data: {
      created: results,
      errors: errors,
      summary: {
        totalSubmitted: tasks.length,
        successful: results.length,
        failed: errors.length
      }
    }
  });
}));

/**
 * GET /api/tasks/search - Advanced task search with full-text search
 */
app.get('/api/tasks/search', cacheMiddleware(30), asyncHandler(async (req, res) => {
  const { 
    q,           // Search query
    status,      // Filter by status
    category,    // Filter by category
    priority,    // Filter by priority
    assigned_agent, // Filter by assigned agent
    created_after,  // Filter by creation date
    created_before,
    sort = 'created_at', // Sort field
    order = 'desc',     // Sort order (asc/desc)
    limit = 50,
    offset = 0
  } = req.query;
  
  const todoData = await taskManager.readTodo();
  let tasks = todoData.tasks || [];
  
  // Full-text search in title and description
  if (q && q.trim()) {
    const searchTerm = q.trim().toLowerCase();
    tasks = tasks.filter(task => {
      return (
        (task.title && task.title.toLowerCase().includes(searchTerm)) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.category && task.category.toLowerCase().includes(searchTerm))
      );
    });
  }
  
  // Apply filters
  if (status) tasks = tasks.filter(task => task.status === status);
  if (category) tasks = tasks.filter(task => task.category === category);
  if (priority) tasks = tasks.filter(task => task.priority === priority);
  if (assigned_agent) tasks = tasks.filter(task => task.assigned_agent === assigned_agent);
  
  // Date filters
  if (created_after) {
    const afterDate = new Date(created_after).getTime();
    tasks = tasks.filter(task => new Date(task.created_at).getTime() >= afterDate);
  }
  if (created_before) {
    const beforeDate = new Date(created_before).getTime();
    tasks = tasks.filter(task => new Date(task.created_at).getTime() <= beforeDate);
  }
  
  // Sorting
  tasks.sort((a, b) => {
    let aValue = a[sort];
    let bValue = b[sort];
    
    // Handle date sorting
    if (sort.includes('_at') || sort === 'created_at') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }
    
    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue || '').toLowerCase();
    }
    
    if (order === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });
  
  // Pagination
  const startIndex = parseInt(offset);
  const maxResults = parseInt(limit);
  const paginatedTasks = tasks.slice(startIndex, startIndex + maxResults);
  
  res.json({
    success: true,
    data: {
      tasks: paginatedTasks,
      searchQuery: q,
      filters: {
        status,
        category,
        priority,
        assigned_agent,
        created_after,
        created_before
      },
      sorting: { sort, order },
      pagination: {
        total: tasks.length,
        offset: startIndex,
        limit: maxResults,
        hasMore: startIndex + maxResults < tasks.length
      }
    }
  });
}));

// ============================================================================
// AGENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/agents - List all registered agents
 */
app.get('/api/agents', asyncHandler(async (req, res) => {
  const agents = agentRegistry.getAllAgents();
  
  res.json({
    success: true,
    data: { agents }
  });
}));

/**
 * POST /api/agents/register - Register a new agent
 */
app.post('/api/agents/register', asyncHandler(async (req, res) => {
  const { role, sessionId, specialization } = req.body;
  
  const agentConfig = {
    role: role || 'development',
    sessionId: sessionId || `session_${Date.now()}`,
    specialization: specialization || []
  };
  
  const agentId = await agentRegistry.registerAgent(agentConfig);
  
  res.status(201).json({
    success: true,
    data: {
      agentId,
      config: agentConfig,
      message: 'Agent registered successfully'
    }
  });
}));

/**
 * GET /api/agents/:agentId/current-task - Get agent's current task
 */
app.get('/api/agents/:agentId/current-task', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  
  const task = await taskManager.getCurrentTask(agentId);
  
  if (!task) {
    return res.json({
      success: true,
      data: {
        task: null,
        message: 'No active task for this agent'
      }
    });
  }
  
  res.json({
    success: true,
    data: { task }
  });
}));

/**
 * GET /api/available-tasks - Get available tasks with previous task context for agents
 */
app.get('/api/available-tasks', cacheMiddleware(10), asyncHandler(async (req, res) => {
  const { agentId, include_previous = 'true', include_urgent = 'true' } = req.query;
  
  if (!agentId) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_AGENT_ID',
      message: 'Agent ID is required as query parameter',
      usage: 'GET /api/available-tasks?agentId=agent-123'
    });
  }
  
  try {
    // Get available tasks with context
    const tasksWithContext = await taskManager.getAvailableTasksWithContext(agentId);
    
    // Optionally get task switching recommendations
    let switchingGuidance = null;
    if (include_urgent === 'true') {
      const switchingResult = await taskManager.getCurrentTaskWithSwitching(agentId);
      if (switchingResult.action === 'urgent_task_switch_recommended') {
        switchingGuidance = switchingResult;
      }
    }
    
    const response = {
      success: true,
      data: {
        agentId: agentId,
        timestamp: new Date().toISOString(),
        
        // Current task information
        currentTask: tasksWithContext.currentTask,
        
        // Previously worked-on tasks (switched tasks)
        ...(include_previous === 'true' && {
          previousTasks: tasksWithContext.previousTasks,
          hasPreviousTasks: tasksWithContext.previousTasks.length > 0
        }),
        
        // Available pending tasks
        availableTasks: tasksWithContext.availableTasks,
        
        // Task switching recommendations
        ...(switchingGuidance && {
          urgentTaskGuidance: switchingGuidance
        }),
        
        // Summary statistics
        summary: {
          ...tasksWithContext.summary,
          totalAvailable: tasksWithContext.availableTasks.length,
          canResumePrevious: tasksWithContext.previousTasks.length,
          hasUrgentRecommendation: !!switchingGuidance
        },
        
        // Operation tracking
        operationId: tasksWithContext.operationId
      },
      
      // Response metadata
      meta: {
        includePrevious: include_previous === 'true',
        includeUrgent: include_urgent === 'true',
        cacheStatus: 'MISS' // Will be overwritten by cache middleware
      }
    };
    
    res.json(response);
    
  } catch (error) {
    logger.logError(error, 'available-tasks-endpoint', {
      agentId,
      endpoint: '/api/available-tasks'
    });
    
    res.status(500).json({
      success: false,
      error: 'TASK_RETRIEVAL_ERROR',
      message: 'Failed to retrieve available tasks',
      agentId: agentId,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * POST /api/agents/:agentId/switch-task - Switch to an urgent task or resume a previous task
 */
app.post('/api/agents/:agentId/switch-task', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { action, taskId, taskData, reason } = req.body;
  
  if (!action || !['create_urgent', 'resume_previous'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ACTION',
      message: 'Action must be either "create_urgent" or "resume_previous"',
      validActions: ['create_urgent', 'resume_previous']
    });
  }
  
  try {
    let result;
    
    if (action === 'create_urgent') {
      if (!taskData || !taskData.title || !taskData.category) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_TASK_DATA',
          message: 'Task data with title and category is required for urgent task creation'
        });
      }
      
      // Add switch reason to task data
      const urgentTaskData = {
        ...taskData,
        switchReason: reason || 'Urgent task created via API'
      };
      
      result = await taskManager.createUrgentTask(urgentTaskData, agentId);
      
    } else if (action === 'resume_previous') {
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_TASK_ID',
          message: 'Task ID is required for resuming previous task'
        });
      }
      
      result = await taskManager.resumeSwitchedTask(taskId, agentId);
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.logError(error, 'task-switch-endpoint', {
      agentId,
      action,
      taskId,
      endpoint: '/api/agents/:agentId/switch-task'
    });
    
    res.status(500).json({
      success: false,
      error: 'TASK_SWITCH_ERROR',
      message: error.message || 'Failed to switch task',
      action,
      agentId,
      timestamp: new Date().toISOString()
    });
  }
}));

// ============================================================================
// SYSTEM STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/status - Get overall system status
 */
app.get('/api/status', asyncHandler(async (req, res) => {
  const taskStatus = await taskManager.getTaskStatus();
  const agents = agentRegistry.getAllAgents();
  
  // Count active agents (heartbeat within last 15 minutes)
  const activeAgents = agents.filter(agent => {
    const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat || agent.lastActivity;
    const heartbeatTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
    const timeSinceHeartbeat = Date.now() - heartbeatTime;
    return timeSinceHeartbeat < 900000; // 15 minutes
  });
  
  res.json({
    success: true,
    data: {
      system: {
        status: 'operational',
        timestamp: new Date().toISOString()
      },
      tasks: taskStatus,
      agents: {
        total: agents.length,
        active: activeAgents.length,
        activeAgentIds: activeAgents.map(agent => agent.agentId)
      }
    }
  });
}));

/**
 * GET /api/health - Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: require('./package.json').version
    }
  });
});

// ============================================================================
// STOP HOOK CONTROL ENDPOINTS
// ============================================================================

/**
 * POST /api/stop-hook/authorize - Authorize stop for infinite continue hook
 */
app.post('/api/stop-hook/authorize', asyncHandler(async (req, res) => {
  const { agentId, reason } = req.body;
  
  if (!agentId) {
    return res.status(400).json({
      success: false,
      error: 'Agent ID is required'
    });
  }
  
  const result = await taskManager.authorizeStopHook(agentId, reason || 'API request');
  
  res.json({
    success: true,
    data: result
  });
}));

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/stats - Get detailed system statistics
 */
app.get('/api/stats', asyncHandler(async (req, res) => {
  const todoData = await taskManager.readTodo();
  const tasks = todoData.tasks || [];
  
  // Calculate statistics
  const stats = {
    tasks: {
      total: tasks.length,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      avgCompletionTime: null
    },
    agents: {
      total: Object.keys(todoData.agents || {}).length,
      active: 0,
      byRole: {}
    },
    performance: {
      tasksCompletedToday: 0,
      tasksCompletedThisWeek: 0,
      avgTasksPerDay: 0
    }
  };
  
  // Count tasks by status, category, priority
  tasks.forEach(task => {
    // By status
    stats.tasks.byStatus[task.status] = (stats.tasks.byStatus[task.status] || 0) + 1;
    
    // By category
    stats.tasks.byCategory[task.category] = (stats.tasks.byCategory[task.category] || 0) + 1;
    
    // By priority
    stats.tasks.byPriority[task.priority] = (stats.tasks.byPriority[task.priority] || 0) + 1;
  });
  
  // Calculate completion time for completed tasks
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.started_at && t.completed_at);
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      const start = new Date(task.started_at).getTime();
      const end = new Date(task.completed_at).getTime();
      return sum + (end - start);
    }, 0);
    stats.tasks.avgCompletionTime = Math.round(totalTime / completedTasks.length / 1000 / 60); // minutes
  }
  
  // Calculate daily performance metrics
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const weekStart = todayStart - (6 * 24 * 60 * 60 * 1000);
  
  stats.performance.tasksCompletedToday = tasks.filter(t => 
    t.status === 'completed' && 
    t.completed_at && 
    new Date(t.completed_at).getTime() >= todayStart
  ).length;
  
  stats.performance.tasksCompletedThisWeek = tasks.filter(t => 
    t.status === 'completed' && 
    t.completed_at && 
    new Date(t.completed_at).getTime() >= weekStart
  ).length;
  
  stats.performance.avgTasksPerDay = Math.round(stats.performance.tasksCompletedThisWeek / 7 * 10) / 10;
  
  res.json({
    success: true,
    data: stats
  });
}));

// ============================================================================
// GITHUB INTEGRATION ENDPOINTS
// ============================================================================

const GitHubApiService = require('./lib/githubApiService');
const githubService = new GitHubApiService();

/**
 * GET /api/github/status - Test GitHub API connection
 */
app.get('/api/github/status', asyncHandler(async (req, res) => {
  const connectionTest = await githubService.testConnection();
  
  res.json({
    success: true,
    data: connectionTest
  });
}));

/**
 * GET /api/github/repository - Get repository information
 */
app.get('/api/github/repository', asyncHandler(async (req, res) => {
  const repoInfo = await githubService.getRepositoryInfo();
  
  if (repoInfo.success) {
    res.json({
      success: true,
      data: repoInfo.repository
    });
  } else {
    res.status(404).json({
      success: false,
      error: repoInfo.error,
      message: repoInfo.message
    });
  }
}));

/**
 * GET /api/github/analytics - Get repository analytics
 */
app.get('/api/github/analytics', asyncHandler(async (req, res) => {
  const analytics = await githubService.getRepositoryAnalytics();
  
  if (analytics.success) {
    res.json({
      success: true,
      data: analytics.analytics
    });
  } else {
    res.status(500).json({
      success: false,
      error: analytics.error,
      message: analytics.message
    });
  }
}));

/**
 * GET /api/github/issues - Get GitHub issues
 */
app.get('/api/github/issues', asyncHandler(async (req, res) => {
  const { state, labels, sort, direction, page, per_page } = req.query;
  
  const options = {};
  if (state) options.state = state;
  if (labels) options.labels = labels;
  if (sort) options.sort = sort;
  if (direction) options.direction = direction;
  if (page) options.page = parseInt(page);
  if (per_page) options.perPage = parseInt(per_page);
  
  const issues = await githubService.getIssues(options);
  
  if (issues.success) {
    res.json({
      success: true,
      data: {
        issues: issues.issues,
        pagination: issues.pagination
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: issues.error,
      message: issues.message
    });
  }
}));

/**
 * POST /api/github/sync-task/:taskId - Create GitHub issue from task
 */
app.post('/api/github/sync-task/:taskId', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  
  // Get task details
  const todoData = await taskManager.readTodo();
  const task = (todoData.tasks || []).find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found',
      taskId
    });
  }
  
  const result = await githubService.createIssueFromTask(task);
  
  if (result.success) {
    // Optionally store GitHub issue reference in task
    res.json({
      success: true,
      data: {
        task: task,
        githubIssue: result.issue,
        message: `GitHub issue #${result.issue.number} created for task ${taskId}`
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error,
      message: result.message
    });
  }
}));

/**
 * PUT /api/github/sync-task/:taskId/:issueNumber - Update GitHub issue from task
 */
app.put('/api/github/sync-task/:taskId/:issueNumber', asyncHandler(async (req, res) => {
  const { taskId, issueNumber } = req.params;
  
  // Get task details
  const todoData = await taskManager.readTodo();
  const task = (todoData.tasks || []).find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Task not found',
      taskId
    });
  }
  
  const result = await githubService.updateIssueFromTask(parseInt(issueNumber), task);
  
  if (result.success) {
    res.json({
      success: true,
      data: {
        task: task,
        githubIssue: result.issue,
        message: `GitHub issue #${issueNumber} updated from task ${taskId}`
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error,
      message: result.message
    });
  }
}));

/**
 * POST /api/github/webhook - GitHub webhook endpoint
 */
app.post('/api/github/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature if secret is configured
  if (githubService.config.webhookSecret) {
    if (!signature || !githubService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }
  }
  
  // Process webhook event
  const result = githubService.processWebhookEvent(req.body);
  
  if (result.success) {
    res.json({
      success: true,
      data: {
        event: result.event,
        suggestions: result.suggestions,
        message: 'Webhook processed successfully'
      }
    });
    
    // Log webhook event
    logger.addFlow(`GitHub webhook: ${event} - ${result.event.action}`);
  } else {
    res.status(400).json({
      success: false,
      error: result.message
    });
  }
}));

// ============================================================================
// ERROR HANDLING & SERVER STARTUP
// ============================================================================

/**
 * Enhanced global error handler
 */
app.use((error, req, res, _next) => {
  // Handle custom API errors
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.errorCode,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.details || {},
      timestamp: new Date().toISOString()
    });
  }
  
  // Log unexpected errors
  logger.logError(error, 'api-server', {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Return generic error for production
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Authentication error handling
app.use(authMiddleware.errorHandler());

// General error handling
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Enhanced TaskManager REST API Server`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Enhanced health check: http://localhost:${PORT}/api/health/detailed`);
  console.log(`⚡ Performance metrics: http://localhost:${PORT}/api/performance`);
  console.log(`📋 System status: http://localhost:${PORT}/api/status`);
  console.log(`\n📄 Enhanced API Endpoints:`);
  console.log(`\n🔍 PERFORMANCE & MONITORING:`);
  console.log(`   GET    /api/performance     - Detailed performance metrics`);
  console.log(`   GET    /api/health/detailed - Enhanced health diagnostics`);
  console.log(`   GET    /api/health          - Basic health check`);
  console.log(`\n📋 TASK MANAGEMENT (Enhanced):`);
  console.log(`   GET    /api/tasks           - List tasks (cached)`);
  console.log(`   GET    /api/tasks/search    - Advanced search with filters`);
  console.log(`   POST   /api/tasks/bulk      - Create multiple tasks`);
  console.log(`   POST   /api/tasks           - Create single task`);
  console.log(`   GET    /api/tasks/:id       - Get task details`);
  console.log(`   PUT    /api/tasks/:id/status - Update task status`);
  console.log(`   POST   /api/tasks/:id/claim - Claim task`);
  console.log(`\n👥 AGENT MANAGEMENT:`);
  console.log(`   GET    /api/agents          - List agents`);
  console.log(`   POST   /api/agents/register - Register agent`);
  console.log(`   GET    /api/agents/:id/current-task - Get agent's task`);
  console.log(`   GET    /api/available-tasks - Get available tasks with context`);
  console.log(`   POST   /api/agents/:id/switch-task - Switch/resume tasks`);
  console.log(`\n📊 SYSTEM & ANALYTICS:`);
  console.log(`   GET    /api/status          - System status`);
  console.log(`   GET    /api/stats           - Detailed statistics`);
  console.log(`   POST   /api/stop-hook/authorize - Authorize stop hook`);
  console.log(`\n🔐 AUTHENTICATION:`);
  console.log(`   GET    /api/auth/providers  - Available OAuth providers`);
  console.log(`   GET    /api/auth/login/:provider - Start OAuth flow`);
  console.log(`   GET    /api/auth/callback/:provider - OAuth callback`);
  console.log(`   POST   /api/auth/refresh    - Refresh JWT tokens`);
  console.log(`   GET    /api/auth/me         - Get current user`);
  console.log(`   POST   /api/auth/logout     - Logout user`);
  console.log(`\n🔗 GITHUB INTEGRATION:`);
  console.log(`   GET    /api/github/status   - GitHub API connection status`);
  console.log(`   GET    /api/github/repository - Repository information`);
  console.log(`   GET    /api/github/analytics - Repository analytics`);
  console.log(`   GET    /api/github/issues   - GitHub issues`);
  console.log(`   POST   /api/github/sync-task/:id - Sync task to GitHub`);
  console.log(`   PUT    /api/github/sync-task/:id/:issue - Update GitHub issue`);
  console.log(`   POST   /api/github/webhook  - GitHub webhook endpoint`);
  console.log(`\n✨ Enhanced Features:`);
  console.log(`   • Response caching with hit/miss tracking`);
  console.log(`   • Performance monitoring and slow request detection`);
  console.log(`   • Compression and security headers`);
  console.log(`   • Enhanced error handling with structured responses`);
  console.log(`   • Bulk operations for improved efficiency`);
  console.log(`   • Advanced search and filtering capabilities`);
  console.log(`   • Real-time system health monitoring\n`);
  
  logger.addFlow(`API server started on port ${PORT}`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    logger.addFlow('API server shutdown gracefully');
    logger.save();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    logger.addFlow('API server shutdown gracefully');
    logger.save();
    process.exit(0);
  });
});

module.exports = app;