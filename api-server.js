#!/usr/bin/env node

/**
 * Backend REST API Server for TaskManager System
 * 
 * Provides REST endpoints for task management, agent operations, and system status.
 * Integrates with the existing TaskManager, Agent Registry, and stop-hook systems.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const TaskManager = require('./lib/taskManager');
const AgentRegistry = require('./lib/agentRegistry');
const Logger = require('./lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize TaskManager and Logger
const todoPath = path.join(process.cwd(), 'TODO.json');
const taskManager = new TaskManager(todoPath);
const agentRegistry = new AgentRegistry();
const logger = new Logger(process.cwd());

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================================
// TASK MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/tasks - List all tasks with optional filtering
 */
app.get('/api/tasks', asyncHandler(async (req, res) => {
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
    return res.status(400).json({
      success: false,
      error: 'Agent ID is required'
    });
  }
  
  const result = await taskManager.claimTask(taskId, agentId, priority || 'normal');
  
  res.json({
    success: true,
    data: result
  });
}));

// ============================================================================
// AGENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/agents - List all registered agents
 */
app.get('/api/agents', asyncHandler(async (req, res) => {
  const agents = await agentRegistry.listAgents();
  
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

// ============================================================================
// SYSTEM STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/status - Get overall system status
 */
app.get('/api/status', asyncHandler(async (req, res) => {
  const taskStatus = await taskManager.getTaskStatus();
  const agents = await agentRegistry.listAgents();
  
  // Count active agents (heartbeat within last 15 minutes)
  const activeAgents = Object.keys(agents).filter(agentId => {
    const agent = agents[agentId];
    const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat;
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
        total: Object.keys(agents).length,
        active: activeAgents.length,
        activeAgentIds: activeAgents
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
 * Global error handler
 */
app.use((error, req, res, _next) => {
  logger.logError(error, 'api-server');
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
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

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 TaskManager REST API Server`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 System status: http://localhost:${PORT}/api/status`);
  console.log(`📄 Available endpoints:`);
  console.log(`   GET    /api/tasks           - List tasks`);
  console.log(`   POST   /api/tasks           - Create task`);
  console.log(`   GET    /api/tasks/:id       - Get task details`);
  console.log(`   PUT    /api/tasks/:id/status - Update task status`);
  console.log(`   POST   /api/tasks/:id/claim - Claim task`);
  console.log(`   GET    /api/agents          - List agents`);
  console.log(`   POST   /api/agents/register - Register agent`);
  console.log(`   GET    /api/agents/:id/current-task - Get agent's task`);
  console.log(`   GET    /api/status          - System status`);
  console.log(`   GET    /api/stats           - Detailed statistics`);
  console.log(`   POST   /api/stop-hook/authorize - Authorize stop hook`);
  console.log(`   GET    /api/health          - Health check`);
  console.log(`   GET    /api/github/status   - GitHub API connection status`);
  console.log(`   GET    /api/github/repository - Repository information`);
  console.log(`   GET    /api/github/analytics - Repository analytics`);
  console.log(`   GET    /api/github/issues   - GitHub issues`);
  console.log(`   POST   /api/github/sync-task/:id - Sync task to GitHub`);
  console.log(`   PUT    /api/github/sync-task/:id/:issue - Update GitHub issue`);
  console.log(`   POST   /api/github/webhook  - GitHub webhook endpoint\n`);
  
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