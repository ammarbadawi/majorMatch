import React from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Grid,
    Chip,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Avatar,
    Stack,
    LinearProgress,
    Alert,
    useTheme
} from '@mui/material';
import {
    ArrowBack,
    School,
    Home,
    Download,
    Share,
    ExpandMore,
    TrendingUp,
    LocationOn,
    AttachMoney,
    Schedule,
    EmojiEvents,
    Star,
    WorkOutline,
    AutoAwesome,
    CheckCircle,
    BusinessCenter,
    Group,
    SmartToy
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMajorDescription } from '../services/majorDescriptions';
import { loadMajorReports, MajorReport, normalizeMajorName } from '../services/majorsDisplay';

interface Major {
    name: string;
    match: number;
    description: string;
    careerPaths?: string[];
    averageSalary?: string;
    jobOutlook?: string;
    topUniversities?: string[];
    requiredSkills?: string[];
    workEnvironment?: string;
    jobGrowth?: string;
}

const MajorMatchingResults: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { t } = useTranslation();
    const [majorReports, setMajorReports] = React.useState<Record<string, MajorReport>>({});
    const [isLoadingReports, setIsLoadingReports] = React.useState<boolean>(true);
    const [reportError, setReportError] = React.useState<string | null>(null);

    const apiResults: Major[] | undefined = location.state?.results;

    // Fallback sample major recommendations (used if no API results available)
    const sampleRecommendations: Major[] = [
        {
            name: "Computer Science",
            match: 94,
            description: "Study algorithms, programming, and computational systems to solve complex problems using technology.",
            careerPaths: ["Software Engineer", "Data Scientist", "Web Developer", "AI/ML Engineer", "Cybersecurity Analyst"],
            averageSalary: "$70,000 - $150,000",
            jobOutlook: "Excellent",
            topUniversities: ["MIT", "Stanford University", "UC Berkeley", "Carnegie Mellon", "University of Washington"],
            requiredSkills: ["Programming", "Problem Solving", "Mathematical Thinking", "Logical Analysis"],
            workEnvironment: "Technology companies, startups, corporate IT departments",
            jobGrowth: "22% (Much faster than average)"
        },
        {
            name: "Digital Marketing",
            match: 89,
            description: "Combine creativity with analytics to develop and execute marketing strategies in the digital space.",
            careerPaths: ["Digital Marketing Manager", "Content Creator", "Social Media Manager", "SEO Specialist", "Marketing Analyst"],
            averageSalary: "$45,000 - $95,000",
            jobOutlook: "Very Good",
            topUniversities: ["Northwestern University", "University of Pennsylvania", "New York University", "USC", "Boston University"],
            requiredSkills: ["Creative Thinking", "Data Analysis", "Communication", "Strategic Planning"],
            workEnvironment: "Marketing agencies, corporations, freelance opportunities",
            jobGrowth: "10% (Faster than average)"
        }
    ];

    // Enhance major recommendations with detailed descriptions from our service
    // Only use this as fallback if report data is not available
    const enhanceMajorRecommendations = (majors: Major[]): Major[] => {
        return majors.map(major => {
            // Don't enhance if we'll have report data - let the report take precedence
            return major;
        });
    };

    const majorRecommendations: Major[] = apiResults && apiResults.length > 0
        ? enhanceMajorRecommendations(apiResults)
        : enhanceMajorRecommendations(sampleRecommendations);

    React.useEffect(() => {
        let isMounted = true;

        loadMajorReports()
            .then(reports => {
                if (isMounted) {
                    setMajorReports(reports);
                }
            })
            .catch(error => {
                console.error('Failed to load MajorsDisplay.txt', error);
                if (isMounted) {
                    setReportError('Unable to load detailed major reports right now.');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingReports(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const resolveMajorReport = (majorName: string): MajorReport | undefined => {
        const primaryKey = normalizeMajorName(majorName);
        if (majorReports[primaryKey]) {
            return majorReports[primaryKey];
        }

        const majorDescription = getMajorDescription(majorName);
        if (majorDescription) {
            const altKey = normalizeMajorName(majorDescription.name);
            return majorReports[altKey];
        }

        return undefined;
    };

    const getMatchColor = (match: number) => {
        if (match >= 90) return theme.palette.success.main;
        if (match >= 80) return theme.palette.success.light;
        if (match >= 70) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const getMajorIcon = (index: number) => {
        const icons = [AutoAwesome, Star, TrendingUp, EmojiEvents, WorkOutline];
        return icons[index] || WorkOutline;
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50] }}>
            {/* Header */}
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: theme.shadows[4]
                }}
            >
                <Toolbar sx={{ py: { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/')}
                        sx={{ mr: { xs: 1, sm: 3 }, mb: { xs: 1, sm: 0 } }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <School sx={{ mr: { xs: 1, sm: 2 }, fontSize: { xs: 24, sm: 32 }, mb: { xs: 1, sm: 0 } }} />
                    <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.125rem', sm: '1.5rem' } }}>
                            {t('majorMatchingResults.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {t('majorMatchingResults.personalizedRecommendations')}
                        </Typography>
                    </Box>
                    <Button
                        color="inherit"
                        startIcon={<Download />}
                        sx={{
                            mr: { xs: 1, sm: 2 },
                            mt: { xs: 1, sm: 0 },
                            borderRadius: '12px',
                            fontSize: { xs: '0.85rem', sm: '0.875rem' },
                            py: { xs: 0.75, sm: 1 },
                            px: { xs: 1.5, sm: 2 },
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('majorMatchingResults.downloadResults')}</Box>
                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>DL</Box>
                    </Button>
                    <Button
                        color="inherit"
                        startIcon={<Share />}
                        sx={{
                            mt: { xs: 1, sm: 0 },
                            borderRadius: '12px',
                            fontSize: { xs: '0.85rem', sm: '0.875rem' },
                            py: { xs: 0.75, sm: 1 },
                            px: { xs: 1.5, sm: 2 },
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        {t('majorMatchingResults.shareResults')}
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
                {isLoadingReports && (
                    <Paper variant="outlined" sx={{ mb: { xs: 2, sm: 3 }, p: { xs: 1.5, sm: 2 } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {t('majorMatchingResults.loadingMajorsDisplay', 'Loading detailed major reports...')}
                        </Typography>
                        <LinearProgress />
                    </Paper>
                )}
                {reportError && (
                    <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 } }}>
                        {reportError}
                    </Alert>
                )}
                {/* Results Header */}
                <Card
                    elevation={8}
                    sx={{
                        mb: { xs: 4, sm: 6 },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: 'white',
                        overflow: 'hidden',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                        }
                    }}
                >
                    <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 }, position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <Avatar
                            sx={{
                                width: { xs: 60, sm: 70, md: 80 },
                                height: { xs: 60, sm: 70, md: 80 },
                                mx: 'auto',
                                mb: 3,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: '3px solid rgba(255,255,255,0.3)'
                            }}
                        >
                            <EmojiEvents sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />
                        </Avatar>

                        <Typography variant="h2" component="h1" gutterBottom sx={{
                            fontWeight: 800,
                            mb: 2,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                        }}>
                            {t('majorMatchingResults.perfectMajorMatches')}
                        </Typography>

                        <Typography variant="h5" sx={{
                            opacity: 0.95,
                            mb: 3,
                            fontWeight: 500,
                            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                        }}>
                            {apiResults ? t('majorMatchingResults.topMatchesBasedOnAnswers') : t('majorMatchingResults.top5MajorMatches')}
                        </Typography>

                        <Chip
                            label={apiResults ? t('majorMatchingResults.premiumAssessmentComplete') : t('majorMatchingResults.sampleResults')}
                            sx={{
                                backgroundColor: theme.palette.warning.main,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                                px: { xs: 2, sm: 3 },
                                py: { xs: 0.75, sm: 1 },
                                boxShadow: theme.shadows[4]
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Major Recommendations */}
                {majorRecommendations.map((major, index) => {
                    const IconComponent = getMajorIcon(index);
                    const matchColor = getMatchColor(major.match);
                    const report = resolveMajorReport(major.name);
                    
                    // Helper to deduplicate arrays
                    const deduplicateArray = (arr: string[]): string[] => {
                        return Array.from(new Set(arr.map(item => item.trim()).filter(Boolean)));
                    };
                    
                    // Prioritize report data, fallback to major data, then defaults
                    const displayDescription = report?.personalFitSummary || major.description || t('majorMatchingResults.noDescriptionAvailable');
                    
                    const displayCareerPaths = report?.careerPaths && report.careerPaths.length > 0
                        ? deduplicateArray(report.careerPaths)
                        : (major.careerPaths && major.careerPaths.length > 0
                            ? deduplicateArray(major.careerPaths)
                            : []);
                    
                    const displaySkills = report?.skills && report.skills.length > 0
                        ? deduplicateArray(report.skills)
                        : (major.requiredSkills && major.requiredSkills.length > 0
                            ? deduplicateArray(major.requiredSkills)
                            : []);
                    
                    const displayWorkEnvironment = report?.workSettings && report.workSettings.length > 0
                        ? report.workSettings.join(' • ')
                        : (major.workEnvironment || t('majorMatchingResults.variesByRoleLocation'));
                    
                    const displaySnapshot = report?.studySnapshot;
                    const displayProsChallenges = report?.prosChallenges;
                    const coreSubjects = report?.coreSubjects ? deduplicateArray(report.coreSubjects) : [];
                    const connectionSummary = report?.connectionSummary;
                    const studyOverview = report?.studyOverview;
                    const childMajors = report?.childMajors ? deduplicateArray(report.childMajors) : [];

                    const parseLinesToList = (text?: string): string[] => {
                        if (!text) return [];
                        return deduplicateArray(
                            text
                                .split('\n')
                                .map(line => line.trim().replace(/^[-•]\s*/, ''))
                                .filter(Boolean)
                        );
                    };

                    const studyChips = coreSubjects.length > 0 ? coreSubjects : parseLinesToList(studyOverview);

                    return (
                        <Card key={index} elevation={6} sx={{
                            mb: 4,
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[12]
                            }
                        }}>
                            <CardContent sx={{ p: 0 }}>
                                {/* Header Section */}
                                <Box
                                    sx={{
                                        background: `linear-gradient(135deg, ${matchColor} 0%, ${matchColor}CC 100%)`,
                                        color: 'white',
                                        p: { xs: 3, sm: 4 },
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: -30,
                                            right: -30,
                                            width: 120,
                                            height: 120,
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '50%'
                                        }
                                    }}
                                >
                                    <Grid container spacing={3} alignItems="flex-start" justifyContent="space-between">
                                        <Grid item xs={12} sm={8}>
                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                            width: { xs: 48, sm: 56 },
                                                            height: { xs: 48, sm: 56 },
                                                            border: '2px solid rgba(255,255,255,0.3)'
                                                        }}
                                                    >
                                                        <IconComponent sx={{ fontSize: { xs: 24, sm: 32 } }} />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="h4" component="h2" sx={{
                                                            fontWeight: 700,
                                                            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                                                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' },
                                                            mb: 0.5
                                                        }}>
                                                            #{index + 1} {major.name}
                                                        </Typography>
                                                        {report?.tagline && (
                                                            <Typography variant="subtitle1" sx={{
                                                                opacity: 0.95,
                                                                fontWeight: 500,
                                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                                                fontStyle: 'italic',
                                                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                                                            }}>
                                                                {report.tagline}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                                {report?.traitChips && report.traitChips.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                        {report.traitChips.map((chip, chipIdx) => (
                                                            <Chip
                                                                key={chipIdx}
                                                                label={chip}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    border: '1px solid rgba(255,255,255,0.4)',
                                                                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                                                                    height: { xs: 24, sm: 28 },
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(255,255,255,0.35)'
                                                                    }
                                                                }}
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                            <Typography variant="body1" sx={{
                                                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.125rem' },
                                                lineHeight: 1.7,
                                                opacity: 0.95,
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {displayDescription}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ textAlign: { xs: 'left', sm: 'center' }, mt: { xs: 2, sm: 0 } }}>
                                                <Typography variant="h2" sx={{
                                                    fontWeight: 800,
                                                    mb: 1,
                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                                                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                                                }}>
                                                    {major.match}%
                                                </Typography>
                                                <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                                    {t('majorMatchingResults.compatibilityMatch')}
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={major.match}
                                                    sx={{
                                                        mt: 2,
                                                        height: { xs: 6, sm: 8 },
                                                        backgroundColor: 'rgba(255,255,255,0.3)',
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: 'rgba(255,255,255,0.9)'
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    startIcon={<SmartToy />}
                                                    onClick={() => navigate('/chat', { state: { prefill: `Why did I get ${major.name} as a recommended major? Please explain based on my personality test and the specific answers I gave in the major test.` } })}
                                                    sx={{ 
                                                        mt: 2, 
                                                        fontWeight: 700,
                                                        fontSize: { xs: '0.85rem', sm: '0.875rem' },
                                                        py: { xs: 1, sm: 1.25 },
                                                        px: { xs: 1.5, sm: 2 },
                                                        width: { xs: '100%', sm: 'auto' }
                                                    }}
                                                >
                                                    {t('majorMatchingResults.askAIWhyThisMajor')}
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Content Section */}
                                <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                                    <Accordion defaultExpanded={index === 0}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMore />}
                                            sx={{
                                                backgroundColor: theme.palette.grey[50],
                                                '&.Mui-expanded': {
                                                    backgroundColor: `${matchColor}10`
                                                }
                                            }}
                                        >
                                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                                                {t('majorMatchingResults.careerPathsDetailedInfo')}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                                            {/* Connection and Study Overview Section */}
                                            {(connectionSummary || studyOverview) && (
                                                <Stack spacing={2.5} sx={{ mb: { xs: 3, sm: 4 } }}>
                                                    {connectionSummary && (
                                                        <Paper 
                                                            elevation={0}
                                                            sx={{ 
                                                                p: { xs: 2, sm: 2.5 },
                                                                backgroundColor: `${matchColor}08`,
                                                                border: `1px solid ${matchColor}20`,
                                                                borderRadius: 2
                                                            }}
                                                        >
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: matchColor }}>
                                                                {t('majorMatchingResults.connectionTitle', 'Where You and This Major Connect')}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line', color: 'text.primary' }}>
                                                                {connectionSummary}
                                                            </Typography>
                                                        </Paper>
                                                    )}
                                                    {studyChips.length > 0 && (
                                                        <Paper 
                                                            elevation={0}
                                                            sx={{ 
                                                                p: { xs: 2, sm: 2.5 },
                                                                backgroundColor: `${matchColor}08`,
                                                                border: `1px solid ${matchColor}20`,
                                                                borderRadius: 2
                                                            }}
                                                        >
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: matchColor }}>
                                                                {t('majorMatchingResults.studyOverview', 'What You Study in This Major')}
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                                {studyChips.map((subject, subjIdx) => (
                                                                    <Chip
                                                                        key={subjIdx}
                                                                        label={subject}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: `${matchColor}20`,
                                                                            color: matchColor,
                                                                            fontWeight: 600,
                                                                            fontSize: '0.8125rem'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Stack>
                                                        </Paper>
                                                    )}
                                                </Stack>
                                            )}
                                            
                                            {/* Child Majors Section */}
                                            {childMajors.length > 0 && (
                                                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Group sx={{ color: matchColor, mr: 1, fontSize: 24 }} />
                                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                            {t('majorMatchingResults.specializations', 'Specializations')}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        {childMajors.map((childMajor, childIdx) => (
                                                            <Chip
                                                                key={childIdx}
                                                                label={childMajor}
                                                                sx={{
                                                                    backgroundColor: `${matchColor}15`,
                                                                    color: matchColor,
                                                                    fontWeight: 600,
                                                                    border: `1px solid ${matchColor}30`
                                                                }}
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} alignItems="stretch" justifyContent="center">
                                                <Grid item xs={12} md={6}>
                                                    {displayCareerPaths.length > 0 && (
                                                        <Box sx={{ mb: 4 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                                <BusinessCenter sx={{
                                                                    color: matchColor,
                                                                    mr: 1.5,
                                                                    fontSize: 28
                                                                }} />
                                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                    {t('majorMatchingResults.careerOpportunities')}
                                                                </Typography>
                                                            </Box>
                                                            <Paper 
                                                                elevation={0}
                                                                sx={{ 
                                                                    p: 2,
                                                                    backgroundColor: `${matchColor}08`,
                                                                    border: `1px solid ${matchColor}20`,
                                                                    borderRadius: 2
                                                                }}
                                                            >
                                                                <Stack spacing={1.25}>
                                                                    {displayCareerPaths.map((career, idx) => (
                                                                        <Typography key={idx} variant="body1" sx={{ lineHeight: 1.6 }}>
                                                                            • {career}
                                                                        </Typography>
                                                                    ))}
                                                                </Stack>
                                                            </Paper>
                                                        </Box>
                                                    )}

                                                    {displaySkills.length > 0 && (
                                                        <Box sx={{ mb: 4 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                                <Star sx={{
                                                                    color: matchColor,
                                                                    mr: 1.5,
                                                                    fontSize: 28
                                                                }} />
                                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                    {t('majorMatchingResults.requiredSkills')}
                                                                </Typography>
                                                            </Box>
                                                            <Paper 
                                                                elevation={0}
                                                                sx={{ 
                                                                    p: 2,
                                                                    backgroundColor: `${matchColor}08`,
                                                                    border: `1px solid ${matchColor}20`,
                                                                    borderRadius: 2
                                                                }}
                                                            >
                                                                <Stack spacing={1}>
                                                                    {displaySkills.map((skill, idx) => (
                                                                        <Typography key={idx} variant="body1" sx={{ lineHeight: 1.6 }}>
                                                                            • {skill}
                                                                        </Typography>
                                                                    ))}
                                                                </Stack>
                                                            </Paper>
                                                        </Box>
                                                    )}
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <AttachMoney sx={{
                                                                color: theme.palette.success.main,
                                                                mr: 1.5,
                                                                fontSize: 28
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {t('majorMatchingResults.salaryGrowth')}
                                                            </Typography>
                                                        </Box>
                                                        <Paper 
                                                            elevation={0}
                                                            sx={{ 
                                                                p: 2.5,
                                                                backgroundColor: `${theme.palette.success.main}08`,
                                                                border: `1px solid ${theme.palette.success.main}20`,
                                                                borderRadius: 2
                                                            }}
                                                        >
                                                            <Typography variant="h6" sx={{
                                                                color: theme.palette.success.dark,
                                                                fontWeight: 700,
                                                                mb: 1
                                                            }}>
                                                                {major.averageSalary || t('majorMatchingResults.variesByRoleLocation')}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                                {t('majorMatchingResults.averageAnnualSalaryRange')}
                                                            </Typography>
                                                            {major.jobOutlook && (
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                                                                    {t('majorMatchingResults.jobOutlook')}: {major.jobOutlook}
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    </Box>

                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <LocationOn sx={{
                                                                color: theme.palette.primary.main,
                                                                mr: 1.5,
                                                                fontSize: 28
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {t('majorMatchingResults.workEnvironment')}
                                                            </Typography>
                                                        </Box>
                                                        <Paper 
                                                            elevation={0}
                                                            sx={{
                                                                p: 2.5,
                                                                backgroundColor: `${theme.palette.primary.main}08`,
                                                                border: `1px solid ${theme.palette.primary.main}20`,
                                                                borderRadius: 2
                                                            }}
                                                        >
                                                            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                                                {displayWorkEnvironment}
                                                            </Typography>
                                                        </Paper>
                                                    </Box>
                                                    
                                                    {displaySnapshot && (
                                                        <Box sx={{ mb: 4 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                                <Schedule sx={{
                                                                    color: theme.palette.info.main,
                                                                    mr: 1.5,
                                                                    fontSize: 28
                                                                }} />
                                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                    {t('majorMatchingResults.studySnapshot', 'Study Snapshot')}
                                                                </Typography>
                                                            </Box>
                                                            <Paper 
                                                                elevation={0}
                                                                sx={{
                                                                    p: 2.5,
                                                                    backgroundColor: `${theme.palette.info.main}08`,
                                                                    border: `1px solid ${theme.palette.info.main}20`,
                                                                    borderRadius: 2
                                                                }}
                                                            >
                                                                <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                                                    {displaySnapshot}
                                                                </Typography>
                                                            </Paper>
                                                        </Box>
                                                    )}
                                                </Grid>
                                            </Grid>
                                            {displayProsChallenges && (
                                                <Box sx={{ mt: { xs: 3, sm: 4 } }}>
                                                    <Divider sx={{ mb: 3 }} />
                                                    <Paper 
                                                        elevation={0}
                                                        sx={{
                                                            p: { xs: 2.5, sm: 3 },
                                                            backgroundColor: `${matchColor}08`,
                                                            border: `1px solid ${matchColor}20`,
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: matchColor }}>
                                                            {t('majorMatchingResults.prosChallenges', 'Pros, Challenges & Misconceptions')}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line', color: 'text.primary' }}>
                                                            {displayProsChallenges}
                                                        </Typography>
                                                    </Paper>
                                                </Box>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Action Buttons */}
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 3, sm: 4, md: 6 },
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
                        mt: { xs: 4, sm: 6 }
                    }}
                >
                                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                        {t('majorMatchingResults.readyToTakeNextStep')}
                    </Typography>
                    <Typography variant="body1" sx={{
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        color: theme.palette.text.secondary,
                        mb: 4,
                        maxWidth: '600px',
                        mx: 'auto'
                    }}>
                        {t('majorMatchingResults.startJourneyDescription')}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<School />}
                            onClick={() => navigate('/chat')}
                            sx={{
                                py: { xs: 1.5, sm: 2 },
                                px: { xs: 3, sm: 5 },
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                width: { xs: '100%', sm: 'auto' }
                            }}
                        >
                            {t('majorMatchingResults.exploreUniversities')}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Home />}
                            onClick={() => navigate('/')}
                            sx={{
                                py: { xs: 1.5, sm: 2 },
                                px: { xs: 3, sm: 5 },
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                fontWeight: 600,
                                borderWidth: '2px',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': {
                                    borderWidth: '2px'
                                }
                            }}
                        >
                            {t('majorMatchingResults.backToHome')}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default MajorMatchingResults; 