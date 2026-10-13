import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
export default ts.config({ignores:['**/dist/**','**/node_modules/**','**/.expo/**','artifacts/**','evidence/**']},js.configs.recommended,...ts.configs.recommended,{languageOptions:{globals:{...globals.node,...globals.browser}},rules:{'@typescript-eslint/no-explicit-any':'error'}},{files:['**/*.mjs','**/*.js','**/*.cjs'],rules:{'@typescript-eslint/no-unused-vars':'off','@typescript-eslint/no-require-imports':'off'}});
