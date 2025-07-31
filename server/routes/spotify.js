const express = require('express');
const { 
  authorizeSpotify, 
  handleSpotifyCallback, 
  getConnectionStatus,
  fetchLikedSongs,
  syncAllLikedSongs,
  createMoodPlaylist,
  playTrackOnSpotify,
  getAvailableDevices,
  disconnectSpotifyAccount,
  getUserPlaylists,
  checkActiveDevices,
  fetchTopTracks,
  grantTopTracksPermission,
  revokeTopTracksPermission,
  getTopTracksPermissionStatus,
  testSpotifyConnectionEndpoint
} = require('../controllers/spotifyController');
const requireAuth = require('../utils/clerkAuth');

const router = express.Router();

// Authentication routes
router.get('/authorize', requireAuth, authorizeSpotify);
router.get('/callback', handleSpotifyCallback);
router.get('/status', requireAuth, getConnectionStatus);
router.delete('/disconnect', requireAuth, disconnectSpotifyAccount);

// Debug route
router.get('/test-connection', requireAuth, testSpotifyConnectionEndpoint);

// Music data routes
router.get('/liked', requireAuth, fetchLikedSongs);
router.get('/top-tracks', requireAuth, fetchTopTracks);
router.post('/sync-liked', requireAuth, syncAllLikedSongs);
router.get('/playlists', requireAuth, getUserPlaylists);

// Top tracks permission routes
router.post('/grant-top-tracks-permission', requireAuth, grantTopTracksPermission);
router.delete('/revoke-top-tracks-permission', requireAuth, revokeTopTracksPermission);
router.get('/top-tracks-permission-status', requireAuth, getTopTracksPermissionStatus);

// Playback control routes
router.post('/play', requireAuth, playTrackOnSpotify);
router.get('/devices', requireAuth, getAvailableDevices);
router.get('/devices/active', requireAuth, checkActiveDevices);

// Playlist management routes
router.post('/create-playlist', requireAuth, createMoodPlaylist);

module.exports = router;