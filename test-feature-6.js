/**
 * Test Feature 6: Learning Recommendation Engine
 */

const RAGOperations = require('./lib/api-modules/rag/ragOperations');

async function testLearningRecommendationEngine() {
  try {
    loggers.stopHook.log(
      'Testing Feature 6: Learning Recommendation Engine...'
    );

    // Create RAG operations instance
    const ragOps = new RAGOperations({
      taskManager: null,
      agentManager: null,
      withTimeout: (promise, _timeout) => promise,
    });

    // Test user context
    const userContext = {
      userId: 'test_user',
      currentContext: {
        currentProject: 'learning_system',
        recentErrors: [],
      },
      learningHistory: [],
      preferences: {
        categories: ['features', 'implementation'],
      },
      skillLevel: 'intermediate',
      interests: ['javascript', 'nodejs', 'api'],
      completedLessons: [],
      failedAttempts: [],
    };

    // Test 1: Generate learning recommendations
    loggers.stopHook.log('\n1. Testing generateLearningRecommendations...');
    const recommendations = await ragOps.generateLearningRecommendations(
      userContext,
      {
        strategy: 'hybrid',
        limit: 5,
      }
    );
    console.log('Recommendations result:', {
      success: recommendations.success,
      count: recommendations.count,
      strategy: recommendations.strategy,
      message: recommendations.message,
    });

    // Test 2: Get trending lessons
    loggers.stopHook.log('\n2. Testing getTrendingLessons...');
    const trending = await ragOps.getTrendingLessons({
      timeRange: 'week',
      limit: 3,
    });
    console.log('Trending lessons result:', {
      success: trending.success,
      count: trending.count,
      timeRange: trending.timeRange,
      message: trending.message,
    });

    // Test 3: Get similar lessons (if we have any lessons)
    loggers.stopHook.log('\n3. Testing getSimilarLessons...');
    const similar = await ragOps.getSimilarLessons(1, {
      limit: 3,
      threshold: 0.6,
    });
    console.log('Similar lessons result:', {
      success: similar.success,
      message: similar.message,
    });

    // Test 4: Get recommendation analytics
    loggers.stopHook.log('\n4. Testing getRecommendationAnalytics...');
    const analytics = await ragOps.getRecommendationAnalytics({
      timeRange: 30,
    });
    console.log('Recommendation analytics result:', {
      success: analytics.success,
      timeRange: analytics.timeRange,
      message: analytics.message,
    });

    console.log(
      '\n✅ Feature 6: Learning Recommendation Engine integration test completed successfully!'
    );
  } catch (error) {
    loggers.stopHook.error('❌ Feature 6 test failed:', error.message);
    loggers.stopHook.error('Stack:', error.stack);
  }
}

// Run the test
testLearningRecommendationEngine();
