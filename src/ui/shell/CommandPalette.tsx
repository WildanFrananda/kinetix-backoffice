import { MagnifyingGlass } from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"
import {
  Autocomplete,
  Dialog,
  Header,
  Input,
  Menu,
  MenuItem,
  MenuSection,
  Modal,
  ModalOverlay,
  TextField,
  useFilter
} from "react-aria-components"
import { useSignOut } from "../../features/session/use_sign_out"
import { useText } from "../../i18n/use_text"
import styles from "./CommandPalette.module.css"
import { paletteGroups } from "./palette_groups"

function CommandPalette({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const text = useText()
  const navigate = useNavigate()
  const { signOut } = useSignOut()
  const { contains } = useFilter({ sensitivity: "base" })
  const groups = paletteGroups(text, {
    go: (to) => void navigate({ to }),
    signOut: () => void signOut()
  })

  const commands = new Map(groups.flatMap((group) => group.commands.map((command) => [command.id, command] as const)))

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className={styles.overlay}>
      <Modal className={styles.modal}>
        <Dialog aria-label={text["palette.title"]} className={styles.dialog}>
          <Autocomplete filter={contains}>
            <TextField aria-label={text["palette.title"]} autoFocus className={styles.search}>
              <MagnifyingGlass aria-hidden="true" className={styles.searchIcon} />
              <Input type="search" className={styles.input} placeholder={text["palette.placeholder"]} />
            </TextField>
            <Menu
              className={styles.menu}
              aria-label={text["palette.title"]}
              onAction={(key) => {
                const command = commands.get(String(key))
                if (command === undefined) {
                  return
                }

                onOpenChange(false)
                command.run()
              }}
              renderEmptyState={() => <p className={styles.empty}>{text["palette.empty"]}</p>}
            >
              {groups.map((group) => (
                <MenuSection key={group.id} id={group.id} className={styles.section}>
                  <Header className={styles.header}>{group.title}</Header>
                  {group.commands.map((command) => (
                    <MenuItem
                      key={command.id}
                      id={command.id}
                      textValue={`${command.label} ${command.keywords}`}
                      className={styles.item}
                    >
                      <command.icon aria-hidden="true" className={styles.icon} />
                      <span className={styles.label}>{command.label}</span>
                      {command.hint === null ? null : <kbd className={styles.hint}>{command.hint}</kbd>}
                    </MenuItem>
                  ))}
                </MenuSection>
              ))}
            </Menu>
          </Autocomplete>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { CommandPalette }
