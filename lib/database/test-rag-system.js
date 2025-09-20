/* eslint-disable no-console -- Development/debugging script requires console output */
/**
 * RAG Database System Comprehensive Test
 *
 * Tests all components of the RAG-based agent learning system:
 * - Database initialization and schema
 * - Vector embedding generation and storage
 * - Semantic search functionality
 * - TaskManager API integration
 * - Performance and analytics
 *
 * @author Database Architecture Agent
 * @version 1.0.0
 * @since 2025-09-20
 */

const _path = require('path');
const _fs = require('fs').promises;
const _DatabaseManager = require('./DatabaseManager');
const _VectorEmbeddingManager = require('./VectorEmbeddingManager');
const _RAGOperations = require('../api-modules/rag/ragOperations');

class RAGSystemTest {
  constructor() {
    this.testDbPath = _path.join(__dirname, '../../data/test_rag_learning.db');
    this.dbManager = null;
    this.vectorManager = null;
    this.ragOperations = null;
    this.testResults = [];
  }

  /**
   * Run comprehensive test suite
   */
  async runTests() {
    console.log('🧪 Starting RAG Database System Comprehensive Test');
    console.log('=' .repeat(60));

    try {
      // Cleanup any existing test database
      await this.cleanup();

      // Test 1: Database initialization
      await this.testDatabaseInitialization();

      // Test 2: Vector embedding system
      await this.testVectorEmbeddingSystem();

      // Test 3: Lesson storage and retrieval
      await this.testLessonOperations();

      // Test 4: Error storage and analysis
      await this.testErrorOperations();

      // Test 5: Semantic search
      await this.testSemanticSearch();

      // Test 6: RAG operations integration
      await this.testRAGOperationsIntegration();

      // Test 7: Performance and analytics
      await this.testPerformanceAnalytics();

      // Test 8: Edge cases and error handling
      await this.testEdgeCasesAndErrorHandling();

      // Summary
      this.printTestSummary();

      return { success: true, total_tests: this.testResults.length };
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test database initialization
   */
  async testDatabaseInitialization() {
    console.log('\n📊 Testing Database Initialization...');

    try {
      this.dbManager = new _DatabaseManager({
        dbPath: this.testDbPath,
        enableLogging: false,
      });

      await this.dbManager.initialize();

      // Verify tables exist
      const tables = await this.dbManager.all(`
        SELECT name FROM sqlite_master WHERE type='table'
        ORDER BY name
      `);

      const expectedTables = [
        'projects', 'agents', 'tasks', 'lessons', 'errors', 'embeddings',
        'lesson_relationships', 'error_lesson_associations', 'usage_analytics',
        'performance_metrics',
      ];

      for (const tableName of expectedTables) {
        const exists = tables.some(t => t.name === tableName);
        this.recordTest(`Table ${tableName} exists`, exists);
      }

      // Test health check
      const health = await this.dbManager.healthCheck();
      this.recordTest('Database health check', health.status === 'healthy');

      console.log('  ✓ Database initialization tests completed');
    } catch (error) {
      this.recordTest('Database initialization', false, error.message);
      throw error;
    }
  }

  /**
   * Test vector embedding system
   */
  async testVectorEmbeddingSystem() {
    console.log('\n🔍 Testing Vector Embedding System...');

    try {
      this.vectorManager = new _VectorEmbeddingManager({
        dbManager: this.dbManager,
        enableCache: true,
        logger: { info: () => {}, warn: () => {}, error: console.error, debug: () => {} },
      });

      await this.vectorManager.initialize();

      // Test embedding generation
      const testText = 'This is a test text for embedding generation';
      const embedding = await this.vectorManager.generateEmbedding(testText);

      this.recordTest('Embedding generation returns vector', Array.isArray(embedding.vector));
      this.recordTest('Embedding has correct dimension', embedding.dimension === 384);
      this.recordTest('Embedding includes model info', !!embedding.model);

      // Test embedding storage
      await this.vectorManager.storeEmbedding('lesson', 1, testText, { test: true });

      const storedEmbedding = await this.dbManager.get(
        'SELECT * FROM embeddings WHERE entity_type = ? AND entity_id = ?',
        ['lesson', 1],
      );

      this.recordTest('Embedding stored in database', !!storedEmbedding);
      this.recordTest('Stored embedding has correct type', storedEmbedding.entity_type === 'lesson');

      console.log('  ✓ Vector embedding system tests completed');
    } catch (error) {
      this.recordTest('Vector embedding system', false, error.message);
      throw error;
    }
  }

  /**
   * Test lesson operations
   */
  async testLessonOperations() {
    console.log('\n📝 Testing Lesson Operations...');

    try {
      // Test lesson storage
      const testLesson = {
        title: 'Test Lesson: ESLint Error Resolution',
        category: 'error_resolution',
        content: 'When encountering unused variable errors in ESLint, remove the variable or prefix with underscore to indicate intentional non-use.',
        context: 'JavaScript development with ESLint',
        tags: ['eslint', 'javascript', 'linter'],
        confidence_score: 0.9,
        effectiveness_score: 0.8,
      };

      const result = await this.dbManager.run(
        `INSERT INTO lessons
         (title, category, content, context, tags, confidence_score, effectiveness_score, project_id, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'test_agent')`,
        [
          testLesson.title,
          testLesson.category,
          testLesson.content,
          testLesson.context,
          JSON.stringify(testLesson.tags),
          testLesson.confidence_score,
          testLesson.effectiveness_score,
        ],
      );

      this.recordTest('Lesson stored successfully', !!result.lastID);

      // Generate embedding for lesson
      const embeddingText = `${testLesson.title} | ${testLesson.category} | ${testLesson.content}`;
      await this.vectorManager.storeEmbedding('lesson', result.lastID, embeddingText);

      // Test lesson retrieval
      const retrievedLesson = await this.dbManager.get(
        'SELECT * FROM lessons WHERE id = ?',
        [result.lastID],
      );

      this.recordTest('Lesson retrieved successfully', !!retrievedLesson);
      this.recordTest('Lesson data integrity', retrievedLesson.title === testLesson.title);

      console.log('  ✓ Lesson operation tests completed');
    } catch (error) {
      this.recordTest('Lesson operations', false, error.message);
      throw error;
    }
  }

  /**
   * Test error operations
   */
  async testErrorOperations() {
    console.log('\n🚨 Testing Error Operations...');

    try {
      // Test error storage
      const testError = {
        title: 'Test Error: Unused Variable',
        error_type: 'linter',
        error_code: 'no-unused-vars',
        message: "'testVariable' is defined but never used",
        file_path: 'src/test.js',
        line_number: 42,
        severity: 'medium',
        tags: ['eslint', 'unused-vars'],
      };

      const result = await this.dbManager.run(
        `INSERT INTO errors
         (title, error_type, error_code, message, file_path, line_number, severity, tags, project_id, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'test_agent')`,
        [
          testError.title,
          testError.error_type,
          testError.error_code,
          testError.message,
          testError.file_path,
          testError.line_number,
          testError.severity,
          JSON.stringify(testError.tags),
        ],
      );

      this.recordTest('Error stored successfully', !!result.lastID);

      // Generate embedding for error
      const embeddingText = `${testError.title} | ${testError.error_type} | ${testError.message}`;
      await this.vectorManager.storeEmbedding('error', result.lastID, embeddingText);

      // Test error retrieval
      const retrievedError = await this.dbManager.get(
        'SELECT * FROM errors WHERE id = ?',
        [result.lastID],
      );

      this.recordTest('Error retrieved successfully', !!retrievedError);
      this.recordTest('Error data integrity', retrievedError.title === testError.title);

      console.log('  ✓ Error operation tests completed');
    } catch (error) {
      this.recordTest('Error operations', false, error.message);
      throw error;
    }
  }

  /**
   * Test semantic search functionality
   */
  async testSemanticSearch() {
    console.log('\n🔍 Testing Semantic Search...');

    try {
      // Test lesson search
      const lessonSearchResults = await this.vectorManager.findSimilar(
        'ESLint unused variable error',
        'lesson',
        { limit: 5, threshold: 0.3 },
      );

      this.recordTest('Lesson semantic search returns results', lessonSearchResults.results.length > 0);

      // Test error search
      const errorSearchResults = await this.vectorManager.findSimilar(
        'unused variable linter error',
        'error',
        { limit: 5, threshold: 0.3 },
      );

      this.recordTest('Error semantic search returns results', errorSearchResults.results.length > 0);

      // Test similarity scoring
      if (lessonSearchResults.results.length > 0) {
        const firstResult = lessonSearchResults.results[0];
        this.recordTest('Search results include similarity scores', 'similarity_score' in firstResult || 'distance' in firstResult);
      }

      console.log('  ✓ Semantic search tests completed');
    } catch (error) {
      this.recordTest('Semantic search', false, error.message);
      // Don't throw - semantic search might fail due to model loading
      console.log('  ⚠ Semantic search test failed (expected with limited resources)');
    }
  }

  /**
   * Test RAG operations integration
   */
  async testRAGOperationsIntegration() {
    console.log('\n🔗 Testing RAG Operations Integration...');

    try {
      this.ragOperations = new _RAGOperations({
        taskManager: null, // Mock
        agentManager: null, // Mock
        withTimeout: (promise) => promise,
      });

      // Override initialization to use our test database
      this.ragOperations.dbManager = this.dbManager;
      this.ragOperations.vectorManager = this.vectorManager;
      this.ragOperations.isInitialized = true;

      // Test lesson storage through RAG operations
      const testLessonData = {
        title: 'RAG Integration Test Lesson',
        category: 'error_resolution',
        content: 'Test lesson content for RAG operations integration testing',
        confidence_score: 0.85,
      };

      const storeResult = await this.ragOperations.storeLesson(testLessonData);
      this.recordTest('RAG lesson storage', storeResult.success);

      // Test error storage through RAG operations
      const testErrorData = {
        title: 'RAG Integration Test Error',
        error_type: 'linter',
        message: 'Test error message for RAG operations integration',
      };

      const errorResult = await this.ragOperations.storeError(testErrorData);
      this.recordTest('RAG error storage', errorResult.success);

      console.log('  ✓ RAG operations integration tests completed');
    } catch (error) {
      this.recordTest('RAG operations integration', false, error.message);
      console.log('  ⚠ RAG operations test encountered issues:', error.message);
    }
  }

  /**
   * Test performance and analytics
   */
  async testPerformanceAnalytics() {
    console.log('\n📊 Testing Performance and Analytics...');

    try {
      // Test database statistics
      const stats = await this.dbManager.getStatistics();
      this.recordTest('Database statistics available', typeof stats === 'object');
      this.recordTest('Statistics include lesson count', 'lessons_count' in stats);

      // Test embedding statistics
      const embeddingStats = await this.vectorManager.getStatistics();
      this.recordTest('Embedding statistics available', typeof embeddingStats === 'object');

      // Test database optimization
      const optimizeResult = await this.dbManager.optimize();
      this.recordTest('Database optimization', optimizeResult.success);

      console.log('  ✓ Performance and analytics tests completed');
    } catch (error) {
      this.recordTest('Performance analytics', false, error.message);
      throw error;
    }
  }

  /**
   * Test edge cases and error handling
   */
  async testEdgeCasesAndErrorHandling() {
    console.log('\n🔬 Testing Edge Cases and Error Handling...');

    try {
      // Test invalid lesson data
      try {
        await this.ragOperations.storeLesson({
          title: 'Invalid Lesson',
          // Missing required fields
        });
        this.recordTest('Invalid lesson rejection', false);
      } catch {
        this.recordTest('Invalid lesson rejection', true);
      }

      // Test invalid error data
      try {
        await this.ragOperations.storeError({
          title: 'Invalid Error',
          // Missing required fields
        });
        this.recordTest('Invalid error rejection', false);
      } catch {
        this.recordTest('Invalid error rejection', true);
      }

      // Test empty search
      const emptyResults = await this.vectorManager.findSimilar('', 'lesson', { limit: 5 });
      this.recordTest('Empty search handling', Array.isArray(emptyResults.results));

      console.log('  ✓ Edge cases and error handling tests completed');
    } catch (error) {
      this.recordTest('Edge cases and error handling', false, error.message);
      console.log('  ⚠ Some edge case tests failed:', error.message);
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, errorMessage = null) {
    this.testResults.push({
      name: testName,
      passed,
      error: errorMessage,
    });

    const status = passed ? '✓' : '❌';
    const message = errorMessage ? ` (${errorMessage})` : '';
    console.log(`    ${status} ${testName}${message}`);
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('\n📋 Test Summary');
    console.log('=' .repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✓`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✓'}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\nFailed Tests:');
      this.testResults.filter(t => !t.passed).forEach(test => {
        console.log(`  ❌ ${test.name}: ${test.error || 'Unknown error'}`);
      });
    }

    console.log('\n🎯 Overall Result:', failedTests === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ❌');
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    try {
      if (this.dbManager) {
        await this.dbManager.close();
      }

      // Remove test database
      try {
        await _fs.unlink(this.testDbPath);
      } catch {
        // File doesn't exist, ignore
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
}

// CLI support
async function main() {
  const test = new RAGSystemTest();

  try {
    const result = await test.runTests();
    if (!result.success) {
      throw new Error('RAG system tests failed');
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    throw error;
  }
}

// Export for programmatic use
module.exports = RAGSystemTest;

// Run if called directly
if (require.main === module) {
  main();
}
