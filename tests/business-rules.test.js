import { canApplicantApplyToJob } from '../src/controller/applicant.controller.js';
import { validateJobPayload } from '../src/controller/job.controller.js';

describe('Business rules', () => {
  it('closed jobs are not allowed for new applications', () => {
    expect(canApplicantApplyToJob({ isOpen: false })).toBe(false);
    expect(canApplicantApplyToJob({ isOpen: true })).toBe(true);
  });

  it('job payload validation catches missing required fields', () => {
    const validation = validateJobPayload({
      title: 'Backend Engineer',
      description: 'Build services',
      numberOfPositions: 2,
      jobStages: [{ name: 'Screening' }]
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);

    const invalid = validateJobPayload({
      title: 'Backend Engineer',
      description: 'Build services',
      numberOfPositions: 0,
      jobStages: []
    });

    expect(invalid.valid).toBe(false);
    expect(Array.isArray(invalid.errors)).toBe(true);
  });
});
