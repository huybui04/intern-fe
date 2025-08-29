import React from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'warning',
  icon = 'fas fa-exclamation-triangle'
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          headerBg: 'bg-danger',
          confirmBtn: 'btn-danger',
          iconColor: 'text-danger'
        };
      case 'warning':
        return {
          headerBg: 'bg-warning',
          confirmBtn: 'btn-warning',
          iconColor: 'text-warning'
        };
      case 'primary':
        return {
          headerBg: 'bg-primary',
          confirmBtn: 'btn-primary',
          iconColor: 'text-primary'
        };
      default:
        return {
          headerBg: 'bg-warning',
          confirmBtn: 'btn-warning',
          iconColor: 'text-warning'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={onCancel}
      ></div>
      
      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        style={{ zIndex: 1050 }}
        tabIndex={-1}
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg">
            {/* Header */}
            <div className={`modal-header ${variantClasses.headerBg} text-white border-0`}>
              <div className="d-flex align-items-center">
                <i className={`${icon} me-2 fs-4`}></i>
                <h5 className="modal-title mb-0">
                  {title || t('common.confirmation', 'Confirmation')}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onCancel}
                aria-label="Close"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body py-4">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-3">
                  <i className={`${icon} ${variantClasses.iconColor} fs-1`}></i>
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0 fs-6 text-dark">
                    {message || t('common.confirmAction', 'Are you sure you want to proceed?')}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={onCancel}
              >
                <i className="fas fa-times me-1"></i>
                {cancelText || t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className={`btn ${variantClasses.confirmBtn}`}
                onClick={onConfirm}
                autoFocus
              >
                <i className="fas fa-check me-1"></i>
                {confirmText || t('common.confirm', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
