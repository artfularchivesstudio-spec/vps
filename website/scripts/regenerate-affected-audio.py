#!/usr/bin/env python3
"""
Regenerate Affected Audio Files
==============================

This script regenerates the Spanish and Hindi audio files that were found to contain
English content instead of the correct language content.

Requirements:
- requests
- pandas
- python-dotenv

Usage:
python scripts/regenerate-affected-audio.py --job-id 19587fa4-1fbf-4e4e-adbb-8bd9772aab9e
"""

import os
import sys
import json
import requests
import argparse
from datetime import datetime
import pandas as pd
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

class AudioRegenerator:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }

        print("Audio Regenerator initialized")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make API request to Supabase"""
        url = f"{self.supabase_url}/rest/v1/{endpoint}"

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers, params=data)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, headers=self.headers, json=data)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json() if response.content else None
        except requests.exceptions.RequestException as e:
            print(f"API request failed for {endpoint}: {e}")
            return None

    def get_audio_job(self, job_id: str) -> Optional[Dict]:
        """Get audio job by ID"""
        result = self.make_request('GET', f'audio_jobs?id=eq.{job_id}')
        if result and len(result) > 0:
            return result[0]
        return None

    def get_post_content(self, post_id: str) -> Optional[Dict]:
        """Get post content for translation"""
        result = self.make_request('GET', f'posts?id=eq.{post_id}')
        if result and len(result) > 0:
            return result[0]
        return None

    def translate_text(self, text: str, target_language: str, source_language: str = 'en') -> str:
        """Translate text using the translation API"""
        try:
            response = requests.post(
                f"{os.getenv('SUPABASE_URL')}/functions/v1/translate",
                headers={
                    'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
                    'Content-Type': 'application/json'
                },
                json={
                    'text': text,
                    'target_language': target_language,
                    'source_language': source_language
                }
            )

            if response.status_code == 200:
                result = response.json()
                return result.get('translated_text', text)
            else:
                print(f"Translation failed: {response.status_code}")
                return text
        except Exception as e:
            print(f"Translation error: {e}")
            return text

    def regenerate_audio(self, job_id: str, language: str) -> bool:
        """Regenerate audio for a specific language"""
        print(f"\n🔄 Regenerating {language.upper()} audio for job {job_id}")

        # Get job data
        job_data = self.get_audio_job(job_id)
        if not job_data:
            print(f"❌ Could not find job {job_id}")
            return False

        post_id = job_data.get('post_id')
        if not post_id:
            print(f"❌ No post_id found in job {job_id}")
            return False

        # Get original post content
        post_data = self.get_post_content(post_id)
        if not post_data:
            print(f"❌ Could not find post {post_id}")
            return False

        # Get the original English text
        original_text = post_data.get('content', '') or post_data.get('text_content', '')
        if not original_text:
            print(f"❌ No content found in post {post_id}")
            return False

        print(f"📝 Original text length: {len(original_text)} characters")

        # Translate text if needed
        if language != 'en':
            print(f"🌐 Translating to {language.upper()}...")
            translated_text = self.translate_text(original_text, language)
            if translated_text != original_text:
                print(f"✅ Translation completed ({len(translated_text)} characters)")
            else:
                print(f"⚠️ Translation may have failed, using original text")
                translated_text = original_text
        else:
            translated_text = original_text
            print(f"🇺🇸 Using original English text")

        # Generate audio using the existing Supabase Edge Function
        print(f"🎵 Generating {language.upper()} audio using existing edge function...")

        try:
            # Use the existing ai-generate-audio-simple edge function
            response = requests.post(
                f"{os.getenv('SUPABASE_URL')}/functions/v1/ai-generate-audio-simple",
                headers={
                    'Authorization': f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
                    'Content-Type': 'application/json'
                },
                json={
                    'text': translated_text,
                    'languages': [language],
                    'title': f'Regenerated {language.upper()} Audio for Post {post_id}',
                    'voice_id': f'{language}_voice_1' if language != 'hi' else 'fable'  # Use proper voice mapping
                }
            )

            if response.status_code in [200, 202]:  # 202 is accepted for async processing
                result = response.json()
                if result.get('success'):
                    print(f"✅ Audio regeneration job created for {language.upper()}")
                    print(f"📊 New Job ID: {result.get('job_id', 'Unknown')}")
                    print(f"📋 Status: {result.get('status', 'pending')}")
                    return True
                else:
                    print(f"❌ Audio generation failed: {result.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ Audio generation failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Audio generation error: {e}")
            return False

    def regenerate_job_languages(self, job_id: str, languages: List[str]) -> Dict:
        """Regenerate audio for multiple languages in a job"""
        results = {
            'job_id': job_id,
            'languages_attempted': languages,
            'successful_regenerations': [],
            'failed_regenerations': []
        }

        print(f"\n🎯 Starting regeneration for job {job_id}")
        print(f"📋 Languages to regenerate: {', '.join(languages).upper()}")

        for language in languages:
            success = self.regenerate_audio(job_id, language)
            if success:
                results['successful_regenerations'].append(language)
            else:
                results['failed_regenerations'].append(language)

        print("\n📊 REGENERATION SUMMARY:")
        print(f"✅ Successful: {len(results['successful_regenerations'])}")
        print(f"❌ Failed: {len(results['failed_regenerations'])}")
        print(f"📋 Languages: {', '.join(results['successful_regenerations'] + results['failed_regenerations']).upper()}")

        return results

def main():
    parser = argparse.ArgumentParser(description='Regenerate affected audio files')
    parser.add_argument('--job-id', required=True, help='Audio job ID to regenerate')
    parser.add_argument('--languages', nargs='+', default=['es', 'hi'],
                       help='Languages to regenerate (default: es hi)')

    args = parser.parse_args()

    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
        print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
        sys.exit(1)

    print("🎵 AUDIO REGENERATION SCRIPT")
    print("=" * 50)
    print(f"Job ID: {args.job_id}")
    print(f"Languages: {', '.join(args.languages).upper()}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # Create regenerator
    regenerator = AudioRegenerator()

    # Regenerate audio
    results = regenerator.regenerate_job_languages(args.job_id, args.languages)

    # Save results
    results_file = f"regeneration_results_{args.job_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)

    print("\n💾 Results saved to:")
    print(f"📄 {results_file}")

    # Final status
    if len(results['failed_regenerations']) == 0:
        print("\n🎉 ALL REGENERATIONS COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print(f"\n⚠️ {len(results['failed_regenerations'])} regenerations failed")
        sys.exit(1)

if __name__ == '__main__':
    main()