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
    const enhanceMajorRecommendations = (majors: Major[]): Major[] => {
        return majors.map(major => {
            const detailedDescription = getMajorDescription(major.name);
            if (detailedDescription) {
                return {
                    ...major,
                    description: detailedDescription.description,
                    careerPaths: detailedDescription.careerPaths,
                    requiredSkills: detailedDescription.careerPaths, // Using career paths as skills for now
                    workEnvironment: detailedDescription.industries.join(', '),
                    jobGrowth: detailedDescription.whyFutureProof
                };
            }
            return major;
        });
    };

    const majorRecommendations: Major[] = apiResults && apiResults.length > 0
        ? enhanceMajorRecommendations(apiResults)
        : enhanceMajorRecommendations(sampleRecommendations);

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
                                    <Grid container spacing={3} alignItems="center" justifyContent="space-between">
                                        <Grid item xs={12} sm={8}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                                                <Avatar
                                                    sx={{
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                        mr: 2,
                                                        width: { xs: 40, sm: 48 },
                                                        height: { xs: 40, sm: 48 },
                                                        mb: { xs: 1, sm: 0 }
                                                    }}
                                                >
                                                    <IconComponent sx={{ fontSize: { xs: 20, sm: 28 } }} />
                                                </Avatar>
                                                <Typography variant="h4" component="h2" sx={{
                                                    fontWeight: 700,
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                                                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                                                }}>
                                                    #{index + 1} {major.name}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{
                                                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.125rem' },
                                                lineHeight: 1.6,
                                                opacity: 0.95
                                            }}>
                                                {major.description || t('majorMatchingResults.noDescriptionAvailable')}
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
                                            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} alignItems="stretch" justifyContent="center">
                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <BusinessCenter sx={{
                                                                color: matchColor,
                                                                mr: 1,
                                                                fontSize: 24
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {t('majorMatchingResults.careerOpportunities')}
                                                            </Typography>
                                                        </Box>
                                                        <Stack spacing={1}>
                                                            {(major.careerPaths || [
                                                                'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer'
                                                            ]).map((career, idx) => (
                                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <CheckCircle sx={{
                                                                        color: matchColor,
                                                                        mr: 1,
                                                                        fontSize: 18
                                                                    }} />
                                                                    <Typography variant="body1">{career}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Box>

                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <Star sx={{
                                                                color: matchColor,
                                                                mr: 1,
                                                                fontSize: 24
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {t('majorMatchingResults.requiredSkills')}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {(major.requiredSkills || [
                                                                'Critical Thinking', 'Communication', 'Teamwork', 'Problem Solving'
                                                            ]).map((skill, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={skill}
                                                                    sx={{
                                                                        backgroundColor: `${matchColor}20`,
                                                                        color: matchColor,
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <AttachMoney sx={{
                                                                color: theme.palette.success.main,
                                                                mr: 1,
                                                                fontSize: 24
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {t('majorMatchingResults.salaryGrowth')}
                                                            </Typography>
                                                        </Box>
                                                        <Paper sx={{ p: 2, backgroundColor: theme.palette.success.light + '20' }}>
                                                            <Typography variant="h6" sx={{
                                                                color: theme.palette.success.dark,
                                                                fontWeight: 700,
                                                                mb: 1
                                                            }}>
                                                                {major.averageSalary || t('majorMatchingResults.variesByRoleLocation')}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('majorMatchingResults.averageAnnualSalaryRange')}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                                                                {t('majorMatchingResults.jobOutlook')}: {major.jobOutlook || 'Good'}
                                                            </Typography>
                                                        </Paper>
                                                    </Box>

                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <LocationOn sx={{
                                                                color: theme.palette.primary.main,
                                                                mr: 1,
                                                                fontSize: 24
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {t('majorMatchingResults.workEnvironment')}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body1" sx={{
                                                            backgroundColor: theme.palette.primary.light + '20',
                                                            p: 2,
                                                            borderRadius: 2,
                                                            border: `1px solid ${theme.palette.primary.light}30`
                                                        }}>
                                                            {major.workEnvironment || t('majorMatchingResults.variesByRoleLocation')}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
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