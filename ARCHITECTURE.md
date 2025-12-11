# Architecture Documentation

## System Overview

The AI Outreach Agent is built as a modular, event-driven system that leverages Claude AI for intelligent decision-making while maintaining strict safety controls and deliverability standards.

## Core Principles

1. **Autonomy over Automation**: The system makes contextual decisions rather than following rigid rules
2. **Continuous Learning**: Every interaction feeds back into the system to improve future performance
3. **Safety First**: Multiple layers of protection prevent account restrictions and deliverability issues
4. **Scalability**: Designed to handle hundreds of concurrent campaigns across multiple accounts

## Component Architecture

### 1. MCP Server Layer

**Purpose**: Provides a standardized interface for Claude to interact with the outreach system

**Key Responsibilities**:
- Tool registration and invocation
- Request validation and sanitization
- Response formatting
- Error handling and logging

**Tools Provided**:
```typescript
interface MCPTools {
  import_leads: (source, data, campaignId?) => ImportResult
  validate_leads: (leadIds, icpCriteria?) => ValidationResult[]
  generate_message: (leadId, campaignId, stepNumber?) => PersonalizedMessage
  send_message: (leadId, content, channel) => Message
  schedule_followup: (leadId, delayHours) => ScheduleResult
  tag_reply: (content, leadId) => Reply
  pause_campaign: (campaignId, leadId?, reason?) => PauseResult
  get_insights: (campaignId, timeframe?) => Insight[]
  update_lead_status: (leadId, status) => Lead
  check_safety_limits: (action, count?) => SafetyCheck
}
```

### 2. API Client Layer

**HeyReach Client**:
- Account management
- Campaign CRUD operations
- Message sending (LinkedIn + Email)
- Reply fetching and processing
- Metrics and analytics
- Webhook management

**Connection Management**:
- Automatic retry with exponential backoff
- Request rate limiting
- Connection pooling
- Error recovery

### 3. Lead Management Layer

**Components**:
- **Lead Importer**: CSV, API, and webhook-based import
- **ICP Validator**: Multi-criteria lead qualification
- **Enrichment Engine**: Data enhancement from external sources
- **Deduplication**: Intelligent duplicate detection

**Data Flow**:
```
Raw Lead → Parse → Normalize → Validate → Enrich → Store
```

**Validation Criteria**:
- Email/LinkedIn URL format
- ICP title matching
- Company size range
- Geography filtering
- Exclusion lists (companies, titles)
- Data quality thresholds

### 4. Personalization Engine

**Architecture**:
```
Context Builder → Prompt Generator → Claude API → Response Parser → Validator
```

**Context Building**:
- Lead profile data
- Company information
- Industry insights
- Previous message history
- Reply patterns
- Campaign-level learnings

**Message Generation Process**:
1. Gather all available context about the lead
2. Build structured prompt with guidelines
3. Call Claude API with context
4. Parse and validate response
5. Check for spam indicators
6. Return personalized message

**Fallback Strategy**:
- If generation fails: retry with simplified prompt
- If validation fails: regenerate with stricter rules
- If multiple failures: queue for manual review

### 5. Campaign Orchestration

**State Machine**:
```
DRAFT → ACTIVE → PAUSED/COMPLETED/ARCHIVED
```

**Sequence Processing**:
- Multi-channel support (LinkedIn, Email)
- Conditional branching based on responses
- Dynamic delay adjustment
- Channel switching logic
- Account rotation for load balancing

**Execution Model**:
- Event-driven with scheduled tasks
- Asynchronous message queue
- Real-time reply processing
- Automatic pause on positive signals

### 6. Feedback Loop & Learning

**Data Collection**:
- Message delivery status
- Open rates (email)
- Reply rates and sentiment
- Response timing patterns
- Engagement signals

**Analysis Pipeline**:
```
Raw Events → Aggregation → Pattern Detection → Insight Generation → Recommendation
```

**Learning Model**:
- Statistical pattern detection
- AI-powered insight extraction
- A/B test result analysis
- Time-series trend identification

**Optimization Cycle**:
1. Collect performance data
2. Detect patterns (timing, messaging, targeting)
3. Generate insights with Claude
4. Create actionable recommendations
5. Apply learnings to future messages

### 7. Safety & Deliverability

**Multi-Layer Protection**:

**Layer 1: Rate Limiting**
- Daily action limits per account
- Minimum delays between actions
- Hourly distribution controls

**Layer 2: Content Validation**
- Spam indicator detection
- Message quality checks
- Subject line analysis
- URL and link validation

**Layer 3: Behavioral Simulation**
- Randomized timing delays
- Human-like action patterns
- Timezone-aware scheduling
- Session-based activity clustering

**Layer 4: Account Health Monitoring**
- Warning tracking
- Bounce rate monitoring
- Reply rate analysis
- Automatic account rotation

## Data Flow

### Outbound Message Flow

```
1. Lead Import/Selection
   ↓
2. ICP Validation
   ↓
3. Safety Check (limits, timing)
   ↓
4. Context Building
   ↓
5. Message Generation (Claude)
   ↓
6. Content Validation
   ↓
7. Send via HeyReach
   ↓
8. Track Delivery
   ↓
9. Schedule Follow-up (if needed)
```

### Reply Processing Flow

```
1. Reply Received (webhook/poll)
   ↓
2. Classification (Claude)
   ↓
3. Tag & Store
   ↓
4. Update Lead Status
   ↓
5. Trigger Action (pause/notify/CRM update)
   ↓
6. Record Feedback
   ↓
7. Update Learning Model
```

## Integration Points

### External Systems

**HeyReach Platform**:
- REST API for campaign management
- Webhooks for real-time events
- Account management interface

**Claude AI (Anthropic)**:
- Message generation
- Reply classification
- Insight extraction
- Pattern analysis

**n8n (Optional)**:
- Workflow automation
- CRM integration
- Notification routing
- Custom triggers

**Data Sources**:
- Clay (enrichment)
- CSV files
- CRM exports
- Custom APIs

## Scalability Considerations

### Horizontal Scaling

**MCP Server**: Stateless design allows multiple instances
**Campaign Workers**: Distribute campaigns across workers
**Message Queue**: Use external queue (Redis, RabbitMQ) for production
**Database**: Replace in-memory storage with persistent DB (PostgreSQL, MongoDB)

### Performance Optimization

**Caching**:
- Lead data caching
- Message template caching
- ICP validation result caching
- API response caching

**Batching**:
- Bulk lead import
- Batch message generation
- Aggregated metrics updates

**Async Processing**:
- Non-blocking message sending
- Background reply processing
- Deferred insight generation

## Security Considerations

### API Key Management
- Environment variable storage
- Key rotation support
- Separate keys per environment

### Data Protection
- Sensitive data encryption
- PII handling compliance
- Audit logging

### Rate Limiting
- API request throttling
- Account-level limits
- IP-based restrictions

## Monitoring & Observability

### Logging Levels
- **DEBUG**: Detailed execution traces
- **INFO**: Key events and state changes
- **WARN**: Safety warnings and validation issues
- **ERROR**: Failures and exceptions

### Metrics to Track
- Messages sent/delivered/replied
- Campaign performance (reply rate, conversion)
- Safety limit usage
- API error rates
- Processing latency

### Alerts
- Daily limit approaching
- High bounce rate
- Account warnings
- API failures
- Unusual pattern detection

## Future Enhancements

1. **Multi-Model Support**: Support for other LLMs beyond Claude
2. **Advanced Analytics**: Predictive modeling for campaign success
3. **Real-time Dashboards**: Live campaign monitoring UI
4. **Multi-Account Orchestration**: Smart account pooling and rotation
5. **Voice/Video Outreach**: Expand beyond text-based channels
6. **CRM Deep Integration**: Native Salesforce, HubSpot connectors
7. **A/B Testing Framework**: Built-in experimentation platform
8. **Compliance Tools**: GDPR, CAN-SPAM automated compliance
