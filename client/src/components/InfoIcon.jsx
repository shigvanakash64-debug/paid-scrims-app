import { useState } from 'react';

export const InfoIcon = ({ title, content }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className="info-icon-btn"
        onClick={() => setShowModal(true)}
        title={title}
      >
        ⓘ
      </button>

      {showModal && (
        <div className="info-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>{title}</h3>
              <button
                className="info-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="info-modal-content">
              {content}
            </div>
            <button
              className="info-modal-btn"
              onClick={() => setShowModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
