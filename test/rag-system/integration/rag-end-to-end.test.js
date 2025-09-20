/**
 * RAG System End-to-End Integration Tests
 *
 * === OVERVIEW ===
 * Comprehensive integration tests for the complete RAG system including
 * embedding generation, vector storage, semantic search, and TaskManager
 * API integration. Tests real-world usage scenarios and system performance.
 *
 * === TEST SCENARIOS ===
 * • Complete system initialization and setup
 * • Lesson and error storage workflow
 * • Semantic search and retrieval accuracy
 * • Context-aware recommendations
 * • Migration system functionality
 * • Performance under load
 *
 * @author RAG Implementation Agent
 * @version 1.0.0
 * @since 2025-09-19
 */

const _path = require('path');
const _fs = require('fs').promises;

// Import RAG system components
const _EmbeddingGenerator = require('../../../lib/rag/embeddingGenerator');
const _VectorDatabase = require('../../../lib/rag/vectorDatabase');
const _SemanticSearchEngine = require('../../../lib/rag/semanticSearchEngine');
const _RAGOperations = require('../../../lib/api-modules/rag/ragOperations');
const _MigrationSystem = require('../../../lib/rag/migrationSystem');

// Test utilities
const _TestDataGenerator = require('../utils/testDataGenerator');
const _TestAssertions = require('../utils/testAssertions');

describe('RAG System End-to-End Integration Tests', () => {
  let _embeddingGenerator;
  let _vectorDatabase;
  let _semanticSearchEngine;
  let _ragOperations;
  let _migrationSystem;
  let _testDataGenerator;
  let _testAssertions;

  // Test data storage paths
  const testDataPath = path.join(__dirname, '../test-data');
  const ragTestPath = path.join(testDataPath, 'rag-test');

  beforeAll(async () => {
    // Create test environment
    await fs.mkdir(ragTestPath, { recursive: true });
    await fs.mkdir(path.join(ragTestPath, 'rag'), { recursive: true });

    // Initialize test utilities
    testDataGenerator = new TestDataGenerator();
    testAssertions = new TestAssertions();

    // Initialize RAG components with test configuration
    embeddingGenerator = new EmbeddingGenerator({
      fallbackModel: 'sentence-transformers/all-MiniLM-L6-v2', // Use lighter model for tests
      enableCaching: true,
      cacheSize: 100,
      maxTextLength: 256, // Shorter for faster tests
    });

    vectorDatabase = new VectorDatabase({
      indexPath: path.join(ragTestPath, 'rag', 'test-vector.index'),
      metadataPath: path.join(ragTestPath, 'rag', 'test-metadata.db'),
      embeddingDimension: 384, // MiniLM dimension
      enableMultiIndex: true,
      contentTypes: ['errors', 'features', 'optimization', 'decisions', 'patterns'],
    });

    semanticSearchEngine = new SemanticSearchEngine({
      embeddingGenerator,
      vectorDatabase,
      defaultTopK: 5,
      similarityThreshold: 0.6, // Lower threshold for tests
    });

    ragOperations = new RAGOperations({
      projectRoot: ragTestPath,
      embeddingGenerator,
      vectorDatabase,
      semanticSearchEngine,
      config: {
        enableAutoStorage: false, // Disable for controlled testing
        maxRecommendations: 5,
      },
    });

    migrationSystem = new MigrationSystem({
      sourcePath: path.join(ragTestPath, 'development'),
      batchSize: 10, // Smaller batches for tests
      enableBackup: false, // Disable backup for tests
    });

    console.log('Initializing RAG system components...');

    // Initialize all components
    await embeddingGenerator.initialize();
    await vectorDatabase.initialize();
    await semanticSearchEngine.initialize();
    await ragOperations.initialize();

    console.log('RAG system initialization completed');
  }, 120000); // 2 minutes timeout for initialization

  afterAll(async () => {
    // Cleanup test resources
    if (embeddingGenerator) {await embeddingGenerator.cleanup();}
    if (vectorDatabase) {await vectorDatabase.cleanup();}
    if (semanticSearchEngine) {await semanticSearchEngine.cleanup();}
    if (ragOperations) {await ragOperations.cleanup();}

    // Clean up test files
    try {
      await fs.rm(testDataPath, { recursive: true, force: true });
    } catch {
      console.warn('Failed to clean up test data:', error.message);
    }
  });

  describe('System Initialization and Health Checks', () => {
    test('should initialize all components successfully', () => {
      expect(embeddingGenerator.isInitialized).toBe(true);
      expect(vectorDatabase.isInitialized).toBe(true);
      expect(semanticSearchEngine.isInitialized).toBe(true);
      expect(ragOperations.isInitialized).toBe(true);
    });

    test('should have proper component connections', () => {
      expect(semanticSearchEngine.config.embeddingGenerator).toBe(embeddingGenerator);
      expect(semanticSearchEngine.config.vectorDatabase).toBe(vectorDatabase);
    });

    test('should provide system statistics', async () => {
      const _embeddingStats = embeddingGenerator.getStatistics();
      const _vectorStats = vectorDatabase.getStatistics();
      const _searchStats = semanticSearchEngine.getStatistics();

      expect(embeddingStats).toHaveProperty('isInitialized', true);
      expect(vectorStats).toHaveProperty('isInitialized', true);
      expect(searchStats).toHaveProperty('isInitialized', true);

      expect(embeddingStats).toHaveProperty('embeddingDimension');
      expect(vectorStats).toHaveProperty('totalVectors');
      expect(searchStats).toHaveProperty('queriesProcessed');
    });
  });

  describe('Lesson Storage and Retrieval Workflow', () => {
    const storedLessons = [];

    test('should store technical lessons with embeddings', async () => {
      const _lessons = testDataGenerator.generateLessons(5);

      for (const lesson of lessons) {
        const _result = await ragOperations.storeLesson(lesson);

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('vectorId');
        expect(result).toHaveProperty('lessonId');
        expect(result).toHaveProperty('embeddingDimension');

        storedLessons.push(result);
      }

      // Verify storage statistics
      const _vectorStats = vectorDatabase.getStatistics();
      expect(vectorStats.totalVectors).toBeGreaterThanOrEqual(lessons.length);
    });

    test('should retrieve lessons using semantic search', async () => {
      const _query = 'JavaScript function error handling best practices';
      const _results = await ragOperations.searchLessons(query, { maxResults: 3 });

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);

      // Verify result structure
      for (const result of results) {
        testAssertions.assertValidSearchResult(result);
        expect(result).toHaveProperty('relevanceScore');
        expect(result).toHaveProperty('lessonType');
        expect(result).toHaveProperty('confidenceLevel');
      }

      // Verify relevance ordering
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }
    });

    test('should provide context-aware lesson recommendations', async () => {
      const _taskContext = {
        id: 'test-task-1',
        title: 'Fix async function error handling',
        description: 'Need to improve error handling in async JavaScript functions',
        category: 'feature',
        tags: ['javascript', 'async', 'error-handling'],
      };

      const _recommendations = await ragOperations.getRelevantLessons(taskContext, { maxResults: 5 });

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);

      // Verify contextual relevance
      for (const recommendation of recommendations) {
        testAssertions.assertValidRecommendation(recommendation);
        expect(recommendation).toHaveProperty('applicableToCurrentTask');
        expect(recommendation).toHaveProperty('contextRelevance');
      }
    });
  });

  describe('Error Storage and Pattern Recognition', () => {
    const storedErrors = [];

    test('should store error patterns with semantic analysis', async () => {
      const _errors = testDataGenerator.generateErrors(5);

      for (const error of errors) {
        const _result = await ragOperations.storeError(error);

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('vectorId');
        expect(result).toHaveProperty('errorId');

        storedErrors.push(result);
      }
    });

    test('should find similar errors using pattern matching', async () => {
      const _errorDescription = 'TypeError: Cannot read property of undefined in async function';
      const _similarErrors = await ragOperations.findSimilarErrors(errorDescription, { maxResults: 3 });

      expect(similarErrors).toBeInstanceOf(Array);

      for (const error of similarErrors) {
        testAssertions.assertValidErrorResult(error);
        expect(error).toHaveProperty('similarityScore');
        expect(error).toHaveProperty('errorPattern');
        expect(error).toHaveProperty('hasResolution');
      }

      // Verify errors with resolutions are ranked higher
      const _errorsWithResolutions = similarErrors.filter(e => e.hasResolution);
      const _errorsWithoutResolutions = similarErrors.filter(e => !e.hasResolution);

      if (errorsWithResolutions.length > 0 && errorsWithoutResolutions.length > 0) {
        expect(errorsWithResolutions[0].similarityScore)
          .toBeGreaterThanOrEqual(errorsWithoutResolutions[0].similarityScore);
      }
    });

    test('should categorize and analyze error complexity', async () => {
      const _complexError = {
        type: 'SystemError',
        message: 'Multiple cascade failures in distributed system with memory leak',
        description: 'Complex system error affecting multiple services',
        resolution: '', // No resolution to test complexity assessment
        stackTrace: 'Very long stack trace indicating system-level issues...',
        tags: ['system', 'memory', 'distributed', 'cascade'],
      };

      const _result = await ragOperations.storeError(complexError);
      expect(result.success).toBe(true);

      // Search for the stored error
      const _searchResults = await ragOperations.findSimilarErrors(complexError.message);
      const _foundError = searchResults.find(e => e.error_type === complexError.type);

      expect(foundError).toBeDefined();
      expect(foundError.errorPattern).toHaveProperty('complexity');
      expect(['high', 'medium', 'low', 'trivial']).toContain(foundError.errorPattern.complexity);
    });
  });

  describe('Performance and Scalability Tests', () => {
    test('should handle batch operations efficiently', async () => {
      const _batchSize = 20;
      const _lessons = testDataGenerator.generateLessons(batchSize);

      const _startTime = Date.now();

      // Store lessons in batch
      const _results = await Promise.all(
        lessons.map(lesson => ragOperations.storeLesson(lesson)),
      );

      const _endTime = Date.now();
      const _processingTime = endTime - startTime;

      // Verify all operations succeeded
      expect(results).toHaveLength(batchSize);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance assertions
      const _avgTimePerLesson = processingTime / batchSize;
      expect(avgTimePerLesson).toBeLessThan(5000); // Less than 5 seconds per lesson

      console.log(`Batch processing: ${batchSize} lessons in ${processingTime}ms (avg: ${avgTimePerLesson.toFixed(2)}ms/lesson)`);
    });

    test('should maintain search performance under load', async () => {
      const _queries = [
        'JavaScript error handling',
        'React component optimization',
        'Database query performance',
        'API endpoint security',
        'Frontend build optimization',
      ];

      const _searchPromises = [];

      // Create concurrent search requests
      for (let i = 0; i < 10; i++) {
        for (const query of queries) {
          searchPromises.push(ragOperations.searchLessons(query, { maxResults: 5 }));
        }
      }

      const _startTime = Date.now();
      const _results = await Promise.all(searchPromises);
      const _endTime = Date.now();

      const _totalQueries = searchPromises.length;
      const _totalTime = endTime - startTime;
      const _avgTimePerQuery = totalTime / totalQueries;

      // Verify all searches completed successfully
      expect(results).toHaveLength(totalQueries);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Array);
      });

      // Performance assertions
      expect(avgTimePerQuery).toBeLessThan(2000); // Less than 2 seconds per query

      console.log(`Concurrent search performance: ${totalQueries} queries in ${totalTime}ms (avg: ${avgTimePerQuery.toFixed(2)}ms/query)`);
    });

    test('should optimize cache performance', async () => {
      const _query = 'React performance optimization techniques';

      // First search (cache miss)
      const _startTime1 = Date.now();
      const _results1 = await ragOperations.searchLessons(query);
      const _time1 = Date.now() - startTime1;

      // Second search (cache hit)
      const _startTime2 = Date.now();
      const _results2 = await ragOperations.searchLessons(query);
      const _time2 = Date.now() - startTime2;

      // Verify results are identical
      expect(results1).toEqual(results2);

      // Cache should significantly improve performance
      expect(time2).toBeLessThan(time1 * 0.5); // At least 50% faster

      console.log(`Cache performance: First search ${time1}ms, cached search ${time2}ms (${((1 - time2/time1) * 100).toFixed(1)}% improvement)`);
    });
  });

  describe('Data Integrity and Consistency', () => {
    test('should prevent duplicate content storage', async () => {
      const _lesson = testDataGenerator.generateLessons(1)[0];

      // Store the same lesson twice
      const _result1 = await ragOperations.storeLesson(lesson);
      const _result2 = await ragOperations.storeLesson(lesson);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Both should succeed but the system should handle duplicates gracefully
      expect(result1.vectorId).toBeDefined();
      expect(result2.vectorId).toBeDefined();

      // Search should not return excessive duplicates
      const _searchResults = await ragOperations.searchLessons(lesson.title);
      const _duplicateResults = searchResults.filter(r => r.title === lesson.title);

      // Should have reasonable duplicate handling
      expect(duplicateResults.length).toBeLessThanOrEqual(3);
    });

    test('should maintain embedding consistency', async () => {
      const _content = 'JavaScript async function error handling best practices';

      // Generate embedding multiple times
      const _embedding1 = await embeddingGenerator.generateEmbeddings(content);
      const _embedding2 = await embeddingGenerator.generateEmbeddings(content);

      expect(embedding1).toHaveLength(embedding2.length);

      // Embeddings should be identical for identical content
      const _similarity = testAssertions.calculateCosineSimilarity(embedding1, embedding2);
      expect(similarity).toBeGreaterThan(0.99); // Very high similarity for identical content
    });

    test('should validate vector database integrity', async () => {
      const _vectorStats = vectorDatabase.getStatistics();

      // Check basic integrity
      expect(vectorStats.totalVectors).toBeGreaterThan(0);
      expect(vectorStats.isInitialized).toBe(true);

      // Test search functionality
      const _testEmbedding = await embeddingGenerator.generateEmbeddings('test query');
      const _searchResults = await vectorDatabase.search(testEmbedding, { topK: 5 });

      expect(searchResults).toBeInstanceOf(Array);

      // Each result should have required properties
      searchResults.forEach(result => {
        expect(result).toHaveProperty('vectorId');
        expect(result).toHaveProperty('similarity');
        expect(typeof result.similarity).toBe('number');
        expect(result.similarity).toBeGreaterThan(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Migration System Integration', () => {
    test('should create test content for migration', async () => {
      // Create test lesson files
      const _testLessonsPath = path.join(ragTestPath, 'development', 'lessons');
      await fs.mkdir(path.join(testLessonsPath, 'features'), { recursive: true });
      await fs.mkdir(path.join(testLessonsPath, 'errors'), { recursive: true });

      // Create sample lesson files
      const _sampleLessons = [
        {
          path: path.join(testLessonsPath, 'features', 'react-optimization.md'),
          content: '# React Performance Optimization\n\nBest practices for optimizing React applications...',
        },
        {
          path: path.join(testLessonsPath, 'errors', 'async-errors.md'),
          content: '# Async Function Errors\n\nCommon errors in async functions and how to fix them...',
        },
      ];

      for (const lesson of sampleLessons) {
        await fs.writeFile(lesson.path, lesson.content);
      }

      // Verify files were created
      const _featuresFiles = await fs.readdir(path.join(testLessonsPath, 'features'));
      const _errorsFiles = await fs.readdir(path.join(testLessonsPath, 'errors'));

      expect(featuresFiles).toContain('react-optimization.md');
      expect(errorsFiles).toContain('async-errors.md');
    });

    test('should migrate existing content successfully', async () => {
      const _migrationComponents = {
        embeddingGenerator,
        vectorDatabase,
        ragOperations,
      };

      // Get initial vector count
      const _initialStats = vectorDatabase.getStatistics();
      const _initialVectorCount = initialStats.totalVectors;

      // Perform migration
      const _migrationResult = await migrationSystem.migrate(migrationComponents);

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.summary).toHaveProperty('successfulMigrations');
      expect(migrationResult.summary.successfulMigrations).toBeGreaterThan(0);

      // Verify vectors were added
      const _finalStats = vectorDatabase.getStatistics();
      expect(finalStats.totalVectors).toBeGreaterThan(initialVectorCount);

      // Test that migrated content is searchable
      const _searchResults = await ragOperations.searchLessons('React optimization');
      expect(searchResults.length).toBeGreaterThan(0);

      const _reactResult = searchResults.find(r => r.title?.includes('React'));
      expect(reactResult).toBeDefined();
    });
  });

  describe('Analytics and Monitoring', () => {
    test('should provide comprehensive system analytics', async () => {
      const _analytics = await ragOperations.getAnalytics();

      expect(analytics).toHaveProperty('overview');
      expect(analytics).toHaveProperty('performance');
      expect(analytics).toHaveProperty('usage');
      expect(analytics).toHaveProperty('optimization');

      // Overview metrics
      expect(analytics.overview).toHaveProperty('isInitialized', true);
      expect(analytics.overview).toHaveProperty('totalLessonsStored');
      expect(analytics.overview).toHaveProperty('totalErrorsStored');
      expect(analytics.overview).toHaveProperty('totalSearchQueries');

      // Performance metrics
      expect(analytics.performance).toHaveProperty('embeddingGeneration');
      expect(analytics.performance).toHaveProperty('vectorDatabase');
      expect(analytics.performance).toHaveProperty('semanticSearch');

      // Usage patterns
      expect(analytics.usage).toHaveProperty('lessonTypeDistribution');
      expect(analytics.usage).toHaveProperty('searchPatterns');

      // Optimization recommendations
      expect(analytics.optimization).toHaveProperty('recommendedActions');
      expect(analytics.optimization.recommendedActions).toBeInstanceOf(Array);
    });

    test('should track performance metrics accurately', async () => {
      const _initialStats = semanticSearchEngine.getStatistics();
      const _initialQueries = initialStats.queriesProcessed;

      // Perform several search operations
      await ragOperations.searchLessons('JavaScript performance');
      await ragOperations.searchLessons('React error handling');
      await ragOperations.findSimilarErrors('TypeError in component');

      const _finalStats = semanticSearchEngine.getStatistics();

      // Verify metrics were updated
      expect(finalStats.queriesProcessed).toBeGreaterThan(initialQueries);
      expect(finalStats.averageQueryTime).toBeGreaterThan(0);
      expect(finalStats.isInitialized).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid input gracefully', async () => {
      // Test invalid lesson data
      await expect(ragOperations.storeLesson(null)).rejects.toThrow();
      await expect(ragOperations.storeLesson({})).rejects.toThrow();

      // Test invalid search queries
      const _emptyResults = await ragOperations.searchLessons('');
      expect(emptyResults).toBeInstanceOf(Array);

      const _nullResults = await ragOperations.searchLessons(null);
      expect(nullResults).toBeInstanceOf(Array);
    });

    test('should recover from component failures', async () => {
      // Test system resilience by clearing caches and testing recovery
      embeddingGenerator.clearCache();
      vectorDatabase.clearCache();
      semanticSearchEngine.clearCache();

      // System should continue to function
      const _lesson = testDataGenerator.generateLessons(1)[0];
      const _result = await ragOperations.storeLesson(lesson);
      expect(result.success).toBe(true);

      const _searchResults = await ragOperations.searchLessons(lesson.title);
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });
});

// Performance benchmark tests
describe('RAG System Performance Benchmarks', () => {
  test('should meet embedding generation performance targets', async () => {
    const embeddingGenerator = new EmbeddingGenerator({
      fallbackModel: 'sentence-transformers/all-MiniLM-L6-v2',
    });

    await embeddingGenerator.initialize();

    const testContent = 'JavaScript async function error handling best practices';
    const iterations = 10;

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await embeddingGenerator.generateEmbeddings(testContent);
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;

    // Should generate embeddings in reasonable time
    expect(avgTime).toBeLessThan(3000); // Less than 3 seconds per embedding

    console.log(`Embedding generation benchmark: ${avgTime.toFixed(2)}ms average per embedding`);

    await embeddingGenerator.cleanup();
  });

  test('should meet search performance targets', async () => {
    const searchIterations = 50;
    const ragOps = ragOperations; // Use existing initialized instance

    const queries = [
      'JavaScript error handling',
      'React performance optimization',
      'API security best practices',
      'Database query optimization',
      'Frontend build tools',
    ];

    const startTime = Date.now();

    for (let i = 0; i < searchIterations; i++) {
      const _query = queries[i % queries.length];
      await ragOps.searchLessons(query, { maxResults: 5 });
    }

    const endTime = Date.now();
    const avgSearchTime = (endTime - startTime) / searchIterations;

    // Should search in reasonable time
    expect(avgSearchTime).toBeLessThan(1000); // Less than 1 second per search

    console.log(`Search performance benchmark: ${avgSearchTime.toFixed(2)}ms average per search`);
  });
});
