const express = require('express');
const requireAuth = require('../utils/clerkAuth');
const { logMood, getMoodHistory, analyzeMoodSentiment, checkSchema, clearSentimentCache } = require('../controllers/moodController');
const router = express.Router();

router.post('/log', requireAuth, logMood);
router.get('/history', requireAuth, getMoodHistory);
router.post('/analyze', analyzeMoodSentiment); // No auth needed for sentiment analysis
router.get('/check-schema', checkSchema); // Temporary diagnostic endpoint
router.post('/clear-cache', clearSentimentCache); // Clear sentiment analysis cache

module.exports = router;