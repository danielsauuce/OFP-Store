const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
  // babel-plugin-react-compiler is extremely memory-intensive and causes
  // heap-out-of-memory (OOM) crashes during Jest runs.  It is only needed
  // at build time (Vite already handles it via @vitejs/plugin-react), so
  // we exclude it when NODE_ENV === 'test'.
  plugins: isTest
    ? [
        // Transform import.meta.env.VITE_* references for Jest
        function importMetaPlugin() {
          return {
            visitor: {
              MemberExpression(path) {
                const node = path.node;
                // Match import.meta.env.VITE_*
                if (
                  node.object?.object?.type === 'MetaProperty' &&
                  node.object?.property?.name === 'env' &&
                  node.property?.name?.startsWith('VITE_')
                ) {
                  const envName = node.property.name;
                  path.replaceWithSourceString(
                    `(globalThis.import?.meta?.env?.${envName} || process.env.${envName})`
                  );
                }
              },
            },
          };
        },
      ]
    : ['babel-plugin-react-compiler'],
};
