/**
 * App State Context and Hook
 * Manages global application state for the steganography app
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState } from '@/types';
import { logInfo, Component } from '@/core/logger';

// Initial app state
const initialState: AppState = {
  mode: 'idle',
  phase: 'waiting',
  file: null,
  message: '',
  password: '',
  processedData: null,
  extractedMessage: '',
  error: null,
  includeVectorMetadata: false
};

// Action types
type AppAction =
  | { type: 'SET_MODE'; payload: AppState['mode'] }
  | { type: 'SET_PHASE'; payload: AppState['phase'] }
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_PROCESSED_DATA'; payload: AppState['processedData'] }
  | { type: 'SET_EXTRACTED_MESSAGE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_SENSITIVE_DATA' }
  | { type: 'SET_INCLUDE_VECTOR_METADATA'; payload: boolean };

// App state reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      logInfo(Component.APP, `Mode changed to: ${action.payload}`);
      return { ...state, mode: action.payload };
    
    case 'SET_PHASE':
      logInfo(Component.APP, `Phase changed to: ${action.payload}`);
      return { ...state, phase: action.payload };
    
    case 'SET_FILE':
      logInfo(Component.APP, `File set: ${action.payload?.name || 'null'}`);
      return { ...state, file: action.payload };
    
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    
    case 'SET_PROCESSED_DATA':
      logInfo(Component.APP, 'Processed data set');
      return { ...state, processedData: action.payload };
    
    case 'SET_EXTRACTED_MESSAGE':
      logInfo(Component.APP, 'Extracted message set');
      return { ...state, extractedMessage: action.payload };
    
    case 'SET_ERROR':
      if (action.payload) {
        logInfo(Component.APP, `Error set: ${action.payload}`);
      }
      return { ...state, error: action.payload };
    
    case 'RESET_STATE':
      logInfo(Component.APP, 'App state reset');
      return initialState;
    
    case 'CLEAR_SENSITIVE_DATA':
      logInfo(Component.APP, 'Sensitive data cleared');
      return {
        ...state,
        message: '',
        password: '',
        processedData: null,
        extractedMessage: ''
      };
    
    case 'SET_INCLUDE_VECTOR_METADATA':
      logInfo(Component.APP, `Include vector metadata: ${action.payload}`);
      return { ...state, includeVectorMetadata: action.payload };
    
    default:
      return state;
  }
}

// Context type
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = {
    state,
    dispatch
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};

// Convenience hooks for specific state updates
export const useAppMode = () => {
  const { state, dispatch } = useAppState();
  
  const setMode = (mode: AppState['mode']) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };
  
  return { mode: state.mode, setMode };
};

export const useAppPhase = () => {
  const { state, dispatch } = useAppState();
  
  const setPhase = (phase: AppState['phase']) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  };
  
  return { phase: state.phase, setPhase };
};

export const useAppFile = () => {
  const { state, dispatch } = useAppState();
  
  const setFile = (file: File | null) => {
    dispatch({ type: 'SET_FILE', payload: file });
  };
  
  return { file: state.file, setFile };
};

export const useAppMessage = () => {
  const { state, dispatch } = useAppState();
  
  const setMessage = (message: string) => {
    dispatch({ type: 'SET_MESSAGE', payload: message });
  };
  
  return { message: state.message, setMessage };
};

export const useAppPassword = () => {
  const { state, dispatch } = useAppState();
  
  const setPassword = (password: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: password });
  };
  
  return { password: state.password, setPassword };
};

export const useAppError = () => {
  const { state, dispatch } = useAppState();
  
  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };
  
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };
  
  return { error: state.error, setError, clearError };
};

export const useAppReset = () => {
  const { dispatch } = useAppState();
  
  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };
  
  const clearSensitiveData = () => {
    dispatch({ type: 'CLEAR_SENSITIVE_DATA' });
  };
  
  return { resetState, clearSensitiveData };
}; 