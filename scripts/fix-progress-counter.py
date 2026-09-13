from pathlib import Path

root = Path.cwd()

html = root / "web" / "index.html"
js = root / "web" / "js" / "app.js"

# ---------- index.html ----------
s = html.read_text(encoding="utf-8-sig")

old = '<section class="stats" id="progress"><div><b id="doneCount">0</b><span>Completed</span></div>'

new = '<section class="stats" id="progress"><div><b id="doneCountSummary">0</b><span>Completed</span></div>'

if old not in s:
    raise SystemExit("STOP: Expected progress HTML was not found.")

s = s.replace(old, new, 1)
html.write_text(s, encoding="utf-8")

# ---------- app.js ----------
s = js.read_text(encoding="utf-8-sig")

old = 'function updateDashboard(){'
start = s.find(old)

if start == -1:
    raise SystemExit("STOP: updateDashboard() was not found.")

target = '$("#doneCount").textContent=d;$("#mistakeCount")'
replacement = '$("#doneCount").textContent=d;$("#doneCountSummary").textContent=d;$("#mistakeCount")'

if target not in s:
    raise SystemExit("STOP: Expected dashboard update code was not found.")

s = s.replace(target, replacement, 1)
js.write_text(s, encoding="utf-8")

print("=" * 60)
print("PROGRESS COUNTER FIX COMPLETE")
print("=" * 60)
print("index.html : doneCountSummary added")
print("app.js     : summary counter synchronized")
print("=" * 60)
