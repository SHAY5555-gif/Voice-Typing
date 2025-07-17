# Mistral Voxtral Audio Transcription Script

This script allows you to test Mistral's Voxtral models for Hebrew audio transcription.

## Setup

1. **Get your Mistral API Key:**
   - Sign up at https://console.mistral.ai/
   - Create an API key from your dashboard
   - Copy the key (starts with `sk-`)

2. **Set the environment variable:**
   ```bash
   # Windows Command Prompt
   set MISTRAL_API_KEY=sk-your-key-here
   
   # Windows PowerShell
   $env:MISTRAL_API_KEY="sk-your-key-here"
   
   # Linux/Mac
   export MISTRAL_API_KEY="sk-your-key-here"
   ```

3. **Prepare your audio file:**
   - Supported formats: WAV, MP3, M4A, etc.
   - Place the audio file in the same directory or provide full path

## Usage

```bash
# Basic usage with default model (voxtral-small-latest)
node mistral_transcribe.js ./recording.wav

# Specify a different model
node mistral_transcribe.js ./recording.wav voxtral-mini-latest

# Use full path to audio file
node mistral_transcribe.js "C:\Users\yesha\Desktop\hebrew_audio.wav"
```

## Available Models

- `voxtral-small-latest` - Better quality, slower (default)
- `voxtral-mini-latest` - Faster, smaller model

## Output

The script will:
- Display the transcription in the console
- Save the transcript to a timestamped text file (e.g., `transcript_1642334567890.txt`)
- Include Hebrew text with timestamps and speaker diarization

## Example Output

```
🎤 Transcribing audio file: ./test.wav
📝 Using model: voxtral-small-latest
📦 Audio file encoded (245760 bytes)
🚀 Sending request to Mistral API...
✅ Transcription completed successfully!

📄 TRANSCRIPT:
==================================================
[00:00:02] דובר א': שלום, איך אתה?
[00:00:05] דובר ב': שלום, אני בסדר תודה. מה נשמע?
[00:00:08] דובר א': הכל טוב, עובד על הפרויקט החדש.
==================================================

💾 Transcript saved to: transcript_1642334567890.txt
```

## Troubleshooting

- **API Key Error:** Make sure `MISTRAL_API_KEY` is set correctly
- **File Not Found:** Check the audio file path is correct
- **Network Error:** Ensure internet connection is working
- **Large Files:** Very large audio files may take longer to process

## Next Steps

After testing this script successfully, you can integrate the Mistral API calls into your main Voice Typing extension.
