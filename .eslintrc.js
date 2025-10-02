module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // Custom crash prevention rules
    'no-unguarded-setinterval': 'error',
    'no-unguarded-requestanimationframe': 'error',
    'require-cleanup-handlers': 'error',
    'require-resource-limits': 'error',
    'require-error-boundaries': 'error',
  },
  overrides: [
    {
      files: ['*.js'],
      plugins: ['stellar-warfare-crash-prevention'],
    },
  ],
};
