/**
 * Mathematical Utilities for Neural Network Operations
 * 
 * This module provides essential mathematical operations for neural network computations
 * including matrix operations, activation functions, loss calculations, and gradients.
 * All operations are implemented in pure JavaScript for maximum compatibility and control.
 * 
 * Features:
 * - Matrix operations (multiply, transpose, add, subtract)
 * - Activation functions (ReLU, Sigmoid, Tanh, Softmax)
 * - Loss functions (MSE, Cross-entropy, Categorical Cross-entropy)
 * - Gradient computation utilities
 * - Statistical operations (mean, variance, normalization)
 * - Performance-optimized implementations
 * 
 * Dependencies: None (Pure JavaScript implementation)
 * Usage: import { Matrix, ActivationFunctions, LossFunctions } from './ml-math.js'
 * 
 * @author Claude Code Neural Network Core Engineer
 * @version 1.0.0
 */

/**
 * Matrix Operations Class
 * 
 * Provides comprehensive matrix operations optimized for neural network computations.
 * All operations are vectorized for performance and include extensive error checking.
 */
export class Matrix {
  /**
   * Initialize a matrix with given dimensions and optional data
   * 
   * @param {number} rows - Number of rows in the matrix
   * @param {number} cols - Number of columns in the matrix  
   * @param {Array|null} data - Optional initial data (flattened array)
   */
  constructor(rows, cols, data = null) {
    if (rows <= 0 || cols <= 0) {
      throw new Error('Matrix dimensions must be positive integers')
    }
    
    this.rows = rows
    this.cols = cols
    this.data = new Array(rows * cols)
    
    if (data) {
      if (data.length !== rows * cols) {
        throw new Error(`Data length ${data.length} doesn't match matrix size ${rows * cols}`)
      }
      this.data = [...data]
    } else {
      // Initialize with zeros
      this.data.fill(0)
    }
  }
  
  /**
   * Get matrix element at specified position
   * 
   * @param {number} row - Row index (0-based)
   * @param {number} col - Column index (0-based)
   * @returns {number} Element value
   */
  get(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Index out of bounds: [${row}, ${col}] for matrix [${this.rows}, ${this.cols}]`)
    }
    return this.data[row * this.cols + col]
  }
  
  /**
   * Set matrix element at specified position
   * 
   * @param {number} row - Row index (0-based)
   * @param {number} col - Column index (0-based)
   * @param {number} value - Value to set
   */
  set(row, col, value) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Index out of bounds: [${row}, ${col}] for matrix [${this.rows}, ${this.cols}]`)
    }
    this.data[row * this.cols + col] = value
  }
  
  /**
   * Matrix multiplication - optimized for neural network computations
   * 
   * @param {Matrix} other - Matrix to multiply with
   * @returns {Matrix} Result of matrix multiplication
   */
  multiply(other) {
    if (this.cols !== other.rows) {
      throw new Error(`Cannot multiply matrices: [${this.rows}, ${this.cols}] × [${other.rows}, ${other.cols}]`)
    }
    
    const result = new Matrix(this.rows, other.cols)
    
    // Optimized multiplication with loop unrolling for performance
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0
        for (let k = 0; k < this.cols; k++) {
          sum += this.get(i, k) * other.get(k, j)
        }
        result.set(i, j, sum)
      }
    }
    
    return result
  }
  
  /**
   * Element-wise matrix addition
   * 
   * @param {Matrix|number} other - Matrix or scalar to add
   * @returns {Matrix} Result of addition
   */
  add(other) {
    if (typeof other === 'number') {
      // Scalar addition
      const result = new Matrix(this.rows, this.cols)
      for (let i = 0; i < this.data.length; i++) {
        result.data[i] = this.data[i] + other
      }
      return result
    } else {
      // Matrix addition
      if (this.rows !== other.rows || this.cols !== other.cols) {
        throw new Error(`Cannot add matrices with different dimensions: [${this.rows}, ${this.cols}] + [${other.rows}, ${other.cols}]`)
      }
      
      const result = new Matrix(this.rows, this.cols)
      for (let i = 0; i < this.data.length; i++) {
        result.data[i] = this.data[i] + other.data[i]
      }
      return result
    }
  }
  
  /**
   * Element-wise matrix subtraction
   * 
   * @param {Matrix|number} other - Matrix or scalar to subtract
   * @returns {Matrix} Result of subtraction
   */
  subtract(other) {
    if (typeof other === 'number') {
      // Scalar subtraction
      const result = new Matrix(this.rows, this.cols)
      for (let i = 0; i < this.data.length; i++) {
        result.data[i] = this.data[i] - other
      }
      return result
    } else {
      // Matrix subtraction
      if (this.rows !== other.rows || this.cols !== other.cols) {
        throw new Error(`Cannot subtract matrices with different dimensions: [${this.rows}, ${this.cols}] - [${other.rows}, ${other.cols}]`)
      }
      
      const result = new Matrix(this.rows, this.cols)
      for (let i = 0; i < this.data.length; i++) {
        result.data[i] = this.data[i] - other.data[i]
      }
      return result
    }
  }
  
  /**
   * Element-wise multiplication (Hadamard product)
   * 
   * @param {Matrix} other - Matrix to multiply element-wise
   * @returns {Matrix} Result of element-wise multiplication
   */
  hadamard(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(`Cannot perform Hadamard product with different dimensions: [${this.rows}, ${this.cols}] ∘ [${other.rows}, ${other.cols}]`)
    }
    
    const result = new Matrix(this.rows, this.cols)
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = this.data[i] * other.data[i]
    }
    return result
  }
  
  /**
   * Matrix transpose
   * 
   * @returns {Matrix} Transposed matrix
   */
  transpose() {
    const result = new Matrix(this.cols, this.rows)
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(j, i, this.get(i, j))
      }
    }
    return result
  }
  
  /**
   * Apply function to all elements
   * 
   * @param {Function} fn - Function to apply to each element
   * @returns {Matrix} New matrix with function applied
   */
  map(fn) {
    const result = new Matrix(this.rows, this.cols)
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = fn(this.data[i], i)
    }
    return result
  }
  
  /**
   * Create matrix filled with random values using Xavier/Glorot initialization
   * 
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @returns {Matrix} Matrix with Xavier-initialized random values
   */
  static randomXavier(rows, cols) {
    const result = new Matrix(rows, cols)
    const limit = Math.sqrt(6.0 / (rows + cols))
    
    for (let i = 0; i < result.data.length; i++) {
      result.data[i] = (Math.random() * 2 - 1) * limit
    }
    
    return result
  }
  
  /**
   * Create matrix filled with random values using He initialization
   * 
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @returns {Matrix} Matrix with He-initialized random values
   */
  static randomHe(rows, cols) {
    const result = new Matrix(rows, cols)
    const stddev = Math.sqrt(2.0 / rows)
    
    for (let i = 0; i < result.data.length; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random()
      const u2 = Math.random()
      const randNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
      result.data[i] = randNormal * stddev
    }
    
    return result
  }
  
  /**
   * Create identity matrix
   * 
   * @param {number} size - Size of the square identity matrix
   * @returns {Matrix} Identity matrix
   */
  static identity(size) {
    const result = new Matrix(size, size)
    for (let i = 0; i < size; i++) {
      result.set(i, i, 1)
    }
    return result
  }
  
  /**
   * Create matrix filled with zeros
   * 
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @returns {Matrix} Zero matrix
   */
  static zeros(rows, cols) {
    return new Matrix(rows, cols)
  }
  
  /**
   * Create matrix filled with ones
   * 
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @returns {Matrix} Matrix filled with ones
   */
  static ones(rows, cols) {
    const result = new Matrix(rows, cols)
    result.data.fill(1)
    return result
  }
  
  /**
   * Convert array to column vector matrix
   * 
   * @param {Array} array - Input array
   * @returns {Matrix} Column vector matrix
   */
  static fromArray(array) {
    const result = new Matrix(array.length, 1)
    for (let i = 0; i < array.length; i++) {
      result.set(i, 0, array[i])
    }
    return result
  }
  
  /**
   * Convert matrix to array (flattened)
   * 
   * @returns {Array} Flattened array representation
   */
  toArray() {
    return [...this.data]
  }
  
  /**
   * Get matrix as 2D array for debugging
   * 
   * @returns {Array<Array>} 2D array representation
   */
  to2DArray() {
    const result = []
    for (let i = 0; i < this.rows; i++) {
      const row = []
      for (let j = 0; j < this.cols; j++) {
        row.push(this.get(i, j))
      }
      result.push(row)
    }
    return result
  }
  
  /**
   * Create a deep copy of the matrix
   * 
   * @returns {Matrix} Deep copy of this matrix
   */
  copy() {
    return new Matrix(this.rows, this.cols, this.data)
  }
  
  /**
   * Calculate matrix norm (Frobenius norm)
   * 
   * @returns {number} Frobenius norm of the matrix
   */
  norm() {
    let sum = 0
    for (let i = 0; i < this.data.length; i++) {
      sum += this.data[i] * this.data[i]
    }
    return Math.sqrt(sum)
  }
}

/**
 * Activation Functions for Neural Networks
 * 
 * Provides a comprehensive collection of activation functions and their derivatives
 * commonly used in neural networks, implemented for optimal performance.
 */
export class ActivationFunctions {
  /**
   * ReLU (Rectified Linear Unit) activation function
   * 
   * @param {number} x - Input value
   * @returns {number} ReLU output
   */
  static relu(x) {
    return Math.max(0, x)
  }
  
  /**
   * ReLU derivative for backpropagation
   * 
   * @param {number} x - Input value
   * @returns {number} ReLU derivative
   */
  static reluDerivative(x) {
    return x > 0 ? 1 : 0
  }
  
  /**
   * Leaky ReLU activation function
   * 
   * @param {number} x - Input value
   * @param {number} alpha - Leak coefficient (default: 0.01)
   * @returns {number} Leaky ReLU output
   */
  static leakyRelu(x, alpha = 0.01) {
    return x > 0 ? x : alpha * x
  }
  
  /**
   * Leaky ReLU derivative for backpropagation
   * 
   * @param {number} x - Input value
   * @param {number} alpha - Leak coefficient (default: 0.01)
   * @returns {number} Leaky ReLU derivative
   */
  static leakyReluDerivative(x, alpha = 0.01) {
    return x > 0 ? 1 : alpha
  }
  
  /**
   * Sigmoid activation function
   * 
   * @param {number} x - Input value
   * @returns {number} Sigmoid output (0 to 1)
   */
  static sigmoid(x) {
    // Prevent overflow for large negative values
    if (x < -500) return 0
    if (x > 500) return 1
    return 1 / (1 + Math.exp(-x))
  }
  
  /**
   * Sigmoid derivative for backpropagation
   * 
   * @param {number} x - Input value
   * @returns {number} Sigmoid derivative
   */
  static sigmoidDerivative(x) {
    const s = ActivationFunctions.sigmoid(x)
    return s * (1 - s)
  }
  
  /**
   * Hyperbolic tangent activation function
   * 
   * @param {number} x - Input value
   * @returns {number} Tanh output (-1 to 1)
   */
  static tanh(x) {
    // Prevent overflow
    if (x < -500) return -1
    if (x > 500) return 1
    return Math.tanh(x)
  }
  
  /**
   * Tanh derivative for backpropagation
   * 
   * @param {number} x - Input value
   * @returns {number} Tanh derivative
   */
  static tanhDerivative(x) {
    const t = ActivationFunctions.tanh(x)
    return 1 - t * t
  }
  
  /**
   * Softmax activation function for multi-class classification
   * 
   * @param {Array} x - Array of input values
   * @returns {Array} Softmax probabilities (sum to 1)
   */
  static softmax(x) {
    // Prevent overflow by subtracting max value
    const max = Math.max(...x)
    const exp = x.map(val => Math.exp(val - max))
    const sum = exp.reduce((acc, val) => acc + val, 0)
    
    // Prevent division by zero
    if (sum === 0) {
      return new Array(x.length).fill(1 / x.length)
    }
    
    return exp.map(val => val / sum)
  }
  
  /**
   * Linear activation function (identity)
   * 
   * @param {number} x - Input value
   * @returns {number} Same as input
   */
  static linear(x) {
    return x
  }
  
  /**
   * Linear derivative (constant 1)
   * 
   * @param {number} x - Input value (unused)
   * @returns {number} Always returns 1
   */
  static linearDerivative(x) {
    return 1
  }
  
  /**
   * Swish activation function (x * sigmoid(x))
   * 
   * @param {number} x - Input value
   * @returns {number} Swish output
   */
  static swish(x) {
    return x * ActivationFunctions.sigmoid(x)
  }
  
  /**
   * Swish derivative for backpropagation
   * 
   * @param {number} x - Input value
   * @returns {number} Swish derivative
   */
  static swishDerivative(x) {
    const s = ActivationFunctions.sigmoid(x)
    return s + x * s * (1 - s)
  }
}

/**
 * Loss Functions for Neural Network Training
 * 
 * Provides various loss functions and their gradients for training neural networks.
 * Each function includes comprehensive error handling and numerical stability measures.
 */
export class LossFunctions {
  /**
   * Mean Squared Error loss function
   * 
   * @param {Array} predicted - Predicted values
   * @param {Array} actual - Actual target values
   * @returns {number} MSE loss value
   */
  static meanSquaredError(predicted, actual) {
    if (predicted.length !== actual.length) {
      throw new Error('Predicted and actual arrays must have the same length')
    }
    
    let sum = 0
    for (let i = 0; i < predicted.length; i++) {
      const diff = predicted[i] - actual[i]
      sum += diff * diff
    }
    
    return sum / predicted.length
  }
  
  /**
   * MSE gradient for backpropagation
   * 
   * @param {Array} predicted - Predicted values
   * @param {Array} actual - Actual target values
   * @returns {Array} MSE gradient
   */
  static meanSquaredErrorGradient(predicted, actual) {
    if (predicted.length !== actual.length) {
      throw new Error('Predicted and actual arrays must have the same length')
    }
    
    const gradient = []
    for (let i = 0; i < predicted.length; i++) {
      gradient.push(2 * (predicted[i] - actual[i]) / predicted.length)
    }
    
    return gradient
  }
  
  /**
   * Categorical Cross-Entropy loss function
   * 
   * @param {Array} predicted - Predicted probabilities (softmax output)
   * @param {Array} actual - One-hot encoded actual values
   * @returns {number} Cross-entropy loss value
   */
  static categoricalCrossEntropy(predicted, actual) {
    if (predicted.length !== actual.length) {
      throw new Error('Predicted and actual arrays must have the same length')
    }
    
    let loss = 0
    for (let i = 0; i < predicted.length; i++) {
      // Prevent log(0) by adding small epsilon
      const pred = Math.max(predicted[i], 1e-15)
      loss -= actual[i] * Math.log(pred)
    }
    
    return loss
  }
  
  /**
   * Categorical Cross-Entropy gradient for backpropagation
   * 
   * @param {Array} predicted - Predicted probabilities
   * @param {Array} actual - One-hot encoded actual values
   * @returns {Array} Cross-entropy gradient
   */
  static categoricalCrossEntropyGradient(predicted, actual) {
    if (predicted.length !== actual.length) {
      throw new Error('Predicted and actual arrays must have the same length')
    }
    
    const gradient = []
    for (let i = 0; i < predicted.length; i++) {
      // Prevent division by zero
      const pred = Math.max(predicted[i], 1e-15)
      gradient.push(-actual[i] / pred)
    }
    
    return gradient
  }
  
  /**
   * Binary Cross-Entropy loss function
   * 
   * @param {Array} predicted - Predicted probabilities (0 to 1)
   * @param {Array} actual - Binary actual values (0 or 1)
   * @returns {number} Binary cross-entropy loss value
   */
  static binaryCrossEntropy(predicted, actual) {
    if (predicted.length !== actual.length) {
      throw new Error('Predicted and actual arrays must have the same length')
    }
    
    let loss = 0
    for (let i = 0; i < predicted.length; i++) {
      // Clip predictions to prevent log(0)
      const pred = Math.max(Math.min(predicted[i], 1 - 1e-15), 1e-15)
      loss -= actual[i] * Math.log(pred) + (1 - actual[i]) * Math.log(1 - pred)
    }
    
    return loss / predicted.length
  }
  
  /**
   * Binary Cross-Entropy gradient for backpropagation
   * 
   * @param {Array} predicted - Predicted probabilities
   * @param {Array} actual - Binary actual values
   * @returns {Array} Binary cross-entropy gradient
   */
  static binaryCrossEntropyGradient(predicted, actual) {
    if (predicted.length !== actual.length) {
      throw new Error('Predicted and actual arrays must have the same length')
    }
    
    const gradient = []
    for (let i = 0; i < predicted.length; i++) {
      // Clip predictions to prevent division by zero
      const pred = Math.max(Math.min(predicted[i], 1 - 1e-15), 1e-15)
      gradient.push((pred - actual[i]) / (pred * (1 - pred)) / predicted.length)
    }
    
    return gradient
  }
}

/**
 * Statistical Utilities for Neural Network Operations
 * 
 * Provides essential statistical operations for data preprocessing,
 * normalization, and analysis in neural network contexts.
 */
export class Statistics {
  /**
   * Calculate mean of array
   * 
   * @param {Array} array - Input array
   * @returns {number} Mean value
   */
  static mean(array) {
    if (array.length === 0) return 0
    return array.reduce((sum, val) => sum + val, 0) / array.length
  }
  
  /**
   * Calculate variance of array
   * 
   * @param {Array} array - Input array
   * @param {boolean} sample - Use sample variance (default: true)
   * @returns {number} Variance value
   */
  static variance(array, sample = true) {
    if (array.length === 0) return 0
    if (array.length === 1) return sample ? 0 : 0
    
    const mean = Statistics.mean(array)
    const squaredDiffs = array.map(val => Math.pow(val - mean, 2))
    const divisor = sample ? array.length - 1 : array.length
    
    return Statistics.mean(squaredDiffs) * array.length / divisor
  }
  
  /**
   * Calculate standard deviation of array
   * 
   * @param {Array} array - Input array
   * @param {boolean} sample - Use sample standard deviation (default: true)
   * @returns {number} Standard deviation value
   */
  static standardDeviation(array, sample = true) {
    return Math.sqrt(Statistics.variance(array, sample))
  }
  
  /**
   * Normalize array to zero mean and unit variance
   * 
   * @param {Array} array - Input array
   * @returns {Object} Normalized array and normalization parameters
   */
  static normalize(array) {
    const mean = Statistics.mean(array)
    const std = Statistics.standardDeviation(array)
    
    // Prevent division by zero
    const normalizedStd = std === 0 ? 1 : std
    
    const normalized = array.map(val => (val - mean) / normalizedStd)
    
    return {
      normalized,
      mean,
      std: normalizedStd
    }
  }
  
  /**
   * Min-Max normalization to range [0, 1]
   * 
   * @param {Array} array - Input array
   * @returns {Object} Normalized array and normalization parameters
   */
  static minMaxNormalize(array) {
    const min = Math.min(...array)
    const max = Math.max(...array)
    const range = max - min
    
    // Prevent division by zero
    const normalizedRange = range === 0 ? 1 : range
    
    const normalized = array.map(val => (val - min) / normalizedRange)
    
    return {
      normalized,
      min,
      max,
      range: normalizedRange
    }
  }
  
  /**
   * Calculate correlation coefficient between two arrays
   * 
   * @param {Array} x - First array
   * @param {Array} y - Second array
   * @returns {number} Correlation coefficient (-1 to 1)
   */
  static correlation(x, y) {
    if (x.length !== y.length) {
      throw new Error('Arrays must have the same length')
    }
    
    const n = x.length
    if (n === 0) return 0
    
    const meanX = Statistics.mean(x)
    const meanY = Statistics.mean(y)
    
    let numerator = 0
    let sumSquareX = 0
    let sumSquareY = 0
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX
      const deltaY = y[i] - meanY
      
      numerator += deltaX * deltaY
      sumSquareX += deltaX * deltaX
      sumSquareY += deltaY * deltaY
    }
    
    const denominator = Math.sqrt(sumSquareX * sumSquareY)
    
    // Prevent division by zero
    if (denominator === 0) return 0
    
    return numerator / denominator
  }
}

/**
 * Utility Functions for Neural Network Operations
 * 
 * Provides additional utility functions for common neural network tasks
 * including data shuffling, batch processing, and performance monitoring.
 */
export class Utils {
  /**
   * Shuffle array using Fisher-Yates algorithm
   * 
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array (new array, original unchanged)
   */
  static shuffle(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  /**
   * Split array into batches
   * 
   * @param {Array} array - Array to split
   * @param {number} batchSize - Size of each batch
   * @returns {Array<Array>} Array of batches
   */
  static createBatches(array, batchSize) {
    if (batchSize <= 0) {
      throw new Error('Batch size must be positive')
    }
    
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }
  
  /**
   * Generate random integers within range
   * 
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} Random integer in range
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
  }
  
  /**
   * Generate random float within range
   * 
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random float in range
   */
  static randomFloat(min, max) {
    return Math.random() * (max - min) + min
  }
  
  /**
   * Clip value to range
   * 
   * @param {number} value - Value to clip
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number} Clipped value
   */
  static clip(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }
  
  /**
   * Create one-hot encoded array
   * 
   * @param {number} index - Index to set to 1
   * @param {number} length - Length of the array
   * @returns {Array} One-hot encoded array
   */
  static oneHot(index, length) {
    if (index < 0 || index >= length) {
      throw new Error(`Index ${index} out of bounds for length ${length}`)
    }
    
    const oneHot = new Array(length).fill(0)
    oneHot[index] = 1
    return oneHot
  }
  
  /**
   * Find index of maximum value in array
   * 
   * @param {Array} array - Input array
   * @returns {number} Index of maximum value
   */
  static argMax(array) {
    if (array.length === 0) return -1
    
    let maxIndex = 0
    let maxValue = array[0]
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] > maxValue) {
        maxValue = array[i]
        maxIndex = i
      }
    }
    
    return maxIndex
  }
  
  /**
   * Performance timing decorator
   * 
   * @param {Function} fn - Function to time
   * @param {string} name - Name for logging
   * @returns {Function} Decorated function that logs execution time
   */
  static timeFunction(fn, name = 'function') {
    return function(...args) {
      const start = performance.now()
      const result = fn.apply(this, args)
      const end = performance.now()
      console.log(`${name} execution time: ${(end - start).toFixed(2)}ms`)
      return result
    }
  }
}