#!/usr/bin/env node

/**
 * Agent Initialization Endpoint
 * 
 * This script handles agent initialization with automatic number assignment
 * and reuse of inactive agent slots after 2+ hours of inactivity.
 */

const AgentRegistry = require('./lib/agentRegistry');

async function initializeAgent(agentInfo = {}) {
    try {
        // Parse input if it's a JSON string
        if (typeof agentInfo === 'string') {
            agentInfo = JSON.parse(agentInfo);
        }
        
        const registry = new AgentRegistry();
        const result = await registry.initializeAgent(agentInfo);
        
        return result;
    } catch (error) {
        return {
            success: false,
            error: error.message,
            action: 'initialization_failed'
        };
    }
}

async function updateAgentActivity(agentId) {
    try {
        const registry = new AgentRegistry();
        const success = await registry.updateAgentActivity(agentId);
        
        return {
            success,
            agentId,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            agentId
        };
    }
}

async function getAgentInfo(agentId) {
    try {
        const registry = new AgentRegistry();
        const agent = registry.getAgent(agentId);
        
        if (agent) {
            const isActive = (Date.now() - agent.lastActivity) < (2 * 60 * 60 * 1000);
            return {
                success: true,
                agent: {
                    ...agent,
                    isActive,
                    inactiveFor: Date.now() - agent.lastActivity
                }
            };
        } else {
            return {
                success: false,
                error: 'Agent not found',
                agentId
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            agentId
        };
    }
}

async function getRegistryStats() {
    try {
        const registry = new AgentRegistry();
        const stats = registry.getRegistryStats();
        
        return {
            success: true,
            stats
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function getActiveAgents() {
    try {
        const registry = new AgentRegistry();
        const agents = registry.getActiveAgents();
        
        return {
            success: true,
            activeAgents: agents,
            count: agents.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Handle command line usage
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'init';
    
    let result;
    
    switch (command) {
        case 'init': {
            // Initialize agent with optional info
            const agentInfo = args[1] ? JSON.parse(args[1]) : {};
            result = await initializeAgent(agentInfo);
            break;
        }
            
        case 'update': {
            // Update agent activity
            const agentId = args[1];
            if (!agentId) {
                console.error('Error: Agent ID required for update command');
                process.exit(1);
            }
            result = await updateAgentActivity(agentId);
            break;
        }
            
        case 'info': {
            // Get agent info
            const targetAgentId = args[1];
            if (!targetAgentId) {
                console.error('Error: Agent ID required for info command');
                process.exit(1);
            }
            result = await getAgentInfo(targetAgentId);
            break;
        }
            
        case 'stats':
            // Get registry statistics
            result = await getRegistryStats();
            break;
            
        case 'active':
            // List active agents
            result = await getActiveAgents();
            break;
            
        default:
            console.error('Unknown command:', command);
            console.error('Available commands: init, update, info, stats, active');
            process.exit(1);
    }
    
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
}

// Export functions for use as module
module.exports = {
    initializeAgent,
    updateAgentActivity,
    getAgentInfo,
    getRegistryStats,
    getActiveAgents
};

// Run main if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}