import type { Catalogue } from "../types/catalogue.type"
import type { SignInNotice } from "../types/sign_in_notice.type"

function noticeText(notice: SignInNotice, text: Catalogue): string {
  switch (notice) {
    case "enrolled":
      return text["notice.enrolled"]
    case "already-enrolled":
      return text["notice.alreadyEnrolled"]
    case "pending-ended":
      return text["notice.pendingEnded"]
    case "session-ended":
      return text["notice.sessionEnded"]
    case "signed-out":
      return text["notice.signedOut"]
    case "role-refused":
      return text["notice.roleRefused"]
  }
}

export { noticeText }
