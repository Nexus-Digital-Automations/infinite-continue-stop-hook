#!/usr/bin/env node
/**
 * AIgent Feature-Based Migration Script
 * 
 * Converts phase-based tasks in AIgent TODO.json to the new feature-based system
 */

const fs = require('fs');
const path = require('path');

const AIGENT_PROJECT_PATH = '/Users/jeremyparker/Desktop/Claude Coding Projects/AIgent';
const TODO_PATH = path.join(AIGENT_PROJECT_PATH, 'TODO.json');

// Import TaskManager from local lib
const TaskManager = require('./lib/taskManager');

async function migrateAIgentToFeatures() {
    console.log('🚀 Starting AIgent Feature-Based Migration');
    
    try {
        // Initialize TaskManager for AIgent project
        const taskManager = new TaskManager(TODO_PATH);
        
        // Read current TODO.json
        const todoData = await taskManager.readTodo();
        console.log(`📊 Found ${todoData.tasks.length} tasks to analyze`);
        
        // Create backup
        const backupPath = `${TODO_PATH}.feature-migration-backup.${Date.now()}`;
        fs.writeFileSync(backupPath, JSON.stringify(todoData, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        // Ensure features array exists
        if (!todoData.features) {
            todoData.features = [];
        }
        
        // Group tasks by phase
        const phaseGroups = new Map();
        const independentTasks = [];
        
        todoData.tasks.forEach(task => {
            if (task.phase && task.phase.major !== undefined) {
                const phaseKey = `${task.phase.major}.${task.phase.minor || 0}`;
                if (!phaseGroups.has(phaseKey)) {
                    phaseGroups.set(phaseKey, []);
                }
                phaseGroups.get(phaseKey).push(task);
            } else {
                independentTasks.push(task);
            }
        });
        
        console.log(`🔍 Found ${phaseGroups.size} phase groups and ${independentTasks.length} independent tasks`);
        
        // Convert phase groups to features
        let featuresCreated = 0;
        for (const [phaseKey, tasks] of phaseGroups) {
            const [majorPhase, minorPhase] = phaseKey.split('.');
            
            // Determine feature title and description from main implementation task
            const mainTask = tasks.find(t => !t.title.startsWith('Research:')) || tasks[0];
            const researchTask = tasks.find(t => t.title.startsWith('Research:'));
            
            const featureTitle = `Phase ${majorPhase}.${minorPhase}: ${mainTask.title.replace(/^Phase \d+(?:\.\d+)?:\s*/, '')}`;
            
            // Create feature
            const timestamp = Date.now() + featuresCreated;
            const randomSuffix = Math.random().toString(36).substr(2, 9);
            const featureId = `feature_phase_${majorPhase}_${minorPhase}_${timestamp}_${randomSuffix}`;
            
            const feature = {
                id: featureId,
                title: featureTitle,
                description: mainTask.description || `Phase ${majorPhase}.${minorPhase} implementation`,
                status: 'approved', // Phase tasks are already approved for implementation
                category: mainTask.category || 'enhancement',
                priority: mainTask.priority || 'medium',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                phase: {
                    major: parseInt(majorPhase),
                    minor: parseInt(minorPhase)
                },
                subtasks: tasks.map(t => t.id),
                dependencies: [],
                success_criteria: mainTask.success_criteria || [],
                metadata: {
                    estimated_effort: 'high',
                    completion_percentage: 0,
                    converted_from_phase: true,
                    original_phase_key: phaseKey,
                    task_count: tasks.length,
                    has_research_task: !!researchTask
                }
            };
            
            todoData.features.push(feature);
            
            // Update all tasks in this phase to reference the feature
            tasks.forEach(task => {
                task.parent_feature = featureId;
            });
            
            featuresCreated++;
            console.log(`✅ Created feature: ${featureTitle} (${tasks.length} tasks)`);
        }
        
        // Add parent_feature: null to independent tasks
        independentTasks.forEach(task => {
            task.parent_feature = null;
        });
        
        // Write updated TODO.json
        await taskManager.writeTodo(todoData);
        
        console.log('🎉 Migration completed successfully!');
        console.log(`📊 Migration Results:`);
        console.log(`   - Features created: ${featuresCreated}`);
        console.log(`   - Phase-based tasks converted: ${todoData.tasks.length - independentTasks.length}`);
        console.log(`   - Independent tasks: ${independentTasks.length}`);
        console.log(`   - Total features: ${todoData.features.length}`);
        
        // Validate the migration
        console.log('\n🔍 Validating migration...');
        const validation = await validateMigration(taskManager);
        if (validation.success) {
            console.log('✅ Migration validation passed');
        } else {
            console.log('❌ Migration validation failed:', validation.errors);
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

async function validateMigration(taskManager) {
    try {
        const todoData = await taskManager.readTodo();
        const errors = [];
        
        // Check that features array exists
        if (!todoData.features) {
            errors.push('Features array missing');
        }
        
        // Check that all tasks have parent_feature field
        todoData.tasks.forEach(task => {
            if (task.parent_feature === undefined) {
                errors.push(`Task ${task.id} missing parent_feature field`);
            }
        });
        
        // Check that feature subtasks reference valid task IDs
        todoData.features.forEach(feature => {
            if (feature.subtasks) {
                feature.subtasks.forEach(subtaskId => {
                    const task = todoData.tasks.find(t => t.id === subtaskId);
                    if (!task) {
                        errors.push(`Feature ${feature.id} references non-existent task: ${subtaskId}`);
                    } else if (task.parent_feature !== feature.id) {
                        errors.push(`Task ${subtaskId} parent_feature mismatch with feature ${feature.id}`);
                    }
                });
            }
        });
        
        return {
            success: errors.length === 0,
            errors: errors
        };
    } catch (error) {
        return {
            success: false,
            errors: [error.message]
        };
    }
}

// Run migration if script is called directly
if (require.main === module) {
    migrateAIgentToFeatures();
}

module.exports = { migrateAIgentToFeatures };