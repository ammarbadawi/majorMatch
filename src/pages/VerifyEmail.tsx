import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

const VerifyEmail: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const query = useQuery();
    const initialEmail = query.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        setError(null);
        setMessage(null);
        if (!email || !code) {
            setError('Enter your email and the 6-digit code.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, code })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Verification failed');
            setMessage('Email verified! Redirecting...');
            setTimeout(() => navigate('/'), 800);
        } catch (e: any) {
            setError(e.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError(null);
        setMessage(null);
        if (!email) { setError('Enter your email to resend a code.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not resend code');
            setMessage('Verification code sent. Check your email.');
        } catch (e: any) {
            setError(e.message || 'Could not resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
            }}
        >
            <Container maxWidth="sm">
                <Paper elevation={12} sx={{ p: 5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Verify your email</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Enter the 6-digit code we sent to your email.
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

                    <Box sx={{ display: 'grid', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            label="Verification Code"
                            placeholder="123456"
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            inputProps={{ maxLength: 6 }}
                        />
                        <Button variant="contained" onClick={handleVerify} disabled={loading}>
                            Verify
                        </Button>
                        <Button variant="outlined" onClick={handleResend} disabled={loading}>
                            Resend Code
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default VerifyEmail;


