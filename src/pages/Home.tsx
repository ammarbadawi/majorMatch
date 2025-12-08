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
    CircularProgress,
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

const Home: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [hasPersonality, setHasPersonality] = useState<boolean>(() => {
        try { return localStorage.getItem('hasPersonality') === '1'; } catch { return false; }
    });
    const [studentCount, setStudentCount] = useState<string>('50K+');
    const [ctaLoading, setCtaLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            try {
                const res = await fetch('/api/personality/latest', { credentials: 'include' });
                if (!cancelled) {
                    if (res.ok) {
                        const data = await res.json();
                        const has = Boolean(data?.hasResult);
                        setHasPersonality(has);
                        try { if (has) localStorage.setItem('hasPersonality', '1'); } catch { }
                    } else {
                        setHasPersonality(false);
                    }
                }
            } catch {
                if (!cancelled) setHasPersonality(false);
            }
        };
        check();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const onPersonality = () => setHasPersonality(true);
        window.addEventListener('personality-completed', onPersonality);
        return () => window.removeEventListener('personality-completed', onPersonality);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats/summary', { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) {
                    const count = Number(data?.userCount);
                    if (Number.isFinite(count) && count >= 0) {
                        setStudentCount(count.toLocaleString());
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    console.warn('[Home] Failed to load stats summary', error);
                }
            }
        };

        fetchStats();
        const interval = window.setInterval(fetchStats, 5 * 60 * 1000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);



    const stats = [
        { number: '32', label: t('home.stats.personalityTypes'), icon: <Psychology /> },
        { number: studentCount, label: t('home.stats.studentsHelped'), icon: <Groups /> },
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

    // Shared styling to keep Journey Tools buttons consistent in size/shape
    const journeyButtonBaseSx = {
        mt: 'auto',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.2)',
        color: 'white',
        fontSize: { xs: '1rem', sm: '1.05rem', md: '1.125rem' },
        fontWeight: 700,
        borderRadius: 2,
        height: { xs: 64, sm: 68, md: 72 },
        minHeight: { xs: 64, sm: 68, md: 72 },
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1.4,
        textAlign: 'center',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        boxSizing: 'border-box',
        px: { xs: 2, sm: 3 }
    } as const;

    const handleStartJourney = async () => {
        if (ctaLoading) return;
        if (!hasPersonality) {
            navigate('/personality-test');
            return;
        }
        setCtaLoading(true);
        try {
            const latestRes = await fetch('/api/personality/latest', { credentials: 'include' });
            if (!latestRes.ok) {
                navigate('/personality-test');
                return;
            }
            const latest = await latestRes.json();
            if (!latest?.type) {
                navigate('/personality-test');
                return;
            }
            const personalityRes = await fetch(`/api/personality/${encodeURIComponent(latest.type)}`, { credentials: 'include' });
            if (!personalityRes.ok) {
                navigate('/personality-test');
                return;
            }
            const personalityData = await personalityRes.json();
            navigate('/personality-results', {
                state: {
                    personalityType: latest.type,
                    personalityData
                }
            });
        } catch (error) {
            console.error('[Home] Unable to redirect to personality results:', error);
            navigate('/personality-test');
        } finally {
            setCtaLoading(false);
        }
    };



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
                                    onClick={handleStartJourney}
                                    startIcon={ctaLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                                    disabled={ctaLoading}
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
                                    {hasPersonality ? t('home.continueJourney') : t('home.startJourney')}
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
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                startIcon={<PlayArrow />}
                                                onClick={() => navigate('/personality-test')}
                                                sx={{
                                                    mt: 'auto',
                                                    borderRadius: 999,
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    py: { xs: 1.5, sm: 2 },
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255,255,255,0.3)',
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                {t('home.startAssessment')}
                                            </Button>
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
                                                opacity: hasPersonality ? 1 : 0.6,
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
                                            <Tooltip title={t('home.completeTestFirst')} disableHoverListener={hasPersonality}>
                                                <Box component="span" sx={{ width: '100%', mt: 'auto' }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        disabled={!hasPersonality}
                                                        startIcon={<School />}
                                                        onClick={() => navigate('/major-matching-test')}
                                                        sx={{
                                                            borderRadius: 999,
                                                            fontWeight: 700,
                                                            color: hasPersonality ? 'white' : 'rgba(255,255,255,0.7)',
                                                            backgroundColor: hasPersonality ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                                            py: { xs: 1.5, sm: 2 },
                                                            '&:hover': {
                                                                backgroundColor: hasPersonality ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
                                                            }
                                                        }}
                                                    >
                                                        {hasPersonality ? t('home.startMajorMatching') : t('home.completeStep1First')}
                                                    </Button>
                                                </Box>
                                            </Tooltip>
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
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                startIcon={<SupportAgent />}
                                                onClick={() => navigate('/chat')}
                                                sx={{
                                                    mt: 'auto',
                                                    borderRadius: 999,
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    py: { xs: 1.5, sm: 2 },
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255,255,255,0.3)',
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                {t('home.startAICounseling')}
                                            </Button>
                                        </Card>
                                    </Slide>
                                </Grid>


                            </Grid>
                        </Box>
                    </Fade>
                </Container>
            </Box>

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
                        <Step active={hasPersonality} completed={false} expanded>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Avatar sx={{
                                        backgroundColor: hasPersonality ? theme.palette.secondary.main : theme.palette.grey[400],
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
                                        color: hasPersonality ? theme.palette.text.primary : theme.palette.text.disabled
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
                                        {[
                                            isAr ? 'تحليل مميز' : t('home.premiumAnalysis'),
                                            isAr ? 'تطابق التخصصات' : 'Major matches',
                                            isAr ? 'مسارات مهنية' : t('home.careerPathways'),
                                            isAr ? 'تحليلات مخصصة' : 'Personalized breakdowns'
                                        ].map((feature, index) => (
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
                                    <Tooltip title={t('home.completeTestFirst')} disableHoverListener={hasPersonality}>
                                        <span>
                                            <Button
                                                variant="contained"
                                                onClick={() => navigate('/major-matching-test')}
                                                startIcon={<School />}
                                                disabled={!hasPersonality}
                                                size={window.innerWidth < 600 ? 'small' : 'medium'}
                                                sx={{
                                                    backgroundColor: hasPersonality ? theme.palette.secondary.main : theme.palette.grey[400],
                                                    '&:hover': {
                                                        backgroundColor: hasPersonality ? theme.palette.secondary.dark : theme.palette.grey[400]
                                                    }
                                                }}
                                            >
                                                {hasPersonality ? t('home.startMajorMatching') : t('home.completeStep1First')}
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



                                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mb: 3 }}>
                                        {[
                                            isAr ? 'مستشار الذكاء الاصطناعي' : 'AI Counselor',
                                            t('home.careerPlanning'),
                                            t('home.ongoingSupport'),
                                            t('home.industryInsights'),
                                            t('home.strategicPlanning')
                                        ].map((feature, index) => (
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
                        {t('home.threePowerfulTools')}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{
                        maxWidth: 700,
                        mx: 'auto',
                        lineHeight: 1.6,
                        fontWeight: 400,
                        fontSize: { xs: '0.95rem', sm: '1.125rem', md: '1.25rem' },
                        px: { xs: 2, sm: 0 }
                    }}>
                        {t('home.threePowerfulToolsDesc')}
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
                                    zIndex: 1,
                                    gap: { xs: 2, sm: 3 }
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
                                                {isAr ? 'الخطوة 1: اكتشف نفسك' : 'Step 1: Discover Yourself'}
                                            </Typography>
                                            <Chip
                                                label={isAr ? 'مجاني • ابدأ هنا' : 'FREE • START HERE'}
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
                                        mb: 2,
                                        lineHeight: 1.7,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                    }}>
                                        {isAr
                                            ? 'ابدأ برحلتنا القصصية المكونة من 60 سؤالاً للشخصية. إجاباتك توصلك إلى واحدة من 32 شخصية من Major Match.'
                                            : 'Start with our story-driven 60-question personality journey. Your choices match you to 1 of 32 Major Match personalities.'}
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        mb: { xs: 3, sm: 4 },
                                        lineHeight: 1.7,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                    }}>
                                        {isAr
                                            ? 'ستحصل على ملف واضح يشرح كيف تفكر وتتعلم وتتخذ القرارات — صُمم بالكامل بواسطة Major Match. هذا الناتج يصبح الأساس لتوصياتك في الخطوة 2.'
                                            : 'You’ll receive a clear profile of how you think, learn, and make decisions—built entirely by Major Match. This result becomes the foundation for your recommendations in Step 2.'}
                                    </Typography>

                                    <Box sx={{ mb: { xs: 3, sm: 4 }, flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            mb: 2,
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                            textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                        }}>
                                            {isAr ? 'تبدأ رحلتك بـ:' : 'Your journey begins with:'}
                                        </Typography>
                                        {[
                                            isAr ? 'واحدة من 32 شخصية من Major Match' : 'Your 1 of 32 Major Match personalities',
                                            isAr ? 'تفصيل شخصي لنقاط قوتك وميولك' : 'A personalized breakdown of your strengths and tendencies',
                                            isAr ? 'أساس يبني عليه تطابق التخصصات' : 'A foundation that powers major matching'
                                        ].map((feature, index) => (
                                            <Box key={index} sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 1.25,
                                                flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row'
                                            }}>
                                                <CheckCircle sx={{
                                                    fontSize: { xs: 20, sm: 22 },
                                                    mr: i18n.language === 'ar' ? 0 : 2,
                                                    ml: i18n.language === 'ar' ? 2 : 0,
                                                    color: theme.palette.success.light
                                                }} />
                                                <Typography variant="body2" sx={{
                                                    fontSize: { xs: '0.88rem', sm: '0.95rem', md: '1rem' },
                                                    textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                                }}>
                                                    {feature}
                                                </Typography>
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
                                            ...journeyButtonBaseSx,
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                transform: 'scale(1.02)'
                                            }
                                        }}
                                    >
                                        {isAr ? 'ابدأ رحلتك' : 'Begin Your Journey'}
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
                                    opacity: hasPersonality ? 1 : 0.7,
                                    '&:hover': {
                                        transform: hasPersonality ? 'translateY(-8px)' : 'none',
                                        boxShadow: hasPersonality ? theme.shadows[12] : theme.shadows[6]
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
                                    zIndex: 1,
                                    gap: { xs: 2, sm: 3 }
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
                                            animation: hasPersonality ? 'pulse 2s infinite' : 'none'
                                        }}>
                                            <School sx={{ fontSize: { xs: 30, sm: 36 } }} />
                                        </Avatar>
                                        <Box sx={{ textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' } }}>
                                            <Typography variant="h5" component="h3" sx={{
                                                fontWeight: 700,
                                                mb: 1.5,
                                                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                                            }}>
                                                {isAr ? 'الخطوة 2: اختر تخصصك' : 'Step 2: Find Your Major'}
                                            </Typography>
                                            <Chip
                                                label={
                                                    hasPersonality
                                                        ? (isAr ? 'بريميوم • جاهز' : 'PREMIUM • READY')
                                                        : (isAr ? 'بريميوم • مقفل' : 'PREMIUM • LOCKED')
                                                }
                                                sx={{
                                                    backgroundColor: hasPersonality ? theme.palette.warning.main : theme.palette.grey[500],
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Typography variant="body1" sx={{
                                        lineHeight: 1.7,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' },
                                        mb: 2
                                    }}>
                                        {isAr
                                            ? 'افتح اختبار Major Match لتحصل على قائمة مرتبة بالتخصصات مع تقرير بريميوم كامل لكل منها — حتى لا ترى ما يناسبك فقط بل تفهم السبب.'
                                            : 'Unlock the Major Match Test to receive a ranked list of majors with a full, premium report for each one—so you don’t just see what matches you, you understand why.'}
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        lineHeight: 1.7,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' },
                                        mb: { xs: 3, sm: 4 }
                                    }}>
                                        {isAr
                                            ? 'تصلك النتائج كبطاقات تقرير للتخصصات تترجم شخصيتك واهتماماتك وثقتك الأكاديمية وقيمك إلى رؤى واضحة قابلة للتطبيق.'
                                            : 'Your results are presented as detailed Major Report Cards that translate your personality, interests, academic confidence, and values into clear insights you can actually use.'}
                                    </Typography>

                                    <Box sx={{ mb: { xs: 3, sm: 4 }, flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            mb: 2,
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                            textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                        }}>
                                            {isAr ? 'افتح هذه المزايا:' : 'Unlock these features:'}
                                        </Typography>
                                        {[
                                            isAr ? 'توصيات تخصصات مرتبة مع درجات الملاءمة ومستويات التطابق' : 'Ranked major recommendations with fit scores and match levels',
                                            isAr ? 'بطاقة تقرير كاملة لكل تخصص من التخصصات المتصدرة' : 'A full Major Report Card for every top major',
                                            isAr ? 'تفصيل واضح: ملخص الملاءمة الشخصية وأين تتوافق' : 'Clear breakdowns: Personal Fit Summary and Where You Connect',
                                            isAr ? 'ما ستدرسه: المواد الأساسية وعلامات التخصص' : 'What you’ll study: core subjects and major tags',
                                            isAr ? 'تخصصات فرعية / مسارات يمكنك التعمق فيها' : 'Specializations / child majors you can branch into',
                                            isAr ? 'مسارات مهنية وأدوار عمل ببيئات حقيقية' : 'Career paths and job roles with real work settings',
                                            isAr ? 'المهارات التي تكتسبها (تقنية + قابلة للنقل)' : 'Skills you gain (technical + transferable)',
                                            isAr ? 'لمحة دراسية واقعية: المدة، العبء، الصعوبة، والتدريب العملي' : 'A realistic study snapshot: duration, workload, difficulty, and practical training'
                                        ].map((feature, index) => (
                                            <Box key={index} sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 1.25,
                                                flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row'
                                            }}>
                                                <CheckCircle sx={{
                                                    fontSize: { xs: 20, sm: 22 },
                                                    mr: i18n.language === 'ar' ? 0 : 2,
                                                    ml: i18n.language === 'ar' ? 2 : 0,
                                                    color: hasPersonality ? theme.palette.warning.light : theme.palette.grey[400]
                                                }} />
                                                <Typography variant="body2" sx={{
                                                    fontSize: { xs: '0.88rem', sm: '0.95rem', md: '1rem' },
                                                    opacity: hasPersonality ? 1 : 0.65,
                                                    textAlign: { xs: 'center', sm: i18n.language === 'ar' ? 'right' : 'left' }
                                                }}>
                                                    {feature}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Tooltip title={isAr ? 'أكمل الخطوة 1 أولاً' : 'Complete Step 1 first'} disableHoverListener={hasPersonality}>
                                        <Box component="span" sx={{ width: '100%', mt: 'auto' }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                size="large"
                                                onClick={() => navigate('/major-matching-test')}
                                                startIcon={i18n.language === 'ar' ? undefined : (hasPersonality ? <ArrowForward /> : <Lock />)}
                                                endIcon={i18n.language === 'ar' ? (hasPersonality ? <ArrowBack /> : <Lock />) : undefined}
                                                sx={{
                                                    ...journeyButtonBaseSx,
                                                    backgroundColor: hasPersonality ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                                                    '&:hover': {
                                                        backgroundColor: hasPersonality ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                                                        transform: hasPersonality ? 'scale(1.02)' : 'none'
                                                    }
                                                }}
                                                disabled={!hasPersonality}
                                            >
                                                {hasPersonality ? (isAr ? 'ابدأ اختبار التخصص' : 'Start Major Match') : (isAr ? 'أكمل الخطوة 1 أولاً' : 'Complete Step 1 First')}
                                            </Button>
                                        </Box>
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
                                    zIndex: 1,
                                    gap: { xs: 2, sm: 3 }
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
                                                {isAr ? 'الخطوة 3: المستشار الذكي' : 'Step 3: AI Counselor'}
                                            </Typography>
                                            <Chip
                                                label={isAr ? 'بريميوم • مدعوم بالذكاء الاصطناعي' : 'PREMIUM • AI POWERED'}
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
                                        mb: 2,
                                        lineHeight: 1.7,
                                        flexGrow: 1,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: i18n.language === 'ar'
                                            ? { xs: 'right', sm: 'right' }
                                            : { xs: 'center', sm: 'left' }
                                    }}>
                                        {isAr
                                            ? 'أكمل رحلتك مع مستشار Major Mentor الذكي — دليلك الشخصي الذي يحول النتائج إلى قرارات واضحة. يساعدك على تفسير التخصصات وفهم دلالات النتائج واتخاذ قرار بثقة.'
                                            : 'Complete your journey with the Major Mentor AI Counselor—your private, personalized guide that turns your results into clear decisions. It helps you interpret your matches, understand what each result means, and choose confidently.'}
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        mb: { xs: 3, sm: 4 },
                                        lineHeight: 1.7,
                                        flexGrow: 1,
                                        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                        textAlign: i18n.language === 'ar'
                                            ? { xs: 'right', sm: 'right' }
                                            : { xs: 'center', sm: 'left' }
                                    }}>
                                        {isAr
                                            ? 'اسأل عن التخصصات والحياة الجامعية والمهارات والمسارات المهنية. ستحصل على إجابات مخصصة لملفك ونتائجك باللغتين العربية والإنجليزية.'
                                            : 'Ask anything about majors, university life, skills, and career paths. You’ll get responses tailored to your profile and results in English & Arabic.'}
                                    </Typography>

                                    <Box sx={{ mb: { xs: 3, sm: 4 }, flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            mb: 2,
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                            textAlign: i18n.language === 'ar'
                                                ? { xs: 'right', sm: 'right' }
                                                : { xs: 'center', sm: 'left' }
                                        }}>
                                            {isAr ? 'تكتمل رحلتك بـ:' : 'Your journey completes with:'}
                                        </Typography>
                                        {[
                                            isAr ? 'استكشاف موجه بالذكاء الاصطناعي بناءً على نتائجك وتفضيلاتك' : 'AI-guided exploration based on your results and preferences',
                                            isAr ? 'مقارنات مبنية على النتائج بين التخصصات الموصى بها' : 'Result-based comparisons between your top recommended majors',
                                            isAr ? 'تفسيرات أعمق لدرجاتك ونقاط قوتك وأسباب التطابق' : 'Deeper explanations of your scores, strengths, and fit reasons',
                                            isAr ? 'دعم فوري عند الطلب — بلا انتظار أو مواعيد' : 'On-demand support anytime—no waiting, no appointment needed'
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
                                                }}>
                                                    {feature}
                                                </Typography>
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
                                            ...journeyButtonBaseSx,
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                transform: 'scale(1.02)'
                                            }
                                        }}
                                    >
                                        {isAr ? 'ابدأ مع المستشار الذكي' : t('home.startAICounseling')}
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
                                        {hasPersonality ? t('home.continueJourney') : t('home.startJourney')}
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