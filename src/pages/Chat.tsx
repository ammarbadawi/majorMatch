import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Drawer,
    IconButton,
    LinearProgress,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    SmartToy,
    Send,
    Person,
    StopCircle,
    Menu,
    Add,
    DriveFileRenameOutline,
    DeleteOutline,
    ChatBubbleOutline,
    Check,
    Close
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

type ConversationSummary = {
    id: string;
    title: string;
    preview?: string;
    updated_at?: string;
    created_at?: string;
};

type ConversationResponse = ConversationSummary & {
    messages: ChatMessage[];
};

const Chat: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const { t } = useTranslation();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; conversation: ConversationSummary | null }>({
        open: false,
        conversation: null
    });

    const listRef = useRef<HTMLDivElement | null>(null);
    const prefillSentRef = useRef<boolean>(false);

    const canSend = useMemo(
        () => input.trim().length > 0 && !loading && Boolean(activeConversationId),
        [input, loading, activeConversationId]
    );

    const formatMessages = useCallback((incoming?: any[]): ChatMessage[] => {
        if (!Array.isArray(incoming)) return [];
        return incoming
            .filter((m) => m && m.content !== undefined)
            .map((m) => {
                const role = String(m.role || 'user').toLowerCase();
                return {
                    role: role === 'assistant' ? 'assistant' : role === 'system' ? 'system' : 'user',
                    content: String(m.content || '')
                } as ChatMessage;
            })
            .filter((m) => m.content.trim().length);
    }, []);

    const mergeConversationSummary = useCallback(
        (conversation?: ConversationResponse | ConversationSummary | null) => {
            if (!conversation || !conversation.id) return;
            const summary: ConversationSummary = {
                id: conversation.id,
                title: conversation.title || t('chat.defaultConversationTitle'),
                preview:
                    'preview' in conversation && conversation.preview !== undefined
                        ? conversation.preview
                        : Array.isArray((conversation as ConversationResponse).messages) &&
                            (conversation as ConversationResponse).messages.length
                            ? (conversation as ConversationResponse).messages[(conversation as ConversationResponse).messages.length - 1].content
                            : '',
                updated_at: conversation.updated_at,
                created_at: conversation.created_at
            };
            setConversations((prev) => {
                const filtered = prev.filter((c) => c.id !== summary.id);
                const next = [summary, ...filtered];
                next.sort(
                    (a, b) =>
                        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
                );
                return next;
            });
        },
        [t]
    );

    const fetchConversation = useCallback(
        async (conversationId?: string, allowFallback = true) => {
            setConversationLoading(true);
            try {
                const params = conversationId ? `?conversationId=${conversationId}` : '';
                const resp = await fetch(`/api/chat/history${params}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (!resp.ok) {
                    if (resp.status === 401) {
                        setError(t('chat.pleaseLogIn'));
                    }
                    return;
                }
                const data = await resp.json();
                const list = Array.isArray(data?.conversations)
                    ? (data.conversations as ConversationSummary[])
                    : [];
                setConversations(list);

                if (data?.activeConversation) {
                    const conversation = data.activeConversation as ConversationResponse;
                    setActiveConversationId(conversation.id);
                    setMessages(formatMessages(conversation.messages));
                    mergeConversationSummary(conversation);
                } else if (list.length > 0 && allowFallback) {
                    const fallbackId = conversationId && list.some((c) => c.id === conversationId)
                        ? conversationId
                        : list[0].id;
                    await fetchConversation(fallbackId, false);
                } else {
                    setActiveConversationId(null);
                    setMessages([]);
                }
            } catch (e) {
                console.warn('Failed to load chat history:', e);
                setError(t('chat.networkError'));
            } finally {
                setConversationLoading(false);
                setHistoryLoaded(true);
            }
        },
        [formatMessages, mergeConversationSummary, t]
    );

    useEffect(() => {
        fetchConversation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isMdUp) {
            setMobileSidebarOpen(false);
        }
    }, [isMdUp]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, loading, conversationLoading]);

    const createConversation = useCallback(async () => {
        try {
            setConversationLoading(true);
            const resp = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({})
            });
            if (!resp.ok) {
                if (resp.status === 401) {
                    setError(t('chat.pleaseLogIn'));
                } else {
                    setError(t('chat.error'));
                }
                return null;
            }
            const data = await resp.json();
            if (data?.conversation) {
                const conversation = data.conversation as ConversationResponse;
                setActiveConversationId(conversation.id);
                setMessages(formatMessages(conversation.messages));
                mergeConversationSummary(conversation);
                return conversation.id;
            }
        } catch (err) {
            console.warn('Failed to create conversation', err);
            setError(t('chat.networkError'));
        } finally {
            setConversationLoading(false);
        }
        return null;
    }, [formatMessages, mergeConversationSummary, t]);

    const ensureConversation = useCallback(async () => {
        if (activeConversationId) return activeConversationId;
        return await createConversation();
    }, [activeConversationId, createConversation]);

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText ?? input).trim();
        if (!text || loading) return;
        const conversationId = await ensureConversation();
        if (!conversationId) return;

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
                body: JSON.stringify({
                    conversationId,
                    messages: next.map((m) => ({ role: m.role, content: m.content }))
                })
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
            if (data?.conversation) {
                const updated = data.conversation as ConversationResponse;
                setActiveConversationId(updated.id);
                setMessages(formatMessages(updated.messages));
                mergeConversationSummary(updated);
            } else {
                const reply = String(data?.reply || '').trim();
                setMessages((prev) => [...prev, { role: 'assistant', content: reply || '...' }]);
            }
        } catch (e) {
            console.warn('Chat send failed', e);
            setError(t('chat.networkError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!historyLoaded || !activeConversationId) return;
        try {
            const st: any = (location && (location as any).state) || {};
            const prefill: string = typeof st?.prefill === 'string' ? String(st.prefill).trim() : '';
            if (prefill && !prefillSentRef.current) {
                prefillSentRef.current = true;
                handleSend(prefill);
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location && (location as any).state, historyLoaded, activeConversationId]);

    const handleSelectConversation = async (conversationId: string) => {
        if (!conversationId || activeConversationId === conversationId) {
            setMobileSidebarOpen(false);
            return;
        }
        await fetchConversation(conversationId);
        setMobileSidebarOpen(false);
    };

    const handleNewConversation = async () => {
        await createConversation();
        setMobileSidebarOpen(false);
    };

    const handleRenameConversation = async (conversation: ConversationSummary, nextTitle?: string) => {
        const titleToUse = nextTitle !== undefined ? nextTitle : editingTitle;
        if (!titleToUse || !titleToUse.trim() || titleToUse.trim() === conversation.title) return;
        try {
            const resp = await fetch(`/api/chat/conversations/${conversation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: titleToUse.trim() })
            });
            if (!resp.ok) {
                setError(t('chat.error'));
                return;
            }
            const data = await resp.json();
            if (data?.conversation) {
                mergeConversationSummary(data.conversation as ConversationResponse);
                if (activeConversationId === conversation.id) {
                    setMessages((prev) => [...prev]);
                }
            }
            setEditingConversationId(null);
            setEditingTitle('');
        } catch (e) {
            console.warn('Failed to rename conversation', e);
            setError(t('chat.networkError'));
        }
    };

    const handleDeleteConversation = async (conversation: ConversationSummary) => {
        try {
            const resp = await fetch(`/api/chat/conversations/${conversation.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!resp.ok) {
                setError(t('chat.error'));
                return;
            }
            setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
            if (activeConversationId === conversation.id) {
                await fetchConversation();
            }
            setDeleteDialog({ open: false, conversation: null });
        } catch (e) {
            console.warn('Failed to delete conversation', e);
            setError(t('chat.networkError'));
            setDeleteDialog({ open: false, conversation: null });
        }
    };

    const startEditingConversation = (conversation: ConversationSummary) => {
        setEditingConversationId(conversation.id);
        setEditingTitle(conversation.title);
    };

    const cancelEditingConversation = () => {
        setEditingConversationId(null);
        setEditingTitle('');
    };

    const confirmDeleteConversation = (conversation: ConversationSummary) => {
        setDeleteDialog({ open: true, conversation });
    };

    const closeDeleteDialog = () => setDeleteDialog({ open: false, conversation: null });

    const stopGenerating = () => {
        setLoading(false);
    };

    const renderSidebarContent = (
        <Box
            sx={{
                width: { xs: 260, md: 300 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.grey[50]
            }}
        >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.grey[200]}` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {t('chat.conversations')}
                    </Typography>
                    <Button
                        onClick={handleNewConversation}
                        size="small"
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            px: 1.5,
                            py: 0.75,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: 0,
                            backgroundColor: theme.palette.common.white,
                            color: 'white',
                            border: `1px solid ${theme.palette.primary.main}`,
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        +
                    </Button>
                </Stack>
            </Box>
            <List
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    py: 0
                }}
            >
                {conversations.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center', color: theme.palette.text.secondary }}>
                        <Typography variant="body2">{t('chat.newChatHelper')}</Typography>
                    </Box>
                )}
                {conversations.map((conversation) => (
                    <ListItemButton
                        key={conversation.id}
                        selected={conversation.id === activeConversationId}
                        alignItems="flex-start"
                        onClick={() => handleSelectConversation(conversation.id)}
                        sx={{
                            '&:hover .conversation-actions': {
                                opacity: 1,
                                pointerEvents: 'auto'
                            }
                        }}
                    >
                        <ChatBubbleOutline
                            sx={{
                                mr: 1.5,
                                mt: 0.5,
                                color:
                                    conversation.id === activeConversationId
                                        ? theme.palette.primary.main
                                        : theme.palette.text.secondary
                            }}
                        />
                        {editingConversationId === conversation.id ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
                                <TextField
                                    value={editingTitle}
                                    size="small"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleRenameConversation(conversation, editingTitle);
                                        } else if (e.key === 'Escape') {
                                            cancelEditingConversation();
                                        }
                                    }}
                                />
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title={t('common.save')}>
                                        <IconButton
                                            size="small"
                                            color="success"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameConversation(conversation, editingTitle);
                                            }}
                                        >
                                            <Check fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('common.cancel')}>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                cancelEditingConversation();
                                            }}
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        ) : (
                            <>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                                            {conversation.title || t('chat.defaultConversationTitle')}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {conversation.preview || t('chat.noMessagesYet')}
                                        </Typography>
                                    }
                                />
                                <Stack
                                    direction="row"
                                    spacing={0.5}
                                    className="conversation-actions"
                                    sx={{
                                        opacity: conversation.id === activeConversationId ? 1 : 0,
                                        pointerEvents: conversation.id === activeConversationId ? 'auto' : 'none',
                                        transition: 'opacity 0.2s ease'
                                    }}
                                >
                                    <Tooltip title={t('chat.rename')}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditingConversation(conversation);
                                            }}
                                        >
                                            <DriveFileRenameOutline fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('chat.delete')}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDeleteConversation(conversation);
                                            }}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </>
                        )}
                    </ListItemButton>
                ))}
            </List>
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                <Typography variant="caption" color="text.secondary">
                    {t('chat.aiCanMakeMistakes')}
                </Typography>
            </Box>
        </Box>
    );

    const sidebar = isMdUp ? (
        renderSidebarContent
    ) : (
        <Drawer
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            ModalProps={{ keepMounted: true }}
        >
            {renderSidebarContent}
        </Drawer>
    );

    const activeConversation = conversations.find((c) => c.id === activeConversationId);
    const showProgress = loading || conversationLoading;

    return (
        <Box sx={{ backgroundColor: theme.palette.grey[50], minHeight: 'calc(100vh - 64px)' }}>
            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, md: 2 } }}>
                <Card elevation={8} sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box
                        sx={{
                            px: { xs: 2, sm: 3 },
                            py: { xs: 1.5, sm: 2 },
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            color: 'white',
                            borderBottom: '1px solid rgba(255,255,255,0.15)'
                        }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            {!isMdUp && (
                                <IconButton
                                    color="inherit"
                                    onClick={() => setMobileSidebarOpen(true)}
                                    sx={{ mr: 1 }}
                                >
                                    <Menu />
                                </IconButton>
                            )}
                            <SmartToy sx={{ fontSize: { xs: 22, sm: 26 } }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {activeConversation?.title || t('chat.appName')}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                    {t('chat.subtitle')}
                                </Typography>
                            </Box>
                            <Chip
                                label={t('chat.beta')}
                                size="small"
                                sx={{
                                    ml: 'auto',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 700
                                }}
                            />
                            {!isMdUp && (
                                <Button
                                    onClick={handleNewConversation}
                                    startIcon={<Add />}
                                    variant="contained"
                                    sx={{ ml: 2 }}
                                >
                                    {t('chat.newChat')}
                                </Button>
                            )}
                        </Stack>
                    </Box>
                    {showProgress && <LinearProgress color="secondary" />}
                    <CardContent
                        sx={{
                            p: 0,
                            display: 'flex',
                            minHeight: { xs: '70vh', md: '65vh' },
                            flexDirection: { xs: 'column', md: 'row' }
                        }}
                    >
                        {isMdUp && (
                            <Box
                                sx={{
                                    width: { md: 300 },
                                    borderRight: `1px solid ${theme.palette.grey[200]}`,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {renderSidebarContent}
                            </Box>
                        )}
                        {!isMdUp && sidebar}
                        <Box
                            sx={{
                                flexGrow: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: { xs: '60vh', md: '65vh' }
                            }}
                        >
                            <Box
                                ref={listRef}
                                sx={{
                                    flexGrow: 1,
                                    overflowY: 'auto',
                                    p: { xs: 2, md: 3 },
                                    backgroundColor: 'rgba(245,247,250,0.9)'
                                }}
                            >
                                <Stack spacing={2}>
                                    {!messages.length && !conversationLoading && (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: { xs: 2, md: 3 },
                                                backgroundColor: 'white',
                                                border: `1px dashed ${theme.palette.grey[300]}`
                                            }}
                                        >
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                                {t('chat.emptyStateTitle')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('chat.emptyStateDescription')}
                                            </Typography>
                                        </Paper>
                                    )}
                                    {messages.map((m, idx) => (
                                        <Stack
                                            key={`${m.role}-${idx}-${m.content}`}
                                            direction="row"
                                            spacing={1}
                                            alignItems="flex-start"
                                            sx={{
                                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: { xs: '100%', sm: '85%' }
                                            }}
                                        >
                                            {m.role === 'assistant' ? (
                                                <SmartToy
                                                    sx={{
                                                        color: theme.palette.primary.main,
                                                        mt: 0.5,
                                                        fontSize: { xs: 18, sm: 24 }
                                                    }}
                                                />
                                            ) : (
                                                <Person
                                                    sx={{
                                                        color: theme.palette.grey[600],
                                                        mt: 0.5,
                                                        fontSize: { xs: 18, sm: 24 }
                                                    }}
                                                />
                                            )}
                                            <Paper
                                                elevation={m.role === 'user' ? 4 : 1}
                                                sx={{
                                                    p: { xs: 1.25, sm: 1.5 },
                                                    backgroundColor:
                                                        m.role === 'user'
                                                            ? theme.palette.primary.main
                                                            : 'white',
                                                    color: m.role === 'user' ? 'white' : theme.palette.text.primary,
                                                    border:
                                                        m.role === 'assistant'
                                                            ? `1px solid ${theme.palette.grey[200]}`
                                                            : 'none',
                                                    maxWidth: '100%',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                                >
                                                    {m.content}
                                                </Typography>
                                            </Paper>
                                        </Stack>
                                    ))}
                                    {error && (
                                        <Typography color="error" variant="body2">
                                            {error}
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                            <Divider />
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
                                            {t('chat.send')}
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
            <Dialog open={deleteDialog.open} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{t('chat.delete')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('chat.deleteConversationConfirm')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog}>{t('common.cancel')}</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            if (deleteDialog.conversation) {
                                handleDeleteConversation(deleteDialog.conversation);
                            }
                        }}
                    >
                        {t('chat.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Chat;


