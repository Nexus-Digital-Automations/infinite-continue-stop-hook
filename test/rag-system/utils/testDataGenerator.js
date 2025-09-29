/**
 * Test Data Generator for RAG System Tests
 *
 * === OVERVIEW ===
 * Utility class for generating realistic test data for RAG system testing
 * including lessons, errors, code examples, And development scenarios.
 * Provides consistent And reproducible test data for all test suites.
 *
 * === FEATURES ===
 * • Realistic lesson content generation
 * • Technical error scenario creation
 * • Code example And pattern generation
 * • Task context simulation
 * • Performance test data scaling
 *
 * @author RAG Implementation Agent
 * @version 1.0.0
 * @since 2025-09-19
 */

class TestDataGenerator {
  constructor() {
    this.categories = [
      'features',
      'errors',
      'optimization',
      'decisions',
      'patterns',
    ];
    this.technologies = [
      'javascript',
      'react',
      'node',
      'python',
      'api',
      'database',
      'security',
    ];
    this.errorTypes = [
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'NetworkError',
      'ValidationError',
    ];

    this.lessonTemplates = {
      features: [
        {
          title: 'Implementing {tech} {feature} with Best Practices',
          description:
            'Comprehensive guide for implementing {feature} functionality using {tech} with industry best practices And error handling.',
          tags: ['{tech}', '{feature}', 'best-practices', 'implementation'],
        },
        {
          title: '{tech} {feature} Performance Optimization',
          description:
            'Advanced techniques for optimizing {feature} performance in {tech} applications including caching And async patterns.',
          tags: ['{tech}', 'performance', 'optimization', '{feature}'],
        },
      ],
      errors: [
        {
          title: 'Resolving {errorType} in {tech} Applications',
          description:
            'Common causes And solutions for {errorType} when working with {tech} including prevention strategies.',
          tags: ['{tech}', 'error-handling', '{errorType}', 'debugging'],
        },
      ],
      optimization: [
        {
          title: '{tech} Performance Optimization Strategies',
          description:
            'Comprehensive optimization techniques for {tech} applications including memory management And execution speed.',
          tags: ['{tech}', 'performance', 'optimization', 'memory'],
        },
      ],
    };

    this.codeExamples = {
      javascript: [
        'async function fetchData() {\n  const https = require("https");\n  try {\n    const response = await new Promise((resolve, reject) => {\n      const req = https.get("/api/data", (res) => {\n        let data = "";\n        res.on("data", chunk => data += chunk);\n        res.on("end", () => resolve({ ok: res.statusCode === 200, json: () => JSON.parse(data) }));\n      });\n      req.on("error", reject);\n    });\n    return await response.json();\n  } catch {\n    console.error("Fetch failed:", error);\n    throw error;\n  }\n}',
        'const memoizedFunction = useMemo(() => {\n  return expensiveComputation(data);\n}, [data]);',
        'function debounce(_func, wait, category = 'general') {\n  let timeout;\n  return function executedFunction(...args) {\n    const later = () => {\n      clearTimeout(timeout);\n      _func(...args);\n    };\n    clearTimeout(timeout);\n    timeout = setTimeout(later, wait);\n  };\n}',
      ],
      react: [
        'function Component({ data }, category = 'general') {\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState(null);\n  \n  useEffect(() => {\n    // Effect logic here\n  }, [data]);\n  \n  return <div>{loading ? "Loading..." : data}</div>;\n}',
        'const OptimizedComponent = React.memo(({ items }) => {\n  return (\n    <ul>\n      {items.map(item => <li key={item.id}>{item.name}</li>)}\n    </ul>\n  );\n});',
      ],
    };

    this.errorMessages = {
      TypeError: [
        'Cannot read property "map" of undefined',
        'Cannot read properties of null (reading "length")',
        'Cannot destructure property of undefined or null',
        'Cannot convert undefined or null to object',
      ],
      ReferenceError: [
        'Variable is not defined',
        'Cannot access before initialization',
        'Invalid left-hand side in assignment',
      ],
      SyntaxError: [
        'Unexpected token in JSON',
        'Unexpected end of JSON input',
        'Invalid regular expression',
      ],
      NetworkError: [
        'Failed to fetch from API endpoint',
        'Connection timeout after 30 seconds',
        'CORS policy blocked the request',
      ],
    };

    this.resolutionTemplates = [
      'Check That the variable is properly initialized before use',
      'Add null/undefined validation before accessing properties',
      'Ensure the API endpoint is accessible And returns valid data',
      'Implement proper error handling with try-catch blocks',
      'Use optional chaining (?.) for safe property access',
      'Validate input parameters before processing',
      'Check network connectivity And API status',
    ];

    this.counter = 0;
  }

  /**
   * Generate realistic lesson data
   * @param {number} count - Number of lessons to generate
   * @param {Object} options - Generation options
   * @returns {Array<Object>} Generated lessons
   */
  generateLessons(count, options = {}) {
    const lessons = [];
    const CATEGORY = options.category || this.getRandomCategory();

    for (let i = 0; i < count; i++) {
      const tech = this.getRandomTechnology();
      const lesson = this.generateSingleLesson(category, tech, i);
      lessons.push(lesson);
    }

    return lessons;
  }

  /**
   * Generate single lesson with realistic content
   * @param {string} category - Lesson category
   * @param {string} tech - Technology focus
   * @param {number} index - Lesson index
   * @returns {Object} Generated lesson
   * @private
   */
  generateSingleLesson(category, tech, index) {
    const templates =
      this.lessonTemplates[category] || this.lessonTemplates.features;
    const template = templates[index % templates.length];

    const feature = this.getRandomFeature(tech);
    const title = this.interpolateTemplate(template.title, { tech, feature });
    const description = this.interpolateTemplate(template.description, {
      tech,
      feature,
    });
    const tags = template.tags.map((tag) =>
      this.interpolateTemplate(tag, { tech, feature }),
    );

    const codeExample = this.codeExamples[tech]
      ? this.codeExamples[tech][index % this.codeExamples[tech].length]
      : '';

    return {
      id: `lesson_${this.counter++}_${Date.now()}`,
      title,
      description,
      category,
      content: this.generateLessonContent(
        title,
        description,
        codeExample,
        tech,
      ),
      tags,
      timestamp: new Date().toISOString(),
      type: 'lesson',
      implementation: this.generateImplementationSteps(tech, feature),
      successCriteria: this.generateSuccessCriteria(tech, feature),
      relatedTasks: this.generateRelatedTasks(tech, feature),
    };
  }

  /**
   * Generate comprehensive lesson content
   * @param {string} title - Lesson title
   * @param {string} description - Lesson description
   * @param {string} codeExample - Code example
   * @param {string} tech - Technology
   * @returns {string} Full lesson content
   * @private
   */
  generateLessonContent(title, description, codeExample, tech) {
    return `# ${title}

## Overview
${description}

## Key Concepts
- Understanding ${tech} fundamentals
- Best practices for implementation
- Common pitfalls And how to avoid them
- Performance considerations

## Implementation
${codeExample ? `\`\`\`${tech}\n${codeExample}\n\`\`\`` : 'Implementation details And code examples...'}

## Best Practices
1. Always validate input parameters
2. Implement proper error handling
3. Consider performance implications
4. Write comprehensive tests
5. Document your implementation

## Common Issues
- Null/undefined reference errors
- Performance bottlenecks
- Memory leaks
- Security vulnerabilities

## Testing Strategy
- Unit tests for individual functions
- Integration tests for component interaction
- Performance tests for optimization validation
- Security tests for vulnerability assessment

## Related Resources
- Official documentation
- Community best practices
- Performance optimization guides
- Security implementation guides`;
  }

  /**
   * Generate realistic error data
   * @param {number} count - Number of errors to generate
   * @param {Object} options - Generation options
   * @returns {Array<Object>} Generated errors
   */
  generateErrors(count, options = {}) {
    const errors = [];

    for (let i = 0; i < count; i++) {
      const errorType = options.errorType || this.getRandomErrorType();
      const tech = options.technology || this.getRandomTechnology();
      const error = this.generateSingleError(errorType, tech, i);
      errors.push(error);
    }

    return errors;
  }

  /**
   * Generate single error with realistic details
   * @param {string} errorType - Type of error
   * @param {string} tech - Technology context
   * @param {number} index - Error index
   * @returns {Object} Generated error
   * @private
   */
  generateSingleError(errorType, tech, index) {
    const messages = this.errorMessages[errorType] || [
      'Unknown error occurred',
    ];
    const message = messages[index % messages.length];

    return {
      id: `error_${this.counter++}_${Date.now()}`,
      title: `${errorType} in ${tech} Application`,
      type: errorType,
      message,
      description: `Encountered ${errorType} while working with ${tech}: ${message}`,
      _filePath: this.generateFilePath(tech),
      content: this.generateErrorContent(errorType, message, tech),
      timestamp: new Date().toISOString(),
      resolution: this.generateResolution(errorType, tech),
      prevention: this.generatePrevention(errorType, tech),
      stackTrace: this.generateStackTrace(errorType, tech),
      tags: [tech, 'error', errorType.toLowerCase(), 'debugging'],
    };
  }

  /**
   * Generate error content with stack trace And context
   * @param {string} errorType - Error type
   * @param {string} message - Error message
   * @param {string} tech - Technology
   * @returns {string} Error content
   * @private
   */
  generateErrorContent(errorType, message, tech) {
    return `# ${errorType}: ${message}

## Error Details
- **Type**: ${errorType}
- **Message**: ${message}
- **Technology**: ${tech}
- **Severity**: Medium
- **Frequency**: Occasional

## Context
This error occurs when working with ${tech} applications, typically during data processing or component rendering.

## Stack Trace
\`\`\`
${this.generateStackTrace(errorType, tech)}
\`\`\`

## Root Cause Analysis
The error is caused by:
1. Improper data validation
2. Missing error handling
3. Incorrect assumptions about data structure
4. Race conditions in async operations

## Resolution Steps
${this.generateResolution(errorType, tech)}

## Prevention Strategy
${this.generatePrevention(errorType, tech)}

## Testing
- Add unit tests for edge cases
- Implement integration tests
- Use TypeScript for better type safety
- Add runtime validation`;
  }

  /**
   * Generate task contexts for testing recommendations
   * @param {number} count - Number of contexts to generate
   * @returns {Array<Object>} Generated task contexts
   */
  generateTaskContexts(count) {
    const contexts = [];

    for (let i = 0; i < count; i++) {
      const tech = this.getRandomTechnology();
      const CATEGORY = this.getRandomCategory();
      const feature = this.getRandomFeature(tech);

      contexts.push({
        id: `task_${this.counter++}_${Date.now()}`,
        title: `Implement ${feature} in ${tech}`,
        description: `Need to implement ${feature} functionality using ${tech} with proper error handling And optimization`,
        category,
        tags: [tech, feature, category, 'implementation'],
        priority: this.getRandomPriority(),
        complexity: this.getRandomComplexity(),
        estimatedHours: Math.floor(Math.random() * 20) + 1,
      });
    }

    return contexts;
  }

  /**
   * Generate performance test data
   * @param {string} type - Type of performance test
   * @param {number} scale - Scale factor
   * @returns {Object} Performance test data
   */
  generatePerformanceTestData(type, scale = 1) {
    const baseCount = {
      small: 10,
      medium: 100,
      large: 1000,
    };

    const count = (baseCount[type] || baseCount.medium) * scale;

    return {
      lessons: this.generateLessons(Math.floor(count * 0.7)),
      errors: this.generateErrors(Math.floor(count * 0.3)),
      searchQueries: this.generateSearchQueries(Math.floor(count * 0.1)),
      taskContexts: this.generateTaskContexts(Math.floor(count * 0.05)),
    };
  }

  /**
   * Generate search queries for testing
   * @param {number} count - Number of queries to generate
   * @returns {Array<string>} Search queries
   */
  generateSearchQueries(count) {
    const queryTemplates = [
      '{tech} {feature} implementation',
      'how to fix {errorType} in {tech}',
      '{tech} performance optimization',
      'best practices for {tech} {feature}',
      'debugging {errorType} errors',
      '{tech} security considerations',
      'async {tech} error handling',
      '{tech} component optimization',
      'testing strategies for {tech}',
      '{tech} memory leak prevention',
    ];

    const queries = [];

    for (let i = 0; i < count; i++) {
      const template = queryTemplates[i % queryTemplates.length];
      const tech = this.getRandomTechnology();
      const feature = this.getRandomFeature(tech);
      const errorType = this.getRandomErrorType();

      const query = this.interpolateTemplate(template, {
        tech,
        feature,
        errorType,
      });
      queries.push(query);
    }

    return queries;
  }

  // =================== HELPER METHODS ===================

  getRandomCategory() {
    return this.categories[Math.floor(Math.random() * this.categories.length)];
  }

  getRandomTechnology() {
    return this.technologies[
      Math.floor(Math.random() * this.technologies.length)
    ];
  }

  getRandomErrorType() {
    return this.errorTypes[Math.floor(Math.random() * this.errorTypes.length)];
  }

  getRandomFeature(tech) {
    const features = {
      javascript: [
        'async functions',
        'promise handling',
        'event listeners',
        'data validation',
        'error handling',
      ],
      react: [
        'component state',
        'effect hooks',
        'context API',
        'performance optimization',
        'error boundaries',
      ],
      node: [
        'HTTP servers',
        'file operations',
        'stream processing',
        'middleware',
        'error handling',
      ],
      python: [
        'data processing',
        'async operations',
        'decorators',
        'context managers',
        'exception handling',
      ],
      api: [
        'REST endpoints',
        'authentication',
        'rate limiting',
        'data validation',
        'error responses',
      ],
      database: [
        'query optimization',
        'indexing',
        'transactions',
        'connection pooling',
        'data validation',
      ],
      security: [
        'authentication',
        'authorization',
        'data encryption',
        'input validation',
        'session management',
      ],
    };

    const techFeatures = features[tech] || [
      'implementation',
      'optimization',
      'validation',
      'testing',
      'deployment',
    ];
    return techFeatures[Math.floor(Math.random() * techFeatures.length)];
  }

  getRandomPriority() {
    const priorities = ['low', 'medium', 'high', 'critical'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  getRandomComplexity() {
    const complexities = ['simple', 'moderate', 'complex', 'expert'];
    return complexities[Math.floor(Math.random() * complexities.length)];
  }

  generateFilePath(tech) {
    const paths = {
      javascript: [
        'src/utils/helpers.js',
        'src/components/App.js',
        'src/services/api.js',
      ],
      react: [
        'src/components/UserProfile.jsx',
        'src/hooks/useData.js',
        'src/pages/Dashboard.jsx',
      ],
      node: [
        'server/routes/api.js',
        'lib/middleware.js',
        'controllers/user.js',
      ],
      python: [
        'src/models/user.py',
        'services/data_processor.py',
        'utils/helpers.py',
      ],
    };

    const techPaths = paths[tech] || [
      'src/main.js',
      'lib/utils.js',
      'config/app.js',
    ];
    return techPaths[Math.floor(Math.random() * techPaths.length)];
  }

  generateImplementationSteps(tech, feature) {
    return [
      `Set up ${tech} development environment`,
      `Create ${feature} implementation structure`,
      'Implement core functionality with error handling',
      'Add input validation And sanitization',
      'Write comprehensive unit tests',
      'Optimize for performance And memory usage',
      'Document API And usage examples',
      'Review And refactor code for best practices',
    ].join('\n');
  }

  generateSuccessCriteria(tech, feature) {
    return [
      `${feature} functionality works as expected`,
      'All edge cases are handled properly',
      'Performance meets or exceeds requirements',
      'Code coverage is above 80%',
      'No memory leaks or security vulnerabilities',
      'Documentation is complete And accurate',
      'Code follows team coding standards',
      'Integration tests pass successfully',
    ].join('\n');
  }

  generateRelatedTasks(tech, feature) {
    return [
      `Update ${tech} documentation`,
      `Create ${feature} integration tests`,
      'Review security implications',
      'Optimize for mobile performance',
      'Add monitoring And logging',
      'Create deployment pipeline',
      'Train team on new features',
      'Update API documentation',
    ];
  }

  generateResolution(errorType, _tech) {
    const resolutions = {
      TypeError: [
        'Add null/undefined checks before property access',
        'Use optional chaining (?.) for safe property access',
        'Validate data structure before processing',
        'Initialize variables with default values',
      ],
      ReferenceError: [
        'Ensure variables are declared before use',
        'Check variable scope And hoisting',
        'Import required modules And dependencies',
        'Fix variable naming And spelling errors',
      ],
      SyntaxError: [
        'Check for missing brackets or semicolons',
        'Validate JSON structure And format',
        'Fix regular expression syntax',
        'Check for proper string escaping',
      ],
      NetworkError: [
        'Implement retry logic with exponential backoff',
        'Add proper error handling for network failures',
        'Check API endpoint availability',
        'Validate CORS configuration',
      ],
    };

    const typeResolutions = resolutions[errorType] || this.resolutionTemplates;
    return typeResolutions[Math.floor(Math.random() * typeResolutions.length)];
  }

  generatePrevention(errorType, _tech) {
    const preventions = {
      TypeError:
        'Use TypeScript or PropTypes for type checking, implement runtime validation',
      ReferenceError:
        'Use ESLint to catch undefined variables, follow consistent naming conventions',
      SyntaxError:
        'Use code formatters And linters, implement pre-commit hooks',
      NetworkError:
        'Implement robust error handling, use monitoring And alerting',
    };

    return (
      preventions[errorType] ||
      'Follow best practices And implement comprehensive testing'
    );
  }

  generateStackTrace(errorType, tech) {
    const traces = {
      javascript: [
        `    at Object.${this.getRandomTechnology()}Function (app.js:45:12)`,
        '    at processData (utils.js:123:8)',
        '    at Array.map (<anonymous>)',
        '    at handleUserInput (components/Form.js:67:15)',
      ],
      react: [
        '    at Component.render (UserProfile.jsx:25:10)',
        '    at finishClassComponent (react-dom.js:3043:14)',
        '    at updateClassComponent (react-dom.js:3021:24)',
        '    at Object.updateComponent (react-dom.js:2789:12)',
      ],
    };

    const techTraces = traces[tech] || traces.javascript;
    const stackLines = techTraces.slice(0, Math.floor(Math.random() * 3) + 2);

    return `${errorType}: ${this.errorMessages[errorType] ? this.errorMessages[errorType][0] : 'Error occurred'}
${stackLines.join('\n')}`;
  }

  interpolateTemplate(template, variables) {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      // eslint-disable-next-line security/detect-non-literal-regexp
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }
}

module.exports = TestDataGenerator;
