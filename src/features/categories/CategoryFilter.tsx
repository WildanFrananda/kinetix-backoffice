import { Input, SearchField } from "react-aria-components"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import styles from "./Categories.module.css"
import { useCategoriesText } from "./categories_text"

function CategoryFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const text = useCategoriesText()

  return (
    <SearchField aria-label={text["categories.filter"]} value={value} onChange={onChange} className={styles.filter}>
      <MagnifyingGlass aria-hidden="true" className={styles.filterIcon} />
      <Input id="category-filter" className={styles.filterInput} placeholder={text["categories.filter"]} />
    </SearchField>
  )
}

export { CategoryFilter }
