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
    useMediaQuery
} from '@mui/material';
import { School, Menu, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [hasMbti, setHasMbti] = useState<boolean>(() => {
        try { return localStorage.getItem('hasMbti') === '1'; } catch { return false; }
    });
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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
                        Home
                    </Button>
                    <Tooltip title="Log in to take the personality test" disableHoverListener={isAuthenticated}>
                        <span>
                            <Button
                                color={isActive('/personality-test') ? 'primary' : 'inherit'}
                                onClick={() => navigate('/personality-test')}
                                sx={{ fontWeight: 600 }}
                                disabled={!isAuthenticated}
                            >
                                Personality Test
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="You need to complete the personality test first" disableHoverListener={hasMbti}>
                        <span>
                            <Button
                                color={isActive('/major-matching-test') ? 'primary' : 'inherit'}
                                onClick={() => navigate('/major-matching-test')}
                                sx={{ fontWeight: 600 }}
                                disabled={!hasMbti}
                            >
                                Major Match
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
                                Profile
                            </Button>
                            <Button
                                color={isActive('/chat') ? 'primary' : 'inherit'}
                                onClick={() => navigate('/chat')}
                                sx={{ fontWeight: 600 }}
                            >
                                AI Chat
                            </Button>
                        </>
                    )}
                    {isAuthenticated ? (
                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            sx={{ fontWeight: 700, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}
                        >
                            Log out
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/login')}
                                sx={{ fontWeight: 700, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}
                            >
                                Log in
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/signup')}
                                sx={{ fontWeight: 700 }}
                            >
                                Sign up
                            </Button>
                        </>
                    )}
                </Stack>

                {/* Mobile menu button */}
                <IconButton
                    color="inherit"
                    onClick={() => setMobileOpen(true)}
                    sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                    aria-label="open navigation menu"
                >
                    <Menu />
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
                        <ListItemText primary="Home" />
                    </ListItemButton>
                    <Tooltip title="Log in to take the personality test" disableHoverListener={isAuthenticated} placement="left">
                        <span>
                            <ListItemButton disabled={!isAuthenticated} selected={isActive('/personality-test')} onClick={() => go('/personality-test')}>
                                <ListItemText primary="Personality Test" />
                            </ListItemButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="You need to complete the personality test first" disableHoverListener={hasMbti} placement="left">
                        <span>
                            <ListItemButton disabled={!hasMbti} selected={isActive('/major-matching-test')} onClick={() => go('/major-matching-test')}>
                                <ListItemText primary="Major Match" />
                            </ListItemButton>
                        </span>
                    </Tooltip>
                    {isAuthenticated && (
                        <>
                            <ListItemButton selected={isActive('/profile')} onClick={() => go('/profile')}>
                                <ListItemText primary="Profile" />
                            </ListItemButton>
                            <ListItemButton selected={isActive('/chat')} onClick={() => go('/chat')}>
                                <ListItemText primary="AI Chat" />
                            </ListItemButton>
                        </>
                    )}
                </List>
                <Divider sx={{ my: 1 }} />
                <List>
                    {isAuthenticated ? (
                        <ListItemButton onClick={() => { setMobileOpen(false); handleLogout(); }}>
                            <ListItemText primary="Log out" />
                        </ListItemButton>
                    ) : (
                        <>
                            <ListItemButton onClick={() => go('/login')}>
                                <ListItemText primary="Log in" />
                            </ListItemButton>
                            <ListItemButton onClick={() => go('/signup')}>
                                <ListItemText primary="Sign up" />
                            </ListItemButton>
                        </>
                    )}
                </List>
            </Drawer>
        </AppBar>
    );
};

export default NavBar;


