Partner logos for the home page's Partners section.

Expected here: **`panda.jpg`** (or `panda.png` — the card tries .jpg first,
then .png).

Until a file is present the card falls back to showing the partner's name as
text, so nothing ever renders as a broken image.

Upload the logo as it comes — black artwork on a white canvas is fine — then
run it through the converter, which makes the mark white, the canvas
transparent, and trims the margin:

    python3 tools/partner_logo.py img/partners/NAME.jpg

That writes `NAME.png` next to it. Point the card at the `.png` and mark it
`plain-logo`, which skips the CSS inversion:

    <div class="partner plain-logo">
      <img src="img/partners/NAME.png" ...>

Doing it in the file rather than in CSS is deliberate: inverting in CSS leaves
a black rectangle on the card, and `mix-blend-mode: screen` does not drop it
out, because `.partner` carries a `backdrop-filter` and that isolates the
blend. JPEG compression also puts the "white" at 254 rather than 255, so
there is nothing clean for a blend mode to key on.

The original upload can stay in the folder; only the `.png` is referenced.
