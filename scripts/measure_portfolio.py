#!/usr/bin/env python3
"""Print how many live-portfolio gates pass on trunk. Stdlib only."""
import hashlib
import re
from pathlib import Path

PHOTO_MD5 = "d596a33b89fd8a702fd183781f266149"
COUNTRIES = ("Finland", "Germany", "Italy", "Norway", "Spain", "Sweden")
# third parties who did not consent to a public page
REFEREES = ("former CIO", "current CEO")

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
if not any(r in html for r in REFEREES):
    n += 1
# a recruiter can act from the hero, not after four accordions
if 'class="hero-cta"' in html and 'class="avail"' in html:
    n += 1
# every auto-fit grid needs an explicit column gutter (React/Java collided at 390)
autofit = re.findall(r"\{[^{}]*auto-fit[^{}]*\}", html)
if autofit and all(("column-gap:" in r or re.search(r"[^-]gap:\s*[1-9]", r)) for r in autofit):
    n += 1
print(n)
