/**
 * Babel Configuration for Jest Testing
 *
 * Configures Babel to transform ES modules and modern JavaScript features
 * for compatibility with Jest testing environment.
 */

module.exports = {,,
    presets: [
    [
      '@babel/preset-env',
      {,,
    targets: {,,
    node: '18',
        },
        modules: 'commonjs',
      }
  ],
  ],
  env: {,,
    test: {,,
    presets: [
        [
          '@babel/preset-env',
          {,,
    targets: {,,
    node: 'current',
            },
            modules: 'commonjs',
          }
  ],
      ],
    }
  }
  };
