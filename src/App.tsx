import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import PersonalityTest from './pages/PersonalityTest';
import MajorMatchingTest from './pages/MajorMatchingTest';
import PersonalityResults from './pages/PersonalityResults';
import MajorMatchingResults from './pages/MajorMatchingResults';
import Profile from './pages/Profile';
import NavBar from './components/NavBar';
import VerifyEmail from './pages/VerifyEmail';
import Chat from './pages/Chat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const getTheme = (direction: 'ltr' | 'rtl') => createTheme({
    direction: direction,
    palette: {
        primary: {
            main: '#6C63FF',
            light: '#8A82FF',
            dark: '#4B44CC',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#FF6B9D',
            light: '#FF8CB3',
            dark: '#E1477A',
            contrastText: '#FFFFFF',
        },
        tertiary: {
            main: '#45D4AA',
            light: '#6BDDC2',
            dark: '#33B088',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#FFB547',
            light: '#FFC773',
            dark: '#E69B2F',
        },
        success: {
            main: '#45D4AA',
            light: '#6BDDC2',
            dark: '#33B088',
        },
        error: {
            main: '#FF5252',
            light: '#FF7F7F',
            dark: '#E63946',
        },
        background: {
            default: '#FAFBFC',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A1D29',
            secondary: '#6B7280',
        },
        grey: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
        }
    },
    typography: {
        fontFamily: direction === 'rtl' 
            ? '"Cairo", "Tajawal", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
            : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2.75rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '2.25rem',
            fontWeight: 700,
            lineHeight: 1.3,
        },
        h4: {
            fontSize: '1.875rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h6: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
            fontWeight: 400,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            fontWeight: 400,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.02em',
        },
    },
    spacing: 8,
    shape: {
        borderRadius: 16,
    },
    shadows: [
        'none',
        '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        '0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)',
        '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
        '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
        '0px 25px 50px rgba(0, 0, 0, 0.25)',
        '0px 25px 50px rgba(108, 99, 255, 0.15)',
        '0px 25px 50px rgba(255, 107, 157, 0.15)',
        '0px 25px 50px rgba(69, 212, 170, 0.15)',
        '0px 4px 20px rgba(108, 99, 255, 0.3)',
        '0px 8px 32px rgba(108, 99, 255, 0.25)',
        '0px 16px 48px rgba(108, 99, 255, 0.2)',
        '0px 24px 64px rgba(108, 99, 255, 0.15)',
        '0px 32px 80px rgba(108, 99, 255, 0.1)',
        '0px 40px 96px rgba(108, 99, 255, 0.08)',
        '0px 48px 112px rgba(108, 99, 255, 0.06)',
        '0px 56px 128px rgba(108, 99, 255, 0.05)',
        '0px 64px 144px rgba(108, 99, 255, 0.04)',
        '0px 72px 160px rgba(108, 99, 255, 0.03)',
        '0px 80px 176px rgba(108, 99, 255, 0.02)',
        '0px 88px 192px rgba(108, 99, 255, 0.02)',
        '0px 96px 208px rgba(108, 99, 255, 0.01)',
        '0px 104px 224px rgba(108, 99, 255, 0.01)',
        '0px 112px 240px rgba(108, 99, 255, 0.01)',
        '0px 120px 256px rgba(108, 99, 255, 0.01)',
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#FAFBFC'
                },
                '*': {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#C7C9D1 transparent'
                },
                '*::-webkit-scrollbar': {
                    height: 10,
                    width: 10
                },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: '#C7C9D1',
                    borderRadius: 8
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        boxShadow: '0px 4px 20px rgba(108, 99, 255, 0.3)',
                        transform: 'translateY(-2px)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #6C63FF 0%, #8A82FF 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #5A52E6 0%, #7871FF 100%)',
                    },
                },
                containedSecondary: {
                    background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8CB3 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #E1477A 0%, #FF7BA3 100%)',
                    },
                },
                outlined: {
                    borderWidth: '2px',
                    '&:hover': {
                        borderWidth: '2px',
                    },
                },
                sizeLarge: {
                    padding: '16px 32px',
                    fontSize: '1.125rem',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '20px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.12)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '20px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                },
                elevation1: {
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
                },
                elevation2: {
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)',
                },
                elevation3: {
                    boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        },
                        '&.Mui-focused': {
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0px 0px 0px 3px rgba(108, 99, 255, 0.1)',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#6C63FF',
                                borderWidth: '2px',
                            },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(209, 213, 219, 1)',
                            transition: 'border-color 0.2s ease-in-out',
                        },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#6C63FF',
                        fontWeight: 600,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    height: '8px',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                },
                bar: {
                    borderRadius: '8px',
                    background: 'linear-gradient(90deg, #6C63FF 0%, #8A82FF 100%)',
                },
            },
        },
    },
});

// Extend the theme to include custom properties
declare module '@mui/material/styles' {
    interface Palette {
        tertiary: Palette['primary'];
    }
    interface PaletteOptions {
        tertiary: PaletteOptions['primary'];
    }
}

function AppContent() {
    const { i18n } = useTranslation();
    const [direction, setDirection] = useState<'ltr' | 'rtl'>(i18n.language === 'ar' ? 'rtl' : 'ltr');
    const theme = getTheme(direction);

    useEffect(() => {
        const currentDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';
        setDirection(currentDirection);
        document.documentElement.dir = currentDirection;
        document.documentElement.lang = i18n.language;
        
        // Add Arabic font if needed
        if (currentDirection === 'rtl' && !document.getElementById('arabic-fonts')) {
            const link = document.createElement('link');
            link.id = 'arabic-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap';
            document.head.appendChild(link);
        }
    }, [i18n.language]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <NavBar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                        path="/chat"
                        element={
                            <RequireAuth>
                                <Chat />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/personality-test"
                        element={
                            <RequireAuth>
                                <PersonalityTest />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/major-matching-test"
                        element={
                            <RequireAuth>
                                <RequireMbti>
                                    <MajorMatchingTest />
                                </RequireMbti>
                            </RequireAuth>
                        }
                    />
                    <Route path="/personality-results" element={<PersonalityResults />} />
                    <Route path="/major-matching-results" element={<MajorMatchingResults />} />
                    <Route
                        path="/profile"
                        element={
                            <RequireAuth>
                                <Profile />
                            </RequireAuth>
                        }
                    />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

function RequireAuth({ children }: { children: JSX.Element }) {
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                if (!cancelled) {
                    setAuthed(res.ok);
                }
            } catch {
                if (!cancelled) setAuthed(false);
            } finally {
                if (!cancelled) setChecking(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [location.pathname]);

    if (checking) return null;
    if (!authed) return <Navigate to="/login" replace state={{ from: location }} />;
    return children;
}

function RequireMbti({ children }: { children: JSX.Element }) {
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [hasMbti, setHasMbti] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const res = await fetch('/api/personality/latest', { credentials: 'include' });
                if (!cancelled) setHasMbti(res.ok);
            } catch {
                if (!cancelled) setHasMbti(false);
            } finally {
                if (!cancelled) setChecking(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [location.pathname]);

    if (checking) return null;
    if (!hasMbti) return <Navigate to="/personality-test" replace />;
    return children;
}

function App() {
    return <AppContent />;
}

export default App; 