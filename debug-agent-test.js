const fs = require('fs');
const AgentManager = require('./lib/agentManager');
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');

async function debugAgentRegistration() {
    console.log('🔍 Debugging agent registration and retrieval...');
    
    const testTodoPath = './debug-test-todo.json';
    
    // Create a clean test TODO file
    const initialData = {
        project: "debug-test",
        tasks: [],
        agents: {}
    };
    
    fs.writeFileSync(testTodoPath, JSON.stringify(initialData, null, 2));
    
    try {
        // Create managers
        const agentManager = new AgentManager(testTodoPath, {
            logger: { addFlow: () => {}, addError: () => {}, logError: () => {} }
        });
        
        const orchestrator = new MultiAgentOrchestrator(testTodoPath, {
            maxParallelAgents: 3
        });
        
        // Share the same agentManager instance (like in the test)
        orchestrator.agentManager = agentManager;
        
        console.log('🔧 Step 1: Initialize session with agents...');
        const sessionResult = await orchestrator.initializeSession([
            { role: 'development', specialization: ['build-fixes'] },
            { role: 'testing', specialization: ['unit-tests'] }
        ]);
        
        console.log('📊 Session result:', {
            totalRegistered: sessionResult.totalRegistered,
            totalFailed: sessionResult.totalFailed
        });
        
        // Check what's actually in the file after registration
        console.log('📂 Step 2: Check file contents after registration...');
        const fileContents = JSON.parse(fs.readFileSync(testTodoPath, 'utf-8'));
        console.log('Agents in file:', Object.keys(fileContents.agents).length);
        
        Object.entries(fileContents.agents).forEach(([id, agent]) => {
            console.log(`  - ${id}: role=${agent.role}, status=${agent.status}`);
        });
        
        console.log('🔍 Step 3: Call getActiveAgents() directly...');
        const activeAgents = await agentManager.getActiveAgents();
        console.log('Active agents found:', activeAgents.length);
        
        if (activeAgents.length === 0) {
            console.log('❌ ISSUE FOUND: Agents registered but getActiveAgents() returns 0');
            
            // Debug the getActiveAgents method step by step
            console.log('🕵️ Debugging getActiveAgents method...');
            const todoData = await agentManager.readTodo();
            console.log('  - readTodo() returned:', !!todoData);
            console.log('  - todoData.agents exists:', !!todoData.agents);
            console.log('  - Number of agents in todoData:', Object.keys(todoData.agents || {}).length);
            
            if (todoData.agents) {
                const agentEntries = Object.entries(todoData.agents);
                console.log('  - Agent entries:', agentEntries.length);
                
                agentEntries.forEach(([agentId, agent]) => {
                    console.log(`    * ${agentId}: status="${agent.status}" (${agent.status === 'active' ? 'ACTIVE' : 'NOT ACTIVE'})`);
                });
                
                const activeFiltered = agentEntries
                    .map(([agentId, agent]) => ({ agentId, ...agent }))
                    .filter(agent => agent.status === 'active');
                    
                console.log('  - Agents after filtering for active:', activeFiltered.length);
            }
        } else {
            console.log('✅ SUCCESS: Agents retrieved correctly');
        }
        
        console.log('🧪 Step 4: Test orchestrateTaskDistribution...');
        
        // Add some test tasks first
        const testData = {
            ...fileContents,
            tasks: [
                {
                    id: 'test-task-1',
                    title: 'Test Task',
                    mode: 'DEVELOPMENT',
                    status: 'pending'
                }
            ]
        };
        fs.writeFileSync(testTodoPath, JSON.stringify(testData, null, 2));
        
        const distributionResult = await orchestrator.orchestrateTaskDistribution({
            strategy: 'intelligent',
            maxTasks: 1
        });
        
        console.log('Distribution result:', {
            success: distributionResult.success,
            reason: distributionResult.reason,
            availableAgents: distributionResult.availableAgents
        });
        
    } finally {
        // Cleanup
        if (fs.existsSync(testTodoPath)) {
            fs.unlinkSync(testTodoPath);
        }
    }
}

debugAgentRegistration().catch(console.error);