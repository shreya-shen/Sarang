#!/usr/bin/env python3
"""
Comprehensive Test Script for Sentiment Analysis
Tests sentiment accuracy without requiring heavy AI models
"""

import asyncio
import sys
import os

try:
    from improved_mood_ai import ultra_advanced_analyze_mood
    ADVANCED_MODE = True
except ImportError:
    print("⚠️  Advanced mood AI not available, testing sentiment analysis only")
    ADVANCED_MODE = False

from sentiment_analysis import get_sentiment

# Comprehensive test cases from user requirements
TEST_CASES = [
    {"text": "I feel amazing today!", "expected_sentiment": 0.85, "expected_mood": "joy", "notes": "Strong positive tone"},
    {"text": "Everything is going wrong", "expected_sentiment": -0.85, "expected_mood": "sadness", "notes": "Strong negative tone"},
    {"text": "I am so tired but also kind of proud", "expected_sentiment": 0.2, "expected_mood": "mixed_positive", "notes": "Conflicting feelings"},
    {"text": "I'm anxious about tomorrow", "expected_sentiment": -0.6, "expected_mood": "fear", "notes": "Anticipatory stress"},
    {"text": "I guess things are okay", "expected_sentiment": 0.1, "expected_mood": "neutral", "notes": "Weak sentiment"},
    {"text": "I feel loved and appreciated", "expected_sentiment": 0.9, "expected_mood": "love", "notes": "Social positivity"},
    {"text": "It's not too bad, I suppose", "expected_sentiment": 0.15, "expected_mood": "neutral", "notes": "Mildly positive"},
    {"text": "I can't take this anymore", "expected_sentiment": -0.95, "expected_mood": "anger", "notes": "High-intensity negative"},
    {"text": "Work was stressful but I enjoyed lunch", "expected_sentiment": 0.05, "expected_mood": "mixed_positive", "notes": "Contradictory tone"},
    {"text": "I'm feeling down but hopeful", "expected_sentiment": 0.0, "expected_mood": "mixed_positive", "notes": "Equal neg & pos"},
    {"text": "Meh", "expected_sentiment": 0.0, "expected_mood": "neutral", "notes": "Low emotional energy"},
    {"text": "I am heartbroken", "expected_sentiment": -0.9, "expected_mood": "sadness", "notes": "Strong negative emotion"},
    {"text": "So excited for the weekend!!!", "expected_sentiment": 0.95, "expected_mood": "excitement", "notes": "High arousal, positive"},
    {"text": "Nervous but ready", "expected_sentiment": 0.3, "expected_mood": "mixed_positive", "notes": "Pos + anxious"},
    {"text": "Life feels empty", "expected_sentiment": -0.85, "expected_mood": "sadness", "notes": "Low energy, negative"},
    {"text": "It's a bittersweet day", "expected_sentiment": 0.0, "expected_mood": "bittersweet", "notes": "Equal positive & negative"},
    {"text": "I just want to curl up and cry", "expected_sentiment": -0.9, "expected_mood": "sadness", "notes": "Negative, low energy"},
    {"text": "That was awesome!", "expected_sentiment": 0.85, "expected_mood": "joy", "notes": "Short but intense"},
    {"text": "That was terrible", "expected_sentiment": -0.85, "expected_mood": "anger", "notes": "Strong negative"},
    {"text": "Could be worse", "expected_sentiment": 0.1, "expected_mood": "neutral", "notes": "Mildly positive sarcasm"},
    {"text": "I'm feeling hopeful and scared", "expected_sentiment": 0.1, "expected_mood": "mixed_positive", "notes": "Contradictory"},
    {"text": "😄", "expected_sentiment": 0.9, "expected_mood": "joy", "notes": "Emoji-based"},
    {"text": "😔", "expected_sentiment": -0.8, "expected_mood": "sadness", "notes": "Emoji-based"},
    {"text": "😭😭😭", "expected_sentiment": -0.95, "expected_mood": "sadness", "notes": "Intense emoji use"},
    {"text": "🤷‍♂️ whatever", "expected_sentiment": -0.1, "expected_mood": "apathetic", "notes": "Low emotional involvement"},
    {"text": "lol that's just my luck", "expected_sentiment": -0.4, "expected_mood": "resigned", "notes": "Sarcastic negative"},
    {"text": "Feeling calm and peaceful", "expected_sentiment": 0.7, "expected_mood": "joy", "notes": "Low arousal positive"},
    {"text": "This is so unfair", "expected_sentiment": -0.8, "expected_mood": "anger", "notes": "High arousal negative"},
    {"text": "Finally, some good news!", "expected_sentiment": 0.9, "expected_mood": "joy", "notes": "Positive surprise"},
    {"text": "Why does this always happen to me?", "expected_sentiment": -0.85, "expected_mood": "anger", "notes": "Victim mentality"},
    {"text": "Mixed bag today – happy moments but also stress", "expected_sentiment": 0.05, "expected_mood": "mixed_positive", "notes": "Balanced emotions"},
    {"text": "I'm on top of the world", "expected_sentiment": 0.95, "expected_mood": "excitement", "notes": "Very high positive"},
    {"text": "Feeling trapped and helpless", "expected_sentiment": -0.9, "expected_mood": "fear", "notes": "Negative, low control"},
    {"text": "Bored out of my mind", "expected_sentiment": -0.4, "expected_mood": "apathetic", "notes": "Low energy"},
    {"text": "Completely overwhelmed", "expected_sentiment": -0.7, "expected_mood": "stress", "notes": "Strong negative"},
    {"text": "Can't wait for vacation!", "expected_sentiment": 0.85, "expected_mood": "excitement", "notes": "Anticipatory positive"},
    {"text": "I don't care anymore", "expected_sentiment": -0.6, "expected_mood": "apathetic", "notes": "Low motivation"},
    {"text": "Grateful for small wins", "expected_sentiment": 0.7, "expected_mood": "joy", "notes": "Low-medium arousal positive"},
    {"text": "This sucks but I'll deal with it", "expected_sentiment": -0.3, "expected_mood": "resigned", "notes": "Negative but coping"},
    {"text": "Happy tears", "expected_sentiment": 0.7, "expected_mood": "joy", "notes": "Positive with emotional tone"}
]

async def comprehensive_test():
    """Run comprehensive test suite with detailed analysis"""
    print("🚀 COMPREHENSIVE MOOD DETECTION TEST SUITE")
    print("=" * 60)
    print(f"Testing {len(TEST_CASES)} comprehensive test cases...")
    print("=" * 60)
    
    passed_sentiment = 0
    passed_mood = 0
    total_tests = len(TEST_CASES)
    
    for i, test_case in enumerate(TEST_CASES, 1):
        try:
            # Test both basic sentiment analysis and advanced mood detection
            basic_sentiment = get_sentiment(test_case["text"])
            advanced_result = await ultra_advanced_analyze_mood(test_case["text"])
            
            # Check sentiment accuracy (within 0.2 tolerance)
            sentiment_diff = abs(basic_sentiment - test_case["expected_sentiment"])
            sentiment_passed = sentiment_diff <= 0.2
            
            # Check mood accuracy (exact match for primary emotion)
            mood_passed = advanced_result["primary_emotion"] == test_case["expected_mood"]
            
            if sentiment_passed:
                passed_sentiment += 1
            if mood_passed:
                passed_mood += 1
            
            status = "✅" if (sentiment_passed and mood_passed) else "⚠️" if (sentiment_passed or mood_passed) else "❌"
            
            print(f"\n[{i:2d}] {test_case['text'][:50]}{'...' if len(test_case['text']) > 50 else ''}")
            print(f"     Expected: Sentiment={test_case['expected_sentiment']:+.2f}, Mood={test_case['expected_mood']}")
            print(f"     Got:      Sentiment={basic_sentiment:+.2f}, Mood={advanced_result['primary_emotion']}")
            print(f"     Status:   {status} Sentiment {'✓' if sentiment_passed else '✗'} | Mood {'✓' if mood_passed else '✗'}")
            print(f"     Notes:    {test_case['notes']}")
            
            if not (sentiment_passed and mood_passed):
                print(f"     Debug:    Confidence={advanced_result['confidence']:.3f}, Intensity={advanced_result['intensity_level']}")
                
        except Exception as e:
            print(f"\n[{i:2d}] ❌ ERROR: {test_case['text']}")
            print(f"     Exception: {str(e)}")
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS:")
    print(f"Sentiment Accuracy: {passed_sentiment}/{total_tests} ({passed_sentiment/total_tests*100:.1f}%)")
    print(f"Mood Accuracy:      {passed_mood}/{total_tests} ({passed_mood/total_tests*100:.1f}%)")
    print(f"Combined Accuracy:  {min(passed_sentiment, passed_mood)}/{total_tests} ({min(passed_sentiment, passed_mood)/total_tests*100:.1f}%)")
    print("=" * 60)
    
    return passed_sentiment, passed_mood, total_tests

async def simple_test():
    """Simple test with clear expected results"""
    test_cases = [
        {"text": "I am absolutely thrilled about this amazing opportunity!", "expected": "excitement"},
        {"text": "I'm feeling blue today", "expected": "sadness"},
        {"text": "I'm completely exhausted and overwhelmed", "expected": "exhaustion"},
        {"text": "I'm over the moon about this news!", "expected": "excitement"},
        {"text": "My therapist says I'm making great progress", "expected": "optimism"}
    ]
    
    print("\n🚀 Simple Mood Detection Test")
    print("=" * 50)
    
    correct = 0
    for i, test_case in enumerate(test_cases, 1):
        try:
            result = await ultra_advanced_analyze_mood(test_case["text"])
            predicted = result["primary_emotion"]
            expected = test_case["expected"]
            is_correct = predicted == expected
            
            if is_correct:
                correct += 1
                status = "✅ CORRECT"
            else:
                status = "❌ WRONG"
            
            print(f"\n[{i}] {test_case['text']}")
            print(f"    Expected: {expected}")
            print(f"    Predicted: {predicted}")
            print(f"    Status: {status}")
            print(f"    Confidence: {result['confidence']:.3f}")
            print(f"    Sentiment: {result['sentiment_score']:.3f}")
            print(f"    Intensity: {result['intensity_level']}")
            
            # Show detailed analysis for debugging
            if not is_correct:
                print(f"    🔍 Debug Info:")
                if 'analysis_details' in result:
                    emotions = result['analysis_details']['emotion_scores']
                    print(f"        All emotions detected: {emotions}")
                    print(f"        Context: {result.get('context_detected', 'None')}")
                    
                    # Show top 3 emotions with scores
                    sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:3]
                    print(f"        Top 3 emotions: {sorted_emotions}")
        
        except Exception as e:
            print(f"\n[{i}] ERROR: {str(e)}")
            print(f"    Text: {test_case['text']}")
            import traceback
            traceback.print_exc()
    
    accuracy = (correct / len(test_cases)) * 100
    print(f"\n📊 Simple Test Accuracy: {accuracy:.1f}% ({correct}/{len(test_cases)})")
    
    if accuracy >= 90:
        print("🎯 Excellent! Target accuracy achieved!")
    elif accuracy >= 80:
        print("👍 Good! Close to target accuracy.")
    else:
        print("🔄 Needs improvement.")
    
    return correct, len(test_cases)

if __name__ == "__main__":
    # Test a quick sample first
    print("🧪 Quick Test Sample:")
    print("-" * 30)
    
    # Quick test of the specific issue
    import asyncio
    async def quick_test():
        try:
            text = "My therapist says I'm making great progress"
            result = await ultra_advanced_analyze_mood(text)
            print(f"Text: {text}")
            print(f"Predicted mood: {result['primary_emotion']}")
            print(f"Sentiment: {result['sentiment_score']:.3f}")
            print(f"All emotions: {result.get('analysis_details', {}).get('emotion_scores', {})}")
        except Exception as e:
            print(f"Quick test error: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(quick_test())
    print("\n")
    
    # Run comprehensive test first, then simple test
    asyncio.run(comprehensive_test())
    simple_correct, simple_total = asyncio.run(simple_test())
    
    print(f"\n🎯 OVERALL SUMMARY:")
    print(f"Simple Test: {(simple_correct/simple_total)*100:.1f}% accuracy")
    print("Run complete!")
