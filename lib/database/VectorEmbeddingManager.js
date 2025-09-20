/**
 * Vector Embedding Manager for RAG-Based Agent Learning System
 *
 * Provides comprehensive vector embedding functionality including:
 * - Text-to-vector conversion using Transformers.js
 * - Vector storage and retrieval
 * - Semantic similarity search
 * - FAISS-based vector indexing for performance
 * - Embedding cache management
 *
 * @author Database Architecture Agent
 * @version 1.0.0
 * @since 2025-09-20
 */

const { pipeline } = require('@xenova/transformers');
const { IndexFlatL2 } = require('faiss-node');
const _natural = require('natural');
const _path = require('path');
const _fs = require('fs').promises;

class VectorEmbeddingManager {
  constructor(options = {}) {
    this.dbManager = options.dbManager;
    this.logger = options.logger || console;

    // Embedding model configuration
    this.modelName = options.modelName || 'sentence-transformers/all-MiniLM-L6-v2';
    this.vectorDimension = options.vectorDimension || 384; // Default for all-MiniLM-L6-v2
    this.maxTextLength = options.maxTextLength || 512;

    // FAISS indexes for fast similarity search
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
    this.cacheDir = options.cacheDir || _path.join(__dirname, '../../data/embedding_cache');
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

      return { success: true, message: 'Vector embedding manager initialized' };
    } catch (error) {
      this.log('error', 'Failed to initialize Vector Embedding Manager:', error);
      throw new Error(`Vector embedding initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize the embedding pipeline with Transformers.js
   */
  async initializeEmbeddingPipeline() {
    try {
      this.log('info', `Loading embedding model: ${this.modelName}`);

      // Try to initialize the model with timeout and fallback
      const initPromise = pipeline(
        'feature-extraction',
        this.modelName,
        {
          quantized: true, // Use quantized model for better performance
          progress_callback: (progress) => {
            if (progress && progress.progress) {
              this.log('info', `Model loading progress: ${Math.round(progress.progress * 100)}%`);
            }
          },
        },
      );

      // Set timeout for model loading (60 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Model loading timeout')), 60000);
      });

      this.embeddingPipeline = await Promise.race([initPromise, timeoutPromise]);
      this.log('info', 'Embedding pipeline initialized successfully');
    } catch (error) {
      this.log('warn', `Failed to initialize embedding model: ${error.message}`);
      this.log('info', 'Falling back to mock embedding mode for development');

      // Use mock pipeline for development/testing
      this.embeddingPipeline = this.createMockPipeline();
      this.isMockMode = true;
    }
  }

  /**
   * Create a mock embedding pipeline for development/testing
   */
  createMockPipeline() {
    return async (text) => {
      // Generate a simple hash-based mock embedding
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const vector = new Array(this.vectorDimension).fill(0);

      // Create deterministic but varied embeddings based on text content
      for (let i = 0; i < words.length && i < 20; i++) {
        // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric loop index
        const word = words[i];
        let hash = 0;
        for (let j = 0; j < word.length; j++) {
          hash = ((hash << 5) - hash + word.charCodeAt(j)) & 0xffffffff;
        }

        // Distribute hash influence across vector dimensions
        for (let k = 0; k < this.vectorDimension; k++) {
          // eslint-disable-next-line security/detect-object-injection -- k is a safe numeric loop index
          vector[k] += Math.sin(hash * (k + 1) * 0.001) * 0.1;
        }
      }

      // Normalize vector
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        for (let i = 0; i < vector.length; i++) {
          // eslint-disable-next-line security/detect-object-injection -- i is a safe numeric loop index
          vector[i] /= magnitude;
        }
      }

      return { data: vector };
    };
  }

  /**
   * Ensure cache directory exists
   */
  async ensureCacheDirectory() {
    try {
      await _fs.access(this.cacheDir);
    } catch {
      await _fs.mkdir(this.cacheDir, { recursive: true });
      this.log('info', `Created embedding cache directory: ${this.cacheDir}`);
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

      // Preprocess text
      const processedText = this.preprocessText(text);

      // Check cache first
      if (this.enableCache && !options.skipCache) {
        const cached = await this.getCachedEmbedding(processedText);
        if (cached) {
          return cached;
        }
      }

      // Generate embedding using Transformers.js or mock pipeline
      let result;
      if (this.isMockMode) {
        result = await this.embeddingPipeline(processedText);
      } else {
        result = await this.embeddingPipeline(processedText, {
          pooling: 'mean',
          normalize: true,
        });
      }

      // Extract the embedding vector
      const embedding = Array.from(result.data);

      // Verify dimension
      if (embedding.length !== this.vectorDimension) {
        this.log('warn', `Unexpected embedding dimension: ${embedding.length}, expected: ${this.vectorDimension}`);
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
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Store embedding in database
   */
  async storeEmbedding(entityType, entityId, text, metadata = {}) {
    try {
      const embeddingData = await this.generateEmbedding(text);

      // Serialize vector for storage
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

      this.log('info', `Stored embedding for ${entityType}:${entityId}`);
      return { success: true, embeddingId: result.lastID };
    } catch (error) {
      this.log('error', 'Failed to store embedding:', error);
      throw error;
    }
  }

  /**
   * Find similar entities using vector similarity
   */
  async findSimilar(text, entityType, options = {}) {
    try {
      const limit = options.limit || 10;
      const threshold = options.threshold || this.similarityThresholds.medium;
      const includeScores = options.includeScores !== false;

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(text);

      // Use FAISS for fast similarity search if available
      if (this.indexes[entityType]) {
        return await this.searchWithFAISS(entityType, queryEmbedding.vector, limit, threshold);
      }

      // Fallback to database similarity search
      return await this.searchWithDatabase(entityType, queryEmbedding.vector, limit, threshold, includeScores);
    } catch (error) {
      this.log('error', 'Failed to find similar entities:', error);
      throw error;
    }
  }

  /**
   * Search using FAISS index for performance
   */
  async searchWithFAISS(entityType, queryVector, limit, threshold) {
    try {
      const index = this.indexes[entityType];
      if (!index) {
        throw new Error(`FAISS index not available for entity type: ${entityType}`);
      }

      // Search for similar vectors
      const results = index.search(new Float32Array(queryVector), limit);

      // Filter by threshold and get entity details (parallelized for performance)
      const validEntries = [];
      for (let i = 0; i < results.labels.length; i++) {
        const distance = results.distances[i];
        const similarity = 1 - (distance / 2); // Convert L2 distance to similarity

        if (similarity >= threshold) {
          validEntries.push({
            entityId: results.labels[i],
            similarity,
            distance,
          });
        }
      }

      // Fetch entity details in parallel
      const entityPromises = validEntries.map(async entry => {
        const entityDetails = await this.getEntityDetails(entityType, entry.entityId);
        return {
          ...entityDetails,
          similarity_score: entry.similarity,
          distance: entry.distance,
        };
      });

      const similarEntities = await Promise.all(entityPromises);

      return { results: similarEntities, total: similarEntities.length };
    } catch (error) {
      this.log('error', 'FAISS search failed:', error);
      throw error;
    }
  }

  /**
   * Search using database for similarity (fallback)
   */
  async searchWithDatabase(entityType, queryVector, limit, threshold, _includeScores) {
    try {
      // Get all embeddings for entity type
      const embeddings = await this.dbManager.all(
        `SELECT e.*, entity_data.title, entity_data.content
         FROM embeddings e
         LEFT JOIN ${this.getEntityTable(entityType)} entity_data ON e.entity_id = entity_data.id
         WHERE e.entity_type = ?
         ORDER BY e.created_at DESC`,
        [entityType],
      );

      // Calculate similarities
      const similarities = [];
      for (const embedding of embeddings) {
        const storedVector = this.deserializeVector(embedding.embedding_vector);
        const similarity = this.calculateCosineSimilarity(queryVector, storedVector);

        if (similarity >= threshold) {
          similarities.push({
            entity_id: embedding.entity_id,
            title: embedding.title,
            content: embedding.content,
            similarity_score: similarity,
            created_at: embedding.created_at,
          });
        }
      }

      // Sort by similarity and limit results
      similarities.sort((a, b) => b.similarity_score - a.similarity_score);
      const results = similarities.slice(0, limit);

      return { results, total: results.length };
    } catch (error) {
      this.log('error', 'Database similarity search failed:', error);
      throw error;
    }
  }

  /**
   * Update or create FAISS index for entity type
   */
  async updateFAISSIndex(entityType, entityId, vector) {
    try {
      if (!this.indexes[entityType]) {
        this.indexes[entityType] = new IndexFlatL2(this.vectorDimension);
        this.log('info', `Created new FAISS index for ${entityType}`);
      }

      // Add vector to index
      this.indexes[entityType].add(new Float32Array(vector));

      // Save index to disk
      if (this.enableCache) {
        const indexPath = _path.join(this.cacheDir, `${entityType}_index.faiss`);
        this.indexes[entityType].write(indexPath);
      }

      this.log('debug', `Updated FAISS index for ${entityType}:${entityId}`);
    } catch (error) {
      this.log('error', 'Failed to update FAISS index:', error);
      // Don't throw - FAISS is optional for performance
    }
  }

  /**
   * Load existing FAISS indexes from disk
   */
  async loadFAISSIndexes() {
    if (!this.enableCache) {return;}

    try {
      // Load FAISS indexes in parallel for better performance
      const loadPromises = Object.keys(this.indexes).map(async entityType => {
        const indexPath = _path.join(this.cacheDir, `${entityType}_index.faiss`);

        try {
          await _fs.access(indexPath);
          this.indexes[entityType] = IndexFlatL2.read(indexPath);
          this.log('info', `Loaded FAISS index for ${entityType}`);
          return { entityType, success: true };
        } catch {
          // Index doesn't exist - will be created when needed
          this.log('debug', `No existing FAISS index found for ${entityType}`);
          return { entityType, success: false };
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      this.log('warn', 'Failed to load FAISS indexes:', error);
      // Continue without indexes - they'll be created as needed
    }
  }

  /**
   * Preprocess text for better embedding quality
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Normalize whitespace and remove excessive newlines
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

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Generate hash for text content
   */
  generateTextHash(text) {
    const _crypto = require('crypto');
    return _crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Serialize vector for database storage
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
      const cacheFile = _path.join(this.cacheDir, `${textHash}.json`);

      const stats = await _fs.stat(cacheFile);
      const isExpired = Date.now() - stats.mtime.getTime() > this.cacheMaxAge;

      if (isExpired) {
        await _fs.unlink(cacheFile);
        return null;
      }

      const cached = JSON.parse(await _fs.readFile(cacheFile, 'utf8'));
      this.log('debug', 'Retrieved embedding from cache');
      return cached;
    } catch {
      return null;
    }
  }

  /**
   * Cache embedding to disk
   */
  async cacheEmbedding(text, embedding) {
    try {
      const textHash = this.generateTextHash(text);
      const cacheFile = _path.join(this.cacheDir, `${textHash}.json`);

      const cacheData = {
        vector: embedding,
        dimension: embedding.length,
        model: this.modelName,
        text_hash: textHash,
        created_at: new Date().toISOString(),
      };

      await _fs.writeFile(cacheFile, JSON.stringify(cacheData), 'utf8');
      this.log('debug', 'Cached embedding to disk');
    } catch (error) {
      this.log('warn', 'Failed to cache embedding:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Get entity table name for database queries
   */
  getEntityTable(entityType) {
    const tableMap = {
      lesson: 'lessons',
      error: 'errors',
      task: 'tasks',
      code_pattern: 'code_patterns',
    };
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

      // Count embeddings by type
      const embeddingCounts = await this.dbManager.all(`
        SELECT entity_type, COUNT(*) as count
        FROM embeddings
        GROUP BY entity_type
      `);

      for (const row of embeddingCounts) {
        stats[`${row.entity_type}_embeddings`] = row.count;
      }

      // FAISS index sizes
      for (const [entityType, index] of Object.entries(this.indexes)) {
        if (index) {
          stats[`${entityType}_index_size`] = index.ntotal;
        }
      }

      // Cache statistics
      if (this.enableCache) {
        try {
          const cacheFiles = await _fs.readdir(this.cacheDir);
          stats.cache_files = cacheFiles.length;
        } catch {
          stats.cache_files = 0;
        }
      }

      return stats;
    } catch (error) {
      this.log('error', 'Failed to get embedding statistics:', error);
      return {};
    }
  }

  /**
   * Clean up expired cache files
   */
  async cleanupCache() {
    if (!this.enableCache) {return;}

    try {
      const cacheFiles = await _fs.readdir(this.cacheDir);
      let cleaned = 0;

      for (const file of cacheFiles) {
        const filePath = _path.join(this.cacheDir, file);
        const stats = await _fs.stat(filePath);
        const isExpired = Date.now() - stats.mtime.getTime() > this.cacheMaxAge;

        if (isExpired) {
          await _fs.unlink(filePath);
          cleaned++;
        }
      }

      this.log('info', `Cleaned up ${cleaned} expired cache files`);
      return { cleaned };
    } catch (error) {
      this.log('error', 'Failed to cleanup cache:', error);
      throw error;
    }
  }

  /**
   * Rebuild all FAISS indexes
   */
  async rebuildIndexes() {
    try {
      this.log('info', 'Rebuilding all FAISS indexes...');

      for (const entityType of Object.keys(this.indexes)) {
        // Clear existing index
        this.indexes[entityType] = new IndexFlatL2(this.vectorDimension);

        // Get all embeddings for this entity type
        const embeddings = await this.dbManager.all(
          'SELECT entity_id, embedding_vector FROM embeddings WHERE entity_type = ?',
          [entityType],
        );

        // Add all vectors to index
        for (const embedding of embeddings) {
          const vector = this.deserializeVector(embedding.embedding_vector);
          this.indexes[entityType].add(new Float32Array(vector));
        }

        // Save to disk
        if (this.enableCache) {
          const indexPath = _path.join(this.cacheDir, `${entityType}_index.faiss`);
          this.indexes[entityType].write(indexPath);
        }

        this.log('info', `Rebuilt ${entityType} index with ${embeddings.length} vectors`);
      }

      this.log('info', 'All FAISS indexes rebuilt successfully');
      return { success: true, message: 'All indexes rebuilt' };
    } catch (error) {
      this.log('error', 'Failed to rebuild indexes:', error);
      throw error;
    }
  }

  /**
   * Log message with timestamp
   */
  log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    this.logger[level](`[${timestamp}] [VectorEmbeddingManager] ${message}`, ...args);
  }
}

module.exports = VectorEmbeddingManager;
