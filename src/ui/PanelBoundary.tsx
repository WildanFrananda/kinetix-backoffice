import { Component, type ReactNode } from "react"
import { PanelProblem } from "./PanelProblem"

class PanelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return <PanelProblem failure={null} onRetry={() => this.setState({ failed: false })} />
    }

    return this.props.children
  }
}

export { PanelBoundary }
