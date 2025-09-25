# Localized Media Pipeline Architecture

**Planning Date**: September 5, 2025
**Status**: Draft – Ready for Iteration
**Priority**: High

## Goal
Design a pipeline that treats English as the source-of-truth and fan-outs
localized text, audio, video, and social media snippets in a consistent,
reviewable manner.

## Key Ideas
1. **Source-of-Truth Language**
   - Store original content in English only.
   - Maintain a Translation Memory (TM) table that maps `(post_id, locale)`
     to translated fields.
   - TM entries carry a `needs_review` flag when the English source changes.

2. **Translation Workflow**
   - Auto-translate via OpenAI/DeepL, then mark for human review.
   - Editors approve translations, clearing the `needs_review` flag.
   - Optional: diff viewer highlights changes against previous version.

3. **Localized Media Generation**
   - **Audio**: TTS per locale using voice models (e.g., ElevenLabs).
   - **Video**: Combine localized audio + imagery via FFmpeg templates.
   - **Subtitles**: Auto-generate from localized text, stored alongside media.

4. **Social Media Fan-out**
   - For each channel (X, LinkedIn, Instagram), generate up to three variants:
     - Long form (max platform limit)
     - Medium form (~50% of limit)
     - Short teaser (~25% of limit)
   - Store channel-specific metadata (hashtags, @mentions, CTA links).

5. **Versioning & Auditing**
   - Every update creates a revision entry.
   - TM and media assets reference revision numbers for traceability.

6. **Workflow Stages**
   - `draft` → `translated` → `audio_ready` → `video_ready` → `scheduled`.
   - CI checks ensure no locale lags behind the source by more than one
     revision before publish.

## Future Extensions
- Plug-in translation providers.
- User-specific voice cloning for audio.
- Per-channel A/B testing using variant performance metrics.

