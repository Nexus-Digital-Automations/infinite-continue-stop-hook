# Validation Dependency Management Integration Guide

This guide provides step-by-step instructions for integrating the Validation Dependency Management system into your projects and workflows.

## Table of Contents

- [Quick Start](#quick-start)
- [Integration Patterns](#integration-patterns)
- [API Integration](#api-integration)
- [CLI Integration](#cli-integration)
- [Custom Validation Workflows](#custom-validation-workflows)
- [CI/CD Integration](#cicd-integration)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Quick Start

### 1. Basic Setup

```javascript
const { ValidationDependencyManager } = require('./lib/validation-dependency-manager');

// Initialize the manager
const manager = new ValidationDependencyManager({
  projectRoot: process.cwd()
});

// Check default dependencies
const dependencies = manager.getAllDependencies();
console.log('Available validation criteria:', Object.keys(dependencies));
```

### 2. Add Your First Custom Validation

```javascript
// Define a custom validation step
manager.addDependency('custom-validation', {
  dependencies: [
    { criterion: 'linter-validation', type: 'strict' }
  ],
  description: 'Custom business logic validation',
  estimatedDuration: 12000,
  parallelizable: true,
  resourceRequirements: ['filesystem', 'cpu']
});

// Validate the configuration
const validation = manager.validateDependencyGraph();
if (!validation.valid) {
  console.error('Configuration errors:', validation.issues);
}
```

### 3. Generate and Execute Plan

```javascript
// Generate execution plan
const plan = manager.generateParallelExecutionPlan(['custom-validation'], 4);
console.log(`Plan: ${plan.totalWaves} waves, ${plan.parallelizationGain.toFixed(1)}% efficiency`);

// Execute with monitoring
const result = await manager.executeParallelValidationPlan(plan, {
  onCriterionComplete: (info) => console.log(`✓ ${info.criterion} (${info.duration}ms)`)
});
```

## Integration Patterns

### Pattern 1: TaskManager API Integration

Use the high-level TaskManager API for complete functionality:

```javascript
const { TaskManagerAPI } = require('./taskmanager-api');

class MyValidationService {
  constructor() {
    this.api = new TaskManagerAPI();
  }

  async setupCustomPipeline() {
    // Add custom validations
    const customSteps = [
      {
        name: 'environment-check',
        config: {
          dependencies: [],
          description: 'Verify environment prerequisites',
          estimatedDuration: 5000,
          parallelizable: true,
          resourceRequirements: ['filesystem']
        }
      },
      {
        name: 'integration-tests',
        config: {
          dependencies: [
            { criterion: 'build-validation', type: 'strict' },
            { criterion: 'environment-check', type: 'strict' }
          ],
          description: 'Run integration test suite',
          estimatedDuration: 45000,
          parallelizable: false,
          resourceRequirements: ['network', 'filesystem', 'cpu']
        }
      }
    ];

    for (const step of customSteps) {
      const result = await this.api.updateValidationDependency(step.name, step.config);
      if (!result.success) {
        throw new Error(`Failed to add ${step.name}: ${result.error}`);
      }
    }

    return await this.api.generateValidationExecutionPlan();
  }

  async executeValidation() {
    const plan = await this.setupCustomPipeline();
    return await this.api.executeParallelValidation(null, {
      callbacks: {
        onWaveStart: (info) => this.logWaveStart(info),
        onCriterionComplete: (info) => this.logCriterionComplete(info),
        onError: (info) => this.logError(info)
      }
    });
  }

  logWaveStart(info) {
    console.log(`🚀 Starting wave ${info.wave} with ${info.concurrency} parallel validations`);
  }

  logCriterionComplete(info) {
    const emoji = info.status === 'success' ? '✅' : '❌';
    console.log(`${emoji} ${info.criterion} completed in ${info.duration}ms`);
  }

  logError(info) {
    console.error(`❌ ${info.criterion} failed: ${info.error}`);
  }
}
```

### Pattern 2: Direct ValidationDependencyManager Usage

For fine-grained control, use the manager directly:

```javascript
const { ValidationDependencyManager, DEPENDENCY_TYPES } = require('./lib/validation-dependency-manager');

class CustomValidationFramework {
  constructor(options = {}) {
    this.manager = new ValidationDependencyManager(options);
    this.executionHistory = [];
  }

  // Define validation pipeline
  definePipeline(pipelineConfig) {
    for (const [criterion, config] of Object.entries(pipelineConfig)) {
      this.manager.addDependency(criterion, config);
    }

    // Validate configuration
    const validation = this.manager.validateDependencyGraph();
    if (!validation.valid) {
      throw new Error(`Invalid pipeline: ${validation.issues.map(i => i.description).join(', ')}`);
    }
  }

  // Generate optimal execution strategy
  planExecution(criteria = null, systemInfo = null) {
    if (systemInfo) {
      return this.manager.generateAdaptiveExecutionPlan(criteria, systemInfo);
    } else {
      return this.manager.generateParallelExecutionPlan(criteria);
    }
  }

  // Execute with custom validation logic
  async execute(plan, validationCallbacks = {}) {
    // Override the execution method to use custom validation logic
    const originalExecute = this.manager._executeCriterion;
    this.manager._executeCriterion = async (criterion, options) => {
      if (validationCallbacks[criterion]) {
        return await validationCallbacks[criterion](options);
      }
      return await originalExecute.call(this.manager, criterion, options);
    };

    const result = await this.manager.executeParallelValidationPlan(plan, {
      onCriterionComplete: (info) => {
        this.executionHistory.push({
          criterion: info.criterion,
          duration: info.duration,
          status: info.status,
          timestamp: new Date()
        });
      }
    });

    // Restore original method
    this.manager._executeCriterion = originalExecute;

    return result;
  }

  // Get execution analytics
  getAnalytics() {
    return {
      executionHistory: this.executionHistory,
      dependencyAnalytics: this.manager.getExecutionAnalytics(),
      systemAnalytics: this.manager.generateInteractiveVisualization('json').debugInfo
    };
  }
}
```

## API Integration

### RESTful API Wrapper

Create a REST API around the validation system:

```javascript
const express = require('express');
const { TaskManagerAPI } = require('./taskmanager-api');

class ValidationAPI {
  constructor() {
    this.app = express();
    this.api = new TaskManagerAPI();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Get all dependencies
    this.app.get('/api/dependencies', async (req, res) => {
      try {
        const result = await this.api.getValidationDependencies();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add/update dependency
    this.app.put('/api/dependencies/:criterion', async (req, res) => {
      try {
        const result = await this.api.updateValidationDependency(
          req.params.criterion,
          req.body
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Generate execution plan
    this.app.post('/api/execution-plan', async (req, res) => {
      try {
        const { criteria, maxConcurrency } = req.body;
        const result = await this.api.generateValidationExecutionPlan(criteria, maxConcurrency);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Execute validation
    this.app.post('/api/execute', async (req, res) => {
      try {
        const { criteria, options } = req.body;

        // Set up server-sent events for real-time updates
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        const callbacks = {
          onWaveStart: (info) => res.write(`data: ${JSON.stringify({type: 'wave_start', ...info})}\\n\\n`),
          onCriterionComplete: (info) => res.write(`data: ${JSON.stringify({type: 'criterion_complete', ...info})}\\n\\n`),
          onError: (info) => res.write(`data: ${JSON.stringify({type: 'error', ...info})}\\n\\n`)
        };

        const result = await this.api.executeParallelValidation(criteria, {
          ...options,
          callbacks
        });

        res.write(`data: ${JSON.stringify({type: 'complete', result})}\\n\\n`);
        res.end();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get visualizations
    this.app.get('/api/visualization/:format', async (req, res) => {
      try {
        const result = await this.api.generateInteractiveVisualization(req.params.format);

        if (req.params.format === 'json') {
          res.json(result);
        } else {
          res.type('text/plain').send(result.visualization.diagram);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Validation API running on port ${port}`);
    });
  }
}

// Usage
const api = new ValidationAPI();
api.start(3000);
```

### GraphQL Integration

Create a GraphQL schema for the validation system:

```javascript
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLBoolean } = require('graphql');
const { TaskManagerAPI } = require('./taskmanager-api');

const api = new TaskManagerAPI();

// Define GraphQL types
const DependencyType = new GraphQLObjectType({
  name: 'Dependency',
  fields: {
    criterion: { type: GraphQLString },
    description: { type: GraphQLString },
    estimatedDuration: { type: GraphQLString },
    parallelizable: { type: GraphQLBoolean },
    resourceRequirements: { type: new GraphQLList(GraphQLString) }
  }
});

const ExecutionPlanType = new GraphQLObjectType({
  name: 'ExecutionPlan',
  fields: {
    totalWaves: { type: GraphQLString },
    estimatedTotalDuration: { type: GraphQLString },
    parallelizationGain: { type: GraphQLString },
    recommendations: { type: new GraphQLList(GraphQLString) }
  }
});

// Define schema
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      dependencies: {
        type: new GraphQLList(DependencyType),
        resolve: async () => {
          const result = await api.getValidationDependencies();
          return Object.values(result.dependencies);
        }
      },
      executionPlan: {
        type: ExecutionPlanType,
        resolve: async () => {
          const result = await api.generateValidationExecutionPlan();
          return result.parallelPlan;
        }
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      updateDependency: {
        type: DependencyType,
        args: {
          criterion: { type: GraphQLString },
          config: { type: GraphQLString } // JSON string
        },
        resolve: async (parent, args) => {
          const config = JSON.parse(args.config);
          const result = await api.updateValidationDependency(args.criterion, config);
          return result.dependencyConfig;
        }
      }
    }
  })
});

module.exports = schema;
```

## CLI Integration

### Custom CLI Tool

Create a custom CLI wrapper:

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const { TaskManagerAPI } = require('./taskmanager-api');

const program = new Command();
const api = new TaskManagerAPI();

program
  .name('validation-cli')
  .description('Custom validation dependency management CLI')
  .version('1.0.0');

program
  .command('plan')
  .description('Generate execution plan')
  .option('-c, --criteria <criteria>', 'Comma-separated list of criteria')
  .option('-m, --max-concurrency <number>', 'Maximum concurrency', '4')
  .action(async (options) => {
    try {
      const criteria = options.criteria ? options.criteria.split(',') : null;
      const result = await api.generateValidationExecutionPlan(criteria, parseInt(options.maxConcurrency));

      console.log(`\\n📋 Execution Plan:`);
      console.log(`   Waves: ${result.parallelPlan.totalWaves}`);
      console.log(`   Estimated time: ${(result.parallelPlan.estimatedTotalDuration / 1000).toFixed(1)}s`);
      console.log(`   Efficiency gain: ${result.parallelPlan.parallelizationGain.toFixed(1)}%`);
      console.log(`   Average concurrency: ${result.parallelPlan.efficiency.averageConcurrency.toFixed(1)}`);

      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`\\n💡 Recommendations:`);
        result.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('visualize')
  .description('Generate visualization')
  .option('-f, --format <format>', 'Output format (ascii, mermaid, graphviz)', 'ascii')
  .action(async (options) => {
    try {
      const result = await api.generateInteractiveVisualization(options.format);
      console.log(result.visualization.diagram);
      console.log(`\\n💡 ${result.visualization.instructions}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('execute')
  .description('Execute validation plan')
  .option('-c, --criteria <criteria>', 'Comma-separated list of criteria')
  .option('-t, --timeout <ms>', 'Timeout in milliseconds', '300000')
  .action(async (options) => {
    try {
      const criteria = options.criteria ? options.criteria.split(',') : null;

      console.log('🚀 Starting validation execution...\\n');

      const result = await api.executeParallelValidation(criteria, {
        timeout: parseInt(options.timeout),
        callbacks: {
          onWaveStart: (info) => console.log(`📦 Wave ${info.wave}: ${info.concurrency} parallel tasks`),
          onCriterionComplete: (info) => {
            const emoji = info.status === 'success' ? '✅' : '❌';
            console.log(`${emoji} ${info.criterion} (${info.duration}ms)`);
          },
          onError: (info) => console.log(`❌ ${info.criterion}: ${info.error}`)
        }
      });

      console.log(`\\n🎯 Execution ${result.success ? 'completed successfully' : 'failed'}`);
      if (result.success && result.executionResult.summary) {
        const summary = result.executionResult.summary;
        console.log(`   Total time: ${(summary.totalDuration / 1000).toFixed(1)}s`);
        console.log(`   Success rate: ${(summary.successfulCriteria / summary.totalCriteria * 100).toFixed(1)}%`);
        console.log(`   Parallelization gain: ${summary.parallelizationGain.toFixed(1)}%`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

### Shell Integration

Create shell functions for easy access:

```bash
# ~/.bashrc or ~/.zshrc

# Validation dependency management functions
validation_plan() {
  node /path/to/validation-cli plan "$@"
}

validation_visualize() {
  node /path/to/validation-cli visualize "$@"
}

validation_execute() {
  node /path/to/validation-cli execute "$@"
}

# Auto-completion (bash)
_validation_complete() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local commands="plan visualize execute"
  COMPREPLY=($(compgen -W "${commands}" -- ${cur}))
}
complete -F _validation_complete validation_plan validation_visualize validation_execute
```

## Custom Validation Workflows

### Example: Frontend Build Pipeline

```javascript
const { ValidationDependencyManager } = require('./lib/validation-dependency-manager');

class FrontendPipeline {
  constructor() {
    this.manager = new ValidationDependencyManager();
    this.setupPipeline();
  }

  setupPipeline() {
    // Environment setup
    this.manager.addDependency('env-setup', {
      dependencies: [],
      description: 'Setup Node.js environment and dependencies',
      estimatedDuration: 30000,
      parallelizable: true,
      resourceRequirements: ['filesystem', 'network']
    });

    // Code quality checks (can run in parallel after setup)
    this.manager.addDependency('eslint', {
      dependencies: [{ criterion: 'env-setup', type: 'strict' }],
      description: 'ESLint code quality check',
      estimatedDuration: 15000,
      parallelizable: true,
      resourceRequirements: ['filesystem']
    });

    this.manager.addDependency('typescript', {
      dependencies: [{ criterion: 'env-setup', type: 'strict' }],
      description: 'TypeScript type checking',
      estimatedDuration: 20000,
      parallelizable: true,
      resourceRequirements: ['filesystem', 'cpu']
    });

    this.manager.addDependency('stylelint', {
      dependencies: [{ criterion: 'env-setup', type: 'strict' }],
      description: 'CSS/SCSS linting',
      estimatedDuration: 8000,
      parallelizable: true,
      resourceRequirements: ['filesystem']
    });

    // Unit tests (after code quality)
    this.manager.addDependency('unit-tests', {
      dependencies: [
        { criterion: 'eslint', type: 'strict' },
        { criterion: 'typescript', type: 'strict' }
      ],
      description: 'Jest unit tests',
      estimatedDuration: 45000,
      parallelizable: false,
      resourceRequirements: ['filesystem', 'cpu', 'memory']
    });

    // Build (after code quality)
    this.manager.addDependency('webpack-build', {
      dependencies: [
        { criterion: 'eslint', type: 'strict' },
        { criterion: 'typescript', type: 'strict' },
        { criterion: 'stylelint', type: 'weak' }
      ],
      description: 'Webpack production build',
      estimatedDuration: 60000,
      parallelizable: false,
      resourceRequirements: ['filesystem', 'cpu', 'memory']
    });

    // E2E tests (after build)
    this.manager.addDependency('e2e-tests', {
      dependencies: [
        { criterion: 'webpack-build', type: 'strict' },
        { criterion: 'unit-tests', type: 'weak' }
      ],
      description: 'Cypress E2E tests',
      estimatedDuration: 120000,
      parallelizable: false,
      resourceRequirements: ['filesystem', 'cpu', 'memory', 'network']
    });
  }

  async execute() {
    const plan = this.manager.generateParallelExecutionPlan();

    console.log('🏗️  Frontend Build Pipeline');
    console.log(`📊 ${plan.totalWaves} execution waves`);
    console.log(`⚡ ${plan.parallelizationGain.toFixed(1)}% efficiency gain\\n`);

    return await this.manager.executeParallelValidationPlan(plan, {
      onWaveStart: (info) => console.log(`🚀 Wave ${info.wave} (${info.concurrency} parallel)`),
      onCriterionComplete: (info) => {
        const duration = (info.duration / 1000).toFixed(1);
        console.log(`  ✅ ${info.criterion} (${duration}s)`);
      },
      onError: (info) => console.log(`  ❌ ${info.criterion}: ${info.error}`)
    });
  }
}

// Usage
const pipeline = new FrontendPipeline();
pipeline.execute().then(result => {
  console.log(`\\n🎯 Pipeline ${result.success ? 'succeeded' : 'failed'}`);
});
```

### Example: Microservices Validation

```javascript
class MicroservicesValidation {
  constructor(services) {
    this.manager = new ValidationDependencyManager();
    this.services = services;
    this.setupServicePipeline();
  }

  setupServicePipeline() {
    // Global setup
    this.manager.addDependency('global-setup', {
      dependencies: [],
      description: 'Global environment setup',
      estimatedDuration: 10000,
      parallelizable: true,
      resourceRequirements: ['filesystem']
    });

    // Per-service validation
    for (const service of this.services) {
      // Service-specific setup
      this.manager.addDependency(`${service}-setup`, {
        dependencies: [{ criterion: 'global-setup', type: 'strict' }],
        description: `Setup for ${service} service`,
        estimatedDuration: 8000,
        parallelizable: true,
        resourceRequirements: ['filesystem']
      });

      // Service linting
      this.manager.addDependency(`${service}-lint`, {
        dependencies: [{ criterion: `${service}-setup`, type: 'strict' }],
        description: `Lint ${service} service`,
        estimatedDuration: 12000,
        parallelizable: true,
        resourceRequirements: ['filesystem']
      });

      // Service unit tests
      this.manager.addDependency(`${service}-unit-tests`, {
        dependencies: [{ criterion: `${service}-lint`, type: 'strict' }],
        description: `Unit tests for ${service} service`,
        estimatedDuration: 25000,
        parallelizable: true,
        resourceRequirements: ['filesystem', 'cpu']
      });

      // Service build
      this.manager.addDependency(`${service}-build`, {
        dependencies: [{ criterion: `${service}-unit-tests`, type: 'strict' }],
        description: `Build ${service} service`,
        estimatedDuration: 30000,
        parallelizable: true,
        resourceRequirements: ['filesystem', 'cpu']
      });
    }

    // Integration tests (after all services are built)
    const serviceBuildDeps = this.services.map(service => ({
      criterion: `${service}-build`,
      type: 'strict'
    }));

    this.manager.addDependency('integration-tests', {
      dependencies: serviceBuildDeps,
      description: 'Cross-service integration tests',
      estimatedDuration: 90000,
      parallelizable: false,
      resourceRequirements: ['filesystem', 'cpu', 'memory', 'network']
    });
  }

  async execute() {
    // Generate adaptive plan based on available resources
    const systemInfo = {
      availableCPUs: require('os').cpus().length,
      availableMemory: require('os').freemem(),
      networkLatency: 15,
      diskIOLoad: 0.4
    };

    const plan = this.manager.generateAdaptiveExecutionPlan(null, systemInfo);

    console.log('🔧 Microservices Validation Pipeline');
    console.log(`📊 Services: ${this.services.join(', ')}`);
    console.log(`📊 ${plan.totalWaves} execution waves`);
    console.log(`⚡ ${plan.parallelizationGain.toFixed(1)}% efficiency gain\\n`);

    return await this.manager.executeParallelValidationPlan(plan, {
      onWaveStart: (info) => {
        console.log(`🚀 Wave ${info.wave}: ${info.criteria.join(', ')}`);
      },
      onCriterionComplete: (info) => {
        const duration = (info.duration / 1000).toFixed(1);
        console.log(`  ✅ ${info.criterion} (${duration}s)`);
      }
    });
  }
}

// Usage
const validation = new MicroservicesValidation(['auth', 'user', 'payment', 'notification']);
validation.execute();
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/validation.yml
name: Validation Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      execution-plan: ${{ steps.plan.outputs.plan }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Generate Execution Plan
        id: plan
        run: |
          PLAN=$(node taskmanager-api.js generate-validation-execution-plan)
          echo "plan=$(echo $PLAN | jq -c)" >> $GITHUB_OUTPUT

      - name: Validate Dependencies
        run: |
          VALIDATION=$(node taskmanager-api.js validate-dependency-graph)
          if [[ $(echo $VALIDATION | jq -r '.validation.valid') != "true" ]]; then
            echo "❌ Dependency validation failed"
            echo $VALIDATION | jq '.validation.issues'
            exit 1
          fi

  execute-validation:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - wave: 0
          - wave: 1
          - wave: 2
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Execute Wave ${{ matrix.wave }}
        run: |
          # Extract criteria for this wave from execution plan
          CRITERIA=$(echo '${{ needs.setup.outputs.execution-plan }}' | jq -r ".parallelPlan.plan[${{ matrix.wave }}].criteria[].criterion" | tr '\\n' ',' | sed 's/,$//')

          if [ ! -z "$CRITERIA" ]; then
            echo "🚀 Executing wave ${{ matrix.wave }}: $CRITERIA"
            node taskmanager-api.js execute-parallel-validation "[$CRITERIA]"
          fi

  report:
    needs: [setup, execute-validation]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Generate Analysis Report
        run: |
          node taskmanager-api.js generate-dependency-analysis-report > validation-report.json

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
    }

    stages {
        stage('Setup') {
            steps {
                nodejs(nodeJSInstallationName: env.NODE_VERSION) {
                    sh 'npm install'
                }
            }
        }

        stage('Generate Execution Plan') {
            steps {
                nodejs(nodeJSInstallationName: env.NODE_VERSION) {
                    script {
                        def planResult = sh(
                            script: 'node taskmanager-api.js generate-validation-execution-plan',
                            returnStdout: true
                        ).trim()

                        def plan = readJSON text: planResult
                        env.TOTAL_WAVES = plan.parallelPlan.totalWaves.toString()
                        env.EFFICIENCY_GAIN = plan.parallelPlan.parallelizationGain.toString()

                        echo "📊 Execution Plan: ${env.TOTAL_WAVES} waves, ${env.EFFICIENCY_GAIN}% efficiency"
                    }
                }
            }
        }

        stage('Validate Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: env.NODE_VERSION) {
                    script {
                        def validationResult = sh(
                            script: 'node taskmanager-api.js validate-dependency-graph',
                            returnStdout: true
                        ).trim()

                        def validation = readJSON text: validationResult
                        if (!validation.validation.valid) {
                            error("❌ Dependency validation failed: ${validation.validation.issues}")
                        }
                        echo "✅ Dependency graph is valid"
                    }
                }
            }
        }

        stage('Execute Validation Waves') {
            steps {
                nodejs(nodeJSInstallationName: env.NODE_VERSION) {
                    script {
                        for (int wave = 0; wave < env.TOTAL_WAVES.toInteger(); wave++) {
                            echo "🚀 Executing wave ${wave}"
                            sh "node taskmanager-api.js execute-wave ${wave}"
                        }
                    }
                }
            }
        }

        stage('Generate Report') {
            steps {
                nodejs(nodeJSInstallationName: env.NODE_VERSION) {
                    sh 'node taskmanager-api.js generate-dependency-analysis-report > validation-report.json'
                    archiveArtifacts artifacts: 'validation-report.json', fingerprint: true
                }
            }
        }
    }

    post {
        always {
            nodejs(nodeJSInstallationName: env.NODE_VERSION) {
                sh '''
                    echo "📈 Final Statistics:"
                    node taskmanager-api.js get-validation-dependencies | jq '.analytics'
                '''
            }
        }

        failure {
            echo "❌ Validation pipeline failed"
            // Send notifications, create issues, etc.
        }

        success {
            echo "✅ Validation pipeline succeeded with ${env.EFFICIENCY_GAIN}% efficiency gain"
        }
    }
}
```

## Performance Optimization

### System Resource Optimization

```javascript
const os = require('os');

class OptimizedValidationRunner {
  constructor() {
    this.manager = new ValidationDependencyManager();
    this.systemInfo = this.gatherSystemInfo();
  }

  gatherSystemInfo() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      availableCPUs: cpus.length,
      cpuModel: cpus[0].model,
      totalMemory,
      availableMemory: freeMemory,
      memoryUtilization: (totalMemory - freeMemory) / totalMemory,
      platform: os.platform(),
      networkLatency: 10, // Could be measured dynamically
      diskIOLoad: 0.3     // Could be measured dynamically
    };
  }

  calculateOptimalConcurrency() {
    const { availableCPUs, memoryUtilization } = this.systemInfo;

    // Base concurrency on CPU count
    let concurrency = Math.max(1, Math.floor(availableCPUs * 0.8));

    // Reduce if memory is highly utilized
    if (memoryUtilization > 0.8) {
      concurrency = Math.max(1, Math.floor(concurrency * 0.6));
    }

    // Cap at reasonable maximum
    return Math.min(concurrency, 8);
  }

  async executeWithOptimization() {
    const optimalConcurrency = this.calculateOptimalConcurrency();

    console.log('🖥️  System Optimization:');
    console.log(`   CPUs: ${this.systemInfo.availableCPUs}`);
    console.log(`   Memory: ${(this.systemInfo.availableMemory / 1024 / 1024 / 1024).toFixed(1)}GB available`);
    console.log(`   Optimal concurrency: ${optimalConcurrency}\\n`);

    const plan = this.manager.generateAdaptiveExecutionPlan(null, this.systemInfo);

    // Apply system-specific optimizations
    if (this.systemInfo.memoryUtilization > 0.7) {
      console.log('⚠️  High memory usage detected - staggering memory-intensive tasks');
    }

    return await this.manager.executeParallelValidationPlan(plan, {
      maxRetries: this.systemInfo.platform === 'win32' ? 3 : 2, // Windows might need more retries
      timeout: this.systemInfo.availableCPUs < 4 ? 600000 : 300000 // Longer timeout for slower systems
    });
  }
}
```

### Caching and Incremental Execution

```javascript
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class CachedValidationRunner {
  constructor() {
    this.manager = new ValidationDependencyManager();
    this.cacheDir = path.join(process.cwd(), '.validation-cache');
    this.ensureCacheDir();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  // Generate cache key based on file checksums and dependency config
  async generateCacheKey(criterion) {
    const dependency = this.manager.getDependency(criterion);
    if (!dependency) return null;

    // Get file checksums for filesystem-dependent validations
    const checksums = [];
    if (dependency.metadata.resourceRequirements?.includes('filesystem')) {
      // Add relevant file checksums (simplified example)
      try {
        const packageJson = await fs.readFile('package.json', 'utf8');
        checksums.push(crypto.createHash('md5').update(packageJson).digest('hex'));
      } catch (error) {
        // File doesn't exist
      }
    }

    // Include dependency configuration in cache key
    const configString = JSON.stringify(dependency);
    const configHash = crypto.createHash('md5').update(configString).digest('hex');

    return crypto.createHash('md5')
      .update([configHash, ...checksums].join(''))
      .digest('hex');
  }

  async getCachedResult(criterion) {
    const cacheKey = await this.generateCacheKey(criterion);
    if (!cacheKey) return null;

    try {
      const cacheFile = path.join(this.cacheDir, `${criterion}-${cacheKey}.json`);
      const cachedData = await fs.readFile(cacheFile, 'utf8');
      const result = JSON.parse(cachedData);

      // Check if cache is still valid (within 1 hour)
      const age = Date.now() - new Date(result.timestamp).getTime();
      if (age < 3600000) { // 1 hour
        return result.data;
      }
    } catch (error) {
      // Cache miss
    }

    return null;
  }

  async setCachedResult(criterion, result) {
    const cacheKey = await this.generateCacheKey(criterion);
    if (!cacheKey) return;

    const cacheData = {
      timestamp: new Date().toISOString(),
      data: result
    };

    try {
      const cacheFile = path.join(this.cacheDir, `${criterion}-${cacheKey}.json`);
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn(`Failed to cache result for ${criterion}:`, error.message);
    }
  }

  async executeWithCaching() {
    // Override execution method to use caching
    const originalExecute = this.manager._executeCriterion;

    this.manager._executeCriterion = async (criterion, options) => {
      // Check cache first
      const cachedResult = await this.getCachedResult(criterion);
      if (cachedResult) {
        console.log(`📦 Using cached result for ${criterion}`);
        return cachedResult;
      }

      // Execute and cache result
      const result = await originalExecute.call(this.manager, criterion, options);
      await this.setCachedResult(criterion, result);

      return result;
    };

    const plan = this.manager.generateParallelExecutionPlan();
    const result = await this.manager.executeParallelValidationPlan(plan);

    // Restore original method
    this.manager._executeCriterion = originalExecute;

    return result;
  }
}
```

## Monitoring and Debugging

### Comprehensive Monitoring Setup

```javascript
class ValidationMonitor {
  constructor() {
    this.manager = new ValidationDependencyManager();
    this.metrics = {
      executionTimes: new Map(),
      resourceUtilization: new Map(),
      errorRates: new Map(),
      concurrencyLevels: [],
      systemLoad: []
    };
  }

  startMonitoring() {
    // Monitor system resources during execution
    this.systemMonitor = setInterval(() => {
      const usage = process.cpuUsage();
      const memUsage = process.memoryUsage();

      this.metrics.systemLoad.push({
        timestamp: Date.now(),
        cpu: usage,
        memory: memUsage,
        uptime: process.uptime()
      });
    }, 1000);
  }

  stopMonitoring() {
    if (this.systemMonitor) {
      clearInterval(this.systemMonitor);
    }
  }

  async executeWithMonitoring(criteria = null) {
    this.startMonitoring();

    const plan = this.manager.generateParallelExecutionPlan(criteria);

    const result = await this.manager.executeParallelValidationPlan(plan, {
      onWaveStart: (info) => {
        this.metrics.concurrencyLevels.push({
          wave: info.wave,
          concurrency: info.concurrency,
          timestamp: Date.now()
        });
        console.log(`📊 Wave ${info.wave}: ${info.concurrency} parallel tasks`);
      },

      onCriterionStart: (info) => {
        this.metrics.executionTimes.set(info.criterion, {
          startTime: Date.now(),
          estimatedDuration: info.estimatedDuration
        });
      },

      onCriterionComplete: (info) => {
        const timing = this.metrics.executionTimes.get(info.criterion);
        if (timing) {
          timing.actualDuration = info.duration;
          timing.accuracy = Math.abs(timing.estimatedDuration - info.duration) / timing.estimatedDuration;
        }

        // Track resource utilization
        const dependency = this.manager.getDependency(info.criterion);
        if (dependency) {
          for (const resource of dependency.metadata.resourceRequirements || []) {
            if (!this.metrics.resourceUtilization.has(resource)) {
              this.metrics.resourceUtilization.set(resource, []);
            }
            this.metrics.resourceUtilization.get(resource).push({
              criterion: info.criterion,
              duration: info.duration,
              timestamp: Date.now()
            });
          }
        }
      },

      onError: (info) => {
        if (!this.metrics.errorRates.has(info.criterion)) {
          this.metrics.errorRates.set(info.criterion, [];
        }
        this.metrics.errorRates.get(info.criterion).push({
          error: info.error,
          timestamp: Date.now(),
          wave: info.wave
        });
      }
    });

    this.stopMonitoring();

    return {
      executionResult: result,
      metrics: this.generateMetricsReport()
    };
  }

  generateMetricsReport() {
    const report = {
      timing: {
        totalCriteria: this.metrics.executionTimes.size,
        averageAccuracy: 0,
        slowestCriteria: [],
        fastestCriteria: []
      },
      resources: {
        utilization: Object.fromEntries(this.metrics.resourceUtilization),
        contention: []
      },
      errors: {
        totalErrors: Array.from(this.metrics.errorRates.values()).flat().length,
        errorsByType: {}
      },
      system: {
        peakMemoryUsage: 0,
        averageCPUUsage: 0,
        executionTimeVsSystemLoad: []
      }
    };

    // Calculate timing metrics
    const timings = Array.from(this.metrics.executionTimes.values());
    if (timings.length > 0) {
      report.timing.averageAccuracy = timings.reduce((sum, t) => sum + (t.accuracy || 0), 0) / timings.length;

      const sortedByDuration = timings.sort((a, b) => (b.actualDuration || 0) - (a.actualDuration || 0));
      report.timing.slowestCriteria = sortedByDuration.slice(0, 3);
      report.timing.fastestCriteria = sortedByDuration.slice(-3).reverse();
    }

    // Calculate resource contention
    for (const [resource, usage] of this.metrics.resourceUtilization.entries()) {
      if (usage.length > 1) {
        // Check for overlapping usage times
        const overlaps = usage.filter((u1, i) =>
          usage.slice(i + 1).some(u2 =>
            Math.abs(u1.timestamp - u2.timestamp) < u1.duration
          )
        );
        if (overlaps.length > 0) {
          report.resources.contention.push({
            resource,
            overlappingTasks: overlaps.length,
            severity: overlaps.length > 2 ? 'high' : 'medium'
          });
        }
      }
    }

    // Calculate system metrics
    if (this.metrics.systemLoad.length > 0) {
      const memoryUsages = this.metrics.systemLoad.map(s => s.memory.heapUsed);
      report.system.peakMemoryUsage = Math.max(...memoryUsages);

      // CPU usage calculation would need more sophisticated tracking
      report.system.averageCPUUsage = 0; // Placeholder
    }

    return report;
  }

  exportMetrics(format = 'json') {
    const report = this.generateMetricsReport();

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'csv':
        // Convert to CSV format for Excel analysis
        const csvLines = ['Criterion,Duration,Estimated,Accuracy,Resources'];
        for (const [criterion, timing] of this.metrics.executionTimes.entries()) {
          const dependency = this.manager.getDependency(criterion);
          const resources = dependency?.metadata.resourceRequirements?.join(';') || '';
          csvLines.push([
            criterion,
            timing.actualDuration || 0,
            timing.estimatedDuration || 0,
            ((timing.accuracy || 0) * 100).toFixed(1) + '%',
            resources
          ].join(','));
        }
        return csvLines.join('\\n');

      case 'summary':
        return this.generateSummaryReport(report);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  generateSummaryReport(report) {
    return [
      '📊 Validation Execution Summary',
      '=' * 40,
      '',
      `🕒 Timing:`,
      `   Total criteria: ${report.timing.totalCriteria}`,
      `   Average accuracy: ${(report.timing.averageAccuracy * 100).toFixed(1)}%`,
      `   Slowest: ${report.timing.slowestCriteria[0]?.criterion || 'N/A'}`,
      '',
      `🔧 Resources:`,
      `   Resource types used: ${Object.keys(report.resources.utilization).length}`,
      `   Contentions detected: ${report.resources.contention.length}`,
      '',
      `❌ Errors:`,
      `   Total errors: ${report.errors.totalErrors}`,
      '',
      `💻 System:`,
      `   Peak memory: ${(report.system.peakMemoryUsage / 1024 / 1024).toFixed(1)}MB`,
      `   Average CPU: ${report.system.averageCPUUsage.toFixed(1)}%`,
      ''
    ].join('\\n');
  }
}

// Usage
const monitor = new ValidationMonitor();
monitor.executeWithMonitoring().then(result => {
  console.log('\\n📈 Execution Metrics:');
  console.log(monitor.exportMetrics('summary'));

  // Export detailed data for analysis
  require('fs').writeFileSync('validation-metrics.json', monitor.exportMetrics('json'));
  require('fs').writeFileSync('validation-metrics.csv', monitor.exportMetrics('csv'));
});
```

## Best Practices

### 1. Dependency Design

- **Use appropriate dependency types**:
  - `STRICT` for critical dependencies that must succeed
  - `WEAK` for preferred but non-blocking dependencies
  - `OPTIONAL` for nice-to-have dependencies

- **Minimize dependency chains**:
  - Avoid deeply nested dependencies
  - Use parallel structures where possible
  - Consider breaking long chains into smaller segments

### 2. Resource Management

- **Define accurate resource requirements**:
  ```javascript
  // Good: Specific resources
  resourceRequirements: ['filesystem', 'cpu']

  // Avoid: Generic or missing resources
  resourceRequirements: ['filesystem', 'network', 'cpu', 'memory', 'ports']
  ```

- **Estimate durations realistically**:
  - Use historical data when available
  - Account for system variability
  - Update estimates based on actual performance

### 3. Error Handling

- **Design for failure**:
  ```javascript
  // Use weak dependencies for non-critical validations
  dependencies: [
    { criterion: 'linter-validation', type: 'strict' },
    { criterion: 'optional-check', type: 'weak' }
  ]
  ```

- **Implement retry logic**:
  ```javascript
  const result = await manager.executeParallelValidationPlan(plan, {
    maxRetries: 2,
    timeout: 300000
  });
  ```

### 4. Performance Optimization

- **Use adaptive planning**:
  ```javascript
  const systemInfo = {
    availableCPUs: os.cpus().length,
    availableMemory: os.freemem(),
    networkLatency: await measureNetworkLatency(),
    diskIOLoad: await measureDiskLoad()
  };

  const plan = manager.generateAdaptiveExecutionPlan(null, systemInfo);
  ```

- **Monitor and tune**:
  - Track actual vs estimated durations
  - Adjust concurrency based on system performance
  - Use caching for expensive operations

### 5. Visualization and Debugging

- **Use visualization for understanding**:
  ```bash
  # Quick ASCII overview
  node taskmanager-api.js generate-interactive-visualization ascii

  # Detailed analysis
  node taskmanager-api.js generate-dependency-analysis-report
  ```

- **Regular dependency audits**:
  ```bash
  # Check for issues
  node taskmanager-api.js validate-dependency-graph

  # Look for optimization opportunities
  node taskmanager-api.js generate-dependency-analysis-report | jq '.report.recommendations'
  ```

## Migration Guide

### From Manual Validation Scripts

If you currently use manual validation scripts:

1. **Inventory existing validations**:
   ```bash
   # List current validation commands
   grep -r "npm run" package.json
   grep -r "yarn" package.json
   ```

2. **Define dependencies**:
   ```javascript
   // Convert sequential script to dependency definition
   // Old: npm run lint && npm run test && npm run build

   manager.addDependency('lint', { dependencies: [] });
   manager.addDependency('test', {
     dependencies: [{ criterion: 'lint', type: 'strict' }]
   });
   manager.addDependency('build', {
     dependencies: [{ criterion: 'test', type: 'strict' }]
   });
   ```

3. **Add parallel opportunities**:
   ```javascript
   // Identify independent validations that can run in parallel
   manager.addDependency('eslint', { dependencies: [] });
   manager.addDependency('typescript', { dependencies: [] });
   manager.addDependency('stylelint', { dependencies: [] });

   // All can run in parallel, then build depends on all
   manager.addDependency('build', {
     dependencies: [
       { criterion: 'eslint', type: 'strict' },
       { criterion: 'typescript', type: 'strict' },
       { criterion: 'stylelint', type: 'weak' }
     ]
   });
   ```

### From Other Task Runners

#### From Gulp

```javascript
// Old Gulp task
gulp.task('validate', gulp.series(
  'lint',
  gulp.parallel('test', 'typecheck'),
  'build'
));

// New dependency definition
manager.addDependency('lint', { dependencies: [] });
manager.addDependency('test', {
  dependencies: [{ criterion: 'lint', type: 'strict' }]
});
manager.addDependency('typecheck', {
  dependencies: [{ criterion: 'lint', type: 'strict' }]
});
manager.addDependency('build', {
  dependencies: [
    { criterion: 'test', type: 'strict' },
    { criterion: 'typecheck', type: 'strict' }
  ]
});
```

#### From Webpack/Rollup

```javascript
// Webpack with multiple entry points
// Can be parallelized by component

const components = ['header', 'footer', 'sidebar', 'main'];

for (const component of components) {
  manager.addDependency(`build-${component}`, {
    dependencies: [{ criterion: 'lint', type: 'strict' }],
    parallelizable: true,
    resourceRequirements: ['filesystem', 'cpu']
  });
}

manager.addDependency('bundle', {
  dependencies: components.map(c => ({
    criterion: `build-${c}`,
    type: 'strict'
  })),
  parallelizable: false
});
```

### Gradual Migration Strategy

1. **Phase 1: Assessment**
   - Map current validation workflow
   - Identify dependencies and parallelization opportunities
   - Estimate duration and resource requirements

2. **Phase 2: Parallel Implementation**
   - Run old and new systems in parallel
   - Compare results and performance
   - Fine-tune configurations

3. **Phase 3: Full Migration**
   - Replace old system with new dependency management
   - Update CI/CD pipelines
   - Train team on new tools and workflows

4. **Phase 4: Optimization**
   - Analyze execution metrics
   - Optimize dependency relationships
   - Implement advanced features (caching, adaptive planning)

This comprehensive integration guide should help you successfully implement the Validation Dependency Management system in your projects, whether you're starting fresh or migrating from existing validation workflows.