export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete' }) {
  return (
    <div className="confirm-overlay active">
      <div className="confirm-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-btns">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-danger"  onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
