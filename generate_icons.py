"""Generate VaultCraft icons from instalador.png with an HD 'V' letter.

Uses saturation-based flood fill for perfect background removal,
4x supersampling for crisp text, and premultiplied-alpha downscaling.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from collections import deque
import numpy as np
import struct
import io
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_IMG = os.path.join(BASE_DIR, "instalador.png")
ICONS_DIR = os.path.join(BASE_DIR, "src-tauri", "icons")
INSTALLER_DIR = os.path.join(BASE_DIR, "installer")

SS = 4
MASTER_SIZE = 1024


def remove_background(src_path):
    """Remove background using saturation-based BFS from corners.

    The source image is a rounded-rect icon on a gray background.
    Gray pixels have saturation ~0, the icon is colorful (sat > 0.2).
    BFS from corners expands through low-saturation pixels, then
    anti-aliased edge pixels get smooth alpha from their saturation.
    """
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]

    # Compute saturation per pixel
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)
    max_rgb = np.maximum(r, np.maximum(g, b))
    min_rgb = np.minimum(r, np.minimum(g, b))
    sat = (max_rgb - min_rgb) / (max_rgb + 1e-10)

    # BFS from corners through low-saturation pixels (8-directional)
    visited = np.zeros((h, w), dtype=bool)
    is_bg = np.zeros((h, w), dtype=bool)
    queue = deque()

    # Seed from corner 10x10 patches
    for cy, cx in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]:
        for dy in range(10):
            for dx in range(10):
                sy = max(0, min(h - 1, cy + (dy if cy == 0 else -dy)))
                sx = max(0, min(w - 1, cx + (dx if cx == 0 else -dx)))
                if not visited[sy, sx]:
                    queue.append((sy, sx))

    SAT_THRESHOLD = 0.10

    while queue:
        y, x = queue.popleft()
        if visited[y, x]:
            continue
        visited[y, x] = True

        if sat[y, x] < SAT_THRESHOLD:
            is_bg[y, x] = True
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                        queue.append((ny, nx))

    # Make background fully transparent
    arr[is_bg] = [0, 0, 0, 0]

    # Anti-aliased edge: transition zone (dilate background mask by 6px)
    bg_mask = Image.fromarray((is_bg * 255).astype(np.uint8))
    dilated = bg_mask.filter(ImageFilter.MaxFilter(13))
    edge_zone = (np.array(dilated) > 128) & ~is_bg

    # In the edge zone, alpha is derived from saturation:
    #   sat < 0.08 → fully transparent (gray fringe)
    #   sat > 0.30 → fully opaque (icon content)
    #   in between → smooth ramp
    edge_alpha = np.clip((sat - 0.08) / 0.22, 0.0, 1.0)
    arr[edge_zone, 3] = (edge_alpha[edge_zone] * 255).astype(np.uint8)

    # Also zero out RGB for fully transparent pixels (prevent dark halos)
    fully_transparent = arr[:, :, 3] == 0
    arr[fully_transparent, :3] = 0

    removed = is_bg.sum()
    total = h * w
    print(f"  Background removed: {removed}/{total} pixels ({removed / total * 100:.1f}%)")
    return Image.fromarray(arr)


def create_hd_master(src_path):
    """Create a high-quality master icon at 4096x4096 with 'V' letter."""
    render_size = MASTER_SIZE * SS  # 4096

    src = remove_background(src_path)
    master = src.resize((render_size, render_size), Image.LANCZOS)

    # Choose the best bold font available
    font = None
    font_size = int(render_size * 0.52)
    font_candidates = [
        ("C:/Windows/Fonts/segoeuib.ttf", font_size),
        ("C:/Windows/Fonts/arialbd.ttf", font_size),
        ("C:/Windows/Fonts/impact.ttf", int(font_size * 0.9)),
        ("C:/Windows/Fonts/calibrib.ttf", font_size),
    ]

    for fp, fs in font_candidates:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, fs)
                print(f"  Using font: {os.path.basename(fp)} at {fs}px")
                break
            except Exception:
                pass

    if font is None:
        raise RuntimeError("No suitable bold font found")

    # Text layer
    text_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_layer)

    bbox = draw.textbbox((0, 0), "V", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (render_size - text_w) / 2 - bbox[0]
    y = (render_size - text_h) / 2 - bbox[1]

    # Shadow for depth
    shadow_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_offset = int(render_size * 0.006)
    shadow_draw.text(
        (x + shadow_offset, y + shadow_offset),
        "V",
        fill=(0, 0, 0, 60),
        font=font,
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=shadow_offset))

    # White V
    draw.text((x, y), "V", fill=(255, 255, 255, 245), font=font)

    master = Image.alpha_composite(master, shadow_layer)
    master = Image.alpha_composite(master, text_layer)

    return master


def downscale(master, size):
    """Downscale with premultiplied alpha for artifact-free resizing."""
    # Premultiply alpha before resizing to prevent dark halos
    arr = np.array(master).astype(np.float32)
    alpha = arr[:, :, 3:4] / 255.0
    arr[:, :, :3] *= alpha

    premult = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    resized = premult.resize((size, size), Image.LANCZOS)

    # Un-premultiply
    out = np.array(resized).astype(np.float32)
    out_alpha = out[:, :, 3:4]
    safe_alpha = np.maximum(out_alpha, 1.0)
    out[:, :, :3] = out[:, :, :3] / safe_alpha * 255.0
    out[:, :, :3] = np.clip(out[:, :, :3], 0, 255)

    # Clean low-alpha fringe — aggressive for small sizes
    threshold = 160 if size <= 48 else (128 if size <= 128 else 40)
    out[out[:, :, 3] < threshold] = [0, 0, 0, 0]

    return Image.fromarray(out.astype(np.uint8))


def create_ico(master, output_path):
    """Create a .ico file with multiple sizes as embedded PNG."""
    sizes = [16, 24, 32, 48, 64, 128, 256]
    entries = []

    for size in sizes:
        img = downscale(master, size)
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        entries.append((size, buf.getvalue()))

    num = len(entries)
    with open(output_path, "wb") as f:
        f.write(struct.pack("<HHH", 0, 1, num))
        data_offset = 6 + num * 16

        for size, png_data in entries:
            w = 0 if size >= 256 else size
            h = 0 if size >= 256 else size
            f.write(
                struct.pack(
                    "<BBBBHHII", w, h, 0, 0, 1, 32, len(png_data), data_offset
                )
            )
            data_offset += len(png_data)

        for _, png_data in entries:
            f.write(png_data)


def main():
    print("Generating HD VaultCraft icons...")
    print(f"  Supersampling: {SS}x ({MASTER_SIZE * SS}x{MASTER_SIZE * SS})")

    master = create_hd_master(SRC_IMG)
    print(f"  Master created: {master.size}")

    tauri_sizes = {
        "icon.png": 1024,
        "512x512.png": 512,
        "256x256.png": 256,
        "128x128@2x.png": 256,
        "128x128.png": 128,
        "64x64.png": 64,
        "48x48.png": 48,
        "32x32.png": 32,
        "16x16.png": 16,
        "Square310x310Logo.png": 310,
        "Square284x284Logo.png": 284,
        "Square150x150Logo.png": 150,
        "Square142x142Logo.png": 142,
        "Square107x107Logo.png": 107,
        "Square89x89Logo.png": 89,
        "Square71x71Logo.png": 71,
        "Square44x44Logo.png": 44,
        "Square30x30Logo.png": 30,
        "StoreLogo.png": 50,
    }

    for filename, size in tauri_sizes.items():
        img = downscale(master, size)
        path = os.path.join(ICONS_DIR, filename)
        img.save(path, "PNG", optimize=True)
        print(f"  {filename} ({size}x{size})")

    ico_path = os.path.join(ICONS_DIR, "icon.ico")
    create_ico(master, ico_path)
    print("  icon.ico (16-256 embedded)")

    icns_img = downscale(master, 1024)
    icns_img.save(os.path.join(ICONS_DIR, "icon.icns"), "PNG", optimize=True)
    print("  icon.icns (1024x1024 PNG)")

    # --- Installer wizard images ---

    # wizard-image.bmp: 164x314 tall panel with gradient
    wizard_img = Image.new("RGB", (164, 314), (50, 50, 120))
    draw = ImageDraw.Draw(wizard_img)
    for y in range(314):
        t = y / 313
        rv = int(110 * (1 - t) + 25 * t)
        gv = int(60 * (1 - t) + 100 * t)
        bv = int(200 * (1 - t) + 230 * t)
        draw.line([(0, y), (163, y)], fill=(rv, gv, bv))

    icon_wiz = downscale(master, 140)
    icon_wiz_rgb = Image.new("RGB", (140, 140), (80, 80, 180))
    icon_wiz_rgb.paste(icon_wiz, (0, 0), icon_wiz)
    wizard_img.paste(icon_wiz_rgb, (12, 55))
    wizard_img.save(os.path.join(INSTALLER_DIR, "wizard-image.bmp"), "BMP")
    print("  wizard-image.bmp (164x314)")

    # wizard-small.bmp: 55x55
    icon_small = downscale(master, 55)
    small_rgb = Image.new("RGB", (55, 55), (255, 255, 255))
    small_rgb.paste(icon_small, (0, 0), icon_small)
    small_rgb.save(os.path.join(INSTALLER_DIR, "wizard-small.bmp"), "BMP")
    print("  wizard-small.bmp (55x55)")

    print("\nAll HD icons generated successfully!")


if __name__ == "__main__":
    main()
