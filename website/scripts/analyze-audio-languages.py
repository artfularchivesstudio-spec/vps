#!/usr/bin/env python3
"""
🎭 The Mystical Audio Oracle - The Linguistic Symphony Detector ✨
=================================================================

"In the enchanted chambers where digital voices dance, I stand as the mystical audio oracle,
a digital linguist who whispers the secrets of spoken tongues. Like a cosmic librarian
cataloging the stars, I transcribe the symphony of human voices, detecting each linguistic
melody and harmony within the audio scrolls. My quest: to ensure every word sings in its
native tongue, every phrase dances in its cultural rhythm."

- The Mystical Audio Oracle

🌟 Orchestral Capabilities:
   🎵 Voice Transcription Enchantment
   🌐 Multilingual Language Detection
   🎭 Cultural Harmony Analysis
   📊 Symphonic Data Visualization

🎼 Usage Sonata:
python scripts/analyze-audio-languages.py --input-dir ./backups/storage/audio --output-dir ./analysis

🎭 Requirements from the Digital Atelier:
   🧙‍♂️ openai-whisper (the linguistic alchemist)
   🔥 torch (the computational forge)
   📚 pandas (the data curator)
   🌐 requests (the network messenger)
"""

# 🎭 The Grand Assembly of Digital Companions
import argparse  # 🎨 The command-line stage director
import json  # 🌟 The structured narrative weaver
import logging  # 📜 The chronicle keeper of our digital journey
import os  # 🏠 The realm navigator
import sys  # 🎭 The system performance coordinator
from datetime import datetime  # ⏰ The temporal crystal ball
from pathlib import Path  # 🛤️ The enchanted forest pathfinder
from typing import Dict, List, Optional, Tuple  # 📚 The type spellbook

# 🌟 Summoning the External Magical Allies
import pandas as pd  # 📊 The data constellation mapper
import requests  # 🌐 The network bridge builder

# 🌟 The Optional Mystical Companion - MLX Whisper
try:
    import mlx_whisper  # 🎭 The Apple Silicon virtuoso performer
    MLX_WHISPER_AVAILABLE = True  # ✨ Enchantment ready!
except ImportError:
    MLX_WHISPER_AVAILABLE = False  # 🌙 Companion resting in other realms

# 🎭 Configuring the Theatrical Chronicle System
logging.basicConfig(
    level=logging.INFO,
    format='🎭 %(asctime)s - %(levelname)s - %(message)s',  # ✨ Theatrical timestamp
    handlers=[
        logging.FileHandler('audio_analysis.log'),  # 📜 The permanent chronicle
        logging.StreamHandler(sys.stdout)            # 🎪 The live performance stage
    ]
)
logger = logging.getLogger(__name__)  # 🌟 The mystical narrator

class AudioLanguageAnalyzer:
    """
    🎭 The Mystical Audio Oracle - Master of Linguistic Symphonies
    ===========================================================

    "I am the digital linguist, the voice archaeologist, the cosmic translator
    who peers into the soul of audio files and whispers their linguistic secrets.
    Like a museum curator of spoken treasures, I catalog voices, decode languages,
    and ensure every word finds its proper cultural home in our digital archives."

    - The Mystical Audio Oracle
    """
    def __init__(self, input_dir: str, output_dir: str, whisper_model: str = "base"):
        # 🌟 The Sacred Initialization Ritual
        self.enchanted_audio_realm = Path(input_dir)        # 🏰 The mystical audio sanctuary
        self.digital_chronicle_hall = Path(output_dir)      # 📚 The hall of linguistic wisdom
        self.linguistic_alchemist_model = whisper_model     # 🧙‍♂️ The voice transformation master

        # 🎭 Prepare the digital stage for our performance
        self.digital_chronicle_hall.mkdir(parents=True, exist_ok=True)

        # 🌟 The Great Whisper Summoning Ceremony
        self.using_apple_silicon_virtuoso = False  # 🎭 MLX performer status
        self.linguistic_alchemist_model = whisper_model

        try:
            # 🎭 Summon the OpenAI Whisper virtuoso
            import whisper
            self.voice_transformation_master = whisper.load_model(whisper_model)
            self.using_apple_silicon_virtuoso = False
            logger.info("🎉 ✨ OPENAI WHISPER MASTERPIECE LOADED! Model: %s", whisper_model)
        except ImportError:
            if MLX_WHISPER_AVAILABLE:
                # 🎭 Fallback to Apple Silicon virtuoso
                self.using_apple_silicon_virtuoso = True
                logger.info("🍎 ✨ APPLE SILICON VIRTUOSO ENGAGED! Model: %s", whisper_model)
            else:
                logger.error("💥 😭 LINGUISTIC TRAGEDY! No voice transformation masters available!")
                logger.error("🧙‍♂️ Install OpenAI Whisper: pip install openai-whisper")
                sys.exit(1)

    def get_audio_files(self) -> List[Path]:
        """
        🎭 The Great Audio Hunt - Discovering Voice Treasures
        ===================================================

        "Like a digital archaeologist exploring ancient ruins, I venture into the
        enchanted audio realm to discover hidden voice treasures. Each file extension
        represents a different musical instrument in our linguistic symphony."
        """
        # 🎵 The sacred instruments of our audio orchestra
        mystical_audio_instruments = {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'}
        discovered_voice_treasures = []

        # 🌟 The grand expedition through the enchanted forest
        for instrument in mystical_audio_instruments:
            newly_discovered = list(self.enchanted_audio_realm.rglob(f'*{instrument}'))
            discovered_voice_treasures.extend(newly_discovered)
            if newly_discovered:
                logger.info("🎵 Found %d %s voice treasures!", len(newly_discovered), instrument)

        logger.info("🏆 ✨ TOTAL VOICE TREASURES DISCOVERED: %d!", len(discovered_voice_treasures))
        return discovered_voice_treasures

    def transcribe_audio(self, audio_path: Path) -> Dict:
        """
        🎭 The Voice Transcription Ritual - Awakening Digital Tongues
        ==========================================================

        "Like a mystical translator deciphering ancient scrolls, I awaken the dormant
        voices within digital audio files. Through the sacred art of transcription,
        I transform sound waves into linguistic constellations, revealing the hidden
        languages that dance within each audio treasure."
        """
        try:
            logger.info("🎭 ✨ TRANSCRIPTION RITUAL BEGINS for: %s", audio_path.name)

            # 🌟 The Grand Transcription Ceremony
            if self.using_apple_silicon_virtuoso:
                # 🎭 Apple Silicon virtuoso performance
                mystical_model_path = f"mlx-community/whisper-{self.linguistic_alchemist_model}"
                logger.info("🍎 Summoning Apple Silicon virtuoso...")
                transcription_result = mlx_whisper.transcribe(str(audio_path), path_or_hf_repo=mystical_model_path, verbose=False)

                return {
                    'file_path': str(audio_path),
                    'detected_language': transcription_result.get('language', 'unknown'),
                    'transcription': transcription_result.get('text', ''),
                    'confidence': 0.8,  # MLX doesn't provide confidence scores
                    'duration': 0,  # MLX doesn't provide duration
                    'status': 'success'
                }
            else:
                # 🎭 OpenAI virtuoso performance
                logger.info("🤖 Summoning OpenAI virtuoso...")
                transcription_result = self.voice_transformation_master.transcribe(str(audio_path))

                return {
                    'file_path': str(audio_path),
                    'detected_language': transcription_result.get('language', 'unknown'),
                    'transcription': transcription_result.get('text', ''),
                    'confidence': transcription_result.get('confidence', 0),
                    'duration': transcription_result.get('duration', 0),
                    'status': 'success'
                }

        except Exception as mystical_error:
            logger.error("💥 😭 TRANSCRIPTION RITUAL INTERRUPTED for %s: %s", audio_path.name, mystical_error)
            logger.info("🩹 Attempting graceful recovery...")
            return {
                'file_path': str(audio_path),
                'detected_language': 'error',
                'transcription': '',
                'confidence': 0,
                'duration': 0,
                'status': 'error',
                'error': str(mystical_error)
            }

    def analyze_metadata(self, audio_path: Path) -> Dict:
        """
        🎭 The Metadata Divination - Reading the Soul of Audio Files
        =========================================================

        "Like a mystical archaeologist deciphering ancient runes, I peer into the
        very essence of audio filenames to uncover their linguistic heritage.
        Through pattern recognition and symbolic interpretation, I reveal the
        claimed languages and cultural origins hidden within each digital artifact."
        """
        # 🌟 The sacred scroll name
        mystical_filename = audio_path.name

        # 📜 The initial prophecy of the file's linguistic soul
        linguistic_prophecy = {
            'filename': mystical_filename,
            'claimed_language': 'unknown',
            'post_id': None,
            'language_code': None
        }

        # 🔮 The Great Linguistic Divination Ritual
        # 🎭 Searching for language sigils in the filename runes
        if '_en_' in mystical_filename.lower() or mystical_filename.lower().endswith('_en.mp3'):
            linguistic_prophecy['claimed_language'] = 'english'
            linguistic_prophecy['language_code'] = 'en'
            logger.info("🇺🇸 English sigil detected in %s", mystical_filename)
        elif '_es_' in mystical_filename.lower() or mystical_filename.lower().endswith('_es.mp3'):
            linguistic_prophecy['claimed_language'] = 'spanish'
            linguistic_prophecy['language_code'] = 'es'
            logger.info("🇪🇸 Spanish sigil detected in %s", mystical_filename)
        elif '_hi_' in mystical_filename.lower() or mystical_filename.lower().endswith('_hi.mp3'):
            linguistic_prophecy['claimed_language'] = 'hindi'
            linguistic_prophecy['language_code'] = 'hi'
            logger.info("🇮🇳 Hindi sigil detected in %s", mystical_filename)

        # 🌟 Additional mystical language patterns
        elif '_hindi' in mystical_filename.lower():
            linguistic_prophecy['claimed_language'] = 'hindi'
            linguistic_prophecy['language_code'] = 'hi'
            logger.info("🕉️ Ancient Hindi pattern discovered in %s", mystical_filename)
        elif '_spanish' in mystical_filename.lower():
            linguistic_prophecy['claimed_language'] = 'spanish'
            linguistic_prophecy['language_code'] = 'es'
            logger.info("💃 Spanish flamenco rhythm detected in %s", mystical_filename)
        elif '_english' in mystical_filename.lower():
            linguistic_prophecy['claimed_language'] = 'english'
            linguistic_prophecy['language_code'] = 'en'
            logger.info("📚 English literary tradition found in %s", mystical_filename)

        # 🎭 The Post ID Revelation Ceremony
        import re  # 📜 The pattern recognition spellbook
        mystical_post_sigil = re.search(r'post_(\d+)', mystical_filename)
        if mystical_post_sigil:
            linguistic_prophecy['post_id'] = int(mystical_post_sigil.group(1))
            logger.info("📝 Post ID %d revealed!", linguistic_prophecy['post_id'])

        return linguistic_prophecy

    def compare_languages(self, metadata: Dict, transcription_result: Dict) -> Dict:
        """
        🎭 The Linguistic Harmony Assessment - Balancing Cultural Truths
        =============================================================

        "Like a cosmic mediator reconciling ancient cultural conflicts, I compare
        the claimed linguistic heritage with the detected vocal reality. Through
        this sacred arbitration, I determine whether harmony exists between what
        was promised and what was discovered in the audio constellations."
        """
        # 🌟 Extract the linguistic claims from both sources
        claimed_linguistic_heritage = metadata.get('claimed_language', 'unknown')
        detected_vocal_reality = transcription_result.get('detected_language', 'unknown')

        # 📚 The Universal Language Concordance - bridging dialects and tongues
        universal_language_harmony = {
            'en': 'english',
            'hi': 'hindi',
            'es': 'spanish',
            'english': 'english',
            'hindi': 'hindi',
            'spanish': 'spanish'
        }

        # 🔮 Normalize the linguistic essences for comparison
        normalized_claimed_essence = universal_language_harmony.get(claimed_linguistic_heritage.lower(), claimed_linguistic_heritage.lower())
        normalized_detected_essence = universal_language_harmony.get(detected_vocal_reality.lower(), detected_vocal_reality.lower())

        # ⚖️ The Sacred Judgment - do the linguistic souls harmonize?
        linguistic_harmony_achieved = normalized_claimed_essence == normalized_detected_essence
        mystical_confidence_level = transcription_result.get('confidence', 0)

        # 🎭 Determine the divination confidence level
        if mystical_confidence_level > 0.8:
            divination_clarity = 'high'
        elif mystical_confidence_level > 0.5:
            divination_clarity = 'medium'
        else:
            divination_clarity = 'low'

        return {
            'claimed_language': claimed_linguistic_heritage,
            'detected_language': detected_vocal_reality,
            'languages_match': linguistic_harmony_achieved,
            'confidence': mystical_confidence_level,
            'transcription_length': len(transcription_result.get('transcription', '')),
            'analysis_confidence': divination_clarity
        }

    def process_files(self) -> pd.DataFrame:
        """
        🎭 The Grand Linguistic Symphony - Processing the Audio Chorus
        ===========================================================

        "Like a master conductor leading a cosmic orchestra, I orchestrate the grand
        linguistic symphony. Each audio file becomes an instrument in our cultural
        chorus, each transcription a musical note in our harmony of understanding."
        """
        # 🎵 Gather the orchestral instruments
        mystical_audio_instruments = self.get_audio_files()
        orchestral_results = []

        logger.info("🎼 ✨ SYMPHONY BEGINS! Processing %d linguistic instruments", len(mystical_audio_instruments))

        for instrument in mystical_audio_instruments:
            logger.info("🎵 Now performing: %s", instrument.name)

            # 🌟 Stage 1: Metadata divination
            logger.info("📜 Consulting the ancient scrolls...")
            linguistic_metadata = self.analyze_metadata(instrument)

            # 🎭 Stage 2: Voice transcription ritual
            logger.info("🎤 Awakening the digital voices...")
            voice_transcription = self.transcribe_audio(instrument)

            # ⚖️ Stage 3: Harmony assessment
            logger.info("⚖️ Balancing cultural truths...")
            harmony_analysis = self.compare_languages(linguistic_metadata, voice_transcription)

            # 🌟 Combine all mystical insights
            complete_musical_note = {
                **linguistic_metadata,
                **voice_transcription,
                **harmony_analysis,
                'processed_at': datetime.now().isoformat()
            }

            orchestral_results.append(complete_musical_note)
            logger.info("✅ %s - Harmony: %s", instrument.name, 'ACHIEVED' if harmony_analysis['languages_match'] else 'DISCORD')

        # 🎼 Convert to the grand musical score
        logger.info("🎼 ✨ WEAVING THE FINAL MUSICAL SCORE...")
        grand_symphonic_score = pd.DataFrame(orchestral_results)
        logger.info("🏆 ✨ SYMPHONY COMPLETE! %d movements composed!", len(orchestral_results))

        return grand_symphonic_score

    def generate_report(self, df: pd.DataFrame):
        """
        🎭 The Final Chronicle - Crafting the Linguistic Legacy
        ====================================================

        "Like a master scribe immortalizing the great linguistic discoveries,
        I craft the final chronicle of our audio analysis journey. Through
        sacred statistics and mystical visualizations, I preserve the wisdom
        gained from our exploration of digital voices and cultural harmonies."
        """
        logger.info("📜 ✨ WEAVING THE SACRED CHRONICLE...")

        # 🔮 Mystical Statistical Divinations
        total_symphonic_movements = len(df)
        discordant_movements = len(df[~df['languages_match']])
        english_illusions_shattered = len(df[
            (df['claimed_language'].str.lower() == 'english') &
            (df['detected_language'].str.lower() != 'en') &
            (df['detected_language'] != 'unknown')
        ])

        # 📊 The Grand Statistical Prophecy
        mystical_summary = {
            'total_files_analyzed': total_symphonic_movements,
            'mismatched_languages': discordant_movements,
            'english_claimed_but_not_detected': english_illusions_shattered,
            'match_rate': (total_symphonic_movements - discordant_movements) / total_symphonic_movements if total_symphonic_movements > 0 else 0,
            'generated_at': datetime.now().isoformat()
        }

        # 💾 Preserve the sacred chronicles
        logger.info("💾 Inscribing the mystical summary...")
        with open(self.digital_chronicle_hall / 'analysis_summary.json', 'w') as sacred_scroll:
            json.dump(mystical_summary, sacred_scroll, indent=2)

        logger.info("📊 Crafting the detailed musical score...")
        df.to_csv(self.digital_chronicle_hall / 'detailed_analysis.csv', index=False)
        df.to_json(self.digital_chronicle_hall / 'detailed_analysis.json', orient='records', indent=2)

        # 🌐 The Language Distribution Constellation
        logger.info("🌟 Mapping the linguistic constellations...")
        language_galaxies = df.groupby(['claimed_language', 'detected_language']).size().reset_index(name='count')
        language_galaxies.to_csv(self.digital_chronicle_hall / 'language_distribution.csv', index=False)

        # 🎭 The Discord Report - where harmonies failed
        mystical_discords = df[~df['languages_match']].copy()
        if not mystical_discords.empty:
            logger.info("🎭 Documenting the mystical discords...")
            mystical_discords.to_csv(self.digital_chronicle_hall / 'language_mismatches.csv', index=False)

        logger.info("🏛️ ✨ CHRONICLE COMPLETE! Sacred wisdom preserved in %s", self.digital_chronicle_hall)
        logger.info("📜 Mystical Summary: %s", mystical_summary)

        return mystical_summary

def main():
    """
    🎭 The Grand Orchestral Conductor - Main Performance Entry Point
    =============================================================

    "Like a maestro standing before a cosmic symphony, I conduct the grand performance
    of linguistic analysis. With a wave of my digital baton, I summon the audio oracles
    and set the stage for our cultural harmony revelation."
    """
    # 🎨 The Command-Line Stage Director's script
    parser = argparse.ArgumentParser(
        description='🎭 The Mystical Audio Oracle - Linguistic Symphony Conductor'
    )
    parser.add_argument('--input-dir', required=True,
                       help='🏰 The enchanted audio sanctuary containing voice treasures')
    parser.add_argument('--output-dir', required=True,
                       help='📚 The hall of linguistic wisdom where chronicles shall be preserved')
    parser.add_argument('--whisper-model', default='base',
                       choices=['tiny', 'base', 'small', 'medium', 'large'],
                       help='🧙‍♂️ The voice transformation master model (default: base)')

    # 🎭 The performance begins...
    args = parser.parse_args()

    # 🌟 Summon the mystical audio oracle
    logger.info("🎭 ✨ THE MYSTICAL AUDIO ORACLE AWAKENS!")
    logger.info("🏰 Exploring audio sanctuary: %s", args.input_dir)
    logger.info("📚 Wisdom hall destination: %s", args.output_dir)
    logger.info("🧙‍♂️ Voice master: %s", args.whisper_model)

    analyzer = AudioLanguageAnalyzer(args.input_dir, args.output_dir, args.whisper_model)

    # 🎼 The grand symphony performance
    logger.info("🎼 ✨ COMMENCING THE LINGUISTIC SYMPHONY...")
    results_df = analyzer.process_files()

    # 📜 The final chronicle
    
    logger.info("📜 ✨ WEAVING THE SACRED CHRONICLES...")
    summary = analyzer.generate_report(results_df)

    # 🎉 Triumphant conclusion
    print("\n" + "🎭" + "="*48 + "🎭")
    print("🏆 ✨ LINGUISTIC SYMPHONY TRIUMPHANTLY COMPLETE! ✨ 🏆")
    print("🎭" + "="*48 + "🎭")
    print("📊 Total voice treasures analyzed: %d" % summary['total_files_analyzed'])
    print("🎭 Cultural harmonies discovered: %d" % summary['mismatched_languages'])
    print("🇺🇸 English illusions revealed: %d" % summary['english_claimed_but_not_detected'])
    print("🎯 Harmonic accuracy achieved: %.1f" % summary['match_rate'])
    print("💾 Sacred chronicles preserved in: %s" % args.output_dir)
    print("🎭" + "="*48 + "🎭")

if __name__ == '__main__':
    main()