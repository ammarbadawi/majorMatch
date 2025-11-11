import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function useQuery() {
    const { search } = useLocation();
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

const VerifyEmail: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const query = useQuery();
    const { t } = useTranslation();
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
            setError(t('verifyEmail.enterEmailAndCode'));
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
            if (!res.ok) throw new Error(data.error || t('verifyEmail.verificationFailed'));
            setMessage(t('verifyEmail.emailVerifiedRedirecting'));
            setTimeout(() => navigate('/'), 800);
        } catch (e: any) {
            setError(e.message || t('verifyEmail.verificationFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError(null);
        setMessage(null);
        if (!email) { setError(t('verifyEmail.enterEmailToResend')); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || t('verifyEmail.couldNotResendCode'));
            setMessage(t('verifyEmail.verificationCodeSent'));
        } catch (e: any) {
            setError(e.message || t('verifyEmail.couldNotResendCode'));
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
                py: { xs: 4, sm: 6 },
                px: { xs: 2, sm: 3 },
            }}
        >
            <Container maxWidth="sm" sx={{ width: '100%' }}>
                <Paper elevation={12} sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{t('verifyEmail.title')}</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {t('verifyEmail.subtitle')}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

                    <Box sx={{ display: 'grid', gap: 2 }}>
                        <TextField
                            label={t('verifyEmail.email')}
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                        />
                        <TextField
                            label={t('verifyEmail.verificationCode')}
                            placeholder="123456"
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            inputProps={{ maxLength: 6 }}
                            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleVerify} 
                            disabled={loading}
                            fullWidth
                            sx={{ 
                                py: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                        >
                            {t('verifyEmail.verify')}
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleResend} 
                            disabled={loading}
                            fullWidth
                            sx={{ 
                                py: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                        >
                            {t('verifyEmail.resendCode')}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default VerifyEmail;


