import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';
import './index.css';
import App from '@/App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZnVubnktbW9ua2V5LTU5LmNsZXJrLmFjY291bnRzLmRldiQ';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SidebarProvider>
          {PUBLISHABLE_KEY ? (
            <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
              <App />
            </ClerkProvider>
          ) : (
            <App />
          )}
        </SidebarProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
