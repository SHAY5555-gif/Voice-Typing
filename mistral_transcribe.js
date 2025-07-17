#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

// Check command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node mistral_transcribe.js <audio-file-path> [model-name]');
    console.error('Example: node mistral_transcribe.js ./recording.wav voxtral-small-latest');
    process.exit(1);
}

const audioFilePath = args[0];
const modelName = args[1] || 'voxtral-small-latest';

// Check if API key is set
const API_KEY = process.env.MISTRAL_API_KEY;
if (!API_KEY) {
    console.error('Error: MISTRAL_API_KEY environment variable is not set');
    console.error('Please set it with: set MISTRAL_API_KEY=sk-your-key-here');
    process.exit(1);
}

// Check if audio file exists
if (!fs.existsSync(audioFilePath)) {
    console.error(`Error: Audio file not found: ${audioFilePath}`);
    process.exit(1);
}

console.log(`🎤 Transcribing audio file: ${audioFilePath}`);
console.log(`📝 Using model: ${modelName}`);

// Read and encode audio file
let audioBase64;
try {
    const audioBuffer = fs.readFileSync(audioFilePath);
    audioBase64 = audioBuffer.toString('base64');
    console.log(`📦 Audio file encoded (${audioBuffer.length} bytes)`);
} catch (error) {
    console.error(`Error reading audio file: ${error.message}`);
    process.exit(1);
}

// Prepare the request payload
const payload = {
    model: modelName,
    stream: false,
    messages: [
        {
            role: "system",
            content: "Transcribe audio in Hebrew, include timestamps for each speaker turn, full punctuation."
        },
        {
            role: "user",
            content: `data:audio/wav;base64,${audioBase64}`
        }
    ]
};

// Prepare request options
const postData = JSON.stringify(payload);
const options = {
    hostname: 'api.mistral.ai',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🚀 Sending request to Mistral API...');

// Make the request
const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200) {
                console.log('✅ Transcription completed successfully!\n');
                console.log('📄 TRANSCRIPT:');
                console.log('=' .repeat(50));
                console.log(response.choices[0].message.content);
                console.log('=' .repeat(50));
                
                // Also save to file
                const transcriptFile = `transcript_${Date.now()}.txt`;
                fs.writeFileSync(transcriptFile, response.choices[0].message.content);
                console.log(`\n💾 Transcript saved to: ${transcriptFile}`);
            } else {
                console.error(`❌ API Error (${res.statusCode}):`, response.error || response);
            }
        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
            console.error('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
});

// Send the request
req.write(postData);
req.end();
