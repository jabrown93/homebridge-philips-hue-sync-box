import base from '@jabrown93/dev-config/eslint';

export default [
  ...base,
  {
    ignores: [
      '**/homebridge-ui',
      '**/dist',
      'package-lock.json',
      'package.json',
    ],
  },
];
