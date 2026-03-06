import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['artifacts/**', 'docs/**', 'node_modules/**'],
  },
  {
    ...js.configs.recommended,
    files: ['background.js', 'content.js', 'microphone.js', 'popup.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    ...js.configs.recommended,
    files: ['eleven_audio_transcribe.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
];
