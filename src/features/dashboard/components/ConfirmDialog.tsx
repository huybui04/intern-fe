import React from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "primary";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  const buttonClass =
    variant === "danger"
      ? "btn-danger"
      : variant === "warning"
      ? "btn-warning"
      : "btn-primary";

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${buttonClass}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
