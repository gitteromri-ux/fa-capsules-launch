import glob, json, os, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
os.makedirs("bridge/out/transcripts", exist_ok=True)
for f in sorted(glob.glob("bridge/out/ugc/*.mp4")):
    name = os.path.basename(f)[:-4]
    segs, _ = m.transcribe(f, word_timestamps=True, beam_size=5, vad_filter=False, language="en")
    words = []
    text = []
    for s in segs:
        text.append(s.text.strip())
        for w in (s.words or []):
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
    json.dump({"text": " ".join(text), "words": words}, open(f"bridge/out/transcripts/{name}.json", "w"), indent=1)
    print(name, " ".join(text), flush=True)
