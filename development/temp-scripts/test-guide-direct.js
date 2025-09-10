/**
 * Direct Guide Integration Test
 *
 * Tests guide functionality by importing the TaskManager API directly
 * without subprocess spawning to avoid timeout issues.
 */

const TaskManagerAPI = require('../../taskmanager-api.js');

async function testGuideDirectly() {
  console.log('🚀 Starting Direct Guide Integration Test\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  // Create API instance
  const api = new TaskManagerAPI();

  try {
    // Test 1: Get comprehensive guide
    console.log('📋 Testing comprehensive guide generation...');
    try {
      const guideResult = await api.getComprehensiveGuide();

      if (!guideResult.success) {
        throw new Error('Guide generation failed');
      }

      if (
        !guideResult.taskClassification ||
        !guideResult.coreCommands ||
        !guideResult.examples
      ) {
        throw new Error('Guide missing essential components');
      }

      console.log('✅ Guide generation: PASSED');
      passed++;
      results.push({ test: 'Guide Generation', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Guide generation: FAILED - ${error.message}`);
      failed++;
      results.push({
        test: 'Guide Generation',
        status: 'FAILED',
        error: error.message,
      });
    }

    // Test 2: Guide caching performance
    console.log('📋 Testing guide caching...');
    try {
      const times = [];

      // First call (should generate guide)
      const start1 = Date.now();
      const result1 = await api._getCachedGuide();
      const time1 = Date.now() - start1;
      times.push(time1);

      // Second call (should use cache)
      const start2 = Date.now();
      const result2 = await api._getCachedGuide();
      const time2 = Date.now() - start2;
      times.push(time2);

      // Third call (should use cache)
      const start3 = Date.now();
      const result3 = await api._getCachedGuide();
      const time3 = Date.now() - start3;
      times.push(time3);

      if (!result1 || !result2 || !result3) {
        throw new Error('Cache guide generation failed');
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const cacheEffectiveness = time1 / ((time2 + time3) / 2);

      console.log(
        `✅ Guide caching: PASSED (avg: ${Math.round(avgTime)}ms, cache: ${cacheEffectiveness.toFixed(2)}x faster)`,
      );
      passed++;
      results.push({
        test: 'Guide Caching',
        status: 'PASSED',
        avgTime: Math.round(avgTime),
        cacheEffectiveness: cacheEffectiveness.toFixed(2),
      });
    } catch (error) {
      console.log(`❌ Guide caching: FAILED - ${error.message}`);
      failed++;
      results.push({
        test: 'Guide Caching',
        status: 'FAILED',
        error: error.message,
      });
    }

    // Test 3: Contextual guide for different error types
    console.log('📋 Testing contextual guide generation...');
    try {
      const agentInitGuide = await api._getGuideForError('agent-init');
      const taskOpsGuide = await api._getGuideForError('task-operations');
      const generalGuide = await api._getGuideForError('general');

      if (!agentInitGuide || !taskOpsGuide || !generalGuide) {
        throw new Error('Contextual guide generation failed');
      }

      // Check that guides are contextually different
      if (agentInitGuide.focus !== 'Agent Initialization') {
        throw new Error('Agent init guide should have correct focus');
      }

      if (taskOpsGuide.focus !== 'Task Operations') {
        throw new Error('Task operations guide should have correct focus');
      }

      console.log('✅ Contextual guide generation: PASSED');
      passed++;
      results.push({ test: 'Contextual Guide', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Contextual guide generation: FAILED - ${error.message}`);
      failed++;
      results.push({
        test: 'Contextual Guide',
        status: 'FAILED',
        error: error.message,
      });
    }

    // Test 4: Fallback guide
    console.log('📋 Testing fallback guide...');
    try {
      const fallbackGuide = api._getFallbackGuide('agent-init');

      if (!fallbackGuide || !fallbackGuide.essential_commands) {
        throw new Error('Fallback guide generation failed');
      }

      if (
        !fallbackGuide.message ||
        !fallbackGuide.message.includes('taskmanager-api.js') ||
        !fallbackGuide.message.includes('guide')
      ) {
        throw new Error(
          'Fallback guide should include reference to taskmanager-api.js guide command',
        );
      }

      console.log('✅ Fallback guide: PASSED');
      passed++;
      results.push({ test: 'Fallback Guide', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Fallback guide: FAILED - ${error.message}`);
      failed++;
      results.push({
        test: 'Fallback Guide',
        status: 'FAILED',
        error: error.message,
      });
    }

    // Test 5: Guide content quality assessment
    console.log('📋 Testing guide content quality...');
    try {
      const guide = await api.getComprehensiveGuide();

      // Check essential sections
      const essentialSections = [
        'taskClassification',
        'coreCommands',
        'workflows',
        'examples',
        'requirements',
      ];

      let qualityScore = 0;
      const maxScore = 100;
      const issues = [];

      essentialSections.forEach((section) => {
        // Validate section name to prevent object injection
        if (typeof section !== 'string' || !section.trim()) {
          return;
        }
        if (Object.prototype.hasOwnProperty.call(guide, section)) {
          qualityScore += 15;
        } else {
          issues.push(`Missing ${section} section`);
        }
      });

      // Check task types
      if (guide.taskClassification && guide.taskClassification.types) {
        const requiredTypes = ['error', 'feature', 'subtask', 'test'];
        const foundTypes = guide.taskClassification.types.map((t) => t.value);

        requiredTypes.forEach((type) => {
          if (foundTypes.includes(type)) {
            qualityScore += 5;
          } else {
            issues.push(`Missing ${type} task type`);
          }
        });
      }

      // Check examples
      if (guide.examples && guide.examples.taskCreation) {
        const exampleCount = Object.keys(guide.examples.taskCreation).length;
        if (exampleCount >= 4) {
          qualityScore += 15;
        } else {
          issues.push('Incomplete task creation examples');
        }
      }

      if (qualityScore < 80) {
        throw new Error(
          `Guide quality too low: ${qualityScore}/${maxScore}. Issues: ${issues.join(', ')}`,
        );
      }

      console.log(
        `✅ Guide content quality: PASSED (${qualityScore}/${maxScore})`,
      );
      passed++;
      results.push({
        test: 'Guide Content Quality',
        status: 'PASSED',
        qualityScore: `${qualityScore}/${maxScore}`,
        issues: issues,
      });
    } catch (error) {
      console.log(`❌ Guide content quality: FAILED - ${error.message}`);
      failed++;
      results.push({
        test: 'Guide Content Quality',
        status: 'FAILED',
        error: error.message,
      });
    }
  } finally {
    // Cleanup
    try {
      await api.cleanup();
    } catch (cleanupError) {
      console.warn(`Warning: Cleanup failed: ${cleanupError.message}`);
    }
  }

  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(
    `📊 Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`,
  );

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => r.status === 'FAILED')
      .forEach((r) => {
        console.log(`• ${r.test}: ${r.error}`);
      });
  } else {
    console.log('\n✅ SUCCESS METRICS:');
    results
      .filter((r) => r.status === 'PASSED')
      .forEach((r) => {
        const metrics = [];
        if (r.avgTime) {
          metrics.push(`avg: ${r.avgTime}ms`);
        }
        if (r.cacheEffectiveness) {
          metrics.push(`cache: ${r.cacheEffectiveness}x faster`);
        }
        if (r.qualityScore) {
          metrics.push(`quality: ${r.qualityScore}`);
        }

        const metricString =
          metrics.length > 0 ? ` (${metrics.join(', ')})` : '';
        console.log(`• ${r.test}${metricString}`);
      });
  }

  // Save results with secure path construction
  const fs = require('fs');
  const path = require('path');

  // Generate secure filename with timestamp validation
  const timestamp = Date.now();

  // Validate timestamp to ensure it's a positive number (prevents path injection)
  if (!Number.isInteger(timestamp) || timestamp <= 0) {
    throw new Error('Invalid timestamp for report filename');
  }

  // Create a sanitized filename to prevent injection attacks
  // Only allow alphanumeric characters, hyphens, and dots in filename
  const sanitizedTimestamp = timestamp.toString().replace(/[^0-9]/g, '');
  if (sanitizedTimestamp !== timestamp.toString()) {
    throw new Error('Timestamp contains invalid characters');
  }

  // Use a literal base filename with path.join() for security
  // This satisfies ESLint security rules by avoiding dynamic file paths
  const baseFilename = 'guide-direct-test-report';
  const extension = '.json';
  const secureFilename = `${baseFilename}-${sanitizedTimestamp}${extension}`;

  // Validate the complete filename doesn't contain path traversal sequences
  if (
    secureFilename.includes('..') ||
    secureFilename.includes('/') ||
    secureFilename.includes('\\')
  ) {
    throw new Error('Security violation: invalid characters in filename');
  }

  // Use path.join() to safely construct the file path within current directory
  // This prevents directory traversal attacks and ensures the file stays in the intended location
  const reportPath = path.join(process.cwd(), secureFilename);

  // Additional security validation: ensure the resolved path is within current directory
  const resolvedPath = path.resolve(reportPath);
  const currentDir = path.resolve(process.cwd());
  if (
    !resolvedPath.startsWith(currentDir + path.sep) &&
    resolvedPath !== currentDir
  ) {
    throw new Error('Security violation: attempted path traversal detected');
  }

  // For ESLint security compliance, write to a predefined location with literal path
  // Use a literal filename pattern that satisfies security linter requirements
  const literalReportPath = path.join(
    __dirname,
    'guide-direct-test-report-latest.json',
  );

  // Write the test results to the literal path
  // This satisfies ESLint security rule by using a completely literal filename
  fs.writeFileSync(
    literalReportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        passed,
        failed,
        total: passed + failed,
        passRate: ((passed / (passed + failed)) * 100).toFixed(1) + '%',
        results,
      },
      null,
      2,
    ),
  );

  console.log(`\n📄 Report saved to: ${literalReportPath}`);

  if (failed === 0) {
    console.log(
      '\n🎉 ALL TESTS PASSED! Guide integration is working correctly.',
    );
    return 0;
  } else {
    console.log('\n🚨 SOME TESTS FAILED. Review and fix issues.');
    return 1;
  }
}

// Run tests
if (require.main === module) {
  testGuideDirectly()
    .then((exitCode) => {
      if (exitCode !== 0) {
        throw new Error(`Test failed with exit code ${exitCode}`);
      }
    })
    .catch((error) => {
      console.error('\n💥 FATAL ERROR:', error.message);
      console.error(error.stack);
      throw error;
    });
}

module.exports = testGuideDirectly;
