import { readFile, writeFile } from "node:fs/promises"

const path = "dist/manifest.webmanifest"

console.log(`\nremoveing "theme_color" from ${path}\n`)

const manifest = JSON.parse(await readFile(path, "utf8"))
delete manifest.theme_color
await writeFile(path, JSON.stringify(manifest))
