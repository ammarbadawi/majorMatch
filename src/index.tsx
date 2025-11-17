import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './i18n/config';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const AppWithProviders = () => {
    if (!googleClientId) {
        return <App />;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <App />
        </GoogleOAuthProvider>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <AppWithProviders />
    </React.StrictMode>
);