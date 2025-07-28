#!/usr/bin/env node
/**
 * Minimal Node script to transcribe audio with ElevenLabs Speech-to-Text ("Scribe") API.
 *
 * Usage:
 *   XI_API_KEY=xi-... node eleven_audio_transcribe.js <audio-file> [language_code]
 *
 * Example:
 *   XI_API_KEY=xi-... node eleven_audio_transcribe.js ./audio.wav he
 *
 * If no language_code is provided, ElevenLabs will auto-detect the language.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { URL } from 'node:url';

// ────────────────────────────────────────────────────────────
// CLI args
// ────────────────────────────────────────────────────────────
const [, , audioPath, langArg] = process.argv;
if (!audioPath) {
  console.error('Usage: node eleven_audio_transcribe.js <audio-file> [language_code]');
  console.error('Example: node eleven_audio_transcribe.js ./recording.wav he');
  process.exit(1);
}
const languageCode = langArg || null; // null ⇒ auto-detect

// ────────────────────────────────────────────────────────────
// Load .env if present (simple parser, no external deps)
// ────────────────────────────────────────────────────────────
const dotenvPath = path.resolve('.env');
if (!process.env.XI_API_KEY && fs.existsSync(dotenvPath)) {
  try {
    const envContent = fs.readFileSync(dotenvPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key]) {
          // Remove optional surrounding quotes
          const cleaned = value.replace(/^['"]|['"]$/g, '');
          process.env[key] = cleaned;
        }
      }
    });
  } catch {}
}

// ────────────────────────────────────────────────────────────
// Env + sanity checks
// ────────────────────────────────────────────────────────────
let apiKey = process.env.XI_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
// If still undefined, attempt heuristic: first env var containing ELEVEN and API
if (!apiKey) {
  for (const [k, v] of Object.entries(process.env)) {
    if (/eleven.*api.*key/i.test(k)) {
      apiKey = v;
      break;
    }
  }
}
if (!apiKey) {
  console.error('❌  Missing XI_API_KEY (ElevenLabs) environment variable.');
  process.exit(1);
}
if (!fs.existsSync(audioPath)) {
  console.error(`❌  Audio file not found: ${audioPath}`);
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// Build multipart/form-data request
// ────────────────────────────────────────────────────────────
// Copy file to temporary ASCII-safe location to avoid Unicode path issues
const tempPath = path.join(process.cwd(), 'temp_audio_file.mp4');
try {
  fs.copyFileSync(path.resolve(audioPath), tempPath);
  
  // Manually build multipart/form-data to avoid Unicode issues
  const boundary = `----formdata-${Date.now()}`;
  const fileBuffer = fs.readFileSync(tempPath);
  
  const parts = [];
  
  // Add model_id field
  parts.push(`--${boundary}`);
  parts.push('Content-Disposition: form-data; name="model_id"');
  parts.push('');
  parts.push('scribe_v1_experimental');
  
  // Add tag_audio_events field
  parts.push(`--${boundary}`);
  parts.push('Content-Disposition: form-data; name="tag_audio_events"');
  parts.push('');
  parts.push('false');
  
  // Add language_code field if provided
  if (languageCode && languageCode !== 'auto') {
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="language_code"');
    parts.push('');
    parts.push(languageCode);
  }
  
  // Add file field
  parts.push(`--${boundary}`);
  parts.push('Content-Disposition: form-data; name="file"; filename="audio_file.mp4"');
  parts.push('Content-Type: video/mp4');
  parts.push('');
  
  const textPart = parts.join('\r\n') + '\r\n';
  const endBoundary = `\r\n--${boundary}--\r\n`;
  
  // Combine text parts with binary file data
  const bodyParts = [
    Buffer.from(textPart, 'utf8'),
    fileBuffer,
    Buffer.from(endBoundary, 'utf8')
  ];
  const body = Buffer.concat(bodyParts);

  console.log('🚀 Requesting transcription…');
  console.log(`• Audio file: ${audioPath}`);
  if (languageCode) console.log(`• Language:   ${languageCode}`);
  else console.log('• Language:   auto-detect');

  const endpoint = new URL('https://api.elevenlabs.io/v1/speech-to-text');

  // Use https module instead of fetch to avoid Unicode issues
  const response = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: endpoint.hostname,
      port: endpoint.port,
      path: endpoint.pathname,
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
        'Content-Length': body.length
      }
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode} – ${response.data}`);
  }

  const data = JSON.parse(response.data);
  const transcript = data.text || data.transcript || JSON.stringify(data);

  console.log('\n===== TRANSCRIPT =====\n');
  console.log(transcript);
  console.log('\n======================\n');

  const out = `transcript_${Date.now()}.txt`;
  fs.writeFileSync(out, transcript, 'utf8');
  console.log(`💾 Saved to ${out}`);
} catch (err) {
  console.error('❌  Transcription failed:', err.message);
  process.exit(1);
} finally {
  // Clean up temporary file
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }
}
