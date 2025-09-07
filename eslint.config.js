/**
 * ESLint 9 Flat Configuration
 *
 * Zero-tolerance ESLint configuration for TaskManager Node.js system.
 * Focused on CommonJS patterns, security, and code quality standards.
 */

const js = require("@eslint/js");
const globals = require("globals");
const nodePlugin = require("eslint-plugin-n");
const securityPlugin = require("eslint-plugin-security");

module.exports = [
  // Base recommended configuration
  js.configs.recommended,

  // Security plugin recommended rules
  securityPlugin.configs.recommended,

  // Node.js plugin recommended rules
  nodePlugin.configs["flat/recommended-script"],

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        // Jest globals for test files
        ...globals.jest,
      },
    },

    plugins: {
      n: nodePlugin,
      security: securityPlugin,
    },

    rules: {
      // === SEMICOLONS & QUOTES ===
      semi: ["error", "always"],
      quotes: [
        "error",
        "single",
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],

      // === CODE QUALITY ===
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "no-console": "warn", // TaskManager legitimately uses console
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // === ASYNC/AWAIT PATTERNS ===
      "require-await": "error",
      "no-async-promise-executor": "error",
      "no-await-in-loop": "warn",
      "no-promise-executor-return": "error",

      // === COMMONJS MODULES ===
      "n/no-unpublished-require": "off", // Allow dev dependencies
      "n/no-missing-require": "error",
      "n/no-extraneous-require": "error",

      // === SECURITY RULES ===
      "security/detect-object-injection": "warn", // May need adjustment for TaskManager
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",

      // === SPACING & FORMATTING ===
      indent: [
        "error",
        2,
        {
          SwitchCase: 1,
          VariableDeclarator: 1,
          outerIIFEBody: 1,
        },
      ],
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "comma-dangle": ["error", "always-multiline"],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "computed-property-spacing": ["error", "never"],

      // === ERROR HANDLING ===
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",
      "no-return-await": "error",

      // === BEST PRACTICES ===
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
    },
  },

  // Configuration specific to test files
  {
    files: ["**/*.test.js", "**/*.spec.js", "**/test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Relax some rules for tests
      "no-console": "off",
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      "n/no-unpublished-require": "off",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      ".node-modules-backup/**", // Backup directories
      "coverage/**",
      "dist/**",
      "build/**",
      "*.min.js",
      "**/*.config.js", // Ignore config files from strict linting
      "development/reports/**", // Generated reports
      "development/research-reports/**", // Research output
      "logs/**", // Log files and directories
      "**/*.log", // Individual log files
      "**/*.json.backup*", // Backup JSON files
    ],
  },
];
