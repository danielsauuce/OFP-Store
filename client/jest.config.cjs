module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.m?jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'json'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFiles: ['<rootDir>/jest.polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  silent: true,

  // Reclaim memory between test files to prevent OOM
  workerIdleMemoryLimit: '512MB',
};
