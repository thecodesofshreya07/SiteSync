import PageHeader from '../components/common/PageHeader'
import AssistantChat from '../components/assistant/AssistantChat'

export default function Assistant() {
  return (
    <div>
      <PageHeader
        title="SiteSync Operations Assistant"
        subtitle="Ask questions about sites, budgets, inventory, procurement, equipment, and project progress."
      />
      <AssistantChat />
    </div>
  )
}
