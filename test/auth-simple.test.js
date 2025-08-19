/**
 * Simple Authentication Module Unit Tests
 * 
 * Focused test suite for core authentication functionality including
 * agent registration, stop hook authorization, and security validation.
 */

const fs = require('fs');
const path = require('path');
const TaskManager = require('../lib/taskManager');
const AgentManager = require('../lib/agentManager');

describe('Authentication Module - Core Functionality', () => {
    let testTodoPath;
    let testProjectDir;

    beforeEach(() => {
        // Create isolated test environment with unique timestamp
        testProjectDir = path.join(__dirname, `.test-auth-simple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        testTodoPath = path.join(testProjectDir, 'TODO.json');
        
        // Ensure test directory exists
        if (!fs.existsSync(testProjectDir)) {
            fs.mkdirSync(testProjectDir, { recursive: true });
        }
        
        // Create minimal TODO.json
        const initialTodo = {
            project: 'test-auth-project',
            tasks: [],
            agents: {}
        };
        fs.writeFileSync(testTodoPath, JSON.stringify(initialTodo, null, 2));
    });

    afterEach(() => {
        // Cleanup test environment
        if (fs.existsSync(testProjectDir)) {
            try {
                const files = fs.readdirSync(testProjectDir);
                files.forEach(file => {
                    const filePath = path.join(testProjectDir, file);
                    fs.unlinkSync(filePath);
                });
                fs.rmdirSync(testProjectDir);
            } catch {
                // Ignore cleanup errors
            }
        }
    });

    describe('Agent Registration', () => {
        test('should register agent and return valid agent ID', async () => {
            const agentManager = new AgentManager(testTodoPath);
            
            const agentConfig = {
                role: 'development',
                name: 'Test Agent',
                sessionId: 'test-session'
            };

            const agentId = await agentManager.registerAgent(agentConfig);

            // Verify agent ID exists and has expected format
            expect(agentId).toBeDefined();
            expect(typeof agentId).toBe('string');
            expect(agentId.length).toBeGreaterThan(10);
            
            // Verify agent was stored
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            expect(todoData.agents).toHaveProperty(agentId);
            
            const agent = todoData.agents[agentId];
            expect(agent.name).toBe('Test Agent');
            expect(agent.role).toBe('development');
            expect(agent.status).toBe('active');
        });

        test('should assign appropriate capabilities based on role', async () => {
            const agentManager = new AgentManager(testTodoPath);
            
            const devAgentId = await agentManager.registerAgent({ role: 'development' });
            const testAgentId = await agentManager.registerAgent({ role: 'testing' });
            const secAgentId = await agentManager.registerAgent({ role: 'security' });

            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            
            // Development agent should have development capabilities
            expect(todoData.agents[devAgentId].capabilities).toContain('file-operations');
            expect(todoData.agents[devAgentId].capabilities).toContain('linting');
            
            // Testing agent should have testing capabilities
            expect(todoData.agents[testAgentId].capabilities).toContain('test-creation');
            expect(todoData.agents[testAgentId].capabilities).toContain('test-execution');
            
            // Security agent should have security capabilities
            expect(todoData.agents[secAgentId].capabilities).toContain('vulnerability-scanning');
            expect(todoData.agents[secAgentId].capabilities).toContain('auth-implementation');
        });

        test('should generate unique agent IDs', async () => {
            const agentManager = new AgentManager(testTodoPath);
            
            const agentIds = [];
            for (let i = 0; i < 3; i++) {
                const agentId = await agentManager.registerAgent({
                    role: 'development',
                    sessionId: `session-${i}`
                });
                agentIds.push(agentId);
            }

            // All IDs should be unique
            const uniqueIds = new Set(agentIds);
            expect(uniqueIds.size).toBe(3);
        });
    });

    describe('Stop Hook Authorization', () => {
        test('should create stop authorization flag', async () => {
            const taskManager = new TaskManager(testTodoPath);
            
            const result = await taskManager.authorizeStopHook('test-agent', 'test-reason');
            
            expect(result.success).toBe(true);
            expect(result.authorized_by).toBe('test-agent');
            expect(result.reason).toBe('test-reason');
            expect(result.expires_in_seconds).toBe(30);
            
            // Verify flag file was created
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            expect(fs.existsSync(stopFlagPath)).toBe(true);
            
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            expect(flagData.stop_allowed).toBe(true);
            expect(flagData.authorized_by).toBe('test-agent');
        });

        test('should handle default parameters', async () => {
            const taskManager = new TaskManager(testTodoPath);
            
            const result = await taskManager.authorizeStopHook();
            
            expect(result.success).toBe(true);
            expect(result.authorized_by).toBe('unknown');
            expect(result.reason).toBe('Agent-requested stop');
        });

        test('should set expiration time correctly', async () => {
            const taskManager = new TaskManager(testTodoPath);
            
            const beforeTime = new Date();
            await taskManager.authorizeStopHook('test-agent', 'test-reason');
            const afterTime = new Date();
            
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            
            const expiresAt = new Date(flagData.expires_at);
            const timestamp = new Date(flagData.timestamp);
            
            // Timestamp should be recent
            expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
            
            // Expiration should be approximately 30 seconds after timestamp
            const timeDiff = expiresAt.getTime() - timestamp.getTime();
            expect(timeDiff).toBeGreaterThan(29000); // At least 29 seconds
            expect(timeDiff).toBeLessThan(31000); // At most 31 seconds
        });
    });

    describe('Security Validation', () => {
        test('should handle special characters in authorization reason', async () => {
            const taskManager = new TaskManager(testTodoPath);
            
            const specialReason = 'Emergency: SQL injection detected @user_input #critical';
            const result = await taskManager.authorizeStopHook('agent', specialReason);
            
            expect(result.success).toBe(true);
            expect(result.reason).toBe(specialReason);
            
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            expect(flagData.reason).toBe(specialReason);
        });

        test('should overwrite existing authorization flags', async () => {
            const taskManager = new TaskManager(testTodoPath);
            
            // Create first authorization
            await taskManager.authorizeStopHook('agent1', 'First reason');
            
            // Create second authorization
            await taskManager.authorizeStopHook('agent2', 'Second reason');
            
            // Only second authorization should exist
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            
            expect(flagData.authorized_by).toBe('agent2');
            expect(flagData.reason).toBe('Second reason');
        });

        test('should handle missing TODO.json gracefully during agent registration', async () => {
            // Remove TODO.json to test error handling
            fs.unlinkSync(testTodoPath);
            
            const agentManager = new AgentManager(testTodoPath);
            
            // Should still work by creating new structure
            const agentId = await agentManager.registerAgent({ role: 'development' });
            
            expect(agentId).toBeDefined();
            expect(typeof agentId).toBe('string');
            
            // Verify new TODO.json was created
            expect(fs.existsSync(testTodoPath)).toBe(true);
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            expect(todoData.agents).toHaveProperty(agentId);
        });
    });

    describe('Integration', () => {
        test('should support complete authentication workflow', async () => {
            const agentManager = new AgentManager(testTodoPath);
            const taskManager = new TaskManager(testTodoPath);
            
            // 1. Register agent
            const agentId = await agentManager.registerAgent({
                role: 'development',
                name: 'Integration Agent'
            });
            
            expect(agentId).toBeDefined();
            
            // 2. Verify agent in system
            let todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            expect(todoData.agents[agentId].status).toBe('active');
            
            // 3. Authorize stop
            const stopResult = await taskManager.authorizeStopHook(agentId, 'Integration test');
            expect(stopResult.success).toBe(true);
            expect(stopResult.authorized_by).toBe(agentId);
            
            // 4. Verify stop flag
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            expect(fs.existsSync(stopFlagPath)).toBe(true);
        });
    });
});