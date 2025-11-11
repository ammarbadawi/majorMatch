import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { SmartToy, Send, Person, StopCircle } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

const Chat: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: 'assistant',
        content: t('chat.initialMessage')
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);
    const prefillSentRef = useRef<boolean>(false);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

    // Load chat history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const resp = await fetch('/api/chat/history', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (resp.ok) {
                    const data = await resp.json();
                    const historyMessages = Array.isArray(data.messages) ? data.messages : [];
                    if (historyMessages.length > 0) {
                        // Filter out system messages and ensure proper format
                        const validMessages = historyMessages
                            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
                            .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content || '') }));
                        if (validMessages.length > 0) {
                            setMessages(validMessages);
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to load chat history:', e);
                // Don't show error to user, just use default message
            } finally {
                setHistoryLoaded(true);
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, loading]);

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText ?? input).trim();
        if (!text || loading) return;
        setInput('');
        setError(null);
        const userMessage: ChatMessage = { role: 'user', content: text };
        const next: ChatMessage[] = [...messages, userMessage];
        setMessages(next);
        setLoading(true);
        try {
            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) })
            });
            if (!resp.ok) {
                if (resp.status === 401) {
                    setError(t('chat.pleaseLogIn'));
                } else {
                    const data = await resp.json().catch(() => ({} as any));
                    const msg = (data && (data.error?.message || data.error)) || t('chat.error');
                    setError(String(msg));
                }
                return;
            }
            const data = await resp.json();
            const reply = String(data?.reply || '').trim();
            setMessages(prev => [...prev, { role: 'assistant' as const, content: reply || '...' }]);
        } catch (e) {
            setError(t('chat.networkError'));
        } finally {
            setLoading(false);
        }
    };

    // Auto-send prefilled question coming from results page
    useEffect(() => {
        // Only auto-send if history has been loaded
        if (!historyLoaded) return;
        try {
            const st: any = (location && (location as any).state) || {};
            const prefill: string = typeof st?.prefill === 'string' ? String(st.prefill).trim() : '';
            if (prefill && !prefillSentRef.current) {
                prefillSentRef.current = true;
                handleSend(prefill);
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location && (location as any).state, historyLoaded]);

    const stopGenerating = () => {
        // No streaming implemented, but we keep the UI affordance for future
        setLoading(false);
    };

    return (
        <Box sx={{ backgroundColor: theme.palette.grey[50], minHeight: 'calc(100vh - 64px)' }}>
            <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
                <Card elevation={8} sx={{ overflow: 'hidden' }}>
                    <Box sx={{
                        px: { xs: 2, sm: 3 },
                        py: { xs: 1.5, sm: 2 },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: 'white',
                        borderBottom: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <SmartToy sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' } }}>{t('chat.appName')}</Typography>
                            <Chip 
                                label={t('chat.beta')} 
                                size="small" 
                                sx={{ 
                                    ml: 'auto', 
                                    backgroundColor: 'rgba(255,255,255,0.2)', 
                                    color: 'white', 
                                    fontWeight: 700,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                }} 
                            />
                        </Stack>
                    </Box>
                    {loading && (
                        <LinearProgress />
                    )}
                    <CardContent sx={{ p: 0 }}>
                        <Box ref={listRef} sx={{ p: { xs: 1.5, sm: 2 }, maxHeight: { xs: '50vh', sm: '60vh' }, overflowY: 'auto' }}>
                            <Stack spacing={2}>
                                {messages.map((m, idx) => (
                                    <Stack key={idx} direction="row" spacing={1} alignItems="flex-start" sx={{
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: { xs: '90%', sm: '85%' }
                                    }}>
                                        {m.role === 'assistant' ? (
                                            <SmartToy sx={{ color: theme.palette.primary.main, mt: 0.5, fontSize: { xs: 18, sm: 24 } }} />
                                        ) : (
                                            <Person sx={{ color: theme.palette.grey[600], mt: 0.5, fontSize: { xs: 18, sm: 24 } }} />
                                        )}
                                        <Paper elevation={m.role === 'user' ? 4 : 1} sx={{
                                            p: { xs: 1.25, sm: 1.5 },
                                            backgroundColor: m.role === 'user' ? theme.palette.primary.main : 'white',
                                            color: m.role === 'user' ? 'white' : theme.palette.text.primary,
                                            border: m.role === 'assistant' ? `1px solid ${theme.palette.grey[200]}` : 'none',
                                            maxWidth: '100%',
                                            wordBreak: 'break-word'
                                        }}>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{m.content}</Typography>
                                        </Paper>
                                    </Stack>
                                ))}
                                {error && (
                                    <Typography color="error" variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>{error}</Typography>
                                )}
                            </Stack>
                        </Box>

                        <Box sx={{ p: { xs: 1.5, sm: 2 }, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TextField
                                    fullWidth
                                    placeholder={t('chat.placeholderText')}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: { xs: '0.9rem', sm: '1rem' }
                                        }
                                    }}
                                />
                                {loading ? (
                                    <IconButton color="warning" onClick={stopGenerating} aria-label="Stop" sx={{ flexShrink: 0 }}>
                                        <StopCircle />
                                    </IconButton>
                                ) : (
                                    <Button
                                        variant="contained"
                                        endIcon={<Send />}
                                        onClick={() => handleSend()}
                                        disabled={!canSend}
                                        sx={{
                                            flexShrink: 0,
                                            fontSize: { xs: '0.85rem', sm: '0.875rem' },
                                            px: { xs: 1.5, sm: 2 }
                                        }}
                                    >
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('chat.send')}</Box>
                                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{t('chat.send')}</Box>
                                    </Button>
                                )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                {t('chat.aiCanMakeMistakes')}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Chat;


