# Agent Integration Guide for RAG System

## 🤖 Overview

This guide provides comprehensive instructions for AI agents to integrate with the RAG (Retrieval-Augmented Generation) system for lessons and error management. The RAG system enables agents to store, retrieve, and learn from past experiences automatically.

## 🔧 Core Integration

### TaskManager API Integration

The RAG system integrates seamlessly with the existing TaskManager API. All RAG operations are available through the same interface agents already use.

```javascript
// RAG operations are available on the TaskManager API instance
const taskManagerAPI = new TaskManagerAPI();

// Store a lesson automatically during task execution
await taskManagerAPI.storeLesson({
  title: "Authentication fix for JWT token refresh",
  content: "When users experience login failures...",
  category: "errors",
  context: { taskId, projectPath, files: ["src/auth.js"] }
});

// Search for relevant lessons before starting a task
const relevantLessons = await taskManagerAPI.searchLessons(
  "authentication login problems",
  { category: "errors", limit: 5 }
);
```

## 📋 Agent Workflow Integration

### Pre-Task Preparation Protocol

**UPDATED WORKFLOW** - Replace existing lesson scanning with RAG queries:

```bash
# 1. Initialize TaskManager (existing)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js init

# 2. Query relevant lessons for task context (NEW)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "$(echo $TASK_DESCRIPTION)"

# 3. Check for similar errors if task is error-type (NEW)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-similar-errors "$(echo $ERROR_DESCRIPTION)"

# 4. Continue with existing workflow
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js claim $TASK_ID $AGENT_ID
```

### During Task Execution

**Automatic Lesson Storage** - Store insights as they're discovered:

```javascript
// Example: Agent discovers a solution during error fixing
async function handleLinterError(errorDetails) {
  // Implement the fix
  const solution = await fixLinterError(errorDetails);

  // Automatically store the lesson for future reference
  await taskManagerAPI.storeLesson({
    title: `Fix ${errorDetails.rule} violation in ${errorDetails.file}`,
    content: `Solution: ${solution.description}\n\nPrevention: ${solution.preventionStrategy}`,
    category: "errors",
    tags: ["linter", errorDetails.rule, errorDetails.fileType],
    context: {
      taskId: currentTaskId,
      errorType: errorDetails.rule,
      file: errorDetails.file,
      line: errorDetails.line
    },
    metadata: {
      difficulty: "low",
      timeToResolve: solution.timeSpent,
      successfulSolution: true
    }
  });

  return solution;
}
```

### Post-Task Completion

**Enhanced Completion Protocol**:

```javascript
async function completeTaskWithLearning(taskId, completionData) {
  // Store completion lesson
  await taskManagerAPI.storeLesson({
    title: `Task completion: ${task.title}`,
    content: createLessonFromCompletion(task, completionData),
    category: determineCategoryFromTask(task),
    context: {
      taskId,
      duration: task.completionTime,
      approach: completionData.approach,
      challenges: completionData.challenges
    }
  });

  // Complete task using existing API
  return await taskManagerAPI.completeTask(taskId, completionData);
}
```

## 🔍 Lesson Retrieval Patterns

### Context-Aware Lesson Queries

**Smart Query Construction**:

```javascript
async function getRelevantLessons(taskContext) {
  const queryStrategies = [
    // 1. Exact error matching for error tasks
    taskContext.category === 'error' ? {
      query: taskContext.errorMessage,
      options: { category: 'errors', similarityThreshold: 0.8 }
    } : null,

    // 2. Technology stack matching
    {
      query: `${taskContext.technology} ${taskContext.domain}`,
      options: { tags: taskContext.tags, limit: 3 }
    },

    // 3. Similar file patterns
    {
      query: taskContext.files?.join(' ') || '',
      options: { projectPath: taskContext.projectPath, limit: 2 }
    }
  ].filter(Boolean);

  const allLessons = [];
  for (const strategy of queryStrategies) {
    const lessons = await taskManagerAPI.searchLessons(strategy.query, strategy.options);
    allLessons.push(...lessons.results);
  }

  return deduplicateAndRank(allLessons);
}
```

### Intelligent Context Building

**Pre-Task Analysis**:

```javascript
async function buildTaskContext(task) {
  // Extract context from task
  const baseContext = {
    taskId: task.id,
    category: task.category,
    title: task.title,
    description: task.description
  };

  // Enhance with relevant lessons
  const relevantLessons = await getRelevantLessons(baseContext);

  // Get error patterns if applicable
  const errorPatterns = task.category === 'error'
    ? await taskManagerAPI.findSimilarErrors(task.description)
    : [];

  return {
    ...baseContext,
    relevantLessons,
    errorPatterns,
    recommendedApproach: synthesizeApproach(relevantLessons, errorPatterns)
  };
}
```

## 🎯 Agent-Specific Integration Patterns

### Development Agent Integration

```javascript
class DevelopmentAgent {
  async startTask(taskId) {
    // Get enhanced task context
    const task = await this.taskManager.getTask(taskId);
    const context = await buildTaskContext(task);

    // Apply lessons learned
    this.applyLessonsToStrategy(context.relevantLessons);

    // Begin implementation with context
    return this.implementWithContext(task, context);
  }

  async applyLessonsToStrategy(lessons) {
    for (const lesson of lessons) {
      if (lesson.metadata.effectiveness > 0.8) {
        this.incorporatePattern(lesson.content, lesson.context);
      }
    }
  }

  async storeImplementationLesson(task, solution) {
    return await this.taskManager.storeLesson({
      title: `Implementation: ${task.title}`,
      content: this.documentSolution(solution),
      category: "features",
      tags: this.extractTags(task, solution),
      context: {
        taskId: task.id,
        approach: solution.approach,
        timeSpent: solution.duration,
        filesModified: solution.files
      },
      metadata: {
        difficulty: this.assessDifficulty(task),
        effectiveness: 1.0, // Will be updated based on feedback
        reusable: this.isReusableSolution(solution)
      }
    });
  }
}
```

### Error Resolution Agent Integration

```javascript
class ErrorResolutionAgent {
  async resolveError(errorTask) {
    // Check for known error patterns first
    const similarErrors = await this.taskManager.findSimilarErrors(
      errorTask.description,
      { resolved: true, limit: 5 }
    );

    if (similarErrors.length > 0) {
      // Try proven solutions first
      return this.applyKnownSolutions(errorTask, similarErrors);
    }

    // Fall back to investigation
    return this.investigateAndResolve(errorTask);
  }

  async applyKnownSolutions(errorTask, similarErrors) {
    for (const similarError of similarErrors) {
      try {
        const result = await this.applySolution(
          errorTask,
          similarError.solution
        );

        if (result.success) {
          // Store successful reapplication
          await this.storeSuccessfulReapplication(errorTask, similarError);
          return result;
        }
      } catch (error) {
        // Continue to next solution
        continue;
      }
    }

    // If no known solutions work, investigate
    return this.investigateAndResolve(errorTask);
  }

  async storeErrorResolution(errorTask, solution) {
    // Store both error and lesson
    await Promise.all([
      this.taskManager.storeError({
        title: errorTask.title,
        description: errorTask.description,
        errorType: this.classifyError(errorTask),
        context: {
          file: solution.file,
          line: solution.line,
          stackTrace: solution.stackTrace
        },
        solution: {
          description: solution.description,
          action: solution.action,
          preventionStrategy: solution.prevention
        },
        resolved: true
      }),

      this.taskManager.storeLesson({
        title: `Error Resolution: ${errorTask.title}`,
        content: this.createResolutionLesson(errorTask, solution),
        category: "errors",
        tags: this.extractErrorTags(errorTask, solution),
        context: { errorTaskId: errorTask.id }
      })
    ]);
  }
}
```

### Testing Agent Integration

```javascript
class TestingAgent {
  async runTestSuite(testTask) {
    // Get testing lessons and patterns
    const testingLessons = await this.taskManager.searchLessons(
      "testing best practices",
      { category: "patterns", tags: ["testing"] }
    );

    // Apply testing strategies from lessons
    const strategy = this.buildTestStrategy(testTask, testingLessons);

    const results = await this.executeTests(strategy);

    // Store testing insights
    await this.storeTestingLessons(testTask, strategy, results);

    return results;
  }

  async storeTestingLessons(testTask, strategy, results) {
    const insights = this.extractTestingInsights(strategy, results);

    return await this.taskManager.storeLesson({
      title: `Testing Strategy: ${testTask.title}`,
      content: this.documentTestingApproach(strategy, insights),
      category: "patterns",
      tags: ["testing", testTask.testType, ...strategy.techniques],
      context: {
        testType: testTask.testType,
        coverage: results.coverage,
        duration: results.duration
      },
      metadata: {
        effectiveness: results.passRate,
        reusable: this.isReusableStrategy(strategy)
      }
    });
  }
}
```

## 📊 Learning Analytics Integration

### Effectiveness Tracking

```javascript
async function trackLessonEffectiveness(lessonId, taskId, outcome) {
  // Update lesson effectiveness based on usage outcome
  const effectivenessUpdate = {
    timesAccessed: '+1',
    lastAccessed: new Date(),
    effectiveness: calculateNewEffectiveness(outcome)
  };

  await taskManagerAPI.updateLessonAnalytics(lessonId, effectivenessUpdate);

  // Store usage context for future analysis
  await taskManagerAPI.storeLessonUsage({
    lessonId,
    taskId,
    agentId: currentAgentId,
    outcome,
    context: { /* task-specific context */ }
  });
}
```

### Cross-Project Learning

```javascript
async function shareKnowledgeAcrossProjects(lesson) {
  // Determine if lesson is project-specific or universal
  const universality = assessLessonUniversality(lesson);

  if (universality.score > 0.7) {
    // Mark as cross-project applicable
    await taskManagerAPI.updateLesson(lesson.id, {
      metadata: {
        ...lesson.metadata,
        crossProject: true,
        universalityScore: universality.score
      }
    });
  }
}
```

## 🔄 Migration from File-Based Lessons

### Automatic Migration Integration

```javascript
async function migrateAgentLessons(agentId) {
  // Find agent's existing file-based lessons
  const lessonFiles = await findAgentLessonFiles(agentId);

  for (const file of lessonFiles) {
    try {
      const lesson = await parseFileLessonToRAG(file);
      await taskManagerAPI.storeLesson(lesson);

      // Archive original file
      await archiveOriginalLesson(file);
    } catch (error) {
      console.warn(`Failed to migrate lesson ${file}: ${error.message}`);
    }
  }
}
```

### Backward Compatibility

```javascript
async function getLessonsWithFallback(query, options = {}) {
  try {
    // Try RAG system first
    const ragResults = await taskManagerAPI.searchLessons(query, options);
    if (ragResults.results.length > 0) {
      return ragResults;
    }
  } catch (error) {
    console.warn('RAG search failed, falling back to file system');
  }

  // Fallback to file-based search
  return await searchFileLessons(query, options);
}
```

## 🎛️ Configuration and Customization

### Agent-Specific RAG Configuration

```javascript
class AgentRAGConfig {
  constructor(agentType, specialization) {
    this.config = {
      // Default similarity thresholds based on agent type
      similarityThreshold: this.getDefaultThreshold(agentType),

      // Preferred lesson categories
      preferredCategories: this.getPreferredCategories(specialization),

      // Learning aggressiveness (how much to store)
      learningRate: this.getLearningRate(agentType),

      // Context window size
      contextSize: this.getContextSize(agentType)
    };
  }

  getDefaultThreshold(agentType) {
    const thresholds = {
      'development': 0.75,
      'testing': 0.8,
      'research': 0.7,
      'debugging': 0.85
    };
    return thresholds[agentType] || 0.75;
  }

  // Apply configuration to RAG operations
  applyConfig(operation, options) {
    return {
      ...options,
      similarityThreshold: options.similarityThreshold || this.config.similarityThreshold,
      categories: options.categories || this.config.preferredCategories
    };
  }
}
```

## 🚨 Error Handling and Resilience

### Graceful Degradation

```javascript
async function ragOperationWithFallback(operation, fallback) {
  try {
    return await operation();
  } catch (error) {
    console.warn(`RAG operation failed: ${error.message}, using fallback`);
    return await fallback();
  }
}

// Example usage
const lessons = await ragOperationWithFallback(
  () => taskManagerAPI.searchLessons(query),
  () => searchFileLessons(query)
);
```

### Rate Limiting and Performance

```javascript
class RAGThrottler {
  constructor(maxOperationsPerMinute = 100) {
    this.operations = [];
    this.maxOps = maxOperationsPerMinute;
  }

  async throttle(operation) {
    // Remove operations older than 1 minute
    const now = Date.now();
    this.operations = this.operations.filter(op => now - op < 60000);

    if (this.operations.length >= this.maxOps) {
      // Wait before allowing operation
      await this.waitForSlot();
    }

    this.operations.push(now);
    return await operation();
  }
}
```

## 📚 Best Practices for Agents

### 1. Lesson Quality Guidelines

- **Be Specific**: Include exact error messages, file paths, and solutions
- **Include Context**: Store relevant project information and file contexts
- **Document Approach**: Explain not just what was done, but why
- **Tag Effectively**: Use consistent, descriptive tags for better retrieval

### 2. Query Optimization

- **Use Natural Language**: RAG works best with descriptive queries
- **Combine Strategies**: Mix semantic search with traditional filters
- **Iterate Queries**: Refine searches based on initial results
- **Cache Results**: Store frequent query results locally

### 3. Learning Hygiene

- **Regular Updates**: Keep lesson effectiveness scores current
- **Clean Up**: Remove or archive outdated lessons
- **Cross-Reference**: Link related lessons and errors
- **Validate Solutions**: Confirm lessons remain applicable

### 4. Performance Considerations

- **Batch Operations**: Group multiple RAG operations when possible
- **Async Processing**: Don't block task execution on lesson storage
- **Cache Embeddings**: Reuse embeddings for similar content
- **Monitor Usage**: Track RAG operation performance

## 🔧 Debugging RAG Integration

### Common Issues and Solutions

```javascript
// Issue: Lessons not being found
async function debugLessonRetrieval(query) {
  console.log('Debugging lesson retrieval for:', query);

  // Check embedding generation
  const embedding = await generateEmbedding(query);
  console.log('Generated embedding dimensions:', embedding.length);

  // Check database connectivity
  const health = await taskManagerAPI.ragHealth();
  console.log('RAG system health:', health);

  // Try different similarity thresholds
  for (const threshold of [0.5, 0.6, 0.7, 0.8, 0.9]) {
    const results = await taskManagerAPI.searchLessons(query, {
      similarityThreshold: threshold,
      limit: 3
    });
    console.log(`Threshold ${threshold}: ${results.results.length} results`);
  }
}
```

---

*This integration guide provides comprehensive patterns for AI agents to effectively use the RAG system for enhanced learning and knowledge management.*