import AppKit

struct Redaction {
    let rect: CGRect
    let color: NSColor
}

struct AssetConfig {
    let source: String
    let output: String
    let crop: CGRect?
    let foregroundWidth: CGFloat
    let redactions: [Redaction]
}

let base = FileManager.default.currentDirectoryPath + "/assets/product-photos"
let canvasSize = NSSize(width: 1200, height: 900)

func color(_ hex: String, alpha: CGFloat = 1) -> NSColor {
    var value: UInt64 = 0
    Scanner(string: hex.replacingOccurrences(of: "#", with: "")).scanHexInt64(&value)
    let r = CGFloat((value >> 16) & 0xff) / 255
    let g = CGFloat((value >> 8) & 0xff) / 255
    let b = CGFloat(value & 0xff) / 255
    return NSColor(calibratedRed: r, green: g, blue: b, alpha: alpha)
}

func cropImage(_ image: NSImage, to rect: CGRect?) -> NSImage {
    guard let rect else { return image }
    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil),
          let cropped = cgImage.cropping(to: rect) else {
        fatalError("Could not crop image")
    }
    return NSImage(cgImage: cropped, size: NSSize(width: rect.width, height: rect.height))
}

func redacted(_ image: NSImage, redactions: [Redaction]) -> NSImage {
    guard !redactions.isEmpty else { return image }
    let result = NSImage(size: image.size)
    result.lockFocus()
    image.draw(in: NSRect(origin: .zero, size: image.size), from: .zero, operation: .copy, fraction: 1)
    for item in redactions {
        item.color.setFill()
        let yFromBottom = image.size.height - item.rect.origin.y - item.rect.height
        NSBezierPath(roundedRect: NSRect(x: item.rect.origin.x, y: yFromBottom, width: item.rect.width, height: item.rect.height), xRadius: 8, yRadius: 8).fill()
    }
    result.unlockFocus()
    return result
}

func makeAsset(_ config: AssetConfig) {
    let inputPath = base + "/" + config.source
    let outputPath = base + "/" + config.output
    guard let original = NSImage(contentsOfFile: inputPath) else {
        fatalError("Missing input \(inputPath)")
    }

    let prepared = redacted(cropImage(original, to: config.crop), redactions: config.redactions)
    let scale = min(config.foregroundWidth / prepared.size.width, 720 / prepared.size.height)
    let drawSize = NSSize(width: prepared.size.width * scale, height: prepared.size.height * scale)
    let drawOrigin = NSPoint(x: (canvasSize.width - drawSize.width) / 2, y: (canvasSize.height - drawSize.height) / 2)

    let canvas = NSImage(size: canvasSize)
    canvas.lockFocus()
    color("#0d141d").setFill()
    NSRect(origin: .zero, size: canvasSize).fill()

    let gradient = NSGradient(colors: [
        color("#eef1f3", alpha: 0.16),
        color("#22303d", alpha: 0.34),
        color("#0d141d", alpha: 0.98)
    ])
    gradient?.draw(in: NSRect(origin: .zero, size: canvasSize), angle: -32)

    color("#c98a54", alpha: 0.22).setStroke()
    let frame = NSBezierPath(roundedRect: NSRect(x: 28, y: 28, width: canvasSize.width - 56, height: canvasSize.height - 56), xRadius: 14, yRadius: 14)
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

    prepared.draw(in: NSRect(origin: drawOrigin, size: drawSize), from: .zero, operation: .sourceOver, fraction: 1)
    canvas.unlockFocus()

    guard let tiff = canvas.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else {
        fatalError("Could not write \(outputPath)")
    }

    try! jpeg.write(to: URL(fileURLWithPath: outputPath))
    print(outputPath)
}

let blank = [Redaction]()
let configs = [
    AssetConfig(source: "modern-fridge-freezer.jpg", output: "cat-fridge-hero.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "stock-american-fridge-closed.jpg", output: "cat-fridge-american.jpg", crop: nil, foregroundWidth: 620, redactions: blank),
    AssetConfig(source: "stock-beko-fridge-closed.jpg", output: "cat-fridge-single-door.jpg", crop: nil, foregroundWidth: 520, redactions: [Redaction(rect: CGRect(x: 55, y: 54, width: 95, height: 35), color: color("#dfe2df"))]),
    AssetConfig(source: "stock-tall-fridge-open.jpg", output: "cat-fridge-tall-open.jpg", crop: nil, foregroundWidth: 560, redactions: blank),
    AssetConfig(source: "stock-beko-fridge-open.jpg", output: "cat-fridge-undercounter.jpg", crop: nil, foregroundWidth: 560, redactions: blank),
    AssetConfig(source: "stock-american-fridge-open.jpg", output: "cat-fridge-freezer-storage.jpg", crop: nil, foregroundWidth: 680, redactions: blank),
    AssetConfig(source: "modern-fridge-freezer.jpg", output: "cat-fridge-smart.jpg", crop: CGRect(x: 560, y: 60, width: 760, height: 990), foregroundWidth: 660, redactions: blank),

    AssetConfig(source: "modern-electric-cooker.jpg", output: "cat-cooker-hero.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "modern-electric-cooker.jpg", output: "cat-cooker-built-in-oven.jpg", crop: CGRect(x: 680, y: 420, width: 620, height: 720), foregroundWidth: 620, redactions: blank),
    AssetConfig(source: "modern-electric-cooker.jpg", output: "cat-cooker-induction-hob.jpg", crop: CGRect(x: 690, y: 500, width: 690, height: 360), foregroundWidth: 920, redactions: blank),
    AssetConfig(source: "modern-electric-cooker.jpg", output: "cat-cooker-induction-oven.jpg", crop: CGRect(x: 610, y: 300, width: 820, height: 820), foregroundWidth: 740, redactions: blank),
    AssetConfig(source: "modern-electric-cooker.jpg", output: "cat-cooker-hood.jpg", crop: CGRect(x: 690, y: 0, width: 720, height: 430), foregroundWidth: 940, redactions: blank),
    AssetConfig(source: "modern-electric-cooker.jpg", output: "cat-cooker-range.jpg", crop: CGRect(x: 520, y: 330, width: 920, height: 830), foregroundWidth: 840, redactions: blank),
    AssetConfig(source: "electric-cooker.jpg", output: "cat-cooker-gas-special.jpg", crop: nil, foregroundWidth: 530, redactions: blank),

    AssetConfig(source: "inspection-washer-front.jpg", output: "cat-washer-hero.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "inspection-washer-front.jpg", output: "cat-washer-standard.jpg", crop: CGRect(x: 0, y: 180, width: 560, height: 690), foregroundWidth: 720, redactions: blank),
    AssetConfig(source: "inspection-washer-open.jpg", output: "cat-washer-premium-open.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "inspection-washer-drum.jpg", output: "cat-washer-large-drum.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "inspection-washer-back.jpg", output: "cat-washer-rear.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "modern-washing-machine.jpg", output: "cat-washer-pair.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "landlord-appliance-group.jpg", output: "cat-washer-dryer-combo.jpg", crop: CGRect(x: 0, y: 60, width: 720, height: 640), foregroundWidth: 860, redactions: blank),

    AssetConfig(source: "modern-dryer.jpg", output: "cat-dryer-hero.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "modern-dryer.jpg", output: "cat-dryer-heat-pump.jpg", crop: CGRect(x: 420, y: 120, width: 850, height: 980), foregroundWidth: 730, redactions: blank),
    AssetConfig(source: "dryer.jpg", output: "cat-dryer-condenser.jpg", crop: CGRect(x: 60, y: 140, width: 1010, height: 1160), foregroundWidth: 700, redactions: [Redaction(rect: CGRect(x: 410, y: 480, width: 170, height: 85), color: color("#d9dbd8"))]),
    AssetConfig(source: "modern-dryer.jpg", output: "cat-dryer-vented.jpg", crop: CGRect(x: 760, y: 150, width: 650, height: 860), foregroundWidth: 690, redactions: blank),
    AssetConfig(source: "modern-washing-machine.jpg", output: "cat-dryer-washer-alternative.jpg", crop: CGRect(x: 530, y: 260, width: 780, height: 790), foregroundWidth: 720, redactions: blank),
    AssetConfig(source: "modern-dryer.jpg", output: "cat-dryer-large-drum.jpg", crop: CGRect(x: 420, y: 380, width: 760, height: 620), foregroundWidth: 820, redactions: blank),
    AssetConfig(source: "landlord-appliance-group.jpg", output: "cat-dryer-quality-led.jpg", crop: CGRect(x: 160, y: 120, width: 760, height: 540), foregroundWidth: 940, redactions: blank),

    AssetConfig(source: "modern-dishwasher.jpg", output: "cat-dishwasher-hero.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "modern-dishwasher.jpg", output: "cat-dishwasher-premium.jpg", crop: CGRect(x: 490, y: 250, width: 850, height: 850), foregroundWidth: 760, redactions: blank),
    AssetConfig(source: "dishwasher.jpg", output: "cat-dishwasher-freestanding.jpg", crop: CGRect(x: 120, y: 0, width: 1120, height: 1350), foregroundWidth: 760, redactions: blank),
    AssetConfig(source: "modern-dishwasher.jpg", output: "cat-dishwasher-integrated.jpg", crop: CGRect(x: 620, y: 280, width: 640, height: 780), foregroundWidth: 650, redactions: blank),
    AssetConfig(source: "modern-appliance-package.jpg", output: "cat-dishwasher-slimline.jpg", crop: CGRect(x: 760, y: 520, width: 460, height: 560), foregroundWidth: 580, redactions: blank),
    AssetConfig(source: "dishwasher.jpg", output: "cat-dishwasher-family.jpg", crop: CGRect(x: 120, y: 280, width: 1120, height: 1120), foregroundWidth: 800, redactions: blank),
    AssetConfig(source: "modern-appliance-package.jpg", output: "cat-dishwasher-refurbished.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),

    AssetConfig(source: "modern-appliance-package.jpg", output: "cat-microwave-hero.jpg", crop: CGRect(x: 470, y: 650, width: 420, height: 360), foregroundWidth: 680, redactions: blank),
    AssetConfig(source: "inspection-microwave-boxed.jpg", output: "cat-microwave-countertop.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "inspection-microwave-carton.jpg", output: "cat-microwave-premium.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "modern-microwave.jpg", output: "cat-microwave-combination.jpg", crop: nil, foregroundWidth: 1040, redactions: blank),
    AssetConfig(source: "modern-appliance-package.jpg", output: "cat-microwave-overhob.jpg", crop: CGRect(x: 840, y: 330, width: 420, height: 520), foregroundWidth: 560, redactions: blank),
    AssetConfig(source: "microwave.jpg", output: "cat-microwave-compact.jpg", crop: nil, foregroundWidth: 980, redactions: [Redaction(rect: CGRect(x: 250, y: 980, width: 360, height: 130), color: color("#ece7d6"))]),
    AssetConfig(source: "inspection-microwave-carton.jpg", output: "cat-microwave-refurbished.jpg", crop: CGRect(x: 0, y: 80, width: 560, height: 610), foregroundWidth: 760, redactions: blank)
]

for config in configs {
    makeAsset(config)
}
