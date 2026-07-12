const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'supabase/functions/*'],
  },
  {
    rules: {
      // The audio context used to be rebuilt five times a second because a
      // useMemo listed status fields it did not actually expose. Keep this an
      // error so that class of bug is caught before it reaches a screen.
      'react-hooks/exhaustive-deps': 'error',
      // React-Compiler-era rules. They fire on patterns this codebase uses
      // deliberately and widely (Animated.Value kept in a ref, providers that
      // bootstrap their state from an effect). Cleaning those up is its own
      // refactor, so they stay visible as warnings rather than blocking `check`.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'no-unused-vars': [
        'warn',
        { args: 'none', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
]);
