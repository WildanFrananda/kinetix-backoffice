import { useSyncExternalStore } from "react"
import { ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { useText } from "../i18n/use_text"
import type { ThemeChoice } from "../types/theme_choice.type"
import styles from "./Switches.module.css"
import { chooseTheme, storedTheme, subscribeTheme } from "./theme_store"

function serverTheme(): ThemeChoice {
  return "system"
}

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark"
}

function ThemeSwitch() {
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
      <ToggleButton id="system" className={styles.option}>
        {text["theme.system"]}
      </ToggleButton>
      <ToggleButton id="light" className={styles.option}>
        {text["theme.light"]}
      </ToggleButton>
      <ToggleButton id="dark" className={styles.option}>
        {text["theme.dark"]}
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export { ThemeSwitch }
