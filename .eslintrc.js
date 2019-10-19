module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    'plugin:vue/recommended',
    "plugin:prettier/recommended",
  ],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": ["warn", {
      argsIgnorePattern: "^_"
    }],
    "no-console": ["warn", {
      allow: ["warn", "error", "info"]
    }]
  }
};