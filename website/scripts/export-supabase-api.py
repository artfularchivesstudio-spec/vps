#!/usr/bin/env python3
"""
Supabase API Data Export Script
==============================

Exports database data using Supabase REST API instead of pg_dump.
This avoids PostgreSQL version compatibility issues.

Requirements:
- requests
- pandas
- python-dotenv

Usage:
python scripts/export-supabase-api.py
"""

import os
import sys
import json
import requests
from pathlib import Path
from datetime import datetime
import pandas as pd
from typing import Dict, List, Optional
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class SupabaseAPIExporter:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }

        # Create export directory
        self.export_dir = Path('./backups') / datetime.now().strftime('%Y%m%d_%H%M%S_api')
        self.export_dir.mkdir(parents=True, exist_ok=True)

        print(f"Export directory: {self.export_dir}")

    def make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make API request to Supabase"""
        url = f"{self.supabase_url}/rest/v1/{endpoint}"

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed for {endpoint}: {e}")
            return None

    def export_table(self, table_name: str, batch_size: int = 1000) -> pd.DataFrame:
        """Export entire table with pagination"""
        print(f"Exporting table: {table_name}")

        all_records = []
        offset = 0

        while True:
            params = {
                'select': '*',
                'limit': batch_size,
                'offset': offset
            }

            data = self.make_request(table_name, params)

            if not data:
                break

            all_records.extend(data)

            if len(data) < batch_size:
                break

            offset += batch_size
            time.sleep(0.1)  # Rate limiting

        df = pd.DataFrame(all_records)
        print(f"Exported {len(df)} records from {table_name}")

        # Save to CSV and JSON
        if not df.empty:
            df.to_csv(self.export_dir / f"{table_name}.csv", index=False)
            df.to_json(self.export_dir / f"{table_name}.json", orient='records', indent=2)

        return df

    def export_audio_related_data(self):
        """Export tables related to posts and audio"""

        # Tables to export
        tables_to_export = [
            'posts',
            'audio_files',
            'audio_jobs',
            'translations',
            'languages',
            'categories',
            'tags'
        ]

        exported_data = {}

        for table in tables_to_export:
            try:
                df = self.export_table(table)
                exported_data[table] = df
            except Exception as e:
                print(f"Failed to export {table}: {e}")

        return exported_data

    def analyze_audio_data(self, exported_data: Dict[str, pd.DataFrame]):
        """Analyze the exported data for audio language issues"""

        print("\n=== AUDIO DATA ANALYSIS ===")

        # Check posts table
        if 'posts' in exported_data:
            posts_df = exported_data['posts']
            print(f"Total posts: {len(posts_df)}")

            # Check for audio-related columns
            audio_columns = [col for col in posts_df.columns if 'audio' in col.lower()]
            if audio_columns:
                print(f"Audio-related columns in posts: {audio_columns}")

                # Analyze audio file references
                for col in audio_columns:
                    audio_files = posts_df[col].dropna()
                    print(f"Column '{col}': {len(audio_files)} non-null values")

        # Check audio_files table
        if 'audio_files' in exported_data:
            audio_df = exported_data['audio_files']
            print(f"Total audio files: {len(audio_df)}")

            if not audio_df.empty:
                # Analyze language distribution
                if 'language' in audio_df.columns:
                    lang_dist = audio_df['language'].value_counts()
                    print(f"Language distribution in audio_files:")
                    print(lang_dist)

                # Check for file paths
                path_columns = [col for col in audio_df.columns if 'path' in col.lower() or 'url' in col.lower()]
                if path_columns:
                    print(f"Path/URL columns: {path_columns}")

        # Check translations table
        if 'translations' in exported_data:
            trans_df = exported_data['translations']
            print(f"Total translations: {len(trans_df)}")

            if not trans_df.empty and 'language' in trans_df.columns:
                trans_lang_dist = trans_df['language'].value_counts()
                print(f"Translation language distribution:")
                print(trans_lang_dist)

    def create_summary_report(self, exported_data: Dict[str, pd.DataFrame]):
        """Create a summary report of the export"""

        summary = {
            'export_timestamp': datetime.now().isoformat(),
            'supabase_url': self.supabase_url,
            'tables_exported': list(exported_data.keys()),
            'record_counts': {table: len(df) for table, df in exported_data.items()},
            'export_directory': str(self.export_dir)
        }

        # Add analysis insights
        insights = []

        if 'posts' in exported_data:
            posts_df = exported_data['posts']
            insights.append(f"Found {len(posts_df)} posts in database")

        if 'audio_files' in exported_data:
            audio_df = exported_data['audio_files']
            insights.append(f"Found {len(audio_df)} audio files in database")

            if not audio_df.empty and 'language' in audio_df.columns:
                lang_counts = audio_df['language'].value_counts()
                insights.append(f"Audio languages: {dict(lang_counts)}")

        summary['insights'] = insights

        # Save summary
        with open(self.export_dir / 'export_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)

        # Save human-readable summary
        with open(self.export_dir / 'EXPORT_SUMMARY.md', 'w') as f:
            f.write("# Supabase API Data Export Summary\n\n")
            f.write(f"**Export Date:** {summary['export_timestamp']}\n\n")
            f.write(f"**Export Directory:** {summary['export_directory']}\n\n")
            f.write("## Tables Exported\n\n")
            for table, count in summary['record_counts'].items():
                f.write(f"- **{table}:** {count} records\n")
            f.write("\n## Insights\n\n")
            for insight in insights:
                f.write(f"- {insight}\n")

        print(f"\nSummary saved to: {self.export_dir / 'EXPORT_SUMMARY.md'}")

        return summary

def main():
    print("=== SUPABASE API DATA EXPORT ===\n")

    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
        sys.exit(1)

    # Create exporter
    exporter = SupabaseAPIExporter()

    # Export data
    exported_data = exporter.export_audio_related_data()

    # Analyze data
    exporter.analyze_audio_data(exported_data)

    # Create summary
    summary = exporter.create_summary_report(exported_data)

    print("\n=== EXPORT COMPLETE ===")
    print(f"Data exported to: {exporter.export_dir}")
    print(f"Tables exported: {len(exported_data)}")
    print(f"Total records: {sum(len(df) for df in exported_data.values())}")

if __name__ == '__main__':
    main()