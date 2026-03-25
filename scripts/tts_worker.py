"""
TTS Worker — reads text from stdin, generates audio, writes to output file.
Called by the Node.js server as a subprocess with inherited credentials.

Usage:
    echo "Hello world" | python scripts/tts_worker.py --voice kore --output /path/to/output.mp3
"""

import asyncio
import argparse
import base64
import sys

from pplx.python.sdks.llm_api import (
    AudioGenParams, Client, Conversation, Identity,
    LLMAPIClient, MediaGenParams, SamplingParams,
)


def split_text_into_chunks(text: str, max_chars: int = 3800) -> list[str]:
    """Split text into chunks at sentence boundaries, each under max_chars."""
    sentences = []
    current = ""
    for char in text:
        current += char
        if char in '.!?' and len(current.strip()) > 0:
            sentences.append(current.strip())
            current = ""
    if current.strip():
        sentences.append(current.strip())

    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 > max_chars and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk += " " + sentence if current_chunk else sentence
    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks if chunks else [text[:max_chars]]


async def generate_tts_chunk(client, text: str, voice: str) -> bytes:
    convo = Conversation()
    convo.set_single_audio_prompt(text)

    result = await client.messages.create(
        model="gemini_2_5_pro_tts",
        convo=convo,
        identity=Identity(client=Client.ASI, use_case="webserver_audio_gen"),
        sampling_params=SamplingParams(max_tokens=1),
        media_gen_params=MediaGenParams(
            audio=AudioGenParams(voice=voice, output_format="mp3_44100_128"),
        ),
    )

    if not result.audios:
        raise RuntimeError("No audio generated for chunk")
    return base64.b64decode(result.audios[0].b64_data)


async def generate_tts(text: str, voice: str, output_path: str):
    client = LLMAPIClient()
    chunks = split_text_into_chunks(text)
    print(f"Text: {len(text)} chars, split into {len(chunks)} chunk(s)", file=sys.stderr)

    all_audio = b""
    for i, chunk in enumerate(chunks):
        print(f"  Generating chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...", file=sys.stderr)
        audio_bytes = await generate_tts_chunk(client, chunk, voice)
        all_audio += audio_bytes

    with open(output_path, "wb") as f:
        f.write(all_audio)

    print(f"OK: {len(all_audio)} bytes written to {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default="kore")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    text = sys.stdin.read().strip()
    if not text:
        print("ERROR: No text provided on stdin", file=sys.stderr)
        sys.exit(1)

    asyncio.run(generate_tts(text, args.voice, args.output))


if __name__ == "__main__":
    main()
