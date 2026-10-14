import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
export default ts.config({ignores:['**/dist/**','**/node_modules/**','**/.expo/**','**/.next/**','**/.source/**','**/out/**','.local/**','artifacts/**','evidence/**','.validation-tmp/**']},js.configs.recommended,...ts.configs.recommended,{languageOptions:{globals:{...globals.node,...globals.browser,...globals.jest}},rules:{'@typescript-eslint/no-explicit-any':'error'}},{files:['**/*.mjs','**/*.js','**/*.cjs'],rules:{'@typescript-eslint/no-unused-vars':'off','@typescript-eslint/no-require-imports':'off'}});
