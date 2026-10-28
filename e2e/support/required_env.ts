function requiredEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required; bin/e2e sets it`)
  }

  return value
}

export { requiredEnv }
