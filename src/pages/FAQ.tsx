import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import faqContentArUrl from '../content/faq-content-ar.txt';
import faqContentEnUrl from '../content/faq-content.txt';
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

const FAQ: React.FC = () => {
    const theme = useTheme();
    const { i18n } = useTranslation();
    const isArabic = i18n.language?.startsWith('ar');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchContent = async () => {
            const endpoint = isArabic ? faqContentArUrl : faqContentEnUrl;
            const failMessage = isArabic ? 'فشل تحميل محتوى الأسئلة الشائعة' : 'Failed to load FAQ content';
            const unableMessage = isArabic ? 'تعذر تحميل محتوى الأسئلة الشائعة' : 'Unable to load FAQ content';
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

    const heading = isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions';

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50], py: { xs: 4, md: 6 } }}>
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

export default FAQ;

