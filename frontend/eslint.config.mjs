import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // disallowTypeAnnotations off: vi.mock's importOriginal<typeof import(...)>
      // pattern needs inline import() types.
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
      'no-console': 'error',
    },
  },
  {
    ignores: ['dist/', 'coverage/'],
  },
);
