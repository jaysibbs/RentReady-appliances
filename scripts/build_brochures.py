from pathlib import Path
import textwrap

from PIL import Image, ImageOps
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs" / "brochures"
PHOTO_DIR = ROOT / "assets" / "product-photos"

W, H = A4

NAVY = colors.HexColor("#0C1E3A")
BLUE = colors.HexColor("#0A84E0")
ICE = colors.HexColor("#D6E6F6")
CREAM = colors.HexColor("#F7F3E8")
BROWN = colors.HexColor("#4B1608")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#667085")
WHITE = colors.white

ITEMS = [
    ("Fridge freezer", "From £249", "Best request: Bosch", "fridge-freezer.jpg"),
    ("Electric cooker", "From £179", "Best request: Bosch", "electric-cooker.jpg"),
    ("Washing machine", "From £179", "Best request: Miele or Bosch", "washing-machine.jpg"),
    ("Dryer", "From £144", "Best request: Miele", "dryer.jpg"),
    ("Dishwasher", "From £109", "Best request: Miele or Bosch", "dishwasher.jpg"),
    ("Microwave", "From £104", "Best request: Panasonic or LG", "microwave.jpg"),
]


def fit_text(c, text, x, y, width, size=10, leading=13, color=INK, font="Helvetica"):
    c.setFillColor(color)
    c.setFont(font, size)
    lines = []
    avg_chars = max(18, int(width / (size * 0.48)))
    for para in text.split("\n"):
        lines.extend(textwrap.wrap(para, width=avg_chars) or [""])
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_round_rect(c, x, y, w, h, r=12, fill=WHITE, stroke=None, sw=1):
    c.saveState()
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    else:
        c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, r, stroke=1 if stroke else 0, fill=1)
    c.restoreState()


def cropped_photo(c, filename, x, y, w, h):
    img = Image.open(PHOTO_DIR / filename).convert("RGB")
    target = (int(w * 2), int(h * 2))
    img = ImageOps.fit(img, target, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    c.drawImage(ImageReader(img), x, y, w, h, mask=None)


def logo_text(c, x, y, scale=1, dark=NAVY, accent=BLUE):
    c.setFillColor(dark)
    c.setFont("Helvetica-Bold", 22 * scale)
    c.drawString(x, y, "RentalReady")
    c.setFillColor(accent)
    c.drawString(x + 108 * scale, y, "Appliances")


def appliance_mark(c, x, y, scale=1, stroke=NAVY, accent=BLUE, roof=BROWN):
    c.saveState()
    c.translate(x, y)
    c.scale(scale, scale)
    c.setLineCap(1)
    c.setLineJoin(1)
    c.setStrokeColor(roof)
    c.setLineWidth(7)
    p = c.beginPath()
    p.moveTo(0, 48)
    p.lineTo(48, 84)
    p.lineTo(96, 48)
    c.drawPath(p)
    c.line(10, 44, 10, -40)
    c.line(86, 44, 86, -40)
    c.line(10, -40, 86, -40)
    c.setStrokeColor(stroke)
    c.setLineWidth(5)
    c.roundRect(36, -18, 32, 66, 4, stroke=1, fill=0)
    c.line(36, 20, 68, 20)
    c.roundRect(6, -36, 34, 52, 4, stroke=1, fill=0)
    c.line(6, 4, 40, 4)
    c.roundRect(45, -36, 36, 42, 4, stroke=1, fill=0)
    c.circle(63, -18, 13, stroke=1, fill=0)
    c.setStrokeColor(accent)
    c.setLineWidth(6)
    c.line(64, 16, 92, 16)
    c.line(91, 25, 91, 8)
    c.line(101, 25, 101, 8)
    c.setLineWidth(4)
    c.line(60, 32, 60, 43)
    c.line(60, -2, 60, 10)
    c.restoreState()


def footer(c, style="light"):
    if style == "dark":
        c.setFillColor(colors.Color(1, 1, 1, 0.72))
    else:
        c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(40, 22, "Representative product photos. Stock, brands, condition, finish, and prices vary by availability.")


def professional():
    c = canvas.Canvas(str(OUT / "rentready_professional_brochure.pdf"), pagesize=A4)
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    c.setFillColor(ICE)
    c.rect(0, H - 165, W, 165, stroke=0, fill=1)
    appliance_mark(c, 45, H - 78, 0.62)
    logo_text(c, 126, H - 72, 0.82)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(40, H - 128, "Rental-ready appliances, matched by budget and quality.")
    fit_text(c, "Clean, tested appliance supply for UK landlords, letting agents, property managers, and move-ins.", 42, H - 151, 405, 10, 13, MUTED)

    cropped_photo(c, "fridge-freezer.jpg", 390, H - 292, 165, 235)
    c.setStrokeColor(BLUE)
    c.setLineWidth(5)
    c.line(40, H - 188, 348, H - 188)

    y = H - 230
    for title, body in [
        ("What you can request", "Fridge freezers, cookers and ovens, washing machines, dryers, dishwashers, microwaves, and landlord turnover sets."),
        ("How quoting works", "Starting prices change by brand, size, finish, condition, and overall quality so customers can order accordingly."),
        ("Best brand guidance", "Bosch, Miele, Panasonic, and LG are used as quality targets where available."),
    ]:
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, title)
        y = fit_text(c, body, 40, y - 17, 285, 9.3, 12, MUTED) - 12

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, 312, "Starting prices")
    start_x, start_y = 40, 288
    col_w, row_h = 172, 66
    for i, (name, price, brand, photo) in enumerate(ITEMS):
        col = i % 3
        row = i // 3
        x = start_x + col * (col_w + 14)
        y = start_y - row * (row_h + 14)
        draw_round_rect(c, x, y - row_h, col_w, row_h, 8, WHITE, ICE)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 10, y - 20, name)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(x + 10, y - 40, price)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.8)
        c.drawString(x + 10, y - 55, brand)

    draw_round_rect(c, 40, 84, W - 80, 58, 12, NAVY)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(58, 117, "Ready for a quote?")
    c.setFont("Helvetica", 10)
    c.drawString(58, 99, "Send appliance type, property postcode, budget/quality preference, timing, and any delivery or removal request.")
    footer(c)
    c.save()


def comical():
    c = canvas.Canvas(str(OUT / "rentready_comical_brochure.pdf"), pagesize=A4)
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.circle(W - 60, H - 62, 110, stroke=0, fill=1)
    c.setFillColor(ICE)
    c.circle(W - 44, H - 34, 56, stroke=0, fill=1)

    appliance_mark(c, 46, H - 80, 0.68)
    logo_text(c, 132, H - 72, 0.82)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 34)
    c.drawString(42, H - 142, "Appliances without the drama.")
    fit_text(c, "Rental refresh coming in hot? We help you request clean, tested appliances by budget, quality, and brand preference.", 44, H - 168, 460, 11, 14, INK)

    cropped_photo(c, "washing-machine.jpg", 40, H - 424, 235, 215)
    cropped_photo(c, "microwave.jpg", 290, H - 374, 235, 165)
    draw_round_rect(c, 307, H - 228, 210, 48, 18, WHITE, BLUE, 2)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(324, H - 200, "No mystery appliance roulette.")

    jokes = [
        ("Landlord-friendly", "Quickly request the type of appliance your property actually needs."),
        ("Budget-aware", "Pick starting price, balanced quality, or better-brand request."),
        ("Brand-smart", "Ask for Bosch, Miele, Panasonic, LG, or closest available match."),
    ]
    y = 386
    for idx, (title, body) in enumerate(jokes, 1):
        draw_round_rect(c, 40, y - 58, 515, 52, 12, WHITE, None)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(56, y - 38, f"{idx}")
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(88, y - 29, title)
        fit_text(c, body, 88, y - 44, 405, 8.7, 10, MUTED)
        y -= 68

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, 162, "Starting from")
    x = 40
    for name, price in [("Fridge freezer", "£249"), ("Cooker", "£179"), ("Washer", "£179"), ("Dishwasher", "£109")]:
        draw_round_rect(c, x, 95, 119, 52, 10, WHITE, BLUE, 1.2)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(x + 10, 128, name)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 10, 108, f"From {price}")
        x += 131

    draw_round_rect(c, 40, 46, W - 80, 34, 12, NAVY)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(58, 59, "Email us the appliance, postcode, timing, and budget/quality preference.")
    footer(c)
    c.save()


def vibey():
    c = canvas.Canvas(str(OUT / "rentready_vibey_brochure.pdf"), pagesize=A4)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.rect(0, H - 210, W, 210, stroke=0, fill=1)
    c.setFillColor(colors.HexColor("#07152A"))
    c.circle(70, 730, 210, stroke=0, fill=1)
    c.setFillColor(ICE)
    c.circle(W - 70, 610, 190, stroke=0, fill=1)

    appliance_mark(c, 48, H - 80, 0.62, stroke=WHITE, accent=ICE, roof=CREAM)
    logo_text(c, 130, H - 72, 0.82, dark=WHITE, accent=ICE)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 38)
    c.drawString(40, H - 145, "Fresh appliances. Cool prices.")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(42, H - 178, "Ready for rental turns, move-ins, and quick refreshes.")

    cropped_photo(c, "fridge-freezer.jpg", 40, 396, 155, 218)
    cropped_photo(c, "electric-cooker.jpg", 209, 396, 155, 218)
    cropped_photo(c, "dryer.jpg", 378, 396, 155, 218)

    draw_round_rect(c, 40, 284, W - 80, 82, 18, colors.HexColor("#07152A"), ICE, 1.2)
    c.setFillColor(ICE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(58, 336, "Pick your lane")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(58, 307, "Best starting price  |  Balanced quality  |  Better brand")

    cards = [
        ("Bosch", "Fridges, cookers, washers"),
        ("Miele", "Laundry and dishwashers"),
        ("Panasonic / LG", "Microwaves and compact kitchen"),
    ]
    x = 40
    for title, body in cards:
        draw_round_rect(c, x, 168, 160, 88, 14, WHITE, None)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(x + 16, 222, title)
        fit_text(c, body, x + 16, 202, 124, 9, 11, MUTED)
        x += 178

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(40, 125, "Starting prices from £109 to £1,299")
    fit_text(c, "Final quotes vary by brand, condition, size, finish, and overall quality. Send the appliance type, postcode, timing, and budget preference.", 40, 104, 510, 10, 13, ICE)
    footer(c, "dark")
    c.save()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    professional()
    comical()
    vibey()
    (OUT / "README.md").write_text(
        "# RentalReady Appliances brochure pack\n\n"
        "- Professional: `rentready_professional_brochure.pdf`\n"
        "- Comical: `rentready_comical_brochure.pdf`\n"
        "- Vibey: `rentready_vibey_brochure.pdf`\n\n"
        "Each is a one-page PDF suitable for attaching to outreach emails.\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

