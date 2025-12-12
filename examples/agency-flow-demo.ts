#!/usr/bin/env tsx
/**
 * Agency Flow Demo
 * Demonstrates complete multi-client agency workflow
 */

import { ClientConfigManager } from '../src/core/clients/config-manager.js';
import { LeadNormalizer } from '../src/core/agency/lead-normalizer.js';
import { ICPScorer } from '../src/core/agency/icp-scorer.js';
import { MessageStrategist } from '../src/core/agency/message-strategist.js';
import { ReplyClassifier } from '../src/core/agency/reply-classifier.js';
import { queryPerplexity, buildResearchPrompt } from '../src/clients/perplexity.js';
import { extractStructuredResearch } from '../src/clients/perplexity-extractors.js';
import { logger } from '../src/utils/logger.js';

async function demoAgencyFlow() {
  console.log('\n🏢 AGENCY FLOW DEMONSTRATION\n');
  console.log('='.repeat(70));

  // ===================================================================
  // STEP 1: CLIENT ONBOARDING
  // ===================================================================
  console.log('\n📋 STEP 1: Client Onboarding\n');

  const configManager = new ClientConfigManager('./config/clients');

  const onboardingResult = await configManager.createFromOnboarding({
    client_id: 'demo-client',
    client_name: 'Demo SaaS Company',
    icp: {
      company_size: { min: 50, max: 500 },
      industries: ['SaaS', 'Technology', 'Software'],
      geographies: ['United States', 'Canada'],
      titles: ['VP of Sales', 'Director of Sales', 'Head of Sales'],
      seniority_levels: ['VP', 'Director', 'Head'],
      departments: ['Sales', 'Revenue'],
      exclude_companies: ['Competitor Inc', 'Bad Fit Corp'],
      exclude_titles: ['Intern', 'Junior', 'Assistant'],
    },
    offer: {
      product_name: 'SalesFlow AI',
      value_proposition:
        'AI-powered pipeline generation that helps sales teams book 3x more qualified meetings',
      primary_benefit: 'Predictable pipeline growth',
      target_outcome: 'book discovery calls',
    },
    heyreach_api_key: 'demo_heyreach_key_12345',
    preferences: {
      tone: 'consultative',
      personalization_level: 'medium',
      cta_style: 'soft',
      risk_tolerance: 'medium',
      aggressiveness: 3,
    },
  });

  if (!onboardingResult.ok) {
    console.log('❌ Client validation failed:');
    onboardingResult.errors.forEach((err) => console.log(`   - ${err}`));
    return;
  }

  console.log('✅ Client onboarded successfully');
  console.log(`   Client ID: ${onboardingResult.normalized_config?.client_id}`);
  console.log(
    `   ICP Titles: ${onboardingResult.normalized_config?.icp.titles?.join(', ')}`
  );
  console.log(
    `   Keep Threshold: ${onboardingResult.normalized_config?.thresholds.keep_above}`
  );

  if (onboardingResult.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    onboardingResult.warnings.forEach((warn) => console.log(`   - ${warn}`));
  }

  const clientConfig = onboardingResult.normalized_config!;

  // ===================================================================
  // STEP 2: LEAD INTAKE & NORMALIZATION
  // ===================================================================
  console.log('\n\n📊 STEP 2: Lead Intake & Normalization\n');

  // Simulate leads from different sources
  const rawLeads = [
    // Sales Nav format
    {
      'First Name': 'Sarah',
      'Last Name': 'Johnson',
      Title: 'VP of Sales',
      Company: 'TechCorp',
      'Company Size': '250',
      Location: 'San Francisco, CA',
      Industry: 'SaaS',
      'Profile URL': 'https://linkedin.com/in/sarahjohnson',
    },
    // CSV format
    {
      firstName: 'Michael',
      lastName: 'Chen',
      title: 'Director of Sales',
      company: 'DataFlow Inc',
      companySize: 150,
      location: 'Austin, TX',
      industry: 'Technology',
      email: 'michael@dataflow.com',
    },
    // Bad fit
    {
      firstName: 'John',
      lastName: 'Doe',
      title: 'Junior Sales Rep',
      company: 'Tiny Startup',
      companySize: 5,
      location: 'Remote',
      industry: 'E-commerce',
      linkedInUrl: 'https://linkedin.com/in/johndoe',
    },
    // Excluded company
    {
      firstName: 'Jane',
      lastName: 'Smith',
      title: 'VP of Sales',
      company: 'Competitor Inc',
      companySize: 300,
      location: 'New York, NY',
      industry: 'SaaS',
      email: 'jane@competitor.com',
    },
  ];

  const normalizer = new LeadNormalizer();
  const normalized = normalizer.normalize(rawLeads, 'csv');

  console.log(`✅ Leads normalized:`);
  console.log(`   Input: ${normalized.stats.input_count}`);
  console.log(`   Output: ${normalized.stats.output_count}`);
  console.log(`   Duplicates removed: ${normalized.stats.duplicates_removed}`);
  console.log(`   Invalid removed: ${normalized.stats.invalid_removed}`);

  // ===================================================================
  // STEP 3: ICP SCORING & LIST CLEANING
  // ===================================================================
  console.log('\n\n🎯 STEP 3: ICP Scoring & List Cleaning\n');

  const scorer = new ICPScorer();
  const scoredResults = scorer.scoreLeads(normalized.leads, clientConfig);

  console.log(`✅ Leads scored:`);
  console.log(`   Keep: ${scoredResults.stats.keep_count}`);
  console.log(`   Review: ${scoredResults.stats.review_count}`);
  console.log(`   Drop: ${scoredResults.stats.drop_count}`);

  console.log('\n📈 Top 2 Leads:\n');
  scoredResults.scored
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, 2)
    .forEach((result, i) => {
      const lead = normalized.leads.find((l) => l.lead_id === result.lead_id);
      console.log(`${i + 1}. ${lead?.firstName} ${lead?.lastName} @ ${lead?.company}`);
      console.log(`   Score: ${result.fit_score}/100 (${result.recommended_action})`);
      console.log(`   Reasons:`);
      result.reasons.forEach((r) => console.log(`     ✓ ${r}`));
      if (result.disqualifiers.length > 0) {
        console.log(`   Disqualifiers:`);
        result.disqualifiers.forEach((d) => console.log(`     ✗ ${d}`));
      }
    });

  // Clean the list
  const cleaned = scorer.cleanLeadList(scoredResults.scored, {
    drop_below: clientConfig.thresholds.drop_below,
    review_range: clientConfig.thresholds.review_range,
  });

  // ===================================================================
  // STEP 4: RESEARCH TOP LEADS (if Perplexity configured)
  // ===================================================================
  console.log('\n\n🔬 STEP 4: Research Top Leads\n');

  if (
    !process.env.PERPLEXITY_API_KEY ||
    process.env.PERPLEXITY_API_KEY === 'pxy_your_api_key_here'
  ) {
    console.log('⚠️  Perplexity API key not configured - skipping research');
    console.log('   (In production, this would gather real-time signals)\n');
    console.log('   Mock research output:');
    console.log('   - Company: TechCorp');
    console.log('   - Signals: Hiring 5+ SDRs, Recent Series B, New product launch');
    console.log('   - Confidence: 85%');
  } else {
    // Research top lead
    const topLead = cleaned.kept[0];
    if (topLead) {
      const lead = normalized.leads.find((l) => l.lead_id === topLead.lead_id);
      if (lead && lead.company) {
        console.log(`🔍 Researching: ${lead.company}\n`);

        const prompt = buildResearchPrompt({
          company_name: lead.company,
          role: lead.title,
          industry: lead.industry,
        });

        try {
          const rawResearch = await queryPerplexity(prompt);
          const research = extractStructuredResearch(rawResearch);

          console.log('✅ Research complete:');
          console.log(`   Company signals: ${research.company_signals.length}`);
          console.log(`   Buying triggers: ${research.buying_triggers.length}`);
          console.log(`   Confidence: ${(research.confidence * 100).toFixed(0)}%`);

          if (research.company_signals.length > 0) {
            console.log('\n   Top signals:');
            research.company_signals.slice(0, 3).forEach((s) => {
              console.log(`     • ${s}`);
            });
          }
        } catch (error) {
          console.log('⚠️  Research failed:', error instanceof Error ? error.message : error);
        }
      }
    }
  }

  // ===================================================================
  // STEP 5: MESSAGE STRATEGY & GENERATION
  // ===================================================================
  console.log('\n\n✉️  STEP 5: Message Strategy & Generation\n');

  const strategist = new MessageStrategist();

  // Demo with top kept lead
  if (cleaned.kept.length > 0) {
    const topScored = cleaned.kept[0];
    const topLead = normalized.leads.find((l) => l.lead_id === topScored.lead_id)!;

    console.log(`📝 Creating strategy for: ${topLead.firstName} ${topLead.lastName}`);

    try {
      const strategy = await strategist.buildStrategy({
        lead: topLead,
        config: clientConfig,
        fit_score: topScored.fit_score,
      });

      console.log('\n✅ Strategy created:');
      console.log(`   Primary Angle: ${strategy.primary_angle}`);
      console.log(`   CTA Style: ${strategy.cta_style}`);
      console.log(`   Personalization: ${strategy.personalization_level}`);
      console.log(`   Tone: ${strategy.tone_guidance}`);

      console.log('\n💬 Generating messages...\n');

      const messages = await strategist.generateMessages({
        lead: topLead,
        strategy,
        config: clientConfig,
      });

      console.log('✅ Messages generated:\n');
      if (messages.connect_note) {
        console.log(`📩 Connect Note (${messages.connect_note.length} chars):`);
        console.log(`   "${messages.connect_note}"\n`);
      }
      console.log(`📧 First DM (${messages.dm_1.length} chars):`);
      console.log(`   "${messages.dm_1}"\n`);
      console.log(`📬 Follow-ups:`);
      messages.followups.forEach((msg, i) => {
        console.log(`   ${i + 1}. "${msg}"`);
      });

      // Validate safety
      const validation = strategist.validateMessageSafety(
        messages,
        'linkedin',
        {
          no_creepy: true,
          no_guarantees: true,
        }
      );

      console.log(`\n🛡️  Safety Check:`);
      console.log(`   Status: ${validation.ok ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Risk Score: ${validation.risk_score}/100`);
      if (validation.flags.length > 0) {
        console.log(`   Flags:`);
        validation.flags.forEach((f) => console.log(`     ⚠️  ${f}`));
      }
    } catch (error) {
      console.log('⚠️  AI features require valid Anthropic API key');
      console.log('   Showing what the output would look like:\n');
      console.log('   Strategy:');
      console.log('   - Angle: Recent hiring indicates growth focus');
      console.log('   - CTA: Soft (question-based)');
      console.log('   - Personalization: Medium\n');
      console.log('   Messages:');
      console.log('   - Connect: "Saw your team is growing — curious about..."');
      console.log('   - DM: Context-based opener with soft CTA');
      console.log('   - Follow-ups: Value-add, non-pushy');
    }
  }

  // ===================================================================
  // STEP 6: REPLY CLASSIFICATION (Demo)
  // ===================================================================
  console.log('\n\n💬 STEP 6: Reply Classification\n');

  const classifier = new ReplyClassifier();

  // Simulate a reply
  const demoThread = {
    messages: [
      { from: 'us' as const, content: 'Hi Sarah, noticed your team is growing...' },
      {
        from: 'them' as const,
        content: 'Thanks for reaching out. Not right now, but maybe in Q2?',
      },
    ],
  };

  if (cleaned.kept.length > 0) {
    const topLead = normalized.leads.find(
      (l) => l.lead_id === cleaned.kept[0].lead_id
    )!;

    try {
      const classification = await classifier.classifyReply({
        thread: demoThread,
        lead: topLead,
      });

      console.log('✅ Reply classified:');
      console.log(`   Intent: ${classification.intent}`);
      console.log(`   Sentiment: ${classification.sentiment}`);
      console.log(`   Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
      console.log(`   Next Step: ${classification.recommended_next_step}`);
      console.log(`   Reasoning: ${classification.reasoning}`);

      if (classification.extracted_context) {
        console.log(`   Context: ${JSON.stringify(classification.extracted_context)}`);
      }
    } catch (error) {
      console.log('⚠️  Using rule-based classification (AI unavailable)');
      const classification = await classifier.classifyReply({
        thread: demoThread,
        lead: topLead,
      });
      console.log(`   Intent: ${classification.intent} (timing)`);
      console.log(`   Next Step: ${classification.recommended_next_step} (nurture)`);
    }
  }

  // ===================================================================
  // SUMMARY
  // ===================================================================
  console.log('\n\n' + '='.repeat(70));
  console.log('\n✨ AGENCY FLOW COMPLETE!\n');

  console.log('📊 Summary:\n');
  console.log(`   1. ✅ Client onboarded: ${clientConfig.client_name}`);
  console.log(`   2. ✅ Leads normalized: ${normalized.stats.output_count} valid`);
  console.log(`   3. ✅ ICP scoring: ${scoredResults.stats.keep_count} high-fit`);
  console.log(`   4. ✅ Research: (would gather real-time signals)`);
  console.log(`   5. ✅ Messages: Strategy + Copy generated`);
  console.log(`   6. ✅ Reply handling: Classification + Next steps`);

  console.log('\n🎯 Ready for Production:\n');
  console.log('   • Add real Perplexity API key for research');
  console.log('   • Add real Anthropic API key for AI features');
  console.log('   • Connect n8n workflows');
  console.log('   • Integrate HeyReach API');
  console.log('   • Set up monitoring & alerting');

  console.log('\n💡 This system is now ready for multi-client deployment!\n');
}

demoAgencyFlow().catch(console.error);
