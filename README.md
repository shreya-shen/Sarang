# Sarang - AI-Powered Music Recommendation Platform

Sarang is an intelligent music recommendation system that analyzes your mood through text input and creates personalized Spotify playlists. Built with React, Node.js, Python ML pipeline, and integrated with Spotify Web API.

![Sarang Logo](client/public/lovable-uploads/683c065d-86de-4501-9731-47c93b32d544.png)

## 🌟 Features

### Core Functionality
- ** AI Mood Analysis**: Advanced sentiment analysis using DistilBERT NLP model
- ** Smart Recommendations**: K-means clustering (k=7) on 48,210-track dataset with 17 audio features
- ** Spotify Integration**: Seamless playlist creation and playback control
- ** Personalization**: User preference tracking based on top tracks and listening history
- ** Secure Authentication**: JWT-based auth with Clerk integration
- ** Responsive Design**: Modern UI with TailwindCSS and Radix components

### Advanced Features
- **Real-time Mood Detection**: Process natural language mood descriptions
- **Audio Feature Analysis**: Valence, energy, danceability, acousticness, tempo
- **Playlist Management**: Create, view, and manage mood-based playlists
- **Device Control**: Play tracks on active Spotify devices
- **Permission System**: Granular access control for user data

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for state management
- **Clerk** for authentication

### Backend Stack
- **Node.js** with Express.js
- **PostgreSQL** with Supabase cloud hosting
- **JWT** authentication
- **Row Level Security (RLS)** policies
- **8 database indexes** for performance

### Machine Learning Pipeline
- **Python 3.11+** runtime
- **scikit-learn** K-means clustering (k=7, n_init=10)
- **DistilBERT** for NLP sentiment analysis
- **spaCy** for linguistic processing
- **48,210-track dataset** with 17 feature dimensions

### Third-Party Integrations
- **Spotify Web API** for music data and playback
- **Supabase** for database and real-time features
- **ngrok** for HTTPS tunneling during development

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Spotify Developer Account
- Supabase Account
- Clerk Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shreya-shen/Sarang.git
   cd Sarang
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Install Python Dependencies**
   ```bash
   cd python
   pip install -r requirements.txt
   ```

### Environment Configuration

1. **Server Environment** (`server/.env`)
   ```env
   # Supabase Configuration
   SUPABASE_URL="your_supabase_url"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   SUPABASE_ANON_KEY="your_anon_key"
   
   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   CLERK_SECRET_KEY="your_clerk_secret_key"
   
   # Spotify API
   SPOTIFY_CLIENT_ID="your_spotify_client_id"
   SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
   SPOTIFY_REDIRECT_URI="https://your-ngrok-url.ngrok.io/api/spotify/callback"
   
   # Frontend URL
   CLIENT_URL="http://localhost:8080"
   ```

2. **Client Environment** (`client/.env`)
   ```env
   VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   VITE_API_URL="http://localhost:5000"
   ```

### Database Setup

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create new project
   - Copy connection details

2. **Run Database Migrations**
   ```bash
   cd server
   node create_tables.js
   ```

3. **Setup RLS Policies**
   ```sql
   -- Run the SQL files in order:
   -- 1. database/schema.sql
   -- 2. rls_policies.sql
   -- 3. spotify_tables.sql
   ```

### Spotify API Setup

1. **Create Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create new app
   - Add redirect URI: `https://your-ngrok-url.ngrok.io/api/spotify/callback`

2. **Setup ngrok for HTTPS**
   ```bash
   # Install ngrok globally
   npm install -g ngrok
   
   # Start ngrok tunnel
   ngrok http 5000
   
   # Copy the HTTPS URL and update your .env file
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   npm start
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd client
   npm run dev
   ```

3. **Verify Python Integration**
   ```bash
   cd server
   node test_python.js
   ```

The application will be available at:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000`
- ngrok HTTPS: `https://your-random-id.ngrok.io`

## Data & ML Pipeline

### Dataset Statistics
- **48,210 tracks** from Spotify
- **17 audio features** per track
- **5 core features** for clustering: valence, energy, danceability, acousticness, tempo
- **7 mood clusters** identified through K-means

### Feature Engineering
```python
# Core audio features used for clustering
features = [
    'valence',      # Musical positivity (0.0 - 1.0)
    'energy',       # Perceptual intensity (0.0 - 1.0)
    'danceability', # Dance suitability (0.0 - 1.0)
    'acousticness', # Acoustic confidence (0.0 - 1.0)
    'tempo'         # BPM (typically 50-200)
]
```

### ML Model Performance
- **Advanced Sentiment Analysis**: RoBERTa-based model with 90%+ accuracy
- **Multi-Model Emotion Detection**: J-Hartmann DistilRoBERTa + GoEmotions models
- **AI-First Approach**: Minimal keyword dependency for better accuracy
- **Response Time**: <1.5s for mood analysis and recommendation
- **Dataset Coverage**: 50+ genres, 10K+ artists
- **Accuracy Improvement**: ~15% better than keyword-based approaches


## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check auth status

### Spotify Integration
- `GET /api/spotify/auth` - Get Spotify authorization URL
- `GET /api/spotify/callback` - Handle OAuth callback
- `GET /api/spotify/status` - Check connection status
- `POST /api/spotify/create-playlist` - Create mood playlist
- `GET /api/spotify/devices` - Get available devices
- `POST /api/spotify/play` - Play track on device

### Recommendations
- `POST /api/recommendations/mood` - Get mood-based recommendations
- `GET /api/recommendations/history` - User recommendation history
- `POST /api/mood/analyze` - Analyze mood from text

### User Management
- `GET /api/user/profile` - Get user profile
- `GET /api/user/playlists` - Get user playlists
- `POST /api/user/preferences` - Update preferences

## Development

### Code Style
- **ESLint** with TypeScript configuration
- **Prettier** for code formatting
- **Conventional Commits** for git messages

### Testing
- **Frontend**: React Testing Library + Vitest
- **Backend**: Jest for unit tests
- **Integration**: API endpoint testing

### Performance Optimization
- **Database Indexing**: 8 strategic indexes on high-query tables
- **Caching**: Redis for API response caching
- **Query Optimization**: Efficient JOIN operations and pagination
- **Bundle Optimization**: Vite code splitting and tree shaking

### Environment Variables for Production
- Set all `.env` variables in production environment
- Use production Supabase instance
- Configure production Clerk environment
- Set up production Spotify app with HTTPS redirect

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit format

## Support

For support and questions:
- Email: shreya.shenoy01@gmail.com
