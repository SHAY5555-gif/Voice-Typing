#!/usr/bin/env node
/**
 * Batch transcription script for processing multiple audio files
 * with ElevenLabs Speech-to-Text API
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { URL } from 'node:url';

// Configuration
const sourceDir = 'תמלול קבצים/הקלטות קצרות חטיפי ביטחון';
const outputDir = 'תמלול קבצים/הקלטות קצרות חטיפי ביטחון/מתומלל';
const supportedExtensions = ['.opus', '.mp4', '.wav', '.m4a', '.mp3'];

// ────────────────────────────────────────────────────────────
// Load .env if present
// ────────────────────────────────────────────────────────────
const dotenvPath = path.resolve('.env');
if (fs.existsSync(dotenvPath)) {
  try {
    const envContent = fs.readFileSync(dotenvPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key]) {
          const cleaned = value.replace(/^['"]|['"]$/g, '');
          process.env[key] = cleaned;
        }
      }
    });
  } catch {}
}

// ────────────────────────────────────────────────────────────
// Get API key
// ────────────────────────────────────────────────────────────
let apiKey = process.env.XI_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
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

// ────────────────────────────────────────────────────────────
// Transcription function
// ────────────────────────────────────────────────────────────
async function transcribeFile(filePath) {
  const tempPath = path.join(process.cwd(), 'temp_audio_batch.mp4');
  
  try {
    // Copy file to temporary ASCII-safe location
    fs.copyFileSync(filePath, tempPath);
    
    // Build multipart form data
    const boundary = `----formdata-${Date.now()}`;
    const fileBuffer = fs.readFileSync(tempPath);
    
    const parts = [];
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="model_id"');
    parts.push('');
    parts.push('scribe_v1');
    
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="tag_audio_events"');
    parts.push('');
    parts.push('false');
    
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="file"; filename="audio_file.mp4"');
    parts.push('Content-Type: video/mp4');
    parts.push('');
    
    const textPart = parts.join('\r\n') + '\r\n';
    const endBoundary = `\r\n--${boundary}--\r\n`;
    
    const bodyParts = [
      Buffer.from(textPart, 'utf8'),
      fileBuffer,
      Buffer.from(endBoundary, 'utf8')
    ];
    const body = Buffer.concat(bodyParts);

    const endpoint = new URL('https://api.elevenlabs.io/v1/speech-to-text');

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
    return data.text || data.transcript || JSON.stringify(data);
    
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

// ────────────────────────────────────────────────────────────
// Main processing function
// ────────────────────────────────────────────────────────────
async function processAllFiles() {
  console.log('🚀 Starting batch transcription...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all files in source directory
  const files = fs.readdirSync(sourceDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return supportedExtensions.includes(ext);
  });
  
  console.log(`📁 Found ${files.length} audio files to process`);
  
  let processed = 0;
  let errors = 0;
  
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const fileNameWithoutExt = path.parse(file).name;
    const outputPath = path.join(outputDir, `${fileNameWithoutExt}.txt`);
    
    // Skip if output file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${file} (already transcribed)`);
      continue;
    }
    
    try {
      console.log(`🎵 Processing: ${file}`);
      const transcript = await transcribeFile(filePath);
      
      // Save transcript to output file
      fs.writeFileSync(outputPath, transcript, 'utf8');
      
      console.log(`✅ Completed: ${file} → ${fileNameWithoutExt}.txt`);
      processed++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n📊 Batch processing complete:`);
  console.log(`   ✅ Successfully processed: ${processed} files`);
  console.log(`   ❌ Errors: ${errors} files`);
  console.log(`   📁 Output directory: ${outputDir}`);
}

// Start processing
processAllFiles().catch(console.error);
