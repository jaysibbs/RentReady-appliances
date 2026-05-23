import AppKit

struct Redaction {
    let x: CGFloat
    let y: CGFloat
    let w: CGFloat
    let h: CGFloat
    let color: NSColor
    let alpha: CGFloat
}

struct AssetConfig {
    let file: String
    let output: String
    let crop: CGRect
    let foregroundWidth: CGFloat
    let redactions: [Redaction]
    let offsetY: CGFloat
}

let sourceDir = "/tmp/codex-remote-attachments/019e2ad2-830c-7050-996f-bf65e71caeac/E58316A0-7415-49E0-AF90-E9C296822713"
let outputDir = FileManager.default.currentDirectoryPath + "/assets/product-photos"
let canvasSize = NSSize(width: 1200, height: 900)

func color(_ hex: String, alpha: CGFloat = 1) -> NSColor {
    var value: UInt64 = 0
    Scanner(string: hex.replacingOccurrences(of: "#", with: "")).scanHexInt64(&value)
    let r = CGFloat((value >> 16) & 0xff) / 255
    let g = CGFloat((value >> 8) & 0xff) / 255
    let b = CGFloat(value & 0xff) / 255
    return NSColor(calibratedRed: r, green: g, blue: b, alpha: alpha)
}

func cropImage(_ image: NSImage, to rect: CGRect) -> NSImage {
    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil),
          let cropped = cgImage.cropping(to: rect) else {
        fatalError("Could not crop image")
    }
    return NSImage(cgImage: cropped, size: NSSize(width: rect.width, height: rect.height))
}

func redact(_ image: NSImage, redactions: [Redaction]) -> NSImage {
    let result = NSImage(size: image.size)
    result.lockFocus()
    image.draw(in: NSRect(origin: .zero, size: image.size), from: .zero, operation: .copy, fraction: 1)
    for redaction in redactions {
        redaction.color.withAlphaComponent(redaction.alpha).setFill()
        let yFromBottom = image.size.height - redaction.y - redaction.h
        let rect = NSRect(x: redaction.x, y: yFromBottom, width: redaction.w, height: redaction.h)
        let path = NSBezierPath(roundedRect: rect, xRadius: 5, yRadius: 5)
        path.fill()
    }
    result.unlockFocus()
    return result
}

func drawAsset(config: AssetConfig) {
    let sourcePath = sourceDir + "/" + config.file
    let outputPath = outputDir + "/" + config.output
    guard let image = NSImage(contentsOfFile: sourcePath) else {
        fatalError("Could not read \(sourcePath)")
    }

    let cleaned = redact(cropImage(image, to: config.crop), redactions: config.redactions)
    let scale = min(config.foregroundWidth / cleaned.size.width, 820 / cleaned.size.height)
    let drawSize = NSSize(width: cleaned.size.width * scale, height: cleaned.size.height * scale)
    let drawOrigin = NSPoint(
        x: (canvasSize.width - drawSize.width) / 2,
        y: (canvasSize.height - drawSize.height) / 2 - config.offsetY
    )

    let canvas = NSImage(size: canvasSize)
    canvas.lockFocus()

    color("#0d141d").setFill()
    NSRect(origin: .zero, size: canvasSize).fill()

    let gradient = NSGradient(colors: [
        color("#eef1f3", alpha: 0.22),
        color("#1b2531", alpha: 0.36),
        color("#0d141d", alpha: 0.96)
    ])
    gradient?.draw(in: NSRect(origin: .zero, size: canvasSize), angle: -36)

    NSGraphicsContext.current?.shouldAntialias = true
    let frame = NSBezierPath(roundedRect: NSRect(x: 28, y: 28, width: canvasSize.width - 56, height: canvasSize.height - 56), xRadius: 14, yRadius: 14)
    color("#c98a54", alpha: 0.22).setStroke()
    frame.lineWidth = 2
    frame.stroke()

    let shadow = NSShadow()
    shadow.shadowColor = color("#071019", alpha: 0.38)
    shadow.shadowOffset = NSSize(width: 0, height: -24)
    shadow.shadowBlurRadius = 28
    shadow.set()
    color("#0d141d", alpha: 0.28).setFill()
    NSBezierPath(roundedRect: NSRect(origin: drawOrigin, size: drawSize), xRadius: 10, yRadius: 10).fill()
    NSShadow().set()

    cleaned.draw(in: NSRect(origin: drawOrigin, size: drawSize), from: .zero, operation: .sourceOver, fraction: 1)
    canvas.unlockFocus()

    guard let tiff = canvas.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else {
        fatalError("Could not encode \(outputPath)")
    }

    try! jpeg.write(to: URL(fileURLWithPath: outputPath))
    print(outputPath)
}

try! FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

let configs = [
    AssetConfig(
        file: "1-Photo-1.jpg",
        output: "inspection-washer-front.jpg",
        crop: CGRect(x: 24, y: 210, width: 543, height: 695),
        foregroundWidth: 760,
        redactions: [
            Redaction(x: 78, y: 46, w: 136, h: 34, color: color("#f4f2ec"), alpha: 1),
            Redaction(x: 248, y: 22, w: 246, h: 70, color: color("#e9e8e3"), alpha: 1),
            Redaction(x: 244, y: 94, w: 44, h: 24, color: color("#efeee9"), alpha: 0.96)
        ],
        offsetY: 0
    ),
    AssetConfig(
        file: "2-Photo-2.jpg",
        output: "inspection-washer-open.jpg",
        crop: CGRect(x: 24, y: 192, width: 543, height: 712),
        foregroundWidth: 760,
        redactions: [
            Redaction(x: 170, y: 82, w: 104, h: 34, color: color("#f3f1eb"), alpha: 1),
            Redaction(x: 248, y: 35, w: 250, h: 72, color: color("#ecebe6"), alpha: 1),
            Redaction(x: 240, y: 150, w: 72, h: 32, color: color("#ecebe6"), alpha: 0.95)
        ],
        offsetY: 0
    ),
    AssetConfig(
        file: "8-Photo-8.jpg",
        output: "inspection-washer-back.jpg",
        crop: CGRect(x: 24, y: 205, width: 543, height: 650),
        foregroundWidth: 760,
        redactions: [
            Redaction(x: 218, y: 256, w: 120, h: 62, color: color("#f1f0eb"), alpha: 1),
            Redaction(x: 292, y: 132, w: 36, h: 38, color: color("#eef0ed"), alpha: 0.96)
        ],
        offsetY: 0
    ),
    AssetConfig(
        file: "7-Photo-7.jpg",
        output: "inspection-washer-drum.jpg",
        crop: CGRect(x: 24, y: 338, width: 543, height: 405),
        foregroundWidth: 880,
        redactions: [
            Redaction(x: 96, y: 330, w: 100, h: 56, color: color("#e8e4dc"), alpha: 0.92)
        ],
        offsetY: 0
    ),
    AssetConfig(
        file: "10-Photo-10.jpg",
        output: "inspection-microwave-boxed.jpg",
        crop: CGRect(x: 24, y: 215, width: 543, height: 403),
        foregroundWidth: 880,
        redactions: [
            Redaction(x: 366, y: 108, w: 108, h: 40, color: color("#dfe1df"), alpha: 1),
            Redaction(x: 236, y: 214, w: 46, h: 22, color: color("#1e2529"), alpha: 0.94)
        ],
        offsetY: 0
    ),
    AssetConfig(
        file: "9-Photo-9.jpg",
        output: "inspection-microwave-carton.jpg",
        crop: CGRect(x: 24, y: 222, width: 543, height: 383),
        foregroundWidth: 880,
        redactions: [
            Redaction(x: 244, y: 0, w: 236, h: 38, color: color("#20282e"), alpha: 1),
            Redaction(x: 26, y: 68, w: 188, h: 46, color: color("#31434a"), alpha: 1),
            Redaction(x: 366, y: 74, w: 108, h: 36, color: color("#2b3942"), alpha: 1),
            Redaction(x: 32, y: 206, w: 222, h: 54, color: color("#24323b"), alpha: 1),
            Redaction(x: 370, y: 232, w: 106, h: 55, color: color("#2b3942"), alpha: 0.96)
        ],
        offsetY: 0
    )
]

for config in configs {
    drawAsset(config: config)
}
