function shortPrincipal(principalId: string): string {
  return `${principalId.slice(0, 8)}…`
}

export { shortPrincipal }
