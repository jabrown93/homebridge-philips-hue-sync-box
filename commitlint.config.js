export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [2, 'never', '500'],
    'body-max-length': [2, 'never', '2000'],
    'footer-max-line-length': [2, 'never', '500'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
