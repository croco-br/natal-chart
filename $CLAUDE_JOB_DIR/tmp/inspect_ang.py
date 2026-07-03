import json
d = json.load(open("$CLAUDE_JOB_DIR/tmp/ang.json".replace("$CLAUDE_JOB_DIR", __import__("os").environ["CLAUDE_JOB_DIR"])))
pts = d["chart"]["points"]
print("angel field samples:")
for n, p in pts.items():
    print(f"  {n:8} {p['sign']:4} pos={p['position']:6.2f}  angel={p.get('angel')}")
print("\nall points have angel field:", all("angel" in p for p in pts.values()))
