#!/bin/bash

# Example API usage for Research Hook functionality
# Make sure the server is running first: npm run dev

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Research Hook API Endpoints"
echo ""

# Generate UUIDs for testing
CAMPAIGN_ID="campaign-$(uuidv4 2>/dev/null || echo "test-123")"
LEAD_ID="lead-$(uuidv4 2>/dev/null || echo "test-456")"

echo "📋 Step 1: Create a campaign with personalization enabled"
curl -s -X POST "${BASE_URL}/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Outreach Campaign",
    "messaging_rules": {
      "personalization": true,
      "researchRequired": true,
      "toneOfVoice": "professional"
    }
  }' | jq '.'
echo ""
echo ""

echo "📋 Step 2: Create a QUALIFIED lead"
curl -s -X POST "${BASE_URL}/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Chen",
    "company": "Stripe",
    "linkedinUrl": "https://linkedin.com/in/sarahchen",
    "email": "sarah.chen@stripe.com",
    "state": "QUALIFIED"
  }' | jq '.'
echo ""
echo ""

echo "📋 Step 3: Trigger research for the lead"
echo "Note: This will take 10-20 seconds as it performs live research"
curl -s -X POST "${BASE_URL}/research/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "'"${LEAD_ID}"'",
    "companyName": "Stripe"
  }' | jq '.'
echo ""
echo ""

echo "📋 Step 4: Get research snapshot"
curl -s "${BASE_URL}/leads/${LEAD_ID}/research" | jq '.'
echo ""
echo ""

echo "📋 Step 5: Generate message with research"
curl -s -X POST "${BASE_URL}/messages/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "'"${LEAD_ID}"'",
    "messageType": "initial"
  }' | jq '.'
echo ""

echo "✅ API tests completed!"
