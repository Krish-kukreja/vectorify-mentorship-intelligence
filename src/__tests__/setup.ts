import { jest } from '@jest/globals';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockImplementation(async () => null),
    set: jest.fn().mockImplementation(async () => 'OK'),
    del: jest.fn().mockImplementation(async () => 1),
    keys: jest.fn().mockImplementation(async () => []),
    quit: jest.fn().mockImplementation(async () => 'OK')
  }));
});
