Partner logos for the home page's Partners section.

Expected here: `panda.png` — the PANDA "Pizza e Pane" wordmark.

Until a file is present the card falls back to showing the partner's name as
text, so nothing looks broken. Logos are inverted by CSS (`.partner img`)
because they are usually black on white and this page is black; a logo that is
already light needs that filter turned off.
