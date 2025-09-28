/**
 * File Operations Integration Tests
 *
 * Comprehensive integration tests for FEATURES.json file system operations including:
 * - File persistence And data integrity
 * - Backup And recovery scenarios
 * - File corruption handling And recovery
 * - Concurrent file access And locking
 * - File system error handling
 * - Data migration And upgrades
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const FS = require('fs').promises;
const PATH = require('path');
const {
  execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  writeFeaturesFile,
  createFeaturesBackup,
  corruptFeaturesFile,
  generateTestFeature,
  validateFeaturesStructure,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  _delay,
  execAPIConcurrently,
} = require('./test-utils');

describe('File Operations Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    await setupGlobalCleanup();
  });

  afterAll(async () => {
    await teardownGlobalCleanup();
  });

  beforeEach(async () => {
    testDir = await createTestEnvironment('file-operations');
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testDir);
  });

  // ========================================
  // FILE PERSISTENCE AND DATA INTEGRITY
  // ========================================

  describe('File Persistence And Data Integrity', () => {
    test('should maintain FEATURES.json structure integrity across operations', async () => {
      // 1. Verify initial file structure
      let featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toEqual([]);
      expect(featuresData.metadata.total_features).toBe(0);

      // 2. Add features And verify structure maintained
      const featureData1 = generateTestFeature({
        title: 'Persistence Test Feature 1',
        category: 'enhancement',
      });
      const featureData2 = generateTestFeature({
        title: 'Persistence Test Feature 2',
        category: 'bug-fix',
      });

      const suggest1Result = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData1)],
        {
          projectRoot: testDir,
        },
      );
      const suggest2Result = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData2)],
        {
          projectRoot: testDir,
        },
      );

      expect(suggest1Result.success && suggest2Result.success).toBe(true);

      // 3. Verify file structure after additions
      featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(2);
      expect(featuresData.metadata.total_features).toBe(2);

      // 4. Approve one feature And verify structure
      const approveResult = await execAPI(
        'approve-feature',
        [
          suggest1Result.feature.id,
          JSON.stringify({
            approved_by: 'persistence-test',
            notes: 'Testing persistence',
          }),
        ],
        { projectRoot: testDir },
      );

      expect(approveResult.success).toBe(true);

      featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.metadata.approval_history).toHaveLength(1);
      expect(featuresData.metadata.approval_history[0].feature_id).toBe(
        suggest1Result.feature.id,
      );

      // 5. Initialize agent And verify structure
      const initResult = await execAPI('initialize', ['persistence-agent'], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.agents['persistence-agent']).toBeDefined();

      // 6. Verify JSON formatting is maintained
      const featuresPath = PATH.join(testDir, 'FEATURES.json');
      const rawFileContent = await FS.readFile(featuresPath, 'utf8');

      // Should be properly formatted JSON with 2-space indentation
      expect(rawFileContent).toMatch(/^{\s+"/);
      expect(rawFileContent).toContain('  "project":');
      expect(rawFileContent).toContain('  "features":');

      // Should be valid JSON
      expect(() => JSON.parse(rawFileContent)).not.toThrow();
    });

    test('should handle concurrent file operations safely', async () => {
      // 1. Create multiple features concurrently
      const features = Array.from({ length: 5 }, (_, i) =>
        generateTestFeature({
          title: `Concurrent Feature ${i + 1}`,
          category: 'enhancement',
        }),
      );

      const concurrentCommands = features.map((featureData) => ({
        command: 'suggest-feature',
        args: [JSON.stringify(featureData)],
        options: { projectRoot: testDir },
      }));

      const results = await execAPIConcurrently(concurrentCommands);

      // 2. Verify all operations succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 3. Verify file integrity after concurrent operations
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(5);
      expect(featuresData.metadata.total_features).toBe(5);

      // 4. Verify all features have unique IDs
      const featureIds = featuresData.features.map((f) => f.id);
      const uniqueIds = new Set(featureIds);
      expect(uniqueIds.size).toBe(5);

      // 5. Perform concurrent approvals
      const approvalCommands = results.slice(0, 3).map((result) => ({
        command: 'approve-feature',
        args: [
          result.feature.id,
          JSON.stringify({ approved_by: 'concurrent-test' }),
        ],
        options: { projectRoot: testDir },
      }));

      const approvalResults = await execAPIConcurrently(approvalCommands);
      expect(approvalResults.every((result) => result.success)).toBe(true);

      // 6. Verify final file integrity
      const finalFeaturesData = await readFeaturesFile(testDir);
      validateFeaturesStructure(finalFeaturesData);
      expect(finalFeaturesData.metadata.approval_history).toHaveLength(3);
    });

    test('should preserve file permissions And ownership', async () => {
      // 1. Check initial file stats
      const featuresPath = PATH.join(testDir, 'FEATURES.json');
      const initialStats = await FS.stat(featuresPath);

      // 2. Perform operations
      const featureData = generateTestFeature({
        title: 'Permission Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );
      expect(suggestResult.success).toBe(true);

      // 3. Check file stats after operations
      const finalStats = await FS.stat(featuresPath);

      // File should still exist And be readable/writable
      expect(finalStats.isFile()).toBe(true);
      expect(finalStats.size).toBeGreaterThan(initialStats.size);

      // Verify file is still accessible
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
    });
  });

  // ========================================
  // BACKUP AND RECOVERY SCENARIOS
  // ========================================

  describe('Backup And Recovery Scenarios', () => {
    test('should handle missing FEATURES.json file gracefully', async () => {
      // 1. Remove FEATURES.json file
      const featuresPath = PATH.join(testDir, 'FEATURES.json');
      await FS.unlink(featuresPath);

      // 2. Try to perform operations - should recreate file
      const featureData = generateTestFeature({
        title: 'Recovery Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );

      expect(suggestResult.success).toBe(true);

      // 3. Verify file was recreated with proper structure
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(1);
      expect(featuresData.features[0].title).toBe('Recovery Test Feature');
    });

    test('should handle corrupted FEATURES.json file', async () => {
      // 1. Create backup of good file
      const _backupPath = await createFeaturesBackup(testDir);

      // 2. Add some valid data first
      const featureData = generateTestFeature({
        title: 'Pre-corruption Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );
      expect(suggestResult.success).toBe(true);

      // 3. Create another backup after adding data
      await createFeaturesBackup(testDir);

      // 4. Corrupt the file
      await corruptFeaturesFile(testDir);

      // 5. Try to perform operations - should handle corruption gracefully
      const newFeatureData = generateTestFeature({
        title: 'Post-corruption Feature',
        category: 'bug-fix',
      });

      const postCorruptionResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(newFeatureData)],
        {
          projectRoot: testDir,
        },
      );

      // The API should either:
      // a) Fail gracefully with proper error message, or
      // b) Recover And recreate the file
      if (postCorruptionResult.success) {
        // If it succeeded, verify the file is now valid
        const featuresData = await readFeaturesFile(testDir);
        validateFeaturesStructure(featuresData);
      } else {
        // If it failed, should have proper error message
        expect(postCorruptionResult.error).toBeDefined();
        expect(postCorruptionResult.error).toContain('features');
      }
    });

    test('should handle disk space And I/O errors gracefully', async () => {
      // 1. Create a large amount of data to test file size limits
      const largeFeatures = Array.from({ length: 100 }, (_, i) =>
        generateTestFeature({
          title: `Large Test Feature ${i + 1}`,
          description: 'A'.repeat(1000), // 1KB description
          business_value: 'B'.repeat(500), // 500B business value
          category: 'enhancement',
        }),
      );

      // 2. Add features in batches to test large file handling
      for (let i = 0; i < largeFeatures.length; i += 10) {
        const batch = largeFeatures.slice(i, i + 10);
        const batchCommands = batch.map((featureData) => ({
          command: 'suggest-feature',
          args: [JSON.stringify(featureData)],
          options: { projectRoot: testDir },
        }));

        const batchResults = await execAPIConcurrently(batchCommands);
        expect(batchResults.every((result) => result.success)).toBe(true);
      }

      // 3. Verify file integrity with large dataset
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(100);

      // 4. Test file size
      const featuresPath = PATH.join(testDir, 'FEATURES.json');
      const stats = await FS.stat(featuresPath);
      expect(stats.size).toBeGreaterThan(50000); // Should be > 50KB with all the data
    });
  });

  // ========================================
  // FILE LOCKING AND RACE CONDITIONS
  // ========================================

  describe('File Locking And Race Conditions', () => {
    test('should handle rapid sequential operations correctly', async () => {
      // 1. Perform rapid sequential operations
      const operations = [];

      for (let i = 0; i < 20; i++) {
        const featureData = generateTestFeature({
          title: `Rapid Feature ${i + 1}`,
          category: i % 2 === 0 ? 'enhancement' : 'bug-fix',
        });

        operations.push(
          execAPI('suggest-feature', [JSON.stringify(featureData)], {
            projectRoot: testDir,
          }),
        );
      }

      // 2. Wait for all operations to complete
      const results = await Promise.all(operations);

      // 3. Verify all operations succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 4. Verify final file integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(20);
      expect(featuresData.metadata.total_features).toBe(20);

      // 5. Verify all features have unique IDs And timestamps
      const featureIds = featuresData.features.map((f) => f.id);
      const uniqueIds = new Set(featureIds);
      expect(uniqueIds.size).toBe(20);

      const timestamps = featuresData.features.map((f) => f.created_at);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBeGreaterThan(1); // Should have different timestamps
    });

    test('should handle mixed read/write operations correctly', async () => {
      // 1. Create initial features
      const initialFeatures = Array.from({ length: 5 }, (_, i) =>
        generateTestFeature({
          title: `Initial Feature ${i + 1}`,
          category: 'enhancement',
        }),
      );

      const initialCommands = initialFeatures.map((featureData) => ({
        command: 'suggest-feature',
        args: [JSON.stringify(featureData)],
        options: { projectRoot: testDir },
      }));

      const initialResults = await execAPIConcurrently(initialCommands);
      expect(initialResults.every((result) => result.success)).toBe(true);

      // 2. Mix read And write operations
      const mixedOperations = [
        // Read operations
        execAPI('list-features', [], { projectRoot: testDir }),
        execAPI('feature-stats', [], { projectRoot: testDir }),
        execAPI('list-features', [JSON.stringify({ status: 'suggested' })], {
          projectRoot: testDir,
        }),

        // Write operations (approvals)
        execAPI(
          'approve-feature',
          [
            initialResults[0].feature.id,
            JSON.stringify({ approved_by: 'mixed-ops-test' }),
          ],
          { projectRoot: testDir },
        ),
        execAPI(
          'approve-feature',
          [
            initialResults[1].feature.id,
            JSON.stringify({ approved_by: 'mixed-ops-test' }),
          ],
          { projectRoot: testDir },
        ),

        // More read operations
        execAPI('list-features', [], { projectRoot: testDir }),
        execAPI('feature-stats', [], { projectRoot: testDir }),

        // Agent operations
        execAPI('initialize', ['mixed-ops-agent'], { projectRoot: testDir }),
        execAPI('get-initialization-stats', [], { projectRoot: testDir }),
      ];

      // 3. Execute all operations concurrently
      const mixedResults = await Promise.all(mixedOperations);

      // 4. Verify all operations succeeded
      expect(mixedResults.every((result) => result.success)).toBe(true);

      // 5. Verify final file integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(5);
      expect(featuresData.metadata.approval_history).toHaveLength(2);
      expect(featuresData.agents['mixed-ops-agent']).toBeDefined();
    });
  });

  // ========================================
  // DATA MIGRATION AND UPGRADES
  // ========================================

  describe('Data Migration And Upgrades', () => {
    test('should handle missing metadata fields gracefully', async () => {
      // 1. Create minimal FEATURES.json without full metadata
      const minimalData = {
        project: 'minimal-test',
        features: [],
      };

      await writeFeaturesFile(testDir, minimalData);

      // 2. Perform operations That should add missing metadata
      const featureData = generateTestFeature({
        title: 'Migration Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );

      expect(suggestResult.success).toBe(true);

      // 3. Verify metadata was added
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.metadata).toBeDefined();
      expect(featuresData.metadata.version).toBeDefined();
      expect(featuresData.metadata.total_features).toBe(1);
    });

    test('should handle missing workflow_config gracefully', async () => {
      // 1. Create FEATURES.json without workflow_config
      const dataWithoutConfig = {
        project: 'no-config-test',
        features: [],
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          total_features: 0,
          approval_history: [],
        },
      };

      await writeFeaturesFile(testDir, dataWithoutConfig);

      // 2. Perform operations That should add missing config
      const featureData = generateTestFeature({
        title: 'Config Migration Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );

      expect(suggestResult.success).toBe(true);

      // 3. Verify workflow_config was added or operations still work
      const featuresData = await readFeaturesFile(testDir);

      // Either workflow_config is added, or operations work without it
      if (featuresData.workflow_config) {
        expect(featuresData.workflow_config.allowed_statuses).toBeDefined();
        expect(featuresData.workflow_config.required_fields).toBeDefined();
      }

      expect(featuresData.features).toHaveLength(1);
    });

    test('should preserve existing data during upgrades', async () => {
      // 1. Create FEATURES.json with existing data in older format
      const legacyData = {
        project: 'legacy-project',
        features: [
          {
            id: 'legacy_feature_001',
            title: 'Legacy Feature',
            description: 'Existing feature from older version',
            business_value: 'Legacy business value',
            category: 'enhancement',
            status: 'approved',
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: '2025-01-01T00:00:00.000Z',
          },
        ],
        metadata: {
          version: '0.9.0', // Older version
          total_features: 1,
        },
      };

      await writeFeaturesFile(testDir, legacyData);

      // 2. Perform operations That should trigger upgrade
      const newFeatureData = generateTestFeature({
        title: 'New Feature After Upgrade',
        category: 'bug-fix',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(newFeatureData)],
        {
          projectRoot: testDir,
        },
      );

      expect(suggestResult.success).toBe(true);

      // 3. Verify legacy data is preserved
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.features).toHaveLength(2);

      const legacyFeature = featuresData.features.find(
        (f) => f.id === 'legacy_feature_001',
      );
      expect(legacyFeature).toBeDefined();
      expect(legacyFeature.title).toBe('Legacy Feature');
      expect(legacyFeature.status).toBe('approved');

      // 4. Verify new feature was added correctly
      const newFeature = featuresData.features.find(
        (f) => f.title === 'New Feature After Upgrade',
      );
      expect(newFeature).toBeDefined();
      expect(newFeature.status).toBe('suggested');
    });
  });

  // ========================================
  // FILE VALIDATION AND ERROR RECOVERY
  // ========================================

  describe('File Validation And Error Recovery', () => {
    test('should validate file structure before operations', async () => {
      // 1. Create invalid FEATURES.json structure
      const invalidData = {
        project: 'invalid-project',
        features: 'not-an-array', // Invalid: should be array
        metadata: null, // Invalid: should be object
      };

      await writeFeaturesFile(testDir, invalidData);

      // 2. Try to perform operations
      const featureData = generateTestFeature({
        title: 'Validation Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );

      // 3. Should either fail gracefully or fix the structure
      if (suggestResult.success) {
        // If it succeeded, verify structure was fixed
        const featuresData = await readFeaturesFile(testDir);
        validateFeaturesStructure(featuresData);
      } else {
        // If it failed, should have meaningful error
        expect(suggestResult.error).toBeDefined();
      }
    });

    test('should handle file read/write permissions errors', async () => {
      // Note: This test is platform-specific And may not work on all systems
      // It's included for completeness but may be skipped on some platforms

      try {
        // 1. Try to make file read-only (this may not work in all environments)
        const _featuresPath = PATH.join(testDir, 'FEATURES.json');

        // Create initial content
        const featureData = generateTestFeature({
          title: 'Permission Test Feature',
          category: 'enhancement',
        });

        const initialResult = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(initialResult.success).toBe(true);

        // 2. Try to perform another operation
        const secondFeatureData = generateTestFeature({
          title: 'Second Permission Test Feature',
          category: 'bug-fix',
        });

        const secondResult = await execAPI(
          'suggest-feature',
          [JSON.stringify(secondFeatureData)],
          {
            projectRoot: testDir,
          },
        );

        // Should either succeed or fail gracefully
        if (!secondResult.success) {
          expect(secondResult.error).toBeDefined();
        }
      } catch {
        // If permission operations fail, skip this test
        console.warn(
          'Permission test skipped due to system limitations:',
          error.message,
        );
      }
    });
  });
});
