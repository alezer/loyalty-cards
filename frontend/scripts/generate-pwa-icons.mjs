import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

const regularSvg = readFileSync(join(publicDir, 'icon-source.svg'))
const maskableSvg = readFileSync(join(publicDir, 'icon-maskable-source.svg'))

await sharp(regularSvg).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'))
console.log('✓ icon-192.png')

await sharp(regularSvg).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'))
console.log('✓ icon-512.png')

await sharp(maskableSvg).resize(512, 512).png().toFile(join(publicDir, 'icon-maskable-512.png'))
console.log('✓ icon-maskable-512.png')

await sharp(regularSvg).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png')

console.log('\nAll PWA icons generated.')
