import { FSM } from '../src/utils/applicationFsm.js';

describe('Application FSM workflow', () => {
  it('advances to the next stage when a valid transition exists', () => {
    const result = FSM({
      currentStageIndex: 0,
      jobStages: [{ name: 'Screening' }, { name: 'Interview' }],
      terminalStatus: null,
      action: 'NEXT_STAGE'
    });

    expect(result.nextStageIndex).toBe(1);
    expect(result.terminalStatus).toBeNull();
  });

  it('marks an application as hired when the recruiter selects HIRE', () => {
    const result = FSM({
      currentStageIndex: 1,
      jobStages: [{ name: 'Screening' }, { name: 'Interview' }],
      terminalStatus: null,
      action: 'HIRE'
    });

    expect(result.terminalStatus).toBe('HIRED');
  });

  it('marks an application as rejected when the recruiter rejects it', () => {
    const result = FSM({
      currentStageIndex: 0,
      jobStages: [{ name: 'Screening' }, { name: 'Interview' }],
      terminalStatus: null,
      action: 'REJECT'
    });

    expect(result.terminalStatus).toBe('REJECTED');
  });

  it('marks an application as withdrawn when the applicant withdraws it', () => {
    const result = FSM({
      currentStageIndex: 1,
      jobStages: [{ name: 'Screening' }, { name: 'Interview' }],
      terminalStatus: null,
      action: 'WITHDRAW'
    });

    expect(result.terminalStatus).toBe('WITHDRAWN');
  });

  it('throws when attempting a transition after the application reaches a terminal state', () => {
    expect(() => {
      FSM({
        currentStageIndex: 1,
        jobStages: [{ name: 'Screening' }, { name: 'Interview' }],
        terminalStatus: 'HIRED',
        action: 'NEXT_STAGE'
      });
    }).toThrow(/terminal/i);
  });

  it('throws when no next stage is available in the job pipeline', () => {
    expect(() => {
      FSM({
        currentStageIndex: 1,
        jobStages: [{ name: 'Screening' }, { name: 'Interview' }],
        terminalStatus: null,
        action: 'NEXT_STAGE'
      });
    }).toThrow(/no next stage|next stage/i);
  });

  it('throws for unsupported FSM actions', () => {
    expect(() => {
      FSM({
        currentStageIndex: 0,
        jobStages: [{ name: 'Screening' }],
        terminalStatus: null,
        action: 'UNKNOWN_ACTION'
      });
    }).toThrow(/invalid.*action|invalid fsm action/i);
  });
});
