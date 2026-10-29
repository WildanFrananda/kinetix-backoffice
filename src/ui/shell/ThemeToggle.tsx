import { useSyncExternalStore } from "react"
import { ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { useText } from "../../i18n/use_text"
import type { ThemeChoice } from "../../types/theme_choice.type"
import { Desktop } from "../icons/Desktop"
import { Moon } from "../icons/Moon"
import { Sun } from "../icons/Sun"
import { chooseTheme, storedTheme, subscribeTheme } from "../theme_store"
import styles from "./Toggles.module.css"

function serverTheme(): ThemeChoice {
  return "system"
}

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark"
}

function ThemeToggle() {
  const text = useText()
  const choice = useSyncExternalStore(subscribeTheme, storedTheme, serverTheme)

  return (
    <ToggleButtonGroup
      aria-label={text["theme.label"]}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[choice]}
      onSelectionChange={(keys) => {
        const [selected] = [...keys]
        if (isThemeChoice(selected)) {
          chooseTheme(selected)
        }
      }}
      className={styles.group}
    >
      <ToggleButton id="system" className={styles.option} aria-label={text["theme.system"]}>
        <Desktop aria-hidden="true" size={16} />
      </ToggleButton>
      <ToggleButton id="light" className={styles.option} aria-label={text["theme.light"]}>
        <Sun aria-hidden="true" size={16} />
      </ToggleButton>
      <ToggleButton id="dark" className={styles.option} aria-label={text["theme.dark"]}>
        <Moon aria-hidden="true" size={16} />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export { ThemeToggle }
