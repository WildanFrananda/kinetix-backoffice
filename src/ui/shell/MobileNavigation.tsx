import { X } from "@phosphor-icons/react"
import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components"
import { useText } from "../../i18n/use_text"
import styles from "./MobileNavigation.module.css"
import { Sidebar } from "./Sidebar"

function MobileNavigation({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const text = useText()

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className={styles.overlay}>
      <Modal className={styles.drawer}>
        <Dialog aria-label={text["nav.label"]} className={styles.dialog}>
          <Button className={styles.close} aria-label={text["nav.close"]} onPress={() => onOpenChange(false)}>
            <X aria-hidden="true" size={20} />
          </Button>
          <Sidebar onNavigate={() => onOpenChange(false)} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { MobileNavigation }
