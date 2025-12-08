import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Avatar,
    Grid,
    Divider,
    Button,
    CircularProgress,
    Alert,
    useTheme,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tabs,
    Tab,
    InputAdornment,
    useMediaQuery,
    Rating
} from '@mui/material';
import {
    Email,
    Psychology,
    School,
    SupportAgent,
    Edit,
    Schedule,
    Lock,
    Visibility,
    VisibilityOff,
    Person,
    Replay,
    Star
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

interface RatingSummary {
    average: number;
    total: number;
    distribution: Record<number, number>;
    recent: Array<{
        value: number;
        comment: string;
        updated_at: string;
    }>;
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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editTab, setEditTab] = useState(0);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
    const [myRating, setMyRating] = useState<number | null>(null);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingStatus, setRatingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);

    useEffect(() => {
        fetchProfileData();
        fetchRatings();
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
            setError(err.message || t('profile.failedToLoadProfile'));
        } finally {
            setLoading(false);
        }
    };

    const fetchRatings = async () => {
        try {
            setRatingLoading(true);
            setRatingStatus(null);
            const [summaryRes, myRes] = await Promise.all([
                fetch('/api/ratings/summary', { credentials: 'include' }),
                fetch('/api/ratings/me', { credentials: 'include' })
            ]);

            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                setRatingSummary(summaryData);
            } else {
                setRatingStatus({ type: 'error', message: t('profile.ratingLoadError') });
            }

            if (myRes.ok) {
                const myData = await myRes.json();
                setMyRating(myData.rating ?? null);
                setRatingComment(myData.comment ?? '');
            } else if (myRes.status !== 401) {
                setRatingStatus({ type: 'error', message: t('profile.ratingLoadError') });
            }
        } catch (err) {
            setRatingStatus({ type: 'error', message: t('profile.ratingLoadError') });
        } finally {
            setRatingLoading(false);
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

    const handleSubmitRating = async () => {
        if (!myRating) {
            setRatingStatus({ type: 'error', message: t('profile.selectRating') });
            return;
        }

        try {
            setRatingSubmitting(true);
            setRatingStatus(null);
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating: myRating, comment: ratingComment })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || t('profile.ratingSubmitError'));
            }
            setRatingStatus({ type: 'success', message: t('profile.ratingThanks') });
            setRatingSummary(data.summary || null);
            setMyRating(data.rating?.value ?? myRating);
            setRatingComment(data.rating?.comment ?? ratingComment);
        } catch (err: any) {
            setRatingStatus({
                type: 'error',
                message: err?.message || t('profile.ratingSubmitError')
            });
        } finally {
            setRatingSubmitting(false);
        }
    };

    const formatLastLogin = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return t('profile.justNow');
        } else if (diffInHours < 24) {
            const key = diffInHours === 1 ? 'profile.hoursAgo' : 'profile.hoursAgo_plural';
            return t(key, { count: diffInHours });
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) {
                const key = diffInDays === 1 ? 'profile.daysAgo' : 'profile.daysAgo_plural';
                return t(key, { count: diffInDays });
            } else {
                return formatDate(dateString);
            }
        }
    };

    const handleRetakeTest = (testType: 'personality' | 'major') => {
        if (testType === 'personality') {
            navigate('/personality-test');
        } else {
            navigate('/major-matching-test');
        }
    };

    const handleOpenEditModal = () => {
        if (profileData) {
            const nameParts = profileData.user.name.split(' ');
            setEditFormData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setEditTab(0);
            setEditError(null);
            setEditSuccess(null);
            setEditModalOpen(true);
        }
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditError(null);
        setEditSuccess(null);
        setEditFormData({
            firstName: '',
            lastName: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async () => {
        setEditLoading(true);
        setEditError(null);
        setEditSuccess(null);
        try {
            const res = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    firstName: editFormData.firstName,
                    lastName: editFormData.lastName
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }
            setEditSuccess(t('profile.profileUpdatedSuccessfully'));
            // Refresh profile data
            await fetchProfileData();
            setTimeout(() => {
                handleCloseEditModal();
            }, 1500);
        } catch (err: any) {
            setEditError(err.message || t('profile.failedToUpdateProfile'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setEditLoading(true);
        setEditError(null);
        setEditSuccess(null);
        
        if (editFormData.newPassword !== editFormData.confirmPassword) {
            setEditError(t('profile.newPasswordsDoNotMatch'));
            setEditLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: editFormData.currentPassword,
                    newPassword: editFormData.newPassword
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password');
            }
            setEditSuccess(t('profile.passwordChangedSuccessfully'));
            setEditFormData({
                ...editFormData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setTimeout(() => {
                handleCloseEditModal();
            }, 1500);
        } catch (err: any) {
            setEditError(err.message || t('profile.failedToChangePassword'));
        } finally {
            setEditLoading(false);
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
                    {t('profile.noProfileDataAvailable')}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' } }}>
                    {t('profile.myProfile')}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {t('profile.subtitle')}
                </Typography>
            </Box>

            <Grid container spacing={{ xs: 3, sm: 4 }}>
                {/* User Information */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ height: 'fit-content' }}>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: { xs: 80, sm: 100 },
                                        height: { xs: 80, sm: 100 },
                                        backgroundColor: theme.palette.primary.main,
                                        fontSize: { xs: '2rem', sm: '2.5rem' },
                                        mb: 2
                                    }}
                                >
                                    {profileData.user.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textAlign: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                    {profileData.user.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                                    {t('profile.memberSince')} {formatDate(profileData.user.created_at)}
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
                                        {t('profile.lastLogin')} {formatLastLogin(profileData.user.last_login)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                fullWidth
                                onClick={handleOpenEditModal}
                                sx={{ 
                                    mb: 2,
                                    py: { xs: 1.25, sm: 1.5 },
                                    fontSize: { xs: '0.9rem', sm: '1rem' }
                                }}
                            >
                                {t('profile.editProfile')}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Test Results */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                        {/* Personality Test Results */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                                            <Psychology sx={{ mr: 2, fontSize: { xs: 24, sm: 32 }, color: theme.palette.primary.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                                    {t('profile.personalityAssessment')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                                                    {t('profile.personalityTestDescription')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Tooltip title={t('profile.retakeTest')}>
                                            <IconButton
                                                onClick={() => handleRetakeTest('personality')}
                                                sx={{
                                                    backgroundColor: theme.palette.primary.light + '20',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.primary.light + '40'
                                                    },
                                                    ml: { xs: 1, sm: 0 }
                                                }}
                                            >
                                                <Replay />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {profileData.has_personality_test && profileData.personality_result ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Psychology sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
                                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                                {t('profile.personalityTestCompleted')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                                {t('profile.viewDetailedResults')}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="large"
                                                startIcon={<Psychology />}
                                                onClick={() => navigate('/personality-results', {
                                                    state: {
                                                        personalityType: profileData.personality_result?.type,
                                                        personalityData: {
                                                            type: profileData.personality_result?.type,
                                                            content: profileData.personality_result?.description
                                                        }
                                                    }
                                                })}
                                                sx={{
                                                    py: { xs: 1.5, sm: 2 },
                                                    px: { xs: 3, sm: 4 },
                                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                                    fontWeight: 700,
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                    '&:hover': {
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                                    }
                                                }}
                                            >
                                                {t('profile.viewResults')}
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Psychology sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                                {t('profile.noPersonalityTestYet')}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<Psychology />}
                                                onClick={() => navigate('/personality-test')}
                                            >
                                                {t('profile.takePersonalityTest')}
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Major Matching Results */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                                            <School sx={{ mr: 2, fontSize: { xs: 24, sm: 32 }, color: theme.palette.secondary.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                                    {t('profile.majorMatching')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                                                    {t('profile.majorMatchingDescription')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Tooltip title={t('profile.retakeTest')}>
                                            <IconButton
                                                onClick={() => handleRetakeTest('major')}
                                                sx={{
                                                    backgroundColor: theme.palette.secondary.light + '20',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.secondary.light + '40'
                                                    },
                                                    ml: { xs: 1, sm: 0 }
                                                }}
                                            >
                                                <Replay />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {profileData.has_major_test && profileData.major_result && profileData.major_result.top_majors ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <School sx={{ fontSize: 64, color: theme.palette.secondary.main, mb: 2 }} />
                                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                                {t('profile.majorMatchingTestCompleted')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                                {t('profile.viewPersonalizedRecommendations')}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="large"
                                                startIcon={<School />}
                                                onClick={() => {
                                                    // Convert top_majors format to match what MajorMatchingResults expects
                                                    const results = profileData.major_result?.top_majors.map(major => ({
                                                        name: major.name,
                                                        match: major.score,
                                                        description: major.description,
                                                        careerPaths: major.career_paths
                                                    })) || [];
                                                    navigate('/major-matching-results', {
                                                        state: { results }
                                                    });
                                                }}
                                                sx={{
                                                    py: { xs: 1.5, sm: 2 },
                                                    px: { xs: 3, sm: 4 },
                                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                                    fontWeight: 700,
                                                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                                                    '&:hover': {
                                                        background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                                                    }
                                                }}
                                            >
                                                {t('profile.viewResults')}
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <School sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                                {!profileData.has_personality_test
                                                    ? t('profile.completePersonalityTestFirst')
                                                    : t('profile.noMajorTestYet')
                                                }
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<School />}
                                                onClick={() => navigate('/major-matching-test')}
                                                disabled={!profileData.has_personality_test}
                                            >
                                                {t('profile.takeMajorMatchingTest')}
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* AI Counselor Access */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                                            <SupportAgent sx={{ mr: 2, fontSize: { xs: 24, sm: 32 }, color: theme.palette.success.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                                    {t('profile.aiCareerCounselor')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                                                    {t('profile.getPersonalizedGuidance')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            startIcon={<SupportAgent />}
                                            onClick={() => navigate('/chat')}
                                            sx={{ 
                                                backgroundColor: theme.palette.success.main,
                                                width: { xs: '100%', sm: 'auto' },
                                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                                py: { xs: 1.25, sm: 1.5 },
                                                px: { xs: 2, sm: 3 }
                                            }}
                                        >
                                            {t('profile.startCounseling')}
                                        </Button>
                                    </Box>
                                    <Typography variant="body1" sx={{ lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                                        {t('profile.aiCounselorDescription')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Ratings */}
                        <Grid item xs={12}>
                            <Card elevation={3}>
                                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 0 } }}>
                                            <Star sx={{ mr: 2, fontSize: { xs: 24, sm: 32 }, color: theme.palette.warning.main }} />
                                            <Box>
                                                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                                    {t('profile.rateExperience')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                                    {t('profile.ratingSubtitle')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {ratingStatus && (
                                        <Alert severity={ratingStatus.type} sx={{ mb: 2 }}>
                                            {ratingStatus.message}
                                        </Alert>
                                    )}

                                    {ratingLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                            <CircularProgress size={48} />
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                                {t('profile.yourRatingLabel')}
                                            </Typography>
                                            <Rating
                                                value={myRating ?? 0}
                                                precision={1}
                                                size="large"
                                                onChange={(_, value) => setMyRating(value)}
                                                sx={{ mb: 2 }}
                                            />
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={3}
                                                maxRows={6}
                                                value={ratingComment}
                                                onChange={(e) => setRatingComment(e.target.value)}
                                                placeholder={t('profile.ratingPlaceholder')}
                                                sx={{ mb: 2 }}
                                            />
                                            <Button
                                                variant="contained"
                                                onClick={handleSubmitRating}
                                                disabled={ratingSubmitting}
                                                startIcon={ratingSubmitting ? <CircularProgress size={20} /> : undefined}
                                            >
                                                {t('profile.submitRating')}
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Edit Profile Modal */}
            <Dialog
                open={editModalOpen}
                onClose={handleCloseEditModal}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 0, sm: 3 },
                        m: { xs: 0, sm: 2 },
                        maxHeight: { xs: '100vh', sm: '90vh' },
                        width: { xs: '100%', sm: 'auto' }
                    }
                }}
            >
                <DialogTitle sx={{ pb: { xs: 1, sm: 1.5 }, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {t('profile.editProfileTitle')}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 }, pt: { xs: 2, sm: 3 } }}>
                    <Tabs
                        value={editTab}
                        onChange={(_, newValue) => {
                            setEditTab(newValue);
                            setEditError(null);
                            setEditSuccess(null);
                        }}
                        sx={{ 
                            mb: { xs: 2, sm: 3 },
                            '& .MuiTab-root': {
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                minHeight: { xs: 40, sm: 48 },
                                px: { xs: 1.5, sm: 2 }
                            }
                        }}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label={t('profile.personalInfo')} />
                        <Tab label={t('profile.changePassword')} />
                    </Tabs>

                    {editError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {editError}
                        </Alert>
                    )}

                    {editSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {editSuccess}
                        </Alert>
                    )}

                    {editTab === 0 && (
                        <Box>
                            <TextField
                                fullWidth
                                label={t('common.firstName')}
                                name="firstName"
                                value={editFormData.firstName}
                                onChange={handleEditFormChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: theme.palette.text.secondary, fontSize: { xs: 20, sm: 24 } }} />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label={t('common.lastName')}
                                name="lastName"
                                value={editFormData.lastName}
                                onChange={handleEditFormChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: theme.palette.text.secondary, fontSize: { xs: 20, sm: 24 } }} />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }
                                }}
                            />
                        </Box>
                    )}

                    {editTab === 1 && (
                        <Box>
                            <TextField
                                fullWidth
                                label={t('profile.currentPassword')}
                                name="currentPassword"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={editFormData.currentPassword}
                                onChange={handleEditFormChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: theme.palette.text.secondary, fontSize: { xs: 20, sm: 24 } }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                edge="end"
                                                size="small"
                                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                                            >
                                                {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label={t('profile.newPassword')}
                                name="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={editFormData.newPassword}
                                onChange={handleEditFormChange}
                                required
                                margin="normal"
                                helperText={t('profile.passwordHelperText')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: theme.palette.text.secondary, fontSize: { xs: 20, sm: 24 } }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                edge="end"
                                                size="small"
                                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                                            >
                                                {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    },
                                    '& .MuiFormHelperText-root': {
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        lineHeight: { xs: 1.3, sm: 1.5 }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label={t('profile.confirmNewPassword')}
                                name="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={editFormData.confirmPassword}
                                onChange={handleEditFormChange}
                                required
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: theme.palette.text.secondary, fontSize: { xs: 20, sm: 24 } }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                edge="end"
                                                size="small"
                                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                                            >
                                                {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }
                                }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    pt: { xs: 1, sm: 2 },
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                }}>
                    <Button 
                        onClick={handleCloseEditModal} 
                        disabled={editLoading}
                        fullWidth={isMobile}
                        sx={{
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            py: { xs: 1.25, sm: 1 }
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={editTab === 0 ? handleUpdateProfile : handleChangePassword}
                        variant="contained"
                        disabled={editLoading}
                        fullWidth={isMobile}
                        startIcon={editLoading ? <CircularProgress size={20} /> : undefined}
                        sx={{
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            py: { xs: 1.25, sm: 1 }
                        }}
                    >
                        {editLoading ? t('profile.saving') : editTab === 0 ? t('profile.saveChanges') : t('profile.changePasswordButton')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Profile;
