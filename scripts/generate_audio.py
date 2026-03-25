"""
BigMind Audio Generator

Generates meditation scripts via LLM, then converts to speech via TTS.
Saves audio files to /home/user/workspace/bigmind/public/audio/
Updates a JSON manifest that the Express server reads.

Usage:
    python scripts/generate_audio.py              # Generate full library
    python scripts/generate_audio.py --refresh    # Daily refresh (replace stale entries)
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime, timedelta

# Audio output directory
AUDIO_DIR = Path(__file__).parent.parent / "public" / "audio"
MANIFEST_PATH = AUDIO_DIR / "manifest.json"

# Meditation types grouped by approach
SOUND_TYPES = ["ocean-sounds", "forest-sounds", "orchestra-warmup", "jungle-sounds"]
GUIDED_TYPES = ["body-scan", "open-awareness", "breath-awareness"]
ZEN_TYPES = ["exploring-self", "impermanence", "emptiness", "beginners-mind", "zen-stories"]

# Voice map — match voice qualities to meditation types
VOICE_MAP = {
    "kore": "female, calm and serene",
    "charon": "male, deep and grounding",
    "aoede": "female, warm and soothing",
    "fenrir": "male, steady and grounded",
    "puck": "neutral, gentle",
    "zephyr": "neutral, soft and airy",
}

# Duration options for pre-generation (start with shorter ones for speed)
PRE_GEN_DURATIONS = [5, 10, 20]

# --- Script Templates ---

SCRIPT_SYSTEM_PROMPT = """You are a meditation script writer for BigMind, a sleep and meditation app.
Write meditation scripts that will be read aloud by a TTS voice.

Guidelines:
- Write in second person ("you")
- Use simple, calming language
- Include natural pauses marked with "..." (the TTS voice will pause at these)
- Include breathing cues ("breathe in... breathe out...")
- For sleep meditations, gradually slow the pace toward the end
- End with a gentle transition toward sleep or stillness
- Do NOT include any stage directions, sound effects, or non-spoken text
- Write ONLY the words that should be spoken aloud
- Match the duration: short scripts for 5min, medium for 10min, long for 20min

Informed by: Shunryu Suzuki, Dogen, Alan Watts, Thich Nhat Hanh."""


def get_script_prompt(meditation_type: str, duration: int) -> str:
    """Return the prompt for generating a meditation script."""
    type_prompts = {
        "body-scan": f"Write a {duration}-minute body scan meditation for sleep. Systematically guide attention from the crown of the head down to the toes, releasing tension in each area. Pace should slow as you move downward.",
        "open-awareness": f"Write a {duration}-minute open awareness meditation. Guide the listener to rest in spacious awareness — noticing sounds, sensations, and thoughts without grasping. Inspired by shikantaza (just sitting).",
        "breath-awareness": f"Write a {duration}-minute breath awareness meditation for sleep. Focus on the natural rhythm of breathing, counting breaths gently. Let the breath become an anchor as the mind settles.",
        "exploring-self": f"Write a {duration}-minute guided contemplation on the nature of self. Gently inquire: 'Who is the one who meditates?' Draw from Alan Watts on the illusion of the separate self. Keep it accessible, not academic.",
        "impermanence": f"Write a {duration}-minute reflection on impermanence (mujo). Guide the listener to contemplate the changing nature of thoughts, sensations, and moments. Draw from Dogen's being-time.",
        "emptiness": f"Write a {duration}-minute meditation on emptiness (sunyata). Not nothingness, but the interconnected, open nature of all things. Draw from Thich Nhat Hanh's interbeing.",
        "beginners-mind": f"Write a {duration}-minute beginner's mind meditation. Each breath as if it were the first. Each moment fresh. Draw from Shunryu Suzuki's teaching that 'in the beginner's mind there are many possibilities.'",
        "zen-stories": f"Write a {duration}-minute meditation that weaves in a brief Zen story (koan or teaching tale). Tell the story slowly, then guide the listener to sit with it — not to solve it, but to let it rest in the body. End with silence.",
    }
    prompt = type_prompts.get(meditation_type, f"Write a {duration}-minute guided meditation for restful sleep.")

    # Word count guidance
    words_per_min = 100  # slow meditation pace with pauses
    target_words = duration * words_per_min
    prompt += f"\n\nTarget approximately {target_words} words (about {duration} minutes at a slow meditation pace with pauses)."

    return prompt


def get_ambient_prompt(sound_type: str, duration: int) -> str:
    """For ambient sounds, generate a short intro + ambient description."""
    intros = {
        "ocean-sounds": f"Write a brief {30}-second spoken introduction for an ocean sounds sleep meditation lasting {duration} minutes. Welcome the listener, describe the sound of waves, and invite them to let the ocean carry them to sleep. Then write 'The ocean holds you now... rest...' as the closing phrase before ambient sounds take over.",
        "forest-sounds": f"Write a brief {30}-second spoken introduction for a forest sounds sleep meditation lasting {duration} minutes. Welcome the listener, describe the gentle forest — rustling leaves, distant birdsong, a soft breeze. Invite them to rest among the trees.",
        "orchestra-warmup": f"Write a brief {30}-second spoken introduction for an orchestra warm-up meditation lasting {duration} minutes. Describe the gentle chaos of an orchestra tuning — each instrument finding its note, the hum of strings, the whisper of woodwinds. Invite the listener to rest in the harmony.",
        "jungle-sounds": f"Write a brief {30}-second spoken introduction for a jungle sounds meditation lasting {duration} minutes. Describe the lush canopy, gentle rain on broad leaves, distant calls of tropical birds. Invite the listener to drift into the warm, enveloping sounds.",
    }
    return intros.get(sound_type, f"Write a brief 30-second introduction for a {sound_type} ambient meditation.")


async def generate_script(meditation_type: str, duration: int) -> str:
    """Generate a meditation script using the Anthropic SDK."""
    from anthropic import Anthropic

    client = Anthropic()

    is_ambient = meditation_type in SOUND_TYPES
    prompt = get_ambient_prompt(meditation_type, duration) if is_ambient else get_script_prompt(meditation_type, duration)

    message = client.messages.create(
        model="claude_haiku_4_5",
        max_tokens=4096,
        system=SCRIPT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    text_block = next((b for b in message.content if b.type == "text"), None)
    return text_block.text if text_block else ""


async def text_to_speech(text: str, voice: str = "kore") -> bytes:
    """Convert text to speech using the Gemini TTS API."""
    from pplx.python.sdks.llm_api import (
        AudioGenParams, Client, Conversation, Identity,
        LLMAPIClient, MediaGenParams, SamplingParams,
    )
    import base64

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


def load_manifest() -> dict:
    """Load existing manifest or create empty one."""
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text())
    return {"entries": [], "lastGenerated": None}


def save_manifest(manifest: dict):
    """Save manifest to disk."""
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))


async def generate_single(meditation_type: str, duration: int, voice: str) -> dict | None:
    """Generate a single meditation audio file."""
    filename = f"{meditation_type}_{duration}min_{voice}.mp3"
    filepath = AUDIO_DIR / filename

    print(f"  Generating script: {meditation_type} ({duration}min, voice={voice})...")
    try:
        script = await generate_script(meditation_type, duration)
        if not script.strip():
            print(f"    ⚠ Empty script for {meditation_type}")
            return None

        # For longer scripts, we may need to chunk the TTS
        # TTS has limits, so split into segments for long meditations
        print(f"    Script: {len(script.split())} words")
        print(f"  Converting to speech with voice={voice}...")

        # For very long scripts (20min+), we may need to split
        # For now, try the full text — TTS can handle moderate lengths
        audio_bytes = await text_to_speech(script, voice)

        filepath.write_bytes(audio_bytes)
        print(f"    ✓ Saved: {filename} ({len(audio_bytes) / 1024:.0f} KB)")

        return {
            "meditationType": meditation_type,
            "duration": duration,
            "voiceId": voice,
            "script": script,
            "filename": filename,
            "fileSize": len(audio_bytes),
            "generatedAt": datetime.utcnow().isoformat(),
            "expiresAt": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        }
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return None


async def generate_library(refresh: bool = False):
    """Generate the full meditation audio library."""
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()

    # Determine which entries to generate
    existing = {(e["meditationType"], e["duration"], e["voiceId"]) for e in manifest.get("entries", [])}

    # For initial generation, create a focused set:
    # - Guided/Zen: one voice per type, 5min and 10min
    # - Ambient: one voice, 5min intro
    tasks = []

    # Default voice assignments for variety
    type_voice_map = {
        "body-scan": "kore",         # serene female
        "open-awareness": "charon",   # deep male
        "breath-awareness": "aoede",  # warm female
        "exploring-self": "fenrir",   # grounded male
        "impermanence": "puck",       # gentle neutral
        "emptiness": "zephyr",        # soft neutral
        "beginners-mind": "kore",     # serene female
        "zen-stories": "charon",      # deep male
        "ocean-sounds": "aoede",      # warm female
        "forest-sounds": "kore",      # serene female
        "orchestra-warmup": "puck",   # gentle neutral
        "jungle-sounds": "zephyr",    # soft neutral
    }

    for mtype, voice in type_voice_map.items():
        is_ambient = mtype in SOUND_TYPES
        durations = [5] if is_ambient else [5, 10]

        for dur in durations:
            key = (mtype, dur, voice)
            if not refresh and key in existing:
                print(f"  Skipping (exists): {mtype} {dur}min {voice}")
                continue
            tasks.append((mtype, dur, voice))

    if not tasks:
        print("All audio already generated. Use --refresh to regenerate.")
        return

    print(f"\nGenerating {len(tasks)} audio files...\n")

    new_entries = []
    for i, (mtype, dur, voice) in enumerate(tasks):
        print(f"[{i+1}/{len(tasks)}]")
        entry = await generate_single(mtype, dur, voice)
        if entry:
            new_entries.append(entry)
        # Small delay between API calls
        await asyncio.sleep(1)

    # Update manifest
    if refresh:
        # Replace all entries
        manifest["entries"] = new_entries
    else:
        # Add new entries
        manifest["entries"].extend(new_entries)

    manifest["lastGenerated"] = datetime.utcnow().isoformat()
    save_manifest(manifest)

    print(f"\n✓ Generated {len(new_entries)} audio files")
    print(f"  Manifest saved to: {MANIFEST_PATH}")


if __name__ == "__main__":
    refresh = "--refresh" in sys.argv
    asyncio.run(generate_library(refresh=refresh))
