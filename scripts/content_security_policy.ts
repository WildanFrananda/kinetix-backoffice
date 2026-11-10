const storageOriginPlaceholder = `\${KINETIX_STORAGE_ORIGIN}`

function contentSecurityPolicy(
  scriptHashes: readonly string[],
  styleHashes: readonly string[],
  storageOrigin: string = storageOriginPlaceholder
): string {
  return [
    "default-src 'none'",
    ["script-src 'self'", ...scriptHashes].join(" "),
    ["style-src 'self'", ...styleHashes].join(" "),
    `img-src 'self' ${storageOrigin}`,
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "require-trusted-types-for 'script'",
    "trusted-types default"
  ].join("; ")
}

export { contentSecurityPolicy, storageOriginPlaceholder }
