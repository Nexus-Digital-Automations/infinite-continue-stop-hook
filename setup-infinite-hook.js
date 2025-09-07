
/**
 * Infinite Continue Hook Setup and Project Initialization System
 *
 * === OVERVIEW ===
 * Comprehensive project setup utility that initializes TaskManager system
 * integration across development projects. This script creates the necessary
 * directory structures, configuration files, and TODO.json schemas required
 * for the infinite continue hook system to function properly.
 *
 * === KEY FEATURES ===
 * • Automated project directory structure creation
 * • TODO.json schema initialization with multi-agent support
 * • Development mode files and guidelines setup
 * • Interactive and batch mode operations
 * • Project validation and compatibility checking
 * • Centralized TaskManager system integration
 *
 * === PROJECT STRUCTURE CREATION ===
 * • /development - Core development documentation directory
 * • /development/tasks - Task-specific documentation
 * • /development/reports - Development reports and analysis
 * • TODO.json - Multi-agent task management schema
 * • Agent registry integration for multi-agent coordination
 *
 * === TODO.JSON SCHEMA ===
 * Creates modern multi-agent compatible TODO.json structure:
 * • Task management with unique IDs and timestamps
 * • Dependency system for complex workflows
 * • Agent coordination and multi-agent support
 * • Review strike system for quality control
 * • Mode-based workflow management
 * • Production-ready implementation requirements
 *
 * === OPERATION MODES ===
 * • Interactive Mode - User-guided project configuration
 * • Batch Mode - Automated setup with minimal interaction
 * • Single Project Mode - Setup for specific project directory
 * • Validation Mode - Check and update existing projects
 *
 * === HOOK SYSTEM INTEGRATION ===
 * • Integrates with Claude Code infinite continue hook
 * • Establishes connection to centralized TaskManager system
 * • Provides universal command interface setup
 * • Creates standardized workflow patterns
 *
 * === QUALITY ASSURANCE SYSTEM ===
 * The setup creates a three-strike review system:
 * • Strike 1: Build and compilation validation
 * • Strike 2: Linting and code quality validation
 * • Strike 3: Test coverage and quality validation
 * • Automatic task creation for remediation
 * • Production-ready implementation enforcement
 *
 * === COMMAND LINE INTERFACE ===
 * • --no-interactive / --batch: Skip interactive prompts
 * • --project-name: Specify project name
 * • --task: Initial task description
 * • --mode: Task execution mode
 * • --prompt: Detailed task instructions
 * • --dependencies: Task dependencies
 * • --important-files: Critical project files
 * • --requires-research: Research requirement flag
 * • --single: Single project mode
 *
 * === USAGE PATTERNS ===
 * 1. Interactive Setup:
 *    node setup-infinite-hook.js /path/to/project
 *
 * 2. Batch Setup:
 *    node setup-infinite-hook.js --batch --project-name "MyProject"
 *
 * 3. Single Project:
 *    node setup-infinite-hook.js /path/to/project --single
 *
 * 4. Automated CI/CD:
 *    node setup-infinite-hook.js $PROJECT_ROOT --batch --no-interactive
 *
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath =
  args[0] || '/Users/jeremyparker/Desktop/Claude Coding Projects';

// Check for command line flags
const flags = {
  noInteractive: args.includes('--no-interactive') || args.includes('--batch'),
  projectName: getArgValue('--project-name'),
  task: getArgValue('--task'),
  mode: getArgValue('--mode') || 'DEVELOPMENT',
  prompt: getArgValue('--prompt'),
  dependencies: getArgValue('--dependencies'),
  importantFiles: getArgValue('--important-files'),
  requiresResearch: args.includes('--requires-research'),
  batchMode: args.includes('--batch'),
  singleProject: args.includes('--single'),
};

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index > -1 && index < args.length - 1) {
    return args[index + 1];
  }
  return null;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function _getProjectInfo(targetPath) {
  // Try to detect project name from package.json or directory name
  let detectedName = path.basename(targetPath);

  const packageJsonPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name) {
        detectedName = packageJson.name;
      }
    } catch {
      // Ignore and use directory name
    }
  }

  if (flags.noInteractive) {
    return {
      projectName: flags.projectName || detectedName,
      taskDescription: flags.task || 'Initial project setup',
      taskMode: flags.mode.toUpperCase(),
      taskPrompt:
        flags.prompt ||
        flags.task ||
        'Set up the project according to requirements',
      dependencies: flags.dependencies
        ? flags.dependencies.split(',').map((d) => d.trim())
        : [],
      importantFiles: flags.importantFiles
        ? flags.importantFiles.split(',').map((f) => f.trim())
        : [],
      requiresResearch: flags.requiresResearch,
    };
  }

  // Interactive mode
  console.log('\n=== Project Configuration ===');
  const projectName =
    (await question(`Project name (${detectedName}): `)) || detectedName;

  console.log('\n=== Initial Task Setup ===');
  const taskDescription = await question('Task description: ');
  const taskMode =
    (await question(
      'Task mode (DEVELOPMENT/REFACTORING/TESTING/RESEARCH) [DEVELOPMENT]: ',
    )) || 'DEVELOPMENT';
  const taskPrompt = await question('Detailed task prompt: ');
  const dependencies = await question(
    'Dependencies (comma-separated files/dirs, or press Enter to skip): ',
  );
  const importantFiles = await question(
    'Important files to read first (comma-separated, or press Enter to skip): ',
  );
  const requiresResearch = await question('Requires research? (y/n) [n]: ');

  return {
    projectName,
    taskDescription,
    taskMode: taskMode.toUpperCase(),
    taskPrompt,
    dependencies: dependencies
      ? dependencies.split(',').map((d) => d.trim())
      : [],
    importantFiles: importantFiles
      ? importantFiles.split(',').map((f) => f.trim())
      : [],
    requiresResearch: requiresResearch.toLowerCase() === 'y',
  };
}

async function createProjectDirectories(targetPath) {
  // Create /development directory
  const developmentPath = path.join(targetPath, 'development');
  if (!fs.existsSync(developmentPath)) {
    fs.mkdirSync(developmentPath, { recursive: true });
    console.log(`✓ Created /development directory`);
  }

  // Create /development/tasks directory
  const tasksPath = path.join(developmentPath, 'tasks');
  if (!fs.existsSync(tasksPath)) {
    fs.mkdirSync(tasksPath, { recursive: true });
    console.log(`✓ Created /development/tasks directory`);
  }

  // Create /development/reports directory
  const reportsPath = path.join(developmentPath, 'reports');
  if (!fs.existsSync(reportsPath)) {
    fs.mkdirSync(reportsPath, { recursive: true });
    console.log(`✓ Created /development/reports directory`);
  }

  return { developmentPath, tasksPath, reportsPath };
}

// Check if TODO.json needs to be updated to new schema
function needsTodoUpdate(todoPath) {
  if (!fs.existsSync(todoPath)) {return true;}

  try {
    const existing = JSON.parse(fs.readFileSync(todoPath, 'utf8'));

    // Check for old schema indicators
    const hasOldSchema =
      existing.current_task_index !== undefined || // Old field
      !existing.current_mode || // Missing new field
      existing.execution_count === undefined || // Missing new field
      (existing.tasks &&
        existing.tasks.some((t) => t.id && !t.id.includes('_'))) || // Old task ID format
      (existing.tasks && existing.tasks.some((t) => !t.title)); // Missing title field

    if (hasOldSchema) {
      console.log(
        `⚠️  ${path.basename(path.dirname(todoPath))} - TODO.json uses old schema, will update`,
      );
      return true;
    }

    console.log(
      `✓ ${path.basename(path.dirname(todoPath))} - TODO.json already up to date`,
    );
    return false;
  } catch {
    console.log(
      `⚠️  ${path.basename(path.dirname(todoPath))} - TODO.json corrupted, will recreate`,
    );
    return true;
  }
}

async function createTodoJson(targetPath, projectInfo) {
  const todoPath = path.join(targetPath, 'TODO.json');

  // Smart update logic - only update if schema is old or missing
  if (!needsTodoUpdate(todoPath)) {
    return true; // Already up to date, skip
  }

  // Generate new task ID with timestamp format
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 9);
  const taskId = `task_${timestamp}_${randomString}`;

  // Create new schema TODO structure
  const todoData = {
    project: projectInfo.projectName,
    tasks: [
      {
        id: taskId,
        title: projectInfo.taskDescription,
        description:
          (projectInfo.taskPrompt || projectInfo.taskDescription) +
          '\n\nIMPORTANT: ALL CODE AND FEATURES MUST BE PRODUCTION-READY - NO SIMPLIFIED OR MOCK IMPLEMENTATIONS.',
        mode: projectInfo.taskMode,
        category: 'missing-feature',
        priority: 'medium',
        status: 'pending',
        dependencies: [`task_${timestamp}_init`],
        important_files: projectInfo.importantFiles || [],
        requires_research: projectInfo.requiresResearch || false,
        created_at: new Date().toISOString(),
        subtasks: [],
      },
    ],
    // New multi-agent schema fields
    current_mode: projectInfo.taskMode,
    last_mode: null,
    execution_count: 0,
    review_strikes: 0,
    strikes_completed_last_run: false,
    last_hook_activation: timestamp,
    agents: {}, // Empty agent registry
    features: [], // Feature-based system integration
    current_task_index: 0,
  };

  // Add three review tasks for the three-strike policy - language agnostic
  const reviewTasks = [
    {
      criteria:
        'Ensure the project builds completely without errors with production-ready quality',
      dependencies: [],
      important_files: [],
      failureInstructions: `IF BUILD FAILS: Create specific tasks with appropriate categories to fix build issues:
- Missing dependencies installation tasks (category: 'build-error')
- Build configuration setup tasks (category: 'build-error')
- Compilation error resolution tasks (category: 'build-error')
- Environment setup tasks (category: 'missing-feature')
- Build script creation tasks (category: 'missing-feature')

CRITICAL: Use TaskManager API to add these tasks immediately when build failures are detected. All solutions must be production-ready, not simplified workarounds.`,
    },
    {
      criteria:
        'Verify no lint errors exist in the codebase with enterprise-grade standards',
      dependencies: [],
      important_files: [],
      failureInstructions: `IF LINT ERRORS FOUND: Create specific tasks with appropriate categories to achieve zero lint errors:
- Linting tool setup and configuration tasks (category: 'linter-error')
- Code style correction tasks (category: 'linter-error')
- Import organization tasks (category: 'linter-error')
- Naming convention fixes tasks (category: 'linter-error')
- Dead code removal tasks (category: 'refactor')

CRITICAL: Use TaskManager API to add these tasks immediately when lint errors are detected. Follow production-ready standards, not quick fixes.`,
    },
    {
      criteria:
        'Confirm test coverage is 100% on important modules and 90%+ on others, with all tests passing and production-ready quality',
      dependencies: [],
      important_files: [],
      failureInstructions: `IF TEST COVERAGE INSUFFICIENT: Create specific tasks with appropriate categories to achieve required coverage:
- Test framework setup tasks (category: 'test-setup') 
- Unit test creation tasks for all modules (category: 'missing-test')
- Integration test development tasks (category: 'missing-test')
- Test coverage reporting setup tasks (category: 'test-setup')
- CI/CD test integration tasks (category: 'test-setup')

CRITICAL: Use TaskManager API to add these tasks immediately when coverage is below requirements. All tests must be production-ready with comprehensive scenarios.`,
    },
  ];

  reviewTasks.forEach((reviewTask, index) => {
    const reviewId = `task_${timestamp + index + 1}_review${index + 1}`;
    todoData.tasks.push({
      id: reviewId,
      title: `Review Strike ${index + 1}: ${reviewTask.criteria}`,
      description: `Perform a comprehensive code review with focus on: ${reviewTask.criteria}

Check the entire codebase and ensure this criterion is met.

## CRITICAL FAILURE RESPONSE PROTOCOL

${reviewTask.failureInstructions}

## SUCCESS CRITERIA
- Mark this review task as completed ONLY if the criterion is fully met
- If criterion fails, you MUST create remediation tasks using TaskManager API before marking review as completed
- All new tasks should be actionable, specific, and include proper dependencies/important_files parameters

## TASK CREATION REQUIREMENT
When creating remediation tasks, ensure each task includes:
- Clear success criteria
- Appropriate category (linter-error, build-error, missing-feature, bug, enhancement, etc.)
- Specific file dependencies
- Realistic time estimates
- High priority for critical issues
- Production-ready implementation requirements

Use the task-creation.md guidelines for optimal task structure.`,
      task_type: 'test',
      category: 'review',
      priority: 'high',
      status: 'pending',
      dependencies: reviewTask.dependencies,
      important_files: reviewTask.important_files,
      requires_research: false,
      created_at: new Date().toISOString(),
      subtasks: [],
      is_review_task: true,
      strike_number: index + 1,
    });
  });

  // Write TODO.json
  fs.writeFileSync(todoPath, JSON.stringify(todoData, null, 2));
  console.log(`\n✓ TODO.json created at: ${todoPath}`);

  return true;
}

// Get all project directories to process
function _getProjectDirectories(basePath) {
  if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(basePath)
    .map((item) => path.join(basePath, item))
    .filter((itemPath) => {
      if (!fs.statSync(itemPath).isDirectory()) {return false;}

      // Skip hidden directories and common ignore patterns
      const dirname = path.basename(itemPath);
      if (
        dirname.startsWith('.') ||
        dirname === 'node_modules' ||
        dirname === 'dist' ||
        dirname === 'build'
      ) {
        return false;
      }

      return true;
    });
}

async function processProject(targetPath) {
  const projectName = path.basename(targetPath);
  console.log(`\n=== Processing ${projectName} ===`);

  try {
    // Get project information for this specific project
    const projectInfo = {
      projectName: projectName,
      taskDescription: 'Continue development and improvements',
      taskMode: 'DEVELOPMENT',
      taskPrompt:
        'Continue with the current development tasks, fix any issues, and improve the codebase quality.',
      dependencies: [],
      importantFiles: [],
      requiresResearch: false,
    };

    // Create project directories and copy mode files if needed
    await createProjectDirectories(targetPath);

    // Create/update TODO.json if needed
    const success = await createTodoJson(targetPath, projectInfo);

    // Migrate to feature-based system (replaces features.json)
    await migrateToFeatureBasedSystem(targetPath);

    if (success) {
      console.log(`✅ ${projectName} - Setup complete`);
    } else {
      console.log(`⏭️  ${projectName} - Skipped (already up to date)`);
    }

    return { success: true, project: projectName };
  } catch (error) {
    console.error(`❌ ${projectName} - Error:`, error.message);
    return { success: false, project: projectName, error: error.message };
  }
}

/**
 * Migrate TODO.json to feature-based system (replaces dual features.json system)
 * @param {string} targetPath - Target project path
 */
async function migrateToFeatureBasedSystem(targetPath) {
  const todoPath = path.join(targetPath, 'TODO.json');

  try {
    console.log(`   🔄 Checking for feature-based migration...`);

    if (!fs.existsSync(todoPath)) {
      console.log(`   ⚠️  No TODO.json found - skipping migration`);
      return;
    }

    // Read current TODO.json
    const todoData = JSON.parse(fs.readFileSync(todoPath, 'utf8'));

    // Check if already feature-based
    if (todoData.features && Array.isArray(todoData.features)) {
      console.log(`   ✅ Already feature-based - skipping migration`);
      return;
    }

    // Create backup before migration
    const backupPath = todoPath + '.pre-feature-migration.backup';
    fs.writeFileSync(backupPath, JSON.stringify(todoData, null, 2));
    console.log(`   📋 Created backup: ${path.basename(backupPath)}`);

    // Analyze current tasks for feature grouping
    const analysis = analyzeTasksForFeatures(todoData.tasks);
    console.log(
      `   📊 Analysis: ${analysis.summary.phased_tasks} phased tasks, ${analysis.summary.non_phased_tasks} independent tasks`,
    );

    // Convert to feature-based structure
    const migrated = convertToFeatureBasedSchema(todoData, analysis);

    // Write migrated structure
    fs.writeFileSync(todoPath, JSON.stringify(migrated, null, 2));

    console.log(
      `   ✅ Migration completed: ${migrated.features.length} features, ${migrated.tasks.length} tasks`,
    );

    // Clean up features.json if it exists (eliminating dual system)
    const featuresJsonPath = path.join(targetPath, 'features.json');
    if (fs.existsSync(featuresJsonPath)) {
      fs.unlinkSync(featuresJsonPath);
      console.log(`   🗑️  Removed features.json (dual system eliminated)`);
    }
  } catch (error) {
    console.log(`   ❌ Feature migration failed: ${error.message}`);
    // Don't fail the entire setup for migration issues
  }
}

/**
 * Analyze current tasks to identify feature groupings
 * @param {Array} tasks - Current tasks array
 * @returns {Object} Analysis results
 */
function analyzeTasksForFeatures(tasks) {
  const analysis = {
    phaseGroups: {},
    nonPhasedTasks: [],
    summary: {
      total_tasks: tasks.length,
      phased_tasks: 0,
      non_phased_tasks: 0,
      unique_phases: 0,
    },
  };

  tasks.forEach((task) => {
    const phase = task.phase || extractPhaseFromTitle(task.title);

    if (phase) {
      const phaseKey = `${phase.major}.${phase.minor}`;
      if (!analysis.phaseGroups[phaseKey]) {
        analysis.phaseGroups[phaseKey] = {
          phase: phase,
          tasks: [],
          feature_title: generateFeatureTitle(phaseKey, task.title),
        };
      }
      analysis.phaseGroups[phaseKey].tasks.push(task);
      analysis.summary.phased_tasks++;
    } else {
      analysis.nonPhasedTasks.push(task);
      analysis.summary.non_phased_tasks++;
    }
  });

  analysis.summary.unique_phases = Object.keys(analysis.phaseGroups).length;
  return analysis;
}

/**
 * Extract phase information from task title
 * @param {string} title - Task title
 * @returns {Object|null} Phase info or null
 */
function extractPhaseFromTitle(title) {
  if (!title) {return null;}

  const phaseMatch = title.match(
    /(?:Research:\s*)?Phase\s+(\d+)(?:\.(\d+)(?:\.(\d+))?)?/i,
  );
  if (!phaseMatch) {return null;}

  return {
    major: parseInt(phaseMatch[1], 10),
    minor: phaseMatch[2] ? parseInt(phaseMatch[2], 10) : 0,
    patch: phaseMatch[3] ? parseInt(phaseMatch[3], 10) : 0,
    raw: phaseMatch[0],
  };
}

/**
 * Generate feature title from phase key and task title
 * @param {string} phaseKey - Phase key (e.g., "1.2")
 * @param {string} sampleTitle - Sample task title
 * @returns {string} Generated feature title
 */
function generateFeatureTitle(phaseKey, sampleTitle) {
  // Extract feature name from task title
  const titleMatch = sampleTitle.match(
    /Phase\s+[\d.]+:\s*(.+?)(?:\s+Implementation)?$/i,
  );
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Fallback to phase-based title
  return `Phase ${phaseKey} Feature`;
}

/**
 * Convert TODO.json to feature-based structure
 * @param {Object} todoData - Current TODO.json data
 * @param {Object} analysis - Task analysis results
 * @returns {Object} Migrated TODO.json structure
 */
function convertToFeatureBasedSchema(todoData, analysis) {
  const migrated = {
    ...todoData,
    features: [], // CRITICAL: User authorization required for feature additions
    tasks: [],
  };

  // Convert phased tasks to features with subtasks
  for (const [_phaseKey, group] of Object.entries(analysis.phaseGroups)) {
    const feature = createFeatureFromPhaseGroup(group);

    // IMPORTANT: Only add features to array - no automatic feature creation
    // User must explicitly authorize feature additions per CLAUDE.md requirements
    migrated.features.push(feature);

    // Convert phase tasks to subtasks with parent feature reference
    group.tasks.forEach((task) => {
      const subtask = {
        ...task,
        parent_feature: feature.id,
        // Remove phase info since it's now in the parent feature
        phase: undefined,
      };
      migrated.tasks.push(subtask);
    });
  }

  // Handle non-phased tasks (keep as regular tasks)
  analysis.nonPhasedTasks.forEach((task) => {
    migrated.tasks.push({
      ...task,
      parent_feature: null, // No parent feature
    });
  });

  return migrated;
}

/**
 * Create feature from phase group
 * @param {Object} group - Phase group data
 * @returns {Object} Feature object
 */
function createFeatureFromPhaseGroup(group) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 9);
  const featureId = `feature_${timestamp}_${randomSuffix}`;

  // Determine feature category from phase number
  const categoryMap = {
    1: 'bytebot',
    2: 'open_interpreter',
    3: 'opendia',
    4: 'huginn',
    5: 'orchestrator',
  };
  const category = categoryMap[group.phase.major] || 'uncategorized';

  // Calculate status based on subtask statuses
  const statuses = group.tasks.map((t) => t.status);
  let status = 'planned';
  if (statuses.every((s) => s === 'completed')) {
    status = 'implemented';
  } else if (statuses.some((s) => s === 'in_progress')) {
    status = 'in_progress';
  } else if (statuses.some((s) => s === 'completed')) {
    status = 'in_progress';
  }

  // Calculate priority from subtask priorities
  const priorities = group.tasks.map((t) => t.priority || 'medium');
  let priority = 'medium';
  if (priorities.includes('critical')) {priority = 'critical';} else if (priorities.includes('high')) {priority = 'high';} else if (priorities.includes('low')) {priority = 'low';}

  return {
    id: featureId,
    title: group.feature_title,
    description: generateFeatureDescription(group),
    status: status,
    category: category,
    priority: priority,
    phase: group.phase,
    subtasks: group.tasks.map((t) => t.id),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      migrated_from_phase: `${group.phase.major}.${group.phase.minor}`,
      original_task_count: group.tasks.length,
      completion_percentage: calculateCompletionPercentage(group.tasks),
    },
  };
}

/**
 * Generate feature description from task group
 * @param {Object} group - Task group
 * @returns {string} Feature description
 */
function generateFeatureDescription(group) {
  if (group.tasks.length === 1) {
    return group.tasks[0].description || 'Feature description';
  }

  // Aggregate description from multiple tasks
  const descriptions = group.tasks
    .map((t) => t.description)
    .filter((d) => d && d.length > 0);

  if (descriptions.length > 0) {
    return descriptions[0]; // Use first task's description
  }

  return `Feature comprising ${group.tasks.length} implementation tasks`;
}

/**
 * Calculate completion percentage
 * @param {Array} tasks - Task array
 * @returns {number} Completion percentage
 */
function calculateCompletionPercentage(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

async function main() {
  console.log('=== Infinite Continue Stop Hook - Batch TODO.json Setup ===\n');

  // Resolve project path
  const targetPath = path.resolve(projectPath);

  // Verify project path exists
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Path does not exist: ${targetPath}`);
    process.exit(1);
  }

  // Verify it's a directory
  if (!fs.statSync(targetPath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${targetPath}`);
    process.exit(1);
  }

  console.log(`Processing directories in: ${targetPath}`);
  console.log(`Batch mode: ${flags.batchMode ? 'ON' : 'OFF'}`);
  console.log(`Single project mode: ${flags.singleProject ? 'ON' : 'OFF'}`);

  const results = [];

  try {
    // Always process only the specified directory as a single project
    // This ensures TODO.json is created only in the root of the specified directory
    console.log(`Processing single project: ${path.basename(targetPath)}`);
    const result = await processProject(targetPath);
    results.push(result);

    // Summary
    console.log('\n=== Summary ===');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ Successfully processed: ${successful} projects`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} projects`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - ${r.project}: ${r.error}`);
        });
    }

    console.log('\n📋 Usage examples:');
    console.log('# Process all projects in Claude Coding Projects (default):');
    console.log('node setup-infinite-hook.js');
    console.log('');
    console.log('# Process single project:');
    console.log('node setup-infinite-hook.js /path/to/project --single');
    console.log('');
    console.log('# Batch mode with no interaction:');
    console.log('node setup-infinite-hook.js --batch');

    console.log('\n📋 Each project now includes:');
    console.log('   - TODO.json with new multi-agent schema');
    console.log('   - Development mode files and directory structure');
    console.log('');
    console.log('📋 TaskManager system is centralized at:');
    console.log(
      '   /Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/',
    );
    console.log('');
    console.log('📋 Use universal commands to work with any project:');
    console.log(
      '   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project /path/to/project',
    );
    console.log(
      '   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project /path/to/project',
    );
    console.log('');
    console.log(
      '📋 Updated hook reference in ~/.claude/settings.json should point to:',
    );
    console.log(
      'node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/stop-hook.js"',
    );
  } catch (error) {
    console.error('\n❌ Batch setup error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run main function
main();
