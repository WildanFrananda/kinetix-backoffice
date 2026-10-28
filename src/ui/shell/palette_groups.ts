import { Desktop, Moon, SignOut, Sun, Translate } from "@phosphor-icons/react"
import { chooseLocale } from "../../i18n/locale_store"
import type { Catalogue } from "../../types/catalogue.type"
import type { PaletteGroup } from "../../types/palette_group.type"
import { chooseTheme } from "../theme_store"
import { navigation } from "./navigation"

function paletteGroups(
  text: Catalogue,
  actions: {
    go: (to: "/" | "/account") => void
    signOut: () => void
  }
): PaletteGroup[] {
  const goTo: PaletteGroup = {
    id: "go",
    title: text["palette.goTo"],
    commands: navigation.map((item) => ({
      id: `go:${item.to}`,
      label: text[item.label],
      keywords: item.to,
      icon: item.icon,
      hint: null,
      run: () => actions.go(item.to)
    }))
  }

  const preferences: PaletteGroup = {
    id: "preferences",
    title: text["palette.preferences"],
    commands: [
      {
        id: "theme:light",
        label: text["palette.themeLight"],
        keywords: "theme light",
        icon: Sun,
        hint: null,
        run: () => chooseTheme("light")
      },
      {
        id: "theme:dark",
        label: text["palette.themeDark"],
        keywords: "theme dark",
        icon: Moon,
        hint: null,
        run: () => chooseTheme("dark")
      },
      {
        id: "theme:system",
        label: text["palette.themeSystem"],
        keywords: "theme system",
        icon: Desktop,
        hint: null,
        run: () => chooseTheme("system")
      },
      {
        id: "locale:en",
        label: "English",
        keywords: "language locale en",
        icon: Translate,
        hint: "EN",
        run: () => chooseLocale("en")
      },
      {
        id: "locale:id",
        label: "Bahasa Indonesia",
        keywords: "language locale id bahasa",
        icon: Translate,
        hint: "ID",
        run: () => chooseLocale("id")
      }
    ]
  }

  const session: PaletteGroup = {
    id: "session",
    title: text["palette.session"],
    commands: [
      {
        id: "session:sign-out",
        label: text["nav.signOut"],
        keywords: "sign out log out keluar",
        icon: SignOut,
        hint: null,
        run: actions.signOut
      }
    ]
  }

  return [goTo, preferences, session]
}

export { paletteGroups }
