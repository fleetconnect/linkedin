#!/usr/bin/env tsx
/**
 * Strategic Features Demo
 * Demonstrates all 10 game-changing features
 */

import { DecisionEngine } from '../src/core/decisions/engine.js';
import { ApprovalGate, RiskLevel } from '../src/core/approval/gate.js';
import { MemorySystem } from '../src/core/memory/system.js';
import { SuppressionIntelligence } from '../src/core/suppression/intelligence.js';
import { StrategyPlaybook } from '../src/core/strategy/playbook.js';
import { ClosedLoopOptimizer } from '../src/core/learning/optimizer.js';
import { ControlSystem } from '../src/core/controls/knobs.js';
import { HealthPredictor } from '../src/core/health/predictor.js';
import { ResearchCache } from '../src/core/research/cache.js';
import { MagicalUX } from '../src/core/ux/magic.js';

async function main() {
  console.log('\n🚀 Strategic Features Demonstration\n');
  console.log('='.repeat(70));

  // 1. Decision Transparency
  console.log('\n1️⃣  DECISION TRANSPARENCY');
  console.log('-'.repeat(70));

  const decisionEngine = new DecisionEngine();
  const decision = decisionEngine.recordDecision({
    decision: 'send_linkedin_dm',
    confidence: 0.84,
    signals_used: [
      { name: 'SDR hiring spike', value: true, weight: 0.3, source: 'LinkedIn' },
      { name: 'ICP match', value: 0.92, weight: 0.4, source: 'Internal' },
      { name: 'Low account risk', value: true, weight: 0.2, source: 'Safety' },
    ],
    reasoning: [
      { factor: 'Company growth', impact: 'high', explanation: 'Hiring 5+ SDRs indicates expansion' },
      { factor: 'Perfect ICP fit', impact: 'high', explanation: '92% match across all criteria' },
    ],
    alternatives_considered: [
      { action: 'wait_30_days', reason_rejected: 'Timing is optimal now', confidence_delta: -0.15 },
    ],
    signals_ignored: [
      { name: 'No funding data', value: null, weight: 0.1, source: 'Crunchbase' },
    ],
    lead_id: 'lead-123',
  });

  console.log(decisionEngine.explainDecision(decision.id));

  // 2. Human-in-the-Loop
  console.log('\n2️⃣  HUMAN-IN-THE-LOOP APPROVAL');
  console.log('-'.repeat(70));

  const approvalGate = new ApprovalGate({
    low_risk_auto_approve: true,
    medium_risk_sample_rate: 20, // Review 1 in 20
    high_risk_requires_approval: true,
    critical_always_approve: true,
    abm_accounts: ['Enterprise Corp', 'Strategic Partner Inc'],
  });

  const lead = {
    id: 'lead-456',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'VP of Sales',
    company: 'Enterprise Corp',
    companySize: 2500,
  };

  const riskAssessment = approvalGate.assessRisk({
    lead: lead as any,
    message: 'Hi Sarah, noticed your company is expanding...',
  });

  console.log(`Risk Level: ${riskAssessment.level} (score: ${riskAssessment.score})`);
  console.log(`Requires Approval: ${riskAssessment.requires_approval ? 'Yes' : 'No'}\n`);

  riskAssessment.factors.forEach(factor => {
    const emoji = factor.impact === 'increases' ? '⬆️' : '⬇️';
    console.log(`${emoji} ${factor.factor} (${factor.points} points): ${factor.explanation}`);
  });

  // 3. Structured Memory
  console.log('\n\n3️⃣  STRUCTURED MEMORY SYSTEM');
  console.log('-'.repeat(70));

  const memory = new MemorySystem();

  memory.recordCompanySuccess(
    'TechCorp',
    'ROI-focused',
    'Showed 40% time savings with specific examples',
    'meeting_booked'
  );

  memory.initializePersona('VP Sales at Tech Companies', ['VP of Sales', 'SVP Sales']);
  memory.updatePersonaPerformance('VP Sales at Tech Companies', 100, 25, 8);

  const stats = memory.getStatistics();
  console.log(`Companies in memory: ${stats.total_companies}`);
  console.log(`Personas tracked: ${stats.total_personas}`);
  console.log(`Companies with successful angles: ${stats.companies_with_success}`);
  console.log(`Best performing persona: ${stats.best_performing_persona}`);

  // 4. Suppression Intelligence
  console.log('\n\n4️⃣  SUPPRESSION INTELLIGENCE');
  console.log('-'.repeat(70));

  const suppression = new SuppressionIntelligence();

  const suppressionDecision = await suppression.evaluateSuppression({
    lead: lead as any,
    market_signals: { company_in_transition: false },
  });

  console.log(`Should Suppress: ${suppressionDecision.should_suppress}`);
  console.log(`Confidence: ${(suppressionDecision.confidence * 100).toFixed(0)}%\n`);

  if (suppressionDecision.reasons.length > 0) {
    console.log('Suppression Reasons:');
    suppressionDecision.reasons.forEach(reason => {
      console.log(`  • ${reason.type}: ${reason.explanation}`);
      if (reason.recommendation) {
        console.log(`    → ${reason.recommendation}`);
      }
    });
  }

  const metrics = suppression.getSuppressionMetrics();
  console.log(`\nSuppression Metrics:`);
  console.log(`  Total suppressed: ${metrics.total_suppressed}`);
  console.log(`  Later conversions: ${metrics.later_conversions}`);
  console.log(`  ROI Impact: ${metrics.roi_impact}`);

  // 5. Campaign Strategy as Code
  console.log('\n\n5️⃣  CAMPAIGN STRATEGY AS CODE');
  console.log('-'.repeat(70));

  const playbook = new StrategyPlaybook();
  const strategies = playbook.getAllStrategies();

  console.log(`Built-in strategies loaded: ${strategies.length}\n`);

  strategies.forEach((strategy, i) => {
    console.log(`${i + 1}. ${strategy.name}`);
    console.log(`   Goal: ${strategy.goal} | Risk: ${strategy.risk_tolerance}`);
    console.log(`   Channels: ${strategy.channels.join(', ')}`);
    console.log(`   Fallbacks: ${strategy.fallbacks.length} configured\n`);
  });

  const decision2 = playbook.makeDecision({
    strategy: strategies[0],
    lead_context: { is_enterprise: true, senior_title: true },
  });

  console.log('Strategic Decision:');
  console.log(`  Decision: ${decision2.decision}`);
  console.log(`  Reasoning:`);
  decision2.reasoning.forEach(r => console.log(`    • ${r}`));

  // 6. Closed-Loop Learning
  console.log('\n\n6️⃣  CLOSED-LOOP LEARNING');
  console.log('-'.repeat(70));

  const optimizer = new ClosedLoopOptimizer();

  const learning = optimizer.learnFromVariant({
    variant_a: { id: 'msg-a', performance: 0.12 },
    variant_b: { id: 'msg-b', performance: 0.18 },
    metric: 'reply_rate',
  });

  if (learning) {
    console.log('✅ Learning Applied:');
    console.log(`  Type: ${learning.type}`);
    console.log(`  Change: ${learning.previous_value} → ${learning.new_value}`);
    console.log(`  Reason: ${learning.reason}`);
    console.log(`  Confidence: ${(learning.confidence * 100).toFixed(0)}%`);
  }

  // 7. Simple Control Knobs
  console.log('\n\n7️⃣  SIMPLE CONTROL KNOBS');
  console.log('-'.repeat(70));

  const knobs = {
    aggressiveness: 4 as 4,
    personalization_depth: 'deep' as 'deep',
    brand_voice: 'friendly' as 'friendly',
    risk_tolerance: 'balanced' as 'balanced',
    research_budget: 'comprehensive' as 'comprehensive',
  };

  const agentParams = ControlSystem.toAgentParams(knobs);

  console.log('User-Friendly Settings:');
  console.log(`  Aggressiveness: ${knobs.aggressiveness}/5`);
  console.log(`  Personalization: ${knobs.personalization_depth}`);
  console.log(`  Brand Voice: ${knobs.brand_voice}`);
  console.log(`  Risk Tolerance: ${knobs.risk_tolerance}`);
  console.log(`  Research Budget: ${knobs.research_budget}`);

  console.log('\nMaps to Agent Parameters:');
  console.log(`  Message variations: ${agentParams.message_variations}`);
  console.log(`  Personalization tokens: ${agentParams.personalization_tokens}`);
  console.log(`  Tone temperature: ${agentParams.tone_temperature}`);
  console.log(`  Safety multiplier: ${agentParams.safety_multiplier}x`);
  console.log(`  Research depth: ${agentParams.research_depth}`);

  // 8. Predictive Account Health
  console.log('\n\n8️⃣  PREDICTIVE ACCOUNT HEALTH');
  console.log('-'.repeat(70));

  const healthPredictor = new HealthPredictor();

  const health = healthPredictor.predictHealth({
    acceptance_rate: 0.25,
    reply_rate: 0.15,
    message_entropy: 0.45,
    bounce_rate: 0.05,
    recent_warnings: 1,
  });

  console.log(`Health Status: ${health.status.toUpperCase()}`);
  console.log(`Confidence: ${(health.confidence * 100).toFixed(0)}%\n`);

  if (health.issues.length > 0) {
    console.log('Issues Detected:');
    health.issues.forEach(issue => {
      const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${emoji} ${issue.type}: ${issue.description}`);
    });
  }

  if (health.recommendations.length > 0) {
    console.log('\nRecommendations:');
    health.recommendations.forEach(rec => console.log(`  → ${rec}`));
  }

  const throttle = healthPredictor.autoThrottle(health);
  if (throttle.should_throttle) {
    console.log(`\n⚠️  Auto-throttle triggered: New limit = ${throttle.new_daily_limit}/day`);
  }

  // 9. Research Caching
  console.log('\n\n9️⃣  RESEARCH AS AN ASSET');
  console.log('-'.repeat(70));

  const researchCache = new ResearchCache();

  researchCache.set(
    'TechCorp',
    {
      signals: ['hiring', 'funding_round'],
      tech_stack: ['Salesforce', 'HubSpot'],
      recent_news: ['Expanded to EMEA'],
    },
    0.9
  );

  const cached = researchCache.get('TechCorp');
  if (cached) {
    console.log(`Company: ${cached.company}`);
    console.log(`Quality Score: ${(cached.quality_score * 100).toFixed(0)}%`);
    console.log(`Signals: ${cached.data.signals?.join(', ')}`);
    console.log(`Tech Stack: ${cached.data.tech_stack?.join(', ')}`);
  }

  const cacheStats = researchCache.getStats();
  console.log(`\nCache Statistics:`);
  console.log(`  ${cacheStats.value_generated}`);
  console.log(`  Average quality: ${(cacheStats.avg_quality * 100).toFixed(0)}%`);

  // 10. Magical UX
  console.log('\n\n🔟  MAGICAL UX ELEMENTS');
  console.log('-'.repeat(70));

  console.log(MagicalUX.notify('lead_hot', {
    lead_name: 'Sarah Johnson',
    reason: 'SDR hiring spike + budget approval signal',
  }));

  console.log(MagicalUX.notify('should_wait', {
    lead_name: 'John Doe',
    reason: 'company in transition, revisit in 30 days',
  }));

  console.log(MagicalUX.notify('outperformed', {
    percentage: 92,
  }));

  console.log('\n' + MagicalUX.compare('Reply Rate', 0.18, 0.12));
  console.log(MagicalUX.compare('Meeting Rate', 0.08, 0.10));

  console.log('\n' + MagicalUX.confidence(0.92));
  console.log(MagicalUX.confidence(0.65));
  console.log(MagicalUX.confidence(0.42));

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('\n✨ ALL 10 STRATEGIC FEATURES DEMONSTRATED!\n');

  console.log('🎯 What This Means:\n');
  console.log('  1. Transparency → Trust & Enterprise-readiness');
  console.log('  2. Risk Gates → Compliance & Quality Control');
  console.log('  3. Memory → Intelligence that compounds');
  console.log('  4. Suppression → Long-term ROI optimization');
  console.log('  5. Strategy → Reusable winning playbooks');
  console.log('  6. Learning → Behavior improves automatically');
  console.log('  7. Knobs → Non-technical control');
  console.log('  8. Predictive → Account protection');
  console.log('  9. Research → Private market intelligence');
  console.log('  10. Magic → User confidence & delight');

  console.log('\n💡 Competitive Advantages:\n');
  console.log('  • Defensible moats through structured memory');
  console.log('  • Enterprise sales ready (transparency + approval)');
  console.log('  • Continuous improvement without manual work');
  console.log('  • Account safety = user retention');
  console.log('  • Strategic packaging = higher pricing');
  console.log();
}

main().catch(console.error);
