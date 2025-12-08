import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import privacyTermsArUrl from '../content/privacy-terms-ar.md';
import privacyTermsEnUrl from '../content/privacy-terms.md';
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Typography,
    useTheme
} from '@mui/material';

const PrivacyTerms: React.FC = () => {
    const theme = useTheme();
    const { i18n } = useTranslation();
    const isArabic = i18n.language?.startsWith('ar');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchContent = async () => {
            const endpoint = isArabic ? privacyTermsArUrl : privacyTermsEnUrl;
            const failMessage = isArabic ? 'فشل تحميل محتوى الخصوصية والشروط' : 'Failed to load privacy and terms content';
            const unableMessage = isArabic ? 'تعذر تحميل محتوى الخصوصية والشروط' : 'Unable to load privacy and terms content';
            setLoading(true);
            setError(null);
            try {
                const resp = await fetch(endpoint, { cache: 'no-cache' });
                if (!resp.ok) {
                    throw new Error(failMessage);
                }
                const text = await resp.text();
                if (!cancelled) {
                    setContent(text.trim());
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message || unableMessage);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchContent();
        return () => {
            cancelled = true;
        };
    }, [isArabic]);

    const heading = isArabic ? 'سياسة الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms of Use';

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[100], py: { xs: 4, md: 6 } }}>
            <Container maxWidth="md">
                <Card elevation={8}>
                    <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>
                            {heading}
                        </Typography>
                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        )}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        {!loading && !error && (
                            <Typography
                                component="div"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.8,
                                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                                    color: theme.palette.text.primary
                                }}
                            >
                                {content}
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default PrivacyTerms;

