import AppKit

struct AssetConfig {
    let source: String
    let output: String
    let crop: CGRect
    let foregroundWidth: CGFloat
    let redactions: [CGRect]
}

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
        fatalError("Could not crop source image")
    }
    return NSImage(cgImage: cropped, size: NSSize(width: rect.width, height: rect.height))
}

func redact(_ image: NSImage, redactions: [CGRect]) -> NSImage {
    let result = NSImage(size: image.size)
    result.lockFocus()
    image.draw(in: NSRect(origin: .zero, size: image.size), from: .zero, operation: .copy, fraction: 1)
    color("#d8c3ae", alpha: 1).setFill()
    for redaction in redactions {
        let yFromBottom = image.size.height - redaction.origin.y - redaction.height
        NSBezierPath(roundedRect: NSRect(x: redaction.origin.x, y: yFromBottom, width: redaction.width, height: redaction.height), xRadius: 18, yRadius: 18).fill()
    }
    result.unlockFocus()
    return result
}

func makeAsset(_ config: AssetConfig) {
    guard let image = NSImage(contentsOfFile: config.source) else {
        fatalError("Could not read \(config.source)")
    }

    let cropped = redact(cropImage(image, to: config.crop), redactions: config.redactions)
    let scale = min(config.foregroundWidth / cropped.size.width, 720 / cropped.size.height)
    let drawSize = NSSize(width: cropped.size.width * scale, height: cropped.size.height * scale)
    let drawOrigin = NSPoint(x: (canvasSize.width - drawSize.width) / 2, y: (canvasSize.height - drawSize.height) / 2)

    let canvas = NSImage(size: canvasSize)
    canvas.lockFocus()
    color("#0d141d").setFill()
    NSRect(origin: .zero, size: canvasSize).fill()

    let gradient = NSGradient(colors: [
        color("#eef1f3", alpha: 0.18),
        color("#22303d", alpha: 0.34),
        color("#0d141d", alpha: 0.96)
    ])
    gradient?.draw(in: NSRect(origin: .zero, size: canvasSize), angle: -32)

    let frame = NSBezierPath(roundedRect: NSRect(x: 28, y: 28, width: canvasSize.width - 56, height: canvasSize.height - 56), xRadius: 14, yRadius: 14)
    color("#c98a54", alpha: 0.22).setStroke()
    frame.lineWidth = 2
    frame.stroke()

    let shadow = NSShadow()
    shadow.shadowColor = color("#071019", alpha: 0.34)
    shadow.shadowOffset = NSSize(width: 0, height: -22)
    shadow.shadowBlurRadius = 26
    shadow.set()
    color("#0d141d", alpha: 0.24).setFill()
    NSBezierPath(roundedRect: NSRect(origin: drawOrigin, size: drawSize), xRadius: 10, yRadius: 10).fill()
    NSShadow().set()

    cropped.draw(in: NSRect(origin: drawOrigin, size: drawSize), from: .zero, operation: .sourceOver, fraction: 1)
    canvas.unlockFocus()

    guard let tiff = canvas.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else {
        fatalError("Could not encode \(config.output)")
    }

    let outputPath = outputDir + "/" + config.output
    try! jpeg.write(to: URL(fileURLWithPath: outputPath))
    print(outputPath)
}

try! FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

let assets = [
    AssetConfig(
        source: "/Users/jabulani/Desktop/download.jpg",
        output: "landlord-kitchen-setup.jpg",
        crop: CGRect(x: 0, y: 148, width: 591, height: 352),
        foregroundWidth: 1040,
        redactions: []
    ),
    AssetConfig(
        source: "/Users/jabulani/Desktop/download-1.jpg",
        output: "landlord-appliance-group.jpg",
        crop: CGRect(x: 0, y: 148, width: 591, height: 360),
        foregroundWidth: 1040,
        redactions: [CGRect(x: 24, y: 306, width: 76, height: 58)]
    )
]

for asset in assets {
    makeAsset(asset)
}
