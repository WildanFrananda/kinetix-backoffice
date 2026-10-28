function contentSecurityPolicy(scriptHashes: readonly string[], styleHashes: readonly string[]): string {
  return [
    "default-src 'none'",
    ["script-src 'self'", ...scriptHashes].join(" "),
    ["style-src 'self'", ...styleHashes].join(" "),
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "require-trusted-types-for 'script'",
    "trusted-types 'none'"
  ].join("; ")
}

export { contentSecurityPolicy }
