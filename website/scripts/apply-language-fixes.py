sn #!/usr/bin/env python3
"""
Apply Language Metadata Fixes to Supabase Database
==================================================

This script applies the language metadata fixes identified by the analysis.
It updates the database records to correct incorrect language labels.

Requirements:
- requests
- pandas
- python-dotenv

Usage:
python scripts/apply-language-fixes.py --fix-plan ./fix-plan
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LanguageFixer:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }

        print("Language Fixer initialized")

    def load_fix_plan(self, fix_plan_dir: str) -> pd.DataFrame:
        """Load the priority fix matrix"""
        fix_matrix_path = Path(fix_plan_dir) / 'priority_fix_matrix.csv'
        if not fix_matrix_path.exists():
            raise FileNotFoundError(f"Fix matrix not found: {fix_matrix_path}")

        df = pd.read_csv(fix_matrix_path)
        print(f"Loaded {len(df)} fixes to apply")
        return df

    def extract_job_id_from_path(self, file_path: str) -> str:
        """Extract job ID from file path"""
        # Pattern: audio_samples/{job_id}_{lang}_{type}.mp3
        match = re.search(r'audio_samples/([a-f0-9-]+)_', file_path)
        if match:
            return match.group(1)
        return None

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

    def update_audio_job(self, job_id: str, updates: Dict) -> bool:
        """Update audio job record"""
        endpoint = f'audio_jobs?id=eq.{job_id}'
        result = self.make_request('PATCH', endpoint, updates)

        if result is not None:
            print(f"Successfully updated job {job_id}")
            return True
        else:
            print(f"Failed to update job {job_id}")
            return False

    def fix_language_metadata(self, fix_row: pd.Series) -> bool:
        """Apply language fix for a single file"""

        file_path = fix_row['file_path']
        claimed_lang = fix_row['claimed_language']
        detected_lang = fix_row['detected_language']

        print(f"\nProcessing: {file_path}")
        print(f"  Claimed: {claimed_lang} → Detected: {detected_lang}")

        # Extract job ID
        job_id = self.extract_job_id_from_path(file_path)
        if not job_id:
            print(f"  ERROR: Could not extract job ID from {file_path}")
            return False

        print(f"  Job ID: {job_id}")

        # Get current job data
        job_data = self.get_audio_job(job_id)
        if not job_data:
            print(f"  ERROR: Could not find job {job_id}")
            return False

        # Determine what needs to be updated
        updates = {}

        # Update languages array if needed
        current_languages = job_data.get('languages', [])
        if claimed_lang in current_languages and detected_lang not in current_languages:
            # Replace claimed language with detected language
            new_languages = [detected_lang if lang == claimed_lang else lang for lang in current_languages]
            updates['languages'] = new_languages
            print(f"  Updating languages: {current_languages} → {new_languages}")

        # Update completed_languages if needed
        current_completed = job_data.get('completed_languages', [])
        if claimed_lang in current_completed and detected_lang not in current_completed:
            new_completed = [detected_lang if lang == claimed_lang else lang for lang in current_completed]
            updates['completed_languages'] = new_completed
            print(f"  Updating completed_languages: {current_completed} → {new_completed}")

        # Update audio_urls if needed
        audio_urls = job_data.get('audio_urls', {})
        if claimed_lang in audio_urls:
            # Move URL from claimed language to detected language
            url = audio_urls[claimed_lang]
            updates['audio_urls'] = audio_urls.copy()
            del updates['audio_urls'][claimed_lang]
            updates['audio_urls'][detected_lang] = url
            print(f"  Moving audio URL from {claimed_lang} to {detected_lang}")

        # Update language_statuses if needed
        lang_statuses = job_data.get('language_statuses', {})
        if claimed_lang in lang_statuses:
            # Move status from claimed language to detected language
            status = lang_statuses[claimed_lang]
            updates['language_statuses'] = lang_statuses.copy()
            del updates['language_statuses'][claimed_lang]
            updates['language_statuses'][detected_lang] = status
            print(f"  Moving language status from {claimed_lang} to {detected_lang}")

        # Apply updates
        if updates:
            success = self.update_audio_job(job_id, updates)
            if success:
                print(f"  ✅ Successfully applied fixes for {file_path}")
                return True
            else:
                print(f"  ❌ Failed to apply fixes for {file_path}")
                return False
        else:
            print(f"  ℹ️ No updates needed for {file_path}")
            return True

    def apply_all_fixes(self, fix_plan_df: pd.DataFrame) -> Dict:
        """Apply all fixes from the plan"""

        results = {
            'total_fixes': len(fix_plan_df),
            'successful_fixes': 0,
            'failed_fixes': 0,
            'fixes_applied': []
        }

        print(f"\n=== APPLYING {len(fix_plan_df)} LANGUAGE FIXES ===\n")

        for idx, fix_row in fix_plan_df.iterrows():
            try:
                success = self.fix_language_metadata(fix_row)
                if success:
                    results['successful_fixes'] += 1
                    results['fixes_applied'].append({
                        'file_path': fix_row['file_path'],
                        'status': 'success'
                    })
                else:
                    results['failed_fixes'] += 1
                    results['fixes_applied'].append({
                        'file_path': fix_row['file_path'],
                        'status': 'failed'
                    })
            except Exception as e:
                print(f"ERROR processing {fix_row['file_path']}: {e}")
                results['failed_fixes'] += 1
                results['fixes_applied'].append({
                    'file_path': fix_row['file_path'],
                    'status': 'error',
                    'error': str(e)
                })

        return results

    def save_results(self, results: Dict, output_dir: str):
        """Save fix results"""

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Save JSON results
        results_file = output_path / 'fix_results.json'
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)

        # Save human-readable summary
        summary_file = output_path / 'FIX_RESULTS.md'
        with open(summary_file, 'w') as f:
            f.write("# Language Fix Results\n\n")
            f.write(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("## Summary\n\n")
            f.write(f"- **Total fixes attempted:** {results['total_fixes']}\n")
            f.write(f"- **Successful fixes:** {results['successful_fixes']}\n")
            f.write(f"- **Failed fixes:** {results['failed_fixes']}\n")
            f.write(f"- **Success rate:** {results['successful_fixes']/results['total_fixes']*100:.1f}%\n")
            f.write("\n## Details\n\n")

            for fix in results['fixes_applied']:
                status_emoji = "✅" if fix['status'] == 'success' else "❌" if fix['status'] == 'failed' else "⚠️"
                f.write(f"- {status_emoji} {fix['file_path']}\n")
                if 'error' in fix:
                    f.write(f"  - Error: {fix['error']}\n")

        print(f"\nResults saved to: {summary_file}")

def main():
    parser = argparse.ArgumentParser(description='Apply language metadata fixes to Supabase database')
    parser.add_argument('--fix-plan', default='./fix-plan', help='Directory containing fix plan')

    args = parser.parse_args()

    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
        sys.exit(1)

    # Create fixer
    fixer = LanguageFixer()

    # Load fix plan
    try:
        fix_plan_df = fixer.load_fix_plan(args.fix_plan)
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    # Apply fixes
    results = fixer.apply_all_fixes(fix_plan_df)

    # Save results
    fixer.save_results(results, args.fix_plan)

    print("\n=== FIX APPLICATION COMPLETE ===")
    print(f"Total fixes: {results['total_fixes']}")
    print(f"Successful: {results['successful_fixes']}")
    print(f"Failed: {results['failed_fixes']}")
    print(f"Success rate: {results['successful_fixes']/results['total_fixes']*100:.1f}%")

if __name__ == '__main__':
    main()