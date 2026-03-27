const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
  // babel-plugin-react-compiler is extremely memory-intensive and causes
  // heap-out-of-memory (OOM) crashes during Jest runs.  It is only needed
  // at build time (Vite already handles it via @vitejs/plugin-react), so
  // we exclude it when NODE_ENV === 'test'.
  plugins: isTest ? [] : ['babel-plugin-react-compiler'],
};
