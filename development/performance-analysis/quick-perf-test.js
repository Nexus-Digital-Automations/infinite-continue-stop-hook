/**
 * Quick Performance Test for Critical TaskManager API Endpoints
 * Focused on measuring response times for core operations
 */

const { execSync } = require('child_process');
const fs = require('fs');

class QuickPerfTest {
  constructor() {
    this.apiPath = '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
    this.results = {};
  }

  measureEndpoint(command, args = [], iterations = 3) {
    console.log(`Testing ${command}...`);
    const times = [];
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = process.hrtime.bigint();
        const cmd = `timeout 10s node ${this.apiPath} ${command} ${args.join(' ')}`;
        const result = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
        const endTime = process.hrtime.bigint();

        const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
        times.push(responseTime);
        successCount++;

        // Check if result contains success indicator
        if (result.includes('"success": false') || result.includes('error')) {
          errors.push(`Iteration ${i + 1}: API returned error`);
        }
      } catch (error) {
        errors.push(`Iteration ${i + 1}: ${error.message}`);
        times.push(-1); // Mark as failed
      }
    }

    const validTimes = times.filter(t => t > 0);
    const avgTime = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 0;

    return {
      command,
      iterations,
      successCount,
      successRate: (successCount / iterations) * 100,
      averageResponseTime: avgTime,
      minResponseTime: validTimes.length > 0 ? Math.min(...validTimes) : 0,
      maxResponseTime: validTimes.length > 0 ? Math.max(...validTimes) : 0,
      errors: errors,
      rawTimes: times,
    };
  }

  runCriticalPathTest() {
    console.log('🚀 Running Critical Path Performance Test\n');

    // Test core endpoints individually
    const endpoints = [
      { cmd: 'init', args: [], description: 'Agent Initialization' },
      { cmd: 'list', args: [], description: 'List Tasks' },
      { cmd: 'list-agents', args: [], description: 'List Agents' },
      { cmd: 'status', args: [], description: 'Agent Status' },
      { cmd: 'stats', args: [], description: 'System Statistics' },
      { cmd: 'rag-health', args: [], description: 'RAG System Health' },
      { cmd: 'usage-analytics', args: [], description: 'Usage Analytics' },
      { cmd: 'guide', args: [], description: 'API Guide' },
    ];

    for (const endpoint of endpoints) {
      console.log(`\n📊 Testing: ${endpoint.description}`);
      this.results[endpoint.cmd] = this.measureEndpoint(endpoint.cmd, endpoint.args);

      const result = this.results[endpoint.cmd];
      console.log(`  ✅ Success Rate: ${result.successRate.toFixed(1)}%`);
      console.log(`  ⏱️  Avg Response: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`  📈 Range: ${result.minResponseTime.toFixed(2)} - ${result.maxResponseTime.toFixed(2)}ms`);

      if (result.errors.length > 0) {
        console.log(`  ❌ Errors: ${result.errors.length}`);
      }
    }

    return this.results;
  }

  generateQuickReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints: Object.keys(this.results).length,
        overallSuccessRate: 0,
        averageResponseTime: 0,
        fastestEndpoint: null,
        slowestEndpoint: null,
        errorProneEndpoints: [],
      },
      detailed: this.results,
      recommendations: [],
    };

    // Calculate summary metrics
    const validResults = Object.values(this.results).filter(r => r.successRate > 0);

    if (validResults.length > 0) {
      report.summary.overallSuccessRate = validResults.reduce((sum, r) => sum + r.successRate, 0) / validResults.length;
      report.summary.averageResponseTime = validResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / validResults.length;

      // Find fastest and slowest
      const sorted = validResults.sort((a, b) => a.averageResponseTime - b.averageResponseTime);
      report.summary.fastestEndpoint = { command: sorted[0].command, time: sorted[0].averageResponseTime };
      report.summary.slowestEndpoint = { command: sorted[sorted.length - 1].command, time: sorted[sorted.length - 1].averageResponseTime };

      // Find error-prone endpoints
      report.summary.errorProneEndpoints = Object.values(this.results)
        .filter(r => r.successRate < 100)
        .map(r => ({ command: r.command, successRate: r.successRate }));
    }

    // Generate recommendations
    if (report.summary.slowestEndpoint && report.summary.slowestEndpoint.time > 1000) {
      report.recommendations.push({
        priority: 'High',
        category: 'Performance',
        issue: `Slow response time for ${report.summary.slowestEndpoint.command}`,
        recommendation: 'Investigate bottlenecks in slowest endpoint',
      });
    }

    if (report.summary.errorProneEndpoints.length > 0) {
      report.recommendations.push({
        priority: 'High',
        category: 'Reliability',
        issue: 'Endpoints with reliability issues detected',
        recommendation: 'Improve error handling and validation',
      });
    }

    if (report.summary.averageResponseTime > 500) {
      report.recommendations.push({
        priority: 'Medium',
        category: 'Performance',
        issue: 'High average response time across endpoints',
        recommendation: 'Implement caching and optimize critical path',
      });
    }

    return report;
  }

  saveReport(report) {
    const outputDir = '/Users/jeremyparker/infinite-continue-stop-hook/development/performance-analysis';
    const outputFile = `${outputDir}/quick-perf-report-${Date.now()}.json`;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    return outputFile;
  }
}

async function main() {
  const tester = new QuickPerfTest();

  try {
    tester.runCriticalPathTest();
    const report = tester.generateQuickReport();
    const outputFile = tester.saveReport(report);

    console.log('\n\n📊 QUICK PERFORMANCE TEST RESULTS');
    console.log('===================================');
    console.log(`Total Endpoints Tested: ${report.summary.totalEndpoints}`);
    console.log(`Overall Success Rate: ${report.summary.overallSuccessRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${report.summary.averageResponseTime.toFixed(2)}ms`);

    if (report.summary.fastestEndpoint) {
      console.log(`Fastest Endpoint: ${report.summary.fastestEndpoint.command} (${report.summary.fastestEndpoint.time.toFixed(2)}ms)`);
    }

    if (report.summary.slowestEndpoint) {
      console.log(`Slowest Endpoint: ${report.summary.slowestEndpoint.command} (${report.summary.slowestEndpoint.time.toFixed(2)}ms)`);
    }

    if (report.recommendations.length > 0) {
      console.log('\n🔧 Key Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.priority}] ${rec.recommendation}`);
      });
    }

    console.log(`\n📄 Full report saved to: ${outputFile}`);

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  main();
}

module.exports = QuickPerfTest;
