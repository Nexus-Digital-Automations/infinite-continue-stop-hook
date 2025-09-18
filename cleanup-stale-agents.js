#!/usr/bin/env node

/**
 * Stale Agent Cleanup Script
 * Cleans up stale agents from bytebot project TODO.json
 */

const fs = require('fs');
const path = require('path');

const BYTEBOT_TODO_PATH = '/Users/jeremyparker/Desktop/Claude Coding Projects/AIgent/bytebot/TODO.json';
const STALE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

console.log('🧹 Starting stale agent cleanup for bytebot project...');

try {
  // Read TODO.json
  const todoData = JSON.parse(fs.readFileSync(BYTEBOT_TODO_PATH, 'utf8'));
  
  let cleanupCount = 0;
  const now = new Date().toISOString();
  
  // Process each task
  for (const task of todoData.tasks) {
    if (!task || typeof task !== 'object') continue;
    
    // Check if task is in_progress and has assigned agent
    if (task.status === 'in_progress' && (task.assigned_agent || task.claimed_by)) {
      const startedAt = task.started_at ? new Date(task.started_at) : null;
      const timeSinceStart = startedAt ? Date.now() - startedAt.getTime() : Infinity;
      
      // If task has been in_progress for more than 15 minutes, it's stale
      if (timeSinceStart > STALE_TIMEOUT) {
        console.log(`🔄 Cleaning up stale task: ${task.title}`);
        console.log(`   Agent: ${task.assigned_agent || task.claimed_by}`);
        console.log(`   Time since start: ${Math.round(timeSinceStart / 60000)} minutes`);
        
        const staleAgent = task.assigned_agent || task.claimed_by;
        
        // Reset task to pending
        task.status = 'pending';
        task.assigned_agent = null;
        task.claimed_by = null;
        task.started_at = null;
        
        // Add stale cleanup entry to history
        if (!task.agent_assignment_history) {
          task.agent_assignment_history = [];
        }
        
        task.agent_assignment_history.push({
          agent: staleAgent,
          action: 'auto_unassign_stale',
          timestamp: now,
          reason: `Agent became stale (inactive >${Math.round(timeSinceStart / 60000)} minutes)`
        });
        
        cleanupCount++;
      }
    }
  }
  
  // Write back if any changes were made
  if (cleanupCount > 0) {
    fs.writeFileSync(BYTEBOT_TODO_PATH, JSON.stringify(todoData, null, 2));
    console.log(`✅ Cleanup complete! Fixed ${cleanupCount} stale tasks.`);
  } else {
    console.log('✅ No stale agents found - all tasks are clean!');
  }
  
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}