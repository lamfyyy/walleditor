#!/usr/bin/env python3
"""Проверка исходных ассетов: хэши (неизменность), размеры, прозрачность, AppIcon.appiconset/Contents.json."""
import hashlib, json, sys, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "walleditor"
LOCK = pathlib.Path(__file__).resolve().parent / "assets.sha256.json"
errors = []

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

files = sorted([*ROOT.glob("*.png"), *ROOT.glob("AppIcon.appiconset/*")])
current = {str(f.relative_to(ROOT)): sha(f) for f in files if f.is_file()}
if "--update" in sys.argv:
    LOCK.write_text(json.dumps(current, indent=2)); print("lock обновлён"); sys.exit(0)
if LOCK.exists():
    for k, v in json.loads(LOCK.read_text()).items():
        if current.get(k) != v: errors.append(f"ИЗМЕНЁН или отсутствует исходный ассет: {k}")

exp = {"background.png": ((736, 1308), "RGB"), "asset1.png": ((1435, 1769), "RGBA"), "asset2.png": ((736, 736), "RGBA")}
for n, (size, mode) in exp.items():
    im = Image.open(ROOT / n)
    if im.size != size: errors.append(f"{n}: размер {im.size}, ожидался {size}")
    if im.mode != mode: errors.append(f"{n}: режим {im.mode}, ожидался {mode}")
    if mode == "RGBA":
        lo, hi = im.getchannel("A").getextrema()
        if lo != 0: errors.append(f"{n}: нет прозрачных пикселей")
a1 = Image.open(ROOT / "asset1.png").getchannel("A").getbbox()
if a1 != (0, 0, 1435, 1769): errors.append(f"asset1: есть прозрачные поля, bbox={a1}")
a2 = Image.open(ROOT / "asset2.png").getchannel("A").getbbox()
if a2 != (31, 55, 601, 736): errors.append(f"asset2: bbox={a2}, демо рассчитано на (31,55,601,736)")

ic = ROOT / "AppIcon.appiconset"
c = json.loads((ic / "Contents.json").read_text())
seen = set()
for it in c["images"]:
    f = ic / it["filename"]; seen.add(f.name)
    if not f.exists(): errors.append(f"Contents.json ссылается на отсутствующий файл {f.name}"); continue
    im = Image.open(f)
    if im.size != (1024, 1024): errors.append(f"{f.name}: не 1024x1024")
    if im.mode in ("RGBA", "LA") and im.getchannel("A").getextrema()[0] < 255: errors.append(f"{f.name}: альфа-канал недопустим для иконки")
apps = [i.get("appearances", [{}])[0].get("value") if i.get("appearances") else "light" for i in c["images"]]
if sorted(apps) != ["dark", "light", "tinted"]: errors.append(f"ожидались light/dark/tinted, найдено {apps}")
extra = {p.name for p in ic.glob("*.png")} - seen
if extra: errors.append(f"PNG вне Contents.json: {extra}")

print("\n".join(("ОШИБКА: " + e) for e in errors) or "Ассеты в порядке")
sys.exit(1 if errors else 0)
