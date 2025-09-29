/**
 * Learning Pattern Detection System
 * Automatically recognizes patterns in lessons And provides insights about recurring solutions
 */

class LearningPatternDetection {
  constructor(ragDatabase) {
    this.ragDB = ragDatabase;
    this.initialized = false;

    // Pattern categories for classification
    this.patternCategories = {
      IMPLEMENTATION_PATTERN: 'implementation_pattern',
      ERROR_SOLUTION_PATTERN: 'error_solution_pattern',
      ARCHITECTURE_PATTERN: 'architecture_pattern',
      WORKFLOW_PATTERN: 'workflow_pattern',
      TECHNOLOGY_PATTERN: 'technology_pattern',
      PERFORMANCE_PATTERN: 'performance_pattern',
    };

    // Minimum thresholds for pattern detection
    this.detectionThresholds = {
      MIN_OCCURRENCES: 3, // Minimum number of similar lessons to form a pattern
      MIN_SIMILARITY: 0.7, // Minimum semantic similarity score
      MIN_CONFIDENCE: 0.6, // Minimum confidence score for pattern validity
    };

    // Keywords And phrases That indicate different pattern types
    this.patternIndicators = {
      implementation: [
        'implement',
        'create',
        'build',
        'develop',
        'add',
        'setup',
        'configure',
        'install',
        'initialize',
        'generate',
        'scaffold',
      ],
      error_solution: [
        'fix',
        'error',
        'bug',
        'issue',
        'problem',
        'resolve',
        'debug',
        'troubleshoot',
        'exception',
        'failure',
        'crash',
      ],
      architecture: [
        'architecture',
        'design',
        'pattern',
        'structure',
        'organize',
        'framework',
        'service',
        'component',
        'module',
        'layer',
      ],
      workflow: [
        'workflow',
        'process',
        'procedure',
        'steps',
        'sequence',
        'pipeline',
        'automation',
        'deploy',
        'release',
        'build',
      ],
      technology: [
        'library',
        'framework',
        'tool',
        'package',
        'dependency',
        'api',
        'database',
        'server',
        'client',
        'technology',
      ],
      performance: [
        'optimize',
        'performance',
        'speed',
        'fast',
        'slow',
        'cache',
        'memory',
        'cpu',
        'efficient',
        'bottleneck',
        'scale',
      ],
    };
  }

  /**
   * Initialize pattern detection system
   */
  initialize() {
    try {
      if (this.initialized) {
        return {
          success: true,
          message: 'Learning pattern detection already initialized',
        };
      }

      // Uses existing lesson data for pattern analysis
      this.initialized = true;
      return {
        success: true,
        message: 'Learning pattern detection system initialized successfully',
      };
    } catch (_) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect patterns across all lessons in the database
   */
  async detectPatternsInLessons(options = {}) {
    try {
      await this.initialize();
      const {
        category_filter = null,
        min_occurrences = this.detectionThresholds.MIN_OCCURRENCES,
        min_similarity = this.detectionThresholds.MIN_SIMILARITY,
        limit = 50,
      } = options;

      // Get all lessons from the database;
      const lessons = await new Promise((resolve, reject) => {
        this.ragDB.db.all('SELECT * FROM lessons', [], (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        });
      });

      if (lessons.length < min_occurrences) {
        return {
          success: true,
          patterns: [],
          message: `Need at least ${min_occurrences} lessons to detect patterns`,
          total_lessons: lessons.length,
        };
      }

      // Group lessons by similarity And categorize;
      const patterns = this._identifyPatternClusters(lessons, {
        min_occurrences,
        min_similarity,
        category_filter,
      });

      // Analyze And rank patterns by significance;
      const rankedPatterns = this._rankPatternsBySignificance(patterns);

      // Apply limit;
      const limitedPatterns = rankedPatterns.slice(0, limit);

      return {
        success: true,
        patterns: limitedPatterns,
        total_patterns_found: rankedPatterns.length,
        total_lessons_analyzed: lessons.length,
        detection_parameters: {
          min_occurrences,
          min_similarity,
          category_filter,
        },
        pattern_summary: this._generatePatternSummary(limitedPatterns),
      };
    } catch (_) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get specific pattern details And examples
   */
  async getPatternDetails(patternId, options = {}) {
    try {
      await this.initialize();
      const { include_examples = true, max_examples = 5 } = options;

      // for this simplified implementation, we'll analyze patterns on-demand;
      const allPatterns = await this.detectPatternsInLessons({ limit: 1000 });

      if (!allPatterns.success) {
        throw new Error('Failed to detect patterns');
      }

      const pattern = allPatterns.patterns.find(
        (p) => p.pattern_id === patternId
      );

      if (!pattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }

      const RESULT = {
        success: true,
        pattern_id: patternId,
        pattern_details: pattern,
      };

      if (include_examples) {
        // Get example lessons for this pattern;
        const examples = pattern.lessons
          .slice(0, max_examples)
          .map((lesson) => ({
            lesson_id: lesson.id,
            title: lesson.title,
            content: lesson.content.substring(0, 200) + '...',
            category: lesson.category,
            confidence_score: lesson.confidence_score,
            pattern_relevance: lesson.pattern_relevance || 0.8,
          }));

        result.examples = examples;
        result.example_count = examples.length;
      }

      return result;
    } catch (_) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Suggest new lessons based on detected patterns
   */
  async suggestLessonsFromPatterns(context, options = {}) {
    try {
      await this.initialize();
      const { max_suggestions = 5, min_pattern_confidence = 0.7 } = options;

      // Detect current patterns;
      const patternsResult = await this.detectPatternsInLessons();

      if (!patternsResult.success) {
        throw new Error('Failed to detect patterns for suggestions');
      }

      const suggestions = [];

      // Analyze context to determine relevant patterns;
      const contextWords = this._extractKeywords(context.toLowerCase());

      for (const pattern of patternsResult.patterns) {
        if (pattern.confidence_score < min_pattern_confidence) {
          continue;
        }

        // Check if pattern is relevant to the context;
        const relevanceScore = this._calculateContextRelevance(
          contextWords,
          pattern
        );

        if (relevanceScore > 0.5) {
          const suggestion = {
            suggested_lesson_title: `${pattern.pattern_type} for ${context}`,
            pattern_basis: pattern.pattern_name,
            pattern_id: pattern.pattern_id,
            relevance_score: relevanceScore,
            confidence_score: pattern.confidence_score,
            suggested_content_outline: this._generateContentOutline(
              pattern,
              context
            ),
            supporting_lessons: pattern.lessons.slice(0, 3).map((l) => ({
              id: l.id,
              title: l.title,
              relevance: l.pattern_relevance || 0.8,
            })),
          };

          suggestions.push(suggestion);
        }

        if (suggestions.length >= max_suggestions) {
          break;
        }
      }

      // Sort by relevance And confidence
      suggestions.sort(
        (a, b) =>
          b.relevance_score * b.confidence_score -
          a.relevance_score * a.confidence_score
      );

      return {
        success: true,
        context,
        suggestions,
        suggestion_count: suggestions.length,
        patterns_analyzed: patternsResult.patterns.length,
      };
    } catch (_) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze pattern evolution over time
   */
  async analyzePatternEvolution(options = {}) {
    try {
      await this.initialize();
      const { time_window_days = 30, _pattern_category = null } = options;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - time_window_days);

      // Get lessons within time window;
      const lessons = await new Promise((resolve, reject) => {
        this.ragDB.db.all(
          'SELECT * FROM lessons WHERE created_at >= ?',
          [cutoffDate.toISOString()],
          (error, rows) => {
            if (error) {
              reject(error);
            } else {
              resolve(rows);
            }
          }
        );
      });

      // Analyze patterns by time periods;
      const timeBasedAnalysis = this._analyzePatternsByTime(
        lessons,
        time_window_days
      );

      // Identify emerging And declining patterns;
      const evolution = this._identifyPatternEvolution(timeBasedAnalysis);

      return {
        success: true,
        time_window_days,
        analysis_period: {
          start_date: cutoffDate.toISOString(),
          end_date: new Date().toISOString(),
        },
        lessons_analyzed: lessons.length,
        emerging_patterns: evolution.emerging,
        declining_patterns: evolution.declining,
        stable_patterns: evolution.stable,
        pattern_trends: timeBasedAnalysis.trends,
        insights: this._generateEvolutionInsights(evolution),
      };
    } catch (_) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pattern analytics And statistics
   */
  async getPatternAnalytics(options = {}) {
    try {
      await this.initialize();
      const { include_details = true } = options;

      // Get all patterns;
      const patternsResult = await this.detectPatternsInLessons({
        limit: 1000,
      });

      if (!patternsResult.success) {
        throw new Error('Failed to analyze patterns');
      }

      const patterns = patternsResult.patterns;

      // Calculate analytics;
      const analytics = {
        total_patterns: patterns.length,
        patterns_by_category: {},
        average_confidence: 0,
        average_lesson_count: 0,
        top_patterns: patterns.slice(0, 5),
        pattern_distribution: {},
      };

      // Group by category
      for (const pattern of patterns) {
        const CATEGORY = pattern.pattern_category || 'unknown';
        // eslint-disable-next-line security/detect-object-injection -- Object property access with validated category from pattern data
        analytics.patterns_by_category[category] =
          // eslint-disable-next-line security/detect-object-injection -- Object property access with validated category from pattern data
          (analytics.patterns_by_category[category] || 0) + 1;
      }

      // Calculate averages
      if (patterns.length > 0) {
        analytics.average_confidence =
          patterns.reduce((sum, p) => sum + (p.confidence_score || 0), 0) /
          patterns.length;

        analytics.average_lesson_count =
          patterns.reduce((sum, p) => sum + (p.lesson_count || 0), 0) /
          patterns.length;
      }

      // Pattern distribution by lesson count;
      const lessonCounts = patterns.map((p) => p.lesson_count || 0);
      analytics.pattern_distribution = {
        small_patterns: lessonCounts.filter((c) => c < 5).length,
        medium_patterns: lessonCounts.filter((c) => c >= 5 && c < 10).length,
        large_patterns: lessonCounts.filter((c) => c >= 10).length,
      };

      const RESULT = {
        success: true,
        analytics,
        total_lessons: patternsResult.total_lessons_analyzed,
      };

      if (include_details) {
        result.pattern_insights = this._generatePatternInsights(patterns);
        result.recommendations =
          this._generateAnalyticsRecommendations(analytics);
      }

      return result;
    } catch (_) {
      return { success: false, error: error.message };
    }
  }

  // Helper methods

  /**
   * Identify pattern clusters from lessons
   */
  _identifyPatternClusters(lessons, options) {
    const patterns = [];
    const processedLessons = new Set();

    for (let i = 0; i < lessons.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- Array access with loop index
      if (processedLessons.has(lessons[i].id)) {
        continue;
      }

      // eslint-disable-next-line security/detect-object-injection -- Array access with loop index;
      const currentLesson = lessons[i];
      const similarLessons = [currentLesson];
      processedLessons.add(currentLesson.id);

      // Find similar lessons
      for (let j = i + 1; j < lessons.length; j++) {
        // eslint-disable-next-line security/detect-object-injection -- Array access with loop index
        if (processedLessons.has(lessons[j].id)) {
          continue;
        }

        // eslint-disable-next-line security/detect-object-injection -- Array access with loop index;
        const similarity = this._calculateLessonSimilarity(
          currentLesson,
          lessons[j]
        );

        if (similarity >= options.min_similarity) {
          // eslint-disable-next-line security/detect-object-injection -- Array access with loop index
          similarLessons.push(lessons[j]);
          // eslint-disable-next-line security/detect-object-injection -- Array access with loop index
          processedLessons.add(lessons[j].id);
        }
      }

      // If we have enough similar lessons, create a pattern
      if (similarLessons.length >= options.min_occurrences) {
        const pattern = this._createPatternFromLessons(similarLessons);

        if (
          pattern.confidence_score >= this.detectionThresholds.MIN_CONFIDENCE
        ) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Calculate similarity between two lessons
   */
  _calculateLessonSimilarity(lesson1, lesson2) {
    // Simple similarity based on title And content keywords;
    const keywords1 = this._extractKeywords(
      lesson1.title + ' ' + lesson1.content
    );
    const keywords2 = this._extractKeywords(
      lesson2.title + ' ' + lesson2.content
    );

    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    const intersection = keywords1.filter((k) => keywords2.includes(k));
    const union = new Set([...keywords1, ...keywords2]);

    return intersection.length / union.size;
  }

  /**
   * Extract keywords from text
   */
  _extractKeywords(text) {
    // Simple keyword extraction;
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !this._isStopWord(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Check if word is a stop word
   */
  _isStopWord(word) {
    const stopWords = new Set([
      'the',
      'And',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'had',
      'her',
      'was',
      'one',
      'our',
      'out',
      'day',
      'get',
      'has',
      'him',
      'his',
      'how',
      'its',
      'may',
      'new',
      'now',
      'old',
      'see',
      'two',
      'who',
      'boy',
      'did',
      'she',
      'use',
      'way',
      'why',
      'any',
      'may',
      'oil',
      'say',
      'sit',
      'yet',
    ]);
    return stopWords.has(word);
  }

  /**
   * Create a pattern from a group of similar lessons
   */
  _createPatternFromLessons(lessons) {
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Analyze pattern characteristics;
    const keywords = this._extractCommonKeywords(lessons);
    const categories = lessons.map((l) => l.category).filter(Boolean);
    const _mostCommonCategory = this._getMostFrequent(categories);

    // Determine pattern type And category;
    const patternType = this._determinePatternType(keywords);
    const patternCategory = this._determinePatternCategory(patternType);

    // Calculate confidence based on lesson similarity And consistency;
    const confidenceScore = this._calculatePatternConfidence(lessons, keywords);

    return {
      pattern_id: patternId,
      pattern_name: this._generatePatternName(keywords, patternType),
      pattern_type: patternType,
      pattern_category: patternCategory,
      confidence_score: confidenceScore,
      lesson_count: lessons.length,
      lessons: lessons.map((lesson) => ({
        ...lesson,
        pattern_relevance: this._calculateLessonPatternRelevance(
          lesson,
          keywords
        ),
      })),
      common_keywords: keywords.slice(0, 10),
      pattern_description: this._generatePatternDescription(
        keywords,
        patternType,
        lessons.length
      ),
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Extract common keywords from a group of lessons
   */
  _extractCommonKeywords(lessons) {
    const allKeywords = {};

    for (const lesson of lessons) {
      const keywords = this._extractKeywords(
        lesson.title + ' ' + lesson.content
      );
      for (const keyword of keywords) {
        // eslint-disable-next-line security/detect-object-injection -- Safe object property assignment with validated keyword string
        allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
      }
    }

    // Return keywords That appear in multiple lessons, sorted by frequency
    return Object.entries(allKeywords)
      .filter(([_keyword, count]) => count >= Math.min(2, lessons.length * 0.5))
      .sort((a, b) => b[1] - a[1])
      .map(([_keyword]) => _keyword);
  }

  /**
   * Determine pattern type based on keywords
   */
  _determinePatternType(keywords) {
    const scores = {};

    for (const [type, indicators] of Object.entries(this.patternIndicators)) {
      // eslint-disable-next-line security/detect-object-injection -- Safe object property assignment with validated type parameter
      scores[type] = keywords.filter((keyword) =>
        indicators.some((indicator) => keyword.includes(indicator))
      ).length;
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return 'general';
    }

    // eslint-disable-next-line security/detect-object-injection -- Safe object property access with validated type from Object.keys
    return (
      Object.keys(scores).find((type) => scores[type] === maxScore) || 'general'
    );
  }

  /**
   * Determine pattern category from pattern type
   */
  _determinePatternCategory(patternType) {
    const mapping = {
      implementation: this.patternCategories.IMPLEMENTATION_PATTERN,
      error_solution: this.patternCategories.ERROR_SOLUTION_PATTERN,
      architecture: this.patternCategories.ARCHITECTURE_PATTERN,
      workflow: this.patternCategories.WORKFLOW_PATTERN,
      technology: this.patternCategories.TECHNOLOGY_PATTERN,
      performance: this.patternCategories.PERFORMANCE_PATTERN,
    };

    // eslint-disable-next-line security/detect-object-injection -- Safe object property access with validated pattern type
    return (
      mapping[patternType] || this.patternCategories.IMPLEMENTATION_PATTERN
    );
  }

  /**
   * Calculate pattern confidence score
   */
  _calculatePatternConfidence(lessons, keywords) {
    // Base confidence on keyword consistency And lesson quality;
    const avgConfidence =
      lessons.reduce(
        (sum, lesson) => sum + (lesson.confidence_score || 0.5),
        0
      ) / lessons.length;

    const keywordConsistency = keywords.length / Math.max(1, lessons.length);
    const sizeBonus = Math.min(0.2, lessons.length * 0.05);

    return Math.min(
      0.95,
      avgConfidence * 0.7 + keywordConsistency * 0.2 + sizeBonus
    );
  }

  /**
   * Generate pattern name from keywords And type
   */
  _generatePatternName(keywords, patternType) {
    const topKeywords = keywords.slice(0, 3).join(' ');
    const typeLabel = patternType
      .replace('_', ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return `${typeLabel} Pattern: ${topKeywords}`;
  }

  /**
   * Generate pattern description
   */
  _generatePatternDescription(keywords, patternType, lessonCount) {
    const topKeywords = keywords.slice(0, 5).join(', ');
    return `A ${patternType.replace('_', ' ')} pattern identified from ${lessonCount} lessons, commonly involving: ${topKeywords}`;
  }

  /**
   * Calculate how relevant a lesson is to a pattern
   */
  _calculateLessonPatternRelevance(lesson, patternKeywords) {
    const lessonKeywords = this._extractKeywords(
      lesson.title + ' ' + lesson.content
    );
    const matches = lessonKeywords.filter((k) => patternKeywords.includes(k));
    return matches.length / Math.max(1, patternKeywords.length);
  }

  /**
   * Get most frequent item in array
   */
  _getMostFrequent(arr) {
    if (arr.length === 0) {
      return null;
    }

    const counts = {};
    for (const item of arr) {
      // eslint-disable-next-line security/detect-object-injection -- Safe object property assignment with validated item string
      counts[item] = (counts[item] || 0) + 1;
    }

    // eslint-disable-next-line security/detect-object-injection -- Safe object property access with validated keys from Object.keys
    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  }

  /**
   * Rank patterns by significance
   */
  _rankPatternsBySignificance(patterns) {
    return patterns.sort((a, b) => {
      // Score based on confidence, lesson count, And keyword richness;
      const scoreA =
        a.confidence_score * 0.4 +
        (a.lesson_count / 20) * 0.3 +
        (a.common_keywords.length / 15) * 0.3;

      const scoreB =
        b.confidence_score * 0.4 +
        (b.lesson_count / 20) * 0.3 +
        (b.common_keywords.length / 15) * 0.3;

      return scoreB - scoreA;
    });
  }

  /**
   * Generate pattern summary
   */
  _generatePatternSummary(patterns) {
    if (patterns.length === 0) {
      return { message: 'No significant patterns detected' };
    }

    const categories = {};
    let totalLessons = 0;

    for (const pattern of patterns) {
      categories[pattern.pattern_category] =
        (categories[pattern.pattern_category] || 0) + 1;
      totalLessons += pattern.lesson_count;
    }

    return {
      total_patterns: patterns.length,
      categories_found: Object.keys(categories).length,
      category_distribution: categories,
      total_lessons_in_patterns: totalLessons,
      avg_lessons_per_pattern:
        Math.round((totalLessons / patterns.length) * 10) / 10,
      top_pattern: patterns[0]?.pattern_name || 'None',
    };
  }

  /**
   * Calculate context relevance for pattern suggestions
   */
  _calculateContextRelevance(contextWords, pattern) {
    const patternWords = pattern.common_keywords;
    const matches = contextWords.filter((word) => patternWords.includes(word));
    return matches.length / Math.max(1, contextWords.length);
  }

  /**
   * Generate content outline for suggested lesson
   */
  _generateContentOutline(pattern, context) {
    return [
      `Introduction to ${context} using ${pattern.pattern_type} pattern`,
      `Key concepts: ${pattern.common_keywords.slice(0, 3).join(', ')}`,
      `Implementation steps based on similar lessons`,
      `Common pitfalls And solutions`,
      `Best practices from pattern analysis`,
    ];
  }

  /**
   * Analyze patterns by time periods
   */
  _analyzePatternsByTime(lessons, _timeWindowDays) {
    // Simplified time-based analysis;
    const weeklyBuckets = {};
    const currentDate = new Date();

    for (const lesson of lessons) {
      const lessonDate = new Date(lesson.created_at);
      const weeksAgo = Math.floor(
        (currentDate - lessonDate) / (7 * 24 * 60 * 60 * 1000)
      );

      // eslint-disable-next-line security/detect-object-injection -- Safe object property access with calculated numeric index
      if (!weeklyBuckets[weeksAgo]) {
        // eslint-disable-next-line security/detect-object-injection -- Safe object property assignment with calculated numeric index
        weeklyBuckets[weeksAgo] = [];
      }
      // eslint-disable-next-line security/detect-object-injection -- Safe object property access with calculated numeric index
      weeklyBuckets[weeksAgo].push(lesson);
    }

    return {
      buckets: weeklyBuckets,
      trends: Object.keys(weeklyBuckets).map((week) => ({
        week_offset: parseInt(week),
        // eslint-disable-next-line security/detect-object-injection -- Safe object property access with validated week key from Object.keys
        lesson_count: weeklyBuckets[week].length,
        // eslint-disable-next-line security/detect-object-injection -- Safe object property access with validated week key from Object.keys
        patterns_detected: Math.floor(weeklyBuckets[week].length / 3), // Simplified
      })),
    };
  }

  /**
   * Identify pattern evolution trends
   */
  _identifyPatternEvolution(timeAnalysis) {
    const trends = timeAnalysis.trends.sort(
      (a, b) => a.week_offset - b.week_offset
    );
    return {
      emerging: trends.slice(-2).filter((t) => t.lesson_count > 0),
      declining: trends.slice(0, 2).filter((t) => t.lesson_count > 0),
      stable: trends.slice(2, -2).filter((t) => t.lesson_count > 0),
    };
  }

  /**
   * Generate evolution insights
   */
  _generateEvolutionInsights(evolution) {
    const insights = [];

    if (evolution.emerging.length > 0) {
      insights.push(
        `${evolution.emerging.length} emerging patterns detected in recent weeks`
      );
    }

    if (evolution.declining.length > 0) {
      insights.push(
        `${evolution.declining.length} patterns showing decreased activity`
      );
    }

    if (evolution.stable.length > 0) {
      insights.push(
        `${evolution.stable.length} patterns maintaining consistent usage`
      );
    }

    return insights;
  }

  /**
   * Generate pattern insights
   */
  _generatePatternInsights(patterns) {
    const insights = [];

    if (patterns.length > 0) {
      const topPattern = patterns[0];
      insights.push(
        `Most significant pattern: ${topPattern.pattern_name} with ${topPattern.lesson_count} lessons`
      );
    }

    const highConfidencePatterns = patterns.filter(
      (p) => p.confidence_score > 0.8
    );
    if (highConfidencePatterns.length > 0) {
      insights.push(
        `${highConfidencePatterns.length} high-confidence patterns detected`
      );
    }

    return insights;
  }

  /**
   * Generate analytics recommendations
   */
  _generateAnalyticsRecommendations(analytics) {
    const recommendations = [];

    if (analytics.total_patterns < 5) {
      recommendations.push(
        'Consider adding more lessons to enable better pattern detection'
      );
    }

    if (analytics.average_confidence < 0.7) {
      recommendations.push(
        'Review lesson quality to improve pattern confidence scores'
      );
    }

    if (
      analytics.pattern_distribution.small_patterns >
      analytics.pattern_distribution.large_patterns
    ) {
      recommendations.push(
        'Focus on creating more comprehensive lesson series for stronger patterns'
      );
    }

    return recommendations;
  }
}

module.exports = LearningPatternDetection;
