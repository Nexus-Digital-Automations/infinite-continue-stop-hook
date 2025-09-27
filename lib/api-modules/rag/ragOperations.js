/**
 * RAG Operations Module for TaskManager API
 * Handles RAG-based lessons and error database operations
 * Integrates with existing TaskManager workflows
 */

const _RAGDatabase = require('../../rag-database');
const _RAGMigration = require('../../rag-migration');
const _Logger = require('../../logger');
const LessonVersioning = require('./lessonVersioning');
const LessonQualityScoring = require('./lessonQualityScoring');
const CrossProjectSharing = require('./crossProjectSharing');

class RAGOperations {
  constructor(dependencies) {
    this.taskManager = dependencies.taskManager;
    this.agentManager = dependencies.agentManager;
    this.withTimeout = dependencies.withTimeout;

    // Initialize logger and RAG database
    this.logger = new _Logger(__dirname);
    this.ragDB = new _RAGDatabase();
    this.lessonVersioning = new LessonVersioning(this.ragDB);
    this.lessonQualityScoring = new LessonQualityScoring(this.ragDB);
    this.crossProjectSharing = new CrossProjectSharing(this.ragDB);
    this.initialized = false;
  }

  /**
   * Initialize RAG system if not already initialized
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      const result = await this.ragDB.initialize();
      if (!result.success) {
        throw new Error(`RAG system initialization failed: ${result.error}`);
      }

      // Initialize versioning system
      const versioningResult = await this.lessonVersioning.initialize();
      if (!versioningResult.success) {
        throw new Error(`Lesson versioning initialization failed: ${versioningResult.error}`);
      }

      // Initialize quality scoring system
      const qualityResult = await this.lessonQualityScoring.initialize();
      if (!qualityResult.success) {
        throw new Error(`Lesson quality scoring initialization failed: ${qualityResult.error}`);
      }

      // Initialize cross-project sharing system
      const sharingResult = await this.crossProjectSharing.initialize();
      if (!sharingResult.success) {
        throw new Error(`Cross-project sharing initialization failed: ${sharingResult.error}`);
      }

      this.initialized = result.success;
    }
  }

  /**
   * Store a lesson in the RAG database with versioning
   */
  async storeLesson(lessonData, versionInfo = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonVersioning.storeLessonVersion(lessonData, versionInfo),
        10000,
      );

      if (result.success) {
        // Initialize quality scoring for new lesson
        try {
          await this.lessonQualityScoring.initializeLessonQuality(result.lessonId, {
            initialScore: 0.5,
            source: 'api_storage',
            metadata: {
              storeMethod: 'versioned',
              timestamp: new Date().toISOString()
            }
          });
        } catch (qualityError) {
          this.logger.logError(qualityError, 'Failed to initialize quality scoring for lesson');
        }

        return {
          success: true,
          lessonId: result.lessonId,
          version: result.version,
          versionHash: result.versionHash,
          embeddingId: result.embeddingId,
          previousVersion: result.previousVersion,
          changed: result.changed,
          message: result.message,
          ragSystem: 'active',
        };
      } else {
        return {
          success: false,
          error: result.error,
          ragSystem: 'error',
        };
      }

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
      const migration = new _RAGMigration(migrationPath);

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
        this.logger.logInfo('Auto-stored lesson from task completion', { title: taskData.title });

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
      this.logger.logError('Failed to auto-store lesson', { error: error.message, stack: error.stack });
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
        this.logger.logInfo('Auto-stored error from task failure', { title: taskData.title });

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
      this.logger.logError('Failed to auto-store error', { error: error.message, stack: error.stack });
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
  _generateTrends(timeRange) {
    // Placeholder for trend analysis
    // In a full implementation, this would query the database for trend data
    return {
      lessonGrowth: 'stable',
      errorFrequency: 'decreasing',
      topCategories: ['features', 'errors', 'testing'],
      timeRange,
    };
  }

  // =================== VERSIONING METHODS ===================

  /**
   * Get version history for a lesson
   */
  async getLessonVersionHistory(lessonId) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonVersioning.getVersionHistory(lessonId),
        10000,
      );

      return {
        success: true,
        lessonId,
        history: result,
        message: 'Version history retrieved successfully',
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
   * Compare two versions of a lesson
   */
  async compareLessonVersions(lessonId, versionA, versionB) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonVersioning.compareVersions(lessonId, versionA, versionB),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        versionA,
        versionB,
        comparison: result.comparison,
        message: result.success ? 'Version comparison completed' : result.error,
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
   * Rollback lesson to previous version
   */
  async rollbackLessonVersion(lessonId, targetVersion) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonVersioning.rollbackToVersion(lessonId, targetVersion),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        targetVersion,
        newVersion: result.newVersion,
        rolledBackTo: result.rolledBackTo,
        message: result.message || result.error,
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
   * Get comprehensive version analytics for a lesson
   */
  async getLessonVersionAnalytics(lessonId) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonVersioning.getVersionAnalytics(lessonId),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        analytics: result.analytics,
        message: result.success ? 'Version analytics retrieved successfully' : result.error,
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
   * Store lesson with advanced versioning options
   */
  async storeLessonWithVersioning(lessonData, versionOptions = {}) {
    const {
      changeType = 'updated',
      changeDescription = 'Lesson updated',
      createdBy = 'system',
      versionStrategy = 'semantic',
      majorUpdate = false,
      minorUpdate = false
    } = versionOptions;

    // Determine version strategy based on update type
    let strategy = versionStrategy;
    if (majorUpdate) strategy = 'major';
    else if (minorUpdate) strategy = 'minor';

    return await this.storeLesson(lessonData, {
      changeType,
      changeDescription,
      createdBy,
      versionStrategy: strategy
    });
  }

  /**
   * Get current version information for a lesson
   */
  async getLessonCurrentVersion(lessonId) {
    try {
      await this._ensureInitialized();

      const currentVersion = await this.withTimeout(
        this.lessonVersioning.getCurrentVersion(lessonId),
        10000,
      );

      const metadata = await this.withTimeout(
        this.lessonVersioning.getVersionMetadata(lessonId),
        10000,
      );

      return {
        success: true,
        lessonId,
        currentVersion,
        metadata,
        message: 'Current version information retrieved successfully',
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
   * Search lessons with version filtering
   */
  async searchLessonsWithVersioning(query, options = {}) {
    try {
      await this._ensureInitialized();

      const {
        limit = 10,
        threshold = 0.7,
        category = null,
        projectPath = null,
        includeVersionInfo = true,
        latestVersionsOnly = true
      } = options;

      // Use existing search method
      const searchResult = await this.searchLessons(query, {
        limit,
        threshold,
        category,
        projectPath
      });

      if (!searchResult.success || !includeVersionInfo) {
        return searchResult;
      }

      // Enhance results with version information
      const enhancedLessons = [];
      for (const lesson of searchResult.lessons) {
        try {
          const versionInfo = await this.getLessonCurrentVersion(lesson.id);
          enhancedLessons.push({
            ...lesson,
            versionInfo: versionInfo.success ? {
              currentVersion: versionInfo.currentVersion,
              totalVersions: versionInfo.metadata.total_versions,
              lastUpdated: versionInfo.metadata.updated_at
            } : null
          });
        } catch (versionError) {
          // Include lesson without version info if version lookup fails
          enhancedLessons.push(lesson);
        }
      }

      return {
        ...searchResult,
        lessons: enhancedLessons,
        versioningEnabled: true
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

  // =================== QUALITY SCORING METHODS ===================

  /**
   * Record lesson usage for quality tracking
   */
  async recordLessonUsage(lessonId, usageData = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonQualityScoring.recordLessonUsage(lessonId, {
          context: usageData.context || 'api_usage',
          outcome: usageData.outcome || 'unknown',
          userId: usageData.userId || 'system',
          metadata: usageData.metadata || {}
        }),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        usageId: result.usageId,
        message: result.success ? 'Usage recorded successfully' : result.error,
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
   * Record lesson feedback for quality tracking
   */
  async recordLessonFeedback(lessonId, feedbackData = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonQualityScoring.recordUserFeedback(lessonId, {
          rating: feedbackData.rating || 3,
          comment: feedbackData.comment || '',
          feedbackType: feedbackData.feedbackType || 'general',
          userId: feedbackData.userId || 'system',
          metadata: feedbackData.metadata || {}
        }),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        feedbackId: result.feedbackId,
        message: result.success ? 'Feedback recorded successfully' : result.error,
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
   * Record lesson outcome for quality tracking
   */
  async recordLessonOutcome(lessonId, outcomeData = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonQualityScoring.recordLessonOutcome(lessonId, {
          outcome: outcomeData.outcome || 'success',
          taskId: outcomeData.taskId || null,
          successMetrics: outcomeData.successMetrics || {},
          context: outcomeData.context || 'api_outcome',
          metadata: outcomeData.metadata || {}
        }),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        outcomeId: result.outcomeId,
        message: result.success ? 'Outcome recorded successfully' : result.error,
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
   * Get lesson quality score and analytics
   */
  async getLessonQualityScore(lessonId) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.lessonQualityScoring.getLessonQualityScore(lessonId),
        10000,
      );

      return {
        success: result.success,
        lessonId,
        qualityScore: result.score,
        scoreBreakdown: result.breakdown,
        analytics: result.analytics,
        message: result.success ? 'Quality score calculated successfully' : result.error,
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
   * Get quality analytics for lessons
   */
  async getLessonQualityAnalytics(options = {}) {
    try {
      await this._ensureInitialized();

      const {
        timeRange = 'all',
        category = null,
        minScore = null,
        maxScore = null,
        limit = 50
      } = options;

      const result = await this.withTimeout(
        this.lessonQualityScoring.getQualityAnalytics(),
        10000,
      );

      return {
        success: result.success,
        analytics: result.analytics,
        summary: result.summary,
        recommendations: result.recommendations,
        message: result.success ? 'Quality analytics retrieved successfully' : result.error,
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
   * Get quality-based lesson recommendations
   */
  async getQualityBasedRecommendations(options = {}) {
    try {
      await this._ensureInitialized();

      const {
        minQualityScore = 0.7,
        category = null,
        excludeLowPerformers = true,
        limit = 10
      } = options;

      const result = await this.withTimeout(
        this.lessonQualityScoring.getTopQualityLessons(limit, minQualityScore >= 0.7 ? 'excellent' : null),
        10000,
      );

      return {
        success: true,
        recommendations: result,
        qualityCriteria: { minQualityScore, category, excludeLowPerformers, limit },
        message: 'Quality-based recommendations generated successfully',
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
   * Search lessons with quality filtering
   */
  async searchLessonsWithQuality(query, options = {}) {
    try {
      await this._ensureInitialized();

      const {
        limit = 10,
        threshold = 0.7,
        category = null,
        projectPath = null,
        minQualityScore = null,
        sortByQuality = false
      } = options;

      // Perform initial search
      const searchResult = await this.searchLessons(query, {
        limit: sortByQuality ? limit * 2 : limit, // Get more if we're sorting by quality
        threshold,
        category,
        projectPath
      });

      if (!searchResult.success) {
        return searchResult;
      }

      // Enhance with quality scores
      const enhancedLessons = [];
      for (const lesson of searchResult.lessons) {
        try {
          const qualityResult = await this.getLessonQualityScore(lesson.id);
          const qualityScore = qualityResult.success ? qualityResult.qualityScore : 0;

          // Apply quality filter if specified
          if (minQualityScore && qualityScore < minQualityScore) {
            continue;
          }

          enhancedLessons.push({
            ...lesson,
            qualityScore,
            qualityAnalytics: qualityResult.success ? qualityResult.analytics : null
          });
        } catch (qualityError) {
          // Include lesson without quality info if quality lookup fails
          enhancedLessons.push({
            ...lesson,
            qualityScore: null
          });
        }
      }

      // Sort by quality if requested
      if (sortByQuality) {
        enhancedLessons.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        enhancedLessons.splice(limit); // Trim to requested limit
      }

      return {
        ...searchResult,
        lessons: enhancedLessons,
        qualityFiltering: true,
        qualityFilter: { minQualityScore, sortByQuality }
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
   * Update lesson quality score manually
   */
  async updateLessonQualityScore(lessonId, scoreData = {}) {
    try {
      await this._ensureInitialized();

      // Get current score before update
      const currentScore = await this.withTimeout(
        this.lessonQualityScoring.getLessonQualityScore(lessonId),
        10000,
      );

      // Update quality metrics (recalculates based on current data)
      await this.withTimeout(
        this.lessonQualityScoring.updateQualityMetrics(lessonId),
        10000,
      );

      // Get new score after update
      const newScore = await this.withTimeout(
        this.lessonQualityScoring.getLessonQualityScore(lessonId),
        10000,
      );

      return {
        success: true,
        lessonId,
        previousScore: currentScore,
        newScore: newScore,
        message: 'Quality score updated successfully',
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

  // ===== CROSS-PROJECT SHARING METHODS =====

  /**
   * Register a project for cross-project lesson sharing
   */
  async registerProject(projectData) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.registerProject(projectData),
        10000,
      );

      return {
        success: true,
        project_id: result.project_id,
        message: result.message || 'Project registered successfully',
        registered_at: result.registered_at,
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
   * Share a lesson across projects with categorization
   */
  async shareLessonCrossProject(lessonId, projectId, sharingData = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.shareLessonCrossProject(lessonId, projectId, sharingData),
        10000,
      );

      return {
        success: true,
        lesson_id: result.lesson_id,
        project_id: result.project_id,
        sharing_scope: result.sharing_scope,
        lesson_category: result.lesson_category,
        message: result.message || 'Lesson shared successfully across projects',
        shared_at: result.shared_at,
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
   * Calculate relevance score between two projects
   */
  async calculateProjectRelevance(sourceProjectId, targetProjectId) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.calculateProjectRelevance(sourceProjectId, targetProjectId),
        10000,
      );

      return {
        success: true,
        source_project: result.source_project,
        target_project: result.target_project,
        relevance_score: result.relevance_score,
        similarity_breakdown: result.similarity_breakdown,
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
   * Get shared lessons for a specific project
   */
  async getSharedLessonsForProject(projectId, options = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.getSharedLessonsForProject(projectId, options),
        10000,
      );

      return {
        success: true,
        project_id: result.project_id,
        shared_lessons: result.shared_lessons || [],
        recommendations: result.recommendations || [],
        count: result.count || 0,
        filters: result.filters,
        message: `Found ${result.count || 0} shared lessons`,
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        shared_lessons: [],
        ragSystem: 'error',
      };
    }
  }

  /**
   * Get sharing recommendations for a project
   */
  async getProjectRecommendations(projectId, options = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.getProjectRecommendations(projectId, options),
        10000,
      );

      return {
        success: true,
        project_id: result.project_id,
        recommendations: result.recommendations || [],
        count: result.count || 0,
        message: `Found ${result.count || 0} recommendations`,
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        recommendations: [],
        ragSystem: 'error',
      };
    }
  }

  /**
   * Record application of a shared lesson
   */
  async recordLessonApplication(applicationData) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.recordLessonApplication(applicationData),
        10000,
      );

      return {
        success: true,
        source_project: result.source_project,
        target_project: result.target_project,
        lesson_id: result.lesson_id,
        applied_successfully: result.applied_successfully,
        relevance_score: result.relevance_score,
        message: result.message || 'Lesson application recorded successfully',
        applied_at: result.applied_at,
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
   * Get cross-project analytics and insights
   */
  async getCrossProjectAnalytics(projectId = null, options = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.getCrossProjectAnalytics(projectId, options),
        10000,
      );

      return {
        success: true,
        project_id: result.project_id,
        date_range_days: result.date_range_days,
        analytics: result.analytics,
        breakdown: result.breakdown,
        message: 'Cross-project analytics retrieved successfully',
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        analytics: {},
        ragSystem: 'error',
      };
    }
  }

  /**
   * Update project information
   */
  async updateProject(projectId, updates) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.updateProject(projectId, updates),
        10000,
      );

      return {
        success: true,
        project_id: result.project_id,
        updated_fields: result.updated_fields,
        message: result.message || 'Project updated successfully',
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
   * Get project details
   */
  async getProject(projectId) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.getProject(projectId),
        10000,
      );

      return {
        success: true,
        project: result.project,
        message: 'Project details retrieved successfully',
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        project: null,
        ragSystem: 'error',
      };
    }
  }

  /**
   * List all registered projects
   */
  async listProjects(options = {}) {
    try {
      await this._ensureInitialized();

      const result = await this.withTimeout(
        this.crossProjectSharing.listProjects(options),
        10000,
      );

      return {
        success: true,
        projects: result.projects || [],
        count: result.count || 0,
        filters: result.filters,
        message: `Found ${result.count || 0} projects`,
        ragSystem: 'active',
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        projects: [],
        ragSystem: 'error',
      };
    }
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
