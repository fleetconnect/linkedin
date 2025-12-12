/**
 * Simple Control Knobs
 * Non-technical controls that map to agent behavior
 */

export interface ControlKnobs {
  aggressiveness: 1 | 2 | 3 | 4 | 5;
  personalization_depth: 'light' | 'standard' | 'deep';
  brand_voice: 'professional' | 'friendly' | 'technical' | 'bold';
  risk_tolerance: 'very_conservative' | 'conservative' | 'balanced' | 'aggressive';
  research_budget: 'minimal' | 'standard' | 'comprehensive';
}

export class ControlSystem {
  /**
   * Convert knobs to agent parameters
   */
  static toAgentParams(knobs: ControlKnobs): {
    message_variations: number;
    follow_up_frequency: number;
    personalization_tokens: number;
    tone_temperature: number;
    safety_multiplier: number;
    research_depth: number;
  } {
    return {
      // Aggressiveness affects follow-up frequency
      message_variations: knobs.aggressiveness,
      follow_up_frequency: knobs.aggressiveness * 0.5,

      // Personalization depth
      personalization_tokens: {
        light: 3,
        standard: 7,
        deep: 15,
      }[knobs.personalization_depth],

      // Brand voice affects tone
      tone_temperature: {
        professional: 0.3,
        friendly: 0.7,
        technical: 0.4,
        bold: 0.9,
      }[knobs.brand_voice],

      // Risk tolerance
      safety_multiplier: {
        very_conservative: 2.0,
        conservative: 1.5,
        balanced: 1.0,
        aggressive: 0.7,
      }[knobs.risk_tolerance],

      // Research budget
      research_depth: {
        minimal: 1,
        standard: 3,
        comprehensive: 7,
      }[knobs.research_budget],
    };
  }
}
