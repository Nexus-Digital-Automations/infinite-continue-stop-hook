/**
 * Database Configuration Test Suite
 * 
 * Tests for the multi-database configuration system including
 * environment-specific configs, validation, and adapter creation
 */

jest.mock('fs');
jest.mock('path');

// Mock the non-existent adapter modules
jest.mock('../database/adapters/postgresql-adapter', () => {
  return jest.fn().mockImplementation(() => ({
    type: 'postgresql',
    connect: jest.fn(),
    query: jest.fn()
  }));
}, { virtual: true });

jest.mock('../database/adapters/mysql-adapter', () => {
  return jest.fn().mockImplementation(() => ({
    type: 'mysql',
    connect: jest.fn(),
    query: jest.fn()
  }));
}, { virtual: true });

jest.mock('../database/adapters/mongodb-adapter', () => {
  return jest.fn().mockImplementation(() => ({
    type: 'mongodb',
    connect: jest.fn(),
    query: jest.fn()
  }));
}, { virtual: true });

jest.mock('../database/adapters/json-adapter', () => {
  return jest.fn().mockImplementation(() => ({
    type: 'json',
    read: jest.fn(),
    write: jest.fn()
  }));
}, { virtual: true });

const { 
  getConfig, 
  getDatabaseConfig, 
  validateConfig, 
  createDatabaseAdapter 
} = require('../database/config');

describe('Database Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.NODE_ENV;
    delete process.env.DB_TYPE;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_HOST;
    delete process.env.MONGODB_URI;
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getConfig()', () => {
    test('should return default configuration for development', () => {
      process.env.NODE_ENV = 'development';
      
      const config = getConfig();
      
      expect(config.database.type).toBe('json');
      expect(config.logging.level).toBe('debug');
      expect(config.logging.database).toBe(true);
    });

    test('should return production configuration', () => {
      process.env.NODE_ENV = 'production';
      
      const config = getConfig();
      
      expect(config.database.type).toBe('postgresql');
      expect(config.cache.enabled).toBe(true);
      expect(config.logging.level).toBe('warn');
    });

    test('should return test configuration', () => {
      process.env.NODE_ENV = 'test';
      
      const config = getConfig();
      
      expect(config.database.type).toBe('json');
      expect(config.database.name).toBe('taskmanager_test');
      expect(config.json.backupEnabled).toBe(false);
      expect(config.logging.level).toBe('error');
    });

    test('should override configuration with environment variables', () => {
      process.env.DB_TYPE = 'mongodb';
      process.env.DB_HOST = 'custom-host';
      process.env.LOG_LEVEL = 'info';
      
      const config = getConfig();
      
      expect(config.database.type).toBe('mongodb');
      expect(config.database.host).toBe('custom-host');
      expect(config.logging.level).toBe('info');
    });

    test('should merge configurations deeply', () => {
      process.env.NODE_ENV = 'production';
      process.env.CACHE_TTL = '1200';
      
      const config = getConfig();
      
      expect(config.cache.enabled).toBe(true);
      expect(config.cache.ttl).toBe(1200);
      expect(config.cache.type).toBe('redis'); // from production config
    });
  });

  describe('getDatabaseConfig()', () => {
    test('should return PostgreSQL configuration', () => {
      process.env.DB_TYPE = 'postgresql';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'testdb';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('postgresql');
      expect(dbConfig.config.host).toBe('localhost');
      expect(dbConfig.config.port).toBe('5432');
      expect(dbConfig.config.database).toBe('testdb');
    });

    test('should return PostgreSQL configuration with connection string', () => {
      process.env.DB_TYPE = 'postgresql';
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('postgresql');
      expect(dbConfig.config).toBe('postgresql://user:pass@host:5432/db');
    });

    test('should return MySQL configuration', () => {
      process.env.DB_TYPE = 'mysql';
      process.env.MYSQL_HOST = 'mysql-host';
      process.env.MYSQL_PORT = '3306';
      process.env.MYSQL_DATABASE = 'mysqldb';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('mysql');
      expect(dbConfig.config.host).toBe('mysql-host');
      expect(dbConfig.config.port).toBe('3306');
      expect(dbConfig.config.database).toBe('mysqldb');
    });

    test('should return MongoDB configuration', () => {
      process.env.DB_TYPE = 'mongodb';
      process.env.MONGO_HOST = 'mongo-host';
      process.env.MONGO_PORT = '27017';
      process.env.MONGO_DATABASE = 'mongodb';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('mongodb');
      expect(dbConfig.config.host).toBe('mongo-host');
      expect(dbConfig.config.port).toBe('27017');
      expect(dbConfig.config.database).toBe('mongodb');
    });

    test('should return MongoDB configuration with URI', () => {
      process.env.DB_TYPE = 'mongodb';
      process.env.MONGODB_URI = 'mongodb://user:pass@host:27017/db';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('mongodb');
      expect(dbConfig.config).toBe('mongodb://user:pass@host:27017/db');
    });

    test('should return JSON configuration', () => {
      process.env.DB_TYPE = 'json';
      process.env.TODO_JSON_PATH = '/custom/path/TODO.json';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('json');
      expect(dbConfig.config.todoPath).toBe('/custom/path/TODO.json');
    });

    test('should default to JSON configuration', () => {
      // No DB_TYPE set
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.type).toBe('json');
      expect(dbConfig.config.todoPath).toContain('TODO.json');
    });
  });

  describe('validateConfig()', () => {
    test('should validate valid PostgreSQL configuration', () => {
      process.env.DB_TYPE = 'postgresql';
      process.env.POSTGRES_DB = 'testdb';
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate valid MySQL configuration', () => {
      process.env.DB_TYPE = 'mysql';
      process.env.MYSQL_DATABASE = 'testdb';
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate valid MongoDB configuration', () => {
      process.env.DB_TYPE = 'mongodb';
      process.env.MONGO_DATABASE = 'testdb';
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate valid JSON configuration', () => {
      process.env.DB_TYPE = 'json';
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid database type', () => {
      process.env.DB_TYPE = 'invalid_db_type';
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid database type: invalid_db_type');
    });

    test('should reject PostgreSQL without database name', () => {
      process.env.DB_TYPE = 'postgresql';
      // No POSTGRES_DB set
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('PostgreSQL database name is required');
    });

    test('should reject MySQL without database name', () => {
      process.env.DB_TYPE = 'mysql';
      // No MYSQL_DATABASE set
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('MySQL database name is required');
    });

    test('should reject MongoDB without database name or URI', () => {
      process.env.DB_TYPE = 'mongodb';
      // No MONGO_DATABASE or MONGODB_URI set
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('MongoDB database name or URI is required');
    });

    test('should accept MongoDB with URI instead of database name', () => {
      process.env.DB_TYPE = 'mongodb';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('createDatabaseAdapter()', () => {
    test('should create PostgreSQL adapter', async () => {
      process.env.DB_TYPE = 'postgresql';
      process.env.POSTGRES_DB = 'testdb';
      
      const adapter = await createDatabaseAdapter();
      
      expect(adapter.type).toBe('postgresql');
    });

    test('should create MySQL adapter', async () => {
      process.env.DB_TYPE = 'mysql';
      process.env.MYSQL_DATABASE = 'testdb';
      
      const adapter = await createDatabaseAdapter();
      
      expect(adapter.type).toBe('mysql');
    });

    test('should create MongoDB adapter', async () => {
      process.env.DB_TYPE = 'mongodb';
      process.env.MONGO_DATABASE = 'testdb';
      
      const adapter = await createDatabaseAdapter();
      
      expect(adapter.type).toBe('mongodb');
    });

    test('should create JSON adapter', async () => {
      process.env.DB_TYPE = 'json';
      
      const adapter = await createDatabaseAdapter();
      
      expect(adapter.type).toBe('json');
    });

    test('should create JSON adapter by default', async () => {
      // No DB_TYPE set
      const adapter = await createDatabaseAdapter();
      
      expect(adapter.type).toBe('json');
    });
  });

  describe('Configuration merging', () => {
    test('should merge nested objects correctly', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_POOL_MIN = '5';
      process.env.DB_POOL_MAX = '20';
      
      const config = getConfig();
      
      expect(config.database.pool.min).toBe(5);
      expect(config.database.pool.max).toBe(20);
      expect(config.database.pool.acquireTimeoutMillis).toBe(30000); // default value
    });

    test('should handle boolean environment variables', () => {
      process.env.DB_SSL = 'true';
      process.env.CACHE_ENABLED = 'false';
      
      const config = getConfig();
      
      expect(config.database.ssl).toBe(true);
      expect(config.cache.enabled).toBe(false);
    });

    test('should handle numeric environment variables', () => {
      process.env.DB_PORT = '5432';
      process.env.CACHE_TTL = '600';
      process.env.CACHE_MAX_SIZE = '2000';
      
      const config = getConfig();
      
      expect(config.database.port).toBe('5432'); // Port is kept as string in config
      expect(config.cache.ttl).toBe(600);
      expect(config.cache.maxSize).toBe(2000);
    });
  });

  describe('Path handling', () => {
    test('should use absolute paths for JSON files', () => {
      const mockCwd = '/test/project';
      jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
      
      process.env.DB_TYPE = 'json';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.config.todoPath).toBe('/test/project/TODO.json');
      expect(dbConfig.config.agentRegistryPath).toBe('/test/project/agent-registry.json');
    });

    test('should respect custom JSON paths', () => {
      process.env.DB_TYPE = 'json';
      process.env.TODO_JSON_PATH = '/custom/todo.json';
      process.env.AGENT_REGISTRY_PATH = '/custom/agents.json';
      
      const dbConfig = getDatabaseConfig();
      
      expect(dbConfig.config.todoPath).toBe('/custom/todo.json');
      expect(dbConfig.config.agentRegistryPath).toBe('/custom/agents.json');
    });
  });

  describe('Error handling', () => {
    test('should handle missing environment values gracefully', () => {
      // Simulate undefined environment variables
      delete process.env.NODE_ENV;
      delete process.env.DB_TYPE;
      
      expect(() => {
        const config = getConfig();
        expect(config).toBeDefined();
      }).not.toThrow();
    });

    test('should provide default values for all required fields', () => {
      const config = getConfig();
      
      expect(config.database).toBeDefined();
      expect(config.database.type).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.logging.level).toBeDefined();
      expect(config.cache).toBeDefined();
    });
  });
});

module.exports = {
  // Export for potential integration tests
};