import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    Box,
    LinearProgress,
    AppBar,
    Toolbar,
    IconButton,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    useTheme,
    useMediaQuery,
    Grid,
    Fade,
    Slide,
    Zoom,
    Grow,
    Divider,
    Avatar,
    Tooltip,
    Badge,
    Skeleton,
    Alert,
    AlertTitle
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import {
    ArrowBack,
    Psychology,
    ArrowForward,
    CheckCircle,
    Star,
    StarBorder,
    TrendingUp,
    Timer,
    Insights,
    Palette,
    Lightbulb,
    Speed,
    EmojiEvents,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';

interface Question {
    id: number;
    text: string;
    dimension: string;
    direction: string;
}

interface Answer {
    questionId: number;
    value: number | null;
}

// Advanced animations
const pulseAnimation = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
`;

const shimmerAnimation = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const floatAnimation = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
`;

const glowAnimation = keyframes`
    0%, 100% { box-shadow: 0 0 5px rgba(0,0,0,0.1); }
    50% { box-shadow: 0 0 20px rgba(0,0,0,0.2); }
`;

const PersonalityTest: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
    const [timeSpent, setTimeSpent] = useState(0);
    const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
    const [showInsights, setShowInsights] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // Load questions from backend
    useEffect(() => {
        // Ensure i18n is ready before fetching
        const timer = setTimeout(() => {
            fetchQuestions();
        }, 100); // Small delay to ensure i18n is initialized

        return () => clearTimeout(timer);
    }, [i18n.language]);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll to top when page changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentPage]);

    const fetchQuestions = async () => {
        try {
            const currentLang = i18n.language || 'en';
            const lang = currentLang === 'ar' ? 'ar' : 'en';
            console.log('[PersonalityTest] Loading questions with language:', lang, 'i18n.language:', i18n.language);
            const response = await fetch(`/api/questions?lang=${lang}`, { credentials: 'include' });
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to load questions');
            }
            const questionsData = await response.json();
            console.log('[PersonalityTest] Received questions:', questionsData.length, 'questions');
            console.log('[PersonalityTest] First question sample:', questionsData[0]);
            if (questionsData.length === 0) {
                console.warn('[PersonalityTest] No questions received from API!');
            }
            setQuestions(questionsData);
            // Initialize answers array
            setAnswers(questionsData.map((q: Question) => ({ questionId: q.id, value: null })));
        } catch (err) {
            setError('Failed to load questions. Please try again.');
            console.error('Error loading questions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChangeFor = (questionId: number, value: number, nextQuestionId?: number | null) => {
        const newAnswers = [...answers];
        const idx = newAnswers.findIndex(a => a.questionId === questionId);
        if (idx !== -1) {
            newAnswers[idx] = { questionId, value };
        }
        setAnswers(newAnswers);
        if (nextQuestionId) {
            window.requestAnimationFrame(() => {
                const target = questionRefs.current[nextQuestionId];
                target?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            });
        }
    };

    const registerQuestionRef = (questionId: number, node: HTMLDivElement | null) => {
        questionRefs.current[questionId] = node;
    };

    const QUESTIONS_PER_PAGE = 4;
    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE) || 0;

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            submitTest();
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const submitTest = async () => {
        setSubmitting(true);
        try {
            const filtered = answers.filter(a => a.value && a.value >= 1 && a.value <= 5);
            const currentLang = i18n.language || 'en';
            const lang = currentLang === 'ar' ? 'ar' : 'en';
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ answers: filtered, lang }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to calculate results');
            }

            const result = await response.json();
            // Mark personality test as completed locally for immediate UI enablement
            try {
                localStorage.setItem('hasPersonality', '1');
                window.dispatchEvent(new CustomEvent('personality-completed'));
            } catch { }
            // Navigate to results with the personality data
            navigate('/personality-results', {
                state: {
                    personalityType: result.type,
                    personalityData: result.personality
                }
            });
        } catch (err) {
            setError('Failed to submit test. Please try again.');
            console.error('Error submitting test:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const getAnswer = (questionId: number) => {
        return answers.find(a => a.questionId === questionId)?.value || null;
    };

    const getPageQuestions = () => {
        const start = currentPage * QUESTIONS_PER_PAGE;
        return questions.slice(start, start + QUESTIONS_PER_PAGE);
    };

    const isPageComplete = () => {
        const pageQs = getPageQuestions();
        return pageQs.every(q => {
            const val = getAnswer(q.id);
            return val !== null && val >= 1 && val <= 5;
        });
    };

    const getAnswerOptions = () => [
        {
            value: 1,
            label: t('personalityTest.stronglyDisagree'),
            color: theme.palette.error.main,
            description: t('personalityTest.stronglyDisagreeDesc')
        },
        {
            value: 2,
            label: t('personalityTest.disagree'),
            color: theme.palette.warning.main,
            description: t('personalityTest.disagreeDesc')
        },
        {
            value: 3,
            label: t('personalityTest.neutral'),
            color: theme.palette.grey[500],
            description: t('personalityTest.neutralDesc')
        },
        {
            value: 4,
            label: t('personalityTest.agree'),
            color: theme.palette.success.light,
            description: t('personalityTest.agreeDesc')
        },
        {
            value: 5,
            label: t('personalityTest.stronglyAgree'),
            color: theme.palette.success.main,
            description: t('personalityTest.stronglyAgreeDesc')
        }
    ];

    const getDimensionInfo = (dimension: string) => {
        const dimensionMap: { [key: string]: { color: string, icon: string } } = {
            'IE': {
                color: theme.palette.error.main,
                icon: '⚡'
            },
            'SN': {
                color: theme.palette.success.main,
                icon: '🔍'
            },
            'TF': {
                color: theme.palette.primary.main,
                icon: '⚖️'
            },
            'JP': {
                color: theme.palette.warning.main,
                icon: '📋'
            },
            'AT': {
                color: theme.palette.secondary.main,
                icon: '🎭'
            }
        };
        const dim = dimensionMap[dimension] || {
            color: theme.palette.grey[500],
            icon: '❓'
        };
        return {
            ...dim,
            name: t(`personalityTest.dimensions.${dimension}.name`, { defaultValue: t('personalityTest.dimensions.unknown.name') }),
            description: t(`personalityTest.dimensions.${dimension}.description`, { defaultValue: t('personalityTest.dimensions.unknown.description') })
        };
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.tertiary?.main || theme.palette.primary.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        animation: `${floatAnimation} 20s ease-in-out infinite`
                    }
                }}
            >
                <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
                    <Fade in={true} timeout={1000}>
                        <Paper
                            elevation={24}
                            sx={{
                                p: { xs: 4, md: 8 },
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 4,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                    animation: `${shimmerAnimation} 2s infinite`
                                }
                            }}
                        >
                            <Zoom in={true} timeout={1500}>
                                <Box>
                                    <Avatar
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            mx: 'auto',
                                            mb: 4,
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            animation: `${pulseAnimation} 2s ease-in-out infinite`,
                                            boxShadow: theme.shadows[8]
                                        }}
                                    >
                                        <Psychology sx={{ fontSize: 60 }} />
                                    </Avatar>

                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 800,
                                            color: theme.palette.text.primary,
                                            mb: 2,
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}
                                    >
                                        Preparing Your Journey
                                    </Typography>

                                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                                        Loading personalized personality questions...
                                    </Typography>

                                    <Box sx={{ position: 'relative', mb: 4 }}>
                                        <CircularProgress
                                            size={80}
                                            thickness={4}
                                            sx={{
                                                color: theme.palette.primary.main,
                                                animation: `${glowAnimation} 2s ease-in-out infinite`
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                animation: `${floatAnimation} 3s ease-in-out infinite`
                                            }}
                                        >
                                            <Insights sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                                        </Box>
                                    </Box>

                                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                                    </Stack>

                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        {t('personalityTest.quote')}
                                    </Typography>
                                </Box>
                            </Zoom>
                        </Paper>
                    </Fade>
                </Container>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
                    <Fade in={true} timeout={1000}>
                        <Alert
                            severity="error"
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: theme.shadows[8]
                            }}
                        >
                            <AlertTitle sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                {t('personalityTest.oops')}
                            </AlertTitle>
                            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                                {error}
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => window.location.reload()}
                                sx={{
                                    mt: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`
                                    }
                                }}
                            >
                                {t('personalityTest.tryAgain')}
                            </Button>
                        </Alert>
                    </Fade>
                </Container>
            </Box>
        );
    }

    if (questions.length === 0) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h6" textAlign="center">
                    {t('personalityTest.noQuestions')}
                </Typography>
            </Container>
        );
    }

    const pageQuestions = getPageQuestions();
    const answeredCount = answers.filter(a => a.value !== null && a.value >= 1 && a.value <= 5).length;
    const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;
    const answerOptions = getAnswerOptions();
    const timeSpentMinutes = Math.floor(timeSpent / 60);
    const timeSpentSeconds = timeSpent % 60;

    return (
        <Box ref={containerRef} sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50], position: 'relative' }}>
            {/* Advanced Header with Glassmorphism */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.95)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`
                }}
            >
                <Toolbar sx={{
                    py: { xs: 1, md: 2 },
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    rowGap: 1,
                    columnGap: 2
                }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/')}
                        sx={{
                            mr: { xs: 0, md: i18n.language === 'ar' ? 0 : 3 },
                            ml: { xs: 0, md: i18n.language === 'ar' ? 3 : 0 },
                            mb: { xs: 1, md: 0 },
                            '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'transform 0.2s ease-in-out'
                            }
                        }}
                    >
                        <ArrowBack sx={{ transform: i18n.language === 'ar' ? 'scaleX(-1)' : 'none' }} />
                    </IconButton>

                    <Avatar
                        sx={{
                            mr: { xs: 0, md: 2 },
                            mb: { xs: 1, md: 0 },
                            background: `linear-gradient(135deg, ${theme.palette.tertiary?.main || theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                            animation: `${pulseAnimation} 3s ease-in-out infinite`
                        }}
                    >
                        <Psychology />
                    </Avatar>

                    <Box sx={{ flexGrow: 1, width: { xs: '100%', md: 'auto' }, textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}>
                            {t('personalityTest.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                            {t('personalityTest.subtitle')}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-end' }, rowGap: 1 }}>
                        <Tooltip title={t('personalityTest.timeSpent')}>
                            <Chip
                                icon={<Timer />}
                                label={`${timeSpentMinutes}:${timeSpentSeconds.toString().padStart(2, '0')}`}
                                sx={{
                                    backgroundColor: alpha(theme.palette.common.white, 0.2),
                                    color: 'white',
                                    fontWeight: 700,
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }}
                                size={isXs ? 'small' : 'medium'}
                            />
                        </Tooltip>

                        <Chip
                            label={`${t('personalityTest.page')} ${currentPage + 1} / ${totalPages || 1}`}
                            sx={{
                                backgroundColor: alpha(theme.palette.common.white, 0.2),
                                color: 'white',
                                fontWeight: 700,
                                fontSize: { xs: '0.9rem', md: '1rem' },
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)'
                            }}
                            size={isXs ? 'small' : 'medium'}
                        />

                        <IconButton
                            onClick={() => setShowInsights(!showInsights)}
                            sx={{ color: 'white' }}
                        >
                            {showInsights ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </Stack>
                </Toolbar>

                {/* Enhanced Progress Bar */}
                <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: { xs: 'center', md: 'space-between' },
                        alignItems: 'center',
                        flexDirection: { xs: 'column', md: 'row' },
                        textAlign: 'center',
                        gap: { xs: 0.5, md: 0 },
                        mb: 1
                    }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            {Math.round(progress)}% {t('personalityTest.complete')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            ~{Math.ceil((questions.length - answeredCount) * 0.3)} {t('personalityTest.minRemaining')}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.common.white, 0.2),
                            '& .MuiLinearProgress-bar': {
                                background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.warning.main} 50%, ${theme.palette.primary.main} 100%)`,
                                borderRadius: 4,
                                boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`
                            }
                        }}
                    />
                </Box>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
                {/* Insights Panel */}
                {showInsights && (
                    <Slide direction="down" in={showInsights} timeout={500}>
                        <Paper
                            elevation={8}
                            sx={{
                                mb: 4,
                                p: 3,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                borderRadius: 3
                            }}
                        >
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                                <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {t('personalityTest.testInsights')}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                            {answeredCount}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('personalityTest.questionsAnswered')}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                                            {questions.length - answeredCount}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('personalityTest.remaining')}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                                            {Math.round(progress)}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('personalityTest.complete')}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary.main }}>
                                            {Math.ceil((questions.length - answeredCount) * 0.3)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('personalityTest.minLeft')}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Slide>
                )}

                {/* Main Test Card */}
                <Fade in={true} timeout={800}>
                    <Card
                        elevation={12}
                        sx={{
                            background: `linear-gradient(135deg, white 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.tertiary?.main || theme.palette.primary.light})`
                            }
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                                    {t('personalityTest.howWellDescribes')}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {t('personalityTest.beHonest')}
                                </Typography>
                            </Box>

                            {/* Enhanced Legend */}
                            <Paper
                                elevation={2}
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    mb: 4,
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.grey[100], 0.8)} 100%)`,
                                    borderRadius: 3
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
                                    {t('personalityTest.responseScale')}
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: { xs: 0.5, sm: 1, md: 2 },
                                    flexWrap: { xs: 'nowrap', sm: 'wrap' },
                                    overflowX: { xs: 'auto', sm: 'visible' },
                                    '&::-webkit-scrollbar': { display: 'none' },
                                    scrollbarWidth: 'none'
                                }}>
                                    {answerOptions.map((opt) => (
                                        <Box key={opt.value} sx={{
                                            flex: { xs: '1 1 0', sm: 'none' },
                                            minWidth: { xs: 0, sm: 'auto' },
                                            textAlign: 'center'
                                        }}>
                                            <Box
                                                sx={{
                                                    width: { xs: 32, sm: 40 },
                                                    height: { xs: 32, sm: 40 },
                                                    borderRadius: '50%',
                                                    border: `3px solid ${opt.color}`,
                                                    backgroundColor: alpha(opt.color, 0.1),
                                                    mx: 'auto',
                                                    mb: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: { xs: '0.9rem', sm: '1.2rem' },
                                                    fontWeight: 700,
                                                    color: opt.color,
                                                    transition: 'all 0.3s ease-in-out',
                                                    flexShrink: 0,
                                                    '&:hover': {
                                                        transform: 'scale(1.1)',
                                                        boxShadow: `0 0 20px ${alpha(opt.color, 0.3)}`
                                                    }
                                                }}
                                            >
                                                {opt.value}
                                            </Box>
                                            <Typography variant="caption" sx={{
                                                fontWeight: 700,
                                                display: 'block',
                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                lineHeight: 1.2
                                            }}>
                                                {opt.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{
                                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                                display: { xs: 'none', sm: 'block' }
                                            }}>
                                                {opt.description}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>

                            {/* Questions */}
                            <Grid container spacing={4}>
                                {pageQuestions.map((q, idx) => {
                                    const dim = getDimensionInfo(q.dimension);
                                    const qAnswer = getAnswer(q.id);
                                    const isAnswered = qAnswer !== null && qAnswer >= 1 && qAnswer <= 5;
                                    const isHovered = hoveredQuestion === q.id;
                                    const nextQuestionId = pageQuestions[idx + 1]?.id ?? null;

                                    return (
                                        <Grid key={q.id} item xs={12}>
                                            <Grow in={true} timeout={500 + idx * 100}>
                                                <Paper
                                                    ref={(el) => registerQuestionRef(q.id, el)}
                                                    elevation={isHovered ? 8 : isAnswered ? 6 : 2}
                                                    sx={{
                                                        p: { xs: 3, md: 4 },
                                                        borderRadius: 3,
                                                        scrollMarginTop: isXs ? 96 : 160,
                                                        background: isAnswered
                                                            ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`
                                                            : `linear-gradient(135deg, white 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`,
                                                        border: isAnswered
                                                            ? `2px solid ${alpha(theme.palette.success.main, 0.3)}`
                                                            : `1px solid ${alpha(theme.palette.grey[200], 0.5)}`,
                                                        transition: 'all 0.3s ease-in-out',
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&::before': isAnswered ? {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            height: 3,
                                                            background: `linear-gradient(90deg, ${dim.color}, ${alpha(dim.color, 0.7)})`
                                                        } : {},
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: theme.shadows[8]
                                                        }
                                                    }}
                                                    onMouseEnter={() => setHoveredQuestion(q.id)}
                                                    onMouseLeave={() => setHoveredQuestion(null)}
                                                >
                                                    {/* Question Header */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                mr: 2,
                                                                background: `linear-gradient(135deg, ${dim.color}, ${alpha(dim.color, 0.7)})`,
                                                                fontSize: '1rem'
                                                            }}
                                                        >
                                                            {dim.icon}
                                                        </Avatar>
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dim.color }}>
                                                                {dim.name} • {dim.description}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={`Q${currentPage * QUESTIONS_PER_PAGE + idx + 1}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: alpha(dim.color, 0.1),
                                                                color: dim.color,
                                                                fontWeight: 700
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Question Text */}
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 600,
                                                            mb: 3,
                                                            lineHeight: 1.6,
                                                            color: theme.palette.text.primary,
                                                            wordBreak: 'break-word',
                                                            direction: 'auto'
                                                        }}
                                                    >
                                                        {q.text}
                                                    </Typography>

                                                    {/* Answer Options */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        gap: { xs: 1, sm: 2 },
                                                        flexWrap: { xs: 'nowrap', sm: 'wrap' },
                                                        overflowX: { xs: 'auto', sm: 'visible' },
                                                        pb: { xs: 1, sm: 0 },
                                                        '&::-webkit-scrollbar': { display: 'none' },
                                                        scrollbarWidth: 'none'
                                                    }}>
                                                        {answerOptions.map((option) => {
                                                            const selected = qAnswer === option.value;
                                                            return (
                                                                <Tooltip key={option.value} title={option.description} placement="top">
                                                                    <Box
                                                                        onClick={() => handleAnswerChangeFor(q.id, option.value, nextQuestionId)}
                                                                        sx={{
                                                                            width: { xs: 40, sm: 50 },
                                                                            height: { xs: 40, sm: 50 },
                                                                            minWidth: { xs: 40, sm: 50 },
                                                                            flexShrink: 0,
                                                                            borderRadius: '50%',
                                                                            border: `3px solid ${option.color}`,
                                                                            backgroundColor: selected
                                                                                ? alpha(option.color, 0.2)
                                                                                : 'transparent',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.3s ease-in-out',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: { xs: '0.95rem', sm: '1.2rem' },
                                                                            fontWeight: 700,
                                                                            color: option.color,
                                                                            position: 'relative',
                                                                            '&:hover': {
                                                                                transform: 'scale(1.15)',
                                                                                boxShadow: `0 0 20px ${alpha(option.color, 0.4)}`,
                                                                                backgroundColor: alpha(option.color, 0.1)
                                                                            },
                                                                            ...(selected && {
                                                                                animation: `${pulseAnimation} 2s ease-in-out infinite`,
                                                                                boxShadow: `0 0 15px ${alpha(option.color, 0.5)}`
                                                                            })
                                                                        }}
                                                                    >
                                                                        {option.value}
                                                                        {selected && (
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: -5,
                                                                                    right: -5,
                                                                                    width: { xs: 18, sm: 20 },
                                                                                    height: { xs: 18, sm: 20 },
                                                                                    borderRadius: '50%',
                                                                                    backgroundColor: theme.palette.success.main,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                                                    color: 'white',
                                                                                    animation: `${pulseAnimation} 1s ease-in-out infinite`
                                                                                }}
                                                                            >
                                                                                ✓
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </Box>

                                                    {/* Completion Indicator */}
                                                    {isAnswered && (
                                                        <Fade in={true} timeout={500}>
                                                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                                                <Chip
                                                                    icon={<CheckCircle />}
                                                                    label={t('personalityTest.answered')}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: theme.palette.success.main,
                                                                        color: 'white',
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Fade>
                                                    )}
                                                </Paper>
                                            </Grow>
                                        </Grid>
                                    );
                                })}
                            </Grid>

                            {/* Navigation */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: { xs: 4, md: 6 },
                                flexDirection: { xs: 'column', sm: i18n.language === 'ar' ? 'row-reverse' : 'row' },
                                gap: { xs: 2, sm: 0 }
                            }}>
                                <Button
                                    variant="outlined"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 0 || submitting}
                                    startIcon={i18n.language === 'ar' ? undefined : <ArrowBack />}
                                    endIcon={i18n.language === 'ar' ? <ArrowBack sx={{ transform: 'scaleX(-1)' }} /> : undefined}
                                    fullWidth={isXs}
                                    sx={{
                                        py: { xs: 2, sm: 1.5 },
                                        px: { xs: 3, sm: 4 },
                                        minHeight: { xs: '48px', sm: 'auto' },
                                        fontSize: { xs: '1.1rem', sm: '1rem' },
                                        fontWeight: 700,
                                        borderWidth: '2px',
                                        borderRadius: { xs: 4, sm: 3 },
                                        textTransform: 'none',
                                        letterSpacing: { xs: '0.5px', sm: 'normal' },
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderWidth: '2px',
                                            transform: { xs: 'scale(0.98)', sm: i18n.language === 'ar' ? 'translateX(2px)' : 'translateX(-2px)' }
                                        },
                                        '&:active': {
                                            transform: { xs: 'scale(0.95)', sm: 'none' }
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 0.5
                                        }
                                    }}
                                >
                                    {t('personalityTest.previous')}
                                </Button>

                                <Box sx={{
                                    textAlign: 'center',
                                    display: { xs: 'none', sm: 'block' },
                                    width: { xs: '100%', sm: 'auto' }
                                }}>
                                    {isPageComplete() && (
                                        <Zoom in={true} timeout={500}>
                                            <Chip
                                                icon={<CheckCircle />}
                                                label={t('personalityTest.pageComplete')}
                                                sx={{
                                                    backgroundColor: theme.palette.success.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                                    px: { xs: 1.5, sm: 2 },
                                                    py: { xs: 0.75, sm: 1 }
                                                }}
                                            />
                                        </Zoom>
                                    )}
                                </Box>

                                {/* Mobile page complete indicator */}
                                {isPageComplete() && isXs && (
                                    <Box sx={{ width: '100%', display: { xs: 'block', sm: 'none' } }}>
                                        <Zoom in={true} timeout={500}>
                                            <Chip
                                                icon={<CheckCircle />}
                                                label={t('personalityTest.pageComplete')}
                                                sx={{
                                                    backgroundColor: theme.palette.success.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    px: 2,
                                                    py: 1,
                                                    width: '100%',
                                                    justifyContent: 'center'
                                                }}
                                            />
                                        </Zoom>
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    onClick={handleNextPage}
                                    disabled={!isPageComplete() || submitting}
                                    startIcon={i18n.language === 'ar' ? <ArrowForward sx={{ transform: 'scaleX(-1)' }} /> : undefined}
                                    endIcon={i18n.language === 'ar' ? undefined : (submitting ? <CircularProgress size={20} color="inherit" /> :
                                        currentPage === totalPages - 1 ? <EmojiEvents /> : <ArrowForward />)}
                                    fullWidth={isXs}
                                    sx={{
                                        py: { xs: 2, sm: 1.5 },
                                        px: { xs: 3, sm: 4 },
                                        minHeight: { xs: '48px', sm: 'auto' },
                                        fontSize: { xs: '1.1rem', sm: '1rem' },
                                        fontWeight: 700,
                                        borderRadius: { xs: 4, sm: 3 },
                                        textTransform: 'none',
                                        letterSpacing: { xs: '0.5px', sm: 'normal' },
                                        background: isPageComplete()
                                            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                                            : theme.palette.grey[300],
                                        boxShadow: isPageComplete() ? { xs: theme.shadows[6], sm: theme.shadows[4] } : 'none',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            background: isPageComplete()
                                                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                                                : theme.palette.grey[300],
                                            transform: { xs: 'translateY(-2px)', sm: i18n.language === 'ar' ? 'translateX(-2px)' : 'translateX(2px)' },
                                            boxShadow: isPageComplete() ? { xs: theme.shadows[10], sm: theme.shadows[8] } : 'none'
                                        },
                                        '&:active': {
                                            transform: { xs: 'translateY(0px) scale(0.98)', sm: 'none' }
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 0.5,
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {submitting ? t('personalityTest.processing') : currentPage === totalPages - 1 ? t('personalityTest.completeTest') : t('personalityTest.next')}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Fade>

                {/* Enhanced Progress Summary */}
                <Slide direction="up" in={true} timeout={1000}>
                    <Paper
                        elevation={6}
                        sx={{
                            mt: 4,
                            p: 3,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            borderRadius: 3
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>
                            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {t('personalityTest.progressOverview')}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                        {answeredCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {t('personalityTest.answered')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                                        {questions.length - answeredCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {t('personalityTest.remaining')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                                        {Math.round(progress)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {t('personalityTest.complete')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.info.main }}>
                                        {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, '0')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {t('personalityTest.timeSpent')}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Slide>
            </Container>
        </Box>
    );
};

export default PersonalityTest; 