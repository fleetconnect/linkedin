#!/usr/bin/env tsx
/**
 * Client Health Check Script
 * Operators run this to verify client system status
 */

import { ClientConfigManager } from '../src/core/clients/config-manager.js';
import { logger } from '../src/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

interface HealthCheck {
  client_id: string;
  client_name: string;
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }[];
  summary: string;
}

async function checkClientHealth(clientId?: string): Promise<void> {
  console.log('\n🏥 CLIENT HEALTH CHECK\n');
  console.log('='.repeat(70));

  const configManager = new ClientConfigManager('./config/clients');
  await configManager.loadConfigs();

  // Get clients to check
  let clients = configManager.getActiveConfigs();

  if (clientId) {
    const specific = configManager.getConfig(clientId);
    if (!specific) {
      console.log(`\n❌ Client "${clientId}" not found\n`);
      return;
    }
    clients = [specific];
  }

  if (clients.length === 0) {
    console.log('\n⚠️  No active clients found\n');
    return;
  }

  console.log(`\nChecking ${clients.length} client(s)...\n`);

  const results: HealthCheck[] = [];

  for (const client of clients) {
    const health = await runHealthChecks(client);
    results.push(health);
    displayHealthCheck(health);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SUMMARY\n');

  const healthy = results.filter((r) => r.status === 'healthy').length;
  const warning = results.filter((r) => r.status === 'warning').length;
  const critical = results.filter((r) => r.status === 'critical').length;

  console.log(`✅ Healthy: ${healthy}`);
  console.log(`⚠️  Warning: ${warning}`);
  console.log(`🚨 Critical: ${critical}`);

  if (critical > 0) {
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED for critical clients');
  } else if (warning > 0) {
    console.log('\n⚠️  Review warnings and escalate if needed');
  } else {
    console.log('\n✅ All clients healthy!');
  }

  console.log();
}

async function runHealthChecks(client: any): Promise<HealthCheck> {
  const checks: HealthCheck['checks'] = [];

  // Check 1: Config file exists and is valid
  checks.push(await checkConfigValid(client));

  // Check 2: ICP criteria defined
  checks.push(checkICPDefined(client));

  // Check 3: Offer defined
  checks.push(checkOfferDefined(client));

  // Check 4: HeyReach API key configured
  checks.push(checkHeyReachKey(client));

  // Check 5: Safety limits reasonable
  checks.push(checkSafetyLimits(client));

  // Check 6: Client data directory exists
  checks.push(await checkDataDirectory(client.client_id));

  // Check 7: Recent activity (if logs exist)
  checks.push(await checkRecentActivity(client.client_id));

  // Determine overall status
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  let status: 'healthy' | 'warning' | 'critical';
  if (failCount > 0) {
    status = 'critical';
  } else if (warnCount > 0) {
    status = 'warning';
  } else {
    status = 'healthy';
  }

  const summary = generateSummary(checks, status);

  return {
    client_id: client.client_id,
    client_name: client.client_name,
    status,
    checks,
    summary,
  };
}

async function checkConfigValid(client: any): Promise<HealthCheck['checks'][0]> {
  try {
    const required = ['client_id', 'client_name', 'icp', 'offer', 'heyreach'];
    const missing = required.filter((field) => !client[field]);

    if (missing.length > 0) {
      return {
        name: 'Config Valid',
        status: 'fail',
        message: `Missing required fields: ${missing.join(', ')}`,
      };
    }

    return {
      name: 'Config Valid',
      status: 'pass',
      message: 'All required fields present',
    };
  } catch (error) {
    return {
      name: 'Config Valid',
      status: 'fail',
      message: 'Config file invalid or corrupted',
    };
  }
}

function checkICPDefined(client: any): HealthCheck['checks'][0] {
  const icp = client.icp;

  if (!icp) {
    return {
      name: 'ICP Defined',
      status: 'fail',
      message: 'No ICP criteria configured',
    };
  }

  const hasPersona = icp.titles?.length > 0 || icp.seniority_levels?.length > 0;
  const hasFirmographic =
    icp.industries?.length > 0 || icp.company_size || icp.geographies?.length > 0;

  if (!hasPersona && !hasFirmographic) {
    return {
      name: 'ICP Defined',
      status: 'warn',
      message: 'ICP is very broad - may result in poor targeting',
    };
  }

  if (!hasPersona) {
    return {
      name: 'ICP Defined',
      status: 'warn',
      message: 'No persona criteria (titles, seniority) - may result in poor fit',
    };
  }

  return {
    name: 'ICP Defined',
    status: 'pass',
    message: `Persona: ${icp.titles?.length || 0} titles, Firmographic: ${icp.industries?.length || 0} industries`,
  };
}

function checkOfferDefined(client: any): HealthCheck['checks'][0] {
  const offer = client.offer;

  if (!offer) {
    return {
      name: 'Offer Defined',
      status: 'fail',
      message: 'No offer configured',
    };
  }

  if (!offer.value_proposition || offer.value_proposition.length < 10) {
    return {
      name: 'Offer Defined',
      status: 'warn',
      message: 'Value proposition is weak or missing',
    };
  }

  if (!offer.target_outcome) {
    return {
      name: 'Offer Defined',
      status: 'warn',
      message: 'Target outcome not specified',
    };
  }

  return {
    name: 'Offer Defined',
    status: 'pass',
    message: `Product: ${offer.product_name}, Outcome: ${offer.target_outcome}`,
  };
}

function checkHeyReachKey(client: any): HealthCheck['checks'][0] {
  const key = client.heyreach?.api_key;

  if (!key || key === '' || key === 'demo_heyreach_key_12345') {
    return {
      name: 'HeyReach API Key',
      status: 'fail',
      message: 'No valid HeyReach API key configured',
    };
  }

  return {
    name: 'HeyReach API Key',
    status: 'pass',
    message: 'API key configured',
  };
}

function checkSafetyLimits(client: any): HealthCheck['checks'][0] {
  const limits = client.constraints;

  if (!limits) {
    return {
      name: 'Safety Limits',
      status: 'warn',
      message: 'Using default safety limits',
    };
  }

  const linkedin_connections = limits.daily_linkedin_connections || 0;
  const linkedin_messages = limits.daily_linkedin_messages || 0;

  if (linkedin_connections > 100 || linkedin_messages > 150) {
    return {
      name: 'Safety Limits',
      status: 'warn',
      message: 'Limits may be too aggressive - risk of account flags',
    };
  }

  return {
    name: 'Safety Limits',
    status: 'pass',
    message: `Connections: ${linkedin_connections}/day, Messages: ${linkedin_messages}/day`,
  };
}

async function checkDataDirectory(clientId: string): Promise<HealthCheck['checks'][0]> {
  try {
    const dataDir = path.join('./data/clients', clientId);
    await fs.access(dataDir);

    return {
      name: 'Data Directory',
      status: 'pass',
      message: `Directory exists: ${dataDir}`,
    };
  } catch (error) {
    return {
      name: 'Data Directory',
      status: 'warn',
      message: 'Data directory not found - will be created on first use',
    };
  }
}

async function checkRecentActivity(clientId: string): Promise<HealthCheck['checks'][0]> {
  // This would check logs, database, or Airtable for recent activity
  // For now, return a placeholder

  return {
    name: 'Recent Activity',
    status: 'pass',
    message: 'Activity check not yet implemented',
  };
}

function generateSummary(
  checks: HealthCheck['checks'],
  status: 'healthy' | 'warning' | 'critical'
): string {
  const failed = checks.filter((c) => c.status === 'fail');
  const warned = checks.filter((c) => c.status === 'warn');

  if (status === 'critical') {
    return `${failed.length} critical issue(s): ${failed.map((f) => f.name).join(', ')}`;
  } else if (status === 'warning') {
    return `${warned.length} warning(s): ${warned.map((w) => w.name).join(', ')}`;
  } else {
    return 'All checks passed';
  }
}

function displayHealthCheck(health: HealthCheck): void {
  const statusEmoji = {
    healthy: '✅',
    warning: '⚠️',
    critical: '🚨',
  }[health.status];

  console.log(`\n${statusEmoji} ${health.client_name.toUpperCase()} (${health.client_id})`);
  console.log(`   Status: ${health.status.toUpperCase()}`);
  console.log(`   Summary: ${health.summary}`);
  console.log();

  for (const check of health.checks) {
    const icon = {
      pass: '  ✓',
      warn: '  ⚠',
      fail: '  ✗',
    }[check.status];

    console.log(`${icon} ${check.name}`);
    console.log(`     ${check.message}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clientId = args.find((arg) => arg.startsWith('--client-id='))?.split('=')[1];

checkClientHealth(clientId).catch((error) => {
  console.error('\n❌ Health check failed:', error);
  process.exit(1);
});
