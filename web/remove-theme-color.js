import { readFile, writeFile } from "node:fs/promises"

const path = "dist/manifest.webmanifest"

const keys = ["theme_color", "background_color"]

console.log(`\nremoveing ${keys.map((key) => `"${key}"`).join(",")} from ${path}\n`)

const manifest = JSON.parse(await readFile(path, "utf8"))
for (const key of keys) {
  delete manifest[key]
}
await writeFile(path, JSON.stringify(manifest))
