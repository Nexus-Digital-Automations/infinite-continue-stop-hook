const TaskManager = require('./lib/taskManager');
const _AgentManager = require('./lib/agentManager');
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');

async function debugMultiAgent() {
    console.log('🔍 Debugging multi-agent issues...');
    
    const todoPath = './TODO.json';
    
    // Test TaskManager createParallelExecution
    const taskManager = new TaskManager(todoPath, { 
        enableMultiAgent: true,
        enableAutoFix: false
    });
    
    try {
        console.log('\n1. Testing TaskManager.createParallelExecution...');
        
        const task1 = await taskManager.createTask({
            title: 'Debug Task 1',
            description: 'Debug task 1',
            mode: 'DEVELOPMENT'
        });
        
        const task2 = await taskManager.createTask({
            title: 'Debug Task 2',
            description: 'Debug task 2',
            mode: 'TESTING'
        });
        
        console.log(`Created tasks: ${task1}, ${task2}`);
        
        const parallelResult = await taskManager.createParallelExecution(
            [task1, task2],
            ['agent1', 'agent2'],
            ['sync_point_1']
        );
        
        console.log('Parallel result:', JSON.stringify(parallelResult, null, 2));
        
    } catch (error) {
        console.error('❌ TaskManager test failed:', error.message);
        console.error('Stack:', error.stack);
    }
    
    try {
        console.log('\n2. Testing MultiAgentOrchestrator...');
        
        const orchestrator = new MultiAgentOrchestrator(todoPath, {
            maxParallelAgents: 3,
            coordinationTimeout: 10000
        });
        
        // Test session initialization
        const sessionResult = await orchestrator.initializeSession([
            { role: 'development', specialization: ['build-fixes'] },
            { role: 'testing', specialization: ['unit-tests'] }
        ]);
        
        console.log('Session result:', JSON.stringify(sessionResult, null, 2));
        
        // Test task distribution
        const distributionResult = await orchestrator.orchestrateTaskDistribution({
            strategy: 'intelligent',
            maxTasks: 2
        });
        
        console.log('Distribution result:', JSON.stringify(distributionResult, null, 2));
        
    } catch (error) {
        console.error('❌ MultiAgentOrchestrator test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugMultiAgent().catch(console.error);