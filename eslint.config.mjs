import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  // ⬅️ Tambahan ignore di sini
  {
    ignores: [
      'lib/generated/prisma/**',
      '.next/**',
      'node_modules/**',
      'dist/**',
    ],
  },

  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),

  // ⬇️ Override rules khusus file Prisma auto-generated
  {
    files: ['lib/generated/prisma/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]

export default eslintConfig
