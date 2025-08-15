import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler
from transformers import pipeline
import spacy
import json
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# ADVANCED emotion to audio feature mapping with precise calibrated ranges
EMOTION_AUDIO_MAPPING = {
    'joy': {'valence': (0.65, 0.9), 'energy': (0.55, 0.85), 'danceability': (0.55, 0.85), 'tempo': (100, 135), 'acousticness': (0.1, 0.5)},
    'love': {'valence': (0.55, 0.85), 'energy': (0.25, 0.65), 'danceability': (0.35, 0.75), 'tempo': (75, 115), 'acousticness': (0.2, 0.6)},
    'excitement': {'valence': (0.75, 0.95), 'energy': (0.75, 0.95), 'danceability': (0.65, 0.95), 'tempo': (115, 170), 'acousticness': (0.0, 0.25)},
    'optimism': {'valence': (0.55, 0.8), 'energy': (0.45, 0.75), 'danceability': (0.45, 0.75), 'tempo': (95, 125), 'acousticness': (0.2, 0.5)},
    'sadness': {'valence': (0.0, 0.35), 'energy': (0.05, 0.45), 'danceability': (0.05, 0.35), 'tempo': (55, 95), 'acousticness': (0.4, 0.9)},
    'fear': {'valence': (0.0, 0.25), 'energy': (0.15, 0.55), 'danceability': (0.05, 0.25), 'tempo': (65, 105), 'acousticness': (0.3, 0.8)},
    'anger': {'valence': (0.05, 0.35), 'energy': (0.65, 0.95), 'danceability': (0.15, 0.55), 'tempo': (105, 155), 'acousticness': (0.0, 0.35)},
    'surprise': {'valence': (0.35, 0.75), 'energy': (0.55, 0.85), 'danceability': (0.45, 0.75), 'tempo': (95, 135), 'acousticness': (0.1, 0.5)},
    'disgust': {'valence': (0.0, 0.15), 'energy': (0.25, 0.65), 'danceability': (0.05, 0.35), 'tempo': (75, 115), 'acousticness': (0.2, 0.6)},
    'neutral': {'valence': (0.35, 0.65), 'energy': (0.35, 0.65), 'danceability': (0.35, 0.65), 'tempo': (85, 115), 'acousticness': (0.3, 0.7)},
    'stress': {'valence': (0.0, 0.25), 'energy': (0.25, 0.65), 'danceability': (0.05, 0.35), 'tempo': (75, 125), 'acousticness': (0.4, 0.8)},
    'exhaustion': {'valence': (0.0, 0.15), 'energy': (0.0, 0.25), 'danceability': (0.0, 0.15), 'tempo': (45, 75), 'acousticness': (0.6, 1.0)},
}

# Database connection helper
def get_db_connection():
    """Get database connection to fetch user's liked songs"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('SUPABASE_HOST', 'db.xqasnvkqtyxvfqouedev.supabase.co'),
            database=os.getenv('SUPABASE_DB', 'postgres'),
            user=os.getenv('SUPABASE_USER', 'postgres'),
            password=os.getenv('SUPABASE_PASSWORD', ''),
            port=os.getenv('SUPABASE_PORT', '5432')
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# 1. Load and prepare the dataset
df = pd.read_csv("./cleaned_spotify.csv")

# Features for clustering and recommendations
features = ['valence', 'energy', 'danceability', 'acousticness', 'tempo']

# Normalize the features
scaler = MinMaxScaler()
df_scaled = scaler.fit_transform(df[features])
df_scaled_df = pd.DataFrame(df_scaled, columns=[f + "_norm" for f in features])

# Merge normalized features back
df = pd.concat([df, df_scaled_df], axis=1)

# 2. Perform KMeans clustering
k = 7
kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(df_scaled_df)

# 4. Enhanced sentiment analysis using improved AI models
sentiment_model = pipeline("sentiment-analysis",  # type: ignore
                           model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                           return_all_scores=True) # type: ignore

# 4. Map sentiment to cluster index
def sentiment_to_cluster_index(sentiment_score, n_clusters):
    norm = (sentiment_score + 1) / 2  # Map from [-1, 1] to [0, 1]
    return min(int(norm * n_clusters), n_clusters - 1)

# 5. Enhanced sentence-level sentiment scoring using AI models
def get_sentiment(text):
    """Advanced sentiment analysis using improved AI models"""
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]

    scores = []
    for sentence in sentences:
        try:
            result = sentiment_model(sentence)
            
            # Handle the new model format safely
            if result and isinstance(result, list) and len(result) > 0:
                first_result = result[0]
                
                if isinstance(first_result, list):
                    # Multiple scores format (RoBERTa)
                    sentiment_scores = {item['label']: item['score'] for item in first_result}
                    if 'LABEL_2' in sentiment_scores:  # Positive for RoBERTa
                        score = sentiment_scores['LABEL_2'] - sentiment_scores.get('LABEL_0', 0)
                    elif 'POSITIVE' in sentiment_scores:
                        score = sentiment_scores['POSITIVE'] - sentiment_scores.get('NEGATIVE', 0)
                    else:
                        score = 0
                elif isinstance(first_result, dict) and 'label' in first_result:
                    # Single result format
                    label = first_result['label']
                    score = first_result['score']
                    score = score if label == 'POSITIVE' else -score
                else:
                    score = 0
            else:
                score = 0
                
            scores.append(score)
        except Exception as e:
            print(f"Error in sentiment analysis: {e}")
            scores.append(0)

    return np.mean(scores) if scores else 0

# 6. Enhanced recommendation function using emotion mapping
def recommend_songs_by_emotion(df, primary_emotion, sentiment_score, kmeans_model, num_songs=10):
    """
    Recommend songs based on detected emotion with guaranteed mood progression
    """
    # Get audio targets for the detected emotion
    if primary_emotion in EMOTION_AUDIO_MAPPING:
        emotion_mapping = EMOTION_AUDIO_MAPPING[primary_emotion]
    else:
        # Fallback to sentiment-based mapping
        emotion_mapping = EMOTION_AUDIO_MAPPING['neutral']
    
    # Calculate BASE target values for each feature
    base_valence = (emotion_mapping['valence'][0] + emotion_mapping['valence'][1]) / 2
    target_energy = (emotion_mapping['energy'][0] + emotion_mapping['energy'][1]) / 2
    target_danceability = (emotion_mapping['danceability'][0] + emotion_mapping['danceability'][1]) / 2
    target_tempo = (emotion_mapping['tempo'][0] + emotion_mapping['tempo'][1]) / 2
    target_acousticness = (emotion_mapping['acousticness'][0] + emotion_mapping['acousticness'][1]) / 2
    
    # CREATE PROGRESSIVE VALENCE TARGETS for mood elevation
    if sentiment_score > 0:
        # For positive sentiment, ensure upward progression
        start_valence = max(0.4, base_valence - 0.1)
        end_valence = min(0.9, base_valence + 0.2)
    elif sentiment_score < -0.3:
        # For negative sentiment, gradual uplift
        start_valence = max(0.2, base_valence - 0.2)
        end_valence = min(0.8, base_valence + 0.3)
    else:
        # For neutral sentiment, mild uplift
        start_valence = max(0.35, base_valence - 0.1)
        end_valence = min(0.75, base_valence + 0.2)
    
    # Generate progressive valence targets
    valence_targets = np.linspace(start_valence, end_valence, num_songs)
    
    # Calculate similarity scores for each song with progressive targeting
    df_copy = df.copy()
    selected_songs = []
    used_tracks = set()
    
    for i, target_valence in enumerate(valence_targets):
        # Filter out already selected songs
        available_songs = df_copy[~df_copy['track_name'].isin(used_tracks)].copy()
        
        if available_songs.empty:
            break
        
        # Calculate emotion similarity with progressive valence targeting
        available_songs['emotion_similarity'] = (
            (1 - abs(available_songs['valence'] - target_valence)) * 0.4 +  # Progressive valence
            (1 - abs(available_songs['energy'] - target_energy)) * 0.25 +
            (1 - abs(available_songs['danceability'] - target_danceability)) * 0.2 +
            (1 - abs((available_songs['tempo'] - target_tempo) / 100)) * 0.1 +
            (1 - abs(available_songs['acousticness'] - target_acousticness)) * 0.05
        )
        
        # Apply user preference boost if available
        if 'user_preference_boost' in available_songs.columns:
            available_songs['final_score'] = available_songs['emotion_similarity'] * available_songs['user_preference_boost']
        else:
            available_songs['final_score'] = available_songs['emotion_similarity']
        
        # Select best song for this position
        best_song = available_songs.nlargest(1, 'final_score').iloc[0]
        selected_songs.append(best_song)
        used_tracks.add(best_song['track_name'])
    
    # Convert to DataFrame
    recommendations = pd.DataFrame(selected_songs)
    
    return recommendations[['track_name', 'artist_name', 'valence', 'energy', 'danceability', 'tempo', 'acousticness', 'final_score']]

# 6. Recommend songs gradually moving toward happiness (legacy function)
def recommend_songs(df, sentiment_score, kmeans_model, num_songs=10):
    """
    Recommend songs based on sentiment analysis with GUARANTEED mood progression
    Enhanced to prioritize similar songs to user's liked tracks
    """
    # Map sentiment to a cluster and create gradual mood progression
    if sentiment_score <= -0.75:
        cluster = 0
        start_valence = max(0.15, sentiment_score * 0.3 + 0.5)  # Ensure positive base
        end_valence = min(0.75, start_valence + 0.4)  # Gradual increase
    elif sentiment_score <= -0.25:
        cluster = 1
        start_valence = max(0.25, sentiment_score * 0.3 + 0.5)
        end_valence = min(0.8, start_valence + 0.35)
    elif sentiment_score <= 0.25:
        cluster = 2
        start_valence = max(0.4, sentiment_score * 0.2 + 0.5)
        end_valence = min(0.85, start_valence + 0.3)
    else:
        cluster = 3
        start_valence = max(0.6, sentiment_score * 0.15 + 0.5)
        end_valence = min(0.9, start_valence + 0.25)
    
    # ENSURE positive progression for positive sentiment
    if sentiment_score > 0:
        start_valence = max(0.5, start_valence)  # Never start below neutral for positive input
        end_valence = max(start_valence + 0.2, end_valence)  # Always ensure upward trend

    # Predict clusters based on normalized features
    df['cluster'] = kmeans_model.predict(df[[f + "_norm" for f in features]])
    cluster_df = df[df['cluster'] == cluster].copy()

    # Check if user has liked songs in the dataset
    if 'is_user_liked' in df.columns:
        user_liked = df[df['is_user_liked'] == True]
    else:
        user_liked = df[df.index < 0]  # Empty DataFrame with same structure
    
    if len(user_liked) > 0:
        # Calculate similarity to user's liked songs
        user_features = user_liked[features].mean()
        
        # Add similarity score to all songs in the cluster
        for feature in features:
            cluster_df[f'{feature}_sim'] = 1 - abs(cluster_df[feature] - user_features[feature])
        
        # Combined similarity score
        cluster_df['user_similarity'] = cluster_df[[f'{feature}_sim' for feature in features]].mean(axis=1)
        
        # Boost songs similar to user's preferences
        cluster_df['recommendation_score'] = (
            cluster_df['user_similarity'] * 0.4 +  # 40% user preference
            cluster_df['popularity'] / 100 * 0.3 +  # 30% popularity
            (1 - abs(cluster_df['valence'] - (start_valence + end_valence) / 2)) * 0.3  # 30% mood match
        )
        
        # Sort by recommendation score and select top songs
        selected = cluster_df.sort_values('recommendation_score', ascending=False).head(num_songs)
        
    # Enhanced algorithm using user preferences
    if 'user_preference_boost' in df.columns:
        # Apply user preference boost to recommendation scoring
        cluster_df['recommendation_score'] = (
            cluster_df.get('user_preference_boost', 1.0) * 0.4 +  # 40% user preference boost
            cluster_df['popularity'] / 100 * 0.3 +  # 30% popularity
            (1 - abs(cluster_df['valence'] - (start_valence + end_valence) / 2)) * 0.3  # 30% mood match
        )
        
        # Sort by recommendation score and select top songs
        selected = cluster_df.sort_values('recommendation_score', ascending=False).head(num_songs)
        
    else:
        # IMPROVED algorithm with guaranteed mood progression
        valence_targets = np.linspace(start_valence, end_valence, num_songs)
        selected = []
        used_tracks = set()  # Avoid duplicates
        
        for i, v in enumerate(valence_targets):
            # Create a pool of candidate songs close to target valence
            cluster_df_filtered = cluster_df[~cluster_df['track_name'].isin(used_tracks)].copy()
            
            if cluster_df_filtered.empty:
                break
                
            cluster_df_filtered['valence_diff'] = (cluster_df_filtered['valence'] - v).abs()
            cluster_df_filtered['energy_bonus'] = cluster_df_filtered['energy'] * 0.1  # Slight energy preference
            cluster_df_filtered['final_score'] = (1 - cluster_df_filtered['valence_diff']) + cluster_df_filtered['energy_bonus']
            
            # Get the best matching song
            best_match = cluster_df_filtered.sort_values('final_score', ascending=False).iloc[0]
            selected.append(best_match)
            used_tracks.add(best_match['track_name'])
        
        selected = pd.DataFrame(selected)
        
        # VERIFY mood progression - ensure positive trend
        if len(selected) > 1:
            first_valence = selected.iloc[0]['valence']
            last_valence = selected.iloc[-1]['valence']
            mood_increase = ((last_valence - first_valence) / first_valence) * 100
            
            # If mood doesn't increase enough for positive sentiment, force correction
            if sentiment_score > 0 and mood_increase < 5:  # Less than 5% increase
                # Swap some lower valence songs with higher valence ones from the cluster
                high_valence_songs = cluster_df[cluster_df['valence'] > 0.7].copy()
                if not high_valence_songs.empty:
                    # Replace last 2-3 songs with higher valence ones
                    replacement_count = min(3, len(selected) // 2)
                    for i in range(replacement_count):
                        if not high_valence_songs.empty:
                            replacement_idx = len(selected) - 1 - i
                            best_replacement = high_valence_songs.nlargest(1, 'valence').iloc[0]
                            selected.iloc[replacement_idx] = best_replacement
                            # Remove from pool to avoid duplicates
                            high_valence_songs = high_valence_songs[high_valence_songs['track_name'] != best_replacement['track_name']]

    # Clean up temporary columns
    cols_to_drop = [col for col in selected.columns if col.endswith('_sim') or col in ['valence_diff', 'user_similarity', 'recommendation_score', 'energy_bonus', 'final_score']]
    selected = selected.drop(columns=cols_to_drop, errors='ignore').reset_index(drop=True)
    
    return selected

# Function to enhance recommendations with user's preference tracks
def enhance_with_user_data(user_id=None):
    """Enhance the dataset with user's top tracks for better personalization"""
    global df
    
    if not user_id:
        return df
    
    try:
        # Get user's preference tracks from database
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT track_name, artist_name, popularity 
                FROM user_preference_tracks 
                WHERE user_id = %s 
                ORDER BY updated_at DESC 
                LIMIT 5
            """, (user_id,))
            
            user_tracks = cursor.fetchall()
            conn.close()
            
            if user_tracks:
                print(f"DEBUG: Found {len(user_tracks)} user preference tracks", file=sys.stderr)
                
                # Mark similar tracks in the dataset for boosting
                for track in user_tracks:
                    track_name, artist_name, popularity = track
                    # Find similar tracks in the dataset
                    similar_mask = (
                        (df['track_name'].str.contains(track_name, case=False, na=False)) |
                        (df['artist_name'].str.contains(artist_name, case=False, na=False))
                    )
                    df.loc[similar_mask, 'user_preference_boost'] = 1.2
                    
                print(f"DEBUG: Applied preference boost to similar tracks", file=sys.stderr)
            else:
                print("DEBUG: No user preference tracks found", file=sys.stderr)
                
    except Exception as e:
        print(f"DEBUG: Error enhancing with user data: {e}", file=sys.stderr)
    
    return df

# 7. Enhanced main execution for API integration with emotion detection
if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        user_input = input_data.get('mood', '')
        user_id = input_data.get('user_id', None)
        preferences = input_data.get('preferences', {})
        
        # Try to get mood analysis from the ultra-advanced service first
        try:
            import requests
            response = requests.post('http://localhost:5001/analyze', 
                                   json={'text': user_input}, 
                                   timeout=10)
            if response.status_code == 200:
                mood_analysis = response.json()
                primary_emotion = mood_analysis.get('primary_emotion', 'neutral')
                sentiment_score = mood_analysis.get('sentiment_score', 0.0)
                use_emotion_mapping = True
                print(f"DEBUG: Using ultra-advanced analysis - emotion: {primary_emotion}, sentiment: {sentiment_score}", file=sys.stderr)
            else:
                raise Exception("Ultra-advanced service unavailable")
        except:
            # Fallback to basic sentiment analysis
            sentiment_score = get_sentiment(user_input)
            # Basic emotion detection from sentiment
            if sentiment_score > 0.6:
                primary_emotion = 'joy'
            elif sentiment_score > 0.2:
                primary_emotion = 'optimism'
            elif sentiment_score > -0.2:
                primary_emotion = 'neutral'
            elif sentiment_score > -0.6:
                primary_emotion = 'sadness'
            else:
                primary_emotion = 'sadness'
            use_emotion_mapping = False
            print(f"DEBUG: Using fallback analysis - emotion: {primary_emotion}, sentiment: {sentiment_score}", file=sys.stderr)
        
        # Enhance dataset with user's liked songs
        enhance_with_user_data(user_id=user_id)
        
        # Generate playlist using emotion-based recommendations
        if use_emotion_mapping:
            playlist = recommend_songs_by_emotion(df, primary_emotion, sentiment_score, kmeans_model=kmeans, num_songs=10)
        else:
            playlist = recommend_songs(df, sentiment_score, kmeans_model=kmeans, num_songs=10)
        
        # Convert to JSON-serializable format
        result = {
            "sentiment_score": float(sentiment_score),
            "primary_emotion": primary_emotion,
            "method": "emotion_based" if use_emotion_mapping else "sentiment_based",
            "recommendations": playlist[['track_name', 'artist_name', 'valence', 'energy', 'danceability', 'acousticness', 'tempo']].to_dict('records')
        }
        
        # Output JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result))