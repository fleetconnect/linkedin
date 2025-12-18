#!/bin/bash

# Example API usage for LinkedIn Intent Classifier
# Make sure the server is running first: npm run dev

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing LinkedIn Intent Classifier API"
echo ""

# Health check
echo "1. Health Check"
curl -s "${BASE_URL}/health" | jq '.'
echo ""
echo ""

# Create a test lead first (you'll need to do this through the StorageService)
# For this example, we'll use a pre-existing lead ID
LEAD_ID="test-lead-123"

# Classify a single message
echo "2. Classify Single Message - Interested"
curl -s -X POST "${BASE_URL}/classify" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "'"${LEAD_ID}"'",
    "messageContent": "This sounds interesting! Can you tell me more about pricing and features?"
  }' | jq '.'
echo ""
echo ""

# Classify another message
echo "3. Classify Single Message - Booked"
curl -s -X POST "${BASE_URL}/classify" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "'"${LEAD_ID}"'",
    "messageContent": "Perfect! Let'\''s schedule a call for Tuesday at 3pm."
  }' | jq '.'
echo ""
echo ""

# Batch classification
echo "4. Batch Classification"
curl -s -X POST "${BASE_URL}/classify/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "leadId": "'"${LEAD_ID}"'",
        "messageContent": "Thanks for reaching out!"
      },
      {
        "leadId": "'"${LEAD_ID}"'",
        "messageContent": "Not interested, please stop contacting me."
      }
    ]
  }' | jq '.'
echo ""
echo ""

# Get lead statistics
echo "5. Get Lead Statistics"
curl -s "${BASE_URL}/leads/${LEAD_ID}/stats" | jq '.'
echo ""

echo "✅ API tests completed!"
