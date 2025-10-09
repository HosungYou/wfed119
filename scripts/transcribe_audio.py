#!/usr/bin/env python3
"""
Audio Transcription Script with Speaker Diarization
Transcribes m4a files and identifies different speakers
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"✅ Loaded environment from: {env_path}")

def transcribe_with_openai(audio_path, api_key=None):
    """
    Use OpenAI Whisper API for transcription (most reliable, requires API key)
    """
    try:
        from openai import OpenAI

        if not api_key:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")

        client = OpenAI(api_key=api_key)

        print(f"🎙️  Transcribing with OpenAI Whisper API: {audio_path}")

        with open(audio_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )

        return transcript

    except ImportError:
        print("⚠️  OpenAI package not installed. Install with: pip install openai")
        return None
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        return None


def transcribe_with_assemblyai(audio_path, api_key=None):
    """
    Use AssemblyAI for transcription with speaker diarization (good for speaker separation)
    """
    try:
        import assemblyai as aai

        if not api_key:
            api_key = os.getenv('ASSEMBLYAI_API_KEY')

        if not api_key:
            raise ValueError("ASSEMBLYAI_API_KEY not found")

        aai.settings.api_key = api_key

        print(f"🎙️  Transcribing with AssemblyAI (with speaker diarization): {audio_path}")

        config = aai.TranscriptionConfig(speaker_labels=True)
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_path, config=config)

        return transcript

    except ImportError:
        print("⚠️  AssemblyAI package not installed. Install with: pip install assemblyai")
        return None
    except Exception as e:
        print(f"❌ AssemblyAI Error: {e}")
        return None


def format_transcript_openai(transcript, output_path):
    """Format OpenAI transcript to markdown"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"# Audio Transcription\n\n")
        f.write(f"**Duration**: {transcript.duration:.2f} seconds\n\n")
        f.write(f"---\n\n")

        f.write(f"## Full Transcript\n\n")
        f.write(transcript.text)
        f.write("\n\n---\n\n")

        if hasattr(transcript, 'segments') and transcript.segments:
            f.write(f"## Timestamped Segments\n\n")
            for segment in transcript.segments:
                start = segment.get('start', 0)
                end = segment.get('end', 0)
                text = segment.get('text', '')

                f.write(f"**[{start:.2f}s - {end:.2f}s]**\n")
                f.write(f"{text}\n\n")

    print(f"✅ Transcript saved to: {output_path}")


def format_transcript_assemblyai(transcript, output_path):
    """Format AssemblyAI transcript with speaker labels to markdown"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"# Audio Transcription with Speaker Diarization\n\n")
        f.write(f"---\n\n")

        f.write(f"## Full Transcript\n\n")
        f.write(transcript.text)
        f.write("\n\n---\n\n")

        if hasattr(transcript, 'utterances') and transcript.utterances:
            f.write(f"## Speaker-Separated Transcript\n\n")

            for utterance in transcript.utterances:
                speaker = utterance.speaker
                text = utterance.text
                start = utterance.start / 1000  # Convert ms to seconds
                end = utterance.end / 1000

                f.write(f"### Speaker {speaker} [{start:.2f}s - {end:.2f}s]\n\n")
                f.write(f"{text}\n\n")

    print(f"✅ Transcript with speakers saved to: {output_path}")


def transcribe_with_local_whisper(audio_path):
    """
    Use local Whisper model (free, no API key needed)
    """
    try:
        import whisper
        import torch

        print(f"🎙️  Transcribing with local Whisper model: {audio_path}")

        # Use GPU if available, otherwise CPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"💻 Using device: {device}")

        # Load model (medium is good balance of speed/quality)
        print("📥 Loading Whisper model (this may take a moment)...")
        model = whisper.load_model("base", device=device)

        # Transcribe
        print("🔄 Transcribing audio...")
        result = model.transcribe(audio_path, verbose=True)

        return result

    except ImportError:
        print("⚠️  Whisper not installed. Install with: pip install openai-whisper")
        return None
    except Exception as e:
        print(f"❌ Local Whisper Error: {e}")
        return None


def format_transcript_local_whisper(result, output_path):
    """Format local Whisper transcript to markdown"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"# Audio Transcription (Local Whisper)\n\n")
        f.write(f"**Language**: {result.get('language', 'unknown')}\n\n")
        f.write(f"---\n\n")

        f.write(f"## Full Transcript\n\n")
        f.write(result['text'])
        f.write("\n\n---\n\n")

        if 'segments' in result and result['segments']:
            f.write(f"## Timestamped Segments\n\n")
            for segment in result['segments']:
                start = segment.get('start', 0)
                end = segment.get('end', 0)
                text = segment.get('text', '')

                f.write(f"**[{start:.2f}s - {end:.2f}s]**\n")
                f.write(f"{text}\n\n")

    print(f"✅ Transcript saved to: {output_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python transcribe_audio.py <audio_file_path> [output_path]")
        sys.exit(1)

    audio_path = sys.argv[1]

    if not os.path.exists(audio_path):
        print(f"❌ File not found: {audio_path}")
        sys.exit(1)

    # Default output path
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        base_name = Path(audio_path).stem
        output_dir = Path(audio_path).parent
        output_path = output_dir / f"{base_name}_transcript.md"

    print(f"\n🎵 Processing audio file: {audio_path}")
    print(f"📝 Output will be saved to: {output_path}\n")

    # Try local Whisper first (free, no API key needed)
    print("Trying local Whisper model...")
    result = transcribe_with_local_whisper(audio_path)

    if result:
        format_transcript_local_whisper(result, output_path)
        return

    # Try AssemblyAI (better speaker diarization)
    print("\n⚠️  Trying AssemblyAI...\n")
    transcript = transcribe_with_assemblyai(audio_path)

    if transcript and hasattr(transcript, 'status'):
        import assemblyai as aai
        if transcript.status == aai.TranscriptStatus.error:
            print(f"AssemblyAI error: {transcript.error}")
            transcript = None

    if transcript:
        format_transcript_assemblyai(transcript, output_path)
        return

    # Fallback to OpenAI
    print("\n⚠️  Falling back to OpenAI Whisper API...\n")
    transcript = transcribe_with_openai(audio_path)

    if transcript:
        format_transcript_openai(transcript, output_path)
        return

    print("\n❌ All transcription methods failed.")
    print("\nTo use this script, you need one of:")
    print("1. Local Whisper (FREE, recommended): pip install openai-whisper")
    print("2. AssemblyAI API key: export ASSEMBLYAI_API_KEY='your-key'")
    print("   - Best for speaker diarization")
    print("   - Install: pip install assemblyai")
    print("\n3. OpenAI API key: export OPENAI_API_KEY='your-key'")
    print("   - Good transcription, no speaker separation")
    print("   - Install: pip install openai")


if __name__ == "__main__":
    main()
