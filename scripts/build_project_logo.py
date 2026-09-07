from pathlib import Path

from PIL import Image, ImageDraw


SCALE = 4
WIDTH = HEIGHT = 480 * SCALE
OUTER_BACKGROUND = "#0A1024"
INNER_BACKGROUND = "#111832"
ACCENT = "#6FDDCD"
SECONDARY = "#8197D6"
MUTED = "#A9B7DC"
BORDER = "#41508B"


def rounded_rectangle(draw, bounds, radius, **kwargs):
    draw.rounded_rectangle(bounds, radius=radius, **kwargs)


def build(output_path):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    rounded_rectangle(
        draw,
        (160, 160, WIDTH - 160, HEIGHT - 160),
        radius=320,
        fill=OUTER_BACKGROUND,
        outline=BORDER,
        width=12,
    )

    shield = [
        (960, 330),
        (1530, 620),
        (1530, 1200),
        (960, 1560),
        (390, 1200),
        (390, 620),
    ]
    draw.polygon(shield, fill=INNER_BACKGROUND, outline=ACCENT)
    draw.line(shield + [shield[0]], fill=ACCENT, width=24, joint="curve")

    circuit_points = [
        (680, 630),
        (1240, 630),
        (680, 1320),
        (1240, 1320),
    ]
    for x, y in circuit_points:
        draw.line((x, y, 960, y + (190 if y < 960 else -190)), fill=SECONDARY, width=12)
        draw.ellipse((x - 26, y - 26, x + 26, y + 26), fill=INNER_BACKGROUND, outline=SECONDARY, width=12)

    link_style = {
        "fill": INNER_BACKGROUND,
        "outline": MUTED,
        "width": 34,
    }
    rounded_rectangle(draw, (500, 780, 1020, 1000), radius=110, **link_style)
    rounded_rectangle(draw, (900, 780, 1420, 1000), radius=110, **link_style)
    rounded_rectangle(draw, (780, 780, 1140, 1000), radius=110, fill=ACCENT)

    draw.line((960, 1000, 960, 1120), fill=MUTED, width=26)
    draw.ellipse((860, 1120, 1060, 1320), fill=INNER_BACKGROUND, outline=ACCENT, width=26)
    draw.ellipse((925, 1185, 995, 1255), fill=ACCENT)

    logo = image.resize((WIDTH // SCALE, HEIGHT // SCALE), Image.Resampling.LANCZOS)
    logo.save(output_path, format="PNG", optimize=True)


if __name__ == "__main__":
    build("output/image/attest-ai-logo-480.png")
