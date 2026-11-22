#!/usr/bin/env python3
"""Composite a raw screenshot into a device frame PNG.

Usage:
  python3 scripts/frame_screenshot.py macbook|iphone raw.png out.png
  python3 scripts/frame_screenshot.py verify

The screenshot must match the frame's screen aperture aspect exactly and be
fully opaque. The device PNG (bezel, notch, island) is alpha-composited over
the screenshot, so its opaque parts always win; the output keeps the frame's
transparent exterior.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FRAMES_DIR = ROOT / "video" / "public" / "frames"
VERIFY_DIR = ROOT / "tmp" / "frameit-verify"

DEVICES = {
    "macbook": {
        "frame": FRAMES_DIR / "MacBook Pro 14 - Silver.png",
        "aperture": (400, 300, 3024, 1964),
    },
    "iphone": {
        "frame": FRAMES_DIR / "iPhone 17 Pro Max - Silver.png",
        "aperture": (100, 100, 1320, 2868),
    },
}


def die(msg):
    raise SystemExit(f"frame_screenshot: {msg}")


def load_shot(path):
    with Image.open(path) as source:
        shot = source.convert("RGBA")
    if shot.getchannel("A").getextrema()[0] != 255:
        die(f"{path} has transparent pixels; screenshot must be opaque")
    return shot.convert("RGB")


def aperture_mask(frame, spec):
    ax, ay, aw, ah = spec["aperture"]
    alpha = frame.getchannel("A").crop((ax, ay, ax + aw, ay + ah))
    aperture = alpha.point(lambda value: 0 if value < 255 else 255)
    ImageDraw.floodfill(aperture, (aw // 2, ah // 2), 128)
    return aperture.point(lambda value: 255 if value == 128 else 0)


def frame_shot(shot_path, out_path, device):
    spec = DEVICES[device]
    frame = Image.open(spec["frame"]).convert("RGBA")
    ax, ay, aw, ah = spec["aperture"]

    shot = load_shot(shot_path)
    sw, sh = shot.size
    if sw * ah != sh * aw:
        die(f"aspect mismatch: shot {sw}x{sh} vs aperture {aw}x{ah}")
    if (sw, sh) != (aw, ah):
        shot = shot.resize((aw, ah), Image.LANCZOS)

    shot = shot.convert("RGBA")
    mask = aperture_mask(frame, spec)
    underlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    underlay.paste(shot, (ax, ay), mask)
    out = Image.alpha_composite(underlay, frame)

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(out_path, format="PNG")
    return out


def verify():
    VERIFY_DIR.mkdir(parents=True, exist_ok=True)
    failures = []

    def check(cond, label):
        print(("PASS" if cond else "FAIL"), label)
        if not cond:
            failures.append(label)

    for device, spec in DEVICES.items():
        frame = Image.open(spec["frame"]).convert("RGBA")
        ax, ay, aw, ah = spec["aperture"]

        shot_size = (aw // 2, ah // 2)
        shot_path = VERIFY_DIR / f"{device}-shot.png"
        Image.new("RGB", shot_size, (120, 60, 200)).save(shot_path)
        out_path = VERIFY_DIR / f"{device}-out.png"
        out = frame_shot(shot_path, out_path, device)
        check(out.size == frame.size, f"{device}: output size {out.size} == frame {frame.size}")
        check(out.mode == "RGBA", f"{device}: output mode RGBA")

        fa = frame.getchannel("A")
        oa = out.getchannel("A")

        check(oa.getpixel((5, 5)) == 0, f"{device}: exterior corner alpha=0")

        px = out.getpixel((ax + aw // 2, ay + ah // 2))
        check(px[3] == 255 and px[:3] == (120, 60, 200),
              f"{device}: aperture center shows shot {px}")

        region = frame.crop((ax, ay, ax + aw, ay + ah))
        oreg = out.crop((ax, ay, ax + aw, ay + ah))
        same = True
        checked = 0
        for yy in range(0, ah, 7):
            for xx in range(0, aw, 7):
                if fa.getpixel((ax + xx, ay + yy)) == 255:
                    checked += 1
                    if oreg.getpixel((xx, yy)) != region.getpixel((xx, yy)):
                        same = False
                        break
            if not same:
                break
        check(same and checked > 0,
              f"{device}: {checked} opaque-in-aperture px match frame (no overpaint)")

        if device == "iphone":
            for sx, sy in ((10, 10), (aw - 11, 10), (10, ah - 11), (aw - 11, ah - 11)):
                alpha = oa.getpixel((ax + sx, ay + sy))
                check(alpha == 0,
                      f"{device}: aperture corner ({sx},{sy}) stays transparent, got {alpha}")

        bad_path = VERIFY_DIR / f"{device}-bad.png"
        Image.new("RGB", (1024, 1024), (0, 0, 0)).save(bad_path)
        try:
            frame_shot(bad_path, VERIFY_DIR / f"{device}-bad-out.png", device)
            check(False, f"{device}: wrong aspect accepted")
        except SystemExit:
            check(True, f"{device}: wrong aspect rejected")

        t_path = VERIFY_DIR / f"{device}-trans.png"
        t = Image.new("RGBA", shot_size, (10, 10, 10, 255))
        t.putpixel((0, 0), (10, 10, 10, 0))
        t.save(t_path)
        try:
            frame_shot(t_path, VERIFY_DIR / f"{device}-trans-out.png", device)
            check(False, f"{device}: transparent shot accepted")
        except SystemExit:
            check(True, f"{device}: transparent shot rejected")

    if failures:
        die(f"{len(failures)} check(s) failed")
    print("all checks passed")


def main(argv):
    if len(argv) >= 2 and argv[1] == "verify":
        verify()
        return
    if len(argv) != 4 or argv[1] not in DEVICES:
        die("usage: frame_screenshot.py macbook|iphone raw.png out.png | verify")
    device, raw, out = argv[1], argv[2], argv[3]
    frame_shot(raw, out, device)
    print(f"wrote {out}")


if __name__ == "__main__":
    main(sys.argv)
