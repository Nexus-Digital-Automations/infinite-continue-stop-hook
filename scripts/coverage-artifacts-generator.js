/**
 * Coverage Artifacts Generator for CI/CD Integration
 *
 * Generates and organizes coverage artifacts for CI/CD pipelines:
 * - Consolidates multiple coverage formats
 * - Creates deployment-ready artifacts
 * - Generates metadata for external systems
 * - Creates summary reports for dashboards
 *
 * @author CI/CD Integration Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const fs = require('fs');
const path = require('path');
const { execSync: _execSync } = require('child_process');

class CoverageArtifactsGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: './coverage/artifacts',
      reportsDir: './coverage/reports',
      sourceDir: './coverage',
      includeMetadata: true,
      compressArtifacts: false,
      generateBadges: true,
      createManifest: true,
      ...options,
    };

    this.artifacts = [];
    this.metadata = {
      generator: 'Coverage Artifacts Generator v1.0.0',
      timestamp: new Date().toISOString(),
      git: this.getGitInfo(),
      environment: this.getEnvironmentInfo(),
    };
  }

  /**
   * Main execution method
   */
  generate() {
    try {
      console.log('📦 Starting coverage artifacts generation...');

      this.ensureDirectories();
      this.processCoverageReports();
      this.generateSummaryArtifacts();
      this.generateDashboardArtifacts();
      this.generateCIArtifacts();

      if (this.options.generateBadges) {
        this.generateBadgeArtifacts();
      }

      if (this.options.createManifest) {
        this.createArtifactManifest();
      }

      this.generateReadme();

      console.log(`✅ Coverage artifacts generated successfully`);
      console.log(`📁 Artifacts directory: ${this.options.outputDir}`);
      console.log(`📋 Total artifacts: ${this.artifacts.length}`);
    } catch (error) {
      console.error('❌ Failed to generate coverage artifacts:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * Ensure output directories exist
   */
  ensureDirectories() {
    const dirs = [
      this.options.outputDir,
      this.options.reportsDir,
      path.join(this.options.outputDir, 'dashboard'),
      path.join(this.options.outputDir, 'ci'),
      path.join(this.options.outputDir, 'badges'),
      path.join(this.options.outputDir, 'summary'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Process and organize coverage reports
   */
  processCoverageReports() {
    console.log('📊 Processing coverage reports...');

    const coverageFiles = [
      { src: 'coverage-summary.json', type: 'summary', format: 'json' },
      { src: 'coverage-final.json', type: 'detailed', format: 'json' },
      { src: 'lcov.info', type: 'lcov', format: 'lcov' },
      { src: 'cobertura-coverage.xml', type: 'cobertura', format: 'xml' },
      { src: 'clover.xml', type: 'clover', format: 'xml' },
    ];

    for (const file of coverageFiles) {
      const srcPath = path.join(this.options.sourceDir, file.src);

      if (fs.existsSync(srcPath)) {
        // Copy to artifacts
        const destPath = path.join(this.options.outputDir, file.src);
        fs.copyFileSync(srcPath, destPath);

        this.artifacts.push({
          name: file.src,
          type: file.type,
          format: file.format,
          path: destPath,
          size: fs.statSync(destPath).size,
          description: this.getFileDescription(file.type),
        });

        console.log(`  ✓ Processed ${file.src}`);
      } else {
        console.log(`  ⚠ Missing ${file.src}`);
      }
    }

    // Process HTML reports
    const htmlReportDir = path.join(this.options.sourceDir, 'lcov-report');
    if (fs.existsSync(htmlReportDir)) {
      const htmlArtifactDir = path.join(this.options.outputDir, 'html-report');
      this.copyDirectory(htmlReportDir, htmlArtifactDir);

      this.artifacts.push({
        name: 'html-report',
        type: 'html',
        format: 'html',
        path: htmlArtifactDir,
        size: this.getDirectorySize(htmlArtifactDir),
        description: 'Interactive HTML coverage report',
      });

      console.log('  ✓ Processed HTML coverage report');
    }
  }

  /**
   * Generate summary artifacts for quick consumption
   */
  generateSummaryArtifacts() {
    console.log('📋 Generating summary artifacts...');

    const summaryPath = path.join(
      this.options.sourceDir,
      'coverage-summary.json'
    );

    if (!fs.existsSync(summaryPath)) {
      console.log('  ⚠ No coverage summary found, skipping summary artifacts');
      return;
    }

    const coverageData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const summary = coverageData.total;

    // Generate simplified summary
    const simpleSummary = {
      timestamp: this.metadata.timestamp,
      overall_coverage: {
        lines: Math.round(summary.lines.pct * 100) / 100,
        statements: Math.round(summary.statements.pct * 100) / 100,
        functions: Math.round(summary.functions.pct * 100) / 100,
        branches: Math.round(summary.branches.pct * 100) / 100,
      },
      thresholds_met: this.checkThresholds(summary),
      quality_score: this.calculateQualityScore(summary),
      git_info: this.metadata.git,
    };

    const summaryArtifactPath = path.join(
      this.options.outputDir,
      'summary',
      'coverage-simple.json'
    );
    fs.writeFileSync(
      summaryArtifactPath,
      JSON.stringify(simpleSummary, null, 2)
    );

    this.artifacts.push({
      name: 'coverage-simple.json',
      type: 'summary',
      format: 'json',
      path: summaryArtifactPath,
      size: fs.statSync(summaryArtifactPath).size,
      description: 'Simplified coverage summary for dashboards',
    });

    // Generate CSV summary for spreadsheet integration
    const csvSummary = this.generateCSVSummary(coverageData);
    const csvPath = path.join(
      this.options.outputDir,
      'summary',
      'coverage-summary.csv'
    );
    fs.writeFileSync(csvPath, csvSummary);

    this.artifacts.push({
      name: 'coverage-summary.csv',
      type: 'summary',
      format: 'csv',
      path: csvPath,
      size: fs.statSync(csvPath).size,
      description: 'Coverage summary in CSV format for spreadsheet tools',
    });

    console.log('  ✓ Generated summary artifacts');
  }

  /**
   * Generate dashboard-specific artifacts
   */
  generateDashboardArtifacts() {
    console.log('📊 Generating dashboard artifacts...');

    const summaryPath = path.join(
      this.options.sourceDir,
      'coverage-summary.json'
    );

    if (!fs.existsSync(summaryPath)) {
      console.log(
        '  ⚠ No coverage summary found, skipping dashboard artifacts'
      );
      return;
    }

    const coverageData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

    // Generate metrics for Grafana/similar tools
    const metricsData = {
      timestamp: Date.now(),
      metrics: {
        'coverage.lines.percentage': coverageData.total.lines.pct,
        'coverage.statements.percentage': coverageData.total.statements.pct,
        'coverage.functions.percentage': coverageData.total.functions.pct,
        'coverage.branches.percentage': coverageData.total.branches.pct,
        'coverage.lines.covered': coverageData.total.lines.covered,
        'coverage.lines.total': coverageData.total.lines.total,
        'coverage.statements.covered': coverageData.total.statements.covered,
        'coverage.statements.total': coverageData.total.statements.total,
        'coverage.functions.covered': coverageData.total.functions.covered,
        'coverage.functions.total': coverageData.total.functions.total,
        'coverage.branches.covered': coverageData.total.branches.covered,
        'coverage.branches.total': coverageData.total.branches.total,
      },
      tags: {
        project: this.getProjectName(),
        branch: this.metadata.git.branch || 'unknown',
        commit: this.metadata.git.commit || 'unknown',
      },
    };

    const metricsPath = path.join(
      this.options.outputDir,
      'dashboard',
      'metrics.json'
    );
    fs.writeFileSync(metricsPath, JSON.stringify(metricsData, null, 2));

    this.artifacts.push({
      name: 'metrics.json',
      type: 'dashboard',
      format: 'json',
      path: metricsPath,
      size: fs.statSync(metricsPath).size,
      description: 'Time-series metrics for dashboard integration',
    });

    // Generate InfluxDB line protocol format
    const influxData = this.generateInfluxLineProtocol(metricsData);
    const influxPath = path.join(
      this.options.outputDir,
      'dashboard',
      'coverage.influx'
    );
    fs.writeFileSync(influxPath, influxData);

    this.artifacts.push({
      name: 'coverage.influx',
      type: 'dashboard',
      format: 'influx',
      path: influxPath,
      size: fs.statSync(influxPath).size,
      description: 'InfluxDB line protocol format for time-series databases',
    });

    console.log('  ✓ Generated dashboard artifacts');
  }

  /**
   * Generate CI-specific artifacts
   */
  generateCIArtifacts() {
    console.log('🚀 Generating CI artifacts...');

    // Generate environment variables file for CI consumption
    const summaryPath = path.join(
      this.options.sourceDir,
      'coverage-summary.json'
    );

    if (fs.existsSync(summaryPath)) {
      const coverageData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      const summary = coverageData.total;

      const envVars = [
        `COVERAGE_LINES=${summary.lines.pct}`,
        `COVERAGE_STATEMENTS=${summary.statements.pct}`,
        `COVERAGE_FUNCTIONS=${summary.functions.pct}`,
        `COVERAGE_BRANCHES=${summary.branches.pct}`,
        `COVERAGE_LINES_COVERED=${summary.lines.covered}`,
        `COVERAGE_LINES_TOTAL=${summary.lines.total}`,
        `COVERAGE_THRESHOLD_MET=${this.checkThresholds(summary).overall}`,
        `COVERAGE_QUALITY_SCORE=${this.calculateQualityScore(summary)}`,
      ];

      const envPath = path.join(this.options.outputDir, 'ci', 'coverage.env');
      fs.writeFileSync(envPath, envVars.join('\n'));

      this.artifacts.push({
        name: 'coverage.env',
        type: 'ci',
        format: 'env',
        path: envPath,
        size: fs.statSync(envPath).size,
        description: 'Environment variables for CI pipeline consumption',
      });

      // Generate GitHub Actions outputs
      const githubOutputs = [
        `coverage-lines=${summary.lines.pct}`,
        `coverage-statements=${summary.statements.pct}`,
        `coverage-functions=${summary.functions.pct}`,
        `coverage-branches=${summary.branches.pct}`,
        `coverage-threshold-met=${this.checkThresholds(summary).overall}`,
        `coverage-quality=${this.getQualityRating(summary)}`,
      ];

      const githubPath = path.join(
        this.options.outputDir,
        'ci',
        'github-outputs.txt'
      );
      fs.writeFileSync(githubPath, githubOutputs.join('\n'));

      this.artifacts.push({
        name: 'github-outputs.txt',
        type: 'ci',
        format: 'text',
        path: githubPath,
        size: fs.statSync(githubPath).size,
        description: 'GitHub Actions step outputs',
      });

      console.log('  ✓ Generated CI artifacts');
    }
  }

  /**
   * Generate badge artifacts
   */
  generateBadgeArtifacts() {
    console.log('🏷️ Generating badge artifacts...');

    const summaryPath = path.join(
      this.options.sourceDir,
      'coverage-summary.json'
    );

    if (!fs.existsSync(summaryPath)) {
      console.log('  ⚠ No coverage summary found, skipping badge artifacts');
      return;
    }

    const coverageData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const summary = coverageData.total;

    // Generate badge data
    const badges = {
      lines: this.generateBadgeData('lines', summary.lines.pct),
      statements: this.generateBadgeData('statements', summary.statements.pct),
      functions: this.generateBadgeData('functions', summary.functions.pct),
      branches: this.generateBadgeData('branches', summary.branches.pct),
      overall: this.generateBadgeData(
        'coverage',
        this.calculateOverallCoverage(summary)
      ),
    };

    const badgesPath = path.join(
      this.options.outputDir,
      'badges',
      'badges.json'
    );
    fs.writeFileSync(badgesPath, JSON.stringify(badges, null, 2));

    this.artifacts.push({
      name: 'badges.json',
      type: 'badges',
      format: 'json',
      path: badgesPath,
      size: fs.statSync(badgesPath).size,
      description: 'Badge configuration data for shields.io integration',
    });

    // Generate individual badge URLs
    Object.entries(badges).forEach(([type, badge]) => {
      const urlPath = path.join(
        this.options.outputDir,
        'badges',
        `${type}-badge.url`
      );
      fs.writeFileSync(urlPath, badge.url);

      this.artifacts.push({
        name: `${type}-badge.url`,
        type: 'badges',
        format: 'url',
        path: urlPath,
        size: fs.statSync(urlPath).size,
        description: `${type} coverage badge URL`,
      });
    });

    console.log('  ✓ Generated badge artifacts');
  }

  /**
   * Create artifact manifest
   */
  createArtifactManifest() {
    console.log('📋 Creating artifact manifest...');

    const manifest = {
      metadata: this.metadata,
      summary: {
        total_artifacts: this.artifacts.length,
        total_size: this.artifacts.reduce(
          (sum, artifact) => sum + artifact.size,
          0
        ),
        artifact_types: [...new Set(this.artifacts.map((a) => a.type))],
        formats: [...new Set(this.artifacts.map((a) => a.format))],
      },
      artifacts: this.artifacts.map((artifact) => ({
        ...artifact,
        path: path.relative(process.cwd(), artifact.path), // Make paths relative
      })),
    };

    const manifestPath = path.join(this.options.outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('  ✓ Created artifact manifest');
  }

  /**
   * Generate README for artifacts
   */
  generateReadme() {
    const readme = `# Coverage Artifacts

Generated on: ${this.metadata.timestamp}
Generator: ${this.metadata.generator}

## Summary

- Total artifacts: ${this.artifacts.length}
- Total size: ${this.formatBytes(this.artifacts.reduce((sum, a) => sum + a.size, 0))}
- Git commit: ${this.metadata.git.commit || 'unknown'}
- Git branch: ${this.metadata.git.branch || 'unknown'}

## Artifact Types

${this.generateArtifactTypeTable()}

## Usage

### CI/CD Integration
- Use \`ci/coverage.env\` to set environment variables in your pipeline
- Use \`ci/github-outputs.txt\` for GitHub Actions step outputs

### Dashboard Integration
- Use \`dashboard/metrics.json\` for custom dashboard integration
- Use \`dashboard/coverage.influx\` for InfluxDB/Grafana

### Badge Integration
- Use files in \`badges/\` directory for README badges
- Badge URLs are pre-generated for shields.io

### Reports
- View \`html-report/index.html\` for interactive coverage report
- Use \`coverage-summary.json\` for programmatic access
- Use \`lcov.info\` for IDE integration

## Files

${this.generateFileList()}

---
Generated by Coverage Artifacts Generator v1.0.0
`;

    const readmePath = path.join(this.options.outputDir, 'README.md');
    fs.writeFileSync(readmePath, readme);

    console.log('  ✓ Generated README');
  }

  /**
   * Utility methods
   */
  getGitInfo() {
    try {
      const { execSync } = require('child_process');
      return {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', {
          encoding: 'utf8',
        }).trim(),
        author: execSync('git log -1 --pretty=format:"%an"', {
          encoding: 'utf8',
        }).trim(),
        message: execSync('git log -1 --pretty=format:"%s"', {
          encoding: 'utf8',
        }).trim(),
      };
    } catch {
      return {
        commit: 'unknown',
        branch: 'unknown',
        author: 'unknown',
        message: 'unknown',
      };
    }
  }

  getEnvironmentInfo() {
    return {
      ci: process.env.CI === 'true',
      node_version: process.version,
      platform: process.platform,
      provider: this.detectCIProvider(),
    };
  }

  detectCIProvider() {
    if (process.env.GITHUB_ACTIONS) {
      return 'github-actions';
    }
    if (process.env.GITLAB_CI) {
      return 'gitlab-ci';
    }
    if (process.env.JENKINS_URL) {
      return 'jenkins';
    }
    return 'unknown';
  }

  getProjectName() {
    try {
      const packagePath = path.resolve('package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return pkg.name || 'unknown';
      }
    } catch {
      // Ignore
    }
    return 'unknown';
  }

  checkThresholds(summary) {
    const thresholds = {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 75,
    };
    return {
      lines: summary.lines.pct >= thresholds.lines,
      statements: summary.statements.pct >= thresholds.statements,
      functions: summary.functions.pct >= thresholds.functions,
      branches: summary.branches.pct >= thresholds.branches,
      overall:
        summary.lines.pct >= thresholds.lines &&
        summary.statements.pct >= thresholds.statements &&
        summary.functions.pct >= thresholds.functions &&
        summary.branches.pct >= thresholds.branches,
    };
  }

  calculateQualityScore(summary) {
    return Math.round(
      (summary.lines.pct +
        summary.statements.pct +
        summary.functions.pct +
        summary.branches.pct) /
        4
    );
  }

  calculateOverallCoverage(summary) {
    return Math.round(
      (summary.lines.pct +
        summary.statements.pct +
        summary.functions.pct +
        summary.branches.pct) /
        4
    );
  }

  getQualityRating(summary) {
    const score = this.calculateQualityScore(summary);
    if (score >= 90) {
      return 'excellent';
    }
    if (score >= 80) {
      return 'good';
    }
    if (score >= 70) {
      return 'fair';
    }
    return 'poor';
  }

  generateBadgeData(label, percentage) {
    const color =
      percentage >= 90
        ? 'brightgreen'
        : percentage >= 80
          ? 'green'
          : percentage >= 70
            ? 'yellowgreen'
            : percentage >= 60
              ? 'yellow'
              : percentage >= 50
                ? 'orange'
                : 'red';

    return {
      label,
      message: `${percentage.toFixed(1)}%`,
      color,
      url: `https://img.shields.io/badge/${label}-${percentage.toFixed(1)}%25-${color}`,
    };
  }

  generateCSVSummary(coverageData) {
    const headers = [
      'file',
      'lines_pct',
      'statements_pct',
      'functions_pct',
      'branches_pct',
    ];
    const rows = [headers.join(',')];

    Object.entries(coverageData).forEach(([file, data]) => {
      if (file !== 'total' && data.lines) {
        rows.push(
          [
            file,
            data.lines.pct,
            data.statements.pct,
            data.functions.pct,
            data.branches.pct,
          ].join(',')
        );
      }
    });

    return rows.join('\n');
  }

  generateInfluxLineProtocol(metricsData) {
    const lines = [];
    const timestamp = metricsData.timestamp * 1000000; // Convert to nanoseconds

    Object.entries(metricsData.metrics).forEach(([metric, value]) => {
      const tags = Object.entries(metricsData.tags)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');

      lines.push(`${metric},${tags} value=${value} ${timestamp}`);
    });

    return lines.join('\n');
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);

    files.forEach((file) => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);

      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  getDirectorySize(dirPath) {
    let size = 0;

    try {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          size += this.getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      });
    } catch {
      // Directory access error
    }

    return size;
  }

  getFileDescription(type) {
    const descriptions = {
      summary: 'Coverage summary in JSON format',
      detailed: 'Detailed coverage data in JSON format',
      lcov: 'LCOV format for IDE and tool integration',
      cobertura: 'Cobertura XML format for Jenkins and other tools',
      clover: 'Clover XML format for Atlassian tools',
      html: 'Interactive HTML coverage report',
    };

    return descriptions[type] || 'Coverage data';
  }

  formatBytes(bytes) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateArtifactTypeTable() {
    const typeGroups = {};

    this.artifacts.forEach((artifact) => {
      if (!typeGroups[artifact.type]) {
        typeGroups[artifact.type] = [];
      }
      typeGroups[artifact.type].push(artifact);
    });

    let table = '| Type | Count | Total Size | Description |\n';
    table += '|------|-------|------------|-------------|\n';

    Object.entries(typeGroups).forEach(([type, artifacts]) => {
      const count = artifacts.length;
      const totalSize = artifacts.reduce((sum, a) => sum + a.size, 0);
      const description = this.getTypeDescription(type);

      table += `| ${type} | ${count} | ${this.formatBytes(totalSize)} | ${description} |\n`;
    });

    return table;
  }

  getTypeDescription(type) {
    const descriptions = {
      summary: 'Quick access summary files',
      detailed: 'Complete coverage data',
      lcov: 'LCOV format files',
      cobertura: 'Cobertura XML files',
      clover: 'Clover XML files',
      html: 'Interactive HTML reports',
      dashboard: 'Dashboard integration files',
      ci: 'CI/CD pipeline files',
      badges: 'Badge generation files',
    };

    return descriptions[type] || 'Coverage files';
  }

  generateFileList() {
    return this.artifacts
      .map(
        (artifact) =>
          `- \`${path.relative(this.options.outputDir, artifact.path)}\` - ${artifact.description}`
      )
      .join('\n');
  }
}

// CLI interface
if (require.main === module) {
  const generator = new CoverageArtifactsGenerator();
  try {
    generator.generate();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    throw error;
  }
}

module.exports = CoverageArtifactsGenerator;
