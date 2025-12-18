/**
 * Stateless reply classification tool
 * Takes reply text and returns classification/intent
 *
 * This is a placeholder - replace with your actual classification logic
 * (LLM, NLP model, keyword matching, etc.)
 */
export function classifyReply(replyText: string, context?: any): any {
  // Placeholder implementation
  // In production, this would:
  // - Use LLM or NLP to classify intent
  // - Detect sentiment
  // - Identify questions, objections, interest signals
  // - Extract key entities (dates, times, topics)

  if (!replyText || replyText.trim() === '') {
    return {
      intent: 'unknown',
      sentiment: 'neutral',
      confidence: 0,
    };
  }

  const text = replyText.toLowerCase();

  // Simple keyword-based classification (replace with ML model)
  const intent = detectIntent(text);
  const sentiment = detectSentiment(text);
  const nextAction = determineNextAction(intent, sentiment);
  const entities = extractEntities(text);

  return {
    intent,
    sentiment,
    next_action: nextAction,
    entities,
    confidence: 0.75, // Placeholder confidence score
    classified_at: new Date().toISOString(),
    raw_text: replyText,
  };
}

function detectIntent(text: string): string {
  // Placeholder - use LLM or trained model in production
  const intents: Record<string, string[]> = {
    interested: [
      'yes',
      'sure',
      'interested',
      'tell me more',
      'sounds good',
      'let\'s chat',
      'available',
    ],
    not_interested: [
      'no thanks',
      'not interested',
      'no thank you',
      'not right now',
      'pass',
      'unsubscribe',
    ],
    request_info: [
      'more information',
      'tell me about',
      'what do you',
      'how does',
      'can you explain',
    ],
    scheduling: [
      'schedule',
      'calendar',
      'meeting',
      'call',
      'available on',
      'free at',
      'next week',
    ],
    objection: [
      'already have',
      'too expensive',
      'not a good fit',
      'wrong timing',
      'budget',
    ],
    question: ['?', 'what', 'how', 'why', 'when', 'where', 'who'],
  };

  for (const [intent, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return intent;
      }
    }
  }

  return 'unknown';
}

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  // Placeholder - use sentiment analysis model in production
  const positiveWords = [
    'yes',
    'great',
    'good',
    'interested',
    'excited',
    'perfect',
    'excellent',
  ];
  const negativeWords = [
    'no',
    'not',
    'never',
    'won\'t',
    'can\'t',
    'don\'t',
    'stop',
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (text.includes(word)) positiveCount++;
  }

  for (const word of negativeWords) {
    if (text.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function determineNextAction(intent: string, sentiment: string): string {
  // Determine what action to take based on classification
  if (intent === 'interested' || intent === 'scheduling') {
    return 'book_meeting';
  }

  if (intent === 'request_info') {
    return 'send_info';
  }

  if (intent === 'not_interested') {
    return 'mark_closed';
  }

  if (intent === 'objection') {
    return 'handle_objection';
  }

  if (intent === 'question') {
    return 'answer_question';
  }

  return 'follow_up';
}

function extractEntities(text: string): any {
  // Placeholder - use NER (Named Entity Recognition) in production
  const entities: any = {
    dates: [],
    times: [],
    companies: [],
    people: [],
  };

  // Very basic date detection
  const datePatterns = [
    /next week/i,
    /this week/i,
    /tomorrow/i,
    /monday|tuesday|wednesday|thursday|friday/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      entities.dates.push(match[0]);
    }
  }

  return entities;
}
