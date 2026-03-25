/**
 * TTS Bridge — calls the Python pplx TTS SDK from Node.js
 * The Python SDK has the TTS capability that the Node SDK doesn't support.
 */

import { execFile } from "child_process";
import path from "path";
import fs from "fs";

const TTS_SCRIPT = path.resolve(process.cwd(), "scripts/tts_worker.py");

export function textToSpeechPython(
  text: string,
  voice: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = execFile(
      "python3",
      [TTS_SCRIPT, "--voice", voice, "--output", outputPath],
      {
        env: { ...process.env },
        timeout: 300000, // 5 min timeout for long texts
        maxBuffer: 50 * 1024 * 1024, // 50MB
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`TTS failed: ${stderr || error.message}`));
        } else {
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            resolve();
          } else {
            reject(new Error("TTS produced no output file"));
          }
        }
      }
    );

    // Write text to stdin
    if (proc.stdin) {
      proc.stdin.write(text);
      proc.stdin.end();
    }
  });
}
