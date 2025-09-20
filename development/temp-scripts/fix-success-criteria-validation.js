
const fs = require('fs');

const testFile = '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-validation.test.js';

console.log('Fixing undefined variables in success-criteria-validation.test.js...');

let content = fs.readFileSync(testFile, 'utf8');

// Common patterns to fix
const fixes = [
  // Template variables
  { from: /\bdependencyTemplate\b/g, to: '_dependencyTemplate' },
  { from: /\bmainTemplate\b/g, to: '_mainTemplate' },
  { from: /\bdependencyCriteria\b/g, to: '_dependencyCriteria' },
  { from: /\bmainCriteria\b/g, to: '_mainCriteria' },

  // Status variables
  { from: /expect\(status\./g, to: 'expect(status.' },
  { from: /const _status = /g, to: 'const status = ' },

  // Environment criteria
  { from: /\bdevelopmentCriteria\b/g, to: '_developmentCriteria' },
  { from: /\bproductionCriteria\b/g, to: '_productionCriteria' },
  { from: /\bdevCriterion\b/g, to: '_devCriterion' },
  { from: /\bprodCriterion\b/g, to: '_prodCriterion' },

  // Project criteria
  { from: /\bwebAppCriteria\b/g, to: '_webAppCriteria' },
  { from: /\bapiCriteria\b/g, to: '_apiCriteria' },
  { from: /\bwebAppCriterion\b/g, to: '_webAppCriterion' },
  { from: /\bapiCriterion\b/g, to: '_apiCriterion' },

  // Priority criteria
  { from: /\bprioritizedCriteria\b/g, to: '_prioritizedCriteria' },
  { from: /\bcriticalAndHigh\b/g, to: '_criticalAndHigh' },
  { from: /\bcriticalOnly\b/g, to: '_criticalOnly' },
  { from: /\bsecurityCriteria\b/g, to: '_securityCriteria' },
  { from: /\bhighPriorityPerformance\b/g, to: '_highPriorityPerformance' },

  // Organization criteria
  { from: /\borgCriteria\b/g, to: '_orgCriteria' },
  { from: /\bteamCriteria\b/g, to: '_teamCriteria' },
  { from: /\bprojectCriteria\b/g, to: '_projectCriteria' },

  // Validation criteria
  { from: /\bvalidationCriteria\b/g, to: '_validationCriteria' },
  { from: /\bvalidationResult\b/g, to: '_validationResult' },
  { from: /\bbuildResult\b/g, to: '_buildResult' },
  { from: /\btestResult\b/g, to: '_testResult' },
  { from: /\blintResult\b/g, to: '_lintResult' },

  // Results and status that shouldn't have underscore
  { from: /const _(\w*Result) = (\w+)\.results\.find/g, to: 'const $1 = $2.results.find' },
  { from: /expect\(_(\w*Result)\)/g, to: 'expect($1)' },
  { from: /const _(\w*Ids) = /g, to: 'const $1 = ' },
  { from: /expect\(_(\w*Ids)\)/g, to: 'expect($1)' },
  { from: /(\w+)\.forEach\(\(_(\w*Id)\) =>/g, to: '$1.forEach(($2) =>' },
];

// Apply all fixes
fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

// Write back the fixed content
fs.writeFileSync(testFile, content, 'utf8');

console.log('Fixed undefined variables in success-criteria-validation.test.js');
