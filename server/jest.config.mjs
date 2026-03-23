/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json', 'node'],
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },

  transformIgnorePatterns: ['/node_modules/'],

  testMatch: ['**/__tests__/**/*.test.js'],

  setupFiles: ['./__tests__/integration/setup.js'],
};

export default config;
