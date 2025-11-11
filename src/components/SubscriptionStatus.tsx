import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    Star,
    Warning
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SubscriptionData {
    hasSubscription: boolean;
    status?: string;
    current_period_end?: string;
    payment_type?: string;
}

const SubscriptionStatus: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    useEffect(() => {
        checkSubscriptionStatus();
    }, []);

    const checkSubscriptionStatus = async () => {
        try {
            const response = await fetch('/api/subscription-status', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setSubscription(data);
            }
        } catch (error) {
            console.error('Failed to check subscription status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        setCanceling(true);
        try {
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                await checkSubscriptionStatus();
                setShowCancelDialog(false);
            } else {
                const data = await response.json();
                alert(data.error || t('subscriptionStatus.failedToCancelSubscription'));
            }
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            alert(t('subscriptionStatus.failedToCancelSubscription'));
        } finally {
            setCanceling(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!subscription?.hasSubscription) {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    {t('subscriptionStatus.noActiveSubscription')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {t('subscriptionStatus.whishMoneyVerificationNote')}
                </Typography>
            </Alert>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'trialing':
                return 'info';
            case 'past_due':
                return 'warning';
            case 'canceled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle />;
            case 'trialing':
                return <Star />;
            case 'past_due':
                return <Warning />;
            case 'canceled':
                return <Cancel />;
            default:
                return <CheckCircle />; // Default icon
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {t('subscriptionStatus.subscriptionStatus')}
                        </Typography>
                        <Chip
                            icon={getStatusIcon(subscription.status!)}
                            label={subscription.status?.toUpperCase()}
                            color={getStatusColor(subscription.status!) as any}
                            variant="outlined"
                            size={window.innerWidth < 600 ? 'small' : 'medium'}
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        />
                    </Box>

                    {subscription.status === 'active' && (
                        <Stack spacing={1}>
                            {subscription.payment_type === 'one_time' ? (
                                <Typography variant="body2" color="text.secondary">
                                    {t('subscriptionStatus.accessExpires', { date: formatDate(subscription.current_period_end!) })}
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('subscriptionStatus.nextBillingDate', { date: formatDate(subscription.current_period_end!) })}
                                </Typography>
                            )}
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => setShowCancelDialog(true)}
                                size="small"
                            >
                                {subscription.payment_type === 'one_time' ? t('subscriptionStatus.revokeAccess') : t('subscriptionStatus.cancelSubscription')}
                            </Button>
                        </Stack>
                    )}

                    {subscription.status === 'past_due' && (
                        <Alert severity="warning">
                            <Typography variant="body2">
                                {t('subscriptionStatus.paymentFailedUpdateMethod')}
                            </Typography>
                        </Alert>
                    )}

                    {subscription.status === 'canceled' && (
                        <Alert severity="info">
                            <Typography variant="body2">
                                {subscription.payment_type === 'one_time'
                                    ? t('subscriptionStatus.accessRevoked')
                                    : t('subscriptionStatus.subscriptionCanceledRetainAccess', { date: formatDate(subscription.current_period_end!) })
                                }
                            </Typography>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 2 } } }}>
                <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                    {subscription?.payment_type === 'one_time' ? t('subscriptionStatus.revokeAccess') : t('subscriptionStatus.cancelSubscription')}
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {subscription?.payment_type === 'one_time'
                            ? t('subscriptionStatus.areYouSureRevokeAccess')
                            : t('subscriptionStatus.areYouSureCancelSubscription')
                        }
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                    <Button 
                        onClick={() => setShowCancelDialog(false)}
                        fullWidth={window.innerWidth < 600}
                        sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                        {subscription?.payment_type === 'one_time' ? t('subscriptionStatus.keepAccess') : t('subscriptionStatus.keepSubscription')}
                    </Button>
                    <Button
                        onClick={handleCancelSubscription}
                        color="error"
                        variant="contained"
                        disabled={canceling}
                        startIcon={canceling ? <CircularProgress size={20} /> : <Cancel />}
                        fullWidth={window.innerWidth < 600}
                        sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                        {canceling ? t('subscriptionStatus.processing') : (subscription?.payment_type === 'one_time' ? t('subscriptionStatus.revokeAccess') : t('subscriptionStatus.cancelSubscription'))}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SubscriptionStatus;
