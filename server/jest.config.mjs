/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json', 'node'],
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },

  // Set env vars before integration tests import app.js
  setupFiles: ['./__tests__/integration/setup.js'],
};

export default config;
