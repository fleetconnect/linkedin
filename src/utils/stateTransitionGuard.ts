import { LeadState } from '../types';

/**
 * State Transition Guard
 *
 * Enforces valid state transitions to prevent silent corruption at scale.
 *
 * Rules:
 * 1. No skipping states (must follow valid paths)
 * 2. Terminal states are protected (BOOKED, CLOSED, LOST)
 * 3. Idempotent transitions (same state = no-op, not error)
 */

/**
 * Valid state transitions map
 * Key: current state
 * Value: array of valid next states
 */
export const VALID_TRANSITIONS: Record<LeadState, LeadState[]> = {
  [LeadState.NEW]: [
    LeadState.QUALIFIED,
    LeadState.LOST
  ],

  [LeadState.QUALIFIED]: [
    LeadState.READY_TO_SEND,
    LeadState.LOST
  ],

  [LeadState.READY_TO_SEND]: [
    LeadState.CONTACTED,
    LeadState.LOST
  ],

  [LeadState.CONTACTED]: [
    LeadState.REPLIED,
    LeadState.LOST
  ],

  [LeadState.REPLIED]: [
    LeadState.INTERESTED,
    LeadState.READY_TO_SEND,  // Neutral replies can trigger follow-ups
    LeadState.LOST             // Negative replies
  ],

  [LeadState.INTERESTED]: [
    LeadState.BOOKED,
    LeadState.READY_TO_SEND,  // Follow-up after interested reply
    LeadState.LOST
  ],

  // Terminal states
  [LeadState.BOOKED]: [
    LeadState.CLOSED,  // Allow booking → closed
    LeadState.LOST     // Allow cancellation
  ],

  [LeadState.CLOSED]: [
    // Truly terminal - no transitions out
  ],

  [LeadState.LOST]: [
    // Truly terminal - no transitions out
  ]
};

/**
 * Terminal states that should be protected
 */
export const TERMINAL_STATES: LeadState[] = [
  LeadState.BOOKED,
  LeadState.CLOSED,
  LeadState.LOST
];

/**
 * Truly terminal states with no valid transitions out
 */
export const TRULY_TERMINAL_STATES: LeadState[] = [
  LeadState.CLOSED,
  LeadState.LOST
];

/**
 * Validation result
 */
export interface TransitionValidation {
  valid: boolean;
  reason?: string;
  warning?: string;
}

/**
 * Validate a state transition
 */
export function validateTransition(
  currentState: LeadState,
  nextState: LeadState,
  options?: {
    allowIdempotent?: boolean;  // Allow same state transitions (default: true)
    allowTerminalOverride?: boolean;  // Allow overriding terminal states (default: false)
  }
): TransitionValidation {
  const allowIdempotent = options?.allowIdempotent !== false;  // Default true
  const allowTerminalOverride = options?.allowTerminalOverride === true;  // Default false

  // Idempotent check: same state transition is a no-op
  if (currentState === nextState) {
    if (allowIdempotent) {
      return {
        valid: true,
        warning: `Idempotent transition: ${currentState} → ${nextState} (no-op)`
      };
    } else {
      return {
        valid: false,
        reason: `Cannot transition to same state: ${currentState}`
      };
    }
  }

  // Terminal state protection
  if (TRULY_TERMINAL_STATES.includes(currentState)) {
    if (!allowTerminalOverride) {
      return {
        valid: false,
        reason: `Cannot transition from terminal state ${currentState} to ${nextState}. State is final.`
      };
    } else {
      return {
        valid: true,
        warning: `⚠️  Overriding terminal state ${currentState} → ${nextState} (dangerous!)`
      };
    }
  }

  // Check if transition is in valid transitions map
  const validNextStates = VALID_TRANSITIONS[currentState];

  if (!validNextStates || validNextStates.length === 0) {
    return {
      valid: false,
      reason: `No valid transitions from ${currentState}`
    };
  }

  if (!validNextStates.includes(nextState)) {
    return {
      valid: false,
      reason: `Invalid transition: ${currentState} → ${nextState}. Valid next states: ${validNextStates.join(', ')}`
    };
  }

  // Valid transition
  return {
    valid: true
  };
}

/**
 * Get valid next states for a given state
 */
export function getValidNextStates(state: LeadState): LeadState[] {
  return VALID_TRANSITIONS[state] || [];
}

/**
 * Check if a state is terminal
 */
export function isTerminalState(state: LeadState): boolean {
  return TERMINAL_STATES.includes(state);
}

/**
 * Check if a state is truly terminal (no transitions out)
 */
export function isTrulyTerminalState(state: LeadState): boolean {
  return TRULY_TERMINAL_STATES.includes(state);
}

/**
 * State transition error
 */
export class StateTransitionError extends Error {
  constructor(
    public currentState: LeadState,
    public attemptedState: LeadState,
    public reason: string
  ) {
    super(`State transition error: ${currentState} → ${attemptedState}. ${reason}`);
    this.name = 'StateTransitionError';
  }
}

/**
 * Assert a transition is valid (throws if not)
 */
export function assertValidTransition(
  currentState: LeadState,
  nextState: LeadState,
  options?: {
    allowIdempotent?: boolean;
    allowTerminalOverride?: boolean;
  }
): void {
  const validation = validateTransition(currentState, nextState, options);

  if (!validation.valid) {
    throw new StateTransitionError(
      currentState,
      nextState,
      validation.reason || 'Unknown error'
    );
  }

  // Log warnings if present
  if (validation.warning) {
    console.warn(`⚠️  State transition warning: ${validation.warning}`);
  }
}
