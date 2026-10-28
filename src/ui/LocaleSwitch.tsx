import { ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { chooseLocale } from "../i18n/locale_store"
import { useLocale } from "../i18n/use_locale"
import { useText } from "../i18n/use_text"
import styles from "./Switches.module.css"

function LocaleSwitch() {
  const text = useText()
  const locale = useLocale()
  return (
    <ToggleButtonGroup
      aria-label={text["locale.label"]}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[locale]}
      onSelectionChange={(keys) => {
        const [selected] = [...keys]
        if (selected === "en" || selected === "id") {
          chooseLocale(selected)
        }
      }}
      className={styles.group}
    >
      <ToggleButton id="en" className={styles.option} aria-label="English">
        EN
      </ToggleButton>
      <ToggleButton id="id" className={styles.option} aria-label="Bahasa Indonesia">
        ID
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export { LocaleSwitch }
