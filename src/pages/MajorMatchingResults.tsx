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
                            Your Major Matching Results
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Personalized academic major recommendations
                        </Typography>
                    </Box>
                    <Button
                        color="inherit"
                        startIcon={<Download />}
                        sx={{
                            mr: 2,
                            borderRadius: '12px',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Download
                    </Button>
                    <Button
                        color="inherit"
                        startIcon={<Share />}
                        sx={{
                            borderRadius: '12px',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Share
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                {/* Results Header */}
                <Card
                    elevation={8}
                    sx={{
                        mb: 6,
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
                    <CardContent sx={{ p: 6, position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                mx: 'auto',
                                mb: 3,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: '3px solid rgba(255,255,255,0.3)'
                            }}
                        >
                            <EmojiEvents sx={{ fontSize: 40 }} />
                        </Avatar>

                        <Typography variant="h2" component="h1" gutterBottom sx={{
                            fontWeight: 800,
                            mb: 2,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            Your Perfect Major Matches
                        </Typography>

                        <Typography variant="h5" sx={{
                            opacity: 0.95,
                            mb: 3,
                            fontWeight: 500
                        }}>
                            {apiResults ? 'Here are your top matches based on your answers' : 'Based on your comprehensive assessment, here are your top 5 major matches'}
                        </Typography>

                        <Chip
                            label={apiResults ? '✨ PREMIUM ASSESSMENT COMPLETE' : '✨ SAMPLE RESULTS'}
                            sx={{
                                backgroundColor: theme.palette.warning.main,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1.125rem',
                                px: 3,
                                py: 1,
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
                                        p: 4,
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                        mr: 2,
                                                        width: 48,
                                                        height: 48
                                                    }}
                                                >
                                                    <IconComponent sx={{ fontSize: 28 }} />
                                                </Avatar>
                                                <Typography variant="h4" component="h2" sx={{
                                                    fontWeight: 700,
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                                                }}>
                                                    #{index + 1} {major.name}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{
                                                fontSize: '1.125rem',
                                                lineHeight: 1.6,
                                                opacity: 0.95
                                            }}>
                                                {major.description || 'No description available'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ textAlign: { xs: 'left', sm: 'center' }, mt: { xs: 2, sm: 0 } }}>
                                                <Typography variant="h2" sx={{
                                                    fontWeight: 800,
                                                    mb: 1,
                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    {major.match}%
                                                </Typography>
                                                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                                    Compatibility Match
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={major.match}
                                                    sx={{
                                                        mt: 2,
                                                        height: 8,
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
                                                    sx={{ mt: 2, fontWeight: 700 }}
                                                >
                                                    Ask AI: Why this major?
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Content Section */}
                                <Box sx={{ p: 4 }}>
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
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                🚀 Career Paths & Detailed Information
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 4 }}>
                                            <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                            <BusinessCenter sx={{
                                                                color: matchColor,
                                                                mr: 1,
                                                                fontSize: 24
                                                            }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                Career Opportunities
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
                                                                Required Skills
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
                                                                Salary & Growth
                                                            </Typography>
                                                        </Box>
                                                        <Paper sx={{ p: 2, backgroundColor: theme.palette.success.light + '20' }}>
                                                            <Typography variant="h6" sx={{
                                                                color: theme.palette.success.dark,
                                                                fontWeight: 700,
                                                                mb: 1
                                                            }}>
                                                                {major.averageSalary || 'Varies by role and location'}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Average annual salary range
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                                                                Job Outlook: {major.jobOutlook || 'Good'}
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
                                                                Work Environment
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body1" sx={{
                                                            backgroundColor: theme.palette.primary.light + '20',
                                                            p: 2,
                                                            borderRadius: 2,
                                                            border: `1px solid ${theme.palette.primary.light}30`
                                                        }}>
                                                            {major.workEnvironment || 'Varies by specialization'}
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
                        p: 6,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
                        mt: 6
                    }}
                >
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                        Ready to Take the Next Step?
                    </Typography>
                    <Typography variant="body1" sx={{
                        fontSize: '1.125rem',
                        color: theme.palette.text.secondary,
                        mb: 4,
                        maxWidth: '600px',
                        mx: 'auto'
                    }}>
                        Start your journey towards your perfect major. Explore universities,
                        connect with advisors, and take the first step towards your future career.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<School />}
                            sx={{
                                py: 2,
                                px: 5,
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            }}
                        >
                            Explore Universities
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Home />}
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
                            Back to Home
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default MajorMatchingResults; 