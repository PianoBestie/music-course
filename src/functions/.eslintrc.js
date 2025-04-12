module.exports = {
    root: true,
    env: {
      node: true,
      commonjs: true,
      es2021: true,
    },
    extends: ["eslint:recommended", "google"],
    parserOptions: {
      ecmaVersion: 2021,
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "quotes": ["error", "double"],
      "require-jsdoc": "off",
    },
  };