import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { contentSecurityPolicy } from "./content_security_policy.ts"
import { inlineScriptHashes } from "./inline_script_hashes.ts"
import { reactAriaStyleHashes } from "./react_aria_style_hashes.ts"

const html = readFileSync("dist/client/index.html", "utf8")

if (/<style\b/.test(html) || /\sstyle\s*=/.test(html)) {
  throw new Error("dist/client/index.html carries inline styles, which style-src 'self' refuses")
}

const hashes = inlineScriptHashes(html)
const styleHashes = reactAriaStyleHashes(
  readFileSync("node_modules/react-aria/dist/private/overlays/usePreventScroll.mjs", "utf8")
)

const policy = contentSecurityPolicy(hashes, styleHashes)

mkdirSync("dist/nginx", { recursive: true })
writeFileSync("dist/nginx/csp.conf", `add_header Content-Security-Policy "${policy}" always;\n`)
console.log(
  `dist/nginx/csp.conf: ${hashes.length} inline script hash(es), ${styleHashes.length} React Aria style hash(es)`
)
