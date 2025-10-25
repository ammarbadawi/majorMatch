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

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

const Chat: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: 'assistant',
        content: 'Hi! I am your Major Match AI assistant. Ask me anything about majors, careers, or your MBTI results.'
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const prefillSentRef = useRef<boolean>(false);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

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
                    setError('Please log in to use the AI assistant.');
                } else {
                    const data = await resp.json().catch(() => ({} as any));
                    const msg = (data && (data.error?.message || data.error)) || 'Failed to get a response';
                    setError(String(msg));
                }
                return;
            }
            const data = await resp.json();
            const reply = String(data?.reply || '').trim();
            setMessages(prev => [...prev, { role: 'assistant' as const, content: reply || '...' }]);
        } catch (e) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-send prefilled question coming from results page
    useEffect(() => {
        try {
            const st: any = (location && (location as any).state) || {};
            const prefill: string = typeof st?.prefill === 'string' ? String(st.prefill).trim() : '';
            if (prefill && !prefillSentRef.current) {
                prefillSentRef.current = true;
                handleSend(prefill);
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location && (location as any).state]);

    const stopGenerating = () => {
        // No streaming implemented, but we keep the UI affordance for future
        setLoading(false);
    };

    return (
        <Box sx={{ backgroundColor: theme.palette.grey[50], minHeight: 'calc(100vh - 64px)' }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Card elevation={8} sx={{ overflow: 'hidden' }}>
                    <Box sx={{
                        px: 3,
                        py: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: 'white',
                        borderBottom: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <SmartToy />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Major Match AI</Typography>
                            <Chip label="BETA" size="small" sx={{ ml: 'auto', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                        </Stack>
                    </Box>
                    {loading && (
                        <LinearProgress />
                    )}
                    <CardContent sx={{ p: 0 }}>
                        <Box ref={listRef} sx={{ p: 2, maxHeight: '60vh', overflowY: 'auto' }}>
                            <Stack spacing={2}>
                                {messages.map((m, idx) => (
                                    <Stack key={idx} direction="row" spacing={1} alignItems="flex-start" sx={{
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%'
                                    }}>
                                        {m.role === 'assistant' ? (
                                            <SmartToy sx={{ color: theme.palette.primary.main, mt: 0.5 }} />
                                        ) : (
                                            <Person sx={{ color: theme.palette.grey[600], mt: 0.5 }} />
                                        )}
                                        <Paper elevation={m.role === 'user' ? 4 : 1} sx={{
                                            p: 1.5,
                                            backgroundColor: m.role === 'user' ? theme.palette.primary.main : 'white',
                                            color: m.role === 'user' ? 'white' : theme.palette.text.primary,
                                            border: m.role === 'assistant' ? `1px solid ${theme.palette.grey[200]}` : 'none'
                                        }}>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                                        </Paper>
                                    </Stack>
                                ))}
                                {error && (
                                    <Typography color="error" variant="body2">{error}</Typography>
                                )}
                            </Stack>
                        </Box>

                        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TextField
                                    fullWidth
                                    placeholder="Ask about majors, careers, or your MBTI..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                {loading ? (
                                    <IconButton color="warning" onClick={stopGenerating} aria-label="Stop">
                                        <StopCircle />
                                    </IconButton>
                                ) : (
                                    <Button
                                        variant="contained"
                                        endIcon={<Send />}
                                        onClick={() => handleSend()}
                                        disabled={!canSend}
                                    >
                                        Send
                                    </Button>
                                )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                AI can make mistakes. Verify important information.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Chat;


