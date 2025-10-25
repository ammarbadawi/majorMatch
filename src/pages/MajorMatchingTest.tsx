import React, { useEffect, useMemo, useState, useRef } from 'react';
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
    Paper,
    Chip,
    Avatar,
    Stack,
    Grid,
    useTheme,
    CircularProgress,
    Alert,
    Fade,
    Slide,
    Zoom,
    Grow,
    Divider,
    Tooltip,
    Badge,
    Skeleton,
    AlertTitle
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import {
    ArrowBack,
    School,
    AttachMoney,
    CheckCircle,
    ArrowForward,
    TrendingUp,
    Star,
    EmojiEvents,
    Psychology,
    Timer,
    Insights,
    Palette,
    Lightbulb,
    Speed,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import SubscriptionStatus from '../components/SubscriptionStatus';

interface Question {
    id: number;
    question: string;
    category: string;
    topic?: string | null;
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

const MajorMatchingTest: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
    const [currentPage, setCurrentPage] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [hasSubscription, setHasSubscription] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
    const [showInsights, setShowInsights] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkSubscriptionStatus();
    }, []);

    useEffect(() => {
        if (!showPaymentPrompt && hasSubscription) {
            checkMbtiThenLoad();
        }
    }, [showPaymentPrompt, hasSubscription]);

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

    const checkSubscriptionStatus = async () => {
        try {
            const response = await fetch('/api/subscription-status', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Subscription status response:', data);
                setHasSubscription(data.hasSubscription);
                if (data.hasSubscription) {
                    setShowPaymentPrompt(false);
                }
            }
        } catch (error) {
            console.error('Failed to check subscription status:', error);
        }
    };

    const checkMbtiThenLoad = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/personality/latest', { credentials: 'include' });
            if (res.status === 401) {
                navigate('/login');
                return;
            }
            if (res.status === 404) {
                // No personality test yet
                setError('You must complete the personality test before taking the major test.');
                return;
            }
            if (!res.ok) {
                throw new Error('Failed to verify MBTI status');
            }
            await loadQuestions();
        } catch (e: any) {
            setError(e.message || 'Failed to verify MBTI status');
        } finally {
            setLoading(false);
        }
    };

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/major/questions', {
                credentials: 'include'
            });
            console.log('Questions response status:', res.status);

            if (res.status === 401) {
                navigate('/login');
                return;
            }
            if (res.status === 402) {
                setError('Subscription required to access major test.');
                setShowPaymentPrompt(true);
                return;
            }
            if (res.status === 403) {
                setError('You must complete the personality test before taking the major test.');
                return;
            }
            if (!res.ok) throw new Error('Failed to load questions');
            const data = await res.json();
            console.log('Questions loaded successfully:', data.length, 'questions');
            setQuestions(data);
        } catch (e: any) {
            console.error('Error loading questions:', e);
            setError(e.message || 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const likertOptions = useMemo(() => ([
        {
            value: 'strongly disagree',
            label: 'Strongly Disagree',
            description: 'This doesn\'t describe me at all'
        },
        {
            value: 'disagree',
            label: 'Disagree',
            description: 'This rarely applies to me'
        },
        {
            value: 'neutral',
            label: 'Neutral',
            description: 'Sometimes this applies'
        },
        {
            value: 'agree',
            label: 'Agree',
            description: 'This often applies to me'
        },
        {
            value: 'strongly agree',
            label: 'Strongly Agree',
            description: 'This perfectly describes me'
        }
    ]), []);

    const getLikertColor = (value: string) => {
        const map: { [key: string]: string } = {
            'strongly disagree': theme.palette.error.main,
            'disagree': theme.palette.warning.main,
            'neutral': theme.palette.grey[500],
            'agree': theme.palette.success.light,
            'strongly agree': theme.palette.success.main
        };
        return map[value] || theme.palette.primary.main;
    };

    const QUESTIONS_PER_PAGE = 4;
    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE) || 0;

    const getPageQuestions = () => {
        const start = currentPage * QUESTIONS_PER_PAGE;
        return questions.slice(start, start + QUESTIONS_PER_PAGE);
    };

    const handleAnswerChangeFor = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const isPageComplete = () => {
        const pageQs = getPageQuestions();
        return pageQs.every(q => !!answers[q.id]);
    };

    const submitResults = async (allAnswers: { [key: number]: string }) => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/major/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answers: allAnswers })
            });

            console.log('Submit response status:', res.status);

            if (res.status === 401) {
                navigate('/login');
                return;
            }
            if (res.status === 403) {
                setError('You must complete the personality test before taking the major test.');
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Failed to calculate results' }));
                throw new Error(data.error || 'Failed to calculate results');
            }
            const data = await res.json();
            navigate('/major-matching-results', { state: { results: data.results } });
        } catch (e: any) {
            console.error('Error submitting results:', e);
            setError(e.message || 'Failed to calculate results');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            submitResults(answers);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleStartTest = () => {
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setShowPaymentPrompt(false);
        setHasSubscription(true);
        checkMbtiThenLoad();
    };

    const answeredCount = Object.keys(answers).length;
    const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;

    const getCategoryColor = (category: string) => {
        const colorMap: { [key: string]: string } = {
            'Interests': theme.palette.primary.main,
            'Skills': theme.palette.secondary.main,
            'Work Environment': theme.palette.success.main,
            'Career Goals': theme.palette.warning.main,
            'Learning Style': theme.palette.error.main,
            'Problem Solving': theme.palette.primary.light,
            'Subjects': theme.palette.secondary.light,
            'Values': theme.palette.success.light
        };
        return colorMap[category] || theme.palette.primary.main;
    };

    if (showPaymentPrompt) {
        return (
            <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50] }}>
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                        boxShadow: theme.shadows[4]
                    }}
                >
                    <Toolbar sx={{ py: 1 }}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => navigate('/')}
                            sx={{ mr: 3 }}
                        >
                            <ArrowBack />
                        </IconButton>
                        <School sx={{ mr: 2, fontSize: 32 }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Major Matching Test
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Find your perfect academic major
                            </Typography>
                        </Box>
                        <Chip
                            label="PREMIUM"
                            sx={{
                                backgroundColor: theme.palette.warning.main,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1rem',
                                px: 2
                            }}
                        />
                    </Toolbar>
                </AppBar>

                <Container maxWidth="md" sx={{ py: 8 }}>
                    <Paper
                        elevation={12}
                        sx={{
                            p: 8,
                            textAlign: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                mx: 'auto',
                                mb: 4,
                                backgroundColor: `${theme.palette.secondary.main}20`,
                                border: `4px solid ${theme.palette.secondary.main}30`
                            }}
                        >
                            <School sx={{ fontSize: 50, color: theme.palette.secondary.main }} />
                        </Avatar>

                        <Typography variant="h2" component="h1" gutterBottom sx={{
                            color: theme.palette.secondary.main,
                            fontWeight: 800,
                            mb: 2
                        }}>
                            Major Matching Test
                        </Typography>

                        <Chip
                            label="PREMIUM FEATURE"
                            sx={{
                                mb: 4,
                                backgroundColor: theme.palette.warning.main,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1rem',
                                px: 3,
                                py: 1
                            }}
                        />

                        <Typography variant="h5" gutterBottom sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            mb: 3
                        }}>
                            Discover Your Perfect Academic Major
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{
                            fontSize: '1.125rem',
                            lineHeight: 1.6,
                            mb: 6,
                            maxWidth: '80%',
                            mx: 'auto'
                        }}>
                            Our advanced assessment analyzes your interests, skills, and career goals
                            to provide personalized major recommendations with detailed insights.
                        </Typography>

                        <Grid container spacing={4} sx={{ mb: 6 }}>
                            <Grid xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Avatar sx={{
                                        backgroundColor: theme.palette.primary.main,
                                        width: 60,
                                        height: 60,
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        <Psychology sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        Dynamic Questions
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Comprehensive assessment
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Avatar sx={{
                                        backgroundColor: theme.palette.success.main,
                                        width: 60,
                                        height: 60,
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        <TrendingUp sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        AI-Powered
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Advanced analysis
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Avatar sx={{
                                        backgroundColor: theme.palette.warning.main,
                                        width: 60,
                                        height: 60,
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        <EmojiEvents sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        Detailed Results
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Personalized recommendations
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Stack spacing={2} sx={{ mb: 6 }}>
                            {[
                                'Comprehensive major compatibility analysis',
                                'University program recommendations',
                                'Career pathway mapping & salary insights',
                                'Detailed academic guidance & next steps'
                            ].map((feature, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle sx={{
                                        color: theme.palette.success.main,
                                        mr: 2,
                                        fontSize: 24
                                    }} />
                                    <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                        {feature}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AttachMoney />}
                                onClick={handleStartTest}
                                sx={{
                                    py: 2,
                                    px: 5,
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                                    boxShadow: theme.shadows[6],
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: theme.shadows[10]
                                    }
                                }}
                            >
                                Start Premium Test - $14.99 (One Time)
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => navigate('/')}
                                sx={{
                                    py: 2,
                                    px: 5,
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    borderWidth: '2px',
                                    '&:hover': {
                                        borderWidth: '2px'
                                    }
                                }}
                            >
                                Maybe Later
                            </Button>
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{
                            mt: 4,
                            display: 'block',
                            fontSize: '1rem'
                        }}>
                            💰 One-time payment • 🔒 Secure checkout • ✨ Lifetime access
                        </Typography>
                    </Paper>
                </Container>

                <PaymentModal
                    open={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            </Box>
        );
    }

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.tertiary?.main || theme.palette.secondary.dark} 100%)`,
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
                <Container maxWidth="md">
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
                                            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                                            animation: `${pulseAnimation} 2s ease-in-out infinite`,
                                            boxShadow: theme.shadows[8]
                                        }}
                                    >
                                        <School sx={{ fontSize: 60 }} />
                                    </Avatar>

                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 800,
                                            color: theme.palette.text.primary,
                                            mb: 2,
                                            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}
                                    >
                                        Preparing Your Major Assessment
                                    </Typography>

                                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                                        Loading personalized major matching questions...
                                    </Typography>

                                    <Box sx={{ position: 'relative', mb: 4 }}>
                                        <CircularProgress
                                            size={80}
                                            thickness={4}
                                            sx={{
                                                color: theme.palette.secondary.main,
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
                                            <TrendingUp sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
                                        </Box>
                                    </Box>

                                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                                        <Skeleton variant="circular" width={40} height={40} animation="wave" />
                                    </Stack>

                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        "The future belongs to those who believe in the beauty of their dreams."
                                    </Typography>
                                </Box>
                            </Zoom>
                        </Paper>
                    </Fade>
                </Container>
            </Box>
        );
    }

    if (!questions.length) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Container maxWidth="sm">
                    <Fade in={true} timeout={1000}>
                        <Alert
                            severity="warning"
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
                                No Questions Available
                            </AlertTitle>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Please try again later or contact support if the issue persists.
                            </Typography>
                        </Alert>
                    </Fade>
                </Container>
            </Box>
        );
    }

    const pageQuestions = getPageQuestions();
    const categoryColor = pageQuestions.length ? getCategoryColor(pageQuestions[0].category) : theme.palette.primary.main;
    const timeSpentMinutes = Math.floor(timeSpent / 60);
    const timeSpentSeconds = timeSpent % 60;

    return (
        <Box ref={containerRef} sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50], position: 'relative' }}>
            {/* Advanced Header with Glassmorphism */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    background: `linear-gradient(135deg, ${alpha(categoryColor, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${alpha(categoryColor, 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(categoryColor, 0.1)}`
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
                            mr: { xs: 0, md: 3 },
                            mb: { xs: 1, md: 0 },
                            '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'transform 0.2s ease-in-out'
                            }
                        }}
                    >
                        <ArrowBack />
                    </IconButton>

                    <Avatar
                        sx={{
                            mr: { xs: 0, md: 2 },
                            mb: { xs: 1, md: 0 },
                            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                            animation: `${pulseAnimation} 3s ease-in-out infinite`
                        }}
                    >
                        <School />
                    </Avatar>

                    <Box sx={{ flexGrow: 1, width: { xs: '100%', md: 'auto' }, textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}>
                            Major Discovery
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                            Find your perfect academic path
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-end' }, rowGap: 1 }}>
                        <Tooltip title="Time Spent">
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
                            label={`Page ${currentPage + 1} / ${totalPages || 1}`}
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
                            {Math.round(progress)}% Complete
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            ~{Math.ceil((questions.length - answeredCount) * 0.3)} min remaining
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
                {/* Error Alert */}
                {error && (
                    <Slide direction="down" in={!!error} timeout={500}>
                        <Alert
                            severity="error"
                            sx={{
                                mb: 4,
                                borderRadius: 3,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                            }}
                        >
                            {error}
                        </Alert>
                    </Slide>
                )}

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
                                Test Insights
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                            {answeredCount}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Questions Answered
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                                            {questions.length - answeredCount}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Remaining
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                                            {Math.round(progress)}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Complete
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary.main }}>
                                            {Math.ceil((questions.length - answeredCount) * 0.3)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Min Left
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
                                background: `linear-gradient(90deg, ${categoryColor}, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                            }
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                                    How well does each statement describe you?
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Be honest and choose the option that best reflects your interests and goals
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
                                    Response Scale
                                </Typography>
                                <Grid container spacing={2}>
                                    {likertOptions.map((opt, index) => (
                                        <Grid item xs={12} sm={6} md={2.4} key={opt.value}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        border: `3px solid ${getLikertColor(opt.value)}`,
                                                        backgroundColor: alpha(getLikertColor(opt.value), 0.1),
                                                        mx: 'auto',
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.2rem',
                                                        fontWeight: 700,
                                                        color: getLikertColor(opt.value),
                                                        transition: 'all 0.3s ease-in-out',
                                                        '&:hover': {
                                                            transform: 'scale(1.1)',
                                                            boxShadow: `0 0 20px ${alpha(getLikertColor(opt.value), 0.3)}`
                                                        }
                                                    }}
                                                >
                                                    {index + 1}
                                                </Box>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                                    {opt.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    {opt.description}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>

                            {/* Questions */}
                            <Grid container spacing={4}>
                                {pageQuestions.map((q, idx) => {
                                    const qAnswer = answers[q.id] || '';
                                    const isHovered = hoveredQuestion === q.id;
                                    const qColor = getCategoryColor(q.category);

                                    return (
                                        <Grid key={q.id} item xs={12}>
                                            <Grow in={true} timeout={500 + idx * 100}>
                                                <Paper
                                                    elevation={isHovered ? 8 : qAnswer ? 6 : 2}
                                                    sx={{
                                                        p: { xs: 3, md: 4 },
                                                        borderRadius: 3,
                                                        background: qAnswer
                                                            ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`
                                                            : `linear-gradient(135deg, white 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`,
                                                        border: qAnswer
                                                            ? `2px solid ${alpha(theme.palette.success.main, 0.3)}`
                                                            : `1px solid ${alpha(theme.palette.grey[200], 0.5)}`,
                                                        transition: 'all 0.3s ease-in-out',
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&::before': qAnswer ? {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            height: 3,
                                                            background: `linear-gradient(90deg, ${qColor}, ${alpha(qColor, 0.7)})`
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
                                                                background: `linear-gradient(135deg, ${qColor}, ${alpha(qColor, 0.7)})`,
                                                                fontSize: '1rem'
                                                            }}
                                                        >
                                                            {q.category.charAt(0)}
                                                        </Avatar>
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: qColor }}>
                                                                {q.category}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={`Q${currentPage * QUESTIONS_PER_PAGE + idx + 1}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: alpha(qColor, 0.1),
                                                                color: qColor,
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
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        {q.question}
                                                    </Typography>

                                                    {/* Answer Options */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                                                        {likertOptions.map((option, index) => {
                                                            const selected = qAnswer === option.value;
                                                            const color = getLikertColor(option.value);
                                                            return (
                                                                <Tooltip key={option.value} title={option.description} placement="top">
                                                                    <Box
                                                                        onClick={() => handleAnswerChangeFor(q.id, option.value)}
                                                                        sx={{
                                                                            width: { xs: 44, sm: 50 },
                                                                            height: { xs: 44, sm: 50 },
                                                                            borderRadius: '50%',
                                                                            border: `3px solid ${color}`,
                                                                            backgroundColor: selected
                                                                                ? alpha(color, 0.2)
                                                                                : 'transparent',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.3s ease-in-out',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: { xs: '1rem', sm: '1.2rem' },
                                                                            fontWeight: 700,
                                                                            color: color,
                                                                            position: 'relative',
                                                                            '&:hover': {
                                                                                transform: 'scale(1.15)',
                                                                                boxShadow: `0 0 20px ${alpha(color, 0.4)}`,
                                                                                backgroundColor: alpha(color, 0.1)
                                                                            },
                                                                            ...(selected && {
                                                                                animation: `${pulseAnimation} 2s ease-in-out infinite`,
                                                                                boxShadow: `0 0 15px ${alpha(color, 0.5)}`
                                                                            })
                                                                        }}
                                                                    >
                                                                        {index + 1}
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
                                                    {qAnswer && (
                                                        <Fade in={true} timeout={500}>
                                                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                                                <Chip
                                                                    icon={<CheckCircle />}
                                                                    label="Answered"
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 6 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 0 || submitting}
                                    startIcon={<ArrowBack />}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        borderWidth: '2px',
                                        borderRadius: 3,
                                        '&:hover': {
                                            borderWidth: '2px',
                                            transform: 'translateX(-2px)'
                                        }
                                    }}
                                >
                                    Previous
                                </Button>

                                <Box sx={{ textAlign: 'center' }}>
                                    {isPageComplete() && (
                                        <Zoom in={true} timeout={500}>
                                            <Chip
                                                icon={<CheckCircle />}
                                                label="Page Complete"
                                                sx={{
                                                    backgroundColor: theme.palette.success.main,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    px: 2,
                                                    py: 1
                                                }}
                                            />
                                        </Zoom>
                                    )}
                                </Box>

                                <Button
                                    variant="contained"
                                    onClick={handleNextPage}
                                    disabled={!isPageComplete() || submitting}
                                    endIcon={submitting ? <CircularProgress size={20} color="inherit" /> :
                                        currentPage === totalPages - 1 ? <EmojiEvents /> : <ArrowForward />}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        borderRadius: 3,
                                        background: isPageComplete()
                                            ? `linear-gradient(135deg, ${categoryColor} 0%, ${theme.palette.primary.main} 100%)`
                                            : theme.palette.grey[300],
                                        boxShadow: isPageComplete() ? theme.shadows[4] : 'none',
                                        '&:hover': {
                                            background: isPageComplete()
                                                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${categoryColor} 100%)`
                                                : theme.palette.grey[300],
                                            transform: 'translateX(2px)',
                                            boxShadow: isPageComplete() ? theme.shadows[8] : 'none'
                                        }
                                    }}
                                >
                                    {submitting ? 'Processing...' : currentPage === totalPages - 1 ? 'Get Results' : 'Next Page'}
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
                            Test Progress Overview
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                        {answeredCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Answered
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                                        {questions.length - answeredCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Remaining
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                                        {Math.round(progress)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Complete
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.info.main }}>
                                        {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, '0')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Time Spent
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Slide>
            </Container>

            <PaymentModal
                open={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
            />
        </Box>
    );
};

export default MajorMatchingTest; 