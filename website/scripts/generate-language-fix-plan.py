#!/usr/bin/env python3
"""
Language Fix Plan Generator
==========================

This script analyzes the audio language analysis results and generates
a comprehensive plan for fixing incorrect translations.

Usage:
python scripts/generate-language-fix-plan.py --analysis-dir ./analysis --output-dir ./fix-plan
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LanguageFixPlanner:
    def __init__(self, analysis_dir: str, output_dir: str):
        self.analysis_dir = Path(analysis_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def load_analysis_data(self) -> pd.DataFrame:
        """Load analysis results from CSV"""
        analysis_file = self.analysis_dir / 'detailed_analysis.csv'
        if not analysis_file.exists():
            raise FileNotFoundError(f"Analysis file not found: {analysis_file}")

        df = pd.read_csv(analysis_file)
        logger.info(f"Loaded {len(df)} records from analysis")
        return df

    def categorize_issues(self, df: pd.DataFrame) -> Dict:
        """Categorize different types of language issues"""

        # Files with mismatched languages
        mismatches = df[~df['languages_match'] & (df['status'] == 'success')]

        # English files that are actually other languages
        english_misclassified = mismatches[
            (mismatches['claimed_language'].str.lower() == 'english') &
            (mismatches['detected_language'].str.lower() != 'en') &
            (mismatches['detected_language'] != 'unknown')
        ]

        # Non-English files that are actually English
        non_english_as_english = mismatches[
            (mismatches['claimed_language'].str.lower() != 'english') &
            (mismatches['detected_language'].str.lower() == 'en')
        ]

        # Other mismatches
        other_mismatches = mismatches[
            ~mismatches.index.isin(english_misclassified.index) &
            ~mismatches.index.isin(non_english_as_english.index)
        ]

        return {
            'total_mismatches': len(mismatches),
            'english_misclassified': len(english_misclassified),
            'non_english_as_english': len(non_english_as_english),
            'other_mismatches': len(other_mismatches),
            'english_misclassified_files': english_misclassified,
            'non_english_as_english_files': non_english_as_english,
            'other_mismatch_files': other_mismatches
        }

    def generate_priority_matrix(self, issues: Dict) -> pd.DataFrame:
        """Generate priority matrix for fixing issues"""

        priority_data = []

        # High priority: English files that are actually other languages
        for _, row in issues['english_misclassified_files'].iterrows():
            priority_data.append({
                'file_path': row['file_path'],
                'issue_type': 'English misclassified',
                'claimed_language': row['claimed_language'],
                'detected_language': row['detected_language'],
                'confidence': row['confidence'],
                'priority': 'HIGH',
                'action': 'Regenerate audio in correct language',
                'estimated_cost': 'High (full regeneration)',
                'business_impact': 'High (wrong language for English content)'
            })

        # Medium priority: Non-English files that are actually English
        for _, row in issues['non_english_as_english_files'].iterrows():
            priority_data.append({
                'file_path': row['file_path'],
                'issue_type': 'Non-English as English',
                'claimed_language': row['claimed_language'],
                'detected_language': row['detected_language'],
                'confidence': row['confidence'],
                'priority': 'MEDIUM',
                'action': 'Update metadata only (content is English)',
                'estimated_cost': 'Low (metadata update)',
                'business_impact': 'Medium (metadata inconsistency)'
            })

        # Low priority: Other mismatches
        for _, row in issues['other_mismatch_files'].iterrows():
            priority_data.append({
                'file_path': row['file_path'],
                'issue_type': 'Other mismatch',
                'claimed_language': row['claimed_language'],
                'detected_language': row['detected_language'],
                'confidence': row['confidence'],
                'priority': 'LOW',
                'action': 'Review and decide',
                'estimated_cost': 'Medium',
                'business_impact': 'Low'
            })

        return pd.DataFrame(priority_data)

    def create_visualizations(self, df: pd.DataFrame, issues: Dict):
        """Create charts and visualizations"""

        # Set style
        plt.style.use('default')
        sns.set_palette("husl")

        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Audio Language Analysis Report', fontsize=16, fontweight='bold')

        # 1. Language distribution
        language_counts = df.groupby(['claimed_language', 'detected_language']).size().unstack(fill_value=0)
        language_counts.plot(kind='bar', ax=axes[0,0])
        axes[0,0].set_title('Language Distribution')
        axes[0,0].set_xlabel('Claimed Language')
        axes[0,0].set_ylabel('Count')
        axes[0,0].tick_params(axis='x', rotation=45)

        # 2. Match vs Mismatch
        match_status = df['languages_match'].value_counts()
        match_status.plot(kind='pie', ax=axes[0,1], autopct='%1.1f%%')
        axes[0,1].set_title('Language Match Status')

        # 3. Confidence distribution
        df['confidence'].hist(ax=axes[1,0], bins=20)
        axes[1,0].set_title('Transcription Confidence Distribution')
        axes[1,0].set_xlabel('Confidence Score')
        axes[1,0].set_ylabel('Frequency')

        # 4. Issue types
        issue_types = [
            issues['english_misclassified'],
            issues['non_english_as_english'],
            issues['other_mismatches']
        ]
        issue_labels = ['English Misclassified', 'Non-English as English', 'Other Mismatches']
        axes[1,1].bar(issue_labels, issue_types)
        axes[1,1].set_title('Issue Types Distribution')
        axes[1,1].set_ylabel('Count')
        axes[1,1].tick_params(axis='x', rotation=45)

        plt.tight_layout()
        plt.savefig(self.output_dir / 'language_analysis_charts.png', dpi=300, bbox_inches='tight')
        plt.close()

        logger.info("Visualizations saved to language_analysis_charts.png")

    def generate_fix_plan(self, priority_matrix: pd.DataFrame, issues: Dict) -> Dict:
        """Generate comprehensive fix plan"""

        # Calculate totals
        total_issues = issues['total_mismatches']
        high_priority = len(priority_matrix[priority_matrix['priority'] == 'HIGH'])
        medium_priority = len(priority_matrix[priority_matrix['priority'] == 'MEDIUM'])
        low_priority = len(priority_matrix[priority_matrix['priority'] == 'LOW'])

        # Estimate costs and time
        high_cost_estimate = high_priority * 2  # 2 hours per high priority item
        medium_cost_estimate = medium_priority * 0.5  # 30 minutes per medium priority item
        low_cost_estimate = low_priority * 1  # 1 hour per low priority item

        total_time_estimate = high_cost_estimate + medium_cost_estimate + low_cost_estimate

        plan = {
            'summary': {
                'total_files_analyzed': len(pd.read_csv(self.analysis_dir / 'detailed_analysis.csv')),
                'total_issues_found': total_issues,
                'high_priority_issues': high_priority,
                'medium_priority_issues': medium_priority,
                'low_priority_issues': low_priority,
                'estimated_fix_time_hours': total_time_estimate,
                'generated_at': datetime.now().isoformat()
            },
            'phases': [
                {
                    'phase': 'Phase 1: High Priority Fixes',
                    'description': 'Fix English files that are actually other languages',
                    'items': high_priority,
                    'estimated_time': f"{high_cost_estimate} hours",
                    'actions': [
                        'Identify all English audio files that are actually Hindi/Spanish',
                        'Regenerate audio using correct TTS service',
                        'Update database metadata',
                        'Verify transcription matches claimed language'
                    ]
                },
                {
                    'phase': 'Phase 2: Medium Priority Fixes',
                    'description': 'Fix metadata for files that are actually English',
                    'items': medium_priority,
                    'estimated_time': f"{medium_cost_estimate} hours",
                    'actions': [
                        'Update language metadata in database',
                        'Verify file paths and naming conventions',
                        'Update any related UI components'
                    ]
                },
                {
                    'phase': 'Phase 3: Low Priority Fixes',
                    'description': 'Review and fix remaining mismatches',
                    'items': low_priority,
                    'estimated_time': f"{low_cost_estimate} hours",
                    'actions': [
                        'Manual review of each case',
                        'Determine if regeneration or metadata update is needed',
                        'Document edge cases for future prevention'
                    ]
                }
            ],
            'recommendations': [
                'Implement language detection in TTS generation pipeline',
                'Add validation checks before saving audio files',
                'Create automated tests for language accuracy',
                'Set up monitoring for language mismatch detection',
                'Consider using multiple TTS providers for verification'
            ],
            'risks': [
                'High volume of audio regeneration may impact performance',
                'TTS service costs may increase during fix period',
                'Potential temporary inconsistency during updates',
                'Need to coordinate with content team for verification'
            ]
        }

        return plan

    def save_plan(self, priority_matrix: pd.DataFrame, plan: Dict):
        """Save the complete fix plan"""

        # Save priority matrix
        priority_matrix.to_csv(self.output_dir / 'priority_fix_matrix.csv', index=False)
        priority_matrix.to_json(self.output_dir / 'priority_fix_matrix.json', orient='records', indent=2)

        # Save fix plan
        with open(self.output_dir / 'language_fix_plan.json', 'w') as f:
            json.dump(plan, f, indent=2)

        # Save human-readable plan
        with open(self.output_dir / 'LANGUAGE_FIX_PLAN.md', 'w') as f:
            f.write("# Audio Language Fix Plan\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            f.write("## Summary\n\n")
            summary = plan['summary']
            f.write(f"- **Total files analyzed:** {summary['total_files_analyzed']}\n")
            f.write(f"- **Issues found:** {summary['total_issues_found']}\n")
            f.write(f"- **High priority:** {summary['high_priority_issues']}\n")
            f.write(f"- **Medium priority:** {summary['medium_priority_issues']}\n")
            f.write(f"- **Low priority:** {summary['low_priority_issues']}\n")
            f.write(f"- **Estimated time:** {summary['estimated_fix_time_hours']} hours\n\n")

            f.write("## Fix Phases\n\n")
            for phase in plan['phases']:
                f.write(f"### {phase['phase']}\n\n")
                f.write(f"**Description:** {phase['description']}\n\n")
                f.write(f"**Items to fix:** {phase['items']}\n\n")
                f.write(f"**Estimated time:** {phase['estimated_time']}\n\n")
                f.write("**Actions:**\n")
                for action in phase['actions']:
                    f.write(f"- {action}\n")
                f.write("\n")

            f.write("## Recommendations\n\n")
            for rec in plan['recommendations']:
                f.write(f"- {rec}\n")
            f.write("\n")

            f.write("## Risks\n\n")
            for risk in plan['risks']:
                f.write(f"- {risk}\n")
            f.write("\n")

        logger.info(f"Fix plan saved to {self.output_dir}")

def main():
    parser = argparse.ArgumentParser(description='Generate language fix plan from analysis results')
    parser.add_argument('--analysis-dir', required=True, help='Directory containing analysis results')
    parser.add_argument('--output-dir', required=True, help='Directory to save fix plan')

    args = parser.parse_args()

    # Create planner
    planner = LanguageFixPlanner(args.analysis_dir, args.output_dir)

    # Load data
    df = planner.load_analysis_data()

    # Categorize issues
    issues = planner.categorize_issues(df)

    # Generate priority matrix
    priority_matrix = planner.generate_priority_matrix(issues)

    # Create visualizations
    planner.create_visualizations(df, issues)

    # Generate fix plan
    plan = planner.generate_fix_plan(priority_matrix, issues)

    # Save everything
    planner.save_plan(priority_matrix, plan)

    print("\n" + "="*60)
    print("LANGUAGE FIX PLAN GENERATED")
    print("="*60)
    print(f"Total issues found: {issues['total_mismatches']}")
    print(f"High priority: {issues['english_misclassified']}")
    print(f"Medium priority: {issues['non_english_as_english']}")
    print(f"Low priority: {issues['other_mismatches']}")
    print(f"Estimated time: {plan['summary']['estimated_fix_time_hours']} hours")
    print(f"Results saved to: {args.output_dir}")
    print("="*60)

if __name__ == '__main__':
    main()