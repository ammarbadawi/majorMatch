import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    Card,
    CardContent,
    Grid,
    Paper,
    Chip,
    Avatar,
    useTheme,
    Tooltip,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Divider,
    Fade,
    Slide
} from '@mui/material';
import {
    Psychology,
    School,
    Star,
    TrendingUp,
    Groups,
    EmojiEvents,
    AutoAwesome,
    Favorite,
    CheckCircle,
    BusinessCenter,
    ArrowForward,
    ArrowBack,
    ArrowDownward,
    Explore,
    Route,
    Timeline,
    PlayArrow,
    Flag,
    Lock,
    SupportAgent,
    Chat
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SubscriptionStatus from '../components/SubscriptionStatus';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const [hasMbti, setHasMbti] = useState<boolean>(() => {
        try { return localStorage.getItem('hasMbti') === '1'; } catch { return false; }
    });

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            try {
                const res = await fetch('/api/personality/latest', { credentials: 'include' });
                if (!cancelled) {
                    if (res.ok) {
                        const data = await res.json();
                        const has = Boolean(data?.hasResult);
                        setHasMbti(has);
                        try { if (has) localStorage.setItem('hasMbti', '1'); } catch { }
                    } else {
                        setHasMbti(false);
                    }
                }
            } catch {
                if (!cancelled) setHasMbti(false);
            }
        };
        check();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const onMbti = () => setHasMbti(true);
        window.addEventListener('mbti-completed', onMbti);
        return () => window.removeEventListener('mbti-completed', onMbti);
    }, []);



    const stats = [
        { number: '32', label: t('home.stats.personalityTypes'), icon: <Psychology /> },
        { number: '50K+', label: t('home.stats.studentsHelped'), icon: <Groups /> },
        { number: '200+', label: t('home.stats.universityPrograms'), icon: <School /> },
        { number: '95%', label: t('home.stats.satisfactionRate'), icon: <Star /> }
    ];

    const features = [
        {
            title: t('home.features.scientificallyBacked'),
            description: t('home.features.scientificallyBackedDesc'),
            icon: <AutoAwesome />,
            color: theme.palette.error.main
        },
        {
            title: t('home.features.personalizedResults'),
            description: t('home.features.personalizedResultsDesc'),
            icon: <Favorite />,
            color: theme.palette.warning.main
        },
        {
            title: t('home.features.careerGuidance'),
            description: t('home.features.careerGuidanceDesc'),
            icon: <BusinessCenter />,
            color: theme.palette.success.main
        },
        {
            title: t('home.features.universityMatches'),
            description: t('home.features.universityMatchesDesc'),
            icon: <School />,
            color: theme.palette.primary.main
        }
    ];



    return (
        <Box sx={{
            overflow: 'hidden',
            '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' }
            },
            '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                '40%': { transform: 'translateY(-10px)' },
                '60%': { transform: 'translateY(-5px)' }
            }
        }}>

            {/* Journey Hero Section */}
            <Box
                sx={{
                    minHeight: '100vh',
                    pt: { xs: 8, sm: 10 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }
                }}
            >
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
                    <Fade in timeout={1000}>
                        <Box sx={{ textAlign: 'center', mb: 8 }}>
                            <Chip
                                label={t('home.academicJourneyStartsHere')}
                                sx={{
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    fontWeight: 700,
                                    mb: 4,
                                    fontSize: '1.1rem',
                                    px: 4,
                                    py: 2,
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            />

                            <Typography
                                variant="h1"
                                component="h1"
                                gutterBottom
                                sx={{
                                    color: 'white',
                                    fontWeight: 800,
                                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
                                    lineHeight: 1.1,
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                                    mb: { xs: 3, sm: 4 },
                                    px: { xs: 2, sm: 0 }
                                }}
                            >
                                {t('home.title')}
                            </Typography>

                            <Typography
                                variant="h5"
                                component="p"
                                sx={{
                                    color: 'rgba(255,255,255,0.95)',
                                    mb: { xs: 4, sm: 6 },
                                    lineHeight: 1.6,
                                    fontWeight: 400,
                                    maxWidth: '90%',
                                    mx: 'auto',
                                    fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                                    px: { xs: 2, sm: 0 }
                                }}
                            >
                                {t('home.subtitle')}
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/personality-test')}
                                    startIcon={<PlayArrow />}
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: 'white',
                                        backdropFilter: 'blur(10px)',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        py: { xs: 2.5, sm: 3 },
                                        px: { xs: 4, sm: 6 },
                                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                                        fontWeight: 700,
                                        borderRadius: 3,
                                        width: { xs: '90%', sm: 'auto' },
                                        maxWidth: { xs: '300px', sm: 'none' },
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.25)',
                                            transform: 'translateY(-3px)',
                                            boxShadow: theme.shadows[12]
                                        },
                                    }}
                                >
                                    {t('home.startJourney')}
                                </Button>


                            </Box>
                        </Box>
                    </Fade>

                    {/* Journey Path Visualization */}
                    <Fade in timeout={1500}>
                        <Box sx={{ mt: 8, pb: { xs: 6, sm: 8 } }}>
                            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} alignItems="stretch" justifyContent="center">
                                {/* Step 1 */}
                                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                                    <Slide direction="up" in timeout={2000}>
                                        <Card
                                            elevation={8}
                                            sx={{
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                color: 'white',
                                                p: { xs: 3, sm: 4 },
                                                textAlign: 'center',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: -20,
                                                    right: -20,
                                                    width: 60,
                                                    height: 60,
                                                    background: 'rgba(255,255,255,0.1)',
                                                    borderRadius: '50%'
                                                }
                                            }}
                                        >
                                            <Avatar sx={{
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                width: { xs: 60, sm: 70, md: 80 },
                                                height: { xs: 60, sm: 70, md: 80 },
                                                mx: 'auto',
                                                mb: { xs: 2, sm: 3 }
                                            }}>
                                                <Psychology sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />
                                            </Avatar>
                                            <Typography variant="h6" sx={{
                                                fontWeight: 700,
                                                mb: { xs: 1, sm: 2 },
                                                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                                            }}>
                                                {t('home.step1')}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                mb: { xs: 2, sm: 3 },
                                                opacity: 0.9,
                                                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                                            }}>
                                                {t('home.step1Desc')}
                                            </Typography>
                                            <Chip
                                                label={t('home.free')}
                                                sx={{
                                                    backgroundColor: theme.palette.success.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                                }}
                                            />
                                        </Card>
                                    </Slide>
                                </Grid>

                                {/* Mobile Arrow between Step 1 and Step 2 */}
                                <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                                    <Box sx={{ textAlign: 'center', my: 2 }}>
                                        <ArrowDownward sx={{
                                            fontSize: 40,
                                            color: 'rgba(255,255,255,0.8)',
                                            animation: 'bounce 2s infinite'
                                        }} />
                                    </Box>
                                </Grid>

                                {/* Arrow 1 */}
                                <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'block' } }}>
                                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                                        {i18n.language === 'ar' ? (
                                            <ArrowBack sx={{
                                                fontSize: { md: 50, lg: 60 },
                                                color: 'rgba(255,255,255,0.8)',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                        ) : (
                                            <ArrowForward sx={{
                                                fontSize: { md: 50, lg: 60 },
                                                color: 'rgba(255,255,255,0.8)',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                        )}
                                    </Box>
                                </Grid>

                                {/* Step 2 */}
                                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                                    <Slide direction="up" in timeout={2500}>
                                        <Card
                                            elevation={8}
                                            sx={{
                                                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                                                color: 'white',
                                                p: { xs: 3, sm: 4 },
                                                textAlign: 'center',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                opacity: hasMbti ? 1 : 0.6,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: -20,
                                                    right: -20,
                                                    width: 60,
                                                    height: 60,
                                                    background: 'rgba(255,255,255,0.1)',
                                                    borderRadius: '50%'
                                                }
                                            }}
                                        >
                                            <Avatar sx={{
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                width: { xs: 60, sm: 70, md: 80 },
                                                height: { xs: 60, sm: 70, md: 80 },
                                                mx: 'auto',
                                                mb: { xs: 2, sm: 3 }
                                            }}>
                                                <School sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />
                                            </Avatar>
                                            <Typography variant="h6" sx={{
                                                fontWeight: 700,
                                                mb: { xs: 1, sm: 2 },
                                                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                                            }}>
                                                {t('home.step2')}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                mb: { xs: 2, sm: 3 },
                                                opacity: 0.9,
                                                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                                            }}>
                                                {t('home.step2Desc')}
                                            </Typography>
                                            <Chip
                                                label={t('home.premium')}
                                                sx={{
                                                    backgroundColor: theme.palette.warning.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                                }}
                                            />
                                        </Card>
                                    </Slide>
                                </Grid>

                                {/* Mobile Arrow between Step 2 and Step 3 */}
                                <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                                    <Box sx={{ textAlign: 'center', my: 2 }}>
                                        <ArrowDownward sx={{
                                            fontSize: 40,
                                            color: 'rgba(255,255,255,0.8)',
                                            animation: 'bounce 2s infinite'
                                        }} />
                                    </Box>
                                </Grid>

                                {/* Arrow 2 */}
                                <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'block' } }}>
                                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                                        {i18n.language === 'ar' ? (
                                            <ArrowBack sx={{
                                                fontSize: { md: 50, lg: 60 },
                                                color: 'rgba(255,255,255,0.8)',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                        ) : (
                                            <ArrowForward sx={{
                                                fontSize: { md: 50, lg: 60 },
                                                color: 'rgba(255,255,255,0.8)',
                                                animation: 'pulse 2s infinite'
                                            }} />
                                        )}
                                    </Box>
                                </Grid>

                                {/* Step 3 */}
                                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                                    <Slide direction="up" in timeout={3000}>
                                        <Card
                                            elevation={8}
                                            sx={{
                                                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                                color: 'white',
                                                p: { xs: 3, sm: 4 },
                                                textAlign: 'center',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: -20,
                                                    right: -20,
                                                    width: 60,
                                                    height: 60,
                                                    background: 'rgba(255,255,255,0.1)',
                                                    borderRadius: '50%'
                                                }
                                            }}
                                        >
                                            <Avatar sx={{
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                width: { xs: 60, sm: 70, md: 80 },
                                                height: { xs: 60, sm: 70, md: 80 },
                                                mx: 'auto',
                                                mb: { xs: 2, sm: 3 }
                                            }}>
                                                <SupportAgent sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />
                                            </Avatar>
                                            <Typography variant="h6" sx={{
                                                fontWeight: 700,
                                                mb: { xs: 1, sm: 2 },
                                                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                                            }}>
                                                {t('home.step3')}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                mb: { xs: 2, sm: 3 },
                                                opacity: 0.9,
                                                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                                            }}>
                                                {t('home.step3Desc')}
                                            </Typography>
                                            <Chip
                                                label={t('home.premium')}
                                                sx={{
                                                    backgroundColor: theme.palette.info.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                                }}
                                            />
                                        </Card>
                                    </Slide>
                                </Grid>


                            </Grid>
                        </Box>
                    </Fade>
                </Container>
            </Box>

            {/* Subscription Status */}
            <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                <SubscriptionStatus />
            </Container>

            {/* Stats Section */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8, md: 10 }, mt: { xs: -4, sm: -6, md: -8 }, position: 'relative', zIndex: 2, px: { xs: 2, sm: 3, md: 4 } }}>
                <Grid container spacing={{ xs: 2, sm: 4, md: 6 }} alignItems="stretch" justifyContent="center">
                    {stats.map((stat, index) => (
                        <Grid item xs={6} md={3} key={index}>
                            <Paper
                                elevation={3}
                                sx={{
                                    p: { xs: 2, sm: 3, md: 4 },
                                    height: '100%',
                                    textAlign: 'center',
                                    background: 'linear-gradient(135deg, white 0%, #fafbfc 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                                    {React.cloneElement(stat.icon, { sx: { fontSize: { xs: 32, sm: 40, md: 48 } } })}
                                </Box>
                                <Typography variant="h3" component="div" sx={{
                                    fontWeight: 800,
                                    color: theme.palette.text.primary,
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                                }}>
                                    {stat.number}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
                                    {stat.label}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Journey Timeline Section */}
            <Box sx={{ backgroundColor: theme.palette.grey[50], py: { xs: 6, sm: 8, md: 12 } }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 6, sm: 8, md: 10 } }}>
                        <Chip
                            label={t('home.journeyTimeline')}
                            sx={{
                                backgroundColor: `${theme.palette.primary.main}20`,
                                color: theme.palette.primary.main,
                                fontWeight: 700,
                                mb: { xs: 3, sm: 4 },
                                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                                px: { xs: 2, sm: 3, md: 4 },
                                py: { xs: 1, sm: 1.25, md: 1.5 }
                            }}
                        />
                        <Typography variant="h2" component="h2" gutterBottom sx={{
                            fontWeight: 800,
                            color: theme.palette.text.primary,
                            mb: { xs: 2, sm: 3 },
                            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                        }}>
                            {t('home.followPath')}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{
                            maxWidth: 600,
                            mx: 'auto',
                            lineHeight: 1.6,
                            fontWeight: 400,
                            fontSize: { xs: '0.95rem', sm: '1.125rem', md: '1.25rem' },
                            px: { xs: 2, sm: 0 }
                        }}>
                            {t('home.followPathDesc')}
                        </Typography>
                    </Box>

                    <Stepper
                        orientation="vertical"
                        sx={{
                            maxWidth: { xs: '100%', sm: 600, md: 800 },
                            mx: 'auto',
                            '& .MuiStepContent-root': {
                                ml: { xs: 2, sm: 3, md: 4 }
                            },
                            '& .MuiStepLabel-root': {
                                alignItems: 'flex-start'
                            }
                        }}
                    >
                        {/* Step 1 */}
                        <Step active={true} completed={true}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Avatar sx={{
                                        backgroundColor: theme.palette.primary.main,
                                        width: { xs: 40, sm: 45, md: 50 },
                                        height: { xs: 40, sm: 45, md: 50 },
                                        border: '4px solid white',
                                        boxShadow: theme.shadows[4]
                                    }}>
                                        <Psychology sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                                    </Avatar>
                                )}
                                sx={{
                                    '& .MuiStepLabel-label': {
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                        fontWeight: 700,
                                        color: theme.palette.text.primary
                                    }
                                }}
                            >
                                {t('home.takePersonalityAssessment')}
                            </StepLabel>
                            <StepContent>
                                <Box sx={{
                                    mb: 4,
                                    p: { xs: 2, sm: 3 },
                                    backgroundColor: 'white',
                                    borderRadius: 2,
                                    boxShadow: theme.shadows[2]
                                }}>
                                    <Typography variant="body1" sx={{
                                        mb: 3,
                                        lineHeight: 1.6,
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }}>
                                        {t('home.assessmentDesc')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mb: 3 }}>
                                        {[t('home.freeAssessment'), t('home.personalityTypes'), t('home.detailedAnalysis'), t('home.careerInsights')].map((feature, index) => (
                                            <Chip
                                                key={index}
                                                label={feature}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${theme.palette.primary.main}20`,
                                                    color: theme.palette.primary.main,
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate('/personality-test')}
                                        startIcon={<Psychology />}
                                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.dark
                                            }
                                        }}
                                    >
                                        {t('home.startAssessment')}
                                    </Button>
                                </Box>
                            </StepContent>
                        </Step>

                        {/* Connecting Line */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            my: 2,
                            '&::before': {
                                content: '""',
                                width: 2,
                                height: 40,
                                backgroundColor: theme.palette.grey[300],
                                mx: 'auto'
                            }
                        }} />

                        {/* Step 2 */}
                        <Step active={hasMbti} completed={false}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Avatar sx={{
                                        backgroundColor: hasMbti ? theme.palette.secondary.main : theme.palette.grey[400],
                                        width: { xs: 40, sm: 45, md: 50 },
                                        height: { xs: 40, sm: 45, md: 50 },
                                        border: '4px solid white',
                                        boxShadow: theme.shadows[4]
                                    }}>
                                        <School sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                                    </Avatar>
                                )}
                                sx={{
                                    '& .MuiStepLabel-label': {
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                        fontWeight: 700,
                                        color: hasMbti ? theme.palette.text.primary : theme.palette.text.disabled
                                    }
                                }}
                            >
                                {t('home.unlockMajorMatch')}
                            </StepLabel>
                            <StepContent>
                                <Box sx={{
                                    mb: 4,
                                    p: { xs: 2, sm: 3 },
                                    backgroundColor: 'white',
                                    borderRadius: 2,
                                    boxShadow: theme.shadows[2]
                                }}>
                                    <Typography variant="body1" sx={{
                                        mb: 3,
                                        lineHeight: 1.6,
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }}>
                                        {t('home.majorMatchingDesc')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mb: 3 }}>
                                        {[t('home.premiumAnalysis'), t('home.universityMatches'), t('home.careerPathways'), t('home.salaryInsights')].map((feature, index) => (
                                            <Chip
                                                key={index}
                                                label={feature}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${theme.palette.secondary.main}20`,
                                                    color: theme.palette.secondary.main,
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Tooltip title={t('home.completeTestFirst')} disableHoverListener={hasMbti}>
                                        <span>
                                            <Button
                                                variant="contained"
                                                onClick={() => navigate('/major-matching-test')}
                                                startIcon={<School />}
                                                disabled={!hasMbti}
                                                size={window.innerWidth < 600 ? 'small' : 'medium'}
                                                sx={{
                                                    backgroundColor: hasMbti ? theme.palette.secondary.main : theme.palette.grey[400],
                                                    '&:hover': {
                                                        backgroundColor: hasMbti ? theme.palette.secondary.dark : theme.palette.grey[400]
                                                    }
                                                }}
                                            >
                                                {hasMbti ? t('home.startMajorMatching') : t('home.completeStep1First')}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </StepContent>
                        </Step>

                        {/* Step 3 */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            my: 2,
                            '&::before': {
                                content: '""',
                                width: 2,
                                height: 40,
                                backgroundColor: theme.palette.grey[300],
                                mx: 'auto'
                            }
                        }} />

                        <Step active={true} completed={false}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Avatar sx={{
                                        backgroundColor: theme.palette.success.main,
                                        width: { xs: 40, sm: 45, md: 50 },
                                        height: { xs: 40, sm: 45, md: 50 },
                                        border: '4px solid white',
                                        boxShadow: theme.shadows[4]
                                    }}>
                                        <SupportAgent sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                                    </Avatar>
                                )}
                                sx={{
                                    '& .MuiStepLabel-label': {
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                        fontWeight: 700,
                                        color: theme.palette.text.primary
                                    }
                                }}
                            >
                                {t('home.getAIGuidance')}
                            </StepLabel>
                            <StepContent>
                                <Box sx={{
                                    mb: 4,
                                    p: { xs: 2, sm: 3 },
                                    backgroundColor: 'white',
                                    borderRadius: 2,
                                    boxShadow: theme.shadows[2]
                                }}>
                                    <Typography variant="body1" sx={{
                                        mb: 3,
                                        lineHeight: 1.6,
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }}>
                                        {t('home.aiGuidanceDesc')}
                                    </Typography>

                                    <Typography variant="body2" sx={{
                                        mb: 3,
                                        lineHeight: 1.5,
                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                        color: 'text.secondary'
                                    }}>
                                        {t('home.aiGuidanceDesc2')}
                                    </Typography>

                                    <Typography variant="body2" sx={{
                                        mb: 3,
                                        lineHeight: 1.5,
                                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                        color: 'text.secondary'
                                    }}>
                                        {t('home.aiGuidanceDesc3')}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mb: 3 }}>
                                        {[t('home.aiCounselor'), t('home.careerPlanning'), t('home.expertGuidance'), t('home.ongoingSupport'), t('home.industryInsights'), t('home.strategicPlanning')].map((feature, index) => (
                                            <Chip
                                                key={index}
                                                label={feature}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${theme.palette.success.main}20`,
                                                    color: theme.palette.success.main,
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                                    mb: { xs: 0.5, sm: 0 }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate('/chat')}
                                        startIcon={<SupportAgent />}
                                        size="medium"
                                        sx={{
                                            backgroundColor: theme.palette.success.main,
                                            fontSize: { xs: '0.9rem', sm: '1rem' },
                                            py: { xs: 1.5, sm: 2 },
                                            px: { xs: 3, sm: 4 },
                                            '&:hover': {
                                                backgroundColor: theme.palette.success.dark
                                            }
                                        }}
                                    >
                                        {t('home.startAICounseling')}
                                    </Button>
                                </Box>
                            </StepContent>
                        </Step>

                        {/* Final Step */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            my: 2,
                            '&::before': {
                                content: '""',
                                width: 2,
                                height: 40,
                                backgroundColor: theme.palette.grey[300],
                                mx: 'auto'
                            }
                        }} />

                        <Step active={false} completed={false}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Avatar sx={{
                                        backgroundColor: theme.palette.info.main,
                                        width: { xs: 40, sm: 45, md: 50 },
                                        height: { xs: 40, sm: 45, md: 50 },
                                        border: '4px solid white',
                                        boxShadow: theme.shadows[4]
                                    }}>
                                        <Flag sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
                                    </Avatar>
                                )}
                                sx={{
                                    '& .MuiStepLabel-label': {
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                        fontWeight: 700,
                                        color: theme.palette.text.primary
                                    }
                                }}
                            >
                                {t('home.beginAcademicJourney')}
                            </StepLabel>
                            <StepContent>
                                <Box sx={{
                                    mb: 4,
                                    p: { xs: 2, sm: 3 },
                                    backgroundColor: 'white',
                                    borderRadius: 2,
                                    boxShadow: theme.shadows[2]
                                }}>
                                    <Typography variant="body1" sx={{
                                        mb: 3,
                                        lineHeight: 1.6,
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }}>
                                        {t('home.academicJourneyDesc')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mb: 3 }}>
                                        {[t('home.clearDirection'), t('home.informedDecisions'), t('home.careerConfidence'), t('home.futureSuccess')].map((feature, index) => (
                                            <Chip
                                                key={index}
                                                label={feature}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${theme.palette.info.main}20`,
                                                    color: theme.palette.info.main,
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        fontStyle: 'italic',
                                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                                    }}>
                                        {t('home.quote')}
                                    </Typography>
                                </Box>
                            </StepContent>
                        </Step>
                    </Stepper>
                </Container>
            </Box>

            {/* Journey Services Section */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8, md: 10 }, px: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: { xs: 6, sm: 8, md: 10 } }}>
                    <Chip
                        label={t('home.journeyTools')}
                        sx={{
                            backgroundColor: `${theme.palette.primary.main}20`,
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            mb: { xs: 3, sm: 4 },
                            fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                            px: { xs: 2, sm: 3, md: 4 },
                            py: { xs: 1, sm: 1.25, md: 1.5 }
                        }}
                    />
                    <Typography variant="h2" component="h2" gutterBottom sx={{
                        fontWeight: 800,
                        color: theme.palette.text.primary,
                        mb: { xs: 2, sm: 3 },
                        fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                    }}>
                        {t('home.twoPowerfulTools')}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{
                        maxWidth: 700,
                        mx: 'auto',
                        lineHeight: 1.6,
                        fontWeight: 400,
                        fontSize: { xs: '0.95rem', sm: '1.125rem', md: '1.25rem' },
                        px: { xs: 2, sm: 0 }
                    }}>
                        {t('home.twoPowerfulToolsDesc')}
                    </Typography>
                </Box>

                <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} alignItems="stretch" justifyContent="center">
                    {/* Free Personality Test */}
                    <Grid item xs={12} sm={6} lg={4}>
                        <Fade in timeout={1000}>
                            <Card
                                elevation={8}
                                sx={{
                                    height: '100%',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transform: 'translateY(0)',
                                    transition: 'transform 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: theme.shadows[12]
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -50,
                                        right: -50,
                                        width: 100,
                                        height: 100,
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%'
                                    }
                                }}
                            >
                                <CardContent sx={{
                                    p: { xs: 3, sm: 4, md: 5 },
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: { xs: 3, sm: 4 },
                                        flexDirection: { xs: 'column', sm: i18n.language === 'ar' ? 'row-reverse' : 'row' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                    }}>
                                        <Avatar sx={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            mr: { xs: 0, sm: i18n.language === 'ar' ? 0 : 3 },
                                            ml: { xs: 0, sm: i18n.language === 'ar' ? 3 : 0 },
                                            mb: { xs: 2, sm: 0 },
                                            width: { xs: 60, sm: 70 },
                                            height: { xs: 60, sm: 70 },
                                            animation: 'pulse 2s infinite'
                                        }}>
                                            <Psychology sx={{ fontSize: { xs: 30, sm: 36 } }} />
                                        </Avatar>
                                        <Box sx={{ textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' } }}>
                                            <Typography variant="h5" component="h3" sx={{
                                                fontWeight: 700,
                                                mb: 1.5,
                                                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                                            }}>
                                                {t('home.step1')}
                                            </Typography>
                                            <Chip
                                                label={t('home.freeStartHere')}
                                                sx={{
                                                    backgroundColor: theme.palette.success.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body1" sx={{
                                        mb: { xs: 3, sm: 4 },
                                        lineHeight: 1.7,
                                        flexGrow: 1,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                    }}>
                                        {t('home.step1CardDesc')}
                                    </Typography>

                                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            mb: 3,
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                            textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                        }}>{t('home.journeyBeginsWith')}</Typography>
                                        {[
                                            t('home.personalityAnalysis'),
                                            t('home.detailedBreakdown'),
                                            t('home.foundationForMatching')
                                        ].map((feature, index) => (
                                            <Box key={index} sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 1.5,
                                                flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row'
                                            }}>
                                                <CheckCircle sx={{
                                                    fontSize: { xs: 20, sm: 24 },
                                                    mr: i18n.language === 'ar' ? 0 : 2,
                                                    ml: i18n.language === 'ar' ? 2 : 0,
                                                    color: theme.palette.success.light
                                                }} />
                                                <Typography variant="body2" sx={{
                                                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                                                    textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                                }}>{feature}</Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={() => navigate('/personality-test')}
                                        startIcon={<PlayArrow />}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            color: 'white',
                                            py: { xs: 2, sm: 2.5 },
                                            fontSize: { xs: '1rem', sm: '1.05rem', md: '1.125rem' },
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                transform: 'scale(1.02)'
                                            }
                                        }}
                                    >
                                        {t('home.beginJourney')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Fade>
                    </Grid>

                    {/* Premium Major Match */}
                    <Grid item xs={12} sm={6} lg={4}>
                        <Fade in timeout={1500}>
                            <Card
                                elevation={8}
                                sx={{
                                    height: '100%',
                                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transform: 'translateY(0)',
                                    transition: 'transform 0.3s ease-in-out',
                                    opacity: hasMbti ? 1 : 0.7,
                                    '&:hover': {
                                        transform: hasMbti ? 'translateY(-8px)' : 'none',
                                        boxShadow: hasMbti ? theme.shadows[12] : theme.shadows[6]
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -50,
                                        right: -50,
                                        width: 100,
                                        height: 100,
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%'
                                    }
                                }}
                            >
                                <CardContent sx={{
                                    p: { xs: 3, sm: 4, md: 5 },
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: { xs: 3, sm: 4 },
                                        flexDirection: { xs: 'column', sm: i18n.language === 'ar' ? 'row-reverse' : 'row' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                    }}>
                                        <Avatar sx={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            mr: { xs: 0, sm: i18n.language === 'ar' ? 0 : 3 },
                                            ml: { xs: 0, sm: i18n.language === 'ar' ? 3 : 0 },
                                            mb: { xs: 2, sm: 0 },
                                            width: { xs: 60, sm: 70 },
                                            height: { xs: 60, sm: 70 },
                                            animation: hasMbti ? 'pulse 2s infinite' : 'none'
                                        }}>
                                            <School sx={{ fontSize: { xs: 30, sm: 36 } }} />
                                        </Avatar>
                                        <Box sx={{ textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' } }}>
                                            <Typography variant="h5" component="h3" sx={{
                                                fontWeight: 700,
                                                mb: 1.5,
                                                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                                            }}>
                                                {t('home.step2')}
                                            </Typography>
                                            <Chip
                                                label={hasMbti ? t('home.premiumReady') : t('home.premiumLocked')}
                                                sx={{
                                                    backgroundColor: hasMbti ? theme.palette.warning.main : theme.palette.grey[500],
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body1" sx={{
                                        mb: { xs: 3, sm: 4 },
                                        lineHeight: 1.7,
                                        flexGrow: 1,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                    }}>
                                        {hasMbti
                                            ? t('home.step2CardDescActive')
                                            : t('home.step2CardDescInactive')
                                        }
                                    </Typography>

                                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            mb: 3,
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                            textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                        }}>
                                            {hasMbti ? t('home.journeyContinuesWith') : t('home.unlockFeatures')}
                                        </Typography>
                                        {[
                                            t('home.comprehensiveAnalysis'),
                                            t('home.universityMatches'),
                                            t('home.careerPathway'),
                                            t('home.salaryInsights'),
                                            t('home.personalRoadmap'),
                                            t('home.industryGuidance'),
                                            t('home.futureOpportunities')
                                        ].map((feature, index) => (
                                            <Box key={index} sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 1.5,
                                                flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row'
                                            }}>
                                                <CheckCircle sx={{
                                                    fontSize: { xs: 20, sm: 24 },
                                                    mr: i18n.language === 'ar' ? 0 : 2,
                                                    ml: i18n.language === 'ar' ? 2 : 0,
                                                    color: hasMbti ? theme.palette.warning.light : theme.palette.grey[400]
                                                }} />
                                                <Typography variant="body2" sx={{
                                                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                                                    opacity: hasMbti ? 1 : 0.6,
                                                    textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                                }}>{feature}</Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Tooltip title={t('home.completeTestFirst')} disableHoverListener={hasMbti}>
                                        <span>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                size="large"
                                                onClick={() => navigate('/major-matching-test')}
                                                startIcon={i18n.language === 'ar' ? undefined : (hasMbti ? <ArrowForward /> : <Lock />)}
                                                endIcon={i18n.language === 'ar' ? (hasMbti ? <ArrowBack /> : <Lock />) : undefined}
                                                sx={{
                                                    backgroundColor: hasMbti ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '2px solid rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    py: { xs: 2, sm: 2.5 },
                                                    fontSize: { xs: '1rem', sm: '1.05rem', md: '1.125rem' },
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        backgroundColor: hasMbti ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                                                        transform: hasMbti ? 'scale(1.02)' : 'none'
                                                    }
                                                }}
                                                disabled={!hasMbti}
                                            >
                                                {hasMbti ? t('home.continueJourney') : t('home.completeStep1First')}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        </Fade>
                    </Grid>

                    {/* AI Counselor */}
                    <Grid item xs={12} sm={6} lg={4}>
                        <Fade in timeout={2000}>
                            <Card
                                elevation={8}
                                sx={{
                                    height: '100%',
                                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transform: 'translateY(0)',
                                    transition: 'transform 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: theme.shadows[12]
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -50,
                                        right: -50,
                                        width: 100,
                                        height: 100,
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%'
                                    }
                                }}
                            >
                                <CardContent sx={{
                                    p: { xs: 3, sm: 4, md: 5 },
                                    pr: i18n.language === 'ar' ? { xs: 4, sm: 5, md: 6 } : { xs: 3, sm: 4, md: 5 },
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: { xs: 3, sm: 4 },
                                        flexDirection: i18n.language === 'ar'
                                            ? { xs: 'row-reverse', sm: 'row-reverse' }
                                            : { xs: 'column', sm: 'row' },
                                        textAlign: i18n.language === 'ar'
                                            ? { xs: 'right', sm: 'right' }
                                            : { xs: 'center', sm: 'left' }
                                    }}>
                                        <Avatar sx={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            mr: i18n.language === 'ar'
                                                ? { xs: 0, sm: 0 }
                                                : { xs: 0, sm: 3 },
                                            ml: i18n.language === 'ar'
                                                ? { xs: 2, sm: 3 }
                                                : { xs: 0, sm: 0 },
                                            mb: i18n.language === 'ar'
                                                ? { xs: 0, sm: 0 }
                                                : { xs: 2, sm: 0 },
                                            width: { xs: 60, sm: 70 },
                                            height: { xs: 60, sm: 70 },
                                            animation: 'pulse 2s infinite',
                                            flexShrink: 0
                                        }}>
                                            <SupportAgent sx={{ fontSize: { xs: 30, sm: 36 } }} />
                                        </Avatar>
                                        <Box sx={{
                                            textAlign: i18n.language === 'ar'
                                                ? { xs: 'right', sm: 'right' }
                                                : { xs: 'center', sm: 'left' },
                                            flex: 1
                                        }}>
                                            <Typography variant="h5" component="h3" sx={{
                                                fontWeight: 700,
                                                mb: 1.5,
                                                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                                            }}>
                                                {t('home.step3')}
                                            </Typography>
                                            <Chip
                                                label={t('home.premiumAIPowered')}
                                                sx={{
                                                    backgroundColor: theme.palette.info.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body1" sx={{
                                        mb: { xs: 3, sm: 4 },
                                        lineHeight: 1.7,
                                        flexGrow: 1,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: i18n.language === 'ar'
                                            ? { xs: 'right', sm: 'right' }
                                            : { xs: 'center', sm: 'left' }
                                    }}>
                                        {t('home.step3CardDesc')}
                                    </Typography>

                                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            mb: 3,
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                            textAlign: i18n.language === 'ar'
                                                ? { xs: 'right', sm: 'right' }
                                                : { xs: 'center', sm: 'left' }
                                        }}>{t('home.journeyCompletesWith')}</Typography>
                                        {[
                                            t('home.aiCareerCounseling'),
                                            t('home.personalizedGuidance'),
                                            t('home.expertAdvice')
                                        ].map((feature, index) => (
                                            <Box key={index} sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                mb: 1.5,
                                                flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row',
                                                textAlign: i18n.language === 'ar' ? 'right' : 'left'
                                            }}>
                                                <CheckCircle sx={{
                                                    fontSize: { xs: 20, sm: 24 },
                                                    mr: i18n.language === 'ar' ? 0 : 2,
                                                    ml: i18n.language === 'ar' ? 2 : 0,
                                                    mt: 0.5,
                                                    color: theme.palette.success.light,
                                                    flexShrink: 0
                                                }} />
                                                <Typography variant="body2" sx={{
                                                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                                                    textAlign: i18n.language === 'ar'
                                                        ? { xs: 'right', sm: 'right' }
                                                        : { xs: 'center', sm: 'left' },
                                                    flex: 1
                                                }}>{feature}</Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={() => navigate('/chat')}
                                        startIcon={<SupportAgent />}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            color: 'white',
                                            py: { xs: 2, sm: 2.5 },
                                            fontSize: { xs: '1rem', sm: '1.05rem', md: '1.125rem' },
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                transform: 'scale(1.02)'
                                            }
                                        }}
                                    >
                                        {t('home.startAICounseling')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Fade>
                    </Grid>
                </Grid>
            </Container>

            {/* Features Section */}
            <Box sx={{ backgroundColor: theme.palette.grey[50], py: { xs: 6, sm: 8, md: 10 } }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 6, sm: 8, md: 10 } }}>
                        <Typography variant="h2" component="h2" gutterBottom sx={{
                            fontWeight: 800,
                            color: theme.palette.text.primary,
                            mb: { xs: 2, sm: 3 },
                            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                        }}>
                            {t('home.whyChoose')}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{
                            maxWidth: 600,
                            mx: 'auto',
                            lineHeight: 1.6,
                            fontSize: { xs: '0.95rem', sm: '1.125rem', md: '1.25rem' },
                            px: { xs: 2, sm: 0 }
                        }}>
                            {t('home.whyChooseDesc')}
                        </Typography>
                    </Box>

                    <Grid container spacing={{ xs: 3, sm: 4 }} alignItems="stretch" justifyContent="center">
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Box sx={{ textAlign: 'center', p: { xs: 3, sm: 4 }, height: '100%' }}>
                                    <Avatar
                                        sx={{
                                            backgroundColor: feature.color,
                                            width: { xs: 60, sm: 70, md: 80 },
                                            height: { xs: 60, sm: 70, md: 80 },
                                            mx: 'auto',
                                            mb: { xs: 3, sm: 4 },
                                            boxShadow: `0 12px 24px ${feature.color}40`
                                        }}
                                    >
                                        {React.cloneElement(feature.icon, { sx: { fontSize: { xs: 30, sm: 35, md: 40 } } })}
                                    </Avatar>
                                    <Typography variant="h5" component="h3" gutterBottom sx={{
                                        fontWeight: 700,
                                        color: theme.palette.text.primary,
                                        mb: 2,
                                        fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
                                    }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{
                                        lineHeight: 1.6,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }
                                    }}>
                                        {feature.description}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>



            {/* Journey CTA Section */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    py: { xs: 6, sm: 8, md: 12 },
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
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
                <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
                    <Fade in timeout={1000}>
                        <Box>
                            <Box sx={{
                                fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
                                mb: { xs: 3, sm: 4 },
                                animation: 'bounce 2s infinite',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                            }}>
                                🚀
                            </Box>
                            <Typography variant="h2" component="h2" gutterBottom sx={{
                                fontWeight: 800,
                                mb: { xs: 2, sm: 3 },
                                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                            }}>
                                {t('home.journeyAwaits')}
                            </Typography>
                            <Typography variant="h6" sx={{
                                mb: { xs: 4, sm: 5, md: 6 },
                                opacity: 0.95,
                                lineHeight: 1.6,
                                maxWidth: '85%',
                                mx: 'auto',
                                fontWeight: 400,
                                fontSize: { xs: '0.95rem', sm: '1.125rem', md: '1.25rem' },
                                px: { xs: 2, sm: 0 }
                            }}>
                                {t('home.journeyAwaitsDesc')}
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                gap: { xs: 3, sm: 4 },
                                justifyContent: 'center',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                maxWidth: { xs: '100%', sm: '600px' },
                                mx: 'auto'
                            }}>
                                <Slide direction="up" in timeout={1500}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => navigate('/personality-test')}
                                        startIcon={<PlayArrow />}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            color: 'white',
                                            py: { xs: 2.5, sm: 3 },
                                            px: { xs: 4, sm: 6 },
                                            fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                                            fontWeight: 700,
                                            borderRadius: 3,
                                            width: { xs: '100%', sm: 'auto' },
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                transform: 'translateY(-3px)',
                                                boxShadow: theme.shadows[12]
                                            },
                                        }}
                                    >
                                        {hasMbti ? t('home.continueJourney') : t('home.startJourney')}
                                    </Button>
                                </Slide>

                                <Slide direction="up" in timeout={2000}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => navigate('/signup')}
                                        startIcon={<TrendingUp />}
                                        sx={{
                                            borderColor: 'rgba(255,255,255,0.5)',
                                            borderWidth: '2px',
                                            color: 'white',
                                            py: { xs: 2.5, sm: 3 },
                                            px: { xs: 4, sm: 6 },
                                            fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                                            fontWeight: 700,
                                            borderRadius: 3,
                                            width: { xs: '100%', sm: 'auto' },
                                            '&:hover': {
                                                borderColor: 'white',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                transform: 'translateY(-3px)',
                                                borderWidth: '2px',
                                            },
                                        }}
                                    >
                                        {t('home.createAccount')}
                                    </Button>
                                </Slide>
                            </Box>

                            <Fade in timeout={2500}>
                                <Box sx={{ mt: 6, opacity: 0.8 }}>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                        "Every expert was once a beginner. Every pro was once an amateur. Every icon was once an unknown."
                                        <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                                            Your journey to success starts with a single step.
                                        </Box>
                                    </Typography>
                                </Box>
                            </Fade>
                        </Box>
                    </Fade>
                </Container>
            </Box>
        </Box>
    );
};

export default Home; 