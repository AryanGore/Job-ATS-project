import { jest } from '@jest/globals';
import { applicantSignup, recruiterSignup } from '../src/controller/auth.controller.js';
import { Applicant } from '../src/models/applicant.model.js';
import { Recruiter } from '../src/models/recruiter.model.js';

describe('Auth flow', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applicant signup creates a valid applicant and returns tokens', async () => {
    const applicant = {
      _id: 'app-123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      refreshToken: 'refresh-token',
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(Applicant, 'findOne').mockResolvedValue(null);
    jest.spyOn(Applicant, 'create').mockResolvedValue(applicant);
    jest.spyOn(Applicant, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'app-123',
        name: 'Jane Doe',
        email: 'jane@example.com'
      })
    });

    const req = {
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass123'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await applicantSignup(req, res);

    expect(Applicant.findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
    expect(Applicant.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash: 'StrongPass123'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.objectContaining({ httpOnly: true }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 201,
      data: expect.objectContaining({
        token: expect.any(String),
        applicant: expect.objectContaining({ email: 'jane@example.com' })
      })
    }));
  });

  it('recruiter signup creates a valid recruiter and returns tokens', async () => {
    const recruiter = {
      _id: 'rec-123',
      name: 'Jane Recruiter',
      email: 'recruiter@example.com',
      CompanyName: 'Example Corp',
      refreshToken: 'refresh-token',
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(Recruiter, 'findOne').mockResolvedValue(null);
    jest.spyOn(Recruiter, 'create').mockResolvedValue(recruiter);

    const req = {
      body: {
        name: 'Jane Recruiter',
        email: 'recruiter@example.com',
        password: 'StrongPass123',
        CompanyName: 'Example Corp'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await recruiterSignup(req, res);

    expect(Recruiter.findOne).toHaveBeenCalledWith({ email: 'recruiter@example.com' });
    expect(Recruiter.create).toHaveBeenCalledWith({
      name: 'Jane Recruiter',
      email: 'recruiter@example.com',
      CompanyName: 'Example Corp',
      passwordHash: 'StrongPass123'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.objectContaining({ httpOnly: true }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 201,
      data: expect.objectContaining({
        token: expect.any(String),
        recruiter: expect.objectContaining({ email: 'recruiter@example.com' })
      })
    }));
  });
});
