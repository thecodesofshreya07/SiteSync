import Modal from '../common/Modal'
import UserForm from './UserForm'

export default function AddUserModal({ open, onClose, onSubmit, existingUsers }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add User"
      subtitle="Create a new SiteSync user account"
    >
      <UserForm onSubmit={onSubmit} onClose={onClose} existingUsers={existingUsers} />
    </Modal>
  )
}
