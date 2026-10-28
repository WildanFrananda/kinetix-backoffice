const docsDirectory = process.env.KINETIX_DOCS_DIR

if (docsDirectory === undefined || docsDirectory.length === 0) {
  throw new Error("KINETIX_DOCS_DIR must name a checkout of kinetix-docs")
}

type DocsCase = { status: number; when: string; json?: unknown; raw?: string }
type DocsField = { name: string; in: string; required: boolean }
type DocsEndpoint = {
  id: string
  method: string
  path: string
  request: { fields: DocsField[] }
  cases: DocsCase[]
}

async function docsEndpoint(id: string): Promise<DocsEndpoint> {
  const service = id.split(".")[0]
  const module = (await import(`${docsDirectory}/src/site/rest/endpoints/${service}.ts`)) as Record<string, unknown>
  for (const value of Object.values(module)) {
    if (Array.isArray(value)) {
      const found = (value as DocsEndpoint[]).find((endpoint) => endpoint?.id === id)
      if (found !== undefined) {
        return found
      }
    }
  }

  throw new Error(`kinetix-docs documents no endpoint ${id}`)
}

export type { DocsEndpoint }
export { docsEndpoint }
