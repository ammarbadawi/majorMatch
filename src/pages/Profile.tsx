import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Avatar,
    Chip,
    Grid,
    Paper,
    Divider,
    Button,
    CircularProgress,
    Alert,
    useTheme,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Email,
    Psychology,
    School,
    SupportAgent,
    Edit,
    Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getMajorDescription } from '../services/majorDescriptions';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    created_at: string;
    last_login: string;
}

interface PersonalityResult {
    type: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
    famous_matches: string[];
    created_at: string;
}

interface MajorResult {
    top_majors: Array<{
        name: string;
        score: number;
        description: string;
        career_paths: string[];
    }>;
    created_at: string;
}

interface ProfileData {
    user: UserProfile;
    personality_result?: PersonalityResult;
    major_result?: MajorResult;
    has_personality_test: boolean;
    has_major_test: boolean;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            console.log('Fetching profile data...');
            const response = await fetch('/api/profile', {
                credentials: 'include'
            });

            console.log('Profile response status:', response.status);
            console.log('Profile response ok:', response.ok);

            if (response.status === 401) {
                console.log('Unauthorized, redirecting to login');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Profile fetch error response:', errorText);
                throw new Error(`Failed to fetch profile data: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Profile data received:', data);
            setProfileData(data);
        } catch (err: any) {
            console.error('Profile fetch error:', err);
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatLastLogin = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) {
                return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
            } else {
                return formatDate(dateString);
            }
        }
    };

    const getPersonalityColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'INTJ': theme.palette.primary.main,
            'INTP': theme.palette.secondary.main,
            'ENTJ': theme.palette.success.main,
            'ENTP': theme.palette.warning.main,
            'INFJ': theme.palette.info.main,
            'INFP': theme.palette.error.main,
            'ENFJ': theme.palette.primary.light,
            'ENFP': theme.palette.secondary.light,
            'ISTJ': theme.palette.success.light,
            'ISFJ': theme.palette.warning.light,
            'ESTJ': theme.palette.info.light,
            'ESFJ': theme.palette.error.light,
            'ISTP': theme.palette.primary.dark,
            'ISFP': theme.palette.secondary.dark,
            'ESTP': theme.palette.success.dark,
            'ESFP': theme.palette.warning.dark
        };
        return colors[type] || theme.palette.primary.main;
    };

    const handleRetakeTest = (testType: 'personality' | 'major') => {
        if (testType === 'personality') {
            navigate('/personality-test');
        } else {
            navigate('/major-matching-test');
        }
    };


    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!profileData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="info">
                    No profile data available.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                    My Profile
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Your personal dashboard and test results
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* User Information */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ height: 'fit-content' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        backgroundColor: theme.palette.primary.main,
                                        fontSize: '2.5rem',
                                        mb: 2
                                    }}
                                >
                                    {profileData.user.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textAlign: 'center' }}>
                                    {profileData.user.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    Member since {formatDate(profileData.user.created_at)}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Email sx={{ mr: 2, color: theme.palette.text.secondary }} />
                                    <Typography variant="body1">{profileData.user.email}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Schedule sx={{ mr: 2, color: theme.palette.text.secondary }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Last login: {formatLastLogin(profileData.user.last_login)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Edit Profile
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Test Results */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                        {/* Personality Test Results */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Psychology sx={{ mr: 2, fontSize: 32, color: theme.palette.primary.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                                                    Personality Assessment
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Your MBTI personality type and insights
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Tooltip title="Retake test">
                                            <IconButton
                                                onClick={() => handleRetakeTest('personality')}
                                                sx={{
                                                    backgroundColor: theme.palette.primary.light + '20',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.primary.light + '40'
                                                    }
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {profileData.has_personality_test && profileData.personality_result ? (
                                        <>
                                            <Box sx={{ mb: 4 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                    <Chip
                                                        label={profileData.personality_result.type}
                                                        sx={{
                                                            backgroundColor: getPersonalityColor(profileData.personality_result.type),
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            fontSize: '1.2rem',
                                                            px: 3,
                                                            py: 1.5,
                                                            mr: 2
                                                        }}
                                                    />
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                        🧠 Your Personality Type
                                                    </Typography>
                                                </Box>
                                                <Paper sx={{
                                                    p: 3,
                                                    backgroundColor: theme.palette.primary.light + '10',
                                                    border: `1px solid ${theme.palette.primary.main}30`,
                                                    borderRadius: 3
                                                }}>
                                                    <Typography variant="body1" sx={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                                                        {profileData.personality_result.description}
                                                    </Typography>
                                                </Paper>
                                            </Box>

                                            {profileData.personality_result.strengths.length > 0 && (
                                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                                    <Grid item xs={12} md={6}>
                                                        <Paper sx={{
                                                            p: 3,
                                                            backgroundColor: theme.palette.success.light + '15',
                                                            border: `1px solid ${theme.palette.success.main}30`,
                                                            borderRadius: 3,
                                                            height: '100%'
                                                        }}>
                                                            <Typography variant="h6" sx={{
                                                                fontWeight: 700,
                                                                mb: 2,
                                                                color: theme.palette.success.dark,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                                ✅ Strengths
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {profileData.personality_result.strengths.map((strength, index) => (
                                                                    <Chip
                                                                        key={index}
                                                                        label={strength}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: theme.palette.success.main,
                                                                            color: 'white',
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={12} md={6}>
                                                        <Paper sx={{
                                                            p: 3,
                                                            backgroundColor: theme.palette.warning.light + '15',
                                                            border: `1px solid ${theme.palette.warning.main}30`,
                                                            borderRadius: 3,
                                                            height: '100%'
                                                        }}>
                                                            <Typography variant="h6" sx={{
                                                                fontWeight: 700,
                                                                mb: 2,
                                                                color: theme.palette.warning.dark,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                                📈 Growth Areas
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {profileData.personality_result.weaknesses.map((weakness, index) => (
                                                                    <Chip
                                                                        key={index}
                                                                        label={weakness}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: theme.palette.warning.main,
                                                                            color: 'white',
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                            )}

                                            {profileData.personality_result.famous_matches.length > 0 && (
                                                <Box sx={{ mb: 3 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                                                        🌟 Famous Matches
                                                    </Typography>
                                                    <Paper sx={{
                                                        p: 3,
                                                        backgroundColor: theme.palette.grey[50],
                                                        border: `1px solid ${theme.palette.grey[200]}`,
                                                        borderRadius: 3
                                                    }}>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {profileData.personality_result.famous_matches.map((match, index) => (
                                                                <Chip
                                                                    key={index}
                                                                    label={match}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        borderColor: theme.palette.primary.main,
                                                                        color: theme.palette.primary.main,
                                                                        fontWeight: 500
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Paper>
                                                </Box>
                                            )}

                                            <Box sx={{
                                                mt: 3,
                                                p: 2,
                                                backgroundColor: theme.palette.grey[50],
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.grey[200]}`
                                            }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                    📅 Completed on {formatDate(profileData.personality_result.created_at)}
                                                </Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Psychology sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                                No personality test completed yet
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<Psychology />}
                                                onClick={() => navigate('/personality-test')}
                                            >
                                                Take Personality Test
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Major Matching Results */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <School sx={{ mr: 2, fontSize: 32, color: theme.palette.secondary.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                                                    Major Matching
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Your recommended academic programs
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Tooltip title="Retake test">
                                            <IconButton
                                                onClick={() => handleRetakeTest('major')}
                                                sx={{
                                                    backgroundColor: theme.palette.secondary.light + '20',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.secondary.light + '40'
                                                    }
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {profileData.has_major_test && profileData.major_result && profileData.major_result.top_majors ? (
                                        <>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: theme.palette.secondary.main }}>
                                                🎯 Top Recommended Majors
                                            </Typography>
                                            {profileData.major_result.top_majors.slice(0, 3).map((major, index) => {
                                                // Get detailed description for this major
                                                const detailedDescription = getMajorDescription(major.name);
                                                const enhancedMajor = detailedDescription ? {
                                                    ...major,
                                                    description: detailedDescription.description,
                                                    career_paths: detailedDescription.careerPaths
                                                } : major;

                                                return (
                                                    <Paper
                                                        key={index}
                                                        elevation={index === 0 ? 4 : 2}
                                                        sx={{
                                                            p: 3,
                                                            mb: 3,
                                                            borderRadius: 3,
                                                            background: index === 0
                                                                ? `linear-gradient(135deg, ${theme.palette.secondary.light}20, ${theme.palette.secondary.main}10)`
                                                                : `linear-gradient(135deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`,
                                                            border: index === 0 ? `2px solid ${theme.palette.secondary.main}` : `1px solid ${theme.palette.grey[300]}`,
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: theme.shadows[8]
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Box sx={{
                                                                    width: 40,
                                                                    height: 40,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: index === 0 ? theme.palette.secondary.main : theme.palette.grey[400],
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    mr: 2,
                                                                    color: 'white',
                                                                    fontWeight: 700,
                                                                    fontSize: '1.2rem'
                                                                }}>
                                                                    {index + 1}
                                                                </Box>
                                                                <Typography variant="h6" sx={{ fontWeight: 700, color: index === 0 ? theme.palette.secondary.dark : 'inherit' }}>
                                                                    {enhancedMajor.name}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={`${Math.round(enhancedMajor.score)}% match`}
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    backgroundColor: index === 0 ? theme.palette.secondary.main : theme.palette.grey[400],
                                                                    color: 'white',
                                                                    fontSize: '0.9rem'
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6, color: 'text.secondary' }}>
                                                            {enhancedMajor.description}
                                                        </Typography>
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                                                                💼 Career Paths:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {enhancedMajor.career_paths.slice(0, 4).map((path, pathIndex) => (
                                                                    <Chip
                                                                        key={pathIndex}
                                                                        label={path}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: theme.palette.secondary.light + '30',
                                                                            color: theme.palette.secondary.dark,
                                                                            border: `1px solid ${theme.palette.secondary.main}40`,
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                );
                                            })}
                                            <Box sx={{
                                                mt: 3,
                                                p: 2,
                                                backgroundColor: theme.palette.grey[50],
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.grey[200]}`
                                            }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                    📅 Completed on {formatDate(profileData.major_result.created_at)}
                                                </Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <School sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                                {!profileData.has_personality_test
                                                    ? 'Complete personality test first'
                                                    : 'No major test completed yet'
                                                }
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<School />}
                                                onClick={() => navigate('/major-matching-test')}
                                                disabled={!profileData.has_personality_test}
                                            >
                                                Take Major Matching Test
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* AI Counselor Access */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <SupportAgent sx={{ mr: 2, fontSize: 32, color: theme.palette.success.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                                                    AI Career Counselor
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Get personalized career guidance
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            startIcon={<SupportAgent />}
                                            onClick={() => navigate('/chat')}
                                            sx={{ backgroundColor: theme.palette.success.main }}
                                        >
                                            Start Counseling
                                        </Button>
                                    </Box>
                                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        Access our AI-powered career counselor for personalized guidance based on your test results.
                                        Get expert advice on career planning, skill development, and academic decisions.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Profile;
