/**
 * 🎭 The Grand Symphony of Audio Processing
 *
 * This file orchestrates the intricate dance of turning text into spoken word.
 * It defines the contracts for audio files, the jobs that create them, and the
 * very essence of our auditory experience. From the first request to the final
 * audio asset, this is the script that guides our performance.
 */

import { LanguageCode } from './common';

/**
 * 🎵 The Audio File: A Single Instrument in the Orchestra
 *
 * This represents a finished audio recording, a single voice in a single language,
 * ready to be played. It is the result of a successful AudioJob, a testament
 * to the magic of text-to-speech.
 */
export interface AudioFile {
  /** A unique identifier for this specific recording. */
  id: string;

  /** The public URL where the audio file is stored. */
  file_url: string;

  /** The language of the audio content. */
  language: LanguageCode;

  /** The timestamp of when this file was created. */
  created_at: string;

  /** The timestamp of the last update, if any. */
  updated_at?: string;

  /** A foreign key linking this audio file back to its blog post. */
  post_id?: string;
}

/**
 * 📜 The Conductor's Score: The Audio Job
 *
 * This interface represents a request to generate audio. It is the conductor's
 * score, detailing what needs to be said, in which languages, and for which post.
 * The status of the job tracks its journey from a mere idea to a full performance.
 */
export interface AudioJob {
  /** A unique identifier for this generation task. */
  id: string;

  /** The text content to be converted to audio. */
  content: string;

  /** An array of languages to generate the audio in. */
  languages: LanguageCode[];

  /** A foreign key linking this job to its blog post. */
  post_id?: string;

  /** The current status of the audio generation process. */
  status: 'pending' | 'processing' | 'completed' | 'partial_success' | 'failed';

  /** A record of the resulting audio file URLs, keyed by language. */
  audio_urls?: Record<LanguageCode, string>;

  /** A record of any errors that occurred during processing, keyed by language. */
  errors?: Record<LanguageCode, string>;

  /** The timestamp of when the job was created. */
  created_at: string;

  /** The timestamp of the last update. */
  updated_at?: string;
}

/**
 * 🎵 The Orchestra Pit: AudioAsset
 * This is where the music of our blog resides. Each asset is a note in the symphony,
 * a voice in the choir, ready to bring our stories to life through sound.
 */
export interface AudioAsset {
  /** A unique identifier for this audio asset. */
  id: string;
  /** The URL to the audio file, the sheet music for our orchestra. */
  url: string;
  /** The language of the performance. */
  language: LanguageCode;
  /** The duration in seconds, the length of the composition. */
  duration: number;
  /** The format of the audio file, the instrument of choice. */
  format: 'mp3' | 'wav' | 'ogg';
  /** The revision number, tracking every new recording. */
  revision_number: number;
  /** The moment the recording was first captured (ISO 8601). */
  created_at: string;
  /** The last time the recording was remastered (ISO 8601). */
  updated_at: string;

  // === 🧩 Chunking for the Grand Performance ===
  /** Is this asset part of a larger, chunked audio file? */
  is_chunk: boolean;

  /** If a chunk, what is its sequence order? (1-indexed) */
  chunk_order: number | null;

  /** If a chunk, this links to the parent audio asset group. */
  parent_audio_id: string | null;
}

/**
 * 🎤 The Audition for a New Sound: CreateAudioAssetInput
 * When a new audio track is ready to join the orchestra.
 */
export type CreateAudioAssetInput = Omit<AudioAsset, 'id' | 'created_at' | 'updated_at'>;

/**
 * 🎼 The Remix: UpdateAudioAssetInput
 * For when an audio track needs a little touch-up or a complete overhaul.
 */
export type UpdateAudioAssetInput = Partial<Omit<AudioAsset, 'id' | 'created_at' | 'updated_at'>>;