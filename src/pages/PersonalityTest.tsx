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

    // Load questions from backend
    useEffect(() => {
        fetchQuestions();
    }, []);

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
            const response = await fetch('/api/questions', { credentials: 'include' });
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to load questions');
            }
            const questionsData = await response.json();
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

    const handleAnswerChangeFor = (questionId: number, value: number) => {
        const newAnswers = [...answers];
        const idx = newAnswers.findIndex(a => a.questionId === questionId);
        if (idx !== -1) {
            newAnswers[idx] = { questionId, value };
        }
        setAnswers(newAnswers);
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
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ answers: filtered }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to calculate results');
            }

            const result = await response.json();
            // Mark MBTI as completed locally for immediate UI enablement
            try {
                localStorage.setItem('hasMbti', '1');
                window.dispatchEvent(new CustomEvent('mbti-completed'));
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
            label: 'Strongly Disagree',
            color: theme.palette.error.main,
            description: 'This doesn\'t describe me at all'
        },
        {
            value: 2,
            label: 'Disagree',
            color: theme.palette.warning.main,
            description: 'This rarely applies to me'
        },
        {
            value: 3,
            label: 'Neutral',
            color: theme.palette.grey[500],
            description: 'Sometimes this applies'
        },
        {
            value: 4,
            label: 'Agree',
            color: theme.palette.success.light,
            description: 'This often applies to me'
        },
        {
            value: 5,
            label: 'Strongly Agree',
            color: theme.palette.success.main,
            description: 'This perfectly describes me'
        }
    ];

    const getDimensionInfo = (dimension: string) => {
        const dimensionMap: { [key: string]: { name: string, color: string, icon: string, description: string } } = {
            'IE': {
                name: 'Energy',
                color: theme.palette.error.main,
                icon: '⚡',
                description: 'How you gain and expend energy'
            },
            'SN': {
                name: 'Perception',
                color: theme.palette.success.main,
                icon: '🔍',
                description: 'How you process information'
            },
            'TF': {
                name: 'Decision',
                color: theme.palette.primary.main,
                icon: '⚖️',
                description: 'How you make decisions'
            },
            'JP': {
                name: 'Structure',
                color: theme.palette.warning.main,
                icon: '📋',
                description: 'How you approach life'
            },
            'AT': {
                name: 'Identity',
                color: theme.palette.secondary.main,
                icon: '🎭',
                description: 'How you express yourself'
            }
        };
        return dimensionMap[dimension] || {
            name: 'Unknown',
            color: theme.palette.grey[500],
            icon: '❓',
            description: 'Unknown dimension'
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
                                        "The best way to find out who you are is to discover who you're not."
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
                <Container maxWidth="md">
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
                                Oops! Something went wrong
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
                                Try Again
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
                    No questions available
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
                <Toolbar sx={{ py: { xs: 1, md: 2 } }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/')}
                        sx={{
                            mr: 3,
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
                            mr: 2,
                            background: `linear-gradient(135deg, ${theme.palette.tertiary?.main || theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                            animation: `${pulseAnimation} 3s ease-in-out infinite`
                        }}
                    >
                        <Psychology />
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                            Personality Discovery
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                            Uncover your unique personality blueprint
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
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
                <Box sx={{ px: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
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
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.tertiary?.main || theme.palette.primary.light})`
                            }
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                                    How well does each statement describe you?
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Be honest and choose the option that best reflects your true self
                                </Typography>
                            </Box>

                            {/* Enhanced Legend */}
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 3,
                                    mb: 4,
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.grey[100], 0.8)} 100%)`,
                                    borderRadius: 3
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
                                    Response Scale
                                </Typography>
                                <Grid container spacing={2}>
                                    {answerOptions.map((opt) => (
                                        <Grid item xs={12} sm={6} md={2.4} key={opt.value}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        border: `3px solid ${opt.color}`,
                                                        backgroundColor: alpha(opt.color, 0.1),
                                                        mx: 'auto',
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.2rem',
                                                        fontWeight: 700,
                                                        color: opt.color,
                                                        transition: 'all 0.3s ease-in-out',
                                                        '&:hover': {
                                                            transform: 'scale(1.1)',
                                                            boxShadow: `0 0 20px ${alpha(opt.color, 0.3)}`
                                                        }
                                                    }}
                                                >
                                                    {opt.value}
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
                                    const dim = getDimensionInfo(q.dimension);
                                    const qAnswer = getAnswer(q.id);
                                    const isAnswered = qAnswer !== null && qAnswer >= 1 && qAnswer <= 5;
                                    const isHovered = hoveredQuestion === q.id;

                                    return (
                                        <Grid key={q.id} item xs={12}>
                                            <Grow in={true} timeout={500 + idx * 100}>
                                                <Paper
                                                    elevation={isHovered ? 8 : isAnswered ? 6 : 2}
                                                    sx={{
                                                        p: { xs: 3, md: 4 },
                                                        borderRadius: 3,
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
                                                            color: theme.palette.text.primary
                                                        }}
                                                    >
                                                        {q.text}
                                                    </Typography>

                                                    {/* Answer Options */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                        {answerOptions.map((option) => {
                                                            const selected = qAnswer === option.value;
                                                            return (
                                                                <Tooltip key={option.value} title={option.description} placement="top">
                                                                    <Box
                                                                        onClick={() => handleAnswerChangeFor(q.id, option.value)}
                                                                        sx={{
                                                                            width: 50,
                                                                            height: 50,
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
                                                                            fontSize: '1.2rem',
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
                                                                                    width: 20,
                                                                                    height: 20,
                                                                                    borderRadius: '50%',
                                                                                    backgroundColor: theme.palette.success.main,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontSize: '0.8rem',
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
                                            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                                            : theme.palette.grey[300],
                                        boxShadow: isPageComplete() ? theme.shadows[4] : 'none',
                                        '&:hover': {
                                            background: isPageComplete()
                                                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                                                : theme.palette.grey[300],
                                            transform: 'translateX(2px)',
                                            boxShadow: isPageComplete() ? theme.shadows[8] : 'none'
                                        }
                                    }}
                                >
                                    {submitting ? 'Processing...' : currentPage === totalPages - 1 ? 'Complete Test' : 'Next Page'}
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
        </Box>
    );
};

export default PersonalityTest; 