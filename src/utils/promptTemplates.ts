import { Intent, Sentiment, LeadState } from '../types';

export const INTENT_CLASSIFICATION_PROMPT = `You are an expert at analyzing LinkedIn message replies to classify the recipient's intent and sentiment.

Your task is to analyze a LinkedIn message reply and determine:
1. **Intent**: What action or interest level the recipient is showing
   - "interested": Shows genuine interest, asks questions, wants to learn more
   - "booked": Confirms a meeting, agrees to a call, commits to next steps
   - "neutral": Polite acknowledgment, non-committal, or unclear intent
   - "negative": Not interested, declines, or shows resistance

2. **Sentiment**: The emotional tone of the message
   - "positive": Friendly, enthusiastic, warm tone
   - "neutral": Professional, matter-of-fact, no strong emotion
   - "negative": Dismissive, cold, annoyed, or frustrated

3. **Confidence**: How certain you are about this classification (0.0 to 1.0)
   - Use 0.9-1.0 for very clear signals
   - Use 0.7-0.89 for reasonably clear signals
   - Use 0.5-0.69 for ambiguous cases
   - Use below 0.5 for very unclear messages

4. **Next State**: The recommended lead state transition
   - "REPLIED": Generic reply received, no clear intent
   - "INTERESTED": Shows interest, wants more information
   - "BOOKED": Meeting/call confirmed

## Context:
{{CONTEXT}}

## Message to Classify:
"{{MESSAGE}}"

## Instructions:
Analyze the message carefully considering:
- Explicit statements (e.g., "Yes, let's schedule a call" → booked)
- Questions about the offer (e.g., "Tell me more about..." → interested)
- Timing indicators (e.g., "Maybe later" → neutral, "Not interested" → negative)
- Tone and language choice

Respond ONLY with a valid JSON object in this exact format:
{
  "intent": "interested" | "booked" | "neutral" | "negative",
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.85,
  "next_state": "REPLIED" | "INTERESTED" | "BOOKED",
  "reasoning": "Brief explanation of your classification"
}`;

export const buildClassificationPrompt = (
  message: string,
  context?: {
    conversationHistory?: string[];
    leadName?: string;
    previousState?: LeadState;
  }
): string => {
  let contextSection = '';

  if (context?.leadName) {
    contextSection += `Lead Name: ${context.leadName}\n`;
  }

  if (context?.previousState) {
    contextSection += `Previous Lead State: ${context.previousState}\n`;
  }

  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    contextSection += `\nConversation History:\n`;
    context.conversationHistory.forEach((msg, idx) => {
      contextSection += `${idx + 1}. ${msg}\n`;
    });
  }

  if (!contextSection) {
    contextSection = 'No additional context provided.';
  }

  return INTENT_CLASSIFICATION_PROMPT
    .replace('{{CONTEXT}}', contextSection)
    .replace('{{MESSAGE}}', message);
};
