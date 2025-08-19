/**
 * Authentication Module Unit Tests
 * 
 * Comprehensive test suite for agent authentication, authorization, and security features
 * including agent registration, stop hook authorization, and task claiming authentication.
 * 
 * Test Categories:
 * - Agent Registration & ID Generation
 * - Stop Hook Authorization & Expiration
 * - Agent Verification & Validation
 * - Security Edge Cases & Error Handling
 * - Concurrent Agent Management
 */

const fs = require('fs');
const path = require('path');
const TaskManager = require('../lib/taskManager');
const AgentManager = require('../lib/agentManager');

describe('Authentication Module', () => {
    let taskManager;
    let agentManager;
    let testTodoPath;
    let testProjectDir;

    beforeEach(async () => {
        // Create isolated test environment
        testProjectDir = path.join(__dirname, '.test-auth-' + Date.now());
        testTodoPath = path.join(testProjectDir, 'TODO.json');
        
        // Ensure test directory exists
        if (!fs.existsSync(testProjectDir)) {
            fs.mkdirSync(testProjectDir, { recursive: true });
        }
        
        // Initialize managers with test configuration
        taskManager = new TaskManager(testTodoPath, {
            enableMultiAgent: true,
            enableAutoFix: false,
            validateOnRead: false
        });
        
        agentManager = new AgentManager(testTodoPath, {
            maxConcurrentTasks: 3,
            agentTimeout: 5000, // 5 seconds for testing
            heartbeatInterval: 1000 // 1 second for testing
        });
        
        // Create minimal TODO.json structure  
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
                // Remove stop authorization flags
                const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
                if (fs.existsSync(stopFlagPath)) {
                    fs.unlinkSync(stopFlagPath);
                }
                
                // Remove TODO.json
                if (fs.existsSync(testTodoPath)) {
                    fs.unlinkSync(testTodoPath);
                }
                
                // Remove test directory
                fs.rmdirSync(testProjectDir);
            } catch {
                // Ignore cleanup errors in tests
            }
        }
    });

    describe('Agent Registration & Authentication', () => {
        test('should successfully register a new agent with valid configuration', async () => {
            const agentConfig = {
                role: 'development',
                name: 'Test Development Agent',
                specialization: ['testing', 'debugging'],
                sessionId: 'test-session-123'
            };

            const agentId = await agentManager.registerAgent(agentConfig);

            // Verify agent ID format and uniqueness (actual format: role_session_instance_specialization_hash)
            expect(agentId).toMatch(/^[a-z]+_[a-zA-Z0-9\-_]+_\d+_[a-z]+_[a-f0-9]{8}$/);
            
            // Read and verify agent was stored correctly
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            expect(todoData.agents).toHaveProperty(agentId);
            
            const agent = todoData.agents[agentId];
            expect(agent).toMatchObject({
                name: 'Test Development Agent',
                role: 'development',
                specialization: ['testing', 'debugging'],
                status: 'active',
                assignedTasks: [],
                sessionId: 'test-session-123'
            });
            
            expect(agent.capabilities).toContain('file-operations');
            expect(agent.capabilities).toContain('linting');
            expect(agent.capabilities).toContain('testing');
            expect(new Date(agent.createdAt)).toBeInstanceOf(Date);
        });

        test('should generate unique agent IDs for multiple agents', async () => {
            const agentIds = [];
            
            for (let i = 0; i < 5; i++) {
                const agentId = await agentManager.registerAgent({
                    role: 'development',
                    sessionId: `session-${i}`
                });
                agentIds.push(agentId);
            }

            // Verify all IDs are unique
            const uniqueIds = new Set(agentIds);
            expect(uniqueIds.size).toBe(5);
            
            // Verify all agents were registered
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            agentIds.forEach(agentId => {
                expect(todoData.agents).toHaveProperty(agentId);
            });
        });

        test('should handle agent registration with minimal configuration', async () => {
            const agentId = await agentManager.registerAgent({});

            expect(agentId).toMatch(/^[a-z]+_[a-zA-Z0-9\-_]+_\d+_[a-z]+_[a-f0-9]{8}$/);
            
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            const agent = todoData.agents[agentId];
            
            expect(agent.role).toBe('development'); // default role
            expect(agent.specialization).toEqual([]); // default empty array
            expect(agent.status).toBe('active');
        });

        test('should assign appropriate capabilities based on agent role', async () => {
            const roles = [
                { role: 'development', expectedCapabilities: ['file-operations', 'linting', 'testing'] },
                { role: 'testing', expectedCapabilities: ['test-creation', 'test-execution', 'coverage-analysis'] },
                { role: 'security', expectedCapabilities: ['vulnerability-scanning', 'auth-implementation', 'secure-coding'] }
            ];

            for (const { role, expectedCapabilities } of roles) {
                const agentId = await agentManager.registerAgent({ role });
                const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
                const agent = todoData.agents[agentId];
                
                expectedCapabilities.forEach(capability => {
                    expect(agent.capabilities).toContain(capability);
                });
            }
        });
    });

    describe('Stop Hook Authorization', () => {
        test('should create valid stop authorization flag', async () => {
            const agentId = 'agent_test_12345';
            const reason = 'Emergency stop for critical bug';
            
            const result = await taskManager.authorizeStopHook(agentId, reason);
            
            expect(result.success).toBe(true);
            expect(result.message).toBe('Stop authorization granted');
            expect(result.expires_in_seconds).toBe(30);
            expect(result.authorized_by).toBe(agentId);
            expect(result.reason).toBe(reason);
            
            // Verify stop flag file was created
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            expect(fs.existsSync(stopFlagPath)).toBe(true);
            
            // Verify flag contents
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            expect(flagData).toMatchObject({
                stop_allowed: true,
                single_use: true,
                authorized_by: agentId,
                reason: reason
            });
            
            expect(new Date(flagData.timestamp)).toBeInstanceOf(Date);
            expect(new Date(flagData.expires_at)).toBeInstanceOf(Date);
            
            // Verify expiration is approximately 30 seconds from now
            const expiresAt = new Date(flagData.expires_at);
            const now = new Date();
            const timeDiff = expiresAt.getTime() - now.getTime();
            expect(timeDiff).toBeGreaterThan(25000); // At least 25 seconds
            expect(timeDiff).toBeLessThan(35000); // At most 35 seconds
        });

        test('should handle authorization with default parameters', async () => {
            const result = await taskManager.authorizeStopHook();
            
            expect(result.success).toBe(true);
            expect(result.authorized_by).toBe('unknown');
            expect(result.reason).toBe('Agent-requested stop');
            
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            
            expect(flagData.authorized_by).toBe('unknown');
            expect(flagData.reason).toBe('Agent-requested stop');
        });

        test('should return error when file system operations fail', async () => {
            // Create a read-only directory to cause write failure
            const readOnlyDir = path.join(__dirname, '.test-readonly-' + Date.now());
            fs.mkdirSync(readOnlyDir);
            fs.chmodSync(readOnlyDir, 0o444); // Read-only
            
            const readOnlyTodoPath = path.join(readOnlyDir, 'TODO.json');
            const readOnlyTaskManager = new TaskManager(readOnlyTodoPath);
            
            const result = await readOnlyTaskManager.authorizeStopHook('test-agent', 'test-reason');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to create stop authorization');
            
            // Cleanup
            try {
                fs.chmodSync(readOnlyDir, 0o755);
                fs.rmdirSync(readOnlyDir);
            } catch {
                // Ignore cleanup errors
            }
        });

        test('should overwrite existing stop authorization flags', async () => {
            // Create first authorization
            const result1 = await taskManager.authorizeStopHook('agent1', 'First reason');
            expect(result1.success).toBe(true);
            
            // Create second authorization (should overwrite)
            const result2 = await taskManager.authorizeStopHook('agent2', 'Second reason');
            expect(result2.success).toBe(true);
            
            // Verify only the second authorization exists
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            
            expect(flagData.authorized_by).toBe('agent2');
            expect(flagData.reason).toBe('Second reason');
        });
    });

    describe('Agent Verification & Validation', () => {
        let registeredAgentId;

        beforeEach(async () => {
            registeredAgentId = await agentManager.registerAgent({
                role: 'development',
                name: 'Test Agent'
            });
        });

        test('should verify registered agent exists', async () => {
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            
            expect(todoData.agents).toHaveProperty(registeredAgentId);
            expect(todoData.agents[registeredAgentId].status).toBe('active');
        });

        test('should handle non-existent agent queries gracefully', async () => {
            const nonExistentAgentId = 'agent_nonexistent_12345';
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            
            expect(todoData.agents).not.toHaveProperty(nonExistentAgentId);
        });

        test('should track agent heartbeats and timestamps', async () => {
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            const agent = todoData.agents[registeredAgentId];
            
            expect(agent.lastHeartbeat).toBeDefined();
            expect(new Date(agent.lastHeartbeat)).toBeInstanceOf(Date);
            
            // Verify timestamp is recent (within last minute)
            const heartbeatTime = new Date(agent.lastHeartbeat);
            const now = new Date();
            const timeDiff = now.getTime() - heartbeatTime.getTime();
            expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
        });
    });

    describe('Security Edge Cases & Error Handling', () => {
        test('should handle corrupted TODO.json file gracefully', async () => {
            // Write invalid JSON to TODO.json
            fs.writeFileSync(testTodoPath, 'invalid json content {{{');
            
            // Registration should still work (creates new structure)
            const agentId = await agentManager.registerAgent({
                role: 'development'
            });
            
            expect(agentId).toMatch(/^[a-z]+_[a-zA-Z0-9\-_]+_\d+_[a-z]+_[a-f0-9]{8}$/);
            
            // Verify new valid TODO.json was created
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            expect(todoData.agents).toHaveProperty(agentId);
        });

        test('should prevent agent ID collision through crypto randomness', async () => {
            // Mock Math.random to return the same value
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.123456789);
            
            try {
                const agentId1 = await agentManager.registerAgent({ 
                    role: 'development',
                    sessionId: 'same-session'
                });
                
                // Even with same random number, timestamp difference should ensure uniqueness
                await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
                
                const agentId2 = await agentManager.registerAgent({ 
                    role: 'development',
                    sessionId: 'same-session'
                });
                
                expect(agentId1).not.toBe(agentId2);
            } finally {
                Math.random = originalRandom;
            }
        });

        test('should handle invalid agent configurations', async () => {
            const invalidConfigs = [
                { role: null },
                { role: 'invalid-role' },
                { specialization: 'not-an-array' }
            ];

            for (const config of invalidConfigs) {
                // Should not throw errors, but handle gracefully
                const agentId = await agentManager.registerAgent(config);
                expect(agentId).toMatch(/^[a-z]+_[a-zA-Z0-9\-_]+_\d+_[a-z]+_[a-f0-9]{8}$/);
                
                const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
                expect(todoData.agents).toHaveProperty(agentId);
            }
        });

        test('should validate stop authorization parameters', async () => {
            // Test with special characters in reason
            const specialReason = 'Emergency: SQL injection detected in @user_input #critical';
            const result = await taskManager.authorizeStopHook('agent_test', specialReason);
            
            expect(result.success).toBe(true);
            expect(result.reason).toBe(specialReason);
            
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            expect(flagData.reason).toBe(specialReason);
        });

        test('should handle concurrent agent registrations', async () => {
            const concurrentRegistrations = Array(10).fill().map((_, i) => 
                agentManager.registerAgent({
                    role: 'development',
                    sessionId: `concurrent-session-${i}`
                })
            );

            const agentIds = await Promise.all(concurrentRegistrations);
            
            // All registrations should succeed
            expect(agentIds.length).toBe(10);
            
            // All IDs should be unique
            const uniqueIds = new Set(agentIds);
            expect(uniqueIds.size).toBe(10);
            
            // All agents should be in TODO.json
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            agentIds.forEach(agentId => {
                expect(todoData.agents).toHaveProperty(agentId);
            });
        });
    });

    describe('Integration Tests', () => {
        test('should support full authentication workflow', async () => {
            // 1. Register agent
            const agentId = await agentManager.registerAgent({
                role: 'development',
                name: 'Integration Test Agent',
                sessionId: 'integration-test-session'
            });
            
            expect(agentId).toMatch(/^[a-z]+_[a-zA-Z0-9\-_]+_\d+_[a-z]+_[a-f0-9]{8}$/);
            
            // 2. Verify agent exists and is active
            let todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            expect(todoData.agents[agentId].status).toBe('active');
            
            // 3. Create task for agent to claim
            await taskManager.createTask({
                title: 'Test authentication task',
                category: 'enhancement',
                mode: 'DEVELOPMENT'
            });
            
            // 4. Authorize stop hook
            const stopResult = await taskManager.authorizeStopHook(agentId, 'Integration test stop');
            expect(stopResult.success).toBe(true);
            expect(stopResult.authorized_by).toBe(agentId);
            
            // 5. Verify stop flag exists and is valid
            const stopFlagPath = path.join(testProjectDir, '.stop-allowed');
            expect(fs.existsSync(stopFlagPath)).toBe(true);
            
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
            expect(flagData.stop_allowed).toBe(true);
            expect(flagData.authorized_by).toBe(agentId);
        });

        test('should maintain agent security across multiple operations', async () => {
            // Register multiple agents with different roles
            const agents = await Promise.all([
                agentManager.registerAgent({ role: 'development', name: 'Dev Agent' }),
                agentManager.registerAgent({ role: 'testing', name: 'Test Agent' }),
                agentManager.registerAgent({ role: 'security', name: 'Security Agent' })
            ]);
            
            // Each agent should have appropriate capabilities
            const todoData = JSON.parse(fs.readFileSync(testTodoPath, 'utf8'));
            
            expect(todoData.agents[agents[0]].capabilities).toContain('file-operations');
            expect(todoData.agents[agents[1]].capabilities).toContain('test-execution');
            expect(todoData.agents[agents[2]].capabilities).toContain('vulnerability-scanning');
            
            // Only the security agent should have auth-implementation capability
            expect(todoData.agents[agents[0]].capabilities).not.toContain('auth-implementation');
            expect(todoData.agents[agents[1]].capabilities).not.toContain('auth-implementation');
            expect(todoData.agents[agents[2]].capabilities).toContain('auth-implementation');
        });
    });
});