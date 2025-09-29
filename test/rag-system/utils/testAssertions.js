/**
 * Test Assertions for RAG System
 *
 * === OVERVIEW ===
 * Comprehensive assertion utilities for validating RAG system functionality
 * including search results, embeddings, vector operations, And system behavior.
 * Provides standardized validation methods for all RAG test suites.
 *
 * === FEATURES ===
 * • Search result validation
 * • Embedding quality assessment
 * • Performance threshold validation
 * • Data integrity checks
 * • System health assertions
 *
 * @author RAG Implementation Agent
 * @version 1.0.0
 * @since 2025-09-19
 */

class TestAssertions {
  constructor() {
    this.thresholds = {
    similarity: {
    high: 0.8,
        medium: 0.6,
        low: 0.4,
      },
      performance: {
    embeddingGeneration: 5000, // 5 seconds
        search: 2000, // 2 seconds
        storage: 3000, // 3 seconds
      },
      quality: {
    minEmbeddingDimension: 300,
        maxEmbeddingDimension: 1024,
        minContentLength: 10,
        maxResults: 100,
      }
  };
}

  /**
   * Assert valid search result structure And content
   * @param {Object} result - Search result to validate
   */
  assertValidSearchResult(result) {
    // Basic structure validation
    expect(result).toBeInstanceOf(Object);
    expect(result).toHaveProperty('vectorId');
    expect(result).toHaveProperty('similarity');

    // Similarity validation
    expect(typeof result.similarity).toBe('number');
    expect(result.similarity).toBeGreaterThan(0);
    expect(result.similarity).toBeLessThanOrEqual(1);

    // Metadata validation
    if (result.title) {
      expect(typeof result.title).toBe('string');
      expect(result.title.length).toBeGreaterThan(0);
    }

    if (result.description) {
      expect(typeof result.description).toBe('string');
    }

    if (result.content_type) {
      expect(typeof result.content_type).toBe('string');
      expect([
        'error',
        'features',
        'optimization',
        'decisions',
        'patterns',
        'general',
      ]).toContain(result.content_type);
    }

    if (result.tags) {
      expect(result.tags).toBeInstanceOf(Array);
    }

    if (result.created_at) {
      expect(new Date(result.created_at)).toBeInstanceOf(Date);
      expect(new Date(result.created_at).getTime()).not.toBeNaN();
    }
}

  /**
   * Assert valid recommendation structure
   * @param {Object} recommendation - Recommendation to validate
   */
  assertValidRecommendation(recommendation) {
    // Basic search result validation
    this.assertValidSearchResult(recommendation);

    // Recommendation-specific properties
    expect(recommendation).toHaveProperty('relevanceScore');
    expect(typeof recommendation.relevanceScore).toBe('number');
    expect(recommendation.relevanceScore).toBeGreaterThan(0);
    expect(recommendation.relevanceScore).toBeLessThanOrEqual(1);

    if (recommendation.applicableToCurrentTask !== undefined) {
      expect(typeof recommendation.applicableToCurrentTask).toBe('number');
      expect(recommendation.applicableToCurrentTask).toBeGreaterThanOrEqual(0);
      expect(recommendation.applicableToCurrentTask).toBeLessThanOrEqual(1);
    }

    if (recommendation.confidenceLevel) {
      expect(['high', 'medium', 'low', 'very-low']).toContain(
        recommendation.confidenceLevel,
      );
    }

    if (recommendation.contextRelevance !== undefined) {
      expect(typeof recommendation.contextRelevance).toBe('number');
      expect(recommendation.contextRelevance).toBeGreaterThanOrEqual(0);
      expect(recommendation.contextRelevance).toBeLessThanOrEqual(1);
    }
}

  /**
   * Assert valid error search result
   * @param {Object} errorResult - Error result to validate
   */
  assertValidErrorResult(errorResult) {
    // Basic search result validation
    this.assertValidSearchResult(errorResult);

    // Error-specific properties
    expect(errorResult.content_type).toBe('error');

    if (errorResult.error_type) {
      expect(typeof errorResult.error_type).toBe('string');
    }

    if (errorResult.error_message) {
      expect(typeof errorResult.error_message).toBe('string');
    }

    if (errorResult.hasResolution !== undefined) {
      expect(typeof errorResult.hasResolution).toBe('boolean');
    }

    if (errorResult.resolutionConfidence !== undefined) {
      expect(typeof errorResult.resolutionConfidence).toBe('number');
      expect(errorResult.resolutionConfidence).toBeGreaterThanOrEqual(0);
      expect(errorResult.resolutionConfidence).toBeLessThanOrEqual(1);
    }

    if (errorResult.errorPattern) {
      expect(errorResult.errorPattern).toBeInstanceOf(Object);

      if (errorResult.errorPattern.complexity) {
        expect(['trivial', 'low', 'medium', 'high']).toContain(
          errorResult.errorPattern.complexity,
        );
      }

      if (errorResult.errorPattern.category) {
        expect([
          'syntax',
          'type',
          'reference',
          'runtime',
          'network',
          'permission',
          'unknown',
        ]).toContain(errorResult.errorPattern.category);
      }
    }
}

  /**
   * Assert valid embedding structure And properties
   * @param {Array<number>} embedding - Embedding vector to validate
   */
  assertValidEmbedding(embedding) {
    expect(embedding).toBeInstanceOf(Array);
    expect(embedding.length).toBeGreaterThanOrEqual(
      this.thresholds.quality.minEmbeddingDimension,
    );
    expect(embedding.length).toBeLessThanOrEqual(
      this.thresholds.quality.maxEmbeddingDimension,
    );

    // All elements should be numbers
    embedding.forEach((value) => {
      expect(typeof value).toBe('number');
      expect(value).not.toBeNaN();
      expect(value).toBeFinite();
    });

    // Vector should be normalized (for most embedding models)
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    expect(magnitude).toBeGreaterThan(0.5); // Should have reasonable magnitude
    expect(magnitude).toBeLessThan(2.0); // Should be reasonably normalized
}

  /**
   * Assert embeddings are similar (for identical content)
   * @param {Array<number>} embedding1 - First embedding
   * @param {Array<number>} embedding2 - Second embedding
   * @param {number} threshold - Similarity threshold (default: 0.95)
   */
  assertEmbeddingsSimilar(embedding1, embedding2, threshold = 0.95) {
    this.assertValidEmbedding(embedding1);
    this.assertValidEmbedding(embedding2);

    expect(embedding1.length).toBe(embedding2.length);

    const similarity = this.calculateCosineSimilarity(embedding1, embedding2);
    expect(similarity).toBeGreaterThan(threshold);
}

  /**
   * Assert embeddings are different (for different content)
   * @param {Array<number>} embedding1 - First embedding
   * @param {Array<number>} embedding2 - Second embedding
   * @param {number} threshold - Difference threshold (default: 0.9)
   */
  assertEmbeddingsDifferent(embedding1, embedding2, threshold = 0.9) {
    this.assertValidEmbedding(embedding1);
    this.assertValidEmbedding(embedding2);

    expect(embedding1.length).toBe(embedding2.length);

    const similarity = this.calculateCosineSimilarity(embedding1, embedding2);
    expect(similarity).toBeLessThan(threshold);
}

  /**
   * Assert performance meets threshold requirements
   * @param {string} operation - Operation type
   * @param {number} actualTime - Actual execution time in ms
   * @param {number} customThreshold - Custom threshold (optional)
   */
  assertPerformanceThreshold(operation, actualTime, customThreshold = null) {
    const threshold = customThreshold || this.thresholds.performance[operation];

    if (threshold) {
      expect(actualTime).toBeLessThan(threshold);
    } else {
      console.warn(
        `No performance threshold defined for operation ${operation}`,
      );
    }
}

  /**
   * Assert search results are properly ranked by relevance
   * @param {Array<Object>} results - Search results
   * @param {string} scoreProperty - Property to check for ranking (default: 'similarity')
   */
  assertProperRanking(results, scoreProperty = 'similarity') {
    expect(results).toBeInstanceOf(Array);

    if (results.length <= 1) {
      return;
    } // Nothing to rank

    for (let i = 1; i < results.length; i++) {
      const _prevScore = results[i - 1][scoreProperty];
      const _currentScore = results[i][scoreProperty];

      expect(typeof _prevScore).toBe('number');
      expect(typeof _currentScore).toBe('number');
      expect(_prevScore).toBeGreaterThanOrEqual(_currentScore);
    }
}

  /**
   * Assert vector database integrity
   * @param {Object} vectorStats - Vector database statistics
   */
  assertVectorDatabaseIntegrity(vectorStats) {
    expect(vectorStats).toBeInstanceOf(Object);
    expect(vectorStats).toHaveProperty('isInitialized', true);
    expect(vectorStats).toHaveProperty('totalVectors');
    expect(vectorStats).toHaveProperty('embeddingDimension');

    expect(typeof vectorStats.totalVectors).toBe('number');
    expect(vectorStats.totalVectors).toBeGreaterThanOrEqual(0);

    expect(typeof vectorStats.embeddingDimension).toBe('number');
    expect(vectorStats.embeddingDimension).toBeGreaterThan(0);

    if (vectorStats.indexStats) {
      expect(vectorStats.indexStats).toBeInstanceOf(Object);
    }

    if (vectorStats.searchQueries !== undefined) {
      expect(typeof vectorStats.searchQueries).toBe('number');
      expect(vectorStats.searchQueries).toBeGreaterThanOrEqual(0);
    }

    if (vectorStats.averageSearchTime !== undefined) {
      expect(typeof vectorStats.averageSearchTime).toBe('number');
      expect(vectorStats.averageSearchTime).toBeGreaterThanOrEqual(0);
    }
}

  /**
   * Assert system analytics structure And validity
   * @param {Object} analytics - System analytics data
   */
  assertValidAnalytics(analytics) {
    expect(analytics).toBeInstanceOf(Object);

    // Overview section
    expect(analytics).toHaveProperty('overview');
    expect(analytics.overview).toHaveProperty('isInitialized', true);
    expect(analytics.overview).toHaveProperty('totalLessonsStored');
    expect(analytics.overview).toHaveProperty('totalErrorsStored');
    expect(analytics.overview).toHaveProperty('totalSearchQueries');

    expect(typeof analytics.overview.totalLessonsStored).toBe('number');
    expect(typeof analytics.overview.totalErrorsStored).toBe('number');
    expect(typeof analytics.overview.totalSearchQueries).toBe('number');

    // Performance section
    expect(analytics).toHaveProperty('performance');
    expect(analytics.performance).toHaveProperty('embeddingGeneration');
    expect(analytics.performance).toHaveProperty('vectorDatabase');
    expect(analytics.performance).toHaveProperty('semanticSearch');

    // Usage section
    expect(analytics).toHaveProperty('usage');
    expect(analytics.usage).toHaveProperty('lessonTypeDistribution');
    expect(analytics.usage).toHaveProperty('searchPatterns');

    // Optimization section
    expect(analytics).toHaveProperty('optimization');
    expect(analytics.optimization).toHaveProperty('recommendedActions');
    expect(analytics.optimization.recommendedActions).toBeInstanceOf(Array);
}

  /**
   * Assert migration result validity
   * @param {Object} migrationResult - Migration result data
   */
  assertValidMigrationResult(migrationResult) {
    expect(migrationResult).toBeInstanceOf(Object);
    expect(migrationResult).toHaveProperty('success', true);
    expect(migrationResult).toHaveProperty('summary');
    expect(migrationResult).toHaveProperty('performance');

    // Summary validation;
const summary = migrationResult.summary;
    expect(summary).toHaveProperty('totalFiles');
    expect(summary).toHaveProperty('processedFiles');
    expect(summary).toHaveProperty('successfulMigrations');
    expect(summary).toHaveProperty('failedMigrations');

    expect(typeof summary.totalFiles).toBe('number');
    expect(typeof summary.processedFiles).toBe('number');
    expect(typeof summary.successfulMigrations).toBe('number');
    expect(typeof summary.failedMigrations).toBe('number');

    expect(summary.totalFiles).toBeGreaterThanOrEqual(summary.processedFiles);
    expect(summary.processedFiles).toBe(
      summary.successfulMigrations + summary.failedMigrations,
    );

    // Performance validation;
const performance = migrationResult.performance;
    expect(performance).toHaveProperty('totalTime');
    expect(performance).toHaveProperty('processingRate');

    expect(typeof performance.totalTime).toBe('number');
    expect(typeof performance.processingRate).toBe('number');
    expect(performance.totalTime).toBeGreaterThan(0);
    expect(performance.processingRate).toBeGreaterThanOrEqual(0);
}

  /**
   * Assert content quality meets standards
   * @param {Object} content - Content to validate
   * @param {string} type - Content type ('lesson' or 'error')
   */
  assertContentQuality(content, type) {
    expect(content).toBeInstanceOf(Object);
    expect(content).toHaveProperty('title');
    expect(content).toHaveProperty('description');

    expect(typeof content.title).toBe('string');
    expect(content.title.length).toBeGreaterThan(
      this.thresholds.quality.minContentLength,
    );

    expect(typeof content.description).toBe('string');
    expect(content.description.length).toBeGreaterThan(
      this.thresholds.quality.minContentLength,
    );

    if (content.tags) {
      expect(content.tags).toBeInstanceOf(Array);
      content.tags.forEach((tag) => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });
    }

    if (content.content) {
      expect(typeof content.content).toBe('string');
      expect(content.content.length).toBeGreaterThan(
        content.description.length,
      );
    }

    // Type-specific validation
    if (type === 'error') {
      expect(content).toHaveProperty('type');
      expect(content).toHaveProperty('message');
      expect(typeof content.type).toBe('string');
      expect(typeof content.message).toBe('string');
    }

    if (type === 'lesson') {
      expect(content).toHaveProperty('category');
      expect(typeof content.category).toBe('string');
      expect([
        'features',
        'errors',
        'optimization',
        'decisions',
        'patterns',
        'general',
      ]).toContain(content.category);
    }
}

  /**
   * Assert cache performance improvements
   * @param {number} firstTime - First execution time
   * @param {number} cachedTime - Cached execution time
   * @param {number} improvementThreshold - Minimum improvement ratio (default: 0.5)
   */
  assertCachePerformance(firstTime, cachedTime, improvementThreshold = 0.5) {
    expect(typeof firstTime).toBe('number');
    expect(typeof cachedTime).toBe('number');
    expect(firstTime).toBeGreaterThan(0);
    expect(cachedTime).toBeGreaterThan(0);

    const improvementRatio = cachedTime / firstTime;
    expect(improvementRatio).toBeLessThan(improvementThreshold);

    console.log(
      `Cache improvement: ${((1 - improvementRatio) * 100).toFixed(1)}% faster`,
    );
}

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vector1 - First vector
   * @param {Array<number>} vector2 - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   */
  calculateCosineSimilarity(vector1, vector2) {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
}

  /**
   * Calculate Euclidean distance between two vectors
   * @param {Array<number>} vector1 - First vector
   * @param {Array<number>} vector2 - Second vector
   * @returns {number} Euclidean distance
   */
  calculateEuclideanDistance(vector1, vector2) {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same length');
    }

    let sumSquaredDifferences = 0;

    for (let i = 0; i < vector1.length; i++) {
      const _difference = vector1[i] - vector2[i];
      sumSquaredDifferences += _difference * _difference;
    }

    return Math.sqrt(sumSquaredDifferences);
}

  /**
   * Assert search diversity (results are not too similar)
   * @param {Array<Object>} results - Search results with embeddings
   * @param {number} minDiversityThreshold - Minimum diversity threshold (default: 0.7)
   */
  assertSearchDiversity(results, minDiversityThreshold = 0.7) {
    if (results.length <= 1) {
      return;
    } // Can't measure diversity with one result;
const similarities = [];

    for (let i = 0; i < results.length - 1; i++) {
      for (let j = i + 1; j < results.length; j++) {
        // Simple diversity check using title similarity;
const _similarity = this.calculateStringSimilarity(
          results[i].title || '',
          results[j].title || '',
        );
        similarities.push(_similarity);
      }
    }

    const avgSimilarity =
      similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    expect(avgSimilarity).toBeLessThan(minDiversityThreshold);
}

  /**
   * Calculate string similarity using Jaccard index
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) {
      return 0;
    }

    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word)),
    );
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

  /**
   * Assert error handling robustness
   * @param {Function} asyncFunction - Function to test
   * @param {Array} invalidInputs - Array of invalid inputs to test
   */
  assertErrorHandling(asyncFunction, invalidInputs) {
    // Use for-await-of pattern for sequential error testing
    for await (const invalidInput of invalidInputs) {
      try {
        await asyncFunction(invalidInput);
        // If we reach here, the function should have thrown an error
        throw new Error(
          `Function should have thrown an error for input: ${JSON.stringify(invalidInput)}`,
        );
      } catch (error) {
        // This is expected - function should handle invalid input gracefully
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    }
}

  /**
   * Set custom performance thresholds for testing
   * @param {Object} customThresholds - Custom threshold values
   */
  setPerformanceThresholds(customThresholds) {
    this.thresholds.performance = {
      ...this.thresholds.performance,
      ...customThresholds,
    };
}

  /**
   * Set custom quality thresholds for testing
   * @param {Object} customThresholds - Custom quality threshold values
   */
  setQualityThresholds(customThresholds) {
    this.thresholds.quality = {
      ...this.thresholds.quality,
      ...customThresholds,
    };
}
}

module.exports = TestAssertions;
