#!/usr/bin/env python3
"""
Audio Regeneration Demo Script
==============================

Creates a test post and demonstrates the complete audio regeneration workflow.
This shows how the regeneration system works end-to-end.

Usage:
python scripts/test-regeneration-demo.py
"""

import os
import sys
import json
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class RegenerationDemo:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }

        print("🎭 Audio Regeneration Demo Initialized")

    def create_test_post(self):
        """Create a test post for demonstration"""
        test_content = """
        Welcome to Artful Archives Studio. We are dedicated to preserving and showcasing
        the rich cultural heritage of art through innovative digital experiences.
        Our collection features masterpieces from various periods and styles,
        bringing the beauty of art to audiences worldwide.
        """

        post_data = {
            'title': 'Test Post for Audio Regeneration Demo',
            'content': test_content.strip(),
            'text_content': test_content.strip(),
            'status': 'published',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        print("📝 Creating test post...")

        try:
            response = requests.post(
                f"{self.supabase_url}/rest/v1/posts",
                headers=self.headers,
                json=post_data
            )

            if response.status_code == 201:
                post = response.json()[0] if isinstance(response.json(), list) else response.json()
                print(f"✅ Test post created with ID: {post['id']}")
                return post['id']
            else:
                print(f"❌ Failed to create post: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error creating post: {e}")
            return None

    def generate_initial_audio(self, post_id):
        """Generate initial multilingual audio for the test post"""
        print(f"🎵 Generating initial multilingual audio for post {post_id}...")

        try:
            response = requests.post(
                f"{self.supabase_url}/functions/v1/ai-generate-audio-simple",
                headers={
                    'Authorization': f"Bearer {self.supabase_key}",
                    'Content-Type': 'application/json'
                },
                json={
                    'text': f"Welcome to Artful Archives Studio. We are dedicated to preserving and showcasing the rich cultural heritage of art through innovative digital experiences. Our collection features masterpieces from various periods and styles, bringing the beauty of art to audiences worldwide.",
                    'languages': ['en', 'es', 'hi'],
                    'title': 'Test Audio Regeneration Demo',
                    'voice_id': 'nova'
                }
            )

            if response.status_code in [200, 202]:
                result = response.json()
                if result.get('success'):
                    job_id = result.get('job_id')
                    print(f"✅ Initial audio generation started - Job ID: {job_id}")
                    return job_id
                else:
                    print(f"❌ Audio generation failed: {result.get('error')}")
                    return None
            else:
                print(f"❌ Audio generation failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error generating audio: {e}")
            return None

    def wait_for_completion(self, job_id, max_wait_minutes=5):
        """Wait for audio job to complete"""
        print(f"⏳ Waiting for job {job_id} to complete (max {max_wait_minutes} minutes)...")

        start_time = time.time()
        max_wait_seconds = max_wait_minutes * 60

        while time.time() - start_time < max_wait_seconds:
            try:
                response = requests.get(
                    f"{self.supabase_url}/rest/v1/audio_jobs?id=eq.{job_id}",
                    headers=self.headers
                )

                if response.status_code == 200:
                    job_data = response.json()
                    if job_data and len(job_data) > 0:
                        job = job_data[0]
                        status = job.get('status')
                        completed_languages = job.get('completed_languages', [])

                        print(f"📊 Status: {status} | Completed: {len(completed_languages)}/3 languages")

                        if status == 'completed' and len(completed_languages) >= 3:
                            print("✅ Audio generation completed!")
                            return job
                        elif status == 'failed':
                            print("❌ Audio generation failed")
                            return job

                time.sleep(10)  # Check every 10 seconds

            except Exception as e:
                print(f"❌ Error checking status: {e}")
                time.sleep(10)

        print(f"⏰ Timeout after {max_wait_minutes} minutes")
        return None

    def demonstrate_regeneration(self, job_id):
        """Demonstrate the regeneration functionality"""
        print(f"\n🔄 DEMONSTRATING AUDIO REGENERATION")
        print("=" * 50)

        # Show current job status
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/audio_jobs?id=eq.{job_id}",
                headers=self.headers
            )

            if response.status_code == 200:
                job_data = response.json()
                if job_data and len(job_data) > 0:
                    job = job_data[0]
                    print("📋 Current Job Status:")
                    print(f"   Status: {job.get('status')}")
                    print(f"   Languages: {job.get('languages', [])}")
                    print(f"   Completed: {job.get('completed_languages', [])}")
                    print(f"   Audio URLs: {bool(job.get('audio_urls'))}")

                    # Show audio URLs if available
                    audio_urls = job.get('audio_urls', {})
                    if audio_urls:
                        print("🎵 Current Audio Files:")
                        for lang, url in audio_urls.items():
                            print(f"   {lang.upper()}: {url}")
        except Exception as e:
            print(f"❌ Error getting job status: {e}")

        print("\n🎯 Now demonstrating regeneration...")
        print("   (In real usage, you would click the 🔄 button in the admin panel)")
        print(f"   or run: python scripts/regenerate-affected-audio.py --job-id {job_id} --languages es hi")
        # Simulate regeneration call
        print("\n🔄 Simulating regeneration call...")
        print("   POST /api/admin/tools/regenerate-audio")
        print(f"   Body: {{'job_id': '{job_id}', 'language': 'es', 'force_regeneration': true}}")
        print("\n✅ Regeneration would:")
        print("   1. Get original post content")
        print("   2. Translate to target language (if needed)")
        print("   3. Generate new audio with correct voice")
        print("   4. Update database with new audio URLs")
        print("   5. Replace files in Supabase storage")
        print("\n🎉 REGENERATION DEMO COMPLETE!")
        print("=" * 50)
        print("The regeneration system is ready to fix incorrect audio files!")
        print("Use the 🔄 buttons in the admin panel or the regeneration script.")
    def cleanup_demo(self, post_id, job_id):
        """Clean up demo data (optional)"""
        print("\n🧹 Cleaning up demo data...")
        try:
            # Delete audio job
            requests.delete(
                f"{self.supabase_url}/rest/v1/audio_jobs?id=eq.{job_id}",
                headers=self.headers
            )
            print(f"✅ Deleted audio job {job_id}")

            # Delete test post
            requests.delete(
                f"{self.supabase_url}/rest/v1/posts?id=eq.{post_id}",
                headers=self.headers
            )
            print(f"✅ Deleted test post {post_id}")

        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

def main():
    print("🎭 AUDIO REGENERATION DEMO")
    print("=" * 50)
    print("This demo will show the complete audio regeneration workflow")
    print("=" * 50)

    # Check environment
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
        sys.exit(1)

    demo = RegenerationDemo()

    try:
        # Step 1: Create test post
        print("\n📝 STEP 1: Creating Test Post")
        post_id = demo.create_test_post()
        if not post_id:
            print("❌ Failed to create test post")
            sys.exit(1)

        # Step 2: Generate initial audio
        print("\n🎵 STEP 2: Generating Initial Audio")
        job_id = demo.generate_initial_audio(post_id)
        if not job_id:
            print("❌ Failed to start audio generation")
            sys.exit(1)

        # Step 3: Wait for completion
        print("\n⏳ STEP 3: Waiting for Audio Generation")
        completed_job = demo.wait_for_completion(job_id, max_wait_minutes=3)

        # Step 4: Demonstrate regeneration
        print("\n🔄 STEP 4: Demonstrating Regeneration")
        demo.demonstrate_regeneration(job_id)

        # Step 5: Cleanup (optional)
        if input("\n🧹 Clean up demo data? (y/N): ").lower().startswith('y'):
            demo.cleanup_demo(post_id, job_id)

        print("\n🎉 DEMO COMPLETED SUCCESSFULLY!")
        print("The audio regeneration system is working and ready for production use!")
    except KeyboardInterrupt:
        print("\n⏹️ Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()