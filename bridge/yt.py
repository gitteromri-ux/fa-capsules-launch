import json, subprocess, os, sys
os.makedirs("bridge/out/yt", exist_ok=True)
log = open("bridge/out/yt/log.txt", "w")
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True); log.write(" ".join(cmd) + "\n" + r.stdout[-3000:] + r.stderr[-3000:] + "\n"); return r
# channel listing
r = run(["yt-dlp", "--flat-playlist", "-J", "https://www.youtube.com/@FrenchbyAtelier/videos"])
ids = {}
try:
    d = json.loads(r.stdout)
    for e in d.get("entries", []):
        ids[e.get("id")] = e.get("title")
except Exception as ex:
    log.write(f"listing failed {ex}\n")
json.dump(ids, open("bridge/out/yt/channel.json", "w"), indent=1)
want = {"z-l7f4qOmEo": "philippe", "WbodfrXFjyg": "caitlin"}
for vid, title in ids.items():
    if title and "stan" in title.lower(): want[vid] = "stan"
for vid, name in want.items():
    run(["yt-dlp", "-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "--merge-output-format", "mp4", "-o", f"bridge/out/yt/{name}.mp4", f"https://www.youtube.com/watch?v={vid}"])
log.close()
