import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { initPerformanceMonitoring } from './utils/performance';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize performance monitoring
initPerformanceMonitoring();

// Register service worker for production environment
// This gives the app offline capabilities and better performance
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('🚀 UPLIVE is now available offline!');
  },
  onUpdate: (registration) => {
    console.log('🔄 New version of UPLIVE is available!', registration);
    // You could show a toast notification here informing the user about the update
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(metric => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`📊 Web Vital: ${metric.name} = ${metric.value}`);
  }
});
