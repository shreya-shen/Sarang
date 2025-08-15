const express = require('express');
const requireAuth = require('../utils/clerkAuth');
const { logMood, getMoodHistory, analyzeMoodSentiment, checkSchema, clearSentimentCache } = require('../controllers/moodController');
const router = express.Router();

router.post('/log', requireAuth, logMood);
router.get('/history', requireAuth, getMoodHistory);
router.post('/analyze', analyzeMoodSentiment);
router.get('/check-schema', checkSchema);
router.post('/clear-cache', clearSentimentCache);

module.exports = router;