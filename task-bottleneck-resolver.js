#!/usr/bin/env node

/**
 * Task Assignment Bottleneck Resolver
 * 
 * Identifies and resolves common task assignment bottlenecks in the TaskManager system:
 * 1. Tasks in progress without started_at timestamps
 * 2. Stale tasks that should be reset to pending
 * 3. Circular dependencies
 * 4. Orphaned dependency references
 * 5. Priority queue conflicts
 */

const TaskManager = require('./lib/taskManager');

class TaskBottleneckResolver {
  constructor(todoPath = './TODO.json') {
    this.taskManager = new TaskManager(todoPath);
    this.issues = [];
    this.fixes = [];
  }

  /**
   * Analyze the task system for bottlenecks
   */
  async analyze() {
    console.log('🔍 Analyzing task system for bottlenecks...\n');
    
    const todoData = await this.taskManager.readTodo();
    const tasks = todoData.tasks || [];
    
    // Issue 1: Tasks in progress without started_at
    await this.checkMissingStartTimes(tasks);
    
    // Issue 2: Stale tasks that should be reset
    await this.checkStaleTasks(tasks);
    
    // Issue 3: Circular dependencies
    await this.checkCircularDependencies(tasks);
    
    // Issue 4: Orphaned dependencies
    await this.checkOrphanedDependencies(tasks);
    
    // Issue 5: Priority queue analysis
    await this.analyzePriorityQueue(tasks);
    
    this.displayResults();
    return { issues: this.issues, fixes: this.fixes };
  }

  /**
   * Check for tasks in progress without started_at timestamps
   */
  async checkMissingStartTimes(tasks) {
    const missingStartTime = tasks.filter(t => 
      t.status === 'in_progress' && !t.started_at
    );
    
    if (missingStartTime.length > 0) {
      this.issues.push({
        type: 'missing_start_time',
        severity: 'high',
        count: missingStartTime.length,
        description: 'Tasks in progress without start timestamps cannot be detected as stale',
        tasks: missingStartTime.map(t => ({ id: t.id, title: t.title, agent: t.assigned_agent }))
      });
      
      // Auto-fix: Set started_at to current time for tasks in progress
      for (const task of missingStartTime) {
        this.fixes.push({
          type: 'fix_start_time',
          taskId: task.id,
          action: 'Set started_at timestamp',
          implementation: async () => {
            task.started_at = new Date().toISOString();
            console.log(`✅ Fixed start time for task ${task.id}`);
          }
        });
      }
    }
  }

  /**
   * Check for tasks that should be reset as stale
   */
  async checkStaleTasks(tasks) {
    const staleThreshold = 15 * 60 * 1000; // 15 minutes
    const now = Date.now();
    
    const staleTasks = tasks.filter(t => {
      if (t.status !== 'in_progress' || !t.started_at) return false;
      
      const startTime = new Date(t.started_at).getTime();
      const age = now - startTime;
      return age > staleThreshold;
    });
    
    if (staleTasks.length > 0) {
      this.issues.push({
        type: 'stale_tasks',
        severity: 'medium',
        count: staleTasks.length,
        description: 'Tasks stuck in progress for >15 minutes should be reset to pending',
        tasks: staleTasks.map(t => ({
          id: t.id,
          title: t.title,
          agent: t.assigned_agent,
          ageMinutes: Math.floor((now - new Date(t.started_at).getTime()) / 60000)
        }))
      });
      
      // Auto-fix: Reset stale tasks to pending
      for (const task of staleTasks) {
        this.fixes.push({
          type: 'reset_stale_task',
          taskId: task.id,
          action: 'Reset to pending status',
          implementation: async () => {
            task.status = 'pending';
            task.assigned_agent = null;
            task.claimed_by = null;
            task.started_at = null;
            
            if (!task.agent_assignment_history) task.agent_assignment_history = [];
            task.agent_assignment_history.push({
              agent: 'system',
              action: 'auto_reset_stale',
              timestamp: new Date().toISOString(),
              reason: `Task stale for ${Math.floor((now - new Date(task.started_at).getTime()) / 60000)} minutes`
            });
            
            console.log(`✅ Reset stale task ${task.id} to pending`);
          }
        });
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  async checkCircularDependencies(tasks) {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set();
    const recursionStack = new Set();
    const circularDeps = [];
    
    function hasCycle(taskId, path = []) {
      if (recursionStack.has(taskId)) {
        // Found cycle
        const cycleStart = path.indexOf(taskId);
        const cycle = path.slice(cycleStart).concat([taskId]);
        circularDeps.push(cycle);
        return true;
      }
      
      if (visited.has(taskId)) return false;
      
      visited.add(taskId);
      recursionStack.add(taskId);
      path.push(taskId);
      
      const task = taskMap.get(taskId);
      if (task?.dependencies) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId, [...path])) return true;
        }
      }
      
      recursionStack.delete(taskId);
      path.pop();
      return false;
    }
    
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        hasCycle(task.id);
      }
    }
    
    if (circularDeps.length > 0) {
      this.issues.push({
        type: 'circular_dependencies',
        severity: 'high',
        count: circularDeps.length,
        description: 'Circular dependencies prevent task completion',
        cycles: circularDeps
      });
    }
  }

  /**
   * Check for orphaned dependency references
   */
  async checkOrphanedDependencies(tasks) {
    const taskIds = new Set(tasks.map(t => t.id));
    const orphanedRefs = [];
    
    for (const task of tasks) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            orphanedRefs.push({
              taskId: task.id,
              title: task.title,
              orphanedDep: depId
            });
          }
        }
      }
    }
    
    if (orphanedRefs.length > 0) {
      this.issues.push({
        type: 'orphaned_dependencies',
        severity: 'medium',
        count: orphanedRefs.length,
        description: 'Tasks reference dependencies that no longer exist',
        references: orphanedRefs
      });
      
      // Auto-fix: Remove orphaned dependency references
      for (const ref of orphanedRefs) {
        this.fixes.push({
          type: 'remove_orphaned_dep',
          taskId: ref.taskId,
          action: `Remove orphaned dependency ${ref.orphanedDep}`,
          implementation: async () => {
            const task = tasks.find(t => t.id === ref.taskId);
            if (task) {
              task.dependencies = task.dependencies.filter(dep => dep !== ref.orphanedDep);
              console.log(`✅ Removed orphaned dependency ${ref.orphanedDep} from task ${ref.taskId}`);
            }
          }
        });
      }
    }
  }

  /**
   * Analyze priority queue efficiency
   */
  async analyzePriorityQueue(tasks) {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const blockedByDeps = pendingTasks.filter(t => t.dependencies && t.dependencies.length > 0);
    const availableNow = pendingTasks.filter(t => !t.dependencies || t.dependencies.length === 0);
    
    console.log(`📊 Priority Queue Analysis:`);
    console.log(`   Total pending tasks: ${pendingTasks.length}`);
    console.log(`   Blocked by dependencies: ${blockedByDeps.length}`);
    console.log(`   Available for assignment: ${availableNow.length}`);
    
    if (availableNow.length === 0 && blockedByDeps.length > 0) {
      this.issues.push({
        type: 'all_tasks_blocked',
        severity: 'high',
        count: blockedByDeps.length,
        description: 'All pending tasks are blocked by dependencies - no work can be assigned',
        blockedTasks: blockedByDeps.map(t => ({
          id: t.id,
          title: t.title,
          dependencies: t.dependencies
        }))
      });
    }
  }

  /**
   * Apply all fixes
   */
  async applyFixes() {
    if (this.fixes.length === 0) {
      console.log('✅ No fixes needed - system is healthy!');
      return;
    }
    
    console.log(`\n🔧 Applying ${this.fixes.length} fixes...`);
    
    // Apply all fixes
    for (const fix of this.fixes) {
      try {
        await fix.implementation();
      } catch (error) {
        console.error(`❌ Failed to apply fix for ${fix.taskId}: ${error.message}`);
      }
    }
    
    // Save changes to file
    try {
      const todoData = await this.taskManager.readTodo();
      await this.taskManager.writeTodo(todoData);
      console.log('\n💾 All fixes applied and saved to TODO.json');
    } catch (error) {
      console.error('❌ Failed to save fixes:', error.message);
    }
  }

  /**
   * Display analysis results
   */
  displayResults() {
    console.log('\n📋 Bottleneck Analysis Results');
    console.log('================================');
    
    if (this.issues.length === 0) {
      console.log('✅ No bottlenecks detected - system is operating efficiently!');
      return;
    }
    
    console.log(`Found ${this.issues.length} potential bottleneck(s):\n`);
    
    this.issues.forEach((issue, i) => {
      const severityIcon = issue.severity === 'high' ? '🔴' : '🟡';
      console.log(`${i + 1}. ${severityIcon} ${issue.type.toUpperCase()}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log(`   Count: ${issue.count}`);
      console.log(`   Description: ${issue.description}`);
      
      if (issue.tasks) {
        console.log(`   Affected tasks:`);
        issue.tasks.slice(0, 3).forEach(task => {
          console.log(`     • ${task.id}: ${task.title.substring(0, 40)}...`);
        });
        if (issue.tasks.length > 3) {
          console.log(`     ... and ${issue.tasks.length - 3} more`);
        }
      }
      
      console.log('');
    });
    
    if (this.fixes.length > 0) {
      console.log(`💡 ${this.fixes.length} automatic fixes available`);
      console.log('   Run with --fix to apply all fixes automatically');
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Based on issues found, generate specific recommendations
    this.issues.forEach(issue => {
      switch (issue.type) {
        case 'missing_start_time':
          recommendations.push('Fix task claiming logic to always set started_at timestamps');
          break;
        case 'stale_tasks':
          recommendations.push('Implement more aggressive stale task detection (currently 15 min)');
          break;
        case 'circular_dependencies':
          recommendations.push('Review task dependency chains to eliminate cycles');
          break;
        case 'orphaned_dependencies':
          recommendations.push('Add validation to prevent orphaned dependency references');
          break;
        case 'all_tasks_blocked':
          recommendations.push('Consider allowing out-of-order task claiming for critical work');
          break;
      }
    });
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    return recommendations;
  }
}

// CLI interface
async function main() {
  const resolver = new TaskBottleneckResolver();
  const shouldFix = process.argv.includes('--fix');
  const shouldRecommend = process.argv.includes('--recommend');
  
  try {
    await resolver.analyze();
    
    if (shouldFix) {
      await resolver.applyFixes();
    }
    
    if (shouldRecommend) {
      resolver.generateRecommendations();
    }
    
    // Exit with appropriate code
    process.exit(resolver.issues.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Bottleneck analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TaskBottleneckResolver;