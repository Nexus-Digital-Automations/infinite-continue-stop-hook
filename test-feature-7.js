/**
 * Test Feature 7: Adaptive Learning Paths System
 */

const RAGOperations = require('./lib/api-modules/rag/ragOperations');

async function testAdaptiveLearningPaths() {
  try {
    console.log('Testing Feature 7: Adaptive Learning Paths System...');

    // Create RAG operations instance
    const ragOps = new RAGOperations({
      taskManager: null,
      agentManager: null,
      withTimeout: (promise, _timeout) => promise,
    });

    // Test user profile
    const userProfile = {
      userId: 'test_user',
      skillLevels: {
        javascript: 'intermediate',
        nodejs: 'beginner',
      },
      strengthAreas: ['javascript', 'frontend'],
      weaknessAreas: ['backend', 'databases'],
      learningStyle: 'mixed',
      preferredDifficulty: 'intermediate',
      completedLessons: [1, 2, 3],
      interests: ['web development', 'api design'],
    };

    // Test learning goals
    const learningGoals = {
      skills: ['nodejs', 'express', 'database', 'api'],
      timeline: '30 days',
      priorities: ['backend development', 'api design'],
      objectives: ['Build REST API', 'Understand database integration'],
    };

    // Test 1: Generate adaptive learning path
    console.log('\n1. Testing generateAdaptiveLearningPath...');
    const learningPath = await ragOps.generateAdaptiveLearningPath(
      userProfile,
      learningGoals,
      {
        pathType: 'adaptive',
        maxLength: 10,
        includeBranching: true,
        includeAssessments: true,
      }
    );
    console.log('Learning path result:', {
      success: learningPath.success,
      pathType: learningPath.pathType,
      totalLessons: learningPath.pathMetrics?.totalLessons || 0,
      estimatedDuration: learningPath.estimatedDuration || 0,
      message: learningPath.message,
    });

    // Test 2: Get learning path recommendations
    console.log('\n2. Testing getLearningPathRecommendations...');
    const pathRecommendations = await ragOps.getLearningPathRecommendations(
      userProfile,
      ['nodejs', 'express'],
      {
        includeAlternatives: true,
        maxRecommendations: 3,
      }
    );
    console.log('Path recommendations result:', {
      success: pathRecommendations.success,
      count: pathRecommendations.count,
      skillGaps: pathRecommendations.skillGaps,
      message: pathRecommendations.message,
    });

    // Test 3: Track learning path progress
    console.log('\n3. Testing trackLearningPathProgress...');
    const userProgress = {
      completionRate: 0.6,
      averageScore: 0.8,
      timeSpent: 120, // minutes
      strugglingAreas: ['databases'],
      strongAreas: ['javascript'],
    };
    const progressTracking = await ragOps.trackLearningPathProgress(
      'path_123',
      userProgress,
      {
        includeDetailedAnalysis: true,
        checkAdaptationTriggers: true,
      }
    );
    console.log('Progress tracking result:', {
      success: progressTracking.success,
      completionPercentage: progressTracking.completionPercentage,
      message: progressTracking.message,
    });

    // Test 4: Get adaptive learning analytics
    console.log('\n4. Testing getAdaptiveLearningAnalytics...');
    const analytics = await ragOps.getAdaptiveLearningAnalytics({
      timeRange: 30,
      includeUserSegmentation: true,
    });
    console.log('Analytics result:', {
      success: analytics.success,
      timeRange: analytics.timeRange,
      message: analytics.message,
    });

    // Test 5: Adapt learning path (simulate adaptation)
    console.log('\n5. Testing adaptLearningPath...');
    const pathAdaptation = await ragOps.adaptLearningPath(
      'path_123',
      userProgress,
      {
        adaptationTrigger: 'performance_drop',
        preserveProgress: true,
      }
    );
    console.log('Path adaptation result:', {
      success: pathAdaptation.success,
      message: pathAdaptation.message,
    });

    console.log(
      '\n✅ Feature 7: Adaptive Learning Paths System integration test completed successfully!'
    );
  } catch (error) {
    console.error('❌ Feature 7 test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAdaptiveLearningPaths();
