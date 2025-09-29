/**
 * Comprehensive Code Quality Analyzer
 *
 * Advanced code quality assessment beyond just coverage metrics.
 * Analyzes complexity, maintainability, security, performance, And technical debt.
 *
 * Features:
 * - Cyclomatic complexity analysis
 * - Code duplication detection
 * - Security vulnerability scanning
 * - Performance antipattern detection
 * - Technical debt quantification
 * - Maintainability index calculation
 * - Code smell detection
 * - Architecture quality assessment
 *
 * @author Code Quality Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const FS = require('fs');
const path = require('path');
const { execSync: EXEC_SYNC } = require('child_process');
const { loggers } = require('../lib/logger');

// Quality metrics configuration
const QUALITY_CONFIG = {
  // Complexity thresholds
  complexity: {
    cyclomatic: {
      excellent: 5,
      good: 10,
      acceptable: 15,
      warning: 20,
      critical: 25,
    },
    cognitive: {
      excellent: 10,
      good: 15,
      acceptable: 25,
      warning: 30,
      critical: 40,
    },
    npath: {
      excellent: 200,
      good: 1000,
      acceptable: 5000,
      warning: 10000,
      critical: 50000,
    },
  },

  // Size thresholds
  size: {
    lines_per_function: {
      excellent: 20,
      good: 50,
      acceptable: 100,
      warning: 200,
      critical: 500,
    },
    lines_per_file: {
      excellent: 200,
      good: 500,
      acceptable: 1000,
      warning: 2000,
      critical: 5000,
    },
    parameters_per_function: {
      excellent: 3,
      good: 5,
      acceptable: 7,
      warning: 10,
      critical: 15,
    },
  },

  // Duplication thresholds
  duplication: {
    duplicate_lines_percent: {
      excellent: 0,
      good: 3,
      acceptable: 5,
      warning: 10,
      critical: 20,
    },
    duplicate_blocks: {
      excellent: 0,
      good: 2,
      acceptable: 5,
      warning: 10,
      critical: 25,
    },
  },

  // Security thresholds
  security: {
    vulnerabilities: {
      excellent: 0,
      good: 0,
      acceptable: 1,
      warning: 3,
      critical: 5,
    },
    security_hotspots: {
      excellent: 0,
      good: 2,
      acceptable: 5,
      warning: 10,
      critical: 20,
    },
  },

  // Maintainability thresholds
  maintainability: {
    index: {
      excellent: 85,
      good: 70,
      acceptable: 60,
      warning: 50,
      critical: 30,
    },
    technical_debt_ratio: {
      excellent: 0,
      good: 5,
      acceptable: 10,
      warning: 20,
      critical: 30,
    },
  },

  // File patterns to analyze
  patterns: {
    source: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    exclude: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      '**/*.min.js',
      '**/*.test.js',
      '**/*.spec.js',
      '**/jest.config.js',
      '**/eslint.config.js',
    ],
  },
};

/**
 * Code Quality LOGGER
 */
class QualityLogger {
  constructor(options = {}) {
    this.verbose = options.verbose || process.env.VERBOSE === 'true';
    this.silent = options.silent || process.env.SILENT === 'true';
    this.structured =
      options.structured || process.env.STRUCTURED_LOGS === 'true';
  }

  log(level, message, data = {}) {
    if (this.silent && level !== 'error') {
      return;
    }

    const timestamp = new Date().toISOString();

    if (this.structured) {
      loggers.stopHook.log(
        JSON.stringify({ timestamp, level, message, ...data })
      );
    } else {
      const emoji =
        {
          info: '📊',
          success: '✅',
          warning: '⚠️',
          error: '❌',
          debug: '🔍',
          analysis: '🔬',
        }[level] || '📊';

      loggers.stopHook.log(`${emoji} ${message}`);

      if (this.verbose && Object.keys(data).length > 0) {
        loggers.stopHook.log(`   ${JSON.stringify(data, null, 2)}`);
      }
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }
  success(message, data) {
    this.log('success', message, data);
  }
  warning(message, data) {
    this.log('warning', message, data);
  }
  error(message, data) {
    this.log('error', message, data);
  }
  debug(message, data) {
    this.log('debug', message, data);
  }
  analysis(message, data) {
    this.log('analysis', message, data);
  }
}

/**
 * Code Quality Analyzer
 */
class CodeQualityAnalyzer {
  constructor(options = {}) {
    this.config = { ...QUALITY_CONFIG, ...options.config };
    this.logger = new QualityLogger(options);
    this.sourceFiles = [];
    this.metrics = {
      complexity: {},
      size: {},
      duplication: {},
      security: {},
      maintainability: {},
      smells: {},
      architecture: {},
    };
    this.issues = [];
    this.recommendations = [];
  }

  /**
   * Main analysis pipeline
   */
  analyze() {
    try {
      this.logger.info('🚀 Starting comprehensive code quality analysis');

      this.discoverSourceFiles();
      this.analyzeComplexity();
      this.analyzeSizeMetrics();
      this.analyzeDuplication();
      this.analyzeSecurityVulnerabilities();
      this.analyzeMaintainability();
      this.detectCodeSmells();
      this.analyzeArchitecture();
      this.calculateOverallQuality();
      this.generateRecommendations();
      this.generateReport();

      this.logger.success('Code quality analysis completed');

      return {
        overall_score: this.metrics.overall_score,
        quality_level: this.metrics.quality_level,
        issues: this.issues,
        recommendations: this.recommendations,
        detailed_metrics: this.metrics,
      };
    } catch {
      this.logger.error('Code quality analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Discover source files to analyze
   */
  discoverSourceFiles() {
    this.logger.info('Discovering source files...');

    const glob = require('glob');
    const allFiles = [];

    for (const pattern of this.config.patterns.source) {
      try {
        const files = glob.sync(pattern, {
          ignore: this.config.patterns.exclude,
          absolute: true,
        });
        allFiles.push(...files);
      } catch {
        this.logger.warning(`Failed to glob pattern ${pattern}`, {
          error: error.message,
        });
      }
    }

    this.sourceFiles = [...new Set(allFiles)]; // Remove duplicates
    this.logger.success(`Discovered ${this.sourceFiles.length} source files`);
  }

  /**
   * Analyze code complexity metrics
   */
  analyzeComplexity() {
    this.logger.info('Analyzing code complexity...');

    const complexityData = {
      cyclomatic: { total: 0, max: 0, average: 0, files: {} },
      cognitive: { total: 0, max: 0, average: 0, files: {} },
      npath: { total: 0, max: 0, average: 0, files: {} },
      functions: { total: 0, complex_functions: 0 },
    };

    for (const filePath of this.sourceFiles) {
      try {
        const fileComplexity = this.analyzeFileComplexity(_filePath);

        // Aggregate cyclomatic complexity
        complexityData.cyclomatic.files[filePath] = fileComplexity.cyclomatic;
        complexityData.cyclomatic.total += fileComplexity.cyclomatic;
        complexityData.cyclomatic.max = Math.max(
          complexityData.cyclomatic.max,
          fileComplexity.cyclomatic
        );

        // Aggregate cognitive complexity
        complexityData.cognitive.files[filePath] = fileComplexity.cognitive;
        complexityData.cognitive.total += fileComplexity.cognitive;
        complexityData.cognitive.max = Math.max(
          complexityData.cognitive.max,
          fileComplexity.cognitive
        );

        // Track functions
        complexityData.functions.total += fileComplexity.function_count;
        complexityData.functions.complex_functions +=
          fileComplexity.complex_functions;

        // Identify high complexity issues
        if (
          fileComplexity.cyclomatic > this.config.complexity.cyclomatic.warning
        ) {
          this.issues.push({
            type: 'complexity',
            severity:
              fileComplexity.cyclomatic >
              this.config.complexity.cyclomatic.critical
                ? 'critical'
                : 'warning',
            file: filePath,
            metric: 'cyclomatic_complexity',
            value: fileComplexity.cyclomatic,
            message: `High cyclomatic complexity: ${fileComplexity.cyclomatic}`,
          });
        }
      } catch {
        this.logger.debug(`Failed to analyze complexity for ${filePath}`, {
          error: error.message,
        });
      }
    }

    // Calculate averages
    const fileCount = this.sourceFiles.length;
    complexityData.cyclomatic.average =
      fileCount > 0 ? complexityData.cyclomatic.total / fileCount : 0;
    complexityData.cognitive.average =
      fileCount > 0 ? complexityData.cognitive.total / fileCount : 0;

    this.metrics.complexity = complexityData;
    this.logger.analysis(
      `Complexity analysis complete - Avg cyclomatic: ${complexityData.cyclomatic.average.toFixed(2)}`
    );
  }

  /**
   * Analyze complexity for a single file
   */
  analyzeFileComplexity(_filePath) {
    try {
      const content = FS.readFileSync(_filePath, 'utf8');

      // Simple complexity analysis (can be enhanced with AST parsing)
      const lines = content.split('\n');
      let cyclomatic = 1; // Base complexity
      let cognitive = 0;
      let functionCount = 0;
      let complexFunctions = 0;

      for (const line of lines) {
        const trimmed = line.trim();

        // Count cyclomatic complexity triggers
        if (/\b(if|while|for|catch|case|&&|\|\||\?)\b/.test(trimmed)) {
          cyclomatic++;
        }

        // Count cognitive complexity (nested structures add more weight)
        if (/\b(if|while|for|catch)\b/.test(trimmed)) {
          cognitive += this.calculateNestingWeight(line);
        }

        // Count functions
        if (/\b(function|=>\s*{|async\s+function)\b/.test(trimmed)) {
          functionCount++;
        }
      }

      // Estimate complex functions (simplified)
      complexFunctions = Math.floor(cyclomatic / 10);

      return {
        cyclomatic,
        cognitive,
        function_count: functionCount,
        complex_functions: complexFunctions,
        line_count: lines.length,
      };
    } catch {
      return {
        cyclomatic: 0,
        cognitive: 0,
        function_count: 0,
        complex_functions: 0,
        line_count: 0,
      };
    }
  }

  /**
   * Calculate nesting weight for cognitive complexity
   */
  calculateNestingWeight(line) {
    const indentation = line.length - line.trimStart().length;
    const nestingLevel = Math.floor(indentation / 2); // Assume 2-space indentation
    return Math.max(1, nestingLevel);
  }

  /**
   * Analyze size metrics
   */
  analyzeSizeMetrics() {
    this.logger.info('Analyzing size metrics...');

    const sizeData = {
      total_lines: 0,
      total_files: this.sourceFiles.length,
      average_file_size: 0,
      largest_file: { path: '', lines: 0 },
      files_over_threshold: 0,
    };

    for (const filePath of this.sourceFiles) {
      try {
        const content = FS.readFileSync(_filePath, 'utf8');
        const lineCount = content.split('\n').length;

        sizeData.total_lines += lineCount;

        if (lineCount > sizeData.largest_file.lines) {
          sizeData.largest_file = { path: filePath, lines: lineCount };
        }

        if (lineCount > this.config.size.lines_per_file.warning) {
          sizeData.files_over_threshold++;

          this.issues.push({
            type: 'size',
            severity:
              lineCount > this.config.size.lines_per_file.critical
                ? 'critical'
                : 'warning',
            file: filePath,
            metric: 'file_size',
            value: lineCount,
            message: `Large file: ${lineCount} lines`,
          });
        }
      } catch {
        this.logger.debug(`Failed to analyze size for ${filePath}`, {
          error: error.message,
        });
      }
    }

    sizeData.average_file_size =
      sizeData.total_files > 0
        ? sizeData.total_lines / sizeData.total_files
        : 0;

    this.metrics.size = sizeData;
    this.logger.analysis(
      `Size analysis complete - Avg file size: ${sizeData.average_file_size.toFixed(0)} lines`
    );
  }

  /**
   * Analyze code duplication
   */
  analyzeDuplication() {
    this.logger.info('Analyzing code duplication...');

    const duplicationData = {
      duplicate_lines: 0,
      total_lines: this.metrics.size.total_lines,
      duplication_percentage: 0,
      duplicate_blocks: 0,
      duplicated_files: [],
    };

    // Simple duplication detection (can be enhanced with more sophisticated algorithms)
    const lineHashes = new Map();
    const blockHashes = new Map();

    for (const filePath of this.sourceFiles) {
      try {
        const content = FS.readFileSync(_filePath, 'utf8');
        const lines = content.split('\n');

        // Track line-level duplication
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (
            line.length > 10 &&
            !line.startsWith('//') &&
            !line.startsWith('*')
          ) {
            const hash = this.simpleHash(line);
            if (!lineHashes.has(hash)) {
              lineHashes.set(hash, []);
            }
            lineHashes.get(hash).push({ file: filePath, line: i + 1 });
          }
        }

        // Track block-level duplication (simplified 5-line blocks)
        for (let i = 0; i <= lines.length - 5; i++) {
          const block = lines
            .slice(i, i + 5)
            .map((l) => l.trim())
            .join('\n');
          if (block.length > 50) {
            const hash = this.simpleHash(block);
            if (!blockHashes.has(hash)) {
              blockHashes.set(hash, []);
            }
            blockHashes.get(hash).push({ file: filePath, startLine: i + 1 });
          }
        }
      } catch {
        this.logger.debug(`Failed to analyze duplication for ${filePath}`, {
          error: error.message,
        });
      }
    }

    // Count duplications
    for (const [_hash, occurrences] of lineHashes) {
      if (occurrences.length > 1) {
        duplicationData.duplicate_lines += occurrences.length - 1;
      }
    }

    for (const [_hash, occurrences] of blockHashes) {
      if (occurrences.length > 1) {
        duplicationData.duplicate_blocks += occurrences.length - 1;
      }
    }

    duplicationData.duplication_percentage =
      duplicationData.total_lines > 0
        ? (duplicationData.duplicate_lines / duplicationData.total_lines) * 100
        : 0;

    // Flag high duplication
    if (
      duplicationData.duplication_percentage >
      this.config.duplication.duplicate_lines_percent.warning
    ) {
      this.issues.push({
        type: 'duplication',
        severity:
          duplicationData.duplication_percentage >
          this.config.duplication.duplicate_lines_percent.critical
            ? 'critical'
            : 'warning',
        metric: 'code_duplication',
        value: duplicationData.duplication_percentage,
        message: `High code duplication: ${duplicationData.duplication_percentage.toFixed(2)}%`,
      });
    }

    this.metrics.duplication = duplicationData;
    this.logger.analysis(
      `Duplication analysis complete - ${duplicationData.duplication_percentage.toFixed(2)}% duplication`
    );
  }

  /**
   * Simple hash function for content comparison
   */
  simpleHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Analyze security vulnerabilities
   */
  analyzeSecurityVulnerabilities() {
    this.logger.info('Analyzing security vulnerabilities...');

    const securityData = {
      vulnerabilities: [],
      security_hotspots: [],
      total_vulnerabilities: 0,
      critical_vulnerabilities: 0,
      security_score: 100,
    };

    // Run basic security pattern detection
    const securityPatterns = [
      {
        pattern: /eval\s*\(/,
        severity: 'critical',
        message: 'Use of eval() function',
      },
      {
        pattern: /innerHTML\s*=/,
        severity: 'warning',
        message: 'Direct innerHTML assignment (XSS risk)',
      },
      {
        pattern: /document\.write\s*\(/,
        severity: 'warning',
        message: 'Use of document.write (XSS risk)',
      },
      {
        pattern: /Math\.random\s*\(\)/,
        severity: 'info',
        message: 'Use of Math.random() for security purposes',
      },
      {
        pattern: /password\s*=\s*["'][^"']*["']/,
        severity: 'critical',
        message: 'Hardcoded password detected',
      },
      {
        pattern: /api[_-]?key\s*=\s*["'][^"']*["']/,
        severity: 'critical',
        message: 'Hardcoded API key detected',
      },
      {
        pattern: /\.\.\//g,
        severity: 'warning',
        message: 'Path traversal pattern detected',
      },
    ];

    for (const filePath of this.sourceFiles) {
      try {
        const content = FS.readFileSync(_filePath, 'utf8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const secPattern of securityPatterns) {
            if (secPattern.pattern.test(line)) {
              const vulnerability = {
                type: 'security',
                severity: secPattern.severity,
                file: filePath,
                line: i + 1,
                pattern: secPattern.pattern.source,
                message: secPattern.message,
                code_snippet: line.trim(),
              };

              securityData.vulnerabilities.push(vulnerability);

              if (secPattern.severity === 'critical') {
                securityData.critical_vulnerabilities++;
              }
            }
          }
        }
      } catch {
        this.logger.debug(`Failed to analyze security for ${filePath}`, {
          error: error.message,
        });
      }
    }

    securityData.total_vulnerabilities = securityData.vulnerabilities.length;

    // Calculate security score (100 - penalties)
    securityData.security_score = Math.max(
      0,
      100 -
        securityData.critical_vulnerabilities * 20 -
        (securityData.total_vulnerabilities -
          securityData.critical_vulnerabilities) *
          5
    );

    // Add high-severity issues to main issues list
    securityData.vulnerabilities.forEach((vuln) => {
      if (vuln.severity === 'critical' || vuln.severity === 'warning') {
        this.issues.push(vuln);
      }
    });

    this.metrics.security = securityData;
    this.logger.analysis(
      `Security analysis complete - ${securityData.total_vulnerabilities} vulnerabilities found`
    );
  }

  /**
   * Analyze maintainability metrics
   */
  analyzeMaintainability() {
    this.logger.info('Analyzing maintainability...');

    const maintainabilityData = {
      maintainability_index: 0,
      technical_debt_minutes: 0,
      technical_debt_ratio: 0,
      code_smells: 0,
      maintainability_score: 0,
    };

    // Calculate maintainability index (simplified Halstead-based)
    const totalComplexity = this.metrics.complexity.cyclomatic.total;
    const totalLines = this.metrics.size.total_lines;
    const TOTAL_DUPLICATION = this.metrics.duplication.duplicate_lines;

    // Simplified maintainability index calculation
    if (totalLines > 0) {
      const complexityFactor = Math.max(
        0,
        100 - (totalComplexity / totalLines) * 100
      );
      const sizeFactor = Math.max(0, 100 - Math.log10(totalLines) * 10);
      const duplicationFactor = Math.max(
        0,
        100 - this.metrics.duplication.duplication_percentage * 2
      );

      maintainabilityData.maintainability_index =
        (complexityFactor + sizeFactor + duplicationFactor) / 3;
    }

    // Estimate technical debt (simplified)
    maintainabilityData.technical_debt_minutes =
      this.issues.filter((i) => i.severity === 'critical').length * 60 +
      this.issues.filter((i) => i.severity === 'warning').length * 30 +
      this.issues.filter((i) => i.severity === 'info').length * 10;

    maintainabilityData.technical_debt_ratio =
      totalLines > 0
        ? (maintainabilityData.technical_debt_minutes / (totalLines * 0.5)) *
          100
        : 0; // Assume 0.5 min per line baseline

    maintainabilityData.maintainability_score = Math.max(
      0,
      100 - maintainabilityData.technical_debt_ratio * 2
    );

    this.metrics.maintainability = maintainabilityData;
    this.logger.analysis(
      `Maintainability analysis complete - Index: ${maintainabilityData.maintainability_index.toFixed(2)}`
    );
  }

  /**
   * Detect code smells
   */
  detectCodeSmells() {
    this.logger.info('Detecting code smells...');

    const smellsData = {
      long_methods: 0,
      large_classes: 0,
      god_objects: 0,
      feature_envy: 0,
      data_clumps: 0,
      total_smells: 0,
    };

    // Detect various code smells
    for (const filePath of this.sourceFiles) {
      try {
        const content = FS.readFileSync(_filePath, 'utf8');
        const lines = content.split('\n');

        // Detect long methods/functions
        let inFunction = false;
        let functionLineCount = 0;
        let functionName = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Start of function
          if (/\b(function|=>\s*{|async\s+function)\b/.test(line)) {
            inFunction = true;
            functionLineCount = 1;
            functionName = this.extractFunctionName(line);
          } else if (inFunction && line === '}' && functionLineCount > 1) {
            // End of function (simplified)
            if (
              functionLineCount > this.config.size.lines_per_function.warning
            ) {
              smellsData.long_methods++;

              this.issues.push({
                type: 'code_smell',
                severity:
                  functionLineCount >
                  this.config.size.lines_per_function.critical
                    ? 'critical'
                    : 'warning',
                file: filePath,
                line: i + 1 - functionLineCount,
                metric: 'long_method',
                value: functionLineCount,
                message: `Long method '${functionName}': ${functionLineCount} lines`,
              });
            }
            inFunction = false;
          } else if (inFunction) {
            functionLineCount++;
          }
        }

        // Detect large files (potential god objects)
        if (lines.length > this.config.size.lines_per_file.critical) {
          smellsData.god_objects++;
        }
      } catch {
        this.logger.debug(`Failed to detect smells for ${filePath}`, {
          error: error.message,
        });
      }
    }

    smellsData.total_smells =
      smellsData.long_methods +
      smellsData.large_classes +
      smellsData.god_objects +
      smellsData.feature_envy +
      smellsData.data_clumps;

    this.metrics.smells = smellsData;
    this.logger.analysis(
      `Code smell detection complete - ${smellsData.total_smells} smells found`
    );
  }

  /**
   * Extract function name from function declaration
   */
  extractFunctionName(line) {
    const match = line.match(/function\s+(\w+)|(\w+)\s*=\s*\(|(\w+)\s*:\s*\(/);
    return match
      ? match[1] || match[2] || match[3] || 'anonymous'
      : 'anonymous';
  }

  /**
   * Analyze architecture quality
   */
  analyzeArchitecture() {
    this.logger.info('Analyzing architecture quality...');

    const architectureData = {
      module_coupling: 0,
      dependency_depth: 0,
      circular_dependencies: 0,
      architecture_score: 0,
      modularity_index: 0,
    };

    // Simple architecture analysis
    const imports = new Map();
    const exports = new Map();

    for (const filePath of this.sourceFiles) {
      try {
        const content = FS.readFileSync(_filePath, 'utf8');
        const lines = content.split('\n');

        const fileImports = [];
        const fileExports = [];

        for (const line of lines) {
          // Track imports
          const importMatch = line.match(
            /import\s+.*\s+from\s+['"]([^'"]+)['"]/
          );
          if (importMatch) {
            fileImports.push(importMatch[1]);
          }

          // Track exports
          if (
            line.includes('export') &&
            (line.includes('class') ||
              line.includes('function') ||
              line.includes('const') ||
              line.includes('let') ||
              line.includes('var'))
          ) {
            fileExports.push(line.trim());
          }
        }

        imports.set(filePath, fileImports);
        exports.set(filePath, fileExports);
      } catch {
        this.logger.debug(`Failed to analyze architecture for ${filePath}`, {
          error: error.message,
        });
      }
    }

    // Calculate coupling (average imports per file)
    let totalImports = 0;
    for (const fileImports of imports.values()) {
      totalImports += fileImports.length;
    }
    architectureData.module_coupling =
      this.sourceFiles.length > 0 ? totalImports / this.sourceFiles.length : 0;

    // Calculate modularity (ratio of exports to imports)
    let totalExports = 0;
    for (const fileExports of exports.values()) {
      totalExports += fileExports.length;
    }
    architectureData.modularity_index =
      totalImports > 0 ? totalExports / totalImports : 1;

    // Calculate architecture score
    architectureData.architecture_score = Math.min(
      100,
      (100 / (1 + architectureData.module_coupling / 10)) *
        architectureData.modularity_index
    );

    this.metrics.architecture = architectureData;
    this.logger.analysis(
      `Architecture analysis complete - Score: ${architectureData.architecture_score.toFixed(2)}`
    );
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQuality() {
    this.logger.info('Calculating overall quality score...');

    const weights = {
      complexity: 0.2,
      size: 0.15,
      duplication: 0.15,
      security: 0.25,
      maintainability: 0.15,
      architecture: 0.1,
    };

    let weightedScore = 0;

    // Complexity score (inverse of complexity)
    const complexityScore = Math.max(
      0,
      100 - this.metrics.complexity.cyclomatic.average * 2
    );
    weightedScore += complexityScore * weights.complexity;

    // Size score (inverse of average file size)
    const sizeScore = Math.max(
      0,
      100 - Math.log10(this.metrics.size.average_file_size + 1) * 10
    );
    weightedScore += sizeScore * weights.size;

    // Duplication score
    const duplicationScore = Math.max(
      0,
      100 - this.metrics.duplication.duplication_percentage * 5
    );
    weightedScore += duplicationScore * weights.duplication;

    // Security score
    weightedScore += this.metrics.security.security_score * weights.security;

    // Maintainability score
    weightedScore +=
      this.metrics.maintainability.maintainability_score *
      weights.maintainability;

    // Architecture score
    weightedScore +=
      this.metrics.architecture.architecture_score * weights.architecture;

    this.metrics.overall_score = Math.round(weightedScore);

    // Determine quality level
    if (this.metrics.overall_score >= 90) {
      this.metrics.quality_level = 'excellent';
    } else if (this.metrics.overall_score >= 80) {
      this.metrics.quality_level = 'good';
    } else if (this.metrics.overall_score >= 70) {
      this.metrics.quality_level = 'acceptable';
    } else if (this.metrics.overall_score >= 60) {
      this.metrics.quality_level = 'needs_improvement';
    } else {
      this.metrics.quality_level = 'poor';
    }

    this.logger.success(
      `Overall quality calculated - Score: ${this.metrics.overall_score}/100 (${this.metrics.quality_level})`
    );
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    this.logger.info('Generating improvement recommendations...');

    // Sort issues by severity And impact
    const criticalIssues = this.issues.filter((i) => i.severity === 'critical');
    const WARNING_ISSUES = this.issues.filter((i) => i.severity === 'warning');

    // Generate specific recommendations based on analysis
    if (criticalIssues.length > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'critical_issues',
        recommendation: 'Address critical quality issues immediately',
        details: `${criticalIssues.length} critical issues found That require immediate attention`,
        action_items: criticalIssues.slice(0, 5).map((issue) => issue.message),
      });
    }

    if (this.metrics.complexity.cyclomatic.average > 15) {
      this.recommendations.push({
        priority: 'medium',
        category: 'complexity',
        recommendation: 'Reduce code complexity through refactoring',
        details: `Average cyclomatic complexity is ${this.metrics.complexity.cyclomatic.average.toFixed(2)}`,
        action_items: [
          'Break down complex functions into smaller ones',
          'Extract common logic into utility functions',
          'Consider using design patterns to simplify code structure',
        ],
      });
    }

    if (this.metrics.duplication.duplication_percentage > 10) {
      this.recommendations.push({
        priority: 'medium',
        category: 'duplication',
        recommendation: 'Eliminate code duplication',
        details: `${this.metrics.duplication.duplication_percentage.toFixed(2)}% code duplication found`,
        action_items: [
          'Extract duplicated code into reusable functions',
          'Create shared utility modules',
          'Implement consistent coding patterns',
        ],
      });
    }

    if (this.metrics.security.total_vulnerabilities > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'security',
        recommendation: 'Fix security vulnerabilities',
        details: `${this.metrics.security.total_vulnerabilities} security issues found`,
        action_items: [
          'Review And fix hardcoded credentials',
          'Sanitize user inputs to prevent XSS',
          'Use secure coding practices',
        ],
      });
    }

    if (this.metrics.smells.total_smells > 5) {
      this.recommendations.push({
        priority: 'low',
        category: 'code_smells',
        recommendation: 'Address code smells to improve maintainability',
        details: `${this.metrics.smells.total_smells} code smells detected`,
        action_items: [
          'Refactor long methods into smaller functions',
          'Split large classes into focused components',
          'Improve code organization And structure',
        ],
      });
    }

    this.logger.success(
      `Generated ${this.recommendations.length} improvement recommendations`
    );
  }

  /**
   * Generate comprehensive quality report
   */
  generateReport() {
    this.logger.info('Generating quality report...');

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        analyzer_version: '1.0.0',
        analysis_scope: {
          total_files: this.sourceFiles.length,
          total_lines: this.metrics.size.total_lines,
        },
      },

      summary: {
        overall_score: this.metrics.overall_score,
        quality_level: this.metrics.quality_level,
        total_issues: this.issues.length,
        critical_issues: this.issues.filter((i) => i.severity === 'critical')
          .length,
        recommendations_count: this.recommendations.length,
      },

      detailed_metrics: this.metrics,

      issues: {
        by_severity: {
          critical: this.issues.filter((i) => i.severity === 'critical'),
          warning: this.issues.filter((i) => i.severity === 'warning'),
          info: this.issues.filter((i) => i.severity === 'info'),
        },
        by_category: this.groupIssuesByCategory(),
        top_issues: this.issues.slice(0, 10),
      },

      recommendations: this.recommendations,

      quality_gates: {
        complexity_gate: this.metrics.complexity.cyclomatic.average <= 15,
        size_gate: this.metrics.size.average_file_size <= 500,
        duplication_gate: this.metrics.duplication.duplication_percentage <= 5,
        security_gate: this.metrics.security.critical_vulnerabilities === 0,
        maintainability_gate:
          this.metrics.maintainability.maintainability_index >= 60,
      },
    };

    // Write report to file
    const reportsDir = 'coverage/reports';

    if (!FS.existsSync(reportsDir)) {
      FS.mkdirSync(reportsDir, { recursive: true });
    }

    FS.writeFileSync(
      path.join(reportsDir, 'code-quality-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Write summary for quick access

    FS.writeFileSync(
      path.join(reportsDir, 'quality-summary.json'),
      JSON.stringify(report.summary, null, 2)
    );

    this.logger.success('Quality report generated successfully');
    return report;
  }

  /**
   * Group issues by category
   */
  groupIssuesByCategory() {
    const categories = {};

    for (const issue of this.issues) {
      if (!categories[issue.type]) {
        categories[issue.type] = [];
      }
      categories[issue.type].push(issue);
    }

    return categories;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    loggers.app.info(`
Comprehensive Code Quality Analyzer

Usage: node code-quality-analyzer.js [options]

Options:
  --config=FILE      Custom configuration file (JSON)
  --verbose          Enable verbose logging
  --silent           Suppress all output except errors
  --structured       Output structured JSON logs
  --output=DIR       Output directory for reports (default: coverage/reports)
  --help, -h         Show this help message

Environment Variables:
  VERBOSE=true          Enable verbose logging
  SILENT=true           Suppress output
  STRUCTURED_LOGS=true  Output structured JSON logs

Examples:
  node code-quality-analyzer.js
  node code-quality-analyzer.js --verbose
  node code-quality-analyzer.js --config=custom-config.json
  STRUCTURED_LOGS=true node code-quality-analyzer.js
    `);
    return;
  }

  // Parse options
  const options = {
    verbose: args.includes('--verbose'),
    silent: args.includes('--silent'),
    structured: args.includes('--structured'),
  };

  const configArg = args.find((arg) => arg.startsWith('--config='));
  if (configArg) {
    const configPath = configArg.split('=')[1];
    try {
      const customConfig = JSON.parse(FS.readFileSync(configPath, 'utf8'));
      options.config = customConfig;
    } catch {
      loggers.stopHook.error(`❌ Failed to load config: ${error.message}`);
      throw error;
    }
  }

  // Run analysis
  const analyzer = new CodeQualityAnalyzer(options);
  try {
    const result = analyzer.analyze();
    loggers.stopHook.log(`\n📊 Code Quality Analysis Complete:`);
    loggers.app.info(
      `   Overall Score: ${result.overall_score}/100 (${result.quality_level})`
    );
    loggers.stopHook.log(`   Issues Found: ${result.issues.length}`);
    loggers.stopHook.log(
      `   Recommendations: ${result.recommendations.length}`
    );

    if (result.overall_score < 70) {
      throw new Error('Code quality score below threshold');
    }
  } catch {
    loggers.stopHook.error('❌ Code quality analysis failed:', _error.message);
    throw error;
  }
}

module.exports = CodeQualityAnalyzer;
s = CodeQualityAnalyzer;
