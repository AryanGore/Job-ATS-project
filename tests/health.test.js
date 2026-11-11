import request from 'supertest';
import { app } from '../src/app.js';
import { validateRequiredEnv } from '../src/config/env.js';
import { validateJobPayload } from '../src/controller/job.controller.js';

describe('Health endpoint', () => {
  it('returns 200 and a healthy payload', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/healthy/i);
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('returns a consistent JSON response for unknown routes', async () => {
    const response = await request(app).post('/api/v1/auth/recruiter/signup');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route not found.',
      errors: []
    });
  });
});

describe('Environment validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.PORT = '8000';
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('accepts a valid runtime configuration', () => {
    expect(() => validateRequiredEnv()).not.toThrow();
  });

  it('rejects missing required environment variables', () => {
    delete process.env.JWT_REFRESH_SECRET;

    expect(() => validateRequiredEnv()).toThrow(/Missing required environment variables/i);
  });
});

describe('Job payload validation', () => {
  it('accepts a valid job payload', () => {
    const result = validateJobPayload({
      title: 'Backend Engineer',
      description: 'Build services and APIs',
      jobStages: [{ name: 'Resume Review' }, { name: 'Interview' }],
      numberOfPositions: 3
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects invalid job payloads', () => {
    const result = validateJobPayload({
      title: '',
      description: 'Build services and APIs',
      jobStages: [],
      numberOfPositions: 0
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => /title|stage|positions/i.test(error))).toBe(true);
  });
});
