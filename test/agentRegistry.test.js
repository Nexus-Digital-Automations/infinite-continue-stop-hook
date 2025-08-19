const fs = require('fs');
const path = require('path');
const os = require('os');
const AgentRegistry = require('../lib/agentRegistry');

describe('AgentRegistry', () => {
    let registry;
    let testRegistryPath;

    beforeEach(() => {
        // Create temporary registry file
        testRegistryPath = path.join(os.tmpdir(), `test-registry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`);
        
        // Temporarily disable filesystem protection for registry tests
        process.env.DISABLE_FS_PROTECTION = 'true';
        
        registry = new AgentRegistry(testRegistryPath);
    });

    afterEach(() => {
        // Cleanup registry file
        if (fs.existsSync(testRegistryPath)) {
            fs.unlinkSync(testRegistryPath);
        }
        const lockFile = testRegistryPath + '.lock';
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
    });

    describe('Initialization', () => {
        test('should initialize registry file if it does not exist', () => {
            expect(fs.existsSync(testRegistryPath)).toBe(true);
            
            const content = JSON.parse(fs.readFileSync(testRegistryPath, 'utf8'));
            expect(content.agents).toEqual({});
            expect(content.nextAgentNumber).toBe(1);
            expect(content.lastCleanup).toBeDefined();
            expect(content.metadata).toBeDefined();
            expect(content.metadata.version).toBe('1.0.0');
        });

        test('should use existing registry file if it exists', () => {
            const existingData = {
                agents: { agent_1: { agentId: 'agent_1' } },
                nextAgentNumber: 5,
                lastCleanup: Date.now(),
                metadata: { created: '2023-01-01T00:00:00.000Z', version: '1.0.0' }
            };
            
            fs.writeFileSync(testRegistryPath, JSON.stringify(existingData));
            
            const newRegistry = new AgentRegistry(testRegistryPath);
            const content = newRegistry.readRegistry();
            
            expect(content.nextAgentNumber).toBe(5);
            expect(content.agents.agent_1).toBeDefined();
        });

        test('should set default inactivity timeout', () => {
            expect(registry.inactivityTimeout).toBe(2 * 60 * 60 * 1000); // 2 hours
        });

        test('should set default lock timeout', () => {
            expect(registry.lockTimeout).toBe(5000); // 5 seconds
        });
    });

    describe('Agent Initialization', () => {
        test('should assign new agent number for first agent', async () => {
            const result = await registry.initializeAgent({
                sessionId: 'session123',
                role: 'development'
            });

            expect(result.success).toBe(true);
            expect(result.action).toBe('assigned_new_number');
            expect(result.agentId).toBe('agent_1');
            expect(result.agentNumber).toBe(1);
            expect(result.sessionId).toBe('session123');
            expect(result.totalRequests).toBe(1);
        });

        test('should increment agent numbers for subsequent agents', async () => {
            await registry.initializeAgent({ sessionId: 'session1' });
            const result2 = await registry.initializeAgent({ sessionId: 'session2' });

            expect(result2.agentId).toBe('agent_2');
            expect(result2.agentNumber).toBe(2);
        });

        test('should reuse existing agent for same session', async () => {
            const result1 = await registry.initializeAgent({ sessionId: 'session123' });
            const result2 = await registry.initializeAgent({ sessionId: 'session123' });

            expect(result2.success).toBe(true);
            expect(result2.action).toBe('reused_existing');
            expect(result2.agentId).toBe(result1.agentId);
            expect(result2.totalRequests).toBe(2);
        });

        test('should generate session ID if not provided', async () => {
            const result = await registry.initializeAgent({ role: 'testing' });

            expect(result.success).toBe(true);
            expect(result.sessionId).toMatch(/^session_\d+_[a-f0-9]{8}$/);
        });

        test('should reuse inactive agent slot', async () => {
            // Create an agent and make it inactive by setting old timestamp
            const registryData = registry.readRegistry();
            registryData.agents.agent_1 = {
                agentId: 'agent_1',
                agentNumber: 1,
                sessionId: 'old_session',
                lastActivity: Date.now() - (3 * 60 * 60 * 1000), // 3 hours ago
                status: 'inactive'
            };
            registryData.nextAgentNumber = 2;
            registry.writeRegistry(registryData);

            const result = await registry.initializeAgent({ sessionId: 'new_session' });

            expect(result.success).toBe(true);
            expect(result.action).toBe('reused_inactive_slot');
            expect(result.agentId).toBe('agent_1');
            expect(result.agentNumber).toBe(1);
            expect(result.sessionId).toBe('new_session');
            expect(result.previousAgent).toBeDefined();
            expect(result.previousAgent.sessionId).toBe('old_session');
        });

        test('should store agent metadata and capabilities', async () => {
            const agentInfo = {
                sessionId: 'session123',
                role: 'development',
                specialization: ['frontend', 'testing'],
                capabilities: ['jest', 'react'],
                metadata: { team: 'alpha', priority: 'high' }
            };

            const result = await registry.initializeAgent(agentInfo);
            const agent = registry.getAgent(result.agentId);

            expect(agent.role).toBe('development');
            expect(agent.specialization).toEqual(['frontend', 'testing']);
            expect(agent.capabilities).toEqual(['jest', 'react']);
            expect(agent.metadata.team).toBe('alpha');
        });
    });

    describe('Agent Activity Tracking', () => {
        test('should update agent activity successfully', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            const initialActivity = registry.getAgent(result.agentId).lastActivity;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            const updateResult = await registry.updateAgentActivity(result.agentId);
            expect(updateResult).toBe(true);

            const agent = registry.getAgent(result.agentId);
            expect(agent.lastActivity).toBeGreaterThan(initialActivity);
            expect(agent.totalRequests).toBe(2);
        });

        test('should fail to update activity for non-existent agent', async () => {
            const updateResult = await registry.updateAgentActivity('agent_999');
            expect(updateResult).toBe(false);
        });

        test('should increment total requests on activity update', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            
            await registry.updateAgentActivity(result.agentId);
            await registry.updateAgentActivity(result.agentId);
            
            const agent = registry.getAgent(result.agentId);
            expect(agent.totalRequests).toBe(3); // 1 from init + 2 from updates
        });
    });

    describe('Agent Retrieval', () => {
        test('should get agent information', async () => {
            const result = await registry.initializeAgent({
                sessionId: 'session123',
                role: 'testing'
            });

            const agent = registry.getAgent(result.agentId);
            expect(agent).toBeDefined();
            expect(agent.agentId).toBe(result.agentId);
            expect(agent.sessionId).toBe('session123');
            expect(agent.role).toBe('testing');
        });

        test('should return null for non-existent agent', () => {
            const agent = registry.getAgent('agent_999');
            expect(agent).toBeNull();
        });

        test('should list active agents only', async () => {
            // Create active agent
            await registry.initializeAgent({ sessionId: 'active_session' });

            // Create inactive agent manually
            const registryData = registry.readRegistry();
            registryData.agents.agent_2 = {
                agentId: 'agent_2',
                sessionId: 'inactive_session',
                lastActivity: Date.now() - (3 * 60 * 60 * 1000) // 3 hours ago
            };
            registry.writeRegistry(registryData);

            const activeAgents = registry.getActiveAgents();
            expect(activeAgents).toHaveLength(1);
            expect(activeAgents[0].sessionId).toBe('active_session');
        });

        test('should list all agents', async () => {
            await registry.initializeAgent({ sessionId: 'session1' });
            await registry.initializeAgent({ sessionId: 'session2' });

            const allAgents = registry.getAllAgents();
            expect(allAgents).toHaveLength(2);
        });
    });

    describe('Registry Statistics', () => {
        test('should provide accurate registry statistics', async () => {
            const initialStats = registry.getRegistryStats();
            expect(initialStats.totalAgents).toBe(0);
            expect(initialStats.activeAgents).toBe(0);
            expect(initialStats.nextAgentNumber).toBe(1);

            await registry.initializeAgent({ sessionId: 'session1' });
            await registry.initializeAgent({ sessionId: 'session2' });

            const stats = registry.getRegistryStats();
            expect(stats.totalAgents).toBe(2);
            expect(stats.activeAgents).toBe(2);
            expect(stats.inactiveAgents).toBe(0);
            expect(stats.nextAgentNumber).toBe(3);
            expect(stats.registrySize).toBeGreaterThan(0);
        });

        test('should differentiate between active and inactive agents', async () => {
            await registry.initializeAgent({ sessionId: 'active_session' });

            // Add inactive agent manually
            const registryData = registry.readRegistry();
            registryData.agents.agent_2 = {
                agentId: 'agent_2',
                sessionId: 'inactive_session',
                lastActivity: Date.now() - (3 * 60 * 60 * 1000)
            };
            registry.writeRegistry(registryData);

            const stats = registry.getRegistryStats();
            expect(stats.totalAgents).toBe(2);
            expect(stats.activeAgents).toBe(1);
            expect(stats.inactiveAgents).toBe(1);
        });

        test('should return registry file size', () => {
            const stats = registry.getRegistryStats();
            expect(stats.registrySize).toBeGreaterThan(0);
        });
    });

    describe('Cleanup Operations', () => {
        test('should mark agents as inactive after timeout', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            
            // Manually set old activity time and trigger cleanup
            const registryData = registry.readRegistry();
            registryData.agents[result.agentId].lastActivity = Date.now() - (3 * 60 * 60 * 1000);
            registryData.lastCleanup = Date.now() - (31 * 60 * 1000); // Force cleanup
            registry.writeRegistry(registryData);

            await registry.cleanupInactiveAgents(registryData);
            
            const agent = registry.getAgent(result.agentId);
            expect(agent.status).toBe('inactive');
            expect(agent.inactiveSince).toBeDefined();
        });

        test('should not run cleanup too frequently', async () => {
            const registryData = registry.readRegistry();
            const originalCleanupTime = registryData.lastCleanup;

            await registry.cleanupInactiveAgents(registryData);
            
            // Should not update cleanup time if run too soon
            expect(registryData.lastCleanup).toBe(originalCleanupTime);
        });

        test('should only mark truly inactive agents', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            
            const registryData = registry.readRegistry();
            registryData.lastCleanup = Date.now() - (31 * 60 * 1000); // Force cleanup
            
            await registry.cleanupInactiveAgents(registryData);
            
            const agent = registry.getAgent(result.agentId);
            expect(agent.status).toBe('active'); // Should still be active
        });
    });

    describe('Agent Entry Creation', () => {
        test('should create proper agent entry with defaults', () => {
            const entry = registry.createAgentEntry(1, {});
            
            expect(entry.agentId).toBe('agent_1');
            expect(entry.agentNumber).toBe(1);
            expect(entry.sessionId).toMatch(/^session_\d+_[a-f0-9]{8}$/);
            expect(entry.role).toBe('development');
            expect(entry.specialization).toEqual([]);
            expect(entry.status).toBe('active');
            expect(entry.totalRequests).toBe(1);
            expect(entry.createdAt).toBeDefined();
            expect(entry.lastActivity).toBeDefined();
        });

        test('should create agent entry with provided information', () => {
            const agentInfo = {
                sessionId: 'custom_session',
                role: 'testing',
                specialization: ['unit-tests', 'integration'],
                capabilities: ['jest', 'mocha'],
                metadata: { priority: 'high' }
            };

            const entry = registry.createAgentEntry(5, agentInfo);
            
            expect(entry.agentId).toBe('agent_5');
            expect(entry.agentNumber).toBe(5);
            expect(entry.sessionId).toBe('custom_session');
            expect(entry.role).toBe('testing');
            expect(entry.specialization).toEqual(['unit-tests', 'integration']);
            expect(entry.capabilities).toEqual(['jest', 'mocha']);
            expect(entry.metadata.priority).toBe('high');
        });
    });

    describe('Agent Finding and Reuse', () => {
        test('should find existing agent by session ID', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            
            const registryData = registry.readRegistry();
            const existingAgent = registry.findExistingAgent(registryData, 'session123');
            
            expect(existingAgent).toBeDefined();
            expect(existingAgent.agentId).toBe(result.agentId);
            expect(existingAgent.sessionId).toBe('session123');
        });

        test('should not find inactive agent by session ID', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            
            // Make agent inactive
            const registryData = registry.readRegistry();
            registryData.agents[result.agentId].lastActivity = Date.now() - (3 * 60 * 60 * 1000);
            registry.writeRegistry(registryData);

            const refreshedData = registry.readRegistry();
            const existingAgent = registry.findExistingAgent(refreshedData, 'session123');
            
            expect(existingAgent).toBeUndefined();
        });

        test('should return null when finding agent without session ID', () => {
            const registryData = registry.readRegistry();
            const existingAgent = registry.findExistingAgent(registryData, null);
            
            expect(existingAgent).toBeNull();
        });

        test('should find reusable inactive slot', async () => {
            const result = await registry.initializeAgent({ sessionId: 'session123' });
            
            // Make agent inactive
            const registryData = registry.readRegistry();
            registryData.agents[result.agentId].lastActivity = Date.now() - (3 * 60 * 60 * 1000);
            registry.writeRegistry(registryData);

            const refreshedData = registry.readRegistry();
            const reusableSlot = registry.findReusableSlot(refreshedData);
            
            expect(reusableSlot).toBeDefined();
            expect(reusableSlot.agentId).toBe(result.agentId);
        });

        test('should not find reusable slot when all agents are active', async () => {
            await registry.initializeAgent({ sessionId: 'session123' });
            
            const registryData = registry.readRegistry();
            const reusableSlot = registry.findReusableSlot(registryData);
            
            expect(reusableSlot).toBeUndefined();
        });
    });

    describe('File Operations and Locking', () => {
        test('should execute function with file lock', async () => {
            let executionCount = 0;
            
            const testFunction = async () => {
                executionCount++;
                await new Promise(resolve => setTimeout(resolve, 50));
                return executionCount;
            };

            const result = await registry.withFileLock(testFunction);
            expect(result).toBe(1);
            expect(executionCount).toBe(1);
        });

        test('should handle concurrent operations with file locking', async () => {
            let executionOrder = [];
            
            const createTestFunction = (id) => async () => {
                executionOrder.push(`start-${id}`);
                await new Promise(resolve => setTimeout(resolve, 50));
                executionOrder.push(`end-${id}`);
                return id;
            };

            const promises = [
                registry.withFileLock(createTestFunction('A')),
                registry.withFileLock(createTestFunction('B')),
                registry.withFileLock(createTestFunction('C'))
            ];

            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(3);
            expect(results).toContain('A');
            expect(results).toContain('B');
            expect(results).toContain('C');
            
            // Operations should be serialized
            expect(executionOrder).toHaveLength(6);
        });

        test('should timeout on lock acquisition', async () => {
            // Create a lock file manually
            const lockFile = testRegistryPath + '.lock';
            fs.writeFileSync(lockFile, Date.now().toString());

            const shortTimeoutRegistry = new AgentRegistry(testRegistryPath);
            shortTimeoutRegistry.lockTimeout = 100; // 100ms timeout

            await expect(
                shortTimeoutRegistry.withFileLock(async () => 'should not execute')
            ).rejects.toThrow('Registry lock timeout');

            // Cleanup
            fs.unlinkSync(lockFile);
        });

        test('should properly read and write registry', () => {
            const testData = {
                agents: { agent_1: { agentId: 'agent_1' } },
                nextAgentNumber: 2,
                lastCleanup: Date.now(),
                metadata: { version: '1.0.0' }
            };

            registry.writeRegistry(testData);
            const readData = registry.readRegistry();

            expect(readData).toEqual(testData);
        });

        test('should handle file read errors', () => {
            fs.unlinkSync(testRegistryPath);
            
            expect(() => registry.readRegistry()).toThrow('Failed to read agent registry');
        });

        test('should handle file write errors', () => {
            // Make directory read-only to cause write error
            const invalidPath = '/invalid/readonly/path.json';
            const invalidRegistry = new AgentRegistry(invalidPath);
            
            expect(() => invalidRegistry.writeRegistry({})).toThrow('Failed to write agent registry');
        });

        test('should get file size correctly', async () => {
            await registry.initializeAgent({ sessionId: 'session123' });
            
            const size = registry.getFileSize();
            expect(size).toBeGreaterThan(0);
        });

        test('should return 0 size for non-existent file', () => {
            fs.unlinkSync(testRegistryPath);
            
            const size = registry.getFileSize();
            expect(size).toBe(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle concurrent agent initialization', async () => {
            const promises = Array.from({ length: 5 }, (_, i) => 
                registry.initializeAgent({ sessionId: `session_${i}` })
            );

            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(5);
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.agentNumber).toBe(index + 1);
                expect(result.sessionId).toBe(`session_${index}`);
            });
        });

        test('should handle corrupted registry file', () => {
            fs.writeFileSync(testRegistryPath, 'invalid json content');
            
            expect(() => registry.readRegistry()).toThrow();
        });

        test('should handle empty agent info', async () => {
            const result = await registry.initializeAgent();
            
            expect(result.success).toBe(true);
            expect(result.agentId).toBe('agent_1');
            expect(result.sessionId).toMatch(/^session_\d+_[a-f0-9]{8}$/);
        });

        test('should handle very long session IDs', async () => {
            const longSessionId = 'session_' + 'x'.repeat(1000);
            const result = await registry.initializeAgent({ sessionId: longSessionId });
            
            expect(result.success).toBe(true);
            expect(result.sessionId).toBe(longSessionId);
        });

        test('should handle special characters in session IDs', async () => {
            const specialSessionId = 'session_!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
            const result = await registry.initializeAgent({ sessionId: specialSessionId });
            
            expect(result.success).toBe(true);
            expect(result.sessionId).toBe(specialSessionId);
        });
    });
});