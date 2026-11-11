import { validateResumeFile } from '../src/controller/applicant.controller.js';

describe('Resume file validation', () => {
  it('valid resume files pass validation', () => {
  const result = validateResumeFile({
    size: 1024,
    mimetype: 'application/pdf'
  });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('oversized resume files are rejected', () => {
    const result = validateResumeFile({
      size: 3 * 1024 * 1024,
      mimetype: 'application/pdf'
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('2MB');
  });

  it('unsupported resume types are rejected', () => {
    const result = validateResumeFile({
      size: 1024,
      mimetype: 'image/png'
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('PDF, DOC, or DOCX');
  });
});
