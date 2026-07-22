const sharp = require('sharp')
const path = require('path')

async function generate(size, filename, padding = 0) {
  const inner = size - padding * 2
  const cardW = Math.round(inner * 0.62)
  const cardH = Math.round(inner * 0.46)
  const cardX = Math.round((size - cardW) / 2)
  const cardY = Math.round((size - cardH) / 2)
  const r = Math.round(cardW * 0.12)
  const fontSize = Math.round(cardH * 0.44)

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#1a1f2e"/>
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${r}" ry="${r}" fill="#e8b13a"/>
    <text x="${size / 2}" y="${cardY + Math.round(cardH / 2) + Math.round(fontSize * 0.35)}"
      font-family="Arial Black, Arial, sans-serif"
      font-weight="900"
      font-size="${fontSize}"
      fill="#1a1f2e"
      text-anchor="middle">CL</text>
  </svg>`

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', filename))
  console.log(`Generated ${filename} (${size}x${size}, padding=${padding})`)
}

async function main() {
  await generate(192, 'icon-192.png')
  await generate(512, 'icon-512.png')
  await generate(512, 'icon-maskable-512.png', 80)
  await generate(180, 'apple-touch-icon.png')
  console.log('All icons generated!')
}

main().catch(err => { console.error(err); process.exit(1) })
