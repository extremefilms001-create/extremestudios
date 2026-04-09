import React, { createContext, useState, useContext } from 'react';
import './Alert.css';

const AlertContext = createContext();

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({ show: false, message: '', type: 'error' });

  const showAlert = (message, type = 'error') => {
    setAlertState({ show: true, message, type });
    setTimeout(() => {
      setAlertState(prev => prev.message === message ? { show: false, message: '', type: 'error' } : prev);
    }, 5000);
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      {alertState.show && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-modal glass">
            <h3 className="text-gradient">Notice</h3>
            <p className="alert-message">{alertState.message}</p>
            <button className="btn-primary" onClick={() => setAlertState({ show: false, message: '', type: 'error' })}>
              Understood
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
