import React from 'react';
import { Box, Container, Divider, Link, Stack, Typography, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const SUPPORT_EMAIL = 'majormatch.lb@gmail.com';
const SUPPORT_PHONE = '+961 78 969 455';

const Footer: React.FC = () => {
    const theme = useTheme();

    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: theme.palette.grey[900],
                color: 'white',
                mt: 6,
                pt: 6,
                pb: 4
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={4}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            Major Match
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                            Personalized guidance for your future major, powered by AI.
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ letterSpacing: 1, mb: 1 }}>
                            Contact Us
                        </Typography>
                        <Stack spacing={0.5}>
                            <Link
                                href={`mailto:${SUPPORT_EMAIL}`}
                                color="inherit"
                                underline="hover"
                                sx={{ fontWeight: 600 }}
                            >
                                {SUPPORT_EMAIL}
                            </Link>
                            <Link
                                href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`}
                                color="inherit"
                                underline="hover"
                                sx={{ fontWeight: 600 }}
                            >
                                {SUPPORT_PHONE}
                            </Link>
                        </Stack>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ letterSpacing: 1, mb: 1 }}>
                            Helpful Links
                        </Typography>
                        <Stack spacing={0.5}>
                            <Link component={RouterLink} to="/faq" color="inherit" underline="hover">
                                FAQ
                            </Link>
                            <Link component={RouterLink} to="/privacy-terms" color="inherit" underline="hover">
                                Privacy &amp; Terms
                            </Link>
                        </Stack>
                    </Box>
                </Stack>
                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    © {new Date().getFullYear()} Major Match. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;

