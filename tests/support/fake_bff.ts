import { vi } from "vitest"

type FakeRoute = (request: Request) => Response | Promise<Response>

type SeenRequest = { route: string; body: unknown }

type SeenAddress = { route: string; url: string }

function fakeBff(routes: Readonly<Record<string, FakeRoute>>) {
  const seen: SeenRequest[] = []
  const addresses: SeenAddress[] = []
  const unexpected: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init)
      const route = `${request.method} ${new URL(request.url).pathname}`
      const text = await request.clone().text()
      seen.push({ route, body: text.length === 0 ? null : JSON.parse(text) })
      addresses.push({ route, url: request.url })
      const answer = routes[route]
      if (answer === undefined) {
        unexpected.push(route)
        return Response.json({ error: "NOT_FOUND", message: "unexpected in test" }, { status: 404 })
      }

      return answer(request)
    })
  )

  return { seen, addresses, unexpected }
}

export { fakeBff }
