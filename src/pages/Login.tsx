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
    IconButton,
    useTheme,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Home
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await res.json().catch(() => ({ error: 'Login failed' }));
            if (!res.ok) {
                if (res.status === 403 && data.requiresVerification && formData.email) {
                    navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
                    return;
                }
                throw new Error(data.error || 'Login failed');
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
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
                <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                    <Paper
                        elevation={10}
                        sx={{
                            p: 6,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: theme.shadows[12]
                        }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography
                                variant="h3"
                                component="h1"
                                gutterBottom
                                sx={{
                                    color: theme.palette.primary.main,
                                    fontWeight: 800,
                                    mb: 2
                                }}
                            >
                                Major Match
                            </Typography>
                            <Typography variant="h4" component="h2" gutterBottom sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                mb: 1.5
                            }}>
                                Welcome Back!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{
                                fontSize: '1.125rem',
                                lineHeight: 1.6
                            }}>
                                Sign in to continue your journey
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ mb: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email sx={{ color: theme.palette.primary.main }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                                        '& .MuiInputLabel-root.Mui-focused': {
                                            color: theme.palette.primary.main,
                                            fontWeight: 600,
                                        },
                                    }}
                                />
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock sx={{ color: theme.palette.primary.main }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={togglePasswordVisibility}
                                                    edge="end"
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                                    py: 2,
                                    fontSize: '1.125rem',
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
                                Sign In
                            </Button>

                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
                                    Don't have an account?{' '}
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => navigate('/signup')}
                                        sx={{
                                            color: theme.palette.primary.main,
                                            textDecoration: 'none',
                                            fontWeight: 700,
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}
                                    >
                                        Sign up here
                                    </Link>
                                </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Home />}
                                    onClick={() => navigate('/')}
                                    sx={{
                                        borderColor: theme.palette.grey[300],
                                        color: theme.palette.text.secondary,
                                        borderWidth: '2px',
                                        py: 1.5,
                                        px: 4,
                                        fontWeight: 600,
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            color: theme.palette.primary.main,
                                            backgroundColor: `${theme.palette.primary.main}08`,
                                            borderWidth: '2px',
                                        }
                                    }}
                                >
                                    Back to Home
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default Login; 