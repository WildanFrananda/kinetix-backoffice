import type { Account } from "../../types/account.type"

const lineWidth = 44

function monogram(email: string): string {
  const local = email.split("@")[0] ?? ""
  const words = local.split(/[._+-]+/).filter((word) => word.length > 0)
  const letters = words.length > 1 ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}` : local.slice(0, 2)

  return letters.toUpperCase()
}

function machineLines(account: Account): [string, string] {
  const role = account.role.toUpperCase().replace(/[^A-Z0-9]/g, "<")
  const principal = account.principalId.replaceAll("-", "").toUpperCase()
  const first = `KX<BACKOFFICE<<${role}`.padEnd(lineWidth, "<").slice(0, lineWidth)
  const second = `${principal}<<${String(account.userId).padStart(8, "0")}`.padEnd(lineWidth, "<").slice(0, lineWidth)

  return [first, second]
}

function guillochePaths(width: number, height: number, strands: number): string[] {
  const paths: string[] = []

  for (let strand = 0; strand < strands; strand += 1) {
    const phase = (strand / strands) * Math.PI * 2
    const points: string[] = []

    for (let step = 0; step <= 96; step += 1) {
      const x = (step / 96) * width
      const wave = Math.sin((step / 96) * Math.PI * 4 + phase) * Math.cos((step / 96) * Math.PI + phase / 2)
      const y = height / 2 + wave * height * 0.34

      points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }

    paths.push(`M${points.join("L")}`)
  }

  return paths
}

export { guillochePaths, machineLines, monogram }
