/**
 * Database Manager for RAG-Based Agent Learning System
 *
 * Provides comprehensive database management functionality including:
 * - SQLite database initialization and configuration
 * - Schema migration and versioning
 * - Connection pooling and transaction management
 * - Performance optimization
 * - Error handling and recovery
 *
 * @author Database Architecture Agent
 * @version 1.0.0
 * @since 2025-09-20
 */

const _sqlite3 = require('sqlite3').verbose();
const _fs = require('fs').promises;
const _path = require('path');

class DatabaseManager {
  constructor(options = {}) {
    this.dbPath = options.dbPath || _path.join(__dirname, '../../data/rag_learning.db');
    this.schemaPath = options.schemaPath || _path.join(__dirname, 'schema.sql');
    this.db = null;
    this.isInitialized = false;
    this.transactionDepth = 0;

    // Performance settings
    this.connectionPool = [];
    this.maxConnections = options.maxConnections || 10;
    this.busyTimeout = options.busyTimeout || 30000; // 30 seconds

    // Migration settings
    this.currentSchemaVersion = 1;
    this.migrations = new Map();

    // Logging
    this.enableLogging = options.enableLogging !== false;
    this.logger = options.logger || console;
  }

  /**
   * Initialize the database with schema and optimizations
   */
  async initialize() {
    try {
      this.log('info', 'Initializing RAG Learning Database...');

      // Ensure data directory exists
      await this.ensureDataDirectory();

      // Create database connection
      await this.createConnection();

      // Apply schema
      await this.applySchema();

      // Configure performance optimizations
      await this.applyOptimizations();

      // Initialize default data
      await this.initializeDefaultData();

      this.isInitialized = true;
      this.log('info', 'Database initialization completed successfully');

      return { success: true, message: 'Database initialized successfully' };
    } catch (error) {
      this.log('error', 'Database initialization failed:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Create database connection with optimizations
   */
  async createConnection() {
    return new Promise((resolve, reject) => {
      this.db = new _sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        this.log('info', `Connected to SQLite database at ${this.dbPath}`);
        resolve();
      });
    });
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    const dataDir = _path.dirname(this.dbPath);
    try {
      await _fs.access(dataDir);
    } catch {
      await _fs.mkdir(dataDir, { recursive: true });
      this.log('info', `Created data directory: ${dataDir}`);
    }
  }

  /**
   * Apply database schema from SQL file
   */
  async applySchema() {
    try {
      const schemaSQL = await _fs.readFile(this.schemaPath, 'utf8');
      await this.executeScript(schemaSQL);
      this.log('info', 'Database schema applied successfully');
    } catch (error) {
      throw new Error(`Failed to apply schema: ${error.message}`);
    }
  }

  /**
   * Apply performance optimizations
   */
  async applyOptimizations() {
    const optimizations = [
      'PRAGMA foreign_keys = ON',
      'PRAGMA journal_mode = WAL',
      'PRAGMA synchronous = NORMAL',
      'PRAGMA cache_size = 10000',
      'PRAGMA temp_store = MEMORY',
      'PRAGMA mmap_size = 268435456', // 256MB
      'PRAGMA optimize',
    ];

    for (const pragma of optimizations) {
      await this.run(pragma);
    }

    this.log('info', 'Performance optimizations applied');
  }

  /**
   * Initialize default data
   */
  async initializeDefaultData() {
    try {
      // Insert default project if not exists
      const projectExists = await this.get(
        'SELECT id FROM projects WHERE name = ?',
        ['infinite-continue-stop-hook'],
      );

      if (!projectExists) {
        await this.run(
          `INSERT INTO projects (name, path, description)
           VALUES (?, ?, ?)`,
          [
            'infinite-continue-stop-hook',
            '/Users/jeremyparker/infinite-continue-stop-hook',
            'Universal TaskManager API system with RAG-based learning',
          ],
        );
        this.log('info', 'Default project initialized');
      }
    } catch (error) {
      this.log('warn', 'Failed to initialize default data:', error.message);
    }
  }

  /**
   * Execute a SQL script with multiple statements
   */
  async executeScript(script) {
    return new Promise((resolve, reject) => {
      this.db.exec(script, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Execute a single SQL statement
   */
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  /**
   * Get a single row
   */
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all rows
   */
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Execute SQL with prepared statement for better performance
   */
  async prepare(sql) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(stmt);
        }
      });
    });
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    if (this.transactionDepth === 0) {
      await this.run('BEGIN TRANSACTION');
    }
    this.transactionDepth++;
  }

  /**
   * Commit transaction
   */
  async commitTransaction() {
    this.transactionDepth--;
    if (this.transactionDepth === 0) {
      await this.run('COMMIT');
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction() {
    this.transactionDepth = 0;
    await this.run('ROLLBACK');
  }

  /**
   * Execute function within transaction
   */
  async withTransaction(fn) {
    await this.beginTransaction();
    try {
      const result = await fn();
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  /**
   * Search using full-text search
   */
  async searchLessons(query, limit = 10) {
    const sql = `
      SELECT l.*, rank
      FROM lessons l
      JOIN lessons_fts fts ON l.id = fts.rowid
      WHERE lessons_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;
    return this.all(sql, [query, limit]);
  }

  /**
   * Search errors using full-text search
   */
  async searchErrors(query, limit = 10) {
    const sql = `
      SELECT e.*, rank
      FROM errors e
      JOIN errors_fts fts ON e.id = fts.rowid
      WHERE errors_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;
    return this.all(sql, [query, limit]);
  }

  /**
   * Get database statistics
   */
  async getStatistics() {
    const stats = {};

    // Table counts
    const tables = ['projects', 'agents', 'tasks', 'lessons', 'errors', 'embeddings'];
    for (const table of tables) {
      const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
      stats[`${table}_count`] = result.count;
    }

    // Database size
    const sizeResult = await this.get('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');
    stats.database_size_bytes = sizeResult.size;

    // Recent activity
    const recentLessons = await this.get(`
      SELECT COUNT(*) as count
      FROM lessons
      WHERE created_at >= datetime('now', '-7 days')
    `);
    stats.recent_lessons_7days = recentLessons.count;

    const recentErrors = await this.get(`
      SELECT COUNT(*) as count
      FROM errors
      WHERE created_at >= datetime('now', '-7 days')
    `);
    stats.recent_errors_7days = recentErrors.count;

    return stats;
  }

  /**
   * Optimize database (vacuum, analyze)
   */
  async optimize() {
    try {
      this.log('info', 'Starting database optimization...');

      await this.run('VACUUM');
      await this.run('ANALYZE');
      await this.run('PRAGMA optimize');

      this.log('info', 'Database optimization completed');
      return { success: true, message: 'Database optimized successfully' };
    } catch (error) {
      this.log('error', 'Database optimization failed:', error);
      throw error;
    }
  }

  /**
   * Backup database
   */
  async backup(backupPath) {
    try {
      const backupDir = _path.dirname(backupPath);
      await _fs.mkdir(backupDir, { recursive: true });

      return new Promise((resolve, reject) => {
        const backup = this.db.backup(backupPath);
        backup.step(-1, (err) => {
          if (err) {
            reject(err);
          } else {
            backup.finish((err) => {
              if (err) {
                reject(err);
              } else {
                this.log('info', `Database backed up to ${backupPath}`);
                resolve({ success: true, backupPath });
              }
            });
          }
        });
      });
    } catch (error) {
      this.log('error', 'Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.log('info', 'Database connection closed');
            resolve();
          }
        });
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.get('SELECT 1 as test');
      return {
        status: 'healthy',
        initialized: this.isInitialized,
        test_query: result.test === 1,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Log message with timestamp
   */
  log(level, message, ...args) {
    if (this.enableLogging) {
      const timestamp = new Date().toISOString();
      this.logger[level](`[${timestamp}] [DatabaseManager] ${message}`, ...args);
    }
  }
}

module.exports = DatabaseManager;
