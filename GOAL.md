# GOAL

Natalia's portfolio is live at <https://koroleva.cv> — her own domain, served by
GitHub Pages out of this repo with HTTPS enforced — carrying her approved
photograph, the six NPS countries she named (Finland, Germany, Italy, Norway,
Spain, Sweden), first-person bridge-between-cultures copy, and a page that picks
up new content without a hard refresh. `https://natalia.46.225.91.43.sslip.io`
stays as the nbg1 preview mirror of the same file.

One continuous page on the desktop, not a floating card. A bounded hero on a
television, never a viewport-sized photograph. No WebGL field behind her.
Not a generated likeness. Not a downloadable CV: phone and referees stay
private. No public `tel:` and no citizenship line.

## Numbers that prove it

The measure name has to stay under 90 characters or the manager's
`NUMBERS_LINE_RE` never matches the line and the channel reads `not measured
yet` with a green GOAL.md sitting on trunk. Gate details live in
`scripts/measure_portfolio.py`, not in the metric name.

Gates 13-16 lock in changes Natalia asked for by name. Each is a regression this
repo shipped once and had to undo: the custom domain going dark when `CNAME`
leaves the tree, the Three.js field behind the portrait, the floating desktop
card, and a hero sized as a share of the viewport.

- portfolio source gates on trunk: `python3 scripts/measure_portfolio.py` - today: 16; target: 16
