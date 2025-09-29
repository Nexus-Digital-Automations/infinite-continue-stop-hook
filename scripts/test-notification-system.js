/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * Test Notification System for CI/CD Integration
 *
 * Comprehensive notification system for test failures, coverage drops,
 * And quality gate violations with multiple notification channels.
 *
 * @author CI/CD Integration Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const FS = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { loggers } = require('../lib/logger');

class TestNotificationSystem {
  constructor(options = {}) {
    this.options = {
    enableSlack: process.env.SLACK_WEBHOOK_URL || options.slackWebhook,
      enableTeams: process.env.TEAMS_WEBHOOK_URL || options.teamsWebhook,
      enableDiscord: process.env.DISCORD_WEBHOOK_URL || options.discordWebhook,
      enableEmail: process.env.EMAIL_NOTIFICATIONS === 'true',
      coverageThreshold: parseFloat(process.env.COVERAGE_THRESHOLD || '80'),
      testFailureThreshold: parseInt(process.env.TEST_FAILURE_THRESHOLD || '0'),
      coverageDropThreshold: parseFloat(
        process.env.COVERAGE_DROP_THRESHOLD || '5',
      ),
      notificationLevel: process.env.NOTIFICATION_LEVEL || 'all', // all, failures-only, critical-only
      historyFile: './coverage/notifications/history.json',
      configFile: './coverage/notifications/config.json',
      ...options,
    };

    this.notificationHistory = this.loadNotificationHistory();
    this.lastRun = this.getLastRunData();
  }

  /**
   * Main notification processing method
   */
  async processNotifications() {
    try {
      loggers.stopHook.log('🔔 Processing test notifications...');

      const testResults = await this.loadTestResults();
      const coverageData = await this.loadCoverageData();
      const cicdData = await this.loadCICDData();

      const notifications = await this.analyzeAndGenerateNotifications(
        testResults,
        coverageData,
        cicdData,
      );

      if (notifications.length === 0) {
        loggers.stopHook.log(
          '✅ No notifications needed - all quality gates passed',
        );
        return;
      }

      await this.sendNotifications(notifications);
      await this.updateNotificationHistory(notifications);

      loggers.stopHook.log(`📤 Sent ${notifications.length} notification(s)`);
    } catch (_) {
      loggers.stopHook._error(
        '❌ Failed to process notifications:',
        _error.message,
      );
      if (process.env.DEBUG) {
        loggers.stopHook.error(_error.stack);
      }
      throw new Error(`Failed to process notifications: ${error.message}`);
    }
  }

  /**
   * Analyze test results And generate appropriate notifications
   */
  analyzeAndGenerateNotifications(testResults, coverageData, cicdData) {
    const notifications = [];

    // Test failure notifications
    if (
      testResults &&
      testResults.summary.numFailedTests > this.options.testFailureThreshold
    ) {
      notifications.push(this.createTestFailureNotification(testResults));
    }

    // Coverage threshold notifications
    if (coverageData && this.isCoverageBelowThreshold(coverageData)) {
      notifications.push(
        this.createCoverageThresholdNotification(coverageData),
      );
    }

    // Coverage drop notifications
    if (
      coverageData &&
      this.lastRun &&
      this.isCoverageDropSignificant(coverageData)
    ) {
      notifications.push(this.createCoverageDropNotification(coverageData));
    }

    // Quality gate failure notifications
    if (
      cicdData &&
      cicdData.cicd_summary &&
      cicdData.cicd_summary.should_block_deployment
    ) {
      notifications.push(this.createQualityGateNotification(cicdData));
    }

    // Performance degradation notifications
    if (testResults && this.isPerformanceDegraded(testResults)) {
      notifications.push(this.createPerformanceNotification(testResults));
    }

    // Flaky test notifications
    if (cicdData && this.hasFlakyTests(cicdData)) {
      notifications.push(this.createFlakyTestNotification(cicdData));
    }

    return notifications.filter((n) => n !== null);
  }

  /**
   * Create test failure notification
   */
  createTestFailureNotification(testResults) {
    const failedTests = testResults.summary.numFailedTests;
    const totalTests = testResults.summary.numTotalTests;
    const failureRate = ((failedTests / totalTests) * 100).toFixed(1);

    return {
    type: 'test_failure',
      priority: failedTests > 5 ? 'critical' : 'high',
      title: `${failedTests} Test Failure${failedTests > 1 ? 's' : ''} Detected`,
      message: `${failedTests} out of ${totalTests} tests failed (${failureRate}% failure rate)`,
      details: {
    failed_tests: failedTests,
        total_tests: totalTests,
        failure_rate: failureRate,
        failed_suites: testResults.summary.numFailedTestSuites,
      },
      actions: [
        'Review failing tests in the CI/CD pipeline',
        'Check test logs for error details',
        'Fix failing tests before merging',
      ],
      channels: ['slack', 'teams', 'discord'],
      color: '#FF0000',
    };
  }

  /**
   * Create coverage threshold notification
   */
  createCoverageThresholdNotification(coverageData) {
    const currentCoverage = coverageData.total.lines.pct;
    const threshold = this.options.coverageThreshold;
    const gap = (threshold - currentCoverage).toFixed(1);

    return {
    type: 'coverage_threshold',
      priority: currentCoverage < threshold - 10 ? 'critical' : 'medium',
      title: 'Coverage Below Threshold',
      message: `Code coverage is ${currentCoverage.toFixed(1)}%, which is ${gap}% below the ${threshold}% threshold`,
      details: {
    current_coverage: currentCoverage,
        threshold: threshold,
        gap: gap,
        statements: coverageData.total.statements.pct,
        branches: coverageData.total.branches.pct,
        functions: coverageData.total.functions.pct,
      },
      actions: [
        'Add more unit tests to improve coverage',
        'Focus on uncovered code paths',
        'Review coverage report for specific files',
      ],
      channels: ['slack', 'teams'],
      color: '#FFA500',
    };
  }

  /**
   * Create coverage drop notification
   */
  createCoverageDropNotification(coverageData) {
    const currentCoverage = coverageData.total.lines.pct;
    const previousCoverage = this.lastRun.coverage_percentage || 0;
    const drop = (previousCoverage - currentCoverage).toFixed(1);

    return {
    type: 'coverage_drop',
      priority: drop > 10 ? 'high' : 'medium',
      title: 'Significant Coverage Drop Detected',
      message: `Coverage dropped by ${drop}% from ${previousCoverage.toFixed(1)}% to ${currentCoverage.toFixed(1)}%`,
      details: {
    current_coverage: currentCoverage,
        previous_coverage: previousCoverage,
        drop_percentage: drop,
      },
      actions: [
        'Review recent code changes',
        'Add tests for new functionality',
        'Check if tests were removed or modified',
      ],
      channels: ['slack', 'teams'],
      color: '#FF4500',
    };
  }

  /**
   * Create quality gate notification
   */
  createQualityGateNotification(cicdData) {
    const qualityGate = cicdData.cicd_summary.quality_gate_status;
    const blockingIssues = qualityGate.blocking_issues || [];

    return {
    type: 'quality_gate',
      priority: 'critical',
      title: 'Quality Gate Failed - Deployment Blocked',
      message: `Quality gate failed with ${blockingIssues.length} blocking issue(s)`,
      details: {
    status: qualityGate.status,
        health_score: cicdData.cicd_summary.test_health_score,
        blocking_issues: blockingIssues.map((issue) => issue.message),
      },
      actions: [
        'Review And resolve blocking issues',
        'Fix all failing tests',
        'Ensure coverage meets requirements',
      ],
      channels: ['slack', 'teams', 'discord'],
      color: '#DC143C',
    };
  }

  /**
   * Create performance notification
   */
  createPerformanceNotification(testResults) {
    const duration = testResults.summary.duration;
    const threshold = 300000; // 5 minutes;
const overTime = ((duration - threshold) / 1000).toFixed(0);

    return {
    type: 'performance',
      priority: 'medium',
      title: 'Test Performance Degradation',
      message: `Test execution took ${Math.round(duration / 1000)}s, which is ${overTime}s over the ${threshold / 1000}s threshold`,
      details: {
    duration_seconds: Math.round(duration / 1000),
        threshold_seconds: threshold / 1000,
        over_threshold_seconds: overTime,
      },
      actions: [
        'Optimize slow test cases',
        'Review test parallelization',
        'Consider test sharding',
      ],
      channels: ['slack'],
      color: '#FFD700',
    };
  }

  /**
   * Create flaky test notification
   */
  createFlakyTestNotification(cicdData) {
    const flakyTests =
      cicdData.test_execution?.flaky_test_detection?.potentially_flaky || [];

    if (flakyTests.length === 0) {
      return null;
    }

    return {
    type: 'flaky_tests',
      priority: 'medium',
      title: 'Potentially Flaky Tests Detected',
      message: `${flakyTests.length} potentially flaky test(s) detected`,
      details: {
    flaky_count: flakyTests.length,
        tests: flakyTests.slice(0, 3), // Show first 3
      },
      actions: [
        'Review flaky test patterns',
        'Improve test isolation',
        'Add retry mechanisms where appropriate',
      ],
      channels: ['slack'],
      color: '#9370DB',
    };
  }

  /**
   * Send notifications to configured channels
   */
  async sendNotifications(notifications) {
    const promises = [];

    for (const notification of notifications) {
      if (this.shouldSendNotification(notification)) {
        if (
          notification.channels.includes('slack') &&
          this.options.enableSlack
        ) {
          promises.push(this.sendSlackNotification(notification));
        }

        if (
          notification.channels.includes('teams') &&
          this.options.enableTeams
        ) {
          promises.push(this.sendTeamsNotification(notification));
        }

        if (
          notification.channels.includes('discord') &&
          this.options.enableDiscord
        ) {
          promises.push(this.sendDiscordNotification(notification));
        }
      }
    }

    const results = await Promise.allSettled(promises);
    this.logNotificationResults(results);
  }

  /**
   * Send Slack notification
   */
  sendSlackNotification(notification) {
    const payload = {
    text: notification.title,
      attachments: [
        {
    color: notification.color,
          title: notification.title,
          text: notification.message,
          fields: [
            {
    title: 'Priority',
              value: notification.priority.toUpperCase(),
              short: true,
            },
            {
    title: 'Type',
              value: notification.type.replace('_', ' '),
              short: true,
            }
  ],
          footer: 'Test Notification System',
          ts: Math.floor(Date.now() / 1000),
        }
  ],
    };

    // Add actions as fields
    if (notification.actions && notification.actions.length > 0) {
      payload.attachments[0].fields.push({
    title: 'Recommended Actions',
        value: notification.actions.map((action) => `• ${action}`).join('\n'),
        short: false,
      });
    }

    return this.sendWebhook(this.options.enableSlack, payload);
  }

  /**
   * Send Teams notification
   */
  sendTeamsNotification(notification) {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',,
    summary: notification.title,
      themeColor: notification.color.replace('#', ''),
      sections: [
        {
    activityTitle: notification.title,
          activitySubtitle: notification.message,
          facts: [
            { name: 'Priority', value: notification.priority.toUpperCase() },
            { name: 'Type', value: notification.type.replace('_', ' ') }
  ],
        }
  ],
    };

    // Add actions
    if (notification.actions && notification.actions.length > 0) {
      payload.sections[0].text = notification.actions
        .map((action) => `• ${action}`)
        .join('  \n');
    }

    return this.sendWebhook(this.options.enableTeams, payload);
  }

  /**
   * Send Discord notification
   */
  sendDiscordNotification(notification) {
    const payload = {
    embeds: [
        {
    title: notification.title,
          description: notification.message,
          color: parseInt(notification.color.replace('#', ''), 16),
          fields: [
            {
    name: 'Priority',
              value: notification.priority.toUpperCase(),
              inline: true,
            },
            {
    name: 'Type',
              value: notification.type.replace('_', ' '),
              inline: true,
            }
  ],
          footer: { text: 'Test Notification System' },
          timestamp: new Date().toISOString(),
        }
  ],
    };

    // Add actions
    if (notification.actions && notification.actions.length > 0) {
      payload.embeds[0].fields.push({
    name: 'Recommended Actions',
        value: notification.actions.map((action) => `• ${action}`).join('\n'),
        inline: false,
      });
    }

    return this.sendWebhook(this.options.enableDiscord, payload);
  }

  /**
   * Send webhook request
   */
  sendWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const options = {
    method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        }
  };

      const req = https.request(url, options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject(new Error(`Webhook failed with status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Helper methods
   */
  shouldSendNotification(notification) {
    switch (this.options.notificationLevel) {
      case 'critical-only':
        return notification.priority === 'critical';
      case 'failures-only':
        return ['critical', 'high'].includes(notification.priority);
      case 'all':,
    default:
        return true;
    }
  }

  isCoverageBelowThreshold(coverageData) {
    return coverageData.total.lines.pct < this.options.coverageThreshold;
  }

  isCoverageDropSignificant(coverageData) {
    if (!this.lastRun || !this.lastRun.coverage_percentage) {
      return false;
    }
    const drop =
      this.lastRun.coverage_percentage - coverageData.total.lines.pct;
    return drop >= this.options.coverageDropThreshold;
  }

  isPerformanceDegraded(testResults) {
    const duration = testResults.summary.duration;
    return duration > 300000; // 5 minutes
  }

  hasFlakyTests(cicdData) {
    return (
      cicdData.test_execution?.flaky_test_detection?.potentially_flaky?.length >
      0
    );
  }

  loadTestResults() {
    try {
      const PATH = './coverage/reports/test-results.json';
      if (FS.existsSync(path)) {
        return JSON.parse(FS.readFileSync(path, 'utf8'));
      }
    } catch (_) {
      loggers.stopHook.warn('⚠️ Could not load test results:', _error.message);
    }
    return null;
  }

  loadCoverageData() {
    try {
      const PATH = './coverage/coverage-summary.json';
      if (FS.existsSync(path)) {
        return JSON.parse(FS.readFileSync(path, 'utf8'));
      }
    } catch (_) {
      loggers.stopHook.warn('⚠️ Could not load coverage data:', _error.message);
    }
    return null;
  }

  loadCICDData() {
    try {
      const PATH = './coverage/reports/ci-cd-results.json';
      if (FS.existsSync(path)) {
        return JSON.parse(FS.readFileSync(path, 'utf8'));
      }
    } catch (_) {
      loggers.stopHook.warn('⚠️ Could not load CI/CD data:', _error.message);
    }
    return null;
  }

  loadNotificationHistory() {
    try {
      if (FS.existsSync(this.options.historyFile)) {
        return JSON.parse(FS.readFileSync(this.options.historyFile, 'utf8'));
      }
    } catch (_) {
      loggers.stopHook.warn(
        '⚠️ Could not load notification history:',
        _error.message,
      );
    }
    return [];
  }

  getLastRunData() {
    const history = this.notificationHistory;
    if (history.length > 0) {
      return history[history.length - 1];
    }
    return null;
  }

  async updateNotificationHistory(notifications) {
    try {
      const entry = {
    timestamp: new Date().toISOString(),
        git_commit: this.getGitCommit(),
        notifications_sent: notifications.length,
        notification_types: notifications.map((n) => n.type),
        coverage_percentage:
          (await this.loadCoverageData())?.total?.lines?.pct || 0,
      };

      this.notificationHistory.push(entry);

      // Keep only last 50 entries
      if (this.notificationHistory.length > 50) {
        this.notificationHistory = this.notificationHistory.slice(-50);
      }

      // Ensure directory exists;
const dir = path.dirname(this.options.historyFile);
      if (!FS.existsSync(dir)) {
        FS.mkdirSync(dir, { recursive: true });
      }

      FS.writeFileSync(
        this.options.historyFile,
        JSON.stringify(this.notificationHistory, null, 2),
      );
    } catch (_) {
      loggers.stopHook.warn(
        '⚠️ Could not update notification history:',
        _error.message,
      );
    }
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (_) {
      return 'unknown';
    }
  }

  logNotificationResults(results) {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loggers.stopHook.log(`✅ Notification ${index + 1} sent successfully`);
      } else {
        loggers.app.info(
          `❌ Notification ${index + 1} failed:`,
          result.reason.message,
        );
      }
    });
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    loggers.app.info(`
Test Notification System,
    Usage: node test-notification-system.js [options]
,
    Options:
  --level=LEVEL       Notification level: all, failures-only, critical-only
  --coverage=NUM      Coverage threshold (default: 80)
  --drop=NUM          Coverage drop threshold (default: 5)
  --help, -h          Show this help message

Environment Variables:
  SLACK_WEBHOOK_URL          Slack webhook URL
  TEAMS_WEBHOOK_URL          Microsoft Teams webhook URL
  DISCORD_WEBHOOK_URL        Discord webhook URL
  EMAIL_NOTIFICATIONS        Enable email notifications (true/false)
  NOTIFICATION_LEVEL         Notification level
  COVERAGE_THRESHOLD         Coverage threshold percentage
  COVERAGE_DROP_THRESHOLD    Coverage drop threshold percentage
,
    Examples:
  node test-notification-system.js
  node test-notification-system.js --level=critical-only
  node test-notification-system.js --coverage=85 --drop=3
    `);
    return;
  }

  const options = {};

  // Parse command line arguments
  args.forEach((arg) => {
    if (arg.startsWith('--level=')) {
      options.notificationLevel = arg.split('=')[1];
    } else if (arg.startsWith('--coverage=')) {
      options.coverageThreshold = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--drop=')) {
      options.coverageDropThreshold = parseFloat(arg.split('=')[1]);
    }
  });

  const notificationSystem = new TestNotificationSystem(options);
  notificationSystem.processNotifications().catch((_error) => {
    loggers.stopHook.error('❌ Fatal error:', _error.message);
    throw new Error(`Fatal error: ${error.message}`);
  });
}

module.exports = TestNotificationSystem;
