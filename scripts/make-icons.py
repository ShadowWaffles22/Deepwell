"""Regenerates the pixel-art app icons in public/icons (needs Pillow): python3 scripts/make-icons.py"""
from PIL import Image
import os, random

G = 32  # logical pixel grid
random.seed(7)
img = Image.new('RGB', (G, G), (11, 13, 18))
px = img.load()
cx = cy = (G - 1) / 2

def put(x, y, c):
    if 0 <= x < G and 0 <= y < G: px[x, y] = c

# background speckle
for _ in range(60):
    put(random.randrange(G), random.randrange(G), (18, 21, 30))
# the well: stone ring around dark water
for y in range(G):
    for x in range(G):
        d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        if d <= 12.2:
            brick = (x // 3 + (y // 2) * 2) % 2
            lit = (75, 81, 105) if (x + y) % 5 else (91, 98, 128)
            put(x, y, lit if brick else (54, 59, 77))
        if d <= 8.2:
            t = min(1, d / 8.2)
            put(x, y, (int(5 + 12 * t), int(6 + 26 * t), int(10 + 52 * t)))
        if 8.2 < d <= 9.2:
            put(x, y, (30, 33, 46))
# ripples
for (x, y) in [(11, 20), (12, 20), (19, 22), (20, 22), (14, 11), (15, 11)]:
    put(x, y, (47, 110, 168))
# gold down-chevrons (the way down)
down = ['yyyyyy', '.yyyy.', '..yy..']
gold = (255, 211, 107); amber = (232, 182, 90)
for k, off in enumerate((11, 16)):
    for j, row in enumerate(down):
        for i, ch in enumerate(row):
            if ch == 'y':
                put(13 + i, off + j, gold if k == 0 else amber)
# border highlight
for i in range(G):
    for c in (0, G - 1):
        put(i, c, (26, 30, 42)); put(c, i, (26, 30, 42))

out = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(out, exist_ok=True)
def save(name, size):
    img.resize((size, size), Image.NEAREST).save(os.path.join(out, name))
save('icon-512.png', 512)
save('icon-maskable-512.png', 512)
save('icon-192.png', 192)
save('apple-touch-icon.png', 180)
print('icons written to', os.path.abspath(out))
