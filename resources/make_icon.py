from PIL import Image, ImageDraw, ImageFilter
import os

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Rounded tile with a diagonal violet gradient.
radius = int(S * 0.23)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=255)

grad = Image.new("RGB", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    for_x = y / S
    r = int(124 + (66 - 124) * for_x)
    g = int(108 + (52 - 108) * for_x)
    b = int(255 + (196 - 255) * for_x)
    gd.line([(0, y), (S, y)], fill=(r, g, b))
# Add a magenta wash in the top-right corner.
wash = Image.new("RGBA", (S, S), (0, 0, 0, 0))
wd = ImageDraw.Draw(wash)
for i in range(70):
    alpha = int(3 + i * 0.25)
    wd.ellipse([S * 0.52 - i * 4, -S * 0.35 - i * 3, S * 1.35 + i * 4, S * 0.72 + i * 3],
               fill=(255, 122, 200, alpha))
wash = wash.filter(ImageFilter.GaussianBlur(70))
grad = Image.alpha_composite(grad.convert("RGBA"), wash).convert("RGB")

img.paste(grad, (0, 0), mask)

# Inner rim light.
rim = Image.new("RGBA", (S, S), (0, 0, 0, 0))
rd = ImageDraw.Draw(rim)
rd.rounded_rectangle([2, 2, S - 3, S - 3], radius=radius, outline=(255, 255, 255, 60), width=6)
img = Image.alpha_composite(img, rim)

# Glass highlight across the upper half.
gloss = Image.new("RGBA", (S, S), (0, 0, 0, 0))
gl = ImageDraw.Draw(gloss)
gl.ellipse([-S * 0.25, -S * 0.75, S * 1.2, S * 0.5], fill=(255, 255, 255, 38))
gloss = gloss.filter(ImageFilter.GaussianBlur(45))
gloss.putalpha(Image.composite(gloss.getchannel("A"), Image.new("L", (S, S), 0), mask))
img = Image.alpha_composite(img, gloss)

# Mark: three ascending rounded bars + a mint beacon dot.
mark = Image.new("RGBA", (S, S), (0, 0, 0, 0))
md = ImageDraw.Draw(mark)
bar_w = int(S * 0.115)
gap = int(S * 0.055)
heights = [int(S * 0.20), int(S * 0.29), int(S * 0.38)]
left = int(S * 0.245)
bottom = int(S * 0.755)
for i, h in enumerate(heights):
    x1 = left
    y1 = bottom - h
    md.rounded_rectangle([x1, y1, x1 + bar_w, bottom], radius=bar_w // 2, fill=(255, 255, 255, 246))
    left = x1 + bar_w + gap
# Beacon above the tallest bar.
cx, cy, cr = int(S * 0.69), int(S * 0.255), int(S * 0.047)
md.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(110, 231, 199, 255))
mark = mark.filter(ImageFilter.GaussianBlur(1.2))
img = Image.alpha_composite(img, mark)

# Soft outer shadow inside the canvas.
shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle([10, 16, S - 10, S - 4], radius=radius, fill=(0, 0, 0, 120))
shadow = shadow.filter(ImageFilter.GaussianBlur(26))
base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
base = Image.alpha_composite(base, shadow)
base = Image.alpha_composite(base, img)

out_dir = os.path.join(os.environ.get("TEMP", "."), "presence-studio-icons")
os.makedirs(out_dir, exist_ok=True)
base.resize((512, 512), Image.LANCZOS).save(os.path.join(out_dir, "icon.png"))
base.resize((256, 256), Image.LANCZOS).save(os.path.join(out_dir, "icon-256.png"))
base.resize((32, 32), Image.LANCZOS).save(os.path.join(out_dir, "tray.png"))
base.save(os.path.join(out_dir, "icon.ico"), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("icons written")
