#!/usr/bin/env python3
"""
Pre-download all required models to cache
Run this once to avoid slow startup times
"""

import os
from pathlib import Path

def preload_models():
    """Download and cache all models"""
    print("🚀 Pre-downloading models for faster startup...")
    
    # 1. spaCy model
    print("📦 Downloading spaCy model...")
    try:
        import spacy
        spacy.cli.download("en_core_web_sm") # type: ignore
        nlp = spacy.load("en_core_web_sm")
        print("✅ spaCy model ready")
    except Exception as e:
        print(f"❌ spaCy error: {e}")
    
    # 2. RoBERTa sentiment model
    print("📦 Downloading RoBERTa sentiment model...")
    try:
        from transformers import pipeline
        model = pipeline("sentiment-analysis",  # type: ignore
                        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                        return_all_scores=True) # type: ignore
        print("✅ RoBERTa model ready")
    except Exception as e:
        print(f"❌ RoBERTa error: {e}")
    
    # 3. Sentence Transformer
    print("📦 Downloading Sentence Transformer...")
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Sentence Transformer ready")
    except Exception as e:
        print(f"❌ Sentence Transformer error: {e}")
    
    print("🎉 All models pre-loaded! Future startups will be much faster.")
    print("💾 Models cached in:")
    print(f"   - spaCy: {Path.home()}/.cache/spacy/")
    print(f"   - Transformers: {Path.home()}/.cache/huggingface/")
    print(f"   - Sentence Transformers: {Path.home()}/.cache/torch/")

if __name__ == "__main__":
    preload_models()
