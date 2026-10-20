import json, subprocess, os
os.makedirs("bridge/out/yt", exist_ok=True)
log = open("bridge/out/yt/log.txt", "w")
def run(cmd, timeout=600):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        log.write(" ".join(cmd) + "\n" + r.stdout[-1500:] + r.stderr[-1500:] + "\n"); log.flush(); return r.returncode
    except Exception as ex:
        log.write(f"EXC {ex}\n"); return 1
want = {"z-l7f4qOmEo": "philippe", "WbodfrXFjyg": "caitlin", "TqBegklrz-E": "stan"}
clients = ["tv_embedded", "android_vr", "ios", "mweb", "web_embedded", "tv"]
for vid, name in want.items():
    out = f"bridge/out/yt/{name}.mp4"
    for c in clients:
        rc = run(["yt-dlp", "--no-playlist", "--extractor-args", f"youtube:player_client={c}", "-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "--merge-output-format", "mp4", "-o", out, f"https://www.youtube.com/watch?v={vid}"])
        if rc == 0 and os.path.exists(out) and os.path.getsize(out) > 500000: break
    if not os.path.exists(out):
        # invidious / cobalt fallbacks
        for inst in ["https://inv.nadeko.net", "https://yewtu.be", "https://invidious.nerdvpn.de", "https://iv.ggtyler.dev"]:
            rc = run(["yt-dlp", "--no-playlist", "-f", "b[ext=mp4]/b", "-o", out, f"{inst}/watch?v={vid}"], timeout=300)
            if rc == 0 and os.path.exists(out): break
log.close()
