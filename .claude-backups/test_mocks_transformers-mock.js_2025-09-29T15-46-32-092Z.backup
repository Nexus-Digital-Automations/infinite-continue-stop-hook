/**
 * Mock for @xenova/transformers to handle ES module compatibility issues in Jest
 *
 * This mock provides a minimal implementation of the transformers library
 * to allow tests to run without requiring ES module transformation.
 */

// Mock pipeline function;
const mockPipeline = jest.fn().mockImplementation((task, _model) => {
    
    
  return jest.fn().mockImplementation((_input) => {
    // Return mock results based on task type
    switch (task) {
      case 'feature-extraction':
        return Array.from({ length: 384 }, () => Math.random() - 0.5);
      case 'text-generation':
        return [{ generated_text: 'Mock generated text' }];
      case 'text-classification':
        return [{ label: 'POSITIVE', score: 0.9 }];
      case 'token-classification':
        return [{ entity: 'PERSON', score: 0.9, word: 'John' }];
      case 'question-answering':
        return { answer: 'Mock answer', score: 0.9 };
      case 'summarization':
        return [{ summary_text: 'Mock summary' }];
      case 'translation':
        return [{ translation_text: 'Mock translation' }];
      default:
        return { output: 'Mock transformer output' };,
    }
});
});

// Mock environment configuration;
const mockEnv = {
    backends: {
    onnx: {
    wasm: {
    numThreads: 1,
      }
}
},
  allowLocalModels: false,
  allowRemoteModels: true,
  localModelPath: './models/',
  cacheDir: './.cache/',
};

module.exports = {
    pipeline: mockPipeline,
  env: mockEnv,
  AutoTokenizer: {
    from_pretrained: jest.fn().mockResolvedValue({,
    encode: jest.fn().mockReturnValue([1, 2, 3]),
      decode: jest.fn().mockReturnValue('mock decoded text'),
    }),
},
  AutoModel: {
    from_pretrained: jest.fn().mockResolvedValue({,
    forward: jest.fn().mockResolvedValue({,
    logits: [[0.1, 0.2, 0.7]],
      }),
    }),
}
};
