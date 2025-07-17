#!/usr/bin/env node
/**
 * Minimal Node script to transcribe Hebrew audio with Mistral Voxtral models
 * Usage:
 *   MISTRAL_API_KEY=sk-... node mistral_audio_transcribe.js ./audio.wav voxtral-small
 */

import fs from 'node:fs';
import path from 'node:path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// ────────────────────────────────────────────────────────────
// CLI args
// ────────────────────────────────────────────────────────────
const [, , audioPath, modelArg] = process.argv;
if (!audioPath) {
  console.error('Usage: node mistral_audio_transcribe.js <audio-file> [voxtral-small|voxtral-mini]');
  process.exit(1);
}
const model = modelArg || 'voxtral-small';

// ────────────────────────────────────────────────────────────
// Env + sanity checks
// ────────────────────────────────────────────────────────────
const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error('❌  Missing MISTRAL_API_KEY environment variable.');
  process.exit(1);
}
if (!fs.existsSync(audioPath)) {
  console.error(`❌  Audio file not found: ${audioPath}`);
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// Build multipart/form-data request
// ────────────────────────────────────────────────────────────
const form = new FormData();
form.append('file', fs.createReadStream(path.resolve(audioPath)));
form.append('model', model);
form.append('language', 'he');        // Hebrew
form.append('format', 'txt');         // txt / json / srt
form.append('timestamps', 'detailed');
form.append('diarization', 'true');

console.log('🚀 Requesting transcription…');
console.log(`• Model:      ${model}`);
console.log(`• Audio file: ${audioPath}`);

// ────────────────────────────────────────────────────────────
const endpoint = 'https://api.mistral.ai/v1/audio/transcriptions';

try {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status} – ${err}`);
  }

  const data = await res.json();
  const transcript = data.text;

  console.log('\n===== TRANSCRIPT =====\n');
  console.log(transcript);
  console.log('\n======================\n');

  const out = `transcript_${Date.now()}.txt`;
  fs.writeFileSync(out, transcript, 'utf8');
  console.log(`💾 Saved to ${out}`);
} catch (err) {
  console.error('❌  Transcription failed:', err.message);
  process.exit(1);
}
