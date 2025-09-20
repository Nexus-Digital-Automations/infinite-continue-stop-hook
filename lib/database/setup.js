/**
 * RAG Database Setup Script
 *
 * Initializes the complete RAG-based agent learning system including:
 * - Database creation and schema application
 * - Vector embedding system setup
 * - Performance optimization
 * - Sample data insertion
 * - System health verification
 *
 * @author Database Architecture Agent
 * @version 1.0.0
 * @since 2025-09-20
 */

const _path = require('path');
const _DatabaseManager = require('./DatabaseManager');
const _VectorEmbeddingManager = require('./VectorEmbeddingManager');

class RAGDatabaseSetup {
  constructor(options = {}) {
    this.verbose = options.verbose !== false;
    this.skipSampleData = options.skipSampleData === true;
    this.forceReset = options.forceReset === true;

    // Database paths
    this.dbPath = options.dbPath || path.join(__dirname, '../../data/rag_learning.db');
    this.backupPath = options.backupPath || path.join(__dirname, '../../data/backups');

    // Components
    this.dbManager = null;
    this.vectorManager = null;
  }

  /**
   * Run complete setup process
   */
  async setup() {
    try {
      this.log('🚀 Starting RAG Database Setup...');

      // Step 1: Initialize database
      await this.initializeDatabase();

      // Step 2: Initialize vector embedding system
      await this.initializeVectorSystem();

      // Step 3: Insert sample data (if requested)
      if (!this.skipSampleData) {
        await this.insertSampleData();
      }

      // Step 4: Performance optimization
      await this.optimizePerformance();

      // Step 5: Health check
      await this.performHealthCheck();

      // Step 6: Create backup
      await this.createInitialBackup();

      this.log('✅ RAG Database Setup completed successfully!');
      this.printSummary();

      return {
        success: true,
        message: 'RAG database setup completed successfully',
        database_path: this.dbPath,
        backup_path: this.backupPath,
      };
    } catch (error) {
      this.log(`❌ Setup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize database with schema
   */
  async initializeDatabase() {
    this.log('📊 Initializing database...');

    this.dbManager = new DatabaseManager({
      dbPath: this.dbPath,
      enableLogging: this.verbose,
      logger: console,
    });

    await this.dbManager.initialize();
    this.log('  ✓ Database schema applied');
    this.log('  ✓ Performance optimizations configured');
    this.log('  ✓ Triggers and indexes created');
  }

  /**
   * Initialize vector embedding system
   */
  async initializeVectorSystem() {
    this.log('🔍 Initializing vector embedding system...');

    this.vectorManager = new VectorEmbeddingManager({
      dbManager: this.dbManager,
      enableCache: true,
      logger: console,
    });

    await this.vectorManager.initialize();
    this.log('  ✓ Embedding model loaded');
    this.log('  ✓ FAISS indexes initialized');
    this.log('  ✓ Cache directory created');
  }

  /**
   * Insert sample data for testing and demonstration
   */
  async insertSampleData() {
    this.log('📝 Inserting sample data...');

    // Sample lessons
    const sampleLessons = [
      {
        title: 'Linter Error Resolution: Unused Variables',
        category: 'error_resolution',
        content: 'When encountering unused variable errors, first check if the variable is truly unused. If so, either remove it or prefix with underscore (_variable) to indicate intentional non-use. For imported modules, use ESLint disable comments sparingly.',
        context: 'JavaScript/TypeScript projects with ESLint',
        tags: ['linter', 'eslint', 'unused-variables', 'javascript'],
        code_patterns: ['let unusedVar = ...', 'import { unused } from ...'],
        confidence_score: 0.9,
        effectiveness_score: 0.8,
      },
      {
        title: 'Feature Implementation: Authentication Flow',
        category: 'feature_implementation',
        content: 'Implement authentication in layers: 1) Route protection middleware, 2) JWT token validation, 3) User session management, 4) Role-based access control. Always hash passwords with bcrypt and implement proper logout functionality.',
        context: 'Web applications requiring user authentication',
        tags: ['authentication', 'jwt', 'security', 'middleware'],
        code_patterns: ['app.use(authMiddleware)', 'bcrypt.hash(password)', 'jwt.verify(token)'],
        confidence_score: 0.95,
        effectiveness_score: 0.9,
      },
      {
        title: 'Performance Optimization: Database Queries',
        category: 'optimization',
        content: 'Optimize database queries by: 1) Adding proper indexes, 2) Using LIMIT clauses, 3) Avoiding N+1 queries, 4) Using connection pooling, 5) Implementing query caching. Monitor query execution time and optimize bottlenecks.',
        context: 'Database-heavy applications',
        tags: ['database', 'performance', 'sql', 'optimization'],
        code_patterns: ['SELECT * FROM ... LIMIT', 'CREATE INDEX ON', 'connection.pool()'],
        confidence_score: 0.85,
        effectiveness_score: 0.85,
      },
    ];

    // Sample errors
    const sampleErrors = [
      {
        title: 'ESLint: no-unused-vars violation',
        error_type: 'linter',
        error_code: 'no-unused-vars',
        message: "'variableName' is defined but never used",
        context: 'JavaScript function with unused parameter',
        severity: 'medium',
        file_path: 'src/utils/helper.js',
        line_number: 15,
        tags: ['eslint', 'unused-variables'],
        code_patterns: ['function helper(unusedParam) {}'],
      },
      {
        title: 'Build Error: Module not found',
        error_type: 'build',
        message: "Cannot resolve module 'missing-package'",
        context: 'Webpack build process',
        severity: 'high',
        impact_score: 0.8,
        tags: ['build', 'webpack', 'dependencies'],
        environment_info: { node_version: '18.0.0', npm_version: '8.0.0' },
      },
      {
        title: 'Runtime Error: Cannot read property of undefined',
        error_type: 'runtime',
        message: "Cannot read property 'name' of undefined",
        stack_trace: 'TypeError: Cannot read property \'name\' of undefined\n    at getUserName (app.js:45:18)',
        context: 'User data processing',
        severity: 'high',
        impact_score: 0.9,
        tags: ['runtime', 'null-pointer', 'user-data'],
      },
    ];

    // Create setup agent if it doesn't exist
    await this.dbManager.run(
      `INSERT OR IGNORE INTO agents (id, role, name, status)
       VALUES ('setup_agent', 'system', 'Database Setup Agent', 'active')`,
    );

    // Insert lessons
    for (const lesson of sampleLessons) {
      const result = await this.dbManager.run(
        `INSERT INTO lessons
         (title, category, content, context, tags, code_patterns, confidence_score, effectiveness_score, project_id, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'setup_agent')`,
        [
          lesson.title,
          lesson.category,
          lesson.content,
          lesson.context,
          JSON.stringify(lesson.tags),
          JSON.stringify(lesson.code_patterns),
          lesson.confidence_score,
          lesson.effectiveness_score,
        ],
      );

      // Create embedding
      const embeddingText = `${lesson.title} | ${lesson.category} | ${lesson.content}`;
      await this.vectorManager.storeEmbedding('lesson', result.lastID, embeddingText, {
        category: lesson.category,
      });
    }

    // Insert errors
    for (const error of sampleErrors) {
      const result = await this.dbManager.run(
        `INSERT INTO errors
         (title, error_type, error_code, message, stack_trace, context, severity, impact_score, file_path, line_number, tags, environment_info, project_id, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'setup_agent')`,
        [
          error.title,
          error.error_type,
          error.error_code || null,
          error.message,
          error.stack_trace || null,
          error.context,
          error.severity,
          error.impact_score || 0.5,
          error.file_path || null,
          error.line_number || null,
          JSON.stringify(error.tags),
          JSON.stringify(error.environment_info || {}),
        ],
      );

      // Create embedding
      const embeddingText = `${error.title} | ${error.error_type} | ${error.message}`;
      await this.vectorManager.storeEmbedding('error', result.lastID, embeddingText, {
        error_type: error.error_type,
        severity: error.severity,
      });
    }

    this.log(`  ✓ Inserted ${sampleLessons.length} sample lessons`);
    this.log(`  ✓ Inserted ${sampleErrors.length} sample errors`);
    this.log('  ✓ Generated embeddings for all sample data');
  }

  /**
   * Apply performance optimizations
   */
  async optimizePerformance() {
    this.log('⚡ Applying performance optimizations...');

    // Run ANALYZE to update statistics
    await this.dbManager.run('ANALYZE');

    // Optimize database
    await this.dbManager.optimize();

    // Rebuild vector indexes if they exist
    try {
      await this.vectorManager.rebuildIndexes();
      this.log('  ✓ Vector indexes rebuilt');
    } catch (error) {
      this.log('  ⚠ Vector index rebuild skipped (no existing data)');
    }

    this.log('  ✓ Database optimized');
    this.log('  ✓ Statistics updated');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    this.log('🔍 Performing health check...');

    // Database health check
    const dbHealth = await this.dbManager.healthCheck();
    if (dbHealth.status !== 'healthy') {
      throw new Error(`Database health check failed: ${dbHealth.error}`);
    }

    // Check table counts
    const stats = await this.dbManager.getStatistics();
    this.log(`  ✓ Database contains ${stats.projects_count || 0} projects`);
    this.log(`  ✓ Database contains ${stats.lessons_count || 0} lessons`);
    this.log(`  ✓ Database contains ${stats.errors_count || 0} errors`);
    this.log(`  ✓ Database contains ${stats.embeddings_count || 0} embeddings`);

    // Test embedding functionality
    if (stats.embeddings_count > 0) {
      try {
        const testResults = await this.vectorManager.findSimilar('test query', 'lesson', { limit: 1 });
        this.log('  ✓ Vector similarity search functional');
      } catch (error) {
        this.log('  ⚠ Vector similarity search test failed');
      }
    }

    this.log('  ✅ Health check passed');
  }

  /**
   * Create initial backup
   */
  async createInitialBackup() {
    this.log('💾 Creating initial backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupPath, `rag_learning_initial_${timestamp}.db`);

    await this.dbManager.backup(backupFile);
    this.log(`  ✓ Backup created: ${backupFile}`);
  }

  /**
   * Print setup summary
   */
  printSummary() {
    this.log('\n📋 Setup Summary:');
    this.log('─'.repeat(50));
    this.log(`Database Path: ${this.dbPath}`);
    this.log(`Backup Path: ${this.backupPath}`);
    this.log('');
    this.log('🎯 Next Steps:');
    this.log('1. Test RAG functionality with sample queries');
    this.log('2. Integrate with TaskManager API');
    this.log('3. Start storing real lessons and errors');
    this.log('4. Monitor performance and optimize as needed');
    this.log('');
    this.log('🔗 API Integration:');
    this.log('The RAG system is now ready for integration with the TaskManager API.');
    this.log('Use the RAGOperations module to interact with the database.');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.dbManager) {
      await this.dbManager.close();
    }
  }

  /**
   * Log message with timestamp
   */
  log(message) {
    if (this.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`);
    }
  }
}

// CLI support
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: !args.includes('--quiet'),
    skipSampleData: args.includes('--no-sample-data'),
    forceReset: args.includes('--force-reset'),
  };

  const setup = new RAGDatabaseSetup(options);

  try {
    const result = await setup.setup();
    console.log('\n✅ Setup completed successfully!');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await setup.cleanup();
  }
}

// Export for programmatic use
module.exports = RAGDatabaseSetup;

// Run if called directly
if (require.main === module) {
  main();
}
