const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const playlistRoutes = require('./routes/playlist');
const spotifyRoutes = require('./routes/spotify');
const userRoutes = require('./routes/user');

const app = express();
dotenv.config();

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:8080',
      'http://localhost:8080',
      'https://f822f56e9b9f.ngrok-free.app'
    ];
    
    // In production, we'll dynamically add the actual domain
    if (process.env.NODE_ENV === 'production' && process.env.CLIENT_URL) {
      allowedOrigins.push(process.env.CLIENT_URL);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;

// Run HTTP server for ngrok tunneling
app.listen(PORT, () => {
  console.log(`� HTTP Server running on http://localhost:${PORT}`);
  console.log(`� Ready for ngrok tunneling to enable Spotify HTTPS callbacks`);
});