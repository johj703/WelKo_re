const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // 성능 측정 관련 설정
  verbose: true,
  logHeapUsage: true,
  detectOpenHandles: true,
  testTimeout: 15000, // lazy loading 때문에 시간 여유

  // App Router 경로 매핑
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // 테스트 파일 패턴
  testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/*.(test|spec).(js|jsx|ts|tsx)'],

  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.{js,jsx,ts,tsx}',
    '!src/app/**/loading.{js,jsx,ts,tsx}'
  ],

  // 성능 리포터 추가
  reporters: ['default', ['<rootDir>/__tests__/utils/performence-reporter.js']]
};

module.exports = createJestConfig(customJestConfig);
