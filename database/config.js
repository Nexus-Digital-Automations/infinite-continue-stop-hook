/**
 * Database Configuration for TaskManager System
 * 
 * Supports both SQL (PostgreSQL/MySQL) and NoSQL (MongoDB) databases
 * Configuration can be set via environment variables or config files
 */

const path = require('path');

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const config = {
  // Database type selection
  database: {
    type: process.env.DB_TYPE || 'json', // 'postgresql', 'mysql', 'mongodb', 'json'
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || null, // Will use defaults based on type
    name: process.env.DB_NAME || 'taskmanager',
    username: process.env.DB_USERNAME || 'taskmanager',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    
    // Connection pool settings
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 600000
    }
  },

  // PostgreSQL specific configuration
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'taskmanager',
    username: process.env.POSTGRES_USER || 'taskmanager',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.POSTGRES_SSL === 'true',
    schema: process.env.POSTGRES_SCHEMA || 'public',
    connectionString: process.env.DATABASE_URL || null,
    
    // PostgreSQL specific options
    options: {
      dialectOptions: {
        ssl: process.env.POSTGRES_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      timezone: process.env.TZ || 'UTC',
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    }
  },

  // MySQL specific configuration
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    database: process.env.MYSQL_DATABASE || 'taskmanager',
    username: process.env.MYSQL_USER || 'taskmanager',
    password: process.env.MYSQL_PASSWORD || '',
    charset: process.env.MYSQL_CHARSET || 'utf8mb4',
    
    // MySQL specific options
    options: {
      dialect: 'mysql',
      timezone: process.env.TZ || 'UTC',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    }
  },

  // MongoDB specific configuration
  mongodb: {
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || 27017,
    database: process.env.MONGO_DATABASE || 'taskmanager',
    username: process.env.MONGO_USERNAME || '',
    password: process.env.MONGO_PASSWORD || '',
    authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
    replicaSet: process.env.MONGO_REPLICA_SET || null,
    ssl: process.env.MONGO_SSL === 'true',
    
    // MongoDB connection URI (overrides individual settings)
    uri: process.env.MONGODB_URI || null,
    
    // MongoDB specific options
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 1,
      maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
      bufferMaxEntries: 0,
      bufferCommands: false
    }
  },

  // JSON file database (current system)
  json: {
    todoPath: process.env.TODO_JSON_PATH || path.join(process.cwd(), 'TODO.json'),
    agentRegistryPath: process.env.AGENT_REGISTRY_PATH || path.join(process.cwd(), 'agent-registry.json'),
    backupEnabled: process.env.JSON_BACKUP_ENABLED !== 'false',
    backupInterval: parseInt(process.env.JSON_BACKUP_INTERVAL) || 300000, // 5 minutes
    maxBackups: parseInt(process.env.JSON_MAX_BACKUPS) || 10
  },

  // Migration settings
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: process.env.MIGRATION_TABLE || 'schema_migrations',
    schemaName: process.env.MIGRATION_SCHEMA || 'public'
  },

  // Performance and caching
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    type: process.env.CACHE_TYPE || 'memory' // 'memory', 'redis'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    database: process.env.DB_LOGGING === 'true',
    queries: process.env.DB_QUERY_LOGGING === 'true',
    file: process.env.LOG_FILE || null,
    console: process.env.LOG_CONSOLE !== 'false'
  }
};

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================================================

const environments = {
  development: {
    database: {
      type: 'json' // Use JSON files for development
    },
    logging: {
      level: 'debug',
      database: true,
      queries: true,
      console: true
    }
  },

  test: {
    database: {
      type: 'json',
      name: 'taskmanager_test'
    },
    json: {
      todoPath: path.join(process.cwd(), 'test', 'TODO.json'),
      agentRegistryPath: path.join(process.cwd(), 'test', 'agent-registry.json'),
      backupEnabled: false
    },
    logging: {
      level: 'error',
      database: false,
      queries: false,
      console: false
    }
  },

  production: {
    database: {
      type: process.env.DB_TYPE || 'postgresql' // Prefer PostgreSQL for production
    },
    cache: {
      enabled: true,
      ttl: 600, // 10 minutes
      type: 'redis'
    },
    logging: {
      level: 'warn',
      database: false,
      queries: false,
      file: '/var/log/taskmanager/app.log'
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get configuration for current environment
 */
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = environments[env] || {};
  
  // Deep merge configurations
  return mergeDeep(config, envConfig);
}

/**
 * Get database connection string/configuration
 */
function getDatabaseConfig() {
  const cfg = getConfig();
  const dbType = cfg.database.type;
  
  switch (dbType) {
    case 'postgresql': {
      return {
        type: 'postgresql',
        config: cfg.postgresql.connectionString || {
          host: cfg.postgresql.host,
          port: cfg.postgresql.port,
          database: cfg.postgresql.database,
          username: cfg.postgresql.username,
          password: cfg.postgresql.password,
          ssl: cfg.postgresql.ssl,
          options: cfg.postgresql.options
        }
      };
    }
      
    case 'mysql': {
      return {
        type: 'mysql',
        config: {
          host: cfg.mysql.host,
          port: cfg.mysql.port,
          database: cfg.mysql.database,
          username: cfg.mysql.username,
          password: cfg.mysql.password,
          charset: cfg.mysql.charset,
          options: cfg.mysql.options
        }
      };
    }
      
    case 'mongodb': {
      return {
        type: 'mongodb',
        config: cfg.mongodb.uri || {
          host: cfg.mongodb.host,
          port: cfg.mongodb.port,
          database: cfg.mongodb.database,
          username: cfg.mongodb.username,
          password: cfg.mongodb.password,
          authSource: cfg.mongodb.authSource,
          replicaSet: cfg.mongodb.replicaSet,
          ssl: cfg.mongodb.ssl,
          options: cfg.mongodb.options
        }
      };
    }
      
    case 'json':
    default: {
      return {
        type: 'json',
        config: cfg.json
      };
    }
  }
}

/**
 * Validate database configuration
 */
function validateConfig() {
  const cfg = getConfig();
  const errors = [];
  
  // Validate database type
  const validTypes = ['postgresql', 'mysql', 'mongodb', 'json'];
  if (!validTypes.includes(cfg.database.type)) {
    errors.push(`Invalid database type: ${cfg.database.type}`);
  }
  
  // Type-specific validation
  switch (cfg.database.type) {
    case 'postgresql':
      if (!cfg.postgresql.database) {
        errors.push('PostgreSQL database name is required');
      }
      break;
      
    case 'mysql':
      if (!cfg.mysql.database) {
        errors.push('MySQL database name is required');
      }
      break;
      
    case 'mongodb':
      if (!cfg.mongodb.database && !cfg.mongodb.uri) {
        errors.push('MongoDB database name or URI is required');
      }
      break;
      
    case 'json':
      if (!cfg.json.todoPath) {
        errors.push('JSON TODO path is required');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Deep merge two objects
 */
function mergeDeep(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// ============================================================================
// DATABASE ADAPTER FACTORY
// ============================================================================

/**
 * Create database adapter based on configuration
 */
async function createDatabaseAdapter() {
  const dbConfig = getDatabaseConfig();
  
  switch (dbConfig.type) {
    case 'postgresql': {
      const PostgreSQLAdapter = require('./adapters/postgresql-adapter');
      return new PostgreSQLAdapter(dbConfig.config);
    }
      
    case 'mysql': {
      const MySQLAdapter = require('./adapters/mysql-adapter');
      return new MySQLAdapter(dbConfig.config);
    }
      
    case 'mongodb': {
      const MongoDBAdapter = require('./adapters/mongodb-adapter');
      return new MongoDBAdapter(dbConfig.config);
    }
      
    case 'json':
    default: {
      const JSONAdapter = require('./adapters/json-adapter');
      return new JSONAdapter(dbConfig.config);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getConfig,
  getDatabaseConfig,
  validateConfig,
  createDatabaseAdapter,
  environments
};