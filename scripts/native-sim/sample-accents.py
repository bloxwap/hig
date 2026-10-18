"""Most frequent saturated colours in simulator captures (#93). Needs Pillow.
Usage: python3 -I scripts/native-sim/sample-accents.py <dir> <capture name without .png>...
Counts every second pixel on both axes and lists colours whose channel spread exceeds 80 (accents, not neutrals)."""
import json, sys
from collections import Counter
from PIL import Image

result = {}
for name in sys.argv[2:]:
    image = Image.open(f"{sys.argv[1]}/{name}.png").convert("RGB")
    width, height = image.size
    pixels = image.load()
    counts = Counter(pixels[x, y] for x in range(0, width, 2) for y in range(0, height, 2))
    saturated = [(c, n) for c, n in counts.most_common(400) if max(c) - min(c) > 80][:6]
    result[name] = [{"rgb": "#%02x%02x%02x" % c, "samples": n} for c, n in saturated]
print(json.dumps(result, indent=1))
