import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Divider,
    Stack,
    Chip,
    Tabs,
    Tab,
    TextField,
    IconButton
} from '@mui/material';
import {
    CreditCard,
    CheckCircle,
    Star,
    Security,
    AccessTime,
    Cancel,
    AccountBalanceWallet,
    ContentCopy
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here';
const stripePromise = STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_stripe_publishable_key_here'
    ? loadStripe(STRIPE_PUBLISHABLE_KEY)
    : null;

const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
};

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PaymentForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) {
            setError(t('paymentModal.stripeNotLoaded'));
            setLoading(false);
            return;
        }

        try {
            // Create payment intent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('paymentModal.failedToCreatePaymentIntent'));
            }

            // Confirm payment
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement)!,
                    },
                }
            );

            if (stripeError) {
                setError(stripeError.message || t('paymentModal.paymentFailed'));
            } else if (paymentIntent?.status === 'succeeded') {
                // Confirm payment
                const confirmResponse = await fetch('/api/confirm-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
                });

                if (confirmResponse.ok) {
                    onSuccess();
                } else {
                    const confirmData = await confirmResponse.json();
                    setError(confirmData.error || t('paymentModal.failedToConfirmPayment'));
                }
            }
        } catch (err: any) {
            setError(err.message || t('paymentModal.paymentFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {t('paymentModal.paymentInformation')}
                </Typography>
                <CardElement options={cardElementOptions} />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {t('common.cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!stripe || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
                >
                    {loading ? t('paymentModal.processing') : t('paymentModal.payAmountOneTime')}
                </Button>
            </DialogActions>
        </form>
    );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [method, setMethod] = useState<'stripe' | 'whish'>(stripePromise ? 'stripe' : 'whish');
    const [config, setConfig] = useState<{ stripeEnabled: boolean; whish: { accountName: string; accountNumber: string; amountCents: number; currency: string; instructions: string } } | null>(null);
    const [copyMsg, setCopyMsg] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/api/payments/config');
                if (!res.ok) throw new Error('Failed to load payment config');
                const data = await res.json();
                if (mounted) setConfig(data);
            } catch (_) {
                // Fallback if config endpoint unavailable
                if (mounted) {
                    setConfig({
                        stripeEnabled: !!stripePromise,
                        whish: {
                            accountName: 'Whish Money',
                            accountNumber: '0000000000',
                            amountCents: 1499,
                            currency: 'usd',
                            instructions: 'Send the exact amount and keep your transaction reference.'
                        }
                    });
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const whishAmount = config?.whish?.amountCents ?? 1499;
    const whishCurrency = (config?.whish?.currency ?? 'usd').toUpperCase();
    const whishDisplayAmount = `${(whishAmount / 100).toFixed(2)} ${whishCurrency}`;

    const copyToClipboard = async (text: string) => {
        try { await navigator.clipboard.writeText(text); setCopyMsg(t('paymentModal.copied')); setTimeout(() => setCopyMsg(null), 1500); } catch (_) { }
    };

    const WhishForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const { t } = useTranslation();
        const [reference, setReference] = useState('');
        const [senderName, setSenderName] = useState('');
        const [phone, setPhone] = useState('');
        const [notes, setNotes] = useState('');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [submitted, setSubmitted] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            if (!reference.trim() || !senderName.trim()) {
                setError(t('paymentModal.referenceAndSenderNameRequired'));
                return;
            }
            setLoading(true);
            try {
                const res = await fetch('/api/payments/whish/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ reference, senderName, phone, notes })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || t('paymentModal.failedToSubmitPayment'));
                setSubmitted(true);
            } catch (err: any) {
                setError(err.message || t('paymentModal.submissionFailed'));
            } finally {
                setLoading(false);
            }
        };

        if (submitted) {
            return (
                <Stack spacing={2} sx={{ p: 2, width: '100%' }}>
                    <Alert severity="success">
                        {t('paymentModal.thankYouWhishPaymentSubmitted')}
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        {t('paymentModal.closeWindowOnceVerified')}
                    </Typography>
                    <DialogActions>
                        <Button onClick={onClose} variant="contained">{t('paymentModal.close')}</Button>
                    </DialogActions>
                </Stack>
            );
        }

        return (
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <Card variant="outlined">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AccountBalanceWallet color="primary" />
                                <Typography variant="h6">{t('paymentModal.payWithWhishMoney')}</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {t('paymentModal.sendAmountToAccount', { amount: whishDisplayAmount })}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">{t('paymentModal.accountName')}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{config?.whish?.accountName || 'Whish Money'}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">{t('paymentModal.accountNumber')}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{config?.whish?.accountNumber || '0000000000'}</Typography>
                                        <IconButton aria-label="copy" size="small" onClick={() => copyToClipboard(String(config?.whish?.accountNumber || '0000000000'))}>
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                        {copyMsg && <Chip size="small" label={copyMsg} />}
                                    </Box>
                                </Box>
                            </Stack>
                            {config?.whish?.instructions && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    {config.whish.instructions}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}

                    <TextField
                        label={t('paymentModal.transactionReference')}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label={t('paymentModal.senderName')}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label={t('paymentModal.phoneNumberOptional')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label={t('paymentModal.notesOptional')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                    />

                    <DialogActions>
                        <Button onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}>
                            {loading ? t('paymentModal.submitting') : t('paymentModal.iPaidViaWhishMoney')}
                        </Button>
                    </DialogActions>
                </Stack>
            </form>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 2 } } }}>
            <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Star sx={{ color: 'gold', fontSize: { xs: 20, sm: 24 } }} />
                    <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {t('paymentModal.unlockPremiumMajorTest')}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                <Stack spacing={3}>
                    <Card sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                                ${(config?.whish?.amountCents ? (config.whish.amountCents / 100).toFixed(2) : '14.99')} {String(config?.whish?.currency || 'USD').toUpperCase()}
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                {t('paymentModal.oneTimePayment')}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {t('paymentModal.whatYouGet')}
                        </Typography>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ color: 'success.main' }} />
                                <Typography>{t('paymentModal.comprehensiveMajorMatchingAssessment')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ color: 'success.main' }} />
                                <Typography>{t('paymentModal.detailedCareerPathAnalysis')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ color: 'success.main' }} />
                                <Typography>{t('paymentModal.salaryAndJobOutlookInformation')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ color: 'success.main' }} />
                                <Typography>{t('paymentModal.aiPoweredCareerGuidance')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle sx={{ color: 'success.main' }} />
                                <Typography>{t('paymentModal.unlimitedTestRetakes')}</Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Divider />

                    <Tabs
                        value={method}
                        onChange={(_, v) => setMethod(v)}
                        aria-label="payment method tabs"
                        variant="fullWidth"
                    >
                        <Tab value="stripe" icon={<CreditCard />} iconPosition="start" label={t('paymentModal.payByCardStripe')} disabled={!stripePromise} />
                        <Tab value="whish" icon={<AccountBalanceWallet />} iconPosition="start" label={t('paymentModal.whishMoney')} />
                    </Tabs>

                    {method === 'stripe' && !stripePromise && (
                        <Alert severity="warning">
                            {t('paymentModal.stripeNotConfigured')}
                        </Alert>
                    )}

                    {method === 'stripe' && stripePromise && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Security sx={{ color: 'success.main' }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('paymentModal.securePaymentPoweredByStripe')}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ color: 'info.main' }} />
                        <Typography variant="body2" color="text.secondary">
                            {t('paymentModal.lifetimeAccessNoRecurringCharges')}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, flexDirection: { xs: 'column', sm: 'row' } }}>
                {method === 'stripe' && stripePromise && (
                    <Elements stripe={stripePromise}>
                        <PaymentForm onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                )}
                {method === 'whish' && (
                    <Box sx={{ width: '100%' }}>
                        <WhishForm onClose={onClose} />
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PaymentModal;
