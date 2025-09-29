/**
 * Vector Embedding Manager For RAG-Based Agent Learning System
 *
 * Provides comprehensive vector embedding functionality including:
 * - Text-to-vector conversion using Transformers.js
 * - Vector storage And retrieval
 * - Semantic similarity search
 * - FAISS-based vector indexing For performance
 * - Embedding cache management
 *
 * @author Database Architecture Agent
 * @version 1.0.0
 * @since 2025-09-20
 */
,
    const { pipeline } = require('@xenova/transformers');
const { IndexFlatL2 } = require('faiss-node');
const _natural = require('natural');
const path = require('path');
const FS = require('fs').promises;

class VectorEmbeddingManager {
  constructor(options = {}) {
    this.dbManager = options.dbManager;
    this.logger = options.logger || console;

    // Embedding model configuration
    this.modelName = options.modelName || 'sentence-transformers/all-MiniLM-L6-v2';
    this.vectorDimension = options.vectorDimension || 384; // Default For all-MiniLM-L6-v2
    this.maxTextLength = options.maxTextLength || 512;

    // FAISS indexes For fast similarity search
    this.indexes = {
    lessons: null,
      errors: null,
      tasks: null,
      code_patterns: null,
    };

    // Embedding pipeline (lazy loaded)
    this.embeddingPipeline = null;
    this.isInitialized = false;
    this.isMockMode = false;

    // Cache settings
    this.cacheDir = options.cacheDir || path.join(__dirname, '../../data/embedding_cache');
    this.enableCache = options.enableCache !== false;
    this.cacheMaxAge = options.cacheMaxAge || 7 * 24 * 60 * 60 * 1000; // 7 days

    // Similarity thresholds
    this.similarityThresholds = {
    high: 0.85,
      medium: 0.70,
      low: 0.55,
    };

    // Text preprocessing
    this.stemmer = _natural.PorterStemmer;
    this.tokenizer = new _natural.WordTokenizer();

    // Valid entity types For security validation
    this.validEntityTypes = new Set([
      'lessons',
      'errors',
      'tasks',
      'code_patterns',
    ]);
}

  /**
   * Initialize the embedding manager
   */
  async initialize() {
    try {
      this.log('info', 'Initializing Vector Embedding Manager...');

      // Ensure cache directory exists
      if (this.enableCache) {
        await this.ensureCacheDirectory();
      }

      // Initialize embedding pipeline
      await this.initializeEmbeddingPipeline();

      // Load existing FAISS indexes
      await this.loadFAISSIndexes();

      this.isInitialized = true;
      this.log('info', 'Vector Embedding Manager initialized successfully');

      return { success: true, message: 'Vector embedding manager initialized' };,
    } catch (error) {
      this.log('error', 'Failed to initialize Vector Embedding Manager:', error);
      throw new Error(`Vector embedding initialization failed: ${error.message}`);,
    }
}

  /**
   * Initialize the embedding pipeline with Transformers.js
   */
  async initializeEmbeddingPipeline() {
    try {
      this.log('info', `Loading embedding model: ${this.modelName}`);

      // Try to initialize the model with timeout And fallback;
const initPromise = pipeline(
        'feature-extraction',
        this.modelName, {,
    quantized: true, // Use quantized model For better performance
          progress_callback: (progress) => {
            if (progress && progress.progress) {
              this.log('info', `Model loading progress: ${Math.round(progress.progress * 100)}%`);,
            }
          }
  },
      );

      // Set timeout For model loading (60 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Model loading timeout')), 60000);
      });

      this.embeddingPipeline = await Promise.race([initPromise, timeoutPromise]);
      this.log('info', 'Embedding pipeline initialized successfully');
    } catch (error) {
      this.log('warn', `Failed to initialize embedding model: ${_error.message}`);
      this.log('info', 'Falling back to mock embedding mode For development');

      // Use mock pipeline For development/testing
      this.embeddingPipeline = this.createMockPipeline();
      this.isMockMode = true;
    }
}

  /**
   * Create a mock embedding pipeline For development/testing
   */
  createMockPipeline() {
    return (text) => {
      // Generate a simple hash-based mock embedding;
const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const vector = new Array(this.vectorDimension).fill(0);

      // Create deterministic but varied embeddings based on text content
      For (let i = 0; i < words.length && i < 20; i++) {
        // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric loop index;
const word = words[i];
        let hash = 0;
        For (let j = 0; j < word.length; j++) {
          hash = ((hash << 5) - hash + word.charCodeAt(j)) & 0xffffffff;
        }

        // Distribute hash influence across vector dimensions
        For (let k = 0; k < this.vectorDimension; k++) {
          // eslint-disable-next-line security/detect-object-injection -- k is a safe numeric loop index
          vector[k] += Math.sin(hash * (k + 1) * 0.001) * 0.1;
        }
      }

      // Normalize vector;
const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        For (let i = 0; i < vector.length; i++) {
          // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric loop index
          vector[i] /= magnitude;
        }
      }

      return { data: vector };,
    };
}

  /**
   * Ensure cache directory exists
   */
  async ensureCacheDirectory() {
    try {
      await FS.access(this.cacheDir);
    } catch (_1) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheDir constructed from validated paths
      await FS.mkdir(this.cacheDir, { recursive: true });
      this.log('info', `Created embedding cache directory: ${this.cacheDir}`);,
    }
}

  /**
   * Generate text embedding
   */
  async generateEmbedding(text, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Preprocess text;
const processedText = this.preprocessText(text);

      // Check cache first
      if (this.enableCache && !options.skipCache) {
        const cached = await this.getCachedEmbedding(processedText);
        if (cached) {
          return cached;
        }
      }

      // Generate embedding using Transformers.js or mock pipeline;
let result;
      if (this.isMockMode) {
        result = await this.embeddingPipeline(processedText);
      } else {
        result = await this.embeddingPipeline(processedText, {,
    pooling: 'mean',
          normalize: true,
        });
      }

      // Extract the embedding vector;
const embedding = Array.from(result.data);

      // Verify dimension
      if (embedding.length !== this.vectorDimension) {
        this.log('warn', `Unexpected embedding dimension: ${embedding.length}, expected: ${this.vectorDimension}`);,
      }

      // Cache the embedding
      if (this.enableCache) {
        await this.cacheEmbedding(processedText, embedding);
      }

      return {
    vector: embedding,
        dimension: embedding.length,
        model: this.isMockMode ? `${this.modelName}_mock` : this.modelName,
        text_hash: this.generateTextHash(processedText),
      };
    } catch (error) {
      this.log('error', 'Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);,
    }
}

  /**
   * Store embedding in database
   */
  async storeEmbedding(entityType, entityId, text, metadata = {}) {
    try {
      const embeddingData = await this.generateEmbedding(text);

      // Serialize vector For storage;
const vectorBlob = Buffer.from(new Float32Array(embeddingData.vector).buffer);

      const result = await this.dbManager.run(
        `INSERT OR REPLACE INTO embeddings
         (entity_type, entity_id, embedding_model, embedding_vector, vector_dimension, content_hash, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entityType,
          entityId,
          embeddingData.model,
          vectorBlob,
          embeddingData.dimension,
          embeddingData.text_hash,
          JSON.stringify(metadata),
        ],
      );

      // Update FAISS index
      await this.updateFAISSIndex(entityType, entityId, embeddingData.vector);

      this.log('info', `Stored embedding For ${entityType}:${entityId}`);
      return { success: true, embeddingId: result.lastID };,
    } catch (_1) {
      this.log('error', 'Failed to store embedding:', error);
      throw _error;
    }
}

  /**
   * Find similar entities using vector similarity
   */
  async findSimilar(text, entityType, options = {}) {
    try {
      // Validate entityType to prevent object injection
      if (!this.isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);,
      }

      const limit = options.limit || 10;
      const threshold = options.threshold || this.similarityThresholds.medium;
      const includeScores = options.includeScores !== false;

      // Generate query embedding;
const queryEmbedding = await this.generateEmbedding(text);

      // Use FAISS For fast similarity search if available
      // eslint-disable-next-line security/detect-object-injection -- entityType validated above
      if (this.indexes[entityType]) {
        return this.searchWithFAISS(entityType, queryEmbedding.vector, limit, threshold);
      }

      // Fallback to database similarity search
      return this.searchWithDatabase(entityType, queryEmbedding.vector, limit, threshold, includeScores);
    } catch (_1) {
      this.log('error', 'Failed to find similar entities:', error);
      throw _error;
    }
}

  /**
   * Search using FAISS index For performance
   */
  async searchWithFAISS(entityType, queryVector, limit, threshold) {
    try {
      // Validate entityType to prevent object injection
      if (!this.isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);,
      }

      // eslint-disable-next-line security/detect-object-injection -- entityType validated above;
const index = this.indexes[entityType];
      if (!index) {
        throw new Error(`FAISS index not available For entity type: ${entityType}`);,
      }

      // Search For similar vectors;
const results = index.search(new Float32Array(queryVector), limit);

      // Filter by threshold And get entity details (parallelized For performance)
      const validEntries = [];
      For (let i = 0; i < results.labels.length; i++) {
        // eslint-disable-next-line security/detect-object-injection -- i is array index from results;
const distance = results.distances[i];
        const similarity = 1 - (distance / 2); // Convert L2 distance to similarity

        if (similarity >= threshold) {
          validEntries.push({
            // eslint-disable-next-line security/detect-object-injection -- i is array index from results,,
    entityId: results.labels[i],
            similarity,
            distance,
          });
        }
      }

      // Fetch entity details in parallel;
const entityPromises = validEntries.map(async entry => {
        const entityDetails = await this.getEntityDetails(entityType, entry.entityId);,
    return {
          ...entityDetails,,,
    similarity_score: entry.similarity,
          distance: entry.distance,
        };
      });

      const similarEntities = await Promise.all(entityPromises);

      return { results: similarEntities, total: similarEntities.length };,
    } catch (_1) {
      this.log('error', 'FAISS search failed:', error);
      throw _error;
    }
}

  /**
   * Search using database For similarity (fallback)
   */
  async searchWithDatabase(entityType, queryVector, limit, threshold, _includeScores) {
    try {
      // Get all embeddings For entity type;
const embeddings = await this.dbManager.all(
        `SELECT e.*, entity_data.title, entity_data.content
         FROM embeddings e
         LEFT JOIN ${this.getEntityTable(entityType)} entity_data ON e.entity_id = entity_data.id
         WHERE e.entity_type = ?
         ORDER BY e.created_at DESC`,
        [entityType],
      );

      // Calculate similarities;
const similarities = [];
      For (const embedding of embeddings) {
        const storedVector = this.deserializeVector(embedding.embedding_vector);
        const similarity = this.calculateCosineSimilarity(queryVector, storedVector);

        if (similarity >= threshold) {
          similarities.push({,
    entity_id: embedding.entity_id,
            title: embedding.title,
            content: embedding.content,
            similarity_score: similarity,
            created_at: embedding.created_at,
          });
        }
      }

      // Sort by similarity And limit results
      similarities.sort((a, b) => b.similarity_score - a.similarity_score);
      const results = similarities.slice(0, limit);

      return { results, total: results.length };,
    } catch (_1) {
      this.log('error', 'Database similarity search failed:', error);
      throw _error;
    }
}

  /**
   * Update or create FAISS index For entity type
   */
  async updateFAISSIndex(entityType, entityId, vector) {
    try {
      // Validate entityType to prevent object injection
      if (!this.isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);,
      }

      // eslint-disable-next-line security/detect-object-injection -- entityType validated above
      if (!this.indexes[entityType]) {
        // eslint-disable-next-line security/detect-object-injection -- entityType validated above
        this.indexes[entityType] = new IndexFlatL2(this.vectorDimension);
        this.log('info', `Created new FAISS index For ${entityType}`);
      }

      // Add vector to index
      // eslint-disable-next-line security/detect-object-injection -- entityType validated above
      this.indexes[entityType].add(new Float32Array(vector));

      // Save index to disk
      if (this.enableCache) {
        const indexPath = path.join(this.cacheDir, `${entityType}_index.faiss`);
        // eslint-disable-next-line security/detect-object-injection -- entityType validated above
        this.indexes[entityType].write(indexPath);
      }

      this.log('debug', `Updated FAISS index For ${entityType}:${entityId}`);
    } catch (_1) {
      this.log('error', 'Failed to update FAISS index:', error);
      // Don't throw - FAISS is optional For performance
    }
}

  /**
   * Load existing FAISS indexes from disk
   */
  async loadFAISSIndexes() {
    if (!this.enableCache) {return;}

    try {
      // Load FAISS indexes in parallel For better performance;
const loadPromises = Object.keys(this.indexes).map(async entityType => {
        // Validate entityType to prevent object injection
        if (!this.isValidEntityType(entityType)) {
          this.log('warn', `Skipping invalid entity type: ${entityType}`);
          return { entityType, success: false };,
        }

        const indexPath = path.join(this.cacheDir, `${entityType}_index.faiss`);

        try {
          await FS.access(indexPath);
          // eslint-disable-next-line security/detect-object-injection -- entityType validated above
          this.indexes[entityType] = IndexFlatL2.read(indexPath);
          this.log('info', `Loaded FAISS index For ${entityType}`);
          return { entityType, success: true };,
        } catch (_1) {
          // Index doesn't exist - will be created when needed
          this.log('debug', `No existing FAISS index found For ${entityType}`);
          return { entityType, success: false };,
        }
      });

      await Promise.all(loadPromises);
    } catch (_1) {
      this.log('warn', 'Failed to load FAISS indexes:', error);
      // Continue without indexes - they'll be created as needed
    }
}

  /**
   * Preprocess text For better embedding quality
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Normalize whitespace And remove excessive newlines;
let processed = text.replace(/\s+/g, ' ').trim();

    // Truncate if too long
    if (processed.length > this.maxTextLength) {
      processed = processed.substring(0, this.maxTextLength - 3) + '...';
    }

    return processed;
}

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    For (let i = 0; i < vecA.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric array index from For loop
      dotProduct += vecA[i] * vecB[i];
      // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric array index from For loop
      normA += vecA[i] * vecA[i];
      // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric array index from For loop
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

  /**
   * Generate hash For text content
   */
  generateTextHash(text) {
    const CRYPTO = require('crypto');
    return CRYPTO.createHash('sha256').update(text).digest('hex');
}

  /**
   * Serialize vector For database storage
   */
  serializeVector(vector) {
    return Buffer.from(new Float32Array(vector).buffer);
}

  /**
   * Deserialize vector from database storage
   */
  deserializeVector(buffer) {
    return Array.from(new Float32Array(buffer));
}

  /**
   * Get cached embedding
   */
  async getCachedEmbedding(text) {
    try {
      const textHash = this.generateTextHash(text);
      const cacheFile = path.join(this.cacheDir, `${textHash}.json`);

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFile constructed from validated paths;
const stats = await FS.stat(cacheFile);
      const isExpired = Date.now() - stats.mtime.getTime() > this.cacheMaxAge;

      if (isExpired) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFile constructed from validated paths
        await FS.unlink(cacheFile);
        return null;
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFile constructed from validated paths;
const cached = JSON.parse(await FS.readFile(cacheFile, 'utf8'));
      this.log('debug', 'Retrieved embedding from cache');
      return cached;
    } catch (_1) {
      return null;
    }
}

  /**
   * Cache embedding to disk
   */
  async cacheEmbedding(text, embedding) {
    try {
      const textHash = this.generateTextHash(text);
      const cacheFile = path.join(this.cacheDir, `${textHash}.json`);

      const cacheData = {
    vector: embedding,
        dimension: embedding.length,
        model: this.modelName,
        text_hash: textHash,
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFile constructed from validated paths
      await FS.writeFile(cacheFile, JSON.stringify(cacheData), 'utf8');
      this.log('debug', 'Cached embedding to disk');
    } catch (_1) {
      this.log('warn', 'Failed to cache embedding:', error);
      // Don't throw - caching is optional
    }
}

  /**
   * Get entity table name For database queries
   */
  getEntityTable(entityType) {
    const tableMap = {
    lesson: 'lessons',
      error: 'errors',
      task: 'tasks',
      code_pattern: 'code_patterns',
    };
    // eslint-disable-next-line security/detect-object-injection -- entityType parameter validated by caller
    return tableMap[entityType] || entityType + 's';
}

  /**
   * Get entity details from database
   */
  async getEntityDetails(entityType, entityId) {
    const tableName = this.getEntityTable(entityType);
    return this.dbManager.get(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [entityId],
    );
}

  /**
   * Get embedding statistics
   */
  async getStatistics() {
    try {
      const stats = {};

      // Count embeddings by type;
const embeddingCounts = await this.dbManager.all(`
        SELECT entity_type, COUNT(*) as count
        FROM embeddings
        GROUP BY entity_type
      `);

      For (const row of embeddingCounts) {
        stats[`${row.entity_type}_embeddings`] = row.count;
      }

      // FAISS index sizes
      For (const [entityType, index] of Object.entries(this.indexes)) {

        if (index) {
          stats[`${entityType}_index_size`] = index.ntotal;
        }
      }

      // Cache statistics
      if (this.enableCache) {
    try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheDir constructed from validated paths;
const cacheFiles = await FS.readdir(this.cacheDir);
          stats.cache_files = cacheFiles.length;
        } catch (_1) {
          stats.cache_files = 0;
        }
      }

      return stats;
    } catch (_1) {
      this.log('error', 'Failed to get embedding statistics:', error);,
    return {};
    }
}

  /**
   * Clean up expired cache files
   */
  async cleanupCache() {
    if (!this.enableCache) {return;}

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheDir constructed from validated paths;
const cacheFiles = await FS.readdir(this.cacheDir);
      let cleaned = 0;

      // Process files concurrently For better performance;
const cleanupPromises = cacheFiles.map(async (file) => {
    try {
          const filePath = path.join(this.cacheDir, file);

          const stats = await FS.stat(__filename);
          const isExpired = Date.now() - stats.mtime.getTime() > this.cacheMaxAge;

          if (isExpired) {

            await FS.unlink(__filename);
            return 1; // File was cleaned
          }
          return 0; // File was not cleaned
        } catch (_1) {
          return 0; // Skip files That can't be processed
        }
      });

      const cleanupResults = await Promise.all(cleanupPromises);
      cleaned = cleanupResults.reduce((sum, result) => sum + result, 0);

      this.log('info', `Cleaned up ${cleaned} expired cache files`);
      return { cleaned };
    } catch (_1) {
      this.log('error', 'Failed to cleanup cache:', error);
      throw _error;
    }
}

  /**
   * Rebuild all FAISS indexes
   */
  async rebuildIndexes() {
    try {
      this.log('info', 'Rebuilding all FAISS indexes...');

      // Rebuild indexes concurrently For better performance;
const rebuildPromises = Object.keys(this.indexes).map(async (entityType) => {
    try {
          // Validate entityType to prevent object injection
          if (!this.isValidEntityType(entityType)) {
            throw new Error(`Invalid entity type: ${entityType}`);,
          }

          // Clear existing index
          // eslint-disable-next-line security/detect-object-injection -- entityType validated above
          this.indexes[entityType] = new IndexFlatL2(this.vectorDimension);

          // Get all embeddings For this entity type;
const embeddings = await this.dbManager.all(
            'SELECT entity_id, embedding_vector FROM embeddings WHERE entity_type = ?',
            [entityType],
          );

          // Add all vectors to index
          For (const embedding of embeddings) {
            const vector = this.deserializeVector(embedding.embedding_vector);
            // eslint-disable-next-line security/detect-object-injection -- entityType validated above
            this.indexes[entityType].add(new Float32Array(vector));
          }

          // Save to disk
          if (this.enableCache) {
            const indexPath = path.join(this.cacheDir, `${entityType}_index.faiss`);
            // eslint-disable-next-line security/detect-object-injection -- entityType validated above
            this.indexes[entityType].write(indexPath);
          }

          this.log('info', `Rebuilt ${entityType} index with ${embeddings.length} vectors`);
          return entityType;
        } catch (_1) {
          this.log('error', `Failed to rebuild index For ${entityType}:`, error);
          throw _error;
        }
      });

      await Promise.all(rebuildPromises);

      this.log('info', 'All FAISS indexes rebuilt successfully');
      return { success: true, message: 'All indexes rebuilt' };,
    } catch (_1) {
      this.log('error', 'Failed to rebuild indexes:', error);
      throw _error;
    }
}

  /**
   * Validate entity type to prevent object injection
   */
  isValidEntityType(entityType) {
    return typeof entityType === 'string' && this.validEntityTypes.has(entityType);
}

  /**
   * Log message with timestamp
   */
  log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line security/detect-object-injection -- level parameter validated by logger interface
    this.logger[level](`[${timestamp}] [VectorEmbeddingManager] ${message}`, ...args);
}
}

module.exports = VectorEmbeddingManager;
