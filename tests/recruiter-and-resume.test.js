import { validateResumeUrl } from '../src/controller/applicant.controller.js';

describe('Resume URL validation', () => {
  it('valid resume URLs are accepted', () => {
    expect(validateResumeUrl('https://example.com/resume.pdf')).toBe(true);
    expect(validateResumeUrl('http://example.com/resume.pdf')).toBe(true);
  });

  it('invalid resume URLs are rejected', () => {
    expect(validateResumeUrl('')).toBe(false);
    expect(validateResumeUrl('not-a-url')).toBe(false);
    expect(validateResumeUrl('ftp://example.com/resume.pdf')).toBe(false);
  });
});
