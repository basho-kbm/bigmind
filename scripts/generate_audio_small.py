"""
BigMind Audio Generator — Small Batch
Generates 4 key meditation audio files to bootstrap the library.
"""

import asyncio
import json
import os
import sys
import base64
from pathlib import Path
from datetime import datetime, timedelta

AUDIO_DIR = Path(__file__).parent.parent / "public" / "audio"
MANIFEST_PATH = AUDIO_DIR / "manifest.json"

SCRIPT_SYSTEM_PROMPT = """You are a meditation script writer for BigMind, a sleep and meditation app.
Write meditation scripts that will be read aloud by a TTS voice.

Guidelines:
- Write in second person ("you")
- Use simple, calming language
- Include natural pauses marked with "..." (the TTS voice will pause)
- Include breathing cues
- For sleep meditations, gradually slow the pace toward the end
- End with a gentle transition toward sleep or stillness
- Write ONLY the words spoken aloud — no stage directions
- Keep scripts SHORT — about 400 words for 5-minute meditations

Informed by: Shunryu Suzuki, Dogen, Alan Watts, Thich Nhat Hanh."""

BATCH = [
    ("body-scan", 5, "kore", "Write a 5-minute body scan meditation for sleep. Guide attention from head to toes, releasing tension. About 400 words."),
    ("breath-awareness", 5, "aoede", "Write a 5-minute breath awareness meditation for sleep. Focus on natural breathing rhythm. About 400 words."),
    ("beginners-mind", 5, "kore", "Write a 5-minute beginner's mind meditation. Each breath as if the first. Draw from Shunryu Suzuki. About 400 words."),
    ("ocean-sounds", 5, "aoede", "Write a brief 30-second spoken introduction for an ocean sounds sleep meditation. Welcome the listener, describe waves, invite them to let the ocean carry them to sleep. About 60 words."),
]


async def generate_script(prompt: str) -> str:
    from anthropic import Anthropic
    client = Anthropic()
    message = client.messages.create(
        model="claude_haiku_4_5",
        max_tokens=2048,
        system=SCRIPT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text_block = next((b for b in message.content if b.type == "text"), None)
    return text_block.text if text_block else ""


async def text_to_speech(text: str, voice: str = "kore") -> bytes:
    from pplx.python.sdks.llm_api import (
        AudioGenParams, Client, Conversation, Identity,
        LLMAPIClient, MediaGenParams, SamplingParams,
    )
    client = LLMAPIClient()
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
        raise RuntimeError(f"No audio generated for voice={voice}")
    return base64.b64decode(result.audios[0].b64_data)


async def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    entries = []

    for i, (mtype, dur, voice, prompt) in enumerate(BATCH):
        filename = f"{mtype}_{dur}min_{voice}.mp3"
        filepath = AUDIO_DIR / filename
        print(f"[{i+1}/{len(BATCH)}] {mtype} ({dur}min, voice={voice})")

        try:
            print("  Generating script...")
            script = await generate_script(prompt)
            print(f"  Script: {len(script.split())} words")

            print("  Converting to speech...")
            audio_bytes = await text_to_speech(script, voice)
            filepath.write_bytes(audio_bytes)
            print(f"  ✓ Saved: {filename} ({len(audio_bytes) / 1024:.0f} KB)")

            entries.append({
                "meditationType": mtype,
                "duration": dur,
                "voiceId": voice,
                "script": script,
                "filename": filename,
                "fileSize": len(audio_bytes),
                "generatedAt": datetime.now().isoformat(),
                "expiresAt": (datetime.now() + timedelta(days=1)).isoformat(),
            })
        except Exception as e:
            print(f"  ✗ Error: {e}")

        await asyncio.sleep(0.5)

    manifest = {"entries": entries, "lastGenerated": datetime.now().isoformat()}
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"\n✓ Generated {len(entries)} audio files")
    print(f"  Manifest: {MANIFEST_PATH}")

if __name__ == "__main__":
    asyncio.run(main())
