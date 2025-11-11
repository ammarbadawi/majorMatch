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
    Grid,
    useTheme,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Email,
    Lock,
    Person,
    Visibility,
    VisibilityOff,
    Home,
    School
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        university: ''
    });

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return t('signup.passwordMustBe8Chars');
        }
        if (!/[A-Z]/.test(password)) {
            return t('signup.passwordMustContain');
        }
        if (!/[0-9]/.test(password)) {
            return t('signup.passwordMustContainNumber');
        }
        if (!/[^a-zA-Z0-9]/.test(password)) {
            return t('signup.passwordMustContainSpecial');
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
        
        // Validate password in real-time
        if (e.target.name === 'password') {
            const error = validatePassword(value);
            setPasswordError(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Validate password requirements
        const passwordValidationError = validatePassword(formData.password);
        if (passwordValidationError) {
            setError(passwordValidationError);
            setPasswordError(passwordValidationError);
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError(t('signup.passwordsDoNotMatch'));
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    university: formData.university || undefined
                })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Signup failed' }));
                throw new Error(data.error || 'Signup failed');
            }
            const data = await res.json();
            if (data.requiresVerification && formData.email) {
                navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
                return;
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
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
                    py: 6,
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\"%3E%3Cg fill=\\"%23ffffff\\" fill-opacity=\\"0.05\\"%3E%3Ccircle cx=\\"30\\" cy=\\"30\\" r=\\"2\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }
                }}
            >
                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
                    <Paper
                        elevation={12}
                        sx={{
                            p: { xs: 3, sm: 4, md: 6 },
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: theme.shadows[12]
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
                                {t('signup.appName')}
                            </Typography>
                            <Typography variant="h4" component="h2" gutterBottom sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                mb: 1.5,
                                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                            }}>
                                {t('signup.title')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                lineHeight: 1.6
                            }}>
                                {t('signup.joinThousands')}
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Grid container rowSpacing={3} columnSpacing={3} justifyContent="center" alignItems="center">
                                <Grid item xs={12} sm={6} md={6}>
                                    <TextField
                                        fullWidth
                                        label={t('signup.firstName')}
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{ color: theme.palette.primary.main }} />
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
                                </Grid>

                                <Grid item xs={12} sm={6} md={6}>
                                    <TextField
                                        fullWidth
                                        label={t('signup.lastName')}
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{ color: theme.palette.primary.main }} />
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
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={t('signup.emailAddress')}
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
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={t('signup.universityOptional')}
                                        name="university"
                                        value={formData.university}
                                        onChange={handleChange}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <School sx={{ color: theme.palette.primary.main }} />
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
                                </Grid>

                                <Grid item xs={12} sm={6} md={6}>
                                    <TextField
                                        fullWidth
                                        label={t('signup.password')}
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        error={!!passwordError}
                                        helperText={passwordError || t('signup.passwordRequirements')}
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
                                </Grid>

                                <Grid item xs={12} sm={6} md={6}>
                                    <TextField
                                        fullWidth
                                        label={t('signup.confirmPassword')}
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
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
                                                        onClick={toggleConfirmPasswordVisibility}
                                                        edge="end"
                                                        sx={{ color: theme.palette.text.secondary }}
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                                </Grid>
                            </Grid>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
                                sx={{
                                    mt: { xs: 4, sm: 5 },
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
                                {t('signup.createAccount')}
                            </Button>

                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                    {t('signup.alreadyHaveAccount')}{' '}
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        sx={{
                                            color: theme.palette.primary.main,
                                            textDecoration: 'none',
                                            fontWeight: 700,
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}
                                    >
                                        {t('signup.signInHere')}
                                    </Link>
                                </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Home />}
                                    onClick={() => navigate('/')}
                                    fullWidth
                                    sx={{
                                        borderColor: theme.palette.grey[300],
                                        color: theme.palette.text.secondary,
                                        borderWidth: '2px',
                                        py: { xs: 1.25, sm: 1.5 },
                                        px: { xs: 3, sm: 4 },
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
                                    {t('signup.backToHome')}
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default SignUp; 