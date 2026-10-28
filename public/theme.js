function storedTheme() {
  try {
    return window.localStorage.getItem("kx-theme")
  } catch {
    return null
  }
}

function chosenTheme() {
  const stored = storedTheme()
  if (stored === "light" || stored === "dark") {
    return stored
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

document.documentElement.dataset.theme = chosenTheme()
