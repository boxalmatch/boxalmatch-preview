Partner logos for the home page's Partners section.

Expected here: **`panda.jpg`** (or `panda.png` — the card tries .jpg first,
then .png).

Until a file is present the card falls back to showing the partner's name as
text, so nothing ever renders as a broken image.

Black-on-white artwork is handled automatically: CSS inverts it and then
blends it with `screen`, so the white canvas drops out entirely and only the
mark is left, white, on the card. Nothing needs preparing for that.

Two things do help:

- **Trim the white margin before uploading.** The card scales the whole file
  to 120px tall, so a wordmark sitting in a large empty canvas ends up small.
- **A logo that is already light, or a transparent PNG,** should skip the
  inversion — add `plain-logo` to its card:
  `<div class="partner plain-logo">`.
