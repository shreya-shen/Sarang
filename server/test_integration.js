/**
 * Integration Test for Ultra-Advanced Mood Detection
 * Tests the complete flow from Node.js backend to Python service
 */
const { analyzeSentiment } = require('./services/sentimentService');

async function testIntegration() {
  console.log('🧪 Testing Ultra-Advanced Mood Detection Integration');
  console.log('=' * 60);
  
  const testCases = [
    "I'm absolutely thrilled about this amazing opportunity!",
    "I'm feeling blue today",
    "My therapist says I'm making great progress",
    "I'm completely exhausted and overwhelmed"
  ];
  
  let passedTests = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const text = testCases[i];
    console.log(`\n[${i + 1}] Testing: "${text}"`);
    
    try {
      const result = await analyzeSentiment(text);
      
      console.log(`✅ Success!`);
      console.log(`   Primary Emotion: ${result.primary_emotion || result.label || 'N/A'}`);
      console.log(`   Sentiment Score: ${result.sentiment_score || result.score || 'N/A'}`);
      console.log(`   Confidence: ${result.confidence || 'N/A'}`);
      console.log(`   Method: ${result.method || 'N/A'}`);
      console.log(`   Accuracy Level: ${result.accuracy_level || 'N/A'}`);
      
      passedTests++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Integration Test Results:`);
  console.log(`   ✅ Passed: ${passedTests}/${testCases.length}`);
  console.log(`   🎯 Success Rate: ${(passedTests/testCases.length*100).toFixed(1)}%`);
  
  if (passedTests === testCases.length) {
    console.log(`\n🎉 All tests passed! Ready for frontend integration!`);
    console.log(`\n📝 Frontend Integration Instructions:`);
    console.log(`   1. Start your Python service: python start_production_service.py`);
    console.log(`   2. Start your Node.js server: npm run dev (or your start command)`);
    console.log(`   3. Frontend can call: POST /api/mood/analyze`);
    console.log(`   4. Expected response includes: primary_emotion, sentiment_score, confidence`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check if your production service is running on localhost:5001`);
  }
}

// Run the test
testIntegration().catch(console.error);
