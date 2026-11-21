#!/usr/bin/env python3
"""Независимая (stdlib) проверка .tendies: ZIP, раскладка descriptors/, согласованность ID, plist, CAML, ресурсы."""
import sys, zipfile, plistlib, re, posixpath
import xml.etree.ElementTree as ET

def check(path):
    errs, warns = [], []
    z = zipfile.ZipFile(path)
    bad = z.testzip()
    if bad: errs.append(f"битая запись ZIP: {bad}")
    names = [n for n in z.namelist() if not n.endswith("/")]
    for n in names:
        if re.search(r"(^|/)(__MACOSX|\.DS_Store|\._[^/]*)(/|$)", n): errs.append(f"мусор: {n}")
        if n.startswith("/") or ".." in n.split("/") or "\\" in n: errs.append(f"плохой путь: {n}")
    tops = {n.split("/")[0].lower() for n in names}
    if "container" in tops: errs.append("формат Container не поддерживается")
    if tops & {"video-descriptor", "video-descriptors"}: errs.append("PhotosPosterProvider не поддерживается")
    if not tops & {"descriptor", "descriptors"}: errs.append("нет descriptors/ в корне")
    descs = {n.split("/")[1] for n in names if n.startswith("descriptors/") and n.count("/") > 1}
    if not descs: errs.append("пустой descriptors/")
    for d in descs:
        pre = f"descriptors/{d}/"
        idf = pre + "com.apple.posterkit.provider.descriptor.identifier"
        if idf not in names: errs.append(f"{d}: нет descriptor.identifier"); continue
        ident = z.read(idf).decode().strip()
        if not ident.isdigit(): errs.append(f"{d}: идентификатор не число")
        ui = [n for n in names if n.startswith(pre) and n.endswith("contents.userInfo")]
        wp = [n for n in names if n.startswith(pre) and n.endswith("/Wallpaper.plist")]
        cm = [n for n in names if n.startswith(pre) and n.endswith("main.caml")]
        if not ui: errs.append(f"{d}: нет userInfo")
        if not wp: errs.append(f"{d}: нет Wallpaper.plist")
        if not cm: errs.append(f"{d}: нет main.caml")
        for f, key in [(ui, "wallpaperRepresentingIdentifier"), (wp, "identifier")]:
            for n in f:
                try:
                    pl = plistlib.loads(z.read(n))
                    if str(pl.get(key)) != ident: errs.append(f"{n}: {key}={pl.get(key)} ≠ {ident}")
                except Exception as e: errs.append(f"{n}: plist не читается ({e})")
        for n in cm:
            try: root = ET.fromstring(z.read(n))
            except Exception as e: errs.append(f"{n}: XML ({e})"); continue
            base = posixpath.dirname(n)
            for el in root.iter():
                s = el.attrib.get("src")
                if s and posixpath.join(base, s) not in names: errs.append(f"{n}: нет ресурса {s}")
    return errs, warns

if __name__ == "__main__":
    rc = 0
    for p in sys.argv[1:]:
        e, w = check(p)
        print(f"{p}: " + ("OK" if not e else "ОШИБКИ"))
        for x in e: print("  ✗", x)
        for x in w: print("  !", x)
        rc |= bool(e)
    sys.exit(rc)
