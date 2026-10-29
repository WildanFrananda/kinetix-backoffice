import { ListBox, ListBoxItem, Text } from "react-aria-components"
import type { Category } from "../../types/category.type"
import styles from "./Categories.module.css"
import { useCategoriesText } from "./categories_text"

function CategoryList({
  categories,
  selected,
  onSelect
}: {
  categories: readonly Category[]
  selected: number | null
  onSelect: (id: number) => void
}) {
  const text = useCategoriesText()

  return (
    <ListBox
      aria-label={text["categories.list.title"]}
      className={styles.list}
      items={categories}
      selectionMode="single"
      selectionBehavior="replace"
      selectedKeys={selected === null ? [] : [selected]}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return
        }

        const [picked] = [...keys]
        if (typeof picked === "number") {
          onSelect(picked)
        }
      }}
    >
      {(category) => (
        <ListBoxItem id={category.id} textValue={category.name} className={styles.item}>
          <Text slot="label" className={styles.itemName}>
            {category.name}
          </Text>
          <span className={styles.itemNumber}>#{category.id}</span>
          <Text slot="description" className={styles.itemSlug}>
            {category.slug}
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { CategoryList }
