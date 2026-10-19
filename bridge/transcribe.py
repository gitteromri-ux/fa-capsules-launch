import glob, json, os, subprocess, wave
import numpy as np
from faster_whisper import WhisperModel
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
m = WhisperModel("small.en", device="cpu", compute_type="int8")
os.makedirs("bridge/out/transcripts", exist_ok=True)
for f in sorted(glob.glob("bridge/out/ugc/*.mp4")):
    name = os.path.basename(f)[:-4]
    wav = f"/tmp/{name}.wav"
    subprocess.run([FF, "-v", "error", "-y", "-i", f, "-ac", "1", "-ar", "16000", "-f", "wav", wav], check=True)
    with wave.open(wav, "rb") as w:
        audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    segs, _ = m.transcribe(audio, word_timestamps=True, beam_size=5, vad_filter=False, language="en")
    words, text = [], []
    for s in segs:
        text.append(s.text.strip())
        for w_ in (s.words or []):
            words.append({"w": w_.word.strip(), "s": round(w_.start, 3), "e": round(w_.end, 3), "p": round(w_.probability, 3)})
    json.dump({"text": " ".join(text), "words": words}, open(f"bridge/out/transcripts/{name}.json", "w"), indent=1)
    print(name, " ".join(text), flush=True)
