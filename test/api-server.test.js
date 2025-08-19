/**
 * API Server Test Suite
 * 
 * Comprehensive tests for the REST API server including all endpoints,
 * error handling, middleware, and integration with TaskManager system
 */

const request = require('supertest');

// Mock dependencies
jest.mock('../lib/taskManager');
jest.mock('../lib/agentRegistry');
jest.mock('../lib/logger');

const TaskManager = require('../lib/taskManager');
const AgentRegistry = require('../lib/agentRegistry');
const Logger = require('../lib/logger');

// Import app after mocking dependencies
let app;

describe('API Server', () => {
  let mockTaskManager;
  let mockAgentRegistry;
  let mockLogger;

  beforeAll(() => {
    // Setup mocks
    mockTaskManager = {
      readTodo: jest.fn(),
      createTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      claimTask: jest.fn(),
      getCurrentTask: jest.fn(),
      getTaskStatus: jest.fn(),
      authorizeStopHook: jest.fn()
    };

    mockAgentRegistry = {
      listAgents: jest.fn(),
      registerAgent: jest.fn()
    };

    mockLogger = {
      addFlow: jest.fn(),
      logError: jest.fn(),
      save: jest.fn()
    };

    // Mock constructors
    TaskManager.mockImplementation(() => mockTaskManager);
    AgentRegistry.mockImplementation(() => mockAgentRegistry);
    Logger.mockImplementation(() => mockLogger);

    // Import app after mocking
    app = require('../api-server');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoints', () => {
    test('GET /api/health should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          version: expect.any(String)
        }
      });
    });

    test('GET /api/status should return system status', async () => {
      mockTaskManager.getTaskStatus.mockResolvedValue({
        pending: 10,
        in_progress: 2,
        completed: 50,
        total: 62
      });

      mockAgentRegistry.listAgents.mockResolvedValue({
        'agent1': { lastHeartbeat: new Date().toISOString() },
        'agent2': { lastHeartbeat: new Date(Date.now() - 20 * 60 * 1000).toISOString() }
      });

      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          system: {
            status: 'operational',
            timestamp: expect.any(String)
          },
          tasks: {
            pending: 10,
            in_progress: 2,
            completed: 50,
            total: 62
          },
          agents: {
            total: 2,
            active: 1,
            activeAgentIds: ['agent1']
          }
        }
      });
    });
  });

  describe('Task Management Endpoints', () => {
    test('GET /api/tasks should list tasks with filtering', async () => {
      const mockTasks = [
        { id: 'task1', status: 'pending', category: 'bug' },
        { id: 'task2', status: 'completed', category: 'feature' }
      ];

      mockTaskManager.readTodo.mockResolvedValue({ tasks: mockTasks });

      const response = await request(app)
        .get('/api/tasks?status=pending')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: [{ id: 'task1', status: 'pending', category: 'bug' }],
          pagination: {
            total: 1,
            offset: 0,
            limit: 1,
            hasMore: false
          }
        }
      });
    });

    test('GET /api/tasks/:taskId should return specific task', async () => {
      const mockTask = { id: 'task1', title: 'Test Task', status: 'pending' };
      mockTaskManager.readTodo.mockResolvedValue({ tasks: [mockTask] });

      const response = await request(app)
        .get('/api/tasks/task1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { task: mockTask }
      });
    });

    test('GET /api/tasks/:taskId should return 404 for non-existent task', async () => {
      mockTaskManager.readTodo.mockResolvedValue({ tasks: [] });

      const response = await request(app)
        .get('/api/tasks/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Task not found',
        taskId: 'nonexistent'
      });
    });

    test('POST /api/tasks should create new task', async () => {
      mockTaskManager.createTask.mockResolvedValue('task123');

      const taskData = {
        title: 'New Task',
        category: 'bug',
        description: 'Fix important bug'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          taskId: 'task123',
          message: 'Task created successfully'
        }
      });

      expect(mockTaskManager.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Fix important bug',
        category: 'bug',
        priority: 'medium',
        mode: 'DEVELOPMENT',
        dependencies: [],
        important_files: [],
        success_criteria: [],
        estimate: '',
        requires_research: false,
        subtasks: []
      });
    });

    test('POST /api/tasks should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Missing Category' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Title and category are required',
        required: ['title', 'category']
      });
    });

    test('PUT /api/tasks/:taskId/status should update task status', async () => {
      mockTaskManager.updateTaskStatus.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/tasks/task1/status')
        .send({ status: 'completed', notes: 'Task finished' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          taskId: 'task1',
          status: 'completed',
          message: 'Task status updated successfully'
        }
      });

      expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
        'task1',
        'completed',
        'Task finished'
      );
    });

    test('PUT /api/tasks/:taskId/status should return 400 for missing status', async () => {
      const response = await request(app)
        .put('/api/tasks/task1/status')
        .send({ notes: 'Some notes' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Status is required',
        validStatuses: ['pending', 'in_progress', 'completed', 'blocked']
      });
    });

    test('POST /api/tasks/:taskId/claim should claim task for agent', async () => {
      const claimResult = {
        success: true,
        task: { id: 'task1', assignedAgent: 'agent1' },
        claimedAt: new Date().toISOString()
      };

      mockTaskManager.claimTask.mockResolvedValue(claimResult);

      const response = await request(app)
        .post('/api/tasks/task1/claim')
        .send({ agentId: 'agent1', priority: 'high' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: claimResult
      });

      expect(mockTaskManager.claimTask).toHaveBeenCalledWith('task1', 'agent1', 'high');
    });

    test('POST /api/tasks/:taskId/claim should return 400 for missing agent ID', async () => {
      const response = await request(app)
        .post('/api/tasks/task1/claim')
        .send({ priority: 'high' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Agent ID is required'
      });
    });
  });

  describe('Agent Management Endpoints', () => {
    test('GET /api/agents should list all agents', async () => {
      const mockAgents = {
        'agent1': { role: 'development', isActive: true },
        'agent2': { role: 'testing', isActive: false }
      };

      mockAgentRegistry.listAgents.mockResolvedValue(mockAgents);

      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { agents: mockAgents }
      });
    });

    test('POST /api/agents/register should register new agent', async () => {
      mockAgentRegistry.registerAgent.mockResolvedValue('agent123');

      const agentConfig = {
        role: 'development',
        specialization: ['frontend', 'react']
      };

      const response = await request(app)
        .post('/api/agents/register')
        .send(agentConfig)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          agentId: 'agent123',
          config: {
            role: 'development',
            sessionId: expect.any(String),
            specialization: ['frontend', 'react']
          },
          message: 'Agent registered successfully'
        }
      });
    });

    test('GET /api/agents/:agentId/current-task should return agent\'s current task', async () => {
      const mockTask = { id: 'task1', title: 'Current Task' };
      mockTaskManager.getCurrentTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/agents/agent1/current-task')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { task: mockTask }
      });
    });

    test('GET /api/agents/:agentId/current-task should handle no active task', async () => {
      mockTaskManager.getCurrentTask.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/agents/agent1/current-task')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          task: null,
          message: 'No active task for this agent'
        }
      });
    });
  });

  describe('Stop Hook Control Endpoints', () => {
    test('POST /api/stop-hook/authorize should authorize stop hook', async () => {
      const authResult = {
        success: true,
        authorized: true,
        expiresAt: new Date().toISOString()
      };

      mockTaskManager.authorizeStopHook.mockResolvedValue(authResult);

      const response = await request(app)
        .post('/api/stop-hook/authorize')
        .send({ agentId: 'agent1', reason: 'Maintenance required' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: authResult
      });

      expect(mockTaskManager.authorizeStopHook).toHaveBeenCalledWith(
        'agent1',
        'Maintenance required'
      );
    });

    test('POST /api/stop-hook/authorize should return 400 for missing agent ID', async () => {
      const response = await request(app)
        .post('/api/stop-hook/authorize')
        .send({ reason: 'Some reason' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Agent ID is required'
      });
    });
  });

  describe('Statistics Endpoints', () => {
    test('GET /api/stats should return detailed statistics', async () => {
      const mockTodoData = {
        tasks: [
          { status: 'pending', category: 'bug', priority: 'high' },
          { status: 'completed', category: 'feature', priority: 'medium', started_at: '2025-08-19T10:00:00Z', completed_at: '2025-08-19T11:00:00Z', actualTimeMinutes: 60 },
          { status: 'in_progress', category: 'bug', priority: 'low' }
        ],
        agents: {
          'agent1': {},
          'agent2': {}
        }
      };

      mockTaskManager.readTodo.mockResolvedValue(mockTodoData);

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: {
            total: 3,
            byStatus: {
              pending: 1,
              completed: 1,
              in_progress: 1
            },
            byCategory: {
              bug: 2,
              feature: 1
            },
            byPriority: {
              high: 1,
              medium: 1,
              low: 1
            },
            avgCompletionTime: 60
          },
          agents: {
            total: 2
          },
          performance: {
            tasksCompletedToday: expect.any(Number),
            tasksCompletedThisWeek: expect.any(Number),
            avgTasksPerDay: expect.any(Number)
          }
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Endpoint not found',
        path: '/api/nonexistent',
        method: 'GET'
      });
    });

    test('should handle internal server errors', async () => {
      mockTaskManager.readTodo.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/tasks')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Internal server error',
        message: 'Database connection failed',
        timestamp: expect.any(String)
      });
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // The exact error format may vary, but it should be a 400 error
      expect(response.status).toBe(400);
    });
  });

  describe('CORS and Middleware', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should accept JSON content type', async () => {
      mockTaskManager.createTask.mockResolvedValue('task123');

      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send({
          title: 'JSON Task',
          category: 'feature'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should accept URL-encoded form data', async () => {
      mockTaskManager.createTask.mockResolvedValue('task123');

      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('title=Form Task&category=feature')
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Pagination', () => {
    test('should handle pagination parameters correctly', async () => {
      const mockTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task${i}`,
        status: 'pending',
        category: 'feature'
      }));

      mockTaskManager.readTodo.mockResolvedValue({ tasks: mockTasks });

      const response = await request(app)
        .get('/api/tasks?limit=5&offset=10')
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(5);
      expect(response.body.data.pagination).toEqual({
        total: 20,
        offset: 10,
        limit: 5,
        hasMore: true
      });
    });

    test('should handle invalid pagination parameters', async () => {
      mockTaskManager.readTodo.mockResolvedValue({ tasks: [] });

      const response = await request(app)
        .get('/api/tasks?limit=invalid&offset=negative')
        .expect(200);

      expect(response.body.data.pagination.offset).toBe(0);
      expect(response.body.data.pagination.limit).toBe(0);
    });
  });
});

module.exports = {
  // Export for potential integration tests
};