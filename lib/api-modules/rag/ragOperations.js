/**
 * RAG Operations Module for TaskManager API
 * Handles RAG-based lessons and error database operations
 * Integrates with existing TaskManager workflows
 */

const RAGDatabase = require('../../rag-database');
const RAGMigration = require('../../rag-migration');

class RAGOperations {
  constructor(dependencies) {
    this.taskManager = dependencies.taskManager;
    this.agentManager = dependencies.agentManager;
    this.withTimeout = dependencies.withTimeout;

    // Initialize RAG database
    this.ragDB = new RAGDatabase();
    this.initialized = false;
  }

  /**
   * Initialize RAG system if not already initialized
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      const result = await this.ragDB.initialize();
      this.initialized = result.success;
      if (!result.success) {
        throw new Error(`RAG system initialization failed: ${result.error}`);
      }
    }
  }

  /**
   * Store a lesson in the RAG database
   */
  async storeLesson(lessonData) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.ragDB.storeLesson(lessonData),
        10000,
      );

      return {
        success: true,
        lessonId: result.lessonId,
        embeddingId: result.embeddingId,
        message: 'Lesson stored successfully',
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        ragSystem: 'error',
      };
    }
  }

  /**
   * Store an error in the RAG database
   */
  async storeError(errorData) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.ragDB.storeError(errorData),
        10000,
      );

      return {
        success: true,
        errorId: result.errorId,
        embeddingId: result.embeddingId,
        message: 'Error stored successfully',
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        ragSystem: 'error',
      };
    }
  }

  /**
   * Search for lessons using semantic search
   */
  async searchLessons(query, options = {}) {
    try {
      await this._ensureInitialized();

      const {
        limit = 10,
        threshold = 0.7,
        category = null,
        projectPath = null,
      } = options;

      // Build enhanced query with filters
      let searchQuery = query;
      if (category) {searchQuery += ` category:${category}`;}
      if (projectPath) {searchQuery += ` project:${projectPath}`;}

      const result = await this.withTimeout(
        this.ragDB.searchLessons(searchQuery, limit, threshold),
        10000,
      );

      return {
        success: true,
        lessons: result.lessons || [],
        query: searchQuery,
        count: (result.lessons || []).length,
        message: result.message,
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        lessons: [],
        ragSystem: 'error',
      };
    }
  }

  /**
   * Find similar errors using semantic search
   */
  async findSimilarErrors(errorDescription, options = {}) {
    try {
      await this._ensureInitialized();

      const {
        limit = 5,
        threshold = 0.8,
        errorType = null,
        includeResolved = true,
      } = options;

      // Build enhanced query
      let searchQuery = errorDescription;
      if (errorType) {searchQuery += ` type:${errorType}`;}

      const result = await this.withTimeout(
        this.ragDB.searchErrors(searchQuery, limit, threshold),
        10000,
      );

      // Filter by resolution status if needed
      let errors = result.errors || [];
      if (!includeResolved) {
        errors = errors.filter(error => !error.resolution);
      }

      return {
        success: true,
        errors,
        query: searchQuery,
        count: errors.length,
        message: result.message,
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        errors: [],
        ragSystem: 'error',
      };
    }
  }

  /**
   * Get relevant lessons for a given task context
   * Used for pre-task preparation
   */
  async getRelevantLessons(taskContext, options = {}) {
    try {
      await this._ensureInitialized();

      const {
        includeErrors = true,
        lessonLimit = 5,
        errorLimit = 3,
      } = options;

      // Extract search query from task context
      const searchQuery = this._buildTaskSearchQuery(taskContext);

      // Search for lessons
      const lessonsResult = await this.ragDB.searchLessons(searchQuery, lessonLimit, 0.6);

      // Search for related errors if requested
      let errorsResult = { errors: [] };
      if (includeErrors) {
        errorsResult = await this.ragDB.searchErrors(searchQuery, errorLimit, 0.7);
      }

      return {
        success: true,
        taskContext: {
          title: taskContext.title,
          category: taskContext.category,
          searchQuery,
        },
        relevantLessons: lessonsResult.lessons || [],
        relatedErrors: errorsResult.errors || [],
        totalFound: (lessonsResult.lessons || []).length + (errorsResult.errors || []).length,
        message: `Found ${(lessonsResult.lessons || []).length} lessons and ${(errorsResult.errors || []).length} related errors`,
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        relevantLessons: [],
        relatedErrors: [],
        ragSystem: 'error',
      };
    }
  }

  /**
   * Get RAG system analytics and statistics
   */
  async getAnalytics(options = {}) {
    try {
      await this._ensureInitialized();

      const {
        includeTrends = false,
        timeRange = 'all',
      } = options;

      const stats = await this.withTimeout(
        this.ragDB.getStats(),
        10000,
      );

      const analytics = {
        success: true,
        statistics: stats.stats,
        systemStatus: 'operational',
        ragSystem: 'active',
        lastUpdated: new Date().toISOString(),
      };

      // Add trend analysis if requested
      if (includeTrends) {
        analytics.trends = await this._generateTrends(timeRange);
      }

      return analytics;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        ragSystem: 'error',
      };
    }
  }

  /**
   * Migrate existing development/lessons structure to RAG database
   */
  async migrateFromFiles(projectPath = null) {
    try {
      const migrationPath = projectPath || process.cwd();
      const migration = new RAGMigration(migrationPath);

      const result = await this.withTimeout(
        migration.migrate(),
        60000, // 60 second timeout for migration
      );

      return {
        success: result.success,
        migrationResults: result.results,
        migrationLog: result.migrationLog,
        projectPath: migrationPath,
        message: result.success ? 'Migration completed successfully' : 'Migration failed',
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        ragSystem: 'error',
      };
    }
  }

  /**
   * Auto-store lesson from task completion
   * Called automatically by TaskManager during task completion
   */
  async autoStoreFromTaskCompletion(taskData, completionData) {
    try {
      await this._ensureInitialized();

      // Only auto-store from successful feature tasks
      if (taskData.category !== 'feature' || !completionData.success) {
        return { success: true, message: 'No lesson auto-stored (not applicable)', autoStored: false };
      }

      const lessonData = this._extractLessonFromTask(taskData, completionData);

      if (lessonData) {
        const result = await this.ragDB.storeLesson(lessonData);
        console.log('[RAG-OPS] Auto-stored lesson from task completion:', taskData.title);

        return {
          success: true,
          lessonId: result.lessonId,
          message: 'Lesson auto-stored from task completion',
          autoStored: true,
          ragSystem: 'active',
        };
      }

      return { success: true, message: 'No lesson extracted from task', autoStored: false };

    } catch (error) {
      console.error('[RAG-OPS] Failed to auto-store lesson:', error);
      return {
        success: false,
        error: error.message,
        autoStored: false,
        ragSystem: 'error',
      };
    }
  }

  /**
   * Auto-store error from task failure
   * Called automatically by TaskManager during task failure
   */
  async autoStoreFromTaskFailure(taskData, failureData) {
    try {
      await this._ensureInitialized();

      const errorData = this._extractErrorFromTask(taskData, failureData);

      if (errorData) {
        const result = await this.ragDB.storeError(errorData);
        console.log('[RAG-OPS] Auto-stored error from task failure:', taskData.title);

        return {
          success: true,
          errorId: result.errorId,
          message: 'Error auto-stored from task failure',
          autoStored: true,
          ragSystem: 'active',
        };
      }

      return { success: true, message: 'No error extracted from task', autoStored: false };

    } catch (error) {
      console.error('[RAG-OPS] Failed to auto-store error:', error);
      return {
        success: false,
        error: error.message,
        autoStored: false,
        ragSystem: 'error',
      };
    }
  }

  // =================== HELPER METHODS ===================

  /**
   * Build search query from task context
   */
  _buildTaskSearchQuery(taskContext) {
    const queryParts = [
      taskContext.title,
      taskContext.category,
      // Extract first 10 words from description
      (taskContext.description || '').split(' ').slice(0, 10).join(' '),
    ].filter(part => part && part.trim());

    return queryParts.join(' ');
  }

  /**
   * Extract lesson data from completed task
   */
  _extractLessonFromTask(taskData, completionData) {
    const title = `Feature Implementation: ${taskData.title}`;
    const content = this._buildLessonContent(taskData, completionData);
    const category = 'features';
    const subcategory = this._inferSubcategory(taskData);
    const tags = this._extractTaskTags(taskData);

    return {
      title,
      content,
      category,
      subcategory,
      projectPath: process.cwd(),
      filePath: null, // API-generated lessons don't have file paths
      tags,
    };
  }

  /**
   * Extract error data from failed task
   */
  _extractErrorFromTask(taskData, failureData) {
    const title = `Task Failure: ${taskData.title}`;
    const content = this._buildErrorContent(taskData, failureData);
    const errorType = this._inferErrorType(taskData, failureData);
    const resolution = failureData.resolution || null;
    const tags = this._extractTaskTags(taskData);

    return {
      title,
      content,
      errorType,
      resolution,
      projectPath: process.cwd(),
      filePath: null, // API-generated errors don't have file paths
      tags,
    };
  }

  /**
   * Build lesson content from task and completion data
   */
  _buildLessonContent(taskData, completionData) {
    return `
# ${taskData.title}

## Task Description
${taskData.description}

## Implementation Details
${completionData.details || completionData.message || 'Task completed successfully'}

## Files Modified
${completionData.filesModified ? completionData.filesModified.join(', ') : 'Not specified'}

## Outcome
${completionData.outcome || 'Task completed successfully'}

## Evidence
${completionData.evidence || 'No specific evidence provided'}

## Category
${taskData.category}

## Completion Time
${new Date().toISOString()}

## Auto-Generated
This lesson was automatically generated from task completion.
`.trim();
  }

  /**
   * Build error content from task and failure data
   */
  _buildErrorContent(taskData, failureData) {
    return `
# Error: ${taskData.title}

## Task Description
${taskData.description}

## Error Details
${failureData.message || failureData.error || 'Task failed without specific error message'}

## Error Context
${failureData.context ? JSON.stringify(failureData.context, null, 2) : 'No additional context'}

## Stack Trace
${failureData.stack || 'No stack trace available'}

## Resolution Attempted
${failureData.resolution || 'No resolution attempted'}

## Task Category
${taskData.category}

## Failure Time
${new Date().toISOString()}

## Auto-Generated
This error was automatically captured from task failure.
`.trim();
  }

  /**
   * Infer subcategory from task data
   */
  _inferSubcategory(taskData) {
    const description = (taskData.description || '').toLowerCase();
    const title = (taskData.title || '').toLowerCase();
    const combined = `${title} ${description}`;

    if (combined.includes('api')) {return 'api';}
    if (combined.includes('database') || combined.includes('db')) {return 'database';}
    if (combined.includes('auth')) {return 'authentication';}
    if (combined.includes('test')) {return 'testing';}
    if (combined.includes('ui') || combined.includes('interface')) {return 'interface';}
    if (combined.includes('performance')) {return 'performance';}
    if (combined.includes('security')) {return 'security';}
    if (combined.includes('rag') || combined.includes('embedding')) {return 'rag';}

    return null;
  }

  /**
   * Infer error type from task and error data
   */
  _inferErrorType(taskData, errorData) {
    const errorMessage = ((errorData.message || errorData.error || '')).toLowerCase();
    const taskText = `${taskData.title} ${taskData.description}`.toLowerCase();

    if (errorMessage.includes('lint') || errorMessage.includes('eslint')) {return 'linter';}
    if (errorMessage.includes('build') || errorMessage.includes('compile')) {return 'build';}
    if (errorMessage.includes('test') || errorMessage.includes('jest')) {return 'test';}
    if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {return 'syntax';}
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {return 'network';}
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {return 'authentication';}
    if (errorMessage.includes('timeout')) {return 'timeout';}
    if (taskText.includes('rag') || taskText.includes('database')) {return 'database';}

    return 'runtime';
  }

  /**
   * Extract tags from task data
   */
  _extractTaskTags(taskData) {
    const tags = new Set();

    // Add category as tag
    tags.add(taskData.category);

    // Extract technology keywords
    const text = `${taskData.title} ${taskData.description}`.toLowerCase();
    const techKeywords = text.match(/\b(javascript|typescript|react|node|express|mongo|postgres|redis|docker|aws|api|database|linter|eslint|jest|test|build|deploy|rag|embedding|vector|search|sqlite|faiss)\b/gi) || [];
    techKeywords.forEach(keyword => tags.add(keyword.toLowerCase()));

    // Add project-specific tags
    tags.add('taskmanager');
    tags.add('auto-generated');

    return Array.from(tags);
  }

  /**
   * Generate trend analysis for analytics
   */
  async _generateTrends(timeRange) {
    // Placeholder for trend analysis
    // In a full implementation, this would query the database for trend data
    return {
      lessonGrowth: 'stable',
      errorFrequency: 'decreasing',
      topCategories: ['features', 'errors', 'testing'],
      timeRange,
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.ragDB) {
      await this.ragDB.close();
    }
  }
}

module.exports = RAGOperations;
