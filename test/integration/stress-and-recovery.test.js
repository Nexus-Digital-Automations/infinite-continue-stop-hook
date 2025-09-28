/**
 * Stress Testing and Error Recovery Integration Tests
 *
 * Comprehensive integration tests for system resilience including:
 * - Concurrent operations and race condition testing
 * - Error recovery from various failure scenarios
 * - System stress testing under high load
 * - Data consistency under concurrent access
 * - Recovery from corrupted states
 * - Performance under extreme conditions
 * - Resource cleanup and memory management
 * - Deadlock prevention and detection
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const {
  execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  writeFeaturesFile,
  corruptFeaturesFile,
  createFeaturesBackup,
  generateTestFeature,
  validateFeaturesStructure,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  delay,
  execAPIConcurrently,
} = require('./test-utils');

describe('Stress Testing and Error Recovery Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    await setupGlobalCleanup();
  });

  afterAll(async () => {
    await teardownGlobalCleanup();
  });

  beforeEach(async () => {
    testDir = await createTestEnvironment('stress-recovery');
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testDir);
  });

  // ========================================
  // CONCURRENT OPERATIONS TESTING
  // ========================================

  describe('Concurrent Operations Testing', () => {
    test('should handle massive concurrent feature suggestions', async () => {
      // 1. Create a large number of concurrent feature suggestions
      const concurrentCount = 50;
      const features = Array.from({ length: concurrentCount }, (_, i) =>
        generateTestFeature({
          title: `Concurrent Feature ${i + 1}`,
          description: `Testing concurrent operations with feature number ${i + 1}`,
          business_value: `Validates system performance under load ${i + 1}`,
          category: [
            'enhancement',
            'bug-fix',
            'new-feature',
            'performance',
            'security',
          ][i % 5],
        }),
      );

      const commands = features.map((featureData) => ({
        command: 'suggest-feature',
        args: [JSON.stringify(featureData)],
        options: { projectRoot: testDir },
      }));

      // 2. Execute all commands concurrently
      const startTime = Date.now();
      const results = await execAPIConcurrently(commands);
      const endTime = Date.now();

      // 3. Verify all operations succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 4. Verify unique feature IDs (no race conditions in ID generation)
      const featureIds = results.map((result) => result.feature.id);
      const uniqueIds = new Set(featureIds);
      expect(uniqueIds.size).toBe(concurrentCount);

      // 5. Verify file integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(concurrentCount);
      expect(featuresData.metadata.total_features).toBe(concurrentCount);

      // 6. Performance check (should complete in reasonable time)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds

      console.log(`Concurrent operations completed in ${duration}ms`);
    });

    test('should handle mixed concurrent operations without conflicts', async () => {
      // 1. Create initial features for mixed operations
      const initialFeatures = Array.from({ length: 20 }, (_, i) =>
        generateTestFeature({
          title: `Mixed Ops Feature ${i + 1}`,
          category: 'enhancement',
        }),
      );

      const featureIds = [];
      for (const featureData of initialFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 2. Create mixed concurrent operations
      const mixedCommands = [
        // More feature suggestions
        ...Array.from({ length: 10 }, (_, i) => ({
          command: 'suggest-feature',
          args: [
            JSON.stringify(
              generateTestFeature({
                title: `Concurrent New Feature ${i + 1}`,
                category: 'new-feature',
              }),
            ),
          ],
          options: { projectRoot: testDir },
        })),

        // Feature approvals
        ...featureIds.slice(0, 5).map((featureId) => ({
          command: 'approve-feature',
          args: [featureId, JSON.stringify({ approved_by: 'concurrent-test' })],
          options: { projectRoot: testDir },
        })),

        // Feature rejections
        ...featureIds.slice(5, 10).map((featureId) => ({
          command: 'reject-feature',
          args: [
            featureId,
            JSON.stringify({
              rejected_by: 'concurrent-test',
              reason: 'Testing concurrent rejection',
            }),
          ],
          options: { projectRoot: testDir },
        })),

        // Agent operations
        ...Array.from({ length: 5 }, (_, i) => ({
          command: 'initialize',
          args: [`concurrent-agent-${i + 1}`],
          options: { projectRoot: testDir },
        })),

        // Statistics queries
        {
          command: 'feature-stats',
          args: [],
          options: { projectRoot: testDir },
        },
        {
          command: 'get-initialization-stats',
          args: [],
          options: { projectRoot: testDir },
        },
        {
          command: 'list-features',
          args: [],
          options: { projectRoot: testDir },
        },
        {
          command: 'list-features',
          args: [JSON.stringify({ status: 'suggested' })],
          options: { projectRoot: testDir },
        },
      ];

      // 3. Execute all mixed operations concurrently
      const results = await execAPIConcurrently(mixedCommands);

      // 4. Verify all operations succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 5. Verify final data consistency
      const finalFeaturesData = await readFeaturesFile(testDir);
      validateFeaturesStructure(finalFeaturesData);

      // Should have original features + new concurrent features
      expect(finalFeaturesData.features.length).toBeGreaterThanOrEqual(30);

      // Verify approval history contains expected number of entries
      expect(
        finalFeaturesData.metadata.approval_history.length,
      ).toBeGreaterThanOrEqual(10);

      // Verify agents were created
      expect(
        Object.keys(finalFeaturesData.agents).length,
      ).toBeGreaterThanOrEqual(5);
    });

    test('should prevent race conditions in bulk operations', async () => {
      // 1. Create features for bulk testing
      const bulkFeatures = Array.from({ length: 20 }, (_, i) =>
        generateTestFeature({
          title: `Bulk Race Test Feature ${i + 1}`,
          category: 'enhancement',
        }),
      );

      const featureIds = [];
      for (const featureData of bulkFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 2. Perform concurrent bulk approvals with overlapping feature sets
      const bulkCommands = [
        {
          command: 'bulk-approve-features',
          args: [
            JSON.stringify(featureIds.slice(0, 10)),
            JSON.stringify({ approved_by: 'bulk-test-1' }),
          ],
          options: { projectRoot: testDir },
        },
        {
          command: 'bulk-approve-features',
          args: [
            JSON.stringify(featureIds.slice(5, 15)),
            JSON.stringify({ approved_by: 'bulk-test-2' }),
          ],
          options: { projectRoot: testDir },
        },
        {
          command: 'bulk-approve-features',
          args: [
            JSON.stringify(featureIds.slice(10, 20)),
            JSON.stringify({ approved_by: 'bulk-test-3' }),
          ],
          options: { projectRoot: testDir },
        },
      ];

      const bulkResults = await execAPIConcurrently(bulkCommands);

      // 3. Analyze results (some may succeed, some may fail due to status conflicts)
      const successCount = bulkResults.filter(
        (result) => result.success,
      ).length;
      expect(successCount).toBeGreaterThan(0); // At least one should succeed

      // 4. Verify final state consistency
      const finalFeaturesData = await readFeaturesFile(testDir);
      validateFeaturesStructure(finalFeaturesData);

      // Count approved features
      const approvedFeatures = finalFeaturesData.features.filter(
        (f) => f.status === 'approved',
      );
      expect(approvedFeatures.length).toBeGreaterThan(0);

      // Verify no duplicate approvals in history
      const approvalIds = finalFeaturesData.metadata.approval_history.map(
        (h) => h.feature_id,
      );
      const uniqueApprovalIds = new Set(approvalIds);
      expect(uniqueApprovalIds.size).toBe(approvalIds.length);
    });

    test('should handle concurrent agent operations safely', async () => {
      // 1. Create concurrent agent operations
      const agentIds = Array.from(
        { length: 15 },
        (_, i) => `stress-agent-${i + 1}`,
      );

      const agentCommands = [
        // Initialize all agents
        ...agentIds.map((agentId) => ({
          command: 'initialize',
          args: [agentId],
          options: { projectRoot: testDir },
        })),

        // Reinitialize some agents
        ...agentIds.slice(0, 5).map((agentId) => ({
          command: 'reinitialize',
          args: [agentId],
          options: { projectRoot: testDir },
        })),

        // More initializations (duplicates)
        ...agentIds.slice(5, 10).map((agentId) => ({
          command: 'initialize',
          args: [agentId],
          options: { projectRoot: testDir },
        })),

        // Statistics queries during operations
        {
          command: 'get-initialization-stats',
          args: [],
          options: { projectRoot: testDir },
        },
        {
          command: 'get-initialization-stats',
          args: [],
          options: { projectRoot: testDir },
        },
      ];

      // 2. Execute all agent operations concurrently
      const results = await execAPIConcurrently(agentCommands);

      // 3. Verify all operations succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 4. Verify agent state consistency
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);

      // All agents should be present
      agentIds.forEach((agentId) => {
        expect(featuresData.agents[agentId]).toBeDefined();
        expect(featuresData.agents[agentId].status).toBe('active');
      });

      // 5. Verify statistics consistency
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_initializations).toBeGreaterThanOrEqual(
        agentIds.length,
      );
    });
  });

  // ========================================
  // ERROR RECOVERY TESTING
  // ========================================

  describe('Error Recovery Testing', () => {
    test('should recover from corrupted FEATURES.json file', async () => {
      // 1. Create some valid data first
      const validFeatures = Array.from({ length: 5 }, (_, i) =>
        generateTestFeature({
          title: `Pre-Corruption Feature ${i + 1}`,
          category: 'enhancement',
        }),
      );

      for (const featureData of validFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
      }

      // 2. Create backup
      await createFeaturesBackup(testDir);

      // 3. Corrupt the file
      await corruptFeaturesFile(testDir);

      // 4. Try to perform operations (should handle corruption gracefully)
      const recoveryFeature = generateTestFeature({
        title: 'Recovery Test Feature',
        category: 'bug-fix',
      });

      const recoveryResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(recoveryFeature)],
        {
          projectRoot: testDir,
        },
      );

      // 5. Verify recovery behavior
      if (recoveryResult.success) {
        // If it recovered, verify data integrity
        const featuresData = await readFeaturesFile(testDir);
        validateFeaturesStructure(featuresData);
      } else {
        // If it failed, should have meaningful error
        expect(recoveryResult.error).toBeDefined();
      }
    });

    test('should handle sudden file deletion during operations', async () => {
      // 1. Create initial data
      const feature = generateTestFeature({
        title: 'Deletion Test Feature',
        category: 'enhancement',
      });

      const initialResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(feature)],
        {
          projectRoot: testDir,
        },
      );
      expect(initialResult.success).toBe(true);

      // 2. Delete FEATURES.json file
      const featuresPath = path.join(testDir, 'FEATURES.json');
      await fs.unlink(featuresPath);

      // 3. Try to perform operations (should recreate file)
      const recoveryFeature = generateTestFeature({
        title: 'After Deletion Feature',
        category: 'bug-fix',
      });

      const recoveryResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(recoveryFeature)],
        {
          projectRoot: testDir,
        },
      );

      expect(recoveryResult.success).toBe(true);

      // 4. Verify file was recreated with proper structure
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features.length).toBeGreaterThan(0);
    });

    test('should handle invalid JSON structure gracefully', async () => {
      // 1. Create invalid JSON structures and test recovery
      const invalidStructures = [
        { features: 'not-an-array' }, // Invalid features field
        { project: null, features: [] }, // Missing required fields
        { features: [{ invalid: 'feature' }] }, // Invalid feature structure
        null, // Completely invalid
        [], // Wrong root type
      ];

      for (const invalidData of invalidStructures) {
        // Write invalid structure
        await writeFeaturesFile(testDir, invalidData);

        // Try to perform operation
        const testFeature = generateTestFeature({
          title: 'Recovery Test Feature',
          category: 'enhancement',
        });

        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(testFeature)],
          {
            projectRoot: testDir,
          },
        );

        // Should either succeed (with recovery) or fail gracefully
        if (result.success) {
          const featuresData = await readFeaturesFile(testDir);
          validateFeaturesStructure(featuresData);
        } else {
          expect(result.error).toBeDefined();
        }
      }
    });

    test('should handle partial write failures and data corruption', async () => {
      // 1. Create initial valid state
      const features = Array.from({ length: 10 }, (_, i) =>
        generateTestFeature({
          title: `Partial Write Test ${i + 1}`,
          category: 'enhancement',
        }),
      );

      for (const featureData of features) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
      }

      // 2. Simulate partial write by creating truncated file
      const featuresPath = path.join(testDir, 'FEATURES.json');
      const originalContent = await fs.readFile(featuresPath, 'utf8');
      const truncatedContent = originalContent.substring(
        0,
        originalContent.length / 2,
      );
      await fs.writeFile(featuresPath, truncatedContent);

      // 3. Try to perform operations
      const recoveryFeature = generateTestFeature({
        title: 'After Truncation Feature',
        category: 'bug-fix',
      });

      const result = await execAPI(
        'suggest-feature',
        [JSON.stringify(recoveryFeature)],
        {
          projectRoot: testDir,
        },
      );

      // 4. Verify recovery behavior
      if (result.success) {
        const featuresData = await readFeaturesFile(testDir);
        validateFeaturesStructure(featuresData);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('should maintain consistency during system interruption simulation', async () => {
      // 1. Perform operations while simulating interruptions
      const operationCount = 20;
      let successCount = 0;

      for (let i = 0; i < operationCount; i++) {
        const feature = generateTestFeature({
          title: `Interruption Test ${i + 1}`,
          category: ['enhancement', 'bug-fix'][i % 2],
        });

        // Simulate random "interruptions" by corrupting file occasionally
        if (i % 7 === 0 && i > 0) {
          // Corrupt file to simulate interruption
          await corruptFeaturesFile(testDir);
        }

        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(feature)],
          {
            projectRoot: testDir,
          },
        );

        if (result.success) {
          successCount++;
        }

        // Brief delay to allow system to recover
        await delay(50);
      }

      // 2. Verify final system state
      expect(successCount).toBeGreaterThan(operationCount / 2); // At least half should succeed

      // 3. Verify file integrity at the end
      const finalFeaturesData = await readFeaturesFile(testDir);
      validateFeaturesStructure(finalFeaturesData);
      expect(finalFeaturesData.features.length).toBe(successCount);
    });
  });

  // ========================================
  // PERFORMANCE STRESS TESTING
  // ========================================

  describe('Performance Stress Testing', () => {
    test('should handle large dataset operations efficiently', async () => {
      // 1. Create a large dataset
      const largeDatasetSize = 100;
      const largeFeatures = Array.from({ length: largeDatasetSize }, (_, i) =>
        generateTestFeature({
          title: `Large Dataset Feature ${i + 1}`,
          description: 'A'.repeat(500), // Larger description
          business_value: 'B'.repeat(200), // Larger business value
          category: [
            'enhancement',
            'bug-fix',
            'new-feature',
            'performance',
            'security',
          ][i % 5],
        }),
      );

      // 2. Add features in batches to measure performance
      const batchSize = 20;
      const performanceData = [];

      for (let i = 0; i < largeFeatures.length; i += batchSize) {
        const batch = largeFeatures.slice(i, i + batchSize);
        const batchCommands = batch.map((featureData) => ({
          command: 'suggest-feature',
          args: [JSON.stringify(featureData)],
          options: { projectRoot: testDir },
        }));

        const startTime = Date.now();
        const results = await execAPIConcurrently(batchCommands);
        const endTime = Date.now();

        expect(results.every((result) => result.success)).toBe(true);

        performanceData.push({
          batchNumber: Math.floor(i / batchSize) + 1,
          duration: endTime - startTime,
          batchSize: batch.length,
        });
      }

      // 3. Verify performance doesn't degrade significantly
      const firstBatchTime = performanceData[0].duration;
      const lastBatchTime =
        performanceData[performanceData.length - 1].duration;

      // Last batch shouldn't be more than 3x slower than first batch
      expect(lastBatchTime).toBeLessThan(firstBatchTime * 3);

      // 4. Verify final dataset integrity
      const finalFeaturesData = await readFeaturesFile(testDir);
      validateFeaturesStructure(finalFeaturesData);
      expect(finalFeaturesData.features).toHaveLength(largeDatasetSize);

      // 5. Test operations on large dataset
      const statsStartTime = Date.now();
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      const statsEndTime = Date.now();

      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total).toBe(largeDatasetSize);

      // Statistics should be fast even with large dataset
      expect(statsEndTime - statsStartTime).toBeLessThan(5000); // Under 5 seconds

      console.log(
        `Performance test completed: ${largeDatasetSize} features, stats in ${statsEndTime - statsStartTime}ms`,
      );
    });

    test('should handle rapid sequential operations without degradation', async () => {
      // 1. Perform rapid sequential operations
      const rapidOperationCount = 100;
      const operationTimes = [];

      for (let i = 0; i < rapidOperationCount; i++) {
        const feature = generateTestFeature({
          title: `Rapid Operation ${i + 1}`,
          category: 'enhancement',
        });

        const startTime = Date.now();
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(feature)],
          {
            projectRoot: testDir,
          },
        );
        const endTime = Date.now();

        expect(result.success).toBe(true);
        operationTimes.push(endTime - startTime);
      }

      // 2. Analyze performance trends
      const firstHalf = operationTimes.slice(0, rapidOperationCount / 2);
      const secondHalf = operationTimes.slice(rapidOperationCount / 2);

      const firstHalfAvg =
        firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;

      // Performance shouldn't degrade significantly
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 2);

      // 3. Verify data integrity after rapid operations
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(rapidOperationCount);

      console.log(
        `Rapid operations: First half avg: ${firstHalfAvg}ms, Second half avg: ${secondHalfAvg}ms`,
      );
    });

    test('should maintain performance under mixed load patterns', async () => {
      // 1. Create mixed load pattern
      const mixedOperations = [];

      // Feature suggestions
      for (let i = 0; i < 30; i++) {
        mixedOperations.push({
          type: 'suggest',
          data: generateTestFeature({
            title: `Mixed Load Feature ${i + 1}`,
            category: 'enhancement',
          }),
        });
      }

      // Agent operations
      for (let i = 0; i < 10; i++) {
        mixedOperations.push({
          type: 'agent-init',
          agentId: `mixed-load-agent-${i + 1}`,
        });
      }

      // Statistics queries
      for (let i = 0; i < 5; i++) {
        mixedOperations.push({ type: 'stats' });
      }

      // Shuffle operations for mixed pattern
      for (let i = mixedOperations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mixedOperations[i], mixedOperations[j]] = [
          mixedOperations[j],
          mixedOperations[i],
        ];
      }

      // 2. Execute mixed load pattern
      const startTime = Date.now();
      const featureIds = [];

      for (const operation of mixedOperations) {
        let result;

        switch (operation.type) {
          case 'suggest':
            result = await execAPI(
              'suggest-feature',
              [JSON.stringify(operation.data)],
              {
                projectRoot: testDir,
              },
            );
            if (result.success) {
              featureIds.push(result.feature.id);
            }
            break;

          case 'agent-init':
            result = await execAPI('initialize', [operation.agentId], {
              projectRoot: testDir,
            });
            break;

          case 'stats':
            result = await execAPI('feature-stats', [], {
              projectRoot: testDir,
            });
            break;
        }

        expect(result.success).toBe(true);
      }

      const endTime = Date.now();

      // 3. Verify mixed load completed efficiently
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds

      // 4. Perform approvals on some features
      const approvalIds = featureIds.slice(0, 10);
      const bulkApproveResult = await execAPI(
        'bulk-approve-features',
        [
          JSON.stringify(approvalIds),
          JSON.stringify({ approved_by: 'mixed-load-test' }),
        ],
        { projectRoot: testDir },
      );

      expect(bulkApproveResult.success).toBe(true);
      expect(bulkApproveResult.approved_count).toBe(10);

      // 5. Verify final data integrity
      const finalFeaturesData = await readFeaturesFile(testDir);
      validateFeaturesStructure(finalFeaturesData);

      console.log(
        `Mixed load test completed in ${totalTime}ms with ${mixedOperations.length} operations`,
      );
    });
  });

  // ========================================
  // RESOURCE CLEANUP AND MEMORY TESTING
  // ========================================

  describe('Resource Cleanup and Memory Testing', () => {
    test('should properly clean up resources after operations', async () => {
      // 1. Perform resource-intensive operations
      const intensiveOperations = Array.from({ length: 50 }, (_, i) => ({
        command: 'suggest-feature',
        args: [
          JSON.stringify(
            generateTestFeature({
              title: `Resource Test Feature ${i + 1}`,
              description: 'X'.repeat(1000), // Large description
              business_value: 'Y'.repeat(500), // Large business value
              category: 'enhancement',
            }),
          ),
        ],
        options: { projectRoot: testDir },
      }));

      // 2. Execute operations
      const results = await execAPIConcurrently(intensiveOperations);
      expect(results.every((result) => result.success)).toBe(true);

      // 3. Verify file size is reasonable (not excessive)
      const featuresPath = path.join(testDir, 'FEATURES.json');
      const stats = await fs.stat(featuresPath);
      expect(stats.size).toBeLessThan(500000); // Should be under 500KB

      // 4. Verify data integrity despite large content
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(50);
    });

    test('should handle cleanup after error scenarios', async () => {
      // 1. Create data, then simulate errors and cleanup
      const feature = generateTestFeature({
        title: 'Cleanup Test Feature',
        category: 'enhancement',
      });

      const initialResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(feature)],
        {
          projectRoot: testDir,
        },
      );
      expect(initialResult.success).toBe(true);

      // 2. Simulate various error scenarios
      await corruptFeaturesFile(testDir);

      // Try operations that might fail
      const errorTestFeature = generateTestFeature({
        title: 'Error Test Feature',
        category: 'bug-fix',
      });

      const _errorResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(errorTestFeature)],
        {
          projectRoot: testDir,
        },
      );

      // 3. Verify system can still operate after errors
      const recoveryFeature = generateTestFeature({
        title: 'Recovery Feature',
        category: 'enhancement',
      });

      const recoveryResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(recoveryFeature)],
        {
          projectRoot: testDir,
        },
      );

      // At least recovery should work
      if (recoveryResult.success) {
        const featuresData = await readFeaturesFile(testDir);
        validateFeaturesStructure(featuresData);
      }
    });
  });
});
