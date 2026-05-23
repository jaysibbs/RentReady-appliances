import fs from "node:fs/promises";

const outputDir = "brand/logo_options";

const options = [
  {
    id: "01-electric-trust",
    name: "Electric Trust",
    bg: "#FFFFFF",
    roof: "#061B3A",
    body: "#061B3A",
    accent: "#00C96B",
    text: "#061B3A",
    subtext: "#00A85A",
    note: "Closest to the supplied logo: sharp, digital, and recognisable.",
  },
  {
    id: "02-premium-amber",
    name: "Premium Amber",
    bg: "#141414",
    roof: "#F7F2E8",
    body: "#F7F2E8",
    accent: "#F5A623",
    text: "#F7F2E8",
    subtext: "#F5A623",
    note: "Warmer and more premium, useful if the site should feel established.",
  },
  {
    id: "03-forest-cream",
    name: "Forest Cream",
    bg: "#F6F1E7",
    roof: "#0F3D2E",
    body: "#0F3D2E",
    accent: "#7EA16B",
    text: "#0F3D2E",
    subtext: "#527A45",
    note: "Local, practical, and UK property-service friendly.",
  },
  {
    id: "04-cobalt-coral",
    name: "Cobalt Coral",
    bg: "#F8FAFF",
    roof: "#1746A2",
    body: "#1746A2",
    accent: "#FF6B4A",
    text: "#1746A2",
    subtext: "#FF6B4A",
    note: "Brighter and more modern, with a stronger startup feel.",
  },
];

function icon({ roof, body, accent }, x = 70, y = 70, scale = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M26 116 L150 28 L274 116" fill="none" stroke="${roof}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="72" y="106" width="150" height="190" rx="24" fill="none" stroke="${body}" stroke-width="22"/>
      <path d="M83 164 H211" stroke="${body}" stroke-width="18" stroke-linecap="round"/>
      <path d="M101 222 H101" stroke="${body}" stroke-width="34" stroke-linecap="round"/>
      <path d="M196 206 C224 206 224 176 254 176 H306" fill="none" stroke="${accent}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M306 157 V195" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      <path d="M335 157 V195" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      <path d="M254 151 H318 C333 151 344 162 344 176 C344 190 333 201 318 201 H254 Z" fill="none" stroke="${accent}" stroke-width="18" stroke-linejoin="round"/>
      <path d="M184 178 V248" stroke="${accent}" stroke-width="22" stroke-linecap="round"/>
    </g>`;
}

function horizontalLogo(option) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="560" viewBox="0 0 1800 560" role="img" aria-labelledby="title desc">
  <title id="title">RentalReady Appliances logo - ${option.name}</title>
  <desc id="desc">${option.note}</desc>
  <rect width="1800" height="560" rx="0" fill="${option.bg}"/>
  ${icon(option, 86, 112, 1.18)}
  <g transform="translate(575 190)">
    <text x="0" y="110" font-family="Arial, Helvetica, sans-serif" font-size="132" font-weight="900" fill="${option.text}" letter-spacing="0">RentalReady</text>
    <text x="6" y="206" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="800" fill="${option.subtext}" letter-spacing="0">Appliances</text>
    <path d="M8 238 H765" stroke="${option.accent}" stroke-width="12" stroke-linecap="round"/>
  </g>
</svg>`;
}

function squareLogo(option) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-labelledby="title desc">
  <title id="title">RentalReady Appliances profile logo - ${option.name}</title>
  <desc id="desc">${option.note}</desc>
  <rect width="1200" height="1200" fill="${option.bg}"/>
  ${icon(option, 355, 145, 1.55)}
  <g transform="translate(0 740)">
    <text x="600" y="120" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="128" font-weight="900" fill="${option.text}" letter-spacing="0">RentalReady</text>
    <text x="600" y="225" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="800" fill="${option.subtext}" letter-spacing="0">Appliances</text>
  </g>
</svg>`;
}

function previewPage() {
  const cards = options.map((option) => `
      <article>
        <div class="thumb"><img src="${option.id}-horizontal.svg" alt="${option.name} horizontal logo"></div>
        <div class="meta">
          <h2>${option.name}</h2>
          <p>${option.note}</p>
          <div class="swatches">
            <span style="background:${option.roof}"></span>
            <span style="background:${option.accent}"></span>
            <span style="background:${option.bg}"></span>
          </div>
          <a href="${option.id}-horizontal.svg">Horizontal SVG</a>
          <a href="${option.id}-square.svg">Square SVG</a>
        </div>
      </article>`).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RentalReady Appliances Logo Options</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #f4f6f8; color: #1f2933; font-family: Arial, Helvetica, sans-serif; }
      header { padding: 42px min(6vw, 72px) 22px; }
      h1 { margin: 0 0 10px; color: #061b3a; font-size: clamp(32px, 6vw, 64px); line-height: 1; }
      header p { margin: 0; color: #667085; font-size: 18px; max-width: 780px; }
      main { display: grid; gap: 24px; padding: 24px min(6vw, 72px) 72px; }
      article { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(240px, .65fr); gap: 0; background: #fff; border: 1px solid #d8dee4; border-radius: 8px; overflow: hidden; box-shadow: 0 16px 42px rgba(19, 59, 92, .12); }
      .thumb { display: grid; place-items: center; min-height: 260px; padding: 28px; background: #eef2f6; }
      img { display: block; width: 100%; height: auto; max-height: 260px; object-fit: contain; }
      .meta { padding: 28px; }
      h2 { margin: 0 0 10px; color: #061b3a; font-size: 26px; }
      p { margin: 0 0 18px; color: #667085; line-height: 1.5; }
      .swatches { display: flex; gap: 8px; margin: 0 0 22px; }
      .swatches span { width: 34px; height: 34px; border: 1px solid #ccd3db; border-radius: 999px; }
      a { display: inline-flex; margin: 0 8px 8px 0; padding: 10px 12px; border-radius: 8px; background: #061b3a; color: #fff; text-decoration: none; font-weight: 800; }
      @media (max-width: 820px) { article { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <h1>RentalReady Appliances Logo Options</h1>
      <p>Four merged logo directions based on the supplied house, appliance, plug, and two-tone wordmark style.</p>
    </header>
    <main>
${cards}
    </main>
  </body>
</html>`;
}

await fs.mkdir(outputDir, { recursive: true });

for (const option of options) {
  await fs.writeFile(`${outputDir}/${option.id}-horizontal.svg`, horizontalLogo(option), "utf8");
  await fs.writeFile(`${outputDir}/${option.id}-square.svg`, squareLogo(option), "utf8");
}

await fs.writeFile(`${outputDir}/preview.html`, previewPage(), "utf8");

