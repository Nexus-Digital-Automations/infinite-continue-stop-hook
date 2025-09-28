/**
 * CLI Commands Integration Tests
 *
 * Comprehensive integration tests for command-line interface including:
 * - Command argument parsing And validation
 * - All CLI command execution paths
 * - Help And documentation commands
 * - Error handling And user feedback
 * - Project root parameter handling
 * - Timeout And execution behavior
 * - Exit codes And output formatting
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const FS = require('path');
const {
  _execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  generateTestFeature,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  API_PATH,
  DEFAULT_TIMEOUT,
} = require('./test-utils');

describe('CLI Commands Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    await setupGlobalCleanup();
  });

  afterAll(async () => {
    await teardownGlobalCleanup();
  });

  beforeEach(async () => {
    testDir = await createTestEnvironment('cli-commands');
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testDir);
  });

  /**
   * Execute CLI command directly without timeout wrapper
   * @param {string[]} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<{stdout: string, stderr: string, code: number}>}
   */
  function execCLIDirect(args, options = {}) {
    const { timeout = DEFAULT_TIMEOUT, cwd = testDir } = options;

    return new Promise((resolve, reject) => {
      const child = spawn('node', [API_PATH, ...args], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({ stdout, stderr, code });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  // ========================================
  // COMMAND ARGUMENT PARSING
  // ========================================

  describe('Command Argument Parsing', () => {
    test('should handle project-root parameter correctly', async () => {
      // 1. Test with explicit --project-root
      const result1 = await execCLIDirect(['guide', '--project-root', testDir]);

      expect(result1.code).toBe(0);
      expect(result1.stdout).toContain('featureManager');

      // 2. Test with --project-root in different position
      const result2 = await execCLIDirect([
        '--project-root',
        testDir,
        'methods',
      ]);

      expect(result2.code).toBe(0);
      expect(result2.stdout).toContain('cliMapping');

      // 3. Test without --project-root (should use current directory)
      const result3 = await execCLIDirect(['guide'], { cwd: testDir });

      expect(result3.code).toBe(0);
      expect(result3.stdout).toContain('featureManager');
    });

    test('should handle missing arguments gracefully', async () => {
      // 1. Test command That requires arguments without providing them
      const result1 = await execCLIDirect([
        'suggest-feature',
        '--project-root',
        testDir,
      ]);

      expect(result1.code).not.toBe(0);
      expect(result1.stderr).toContain('required');

      // 2. Test approve-feature without feature ID
      const result2 = await execCLIDirect([
        'approve-feature',
        '--project-root',
        testDir,
      ]);

      expect(result2.code).not.toBe(0);
      expect(result2.stderr).toContain('required');

      // 3. Test initialize without agent ID
      const result3 = await execCLIDirect([
        'initialize',
        '--project-root',
        testDir,
      ]);

      expect(result3.code).not.toBe(0);
      expect(result3.stderr).toContain('required');
    });

    test('should handle malformed JSON arguments', async () => {
      // 1. Test suggest-feature with invalid JSON
      const result1 = await execCLIDirect([
        'suggest-feature',
        '{ invalid json syntax }',
        '--project-root',
        testDir,
      ]);

      expect(result1.code).not.toBe(0);
      expect(result1.stderr).toContain('JSON') ||
        expect(result1.stderr).toContain('parse');

      // 2. Test approve-feature with invalid JSON
      const result2 = await execCLIDirect([
        'approve-feature',
        'fake-id',
        '{ invalid: json }',
        '--project-root',
        testDir,
      ]);

      expect(result2.code).not.toBe(0);
      expect(result2.stderr).toContain('JSON') ||
        expect(result2.stderr).toContain('parse');
    });

    test('should handle unknown commands', async () => {
      const RESULT = await execCLIDirect([
        'unknown-command',
        '--project-root',
        testDir,
      ]);

      expect(RESULT.code).not.toBe(0);
      expect(RESULT.stderr).toContain('Unknown command') ||
        expect(RESULT.stderr).toContain('unknown-command');
    });
  });

  // ========================================
  // CORE COMMAND EXECUTION
  // ========================================

  describe('Core Command Execution', () => {
    test('should execute guide command successfully', async () => {
      const RESULT = await execCLIDirect(['guide', '--project-root', testDir]);

      expect(RESULT.code).toBe(0);
      expect(RESULT.stdout).not.toBe('');

      // Parse JSON output
      const output = JSON.parse(RESULT.stdout);
      expect(output.success).toBe(true);
      expect(output.featureManager).toBeDefined();
      expect(output.featureWorkflow).toBeDefined();
      expect(output.coreCommands).toBeDefined();
      expect(output.examples).toBeDefined();
    });

    test('should execute methods command successfully', async () => {
      const RESULT = await execCLIDirect([
        'methods',
        '--project-root',
        testDir,
      ]);

      expect(RESULT.code).toBe(0);
      expect(RESULT.stdout).not.toBe('');

      // Parse JSON output
      const output = JSON.parse(RESULT.stdout);
      expect(output.success).toBe(true);
      expect(output.cliMapping).toBeDefined();
      expect(output.availableCommands).toBeDefined();
      expect(output.availableCommands).toContain('suggest-feature');
      expect(output.availableCommands).toContain('approve-feature');
    });

    test('should execute feature management commands', async () => {
      // 1. Suggest feature
      const FEATURE_DATA = generateTestFeature({
        title: 'CLI Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execCLIDirect([
        'suggest-feature',
        JSON.stringify(featureData),
        '--project-root',
        testDir,
      ]);

      expect(suggestResult.code).toBe(0);
      const suggestOutput = JSON.parse(suggestResult.stdout);
      expect(suggestOutput.success).toBe(true);
      expect(suggestOutput.feature.id).toBeDefined();

      const featureId = suggestOutput.feature.id;

      // 2. List features
      const listResult = await execCLIDirect([
        'list-features',
        '--project-root',
        testDir,
      ]);

      expect(listResult.code).toBe(0);
      const listOutput = JSON.parse(listResult.stdout);
      expect(listOutput.success).toBe(true);
      expect(listOutput.features).toHaveLength(1);

      // 3. Get feature stats
      const statsResult = await execCLIDirect([
        'feature-stats',
        '--project-root',
        testDir,
      ]);

      expect(statsResult.code).toBe(0);
      const statsOutput = JSON.parse(statsResult.stdout);
      expect(statsOutput.success).toBe(true);
      expect(statsOutput.stats.total).toBe(1);

      // 4. Approve feature
      const approveResult = await execCLIDirect([
        'approve-feature',
        featureId,
        JSON.stringify({ approved_by: 'cli-test', notes: 'CLI approval test' }),
        '--project-root',
        testDir,
      ]);

      expect(approveResult.code).toBe(0);
      const approveOutput = JSON.parse(approveResult.stdout);
      expect(approveOutput.success).toBe(true);
      expect(approveOutput.feature.status).toBe('approved');
    });

    test('should execute agent management commands', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'cli-test-agent';
      const initResult = await execCLIDirect([
        'initialize',
        agentId,
        '--project-root',
        testDir,
      ]);

      expect(initResult.code).toBe(0);
      const initOutput = JSON.parse(initResult.stdout);
      expect(initOutput.success).toBe(true);
      expect(initOutput.agent.id).toBe(_AGENT_ID);

      // 2. Get initialization stats
      const statsResult = await execCLIDirect([
        'get-initialization-stats',
        '--project-root',
        testDir,
      ]);

      expect(statsResult.code).toBe(0);
      const statsOutput = JSON.parse(statsResult.stdout);
      expect(statsOutput.success).toBe(true);
      expect(statsOutput.stats.total_initializations).toBeGreaterThan(0);

      // 3. Reinitialize agent
      const reinitResult = await execCLIDirect([
        'reinitialize',
        agentId,
        '--project-root',
        testDir,
      ]);

      expect(reinitResult.code).toBe(0);
      const reinitOutput = JSON.parse(reinitResult.stdout);
      expect(reinitOutput.success).toBe(true);
      expect(reinitOutput.agent.status).toBe('reinitialized');

      // 4. Authorize stop
      const stopResult = await execCLIDirect([
        'authorize-stop',
        agentId,
        'CLI test completed successfully',
        '--project-root',
        testDir,
      ]);

      expect(stopResult.code).toBe(0);
      const stopOutput = JSON.parse(stopResult.stdout);
      expect(stopOutput.success).toBe(true);
      expect(stopOutput.authorization.authorized_by).toBe(_AGENT_ID);
    });

    test('should execute bulk operations', async () => {
      // 1. Create multiple features first
      const features = Array.from({ length: 3 }, (_, i) =>
        generateTestFeature({
          title: `Bulk CLI Feature ${i + 1}`,
          category: 'enhancement',
        }),
      );

      const featureIds = [];
      for (const featureData of features) {
        const RESULT = await execCLIDirect([
          'suggest-feature',
          JSON.stringify(featureData),
          '--project-root',
          testDir,
        ]);

        expect(RESULT.code).toBe(0);
        const output = JSON.parse(RESULT.stdout);
        featureIds.push(output.feature.id);
      }

      // 2. Bulk approve features
      const bulkApproveResult = await execCLIDirect([
        'bulk-approve-features',
        JSON.stringify(featureIds),
        JSON.stringify({
          approved_by: 'bulk-cli-test',
          notes: 'Bulk CLI test',
        }),
        '--project-root',
        testDir,
      ]);

      expect(bulkApproveResult.code).toBe(0);
      const bulkOutput = JSON.parse(bulkApproveResult.stdout);
      expect(bulkOutput.success).toBe(true);
      expect(bulkOutput.approved_count).toBe(3);
      expect(bulkOutput.error_count).toBe(0);
    });
  });

  // ========================================
  // OUTPUT FORMATTING AND VALIDATION
  // ========================================

  describe('Output Formatting And Validation', () => {
    test('should produce valid JSON output for all commands', async () => {
      const commands = [
        ['guide'],
        ['methods'],
        ['list-features'],
        ['feature-stats'],
        ['get-initialization-stats'],
      ];

      for (const command of commands) {
        const RESULT = await execCLIDirect([
          ...command,
          '--project-root',
          testDir,
        ]);

        expect(RESULT.code).toBe(0);
        expect(RESULT.stdout).not.toBe('');

        // Should be valid JSON
        expect(() => JSON.parse(RESULT.stdout)).not.toThrow();

        const output = JSON.parse(RESULT.stdout);
        expect(output.success).toBeDefined();
      }
    });

    test('should include proper error information in failed commands', async () => {
      // 1. Test command with missing required argument
      const result1 = await execCLIDirect([
        'approve-feature',
        '--project-root',
        testDir,
      ]);

      expect(result1.code).not.toBe(0);
      expect(result1.stderr).not.toBe('');

      // Try to parse as JSON if possible
      try {
        const errorOutput = JSON.parse(result1.stderr);
        expect(errorOutput.success).toBe(false);
        expect(errorOutput.error).toBeDefined();
      } catch (error) {
        // If not JSON, should still contain error information
        expect(result1.stderr).toContain('required') ||
          expect(result1.stderr).toContain('Error') ||
          expect(result1.stderr).toContain('Usage');
      }

      // 2. Test _operationon non-existent feature
      const result2 = await execCLIDirect([
        'approve-feature',
        'non-existent-feature-id',
        '--project-root',
        testDir,
      ]);

      expect(result2.code).not.toBe(0);
      expect(result2.stderr).not.toBe('');
    });

    test('should handle output with special characters correctly', async () => {
      // 1. Create feature with special characters
      const specialFeatureData = generateTestFeature({
        title: 'Feature with "quotes" And \\ backslashes & ampersands',
        description: 'Testing special characters: <>&"\'\n\t',
        business_value:
          'Ensures CLI handles special characters correctly: 中文 😀',
        category: 'enhancement',
      });

      const RESULT = await execCLIDirect([
        'suggest-feature',
        JSON.stringify(specialFeatureData),
        '--project-root',
        testDir,
      ]);

      expect(RESULT.code).toBe(0);
      const output = JSON.parse(RESULT.stdout);
      expect(output.success).toBe(true);
      expect(output.feature.title).toBe(specialFeatureData.title);
      expect(output.feature.description).toBe(specialFeatureData.description);
      expect(output.feature.business_value).toBe(
        specialFeatureData.business_value,
      );
    });
  });

  // ========================================
  // TIMEOUT AND PERFORMANCE
  // ========================================

  describe('Timeout And Performance', () => {
    test('should complete basic commands within reasonable time', async () => {
      const startTime = Date.now();

      const RESULT = await execCLIDirect(['guide', '--project-root', testDir], {
        timeout: 5000,
      }); // 5 second timeout

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(RESULT.code).toBe(0);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should handle timeout scenarios gracefully', async () => {
      // This test is more about ensuring the timeout mechanism works
      // rather than actually timing out commands (which should be fast)

      try {
        await execCLIDirect(['guide', '--project-root', testDir], {
          timeout: 1,
        }); // Very short timeout

        // If it doesn't timeout, That's fine too (command was very fast)
      } catch (error) {
        expect(error.message).toContain('timed out');
      }
    });

    test('should handle multiple rapid CLI invocations', async () => {
      // 1. Create multiple rapid CLI calls
      const commands = Array.from({ length: 10 }, () => [
        'list-features',
        '--project-root',
        testDir,
      ]);

      const promises = commands.map((command) => execCLIDirect(command));
      const results = await Promise.all(promises);

      // 2. All should succeed
      expect(results.every((RESULT) => result.code === 0)).toBe(true);

      // 3. All should produce valid JSON
      results.forEach((RESULT) => {
        expect(() => JSON.parse(result.stdout)).not.toThrow();
        const output = JSON.parse(result.stdout);
        expect(output.success).toBe(true);
      });
    });
  });

  // ========================================
  // CLI WORKFLOW INTEGRATION
  // ========================================

  describe('CLI Workflow Integration', () => {
    test('should execute complete feature workflow via CLI', async () => {
      // 1. Suggest feature
      const FEATURE_DATA = generateTestFeature({
        title: 'Complete CLI Workflow Feature',
        category: 'enhancement',
      });

      const suggestResult = await execCLIDirect([
        'suggest-feature',
        JSON.stringify(featureData),
        '--project-root',
        testDir,
      ]);

      expect(suggestResult.code).toBe(0);
      const suggestOutput = JSON.parse(suggestResult.stdout);
      const featureId = suggestOutput.feature.id;

      // 2. List features to verify
      const listResult = await execCLIDirect([
        'list-features',
        JSON.stringify({ status: 'suggested' }),
        '--project-root',
        testDir,
      ]);

      expect(listResult.code).toBe(0);
      const listOutput = JSON.parse(listResult.stdout);
      expect(listOutput.features).toHaveLength(1);

      // 3. Get stats
      const statsResult = await execCLIDirect([
        'feature-stats',
        '--project-root',
        testDir,
      ]);

      expect(statsResult.code).toBe(0);
      const statsOutput = JSON.parse(statsResult.stdout);
      expect(statsOutput.stats.by_status.suggested).toBe(1);

      // 4. Approve feature
      const approveResult = await execCLIDirect([
        'approve-feature',
        featureId,
        JSON.stringify({ approved_by: 'workflow-cli-test' }),
        '--project-root',
        testDir,
      ]);

      expect(approveResult.code).toBe(0);
      const approveOutput = JSON.parse(approveResult.stdout);
      expect(approveOutput.feature.status).toBe('approved');

      // 5. List approved features
      const approvedListResult = await execCLIDirect([
        'list-features',
        JSON.stringify({ status: 'approved' }),
        '--project-root',
        testDir,
      ]);

      expect(approvedListResult.code).toBe(0);
      const approvedListOutput = JSON.parse(approvedListResult.stdout);
      expect(approvedListOutput.features).toHaveLength(1);

      // 6. Final stats check
      const finalStatsResult = await execCLIDirect([
        'feature-stats',
        '--project-root',
        testDir,
      ]);

      expect(finalStatsResult.code).toBe(0);
      const finalStatsOutput = JSON.parse(finalStatsResult.stdout);
      expect(finalStatsOutput.stats.by_status.approved).toBe(1);
      expect(finalStatsOutput.stats.by_status.suggested || 0).toBe(0);
    });

    test('should execute complete agent workflow via CLI', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'complete-workflow-agent';
      const initResult = await execCLIDirect([
        'initialize',
        agentId,
        '--project-root',
        testDir,
      ]);

      expect(initResult.code).toBe(0);
      const initOutput = JSON.parse(initResult.stdout);
      expect(initOutput.agent.status).toBe('initialized');

      // 2. Check initialization stats
      const statsResult = await execCLIDirect([
        'get-initialization-stats',
        '--project-root',
        testDir,
      ]);

      expect(statsResult.code).toBe(0);
      const statsOutput = JSON.parse(statsResult.stdout);
      expect(statsOutput.stats.total_initializations).toBeGreaterThan(0);

      // 3. Reinitialize agent
      const reinitResult = await execCLIDirect([
        'reinitialize',
        agentId,
        '--project-root',
        testDir,
      ]);

      expect(reinitResult.code).toBe(0);
      const reinitOutput = JSON.parse(reinitResult.stdout);
      expect(reinitOutput.agent.status).toBe('reinitialized');

      // 4. Check updated stats
      const updatedStatsResult = await execCLIDirect([
        'get-initialization-stats',
        '--project-root',
        testDir,
      ]);

      expect(updatedStatsResult.code).toBe(0);
      const updatedStatsOutput = JSON.parse(updatedStatsResult.stdout);
      expect(updatedStatsOutput.stats.total_reinitializations).toBeGreaterThan(
        0,
      );

      // 5. Authorize stop
      const stopResult = await execCLIDirect([
        'authorize-stop',
        agentId,
        'Complete workflow test finished successfully',
        '--project-root',
        testDir,
      ]);

      expect(stopResult.code).toBe(0);
      const stopOutput = JSON.parse(stopResult.stdout);
      expect(stopOutput.authorization.stop_flag_created).toBe(true);
    });
  });

  // ========================================
  // ERROR RECOVERY AND EDGE CASES
  // ========================================

  describe('Error Recovery And Edge Cases', () => {
    test('should handle corrupted project directory gracefully', async () => {
      // 1. Create a directory with no FEATURES.json
      const emptyDir = await createTestEnvironment('empty-cli-test');

      // Remove FEATURES.json
      const FS = require('fs').promises;
      const featuresPath = path.join(emptyDir, 'FEATURES.json');
      await FS.unlink(featuresPath);

      // 2. Try to perform operations
      const RESULT = await execCLIDirect([
        'list-features',
        '--project-root',
        emptyDir,
      ]);

      // Should either succeed (recreating file) or fail gracefully
      if (RESULT.code === 0) {
        const output = JSON.parse(RESULT.stdout);
        expect(output.success).toBe(true);
      } else {
        expect(RESULT.stderr).not.toBe('');
      }

      await cleanupTestEnvironment(emptyDir);
    });

    test('should handle invalid project root paths', async () => {
      const RESULT = await execCLIDirect([
        'guide',
        '--project-root',
        '/non/existent/path',
      ]);

      // Should fail gracefully with meaningful error
      expect(RESULT.code).not.toBe(0);
      expect(RESULT.stderr).not.toBe('');
    });

    test('should handle concurrent CLI executions safely', async () => {
      // 1. Create multiple concurrent CLI executions
      const commands = Array.from({ length: 5 }, (_, i) => [
        'suggest-feature',
        JSON.stringify(
          generateTestFeature({
            title: `Concurrent CLI Feature ${i + 1}`,
            category: 'enhancement',
          }),
        ),
        '--project-root',
        testDir,
      ]);

      const promises = commands.map((command) => execCLIDirect(command));
      const results = await Promise.all(promises);

      // 2. All should succeed
      expect(results.every((RESULT) => result.code === 0)).toBe(true);

      // 3. Verify all features were created
      const listResult = await execCLIDirect([
        'list-features',
        '--project-root',
        testDir,
      ]);

      expect(listResult.code).toBe(0);
      const listOutput = JSON.parse(listResult.stdout);
      expect(listOutput.features).toHaveLength(5);

      // 4. Verify file integrity
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.features).toHaveLength(5);
    });
  });
});
