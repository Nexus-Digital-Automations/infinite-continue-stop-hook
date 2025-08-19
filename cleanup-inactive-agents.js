const fs = require('fs');
const path = require('path');

/**
 * Clean up inactive agents from agent registry
 * Removes agents that haven't been active for more than 30 minutes
 */
async function cleanupInactiveAgents() {
    const registryPath = path.join(__dirname, 'agent-registry.json');
    
    if (!fs.existsSync(registryPath)) {
        console.log('Agent registry not found');
        return;
    }
    
    // Read current registry
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    console.log('🔍 Analyzing agent registry...');
    console.log('Current time:', new Date(now).toISOString());
    console.log('Inactive threshold:', inactiveThreshold / (60 * 1000), 'minutes');
    console.log('Total agents:', Object.keys(registryData.agents || {}).length);
    
    const activeAgents = {};
    const inactiveAgents = [];
    
    // Check each agent's last activity
    for (const [agentId, agent] of Object.entries(registryData.agents || {})) {
        const timeSinceActivity = now - (agent.lastActivity || 0);
        const isInactive = timeSinceActivity > inactiveThreshold;
        
        console.log(`Agent ${agentId}:`);
        console.log(`  - Last activity: ${new Date(agent.lastActivity || 0).toISOString()}`);
        console.log(`  - Time since activity: ${Math.round(timeSinceActivity / (60 * 1000))} minutes`);
        console.log(`  - Status: ${isInactive ? '🔴 INACTIVE' : '🟢 ACTIVE'}`);
        
        if (isInactive) {
            inactiveAgents.push({
                agentId,
                lastActivity: agent.lastActivity,
                timeSinceActivity: Math.round(timeSinceActivity / (60 * 1000))
            });
        } else {
            activeAgents[agentId] = agent;
        }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log('Active agents:', Object.keys(activeAgents).length);
    console.log('Inactive agents:', inactiveAgents.length);
    
    if (inactiveAgents.length === 0) {
        console.log('✅ No inactive agents to remove');
        return;
    }
    
    console.log('\n🧹 Removing inactive agents:');
    inactiveAgents.forEach(agent => {
        console.log(`  - ${agent.agentId} (inactive for ${agent.timeSinceActivity} minutes)`);
    });
    
    // Update registry
    const updatedRegistry = {
        ...registryData,
        agents: activeAgents,
        stats: {
            totalAgents: Object.keys(activeAgents).length,
            activeAgents: Object.keys(activeAgents).length,
            lastCleanup: new Date(now).toISOString()
        },
        lastCleanup: now
    };
    
    // Create backup before modifying
    const backupPath = `${registryPath}.backup.${now}`;
    fs.writeFileSync(backupPath, JSON.stringify(registryData, null, 2));
    console.log('📦 Created backup:', path.basename(backupPath));
    
    // Write updated registry
    fs.writeFileSync(registryPath, JSON.stringify(updatedRegistry, null, 2));
    
    console.log('✅ Agent registry cleaned up successfully');
    console.log('Removed:', inactiveAgents.length, 'inactive agents');
    console.log('Remaining:', Object.keys(activeAgents).length, 'active agents');
    
    return {
        removed: inactiveAgents.length,
        remaining: Object.keys(activeAgents).length,
        inactiveAgents: inactiveAgents.map(a => a.agentId)
    };
}

// Run cleanup if called directly
if (require.main === module) {
    cleanupInactiveAgents()
        .then(result => {
            if (result) {
                console.log('\n🎉 Cleanup completed:', result);
            }
        })
        .catch(error => {
            console.error('❌ Cleanup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { cleanupInactiveAgents };