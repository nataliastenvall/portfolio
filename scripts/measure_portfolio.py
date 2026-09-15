#!/usr/bin/env python3
"""Print how many live-portfolio gates pass on trunk. Stdlib only."""
import hashlib
from pathlib import Path

PHOTO_MD5 = "d596a33b89fd8a702fd183781f266149"
COUNTRIES = ("Finland", "Germany", "Italy", "Norway", "Spain", "Sweden")

html_path = Path("index.html")
photo_path = Path("img/natalia.jpg")
html = html_path.read_text(encoding="utf-8") if html_path.is_file() else ""

n = 0
if photo_path.is_file() and hashlib.md5(photo_path.read_bytes()).hexdigest() == PHOTO_MD5:
    n += 1
if all(c in html for c in COUNTRIES):
    n += 1
if "I build bridges" in html:
    n += 1
if "setInterval" in html and "pageshow" in html:
    n += 1
if "tel:" not in html.lower() and "+358" not in html:
    n += 1
if "Finnish citizen" not in html:
    n += 1
if "--ink-soft:" in html:
    n += 1
if "--paper:#DEE2DE" in html:
    n += 1
print(n)
