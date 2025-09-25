#!/usr/bin/env python3
"""
Download Audio Samples from Supabase Storage
===========================================

Downloads sample audio files from Supabase storage for language analysis testing.

Requirements:
- requests
- python-dotenv

Usage:
python scripts/download-audio-samples.py --count 5
"""

import os
import sys
import json
import requests
import argparse
from pathlib import Path
from typing import List, Dict
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class AudioDownloader:
    def __init__(self, output_dir: str = "./audio_samples"):
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.headers = {
            'Authorization': f'Bearer {self.supabase_key}'
        }
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def load_audio_jobs(self) -> List[Dict]:
        """Load audio jobs data from the exported JSON"""
        json_file = Path('./backups') / '20250908_194218_api' / 'audio_jobs.json'

        if not json_file.exists():
            print(f"Audio jobs file not found: {json_file}")
            return []

        with open(json_file, 'r') as f:
            data = json.load(f)

        return data

    def download_audio_file(self, url: str, output_path: Path) -> bool:
        """Download a single audio file"""
        try:
            print(f"Downloading: {url}")
            response = requests.get(url, headers=self.headers, stream=True)
            response.raise_for_status()

            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"Downloaded: {output_path} ({output_path.stat().st_size} bytes)")
            return True

        except Exception as e:
            print(f"Failed to download {url}: {e}")
            return False

    def get_sample_jobs(self, count: int = 5) -> List[Dict]:
        """Get sample jobs that have completed audio files"""
        all_jobs = self.load_audio_jobs()

        # Filter jobs that have completed audio files
        completed_jobs = []
        for job in all_jobs:
            audio_urls = job.get('audio_urls', {})
            completed_langs = job.get('completed_languages', [])

            if audio_urls and len(completed_langs) > 0:
                completed_jobs.append(job)

        # Take first 'count' jobs
        return completed_jobs[:count]

    def download_job_audio(self, job: Dict) -> List[Path]:
        """Download all audio files for a job"""
        job_id = job.get('id', 'unknown')
        audio_urls = job.get('audio_urls', {})
        downloaded_files = []

        print(f"\nDownloading audio for job: {job_id}")

        for lang, url in audio_urls.items():
            if url:
                # Download full audio file
                filename = f"{job_id}_{lang}_full.mp3"
                output_path = self.output_dir / filename

                if self.download_audio_file(url, output_path):
                    downloaded_files.append(output_path)

                    # Also try to download first chunk if available
                    lang_status = job.get('language_statuses', {}).get(lang, {})
                    chunk_urls = lang_status.get('chunk_audio_urls', [])

                    if chunk_urls and len(chunk_urls) > 0:
                        chunk_filename = f"{job_id}_{lang}_chunk_0.mp3"
                        chunk_path = self.output_dir / chunk_filename
                        self.download_audio_file(chunk_urls[0], chunk_path)

        return downloaded_files

    def create_metadata_file(self, jobs: List[Dict], downloaded_files: List[Path]):
        """Create metadata file for downloaded samples"""
        metadata = {
            'download_timestamp': time.time(),
            'total_jobs': len(jobs),
            'downloaded_files': [str(f) for f in downloaded_files],
            'jobs_info': []
        }

        for job in jobs:
            job_info = {
                'id': job.get('id'),
                'languages': job.get('languages', []),
                'completed_languages': job.get('completed_languages', []),
                'source_language': job.get('source_language'),
                'audio_files': {}
            }

            # Add info about downloaded files
            job_id = job.get('id')
            for lang in job.get('languages', []):
                filename = f"{job_id}_{lang}_full.mp3"
                filepath = self.output_dir / filename
                if filepath.exists():
                    job_info['audio_files'][lang] = {
                        'filename': filename,
                        'size': filepath.stat().st_size,
                        'claimed_language': lang
                    }

            metadata['jobs_info'].append(job_info)

        # Save metadata
        metadata_file = self.output_dir / 'samples_metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"Metadata saved: {metadata_file}")

    def download_samples(self, count: int = 5):
        """Download sample audio files"""
        print(f"Downloading {count} sample audio jobs...")

        # Get sample jobs
        sample_jobs = self.get_sample_jobs(count)

        if not sample_jobs:
            print("No completed audio jobs found!")
            return

        print(f"Found {len(sample_jobs)} completed jobs")

        # Download audio files
        all_downloaded = []
        for job in sample_jobs:
            downloaded = self.download_job_audio(job)
            all_downloaded.extend(downloaded)

        # Create metadata
        self.create_metadata_file(sample_jobs, all_downloaded)

        print("\n=== DOWNLOAD COMPLETE ===")
        print(f"Downloaded {len(all_downloaded)} audio files")
        print(f"Files saved to: {self.output_dir}")
        print(f"Total size: {sum(f.stat().st_size for f in all_downloaded if f.exists())} bytes")

def main():
    parser = argparse.ArgumentParser(description='Download audio samples from Supabase storage')
    parser.add_argument('--count', type=int, default=5, help='Number of audio jobs to download')
    parser.add_argument('--output-dir', default='./audio_samples', help='Output directory for audio files')

    args = parser.parse_args()

    # Check environment
    if not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env file")
        sys.exit(1)

    # Create downloader and download samples
    downloader = AudioDownloader(args.output_dir)
    downloader.download_samples(args.count)

if __name__ == '__main__':
    main()