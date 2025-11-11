import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    InputAdornment,
    useTheme,
    Alert,
    CircularProgress,
    useMediaQuery
} from '@mui/material';
import {
    Email,
    ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reset code');
            }
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code');
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
                py: 4,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }
            }}
        >
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 3 }, width: '100%' }}>
                <Paper
                    elevation={10}
                    sx={{
                        p: { xs: 2.5, sm: 4, md: 6 },
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: theme.shadows[12],
                        width: '100%',
                        maxWidth: '100%'
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
                        <Typography
                            variant="h3"
                            component="h1"
                            gutterBottom
                            sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 800,
                                mb: 2,
                                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                            }}
                        >
                            {t('forgotPassword.title')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{
                            fontSize: { xs: '1rem', sm: '1.125rem' },
                            lineHeight: 1.6
                        }}>
                            {success
                                ? t('forgotPassword.successSubtitle')
                                : t('forgotPassword.subtitle')
                            }
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>{error}</Alert>
                    )}

                    {success ? (
                        <Box sx={{ textAlign: 'center' }}>
                            <Alert severity="success" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                {t('forgotPassword.resetCodeSent')}
                            </Alert>
                            <Button
                                variant="contained"
                                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                                fullWidth
                                sx={{
                                    mb: 3,
                                    py: { xs: 1.75, sm: 2 },
                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    boxShadow: theme.shadows[6],
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                        transform: 'translateY(-2px)',
                                        boxShadow: theme.shadows[10]
                                    }
                                }}
                            >
                                {t('forgotPassword.continueToResetPassword')}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBack />}
                                onClick={() => navigate('/login')}
                                fullWidth
                                sx={{
                                    borderColor: theme.palette.grey[300],
                                    color: theme.palette.text.secondary,
                                    borderWidth: '2px',
                                    py: { xs: 1.25, sm: 1.5 },
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    fontWeight: 600,
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        backgroundColor: `${theme.palette.primary.main}08`,
                                        borderWidth: '2px',
                                    }
                                }}
                            >
                                {t('forgotPassword.backToLogin')}
                            </Button>
                        </Box>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                                <TextField
                                    fullWidth
                                    label={t('forgotPassword.emailAddress')}
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 24 } }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            fontSize: { xs: '0.9rem', sm: '1rem' },
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: '#FFFFFF',
                                                boxShadow: `0px 0px 0px 3px ${theme.palette.primary.main}20`,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: '2px',
                                                },
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: { xs: '0.9rem', sm: '1rem' },
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': {
                                            color: theme.palette.primary.main,
                                            fontWeight: 600,
                                        },
                                    }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
                                sx={{
                                    mt: 3,
                                    mb: 4,
                                    py: { xs: 1.75, sm: 2 },
                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    boxShadow: theme.shadows[6],
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                        transform: 'translateY(-2px)',
                                        boxShadow: theme.shadows[10]
                                    }
                                }}
                            >
                                {t('forgotPassword.sendResetLink')}
                            </Button>

                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBack />}
                                    onClick={() => navigate('/login')}
                                    fullWidth
                                    sx={{
                                        borderColor: theme.palette.grey[300],
                                        color: theme.palette.text.secondary,
                                        borderWidth: '2px',
                                        py: { xs: 1.25, sm: 1.5 },
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        fontWeight: 600,
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            color: theme.palette.primary.main,
                                            backgroundColor: `${theme.palette.primary.main}08`,
                                            borderWidth: '2px',
                                        }
                                    }}
                                >
                                    {t('forgotPassword.backToLogin')}
                                </Button>
                            </Box>
                        </form>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default ForgotPassword;

