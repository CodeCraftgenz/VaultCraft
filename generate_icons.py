"""Generate VaultCraft icons from instalador.png with a 'V' letter in the center."""
from PIL import Image, ImageDraw, ImageFont
import struct
import io
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_IMG = os.path.join(BASE_DIR, "instalador.png")
ICONS_DIR = os.path.join(BASE_DIR, "src-tauri", "icons")
INSTALLER_DIR = os.path.join(BASE_DIR, "installer")

def add_v_to_image(img):
    """Add a white 'V' letter centered on the image."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    font_size = int(h * 0.55)

    # Try system fonts
    font = None
    font_paths = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except:
                pass

    if font is None:
        font = ImageFont.load_default()

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), "V", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    x = (w - text_w) / 2 - bbox[0]
    y = (h - text_h) / 2 - bbox[1]

    # Draw shadow for depth
    shadow_offset = max(2, int(h * 0.01))
    draw.text((x + shadow_offset, y + shadow_offset), "V", fill=(0, 0, 0, 80), font=font)

    # Draw the V
    draw.text((x, y), "V", fill=(255, 255, 255, 255), font=font)

    return img

def create_ico(images_dict, output_path):
    """Create a .ico file from a dict of {size: Image}."""
    # ICO sizes to include (must be <= 256)
    sizes_to_include = [16, 32, 48, 64, 128, 256]
    entries = []

    for size in sizes_to_include:
        if size in images_dict:
            img = images_dict[size].copy()
        else:
            img = images_dict[max(images_dict.keys())].copy()
            img = img.resize((size, size), Image.LANCZOS)

        # Convert to RGBA
        if img.mode != "RGBA":
            img = img.convert("RGBA")

        # Save as PNG in memory
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_data = buf.getvalue()

        entries.append((size, png_data))

    # Write ICO file
    num = len(entries)
    with open(output_path, "wb") as f:
        # ICONDIR header
        f.write(struct.pack("<HHH", 0, 1, num))

        # Calculate data offset (header + entries)
        data_offset = 6 + num * 16

        # ICONDIRENTRY for each image
        for size, png_data in entries:
            w = 0 if size >= 256 else size
            h = 0 if size >= 256 else size
            f.write(struct.pack("<BBBBHHII",
                w, h, 0, 0, 1, 32, len(png_data), data_offset))
            data_offset += len(png_data)

        # Image data
        for _, png_data in entries:
            f.write(png_data)

def main():
    # Load source image
    src = Image.open(SRC_IMG).convert("RGBA")
    print(f"Source image: {src.size}")

    # Create master icon with V
    master = add_v_to_image(src.copy())

    # Tauri icon sizes
    tauri_sizes = {
        "16x16.png": 16,
        "32x32.png": 32,
        "48x48.png": 48,
        "64x64.png": 64,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "256x256.png": 256,
        "512x512.png": 512,
        "icon.png": 1024,
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    # Generate each size
    images_by_size = {}
    for filename, size in tauri_sizes.items():
        resized = master.copy().resize((size, size), Image.LANCZOS)
        output_path = os.path.join(ICONS_DIR, filename)
        resized.save(output_path, "PNG")
        images_by_size[size] = resized
        print(f"  Generated {filename} ({size}x{size})")

    # Generate .ico
    ico_path = os.path.join(ICONS_DIR, "icon.ico")
    create_ico(images_by_size, ico_path)
    print(f"  Generated icon.ico")

    # Generate .icns (just copy the 1024x1024 PNG — proper icns needs special tooling on macOS)
    # For Windows build, .icns isn't critical. We'll save a large PNG as placeholder
    icns_src = master.copy().resize((1024, 1024), Image.LANCZOS)
    icns_src.save(os.path.join(ICONS_DIR, "icon.icns"), "PNG")
    print(f"  Generated icon.icns (PNG fallback)")

    # Generate installer wizard images (BMP format required by Inno Setup)
    # wizard-image.bmp: 164x314 (tall left panel image)
    wizard_large = master.copy().resize((164, 164), Image.LANCZOS)
    # Create a gradient background matching the icon
    wizard_img = Image.new("RGB", (164, 314), (50, 50, 120))
    draw = ImageDraw.Draw(wizard_img)
    for y in range(314):
        ratio = y / 314
        r = int(100 * (1 - ratio) + 30 * ratio)
        g = int(50 * (1 - ratio) + 120 * ratio)
        b = int(180 * (1 - ratio) + 220 * ratio)
        draw.line([(0, y), (163, y)], fill=(r, g, b))

    # Paste the icon centered horizontally, slightly above center
    icon_for_wizard = master.copy().resize((130, 130), Image.LANCZOS)
    x_offset = (164 - 130) // 2
    y_offset = 60
    wizard_img.paste(icon_for_wizard, (x_offset, y_offset), icon_for_wizard)
    wizard_img.save(os.path.join(INSTALLER_DIR, "wizard-image.bmp"), "BMP")
    print(f"  Generated wizard-image.bmp (164x314)")

    # wizard-small.bmp: 55x55 (small icon in top-right corner)
    wizard_small = master.copy().resize((55, 55), Image.LANCZOS)
    wizard_small_rgb = Image.new("RGB", (55, 55), (255, 255, 255))
    wizard_small_rgb.paste(wizard_small, (0, 0), wizard_small)
    wizard_small_rgb.save(os.path.join(INSTALLER_DIR, "wizard-small.bmp"), "BMP")
    print(f"  Generated wizard-small.bmp (55x55)")

    print("\nAll icons generated successfully!")

if __name__ == "__main__":
    main()
