/**
 * Modal Component
 * Reusable modal dialog component
 * Used for confirmations, forms, and alerts
 */

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        {title && <h2>{title}</h2>}
        <div className="modal-content">{children}</div>
        <button onClick={onClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
}
