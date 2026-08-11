import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    ignores: ['.angular/**', 'coverage/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      eslintConfigPrettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@angular-eslint/prefer-inject': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      eslintConfigPrettier,
    ],
    rules: {
      '@angular-eslint/template/alt-text': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
    },
  },

  // Feature dependency boundaries (docs/diagrams/frontend-refactor-plan.md, Phase 5).
  // `core/` and `shared/` must never import a feature. Features may depend on `core`,
  // `shared`, and another feature's declared public surface only:
  // - `features/vehicle/models/**` and `features/vehicle/ui/**` are shared record
  //   contracts and domain-specific reusable UI (see the plan's structure section).
  // - `features/vehicle`'s barrel (`index.ts`) is the feature's public API for stateful
  //   symbols such as `VehicleStore` and `VehicleForm`.
  // Everything else under a feature folder is internal to that feature.
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../features/**', '../../../features/**'],
              message:
                'core/ must not depend on feature code; the app shell owns no feature route knowledge.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../features/**', '../../../features/**'],
              message:
                'shared/ must not depend on feature code; it only contains generic UI and pure utilities.',
            },
            {
              group: ['../../core/**', '../../../core/**'],
              message:
                'shared/ must not depend on core/; core may depend on shared, not the reverse.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/features/dashboard/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../vehicle/vehicle-store',
              message:
                "Import VehicleStore from '../vehicle' (the vehicle feature's public API) instead.",
            },
            {
              name: '../vehicle/fuel-store',
              message: 'fuel-store is internal to the vehicle feature.',
            },
            {
              name: '../vehicle/maintenance-store',
              message: 'maintenance-store is internal to the vehicle feature.',
            },
          ],
          patterns: [
            {
              group: [
                '../vehicle/vehicle-dashboard/**',
                '../vehicle/vehicle-shell/**',
                '../vehicle/vehicle-form/**',
                '../vehicle/services/**',
                '../vehicle/utils/**',
                '../vehicle/ui/**',
              ],
              message:
                "dashboard may depend only on features/vehicle's public API ('../vehicle') and features/vehicle/models.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/features/share/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../vehicle',
              message:
                'features/share renders public, unauthenticated data; it must not depend on the authenticated vehicle store or form.',
            },
            {
              name: '../vehicle/vehicle-store',
              message: 'features/share must not depend on the authenticated VehicleStore.',
            },
            {
              name: '../vehicle/fuel-store',
              message: 'features/share must not depend on the authenticated FuelStore.',
            },
            {
              name: '../vehicle/maintenance-store',
              message: 'features/share must not depend on the authenticated MaintenanceStore.',
            },
          ],
          patterns: [
            {
              group: [
                '../vehicle/vehicle-dashboard/**',
                '../vehicle/vehicle-shell/**',
                '../vehicle/vehicle-form/**',
                '../vehicle/services/**',
                '../vehicle/utils/**',
              ],
              message:
                'features/share may depend only on features/vehicle/models and features/vehicle/ui (shared record contracts and presentational UI).',
            },
          ],
        },
      ],
    },
  }
);
