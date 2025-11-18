import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Stack,
    useTheme,
    Tooltip,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    useMediaQuery,
    Menu,
    MenuItem
} from '@mui/material';
import { School, Menu as MenuIcon, Person, Language } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NavBar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [hasMbti, setHasMbti] = useState<boolean>(() => {
        try { return localStorage.getItem('hasMbti') === '1'; } catch { return false; }
    });
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);
    const [navLoading, setNavLoading] = useState<'personality' | 'major' | null>(null);

    useEffect(() => {
        let cancelled = false;
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                if (!cancelled) setIsAuthenticated(res.ok);
            } catch {
                if (!cancelled) setIsAuthenticated(false);
            }
        };
        checkAuth();
        return () => { cancelled = true; };
    }, [location.pathname]);

    useEffect(() => {
        let cancelled = false;
        const checkMbti = async () => {
            if (!isAuthenticated) { setHasMbti(false); return; }
            try {
                const res = await fetch('/api/personality/latest', { credentials: 'include' });
                if (!cancelled) {
                    if (res.ok) {
                        const data = await res.json().catch(() => ({}));
                        const has = Boolean(data?.hasResult ?? true);
                        setHasMbti(prev => prev || has);
                        try { if (has) localStorage.setItem('hasMbti', '1'); } catch { }
                    } else {
                        // keep previous state to avoid flicker after completion
                        setHasMbti(prev => prev);
                    }
                }
            } catch {
                if (!cancelled) setHasMbti(prev => prev);
            }
        };
        checkMbti();
        return () => { cancelled = true; };
    }, [isAuthenticated, location.pathname]);

    useEffect(() => {
        const onMbti = () => setHasMbti(true);
        window.addEventListener('mbti-completed', onMbti);
        return () => window.removeEventListener('mbti-completed', onMbti);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch { }
        setIsAuthenticated(false);
        setHasMbti(false);
        try { localStorage.removeItem('hasMbti'); } catch { }
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;
    const go = (path: string) => { navigate(path); setMobileOpen(false); };

    const handlePersonalityNav = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!hasMbti) {
            navigate('/personality-test');
            return;
        }
        if (navLoading) return;
        setNavLoading('personality');
        try {
            const latestRes = await fetch('/api/personality/latest', { credentials: 'include' });
            if (latestRes.status === 401) {
                navigate('/login');
                return;
            }
            if (!latestRes.ok) throw new Error('Failed to load latest personality result');
            const latest = await latestRes.json();
            if (!latest?.type) throw new Error('No personality type found');

            const detailRes = await fetch(`/api/personality/${encodeURIComponent(latest.type)}`, { credentials: 'include' });
            if (!detailRes.ok) throw new Error('Failed to load personality details');
            const personalityData = await detailRes.json();

            navigate('/personality-results', {
                state: {
                    personalityType: latest.type,
                    personalityData
                }
            });
        } catch (error) {
            console.error('[NavBar] Unable to load personality results:', error);
            navigate('/personality-test');
        } finally {
            setNavLoading(current => current === 'personality' ? null : current);
        }
    };

    const handleMajorNav = async () => {
        if (!hasMbti || !isAuthenticated) {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            navigate('/major-matching-test');
            return;
        }
        if (navLoading) return;
        setNavLoading('major');
        try {
            const profileRes = await fetch('/api/profile', { credentials: 'include' });
            if (profileRes.status === 401) {
                navigate('/login');
                return;
            }
            if (!profileRes.ok) throw new Error('Failed to load profile');
            const profile = await profileRes.json();
            const topMajors = profile?.major_result?.top_majors;
            if (Array.isArray(topMajors) && topMajors.length > 0) {
                type ApiMajor = {
                    name: string;
                    score?: number;
                    description?: string;
                    career_paths?: string[];
                };
                const formatted = (topMajors as ApiMajor[]).map((major) => ({
                    name: major.name,
                    match: typeof major.score === 'number' ? major.score : 0,
                    description: major.description || '',
                    careerPaths: major.career_paths || []
                }));
                navigate('/major-matching-results', { state: { results: formatted } });
                return;
            }
            navigate('/major-matching-test');
        } catch (error) {
            console.error('[NavBar] Unable to load major results:', error);
            navigate('/major-matching-test');
        } finally {
            setNavLoading(current => current === 'major' ? null : current);
        }
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        setLangMenuAnchor(null);
    };

    const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLangMenuAnchor(event.currentTarget);
    };

    const handleLangMenuClose = () => {
        setLangMenuAnchor(null);
    };

    return (
        <AppBar position="sticky" color="default" elevation={0} sx={{ zIndex: (t) => t.zIndex.appBar }}>
            <Toolbar sx={{ py: 1.5 }}>
                <IconButton
                    edge="start"
                    color="primary"
                    onClick={() => navigate('/')}
                    sx={{ mr: 1.5 }}
                >
                </IconButton>
                <Typography
                    onClick={() => navigate('/')}
                    sx={{
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                    variant="h6"
                >
                    Major Match
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Button
                        color={isActive('/') ? 'primary' : 'inherit'}
                        onClick={() => navigate('/')}
                        sx={{ fontWeight: 600 }}
                    >
                        {t('common.home')}
                    </Button>
                    <Tooltip title={t('common.login')} disableHoverListener={isAuthenticated}>
                        <span>
                            <Button
                                color={isActive('/personality-test') ? 'primary' : 'inherit'}
                                onClick={() => { void handlePersonalityNav(); }}
                                sx={{ fontWeight: 600 }}
                                disabled={!isAuthenticated || navLoading === 'personality'}
                            >
                                {t('common.personalityTest')}
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title={t('common.majorMatch')} disableHoverListener={hasMbti}>
                        <span>
                            <Button
                                color={isActive('/major-matching-test') ? 'primary' : 'inherit'}
                                onClick={() => { void handleMajorNav(); }}
                                sx={{ fontWeight: 600 }}
                                disabled={!hasMbti || navLoading === 'major'}
                            >
                                {t('common.majorMatch')}
                            </Button>
                        </span>
                    </Tooltip>
                    {isAuthenticated && (
                        <>
                            <Button
                                color={isActive('/profile') ? 'primary' : 'inherit'}
                                onClick={() => navigate('/profile')}
                                sx={{ fontWeight: 600 }}
                                startIcon={<Person />}
                            >
                                {t('common.profile')}
                            </Button>
                            <Button
                                color={isActive('/chat') ? 'primary' : 'inherit'}
                                onClick={() => navigate('/chat')}
                                sx={{ fontWeight: 600 }}
                            >
                                {t('common.aiChat')}
                            </Button>
                        </>
                    )}
                    <IconButton
                        onClick={handleLangMenuOpen}
                        sx={{ color: 'inherit' }}
                        aria-label="change language"
                    >
                        <Language />
                    </IconButton>
                    <Menu
                        anchorEl={langMenuAnchor}
                        open={Boolean(langMenuAnchor)}
                        onClose={handleLangMenuClose}
                    >
                        <MenuItem onClick={() => handleLanguageChange('en')} selected={i18n.language === 'en'}>
                            English
                        </MenuItem>
                        <MenuItem onClick={() => handleLanguageChange('ar')} selected={i18n.language === 'ar'}>
                            العربية
                        </MenuItem>
                    </Menu>
                    {isAuthenticated ? (
                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            sx={{ fontWeight: 700, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}
                        >
                            {t('common.logout')}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/login')}
                                sx={{ fontWeight: 700, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}
                            >
                                {t('common.login')}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/signup')}
                                sx={{ fontWeight: 700 }}
                            >
                                {t('common.signup')}
                            </Button>
                        </>
                    )}
                </Stack>

                {/* Language switcher for mobile */}
                <IconButton
                    onClick={handleLangMenuOpen}
                    sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }}
                    aria-label="change language"
                >
                    <Language />
                </IconButton>
                <Menu
                    anchorEl={langMenuAnchor}
                    open={Boolean(langMenuAnchor)}
                    onClose={handleLangMenuClose}
                >
                    <MenuItem onClick={() => handleLanguageChange('en')} selected={i18n.language === 'en'}>
                        English
                    </MenuItem>
                    <MenuItem onClick={() => handleLanguageChange('ar')} selected={i18n.language === 'ar'}>
                        العربية
                    </MenuItem>
                </Menu>
                {/* Mobile menu button */}
                <IconButton
                    color="inherit"
                    onClick={() => setMobileOpen(true)}
                    sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                    aria-label="open navigation menu"
                >
                    <MenuIcon />
                </IconButton>
            </Toolbar>
            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                PaperProps={{ sx: { width: 280, p: 1.5 } }}
            >
                <List>
                    <ListItemButton selected={isActive('/')} onClick={() => go('/')}>
                        <ListItemText primary={t('common.home')} />
                    </ListItemButton>
                    <Tooltip title={t('common.login')} disableHoverListener={isAuthenticated} placement="left">
                        <span>
                            <ListItemButton
                                disabled={!isAuthenticated || navLoading === 'personality'}
                                selected={isActive('/personality-test')}
                                onClick={() => {
                                    setMobileOpen(false);
                                    void handlePersonalityNav();
                                }}
                            >
                                <ListItemText primary={t('common.personalityTest')} />
                            </ListItemButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t('common.majorMatch')} disableHoverListener={hasMbti} placement="left">
                        <span>
                            <ListItemButton
                                disabled={!hasMbti || navLoading === 'major'}
                                selected={isActive('/major-matching-test')}
                                onClick={() => {
                                    setMobileOpen(false);
                                    void handleMajorNav();
                                }}
                            >
                                <ListItemText primary={t('common.majorMatch')} />
                            </ListItemButton>
                        </span>
                    </Tooltip>
                    {isAuthenticated && (
                        <>
                            <ListItemButton selected={isActive('/profile')} onClick={() => go('/profile')}>
                                <ListItemText primary={t('common.profile')} />
                            </ListItemButton>
                            <ListItemButton selected={isActive('/chat')} onClick={() => go('/chat')}>
                                <ListItemText primary={t('common.aiChat')} />
                            </ListItemButton>
                        </>
                    )}
                </List>
                <Divider sx={{ my: 1 }} />
                <List>
                    {isAuthenticated ? (
                        <ListItemButton onClick={() => { setMobileOpen(false); handleLogout(); }}>
                            <ListItemText primary={t('common.logout')} />
                        </ListItemButton>
                    ) : (
                        <>
                            <ListItemButton onClick={() => go('/login')}>
                                <ListItemText primary={t('common.login')} />
                            </ListItemButton>
                            <ListItemButton onClick={() => go('/signup')}>
                                <ListItemText primary={t('common.signup')} />
                            </ListItemButton>
                        </>
                    )}
                </List>
            </Drawer>
        </AppBar>
    );
};

export default NavBar;


