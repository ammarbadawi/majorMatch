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

interface SubscriptionData {
    hasSubscription: boolean;
    status?: string;
    current_period_end?: string;
    payment_type?: string;
}

const SubscriptionStatus: React.FC = () => {
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
                alert(data.error || 'Failed to cancel subscription');
            }
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            alert('Failed to cancel subscription');
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
                    You don't have an active subscription. Subscribe to access the premium major test.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    If you paid via Whish Money, verification may take up to 24 hours. You'll be notified once activated.
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
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Subscription Status
                        </Typography>
                        <Chip
                            icon={getStatusIcon(subscription.status!)}
                            label={subscription.status?.toUpperCase()}
                            color={getStatusColor(subscription.status!) as any}
                            variant="outlined"
                        />
                    </Box>

                    {subscription.status === 'active' && (
                        <Stack spacing={1}>
                            {subscription.payment_type === 'one_time' ? (
                                <Typography variant="body2" color="text.secondary">
                                    Access expires: {formatDate(subscription.current_period_end!)}
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Next billing date: {formatDate(subscription.current_period_end!)}
                                </Typography>
                            )}
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => setShowCancelDialog(true)}
                                size="small"
                            >
                                {subscription.payment_type === 'one_time' ? 'Revoke Access' : 'Cancel Subscription'}
                            </Button>
                        </Stack>
                    )}

                    {subscription.status === 'past_due' && (
                        <Alert severity="warning">
                            <Typography variant="body2">
                                Your subscription payment failed. Please update your payment method.
                            </Typography>
                        </Alert>
                    )}

                    {subscription.status === 'canceled' && (
                        <Alert severity="info">
                            <Typography variant="body2">
                                {subscription.payment_type === 'one_time'
                                    ? 'Your access has been revoked.'
                                    : `Your subscription has been canceled. You'll retain access until ${formatDate(subscription.current_period_end!)}.`
                                }
                            </Typography>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
                <DialogTitle>
                    {subscription?.payment_type === 'one_time' ? 'Revoke Access' : 'Cancel Subscription'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {subscription?.payment_type === 'one_time'
                            ? 'Are you sure you want to revoke access? This action cannot be undone.'
                            : 'Are you sure you want to cancel your subscription? You\'ll retain access until the end of your current billing period.'
                        }
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCancelDialog(false)}>
                        {subscription?.payment_type === 'one_time' ? 'Keep Access' : 'Keep Subscription'}
                    </Button>
                    <Button
                        onClick={handleCancelSubscription}
                        color="error"
                        variant="contained"
                        disabled={canceling}
                        startIcon={canceling ? <CircularProgress size={20} /> : <Cancel />}
                    >
                        {canceling ? 'Processing...' : (subscription?.payment_type === 'one_time' ? 'Revoke Access' : 'Cancel Subscription')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SubscriptionStatus;
