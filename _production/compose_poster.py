from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / '_production/poster-source.webp').convert('RGB')
# The accepted Aigram generation has the strongest hand-to-storm narrative.
# A square editorial crop removes the unwanted plinth/logo from its lower edge.
image = source.crop((112, 0, 912, 800)).resize((1024, 1024), Image.Resampling.LANCZOS)
# Remove a few small shard-like generation artifacts while keeping the Aigram
# photograph, glass rim, hand and vortex intact.
pixels = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
mask = np.zeros((1024, 1024), dtype=np.uint8)
for center, axes in [
    ((329, 348), (18, 15)), ((680, 366), (19, 14)), ((230, 421), (15, 13)),
    ((284, 444), (19, 15)), ((806, 374), (16, 12)), ((400, 893), (19, 16)),
    ((279, 968), (15, 10)), ((550, 967), (20, 15)),
]:
    cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
pixels = cv2.inpaint(pixels, mask, 11, cv2.INPAINT_TELEA)
image = Image.fromarray(cv2.cvtColor(pixels, cv2.COLOR_BGR2RGB))
overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

for y in range(245):
    alpha = round(165 * (1 - y / 245) ** 1.8)
    draw.line((0, y, 1024, y), fill=(4, 5, 7, alpha))

title = 'VORTEX CORE'
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Didot.ttc', 82)
bounds = draw.textbbox((0, 0), title, font=font)
x = (1024 - (bounds[2] - bounds[0])) / 2
draw.text((x + 2, 40), title, font=font, fill=(0, 0, 0, 170))
draw.text((x, 37), title, font=font, fill=(244, 241, 232, 255))

image = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
(ROOT / 'public').mkdir(exist_ok=True)
image.save(ROOT / 'public/poster.png', 'PNG', optimize=True)
image.resize((160, 160), Image.Resampling.LANCZOS).save(ROOT / '_production/poster-thumb.png', 'PNG', optimize=True)
