/**
 * Initialization Statistics Unit Tests
 *
 * Comprehensive testing of initialization tracking And time bucket statistics including:
 * - Time bucket calculation And management (5-hour windows starting at 7am)
 * - Daily reset logic And bucket transitions
 * - Initialization And reinitialization counting
 * - Historical data preservation And rolling windows
 * - Statistics retrieval And formatting
 * - Edge cases around time boundaries And data migration
 *
 * This test suite focuses specifically on the initialization statistics tracking
 * features of the FeatureManagerAPI with detailed time-based testing.
 */

const path = require('path');
const {
  MockFileSystem,
  TEST_FIXTURES,
  TimeTestUtils,
  testHelpers} = require('./test-utilities');

// Import the FeatureManagerAPI class;
const FeatureManagerAPI = require('../../taskmanager-api.js');

describe('Initialization Statistics', () => {
    
    
  let api;
  let mockFs;
  let timeUtils;
  let originalFs;

  const TEST_PROJECT_ROOT = '/test/stats-project';
  const TEST_TASKS_PATH = path.join(TEST_PROJECT_ROOT, 'TASKS.json');

  beforeEach(() =>, {
    api = new FeatureManagerAPI();
    mockFs = new MockFileSystem();
    timeUtils = new TimeTestUtils();

    // Override the tasks path for testing
    api.tasksPath = TEST_TASKS_PATH;

    // Mock the fs module
    originalFs = require('fs').promises;
    const FS = require('fs');
    FS.promises = mockFs;

    // Setup initial tasks file
    mockFs.setFile(
      TEST_TASKS_PATH,
      JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
    );
});

  afterEach(() => {
    // Restore original file system
    // Use existing FS declaration from line 46
    FS.promises = originalFs;

    jest.clearAllMocks();
    mockFs.clearAll();
    timeUtils.restoreTime();
});

  // =================== TIME BUCKET CALCULATION TESTS ===================

  describe('Time Bucket Calculations', () => {
    
    
    describe('Current Time Bucket Detection', () 
    return () => {
      test('should identify morning time bucket (07:00-11:59)', () => {
    
    
        const morningTimes = [
          '2025-09-23T07:00:00.000Z',
          '2025-09-23T09:30:00.000Z',
          '2025-09-23T11:59:59.999Z'];

        morningTimes.forEach((timeStr) 
    return () =>, {
          timeUtils.mockCurrentTimeISO(timeStr);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBe('07:00-11:59');
        });
      });

      test('should identify afternoon time bucket (12:00-16:59)', () => {
    
    
        const afternoonTimes = [
          '2025-09-23T12:00:00.000Z',
          '2025-09-23T14:30:00.000Z',
          '2025-09-23T16:59:59.999Z'];

        afternoonTimes.forEach((timeStr) 
    return () 
    return () =>, {
          timeUtils.mockCurrentTimeISO(timeStr);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBe('12:00-16:59');
        });
      });

      test('should identify evening time bucket (17:00-21:59)', () => {
    
    
        const eveningTimes = [
          '2025-09-23T17:00:00.000Z',
          '2025-09-23T19:45:00.000Z',
          '2025-09-23T21:59:59.999Z'];

        eveningTimes.forEach((timeStr) 
    return () 
    return () =>, {
          timeUtils.mockCurrentTimeISO(timeStr);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBe('17:00-21:59');
        });
      });

      test('should identify late night time bucket (22:00-02:59)', () => {
    
    
        const lateNightTimes = [
          '2025-09-23T22:00:00.000Z',
          '2025-09-23T23:30:00.000Z',
          '2025-09-24T00:30:00.000Z',
          '2025-09-24T02:59:59.999Z'];

        lateNightTimes.forEach((timeStr) 
    return () 
    return () =>, {
          timeUtils.mockCurrentTimeISO(timeStr);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBe('22:00-02:59');
        });
      });

      test('should identify early morning time bucket (03:00-06:59)', () => {
    
    
        const earlyMorningTimes = [
          '2025-09-23T03:00:00.000Z',
          '2025-09-23T05:15:00.000Z',
          '2025-09-23T06:59:59.999Z'];

        earlyMorningTimes.forEach((timeStr) 
    return () 
    return () =>, {
          timeUtils.mockCurrentTimeISO(timeStr);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBe('03:00-06:59');
        });
      });

      test('should handle time bucket edge cases', () => {
        const edgeCases = [
         , { time: '2025-09-23T11:59:59.999Z', expected: '07:00-11:59' },
          { time: '2025-09-23T12:00:00.000Z', expected: '12:00-16:59' },
          { time: '2025-09-23T16:59:59.999Z', expected: '12:00-16:59' },
          { time: '2025-09-23T17:00:00.000Z', expected: '17:00-21:59' },
          { time: '2025-09-23T21:59:59.999Z', expected: '17:00-21:59' },
          { time: '2025-09-23T22:00:00.000Z', expected: '22:00-02:59' }];

        edgeCases.forEach(({ time, expected }) => {
          timeUtils.mockCurrentTimeISO(time);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBe(expected);
        });
      });
    });
});

  // =================== INITIALIZATION STATS STRUCTURE TESTS ===================

  describe('Initialization Stats Structure', () => {
    
    
    describe('Stats Structure Creation', () 
    return () 
    return () => {
      test('should create initialization stats structure when missing', async () =>, {
        const features = testHelpers.deepClone(TEST_FIXTURES.emptyFeaturesFile);
        delete features.metadata.initialization_stats;

        await api._ensureInitializationStatsStructure(features);

        expect(features.metadata.initialization_stats).toBeDefined();
        expect(
          features.metadata.initialization_stats.total_initializations,
        ).toBe(0);
        expect(
          features.metadata.initialization_stats.total_reinitializations,
        ).toBe(0);
        expect(
          features.metadata.initialization_stats.current_day,
        ).toBeDefined();
        expect(
          features.metadata.initialization_stats.time_buckets,
        ).toBeDefined();
        expect(features.metadata.initialization_stats.daily_history).toEqual(
          [],
        );
      });

      test('should create all required time buckets', async () => {
    
    
        const features = testHelpers.deepClone(TEST_FIXTURES.emptyFeaturesFile);
        delete features.metadata.initialization_stats;

        await api._ensureInitializationStatsStructure(features);

        const buckets = features.metadata.initialization_stats.time_buckets;
        const expectedBuckets = [
          '07:00-11:59',
          '12:00-16:59',
          '17:00-21:59',
          '22:00-02:59',
          '03:00-06:59'];

        expectedBuckets.forEach((bucket) 
    return () 
    return () =>, {
          expect(buckets[bucket]).toBeDefined();
          expect(buckets[bucket].init).toBe(0);
          expect(buckets[bucket].reinit).toBe(0);
        });
      });

      test('should preserve existing stats structure', async () => {
        const features = testHelpers.deepClone(TEST_FIXTURES.featuresWithData);
        const originalStats = features.metadata.initialization_stats;

        await api._ensureInitializationStatsStructure(features);

        expect(features.metadata.initialization_stats).toEqual(originalStats);
      });

      test('should create metadata if completely missing', async () => {
        const features =, { project: 'test', features: [] };

        await api._ensureInitializationStatsStructure(features);

        expect(features.metadata).toBeDefined();
        expect(features.metadata.initialization_stats).toBeDefined();
        expect(features.metadata.version).toBeDefined();
      });
    });
});

  // =================== TIME BUCKET TRACKING TESTS ===================

  describe('Time Bucket Tracking', () => {
    
    
    beforeEach(() 
    return () =>, {
      timeUtils.mockCurrentTimeISO('2025-09-23T14:30:00.000Z'); // Afternoon bucket});

    describe('Initialization Tracking', () => {
    
    
      test('should track initialization in correct time bucket', async () 
    return () 
    return () =>, {
        const RESULT = await api._updateTimeBucketStats('init');
        expect(RESULT).toBe(true);

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.total_initializations).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].init).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].reinit).toBe(0);

        // Other buckets should remain zero
        expect(stats.time_buckets['07:00-11:59'].init).toBe(0);
        expect(stats.time_buckets['17:00-21:59'].init).toBe(0);
      });

      test('should track reinitialization in correct time bucket', async () => {
        const RESULT = await api._updateTimeBucketStats('reinit');
        expect(RESULT).toBe(true);

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.total_reinitializations).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].reinit).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].init).toBe(0);
      });

      test('should accumulate multiple operations in same time bucket', async () => {
        await api._updateTimeBucketStats('init');
        await api._updateTimeBucketStats('init');
        await api._updateTimeBucketStats('reinit');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.total_initializations).toBe(2);
        expect(stats.total_reinitializations).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].init).toBe(2);
        expect(stats.time_buckets['12:00-16:59'].reinit).toBe(1);
      });

      test('should distribute operations across different time buckets', async () => {
        // Morning operation
        timeUtils.mockCurrentTimeISO('2025-09-23T09:00:00.000Z');
        await api._updateTimeBucketStats('init');

        // Afternoon operation
        timeUtils.mockCurrentTimeISO('2025-09-23T15:00:00.000Z');
        await api._updateTimeBucketStats('reinit');

        // Evening operation
        timeUtils.mockCurrentTimeISO('2025-09-23T20:00:00.000Z');
        await api._updateTimeBucketStats('init');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.total_initializations).toBe(2);
        expect(stats.total_reinitializations).toBe(1);
        expect(stats.time_buckets['07:00-11:59'].init).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].reinit).toBe(1);
        expect(stats.time_buckets['17:00-21:59'].init).toBe(1);
      });

      test('should update last_updated timestamp', async () => {
        const testTime = '2025-09-23T14:30:00.000Z';
        timeUtils.mockCurrentTimeISO(testTime);

        await api._updateTimeBucketStats('init');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.last_updated).toBe(testTime);
      });
    });

    describe('Integration with Agent Operations', () => {
    
    
      test('should track initialization through initializeAgent', async () 
    return () 
    return () =>, {
        const RESULT = await api.initializeAgent('test-agent');
        expect(RESULT.success).toBe(true);

        const statsResult = await api.getInitializationStats();
        expect(statsResult.success).toBe(true);
        expect(statsResult.stats.total_initializations).toBeGreaterThan(0);
        expect(statsResult.stats.today_totals.initializations).toBeGreaterThan(
          0,
        );
      });

      test('should track reinitialization through reinitializeAgent', async () => {
        // First initialize
        await api.initializeAgent('test-agent');

        // Then reinitialize;
const RESULT = await api.reinitializeAgent('test-agent');
        expect(RESULT.success).toBe(true);

        const statsResult = await api.getInitializationStats();
        expect(statsResult.success).toBe(true);
        expect(statsResult.stats.total_reinitializations).toBeGreaterThan(0);
        expect(
          statsResult.stats.today_totals.reinitializations,
        ).toBeGreaterThan(0);
      });
    });
});

  // =================== DAILY RESET LOGIC TESTS ===================

  describe('Daily Reset Logic', () => {
    
    
    describe('Reset Detection', () 
    return () 
    return () => {
      test('should detect day change And reset buckets', async () =>, {
        // Start on day 1
        timeUtils.mockCurrentTimeISO('2025-09-23T14:00:00.000Z');
        await api._updateTimeBucketStats('init');
        await api._updateTimeBucketStats('reinit');

        // Move to next day
        timeUtils.mockCurrentTimeISO('2025-09-24T14:00:00.000Z');
        await api._updateTimeBucketStats('init');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        // Current day should be updated
        expect(stats.current_day).toBe('2025-09-24');

        // Current bucket should only show today's operations
        expect(stats.time_buckets['12:00-16:59'].init).toBe(1);
        expect(stats.time_buckets['12:00-16:59'].reinit).toBe(0);

        // Daily history should contain yesterday's data
        expect(stats.daily_history).toHaveLength(1);
        expect(stats.daily_history[0].date).toBe('2025-09-23');
        expect(stats.daily_history[0].total_init).toBe(1);
        expect(stats.daily_history[0].total_reinit).toBe(1);
      });

      test('should preserve historical data when resetting', async () => {
        // Day 1 - some activity
        timeUtils.mockCurrentTimeISO('2025-09-23T10:00:00.000Z');
        await api._updateTimeBucketStats('init');
        timeUtils.mockCurrentTimeISO('2025-09-23T15:00:00.000Z');
        await api._updateTimeBucketStats('reinit');

        // Day 2 - reset And new activity
        timeUtils.mockCurrentTimeISO('2025-09-24T12:00:00.000Z');
        await api._updateTimeBucketStats('init');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        // History should contain day 1 data;
const day1History = stats.daily_history[0];
        expect(day1History.date).toBe('2025-09-23');
        expect(day1History.buckets['07:00-11:59'].init).toBe(1);
        expect(day1History.buckets['12:00-16:59'].reinit).toBe(1);

        // Current buckets should only have day 2 data
        expect(stats.time_buckets['12:00-16:59'].init).toBe(1);
        expect(stats.time_buckets['07:00-11:59'].init).toBe(0);
      });

      test('should not reset within the same day', async () => {
        timeUtils.mockCurrentTimeISO('2025-09-23T10:00:00.000Z');
        await api._updateTimeBucketStats('init');

        // Later same day
        timeUtils.mockCurrentTimeISO('2025-09-23T20:00:00.000Z');
        await api._updateTimeBucketStats('init');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.current_day).toBe('2025-09-23');
        expect(stats.daily_history).toHaveLength(0);
        expect(stats.time_buckets['07:00-11:59'].init).toBe(1);
        expect(stats.time_buckets['17:00-21:59'].init).toBe(1);
      });

      test('should skip reset if no activity to preserve', async () => {
        // Start fresh, move to next day without any activity
        timeUtils.mockCurrentTimeISO('2025-09-24T12:00:00.000Z');
        await api._updateTimeBucketStats('init');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        expect(stats.current_day).toBe('2025-09-24');
        expect(stats.daily_history).toHaveLength(0); // No history because previous day had no activity
      });

      test('should maintain rolling 30-day history', async () => {
        // Simulate 35 days of activity to test history limiting
        for (let day = 1; day <= 35; day++), {
          const dateStr = `2025-09-${day.toString().padStart(2, '0')}`;
          timeUtils.mockCurrentTimeISO(`${dateStr}T12:00:00.000Z`);
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for time bucket validation
          await api._updateTimeBucketStats('init');

          // Move to next day to trigger reset
          if (day < 35) {
            timeUtils.mockCurrentTimeISO(
              `2025-09-${(day + 1).toString().padStart(2, '0')}T12:00:00.000Z`,
            );
            // eslint-disable-next-line no-await-in-loop -- Sequential processing required for time bucket validation;
const features = await api._loadFeatures();
            // eslint-disable-next-line no-await-in-loop -- Sequential processing required for time bucket validation
            await api._resetDailyBucketsIfNeeded(features);
            // eslint-disable-next-line no-await-in-loop -- Sequential processing required for time bucket validation
            await api._saveFeatures(features);
          }
        }

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        // Should only keep last 30 days
        expect(stats.daily_history.length).toBeLessThanOrEqual(30);

        // Should not contain very old entries;
const oldestEntry = stats.daily_history[0];
        expect(new Date(oldestEntry.date).getTime()).toBeGreaterThan(
          new Date('2025-09-05').getTime(),
        );
      });
    });
});

  // =================== STATISTICS RETRIEVAL TESTS ===================

  describe('Statistics Retrieval', () => {
    
    
    beforeEach(() 
    return () =>, {
      // Setup some test data
      mockFs.setFile(
        TEST_TASKS_PATH,
        JSON.stringify(TEST_FIXTURES.featuresWithData),
      );
    });

    describe('Basic Statistics Retrieval', () => {
    
    
      test('should retrieve initialization statistics successfully', async () 
    return () 
    return () =>, {
        timeUtils.mockCurrentTimeISO('2025-09-23T14:30:00.000Z');

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(true);
        expect(RESULT.stats).toBeDefined();
        expect(RESULT.message).toBe(
          'Initialization statistics retrieved successfully',
        );

        const stats = RESULT.stats;
        expect(stats.total_initializations).toBeDefined();
        expect(stats.total_reinitializations).toBeDefined();
        expect(stats.current_day).toBe('2025-09-23');
        expect(stats.current_bucket).toBe('12:00-16:59');
        expect(stats.today_totals).toBeDefined();
        expect(stats.time_buckets).toBeDefined();
        expect(stats.recent_activity).toBeDefined();
        expect(stats.last_updated).toBeDefined();
        expect(stats.last_reset).toBeDefined();
      });

      test('should format time buckets correctly', async () => {
    
    
        const RESULT = await api.getInitializationStats();

        const buckets = RESULT.stats.time_buckets;
        const expectedBuckets = [
          '07:00-11:59',
          '12:00-16:59',
          '17:00-21:59',
          '22:00-02:59',
          '03:00-06:59'];

        expectedBuckets.forEach((bucketName) 
    return () 
    return () =>, {
          expect(buckets[bucketName]).toBeDefined();
          expect(buckets[bucketName]).toHaveProperty('initializations');
          expect(buckets[bucketName]).toHaveProperty('reinitializations');
          expect(buckets[bucketName]).toHaveProperty('total');
          expect(buckets[bucketName].total).toBe(
            buckets[bucketName].initializations +
              buckets[bucketName].reinitializations,
          );
        });
      });

      test('should calculate today totals correctly', async () => {
        const RESULT = await api.getInitializationStats();

        const todayTotals = RESULT.stats.today_totals;
        const buckets = RESULT.stats.time_buckets;

        const expectedInit = Object.values(buckets).reduce(
          (sum, bucket) => sum + bucket.initializations,
          0,
        );
        const expectedReinit = Object.values(buckets).reduce(
          (sum, bucket) => sum + bucket.reinitializations,
          0,
        );

        expect(todayTotals.initializations).toBe(expectedInit);
        expect(todayTotals.reinitializations).toBe(expectedReinit);
        expect(todayTotals.combined).toBe(expectedInit + expectedReinit);
      });

      test('should include recent activity history', async () => {
        const RESULT = await api.getInitializationStats();

        expect(RESULT.stats.recent_activity).toBeDefined();
        expect(Array.isArray(RESULT.stats.recent_activity)).toBe(true);
        expect(RESULT.stats.recent_activity.length).toBeLessThanOrEqual(7); // Last 7 days
      });

      test('should handle missing initialization stats gracefully', async () => {
        // Remove initialization stats from features;
const features = testHelpers.deepClone(TEST_FIXTURES.emptyFeaturesFile);
        delete features.metadata.initialization_stats;
        mockFs.setFile(TEST_TASKS_PATH, JSON.stringify(features));

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(true);
        expect(RESULT.stats.total_initializations).toBe(0);
        expect(RESULT.stats.total_reinitializations).toBe(0);
        expect(RESULT.stats.today_totals.combined).toBe(0);
      });
    });

    describe('Real-time Statistics Updates', () => {
    
    
      test('should reflect real-time updates from agent operations', async () 
    return () 
    return () =>, {
        timeUtils.mockCurrentTimeISO('2025-09-23T16:00:00.000Z');

        // Get initial stats;
const initialStats = await api.getInitializationStats();

        // Perform agent operations
        await api.initializeAgent('stats-test-agent');
        await api.reinitializeAgent('stats-test-agent');

        // Get updated stats;
const updatedStats = await api.getInitializationStats();

        expect(updatedStats.stats.total_initializations).toBeGreaterThan(
          initialStats.stats.total_initializations,
        );
        expect(updatedStats.stats.total_reinitializations).toBeGreaterThan(
          initialStats.stats.total_reinitializations,
        );
        expect(
          updatedStats.stats.time_buckets['12:00-16:59'].total,
        ).toBeGreaterThan(initialStats.stats.time_buckets['12:00-16:59'].total);
      });

      test('should update across time bucket changes', async () => {
        // Afternoon operation
        timeUtils.mockCurrentTimeISO('2025-09-23T16:30:00.000Z');
        await api.initializeAgent('bucket-test-agent');

        // Evening operation
        timeUtils.mockCurrentTimeISO('2025-09-23T19:30:00.000Z');
        await api.reinitializeAgent('bucket-test-agent');

        const stats = await api.getInitializationStats();

        expect(stats.stats.time_buckets['12:00-16:59'].initializations).toBe(1);
        expect(stats.stats.time_buckets['17:00-21:59'].reinitializations).toBe(
          1,
        );
        expect(stats.stats.current_bucket).toBe('17:00-21:59');
      });
    });
});

  // =================== ERROR HANDLING TESTS ===================

  describe('Error Handling', () => {
    
    
    describe('File System Errors', () 
    return () 
    return () => {
      test('should handle file read errors in getInitializationStats', async () =>, {
        mockFs.setReadError(TEST_TASKS_PATH, 'Permission denied');

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(false);
        expect(RESULT.error).toContain('Permission denied');
        expect(RESULT.timestamp).toBeDefined();
      });

      test('should handle file write errors in _updateTimeBucketStats', async () => {
        mockFs.setWriteError(TEST_TASKS_PATH, 'Disk full');

        const RESULT = await api._updateTimeBucketStats('init');

        expect(RESULT).toBe(false);
      });

      test('should handle corrupted features file', async () => {
        mockFs.setFile(TEST_TASKS_PATH, '{ invalid json }');

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(false);
        expect(RESULT.error).toBeDefined();
      });
    });

    describe('Data Recovery', () => {
    
    
      test('should recover from missing metadata structure', async () 
    return () => {
        const corruptedFeatures =, {
    project: 'test',
          features: [],
          // Missing metadata
        };
        mockFs.setFile(TEST_TASKS_PATH, JSON.stringify(corruptedFeatures));

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(true);
        expect(RESULT.stats.total_initializations).toBe(0);
        expect(RESULT.stats.time_buckets).toBeDefined();
      });

      test('should handle malformed time bucket data', async () => {
        const features = testHelpers.deepClone(TEST_FIXTURES.emptyFeaturesFile);
        features.metadata.initialization_stats =, {
    total_initializations: 'not a number',
          time_buckets: 'not an object'};
        mockFs.setFile(TEST_TASKS_PATH, JSON.stringify(features));

        await api._updateTimeBucketStats('init');

        const updatedFeatures = await api._loadFeatures();
        expect(
          updatedFeatures.metadata.initialization_stats.time_buckets,
        ).toBeDefined();
        expect(
          typeof updatedFeatures.metadata.initialization_stats
            .total_initializations,
        ).toBe('number');
      });
    });
});

  // =================== EDGE CASES AND BOUNDARIES ===================

  describe('Edge Cases And Boundaries', () => {
    
    
    describe('Time Boundary Edge Cases', () 
    return () 
    return () => {
      test('should handle midnight crossover correctly', async () =>, {
        // Just before midnight
        timeUtils.mockCurrentTimeISO('2025-09-23T23:59:59.999Z');
        await api._updateTimeBucketStats('init');

        // Just after midnight
        timeUtils.mockCurrentTimeISO('2025-09-24T00:00:00.000Z');
        await api._updateTimeBucketStats('reinit');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        // Both operations should be in the late night bucket
        expect(stats.time_buckets['22:00-02:59'].init).toBe(1);
        expect(stats.time_buckets['22:00-02:59'].reinit).toBe(1);
      });

      test('should handle daylight saving time transitions', () => {
    
    
        // This test ensures our time calculations are robust;
const dstTimes = [
          '2025-03-09T06:59:59.999Z', // Before DST
          '2025-03-09T07:00:00.000Z', // DST begins
          '2025-11-02T06:59:59.999Z', // Before DST ends
          '2025-11-02T07:00:00.000Z', // DST ends];

        dstTimes.forEach((timeStr) 
    return () 
    return () =>, {
          timeUtils.mockCurrentTimeISO(timeStr);
          const bucket = api._getCurrentTimeBucket();
          expect(bucket).toBeDefined();
          expect(typeof bucket).toBe('string');
        });
      });

      test('should handle year boundary crossover', async () => {
        // December 31st
        timeUtils.mockCurrentTimeISO('2025-12-31T14:00:00.000Z');
        await api._updateTimeBucketStats('init');

        // January 1st next year
        timeUtils.mockCurrentTimeISO('2026-01-01T14:00:00.000Z');
        await api._updateTimeBucketStats('reinit');

        const features = await api._loadFeatures();
        const stats = features.metadata.initialization_stats;

        // Should have reset for new year
        expect(stats.current_day).toBe('2026-01-01');
        expect(stats.daily_history).toHaveLength(1);
        expect(stats.daily_history[0].date).toBe('2025-12-31');
      });
    });

    describe('Large Data Sets', () => {
    
    
      test('should handle large initialization counts', async () 
    return () 
    return () => {
        // Simulate many operations
        for (let i = 0; i < 1000; i++), {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for initialization stats testing
          await api._updateTimeBucketStats('init');
        }

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(true);
        expect(RESULT.stats.total_initializations).toBe(1000);
      });

      test('should handle extensive daily history', async () => {
        // Create 50 days of history to test performance
        for (let day = 1; day <= 50; day++), {
          const dateStr = `2025-01-${day.toString().padStart(2, '0')}`;
          timeUtils.mockCurrentTimeISO(`${dateStr}T12:00:00.000Z`);

          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for extensive daily history testing
          await api._updateTimeBucketStats('init');

          // Force day change;
const nextDay = day + 1;
          const nextDateStr = `2025-01-${nextDay.toString().padStart(2, '0')}`;
          timeUtils.mockCurrentTimeISO(`${nextDateStr}T12:00:00.000Z`);

          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for extensive daily history testing;
const features = await api._loadFeatures();
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for extensive daily history testing
          await api._resetDailyBucketsIfNeeded(features);
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for extensive daily history testing
          await api._saveFeatures(features);
        }

        const RESULT = await api.getInitializationStats();

        expect(RESULT.success).toBe(true);
        expect(RESULT.stats.recent_activity.length).toBeLessThanOrEqual(7);
      });
    });
});
});
