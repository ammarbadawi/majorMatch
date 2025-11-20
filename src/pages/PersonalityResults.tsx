import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  AutoAwesome,
  CheckCircle,
  CheckCircleOutline,
  EmojiPeople,
  FormatQuote,
  Home,
  Psychology,
  Refresh,
  School,
  Share,
  WarningAmber,
  Work
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PersonalityDisplaySection {
  id: string;
  type?: string;
  heading?: string;
  title?: string;
  body?: string;
  paragraphs?: string[];
  cards?: Array<{ title?: string; subtitle?: string }>;
  items?: Array<{ title?: string; description?: string } | string>;
  mostAligned?: Array<{ type: string; description?: string }>;
  mostChallenging?: Array<{ type: string; description?: string }>;
  coreValue?: string;
  paragraph?: string;
  subBox?: { title?: string; text?: string };
  style?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  [key: string]: any;
}

interface PersonalityHeroColumn {
  title?: string;
  subtitle?: string;
  quote?: string;
  tags?: string[];
}

interface PersonalityHero {
  leftColumn?: PersonalityHeroColumn;
  rightColumn?: Record<string, unknown>;
  layout?: string;
}

interface PersonalityDisplayProfile {
  personalityType: string;
  codeName?: string;
  label?: string;
  lifeQuote?: string;
  theme?: {
    gradient?: string[];
    backgroundLight?: string;
    backgroundWarning?: string;
    backgroundCareer?: string;
    textMain?: string;
  };
  hero?: PersonalityHero;
  sections?: PersonalityDisplaySection[];
}

interface LocationState {
  personalityType?: string;
  personalityData?: PersonalityDisplayProfile;
}

const headingFont = "'Poppins','Montserrat','Inter','sans-serif'";
const bodyFont = "'Inter','Lato','sans-serif'";

const PersonalityResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || null) as LocationState | null;
  const theme = useTheme();
  const { t } = useTranslation();

  const [personalityType, setPersonalityType] = useState(state?.personalityType || '');
  const [displayData, setDisplayData] = useState<PersonalityDisplayProfile | null>(
    state?.personalityData && Array.isArray(state.personalityData.sections)
      ? state.personalityData
      : null
  );
  const [shareMessage, setShareMessage] = useState('');
  const [hasMbti, setHasMbti] = useState<boolean>(() => {
    try { return localStorage.getItem('hasMbti') === '1'; } catch { return true; }
  });
  const [loadingType, setLoadingType] = useState(!state?.personalityType);
  const [loadingDisplay, setLoadingDisplay] = useState(!state?.personalityData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onMbti = () => setHasMbti(true);
    window.addEventListener('mbti-completed', onMbti);
    return () => window.removeEventListener('mbti-completed', onMbti);
  }, []);

  useEffect(() => {
    if (state?.personalityType) {
      setPersonalityType(state.personalityType);
    }
    if (state?.personalityData && Array.isArray(state.personalityData.sections)) {
      setDisplayData(state.personalityData);
    }
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/personality/latest', { credentials: 'include' });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setHasMbti(Boolean(data?.hasResult));
            if (!state?.personalityType && data?.type) {
              setPersonalityType(data.type);
            }
          } else if (res.status === 404) {
            setHasMbti(false);
            if (!state?.personalityType) {
              setError(t('personalityResults.noResultsDesc'));
            }
          } else {
            setHasMbti(false);
          }
        }
      } catch {
        if (!cancelled) {
          setHasMbti(false);
          if (!state?.personalityType && !personalityType) {
            setError('Unable to load your latest personality result right now.');
          }
        }
      } finally {
        if (!cancelled) setLoadingType(false);
      }
    };
    fetchLatest();
    return () => { cancelled = true; };
  }, [state?.personalityType, personalityType, t]);

  useEffect(() => {
    if (!personalityType) return;
    let cancelled = false;
    setLoadingDisplay(true);
    setError(null);
    const fetchDisplay = async () => {
      try {
        const res = await fetch(`/api/personality/display/${encodeURIComponent(personalityType)}`);
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setDisplayData(data);
          } else if (res.status === 404) {
            setDisplayData(null);
            setError('We could not find the updated layout for this personality yet.');
          } else {
            setError('Unable to load your personality details right now.');
          }
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load your personality details right now.');
        }
      } finally {
        if (!cancelled) setLoadingDisplay(false);
      }
    };
    fetchDisplay();
    return () => { cancelled = true; };
  }, [personalityType]);

  const sectionsById = useMemo(() => {
    const map: Record<string, PersonalityDisplaySection> = {};
    displayData?.sections?.forEach((section) => {
      if (section?.id) {
        map[section.id] = section;
      }
    });
    return map;
  }, [displayData]);

  const overviewSection = sectionsById.overview;
  const storySection = sectionsById.story;
  const keyTraitsSection = sectionsById.keyTraits;
  const strengthsSection = sectionsById.strengths;
  const watchOutSection = sectionsById.watchOutFor;
  const moralCompassSection = sectionsById.moralCompass;
  const friendshipsSection = sectionsById.friendshipsTeams;
  const growthSection = sectionsById.growthAdvice;
  const compatibilitySection = sectionsById.compatibility;
  const careerSection = sectionsById.careerGrowth;
  const famousSection = sectionsById.famousPeople;
  const quoteSection = sectionsById.quote;

  const gradientColors = displayData?.theme?.gradient || ['#6d64ff', '#e972a8'];
  const headerGradient = `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`;
  const lightBackground = displayData?.theme?.backgroundLight || '#f7f5ff';
  const warningBackground = displayData?.theme?.backgroundWarning || '#fff7d6';
  const careerBackground = displayData?.theme?.backgroundCareer || '#f1edff';
  const heroTitle = displayData?.hero?.leftColumn?.title || `${displayData?.codeName || ''} (${personalityType})`;
  const heroSubtitle = displayData?.hero?.leftColumn?.subtitle || displayData?.label || '';
  const heroQuote = displayData?.hero?.leftColumn?.quote || displayData?.lifeQuote || '';
  const heroTags = displayData?.hero?.leftColumn?.tags || [];
  const storyParagraphs = storySection?.paragraphs?.slice(0, 4) || [];
  const traitCards = keyTraitsSection?.cards || [];
  const strengthsItems = strengthsSection?.items as Array<{ title?: string; description?: string }> | undefined;
  const warningItems = watchOutSection?.items as Array<{ title?: string; description?: string }> | undefined;
  const friendshipsItems = friendshipsSection?.items as string[] | undefined;
  const growthItems = growthSection?.items as string[] | undefined;
  const mostAligned = compatibilitySection?.mostAligned || [];
  const mostChallenging = compatibilitySection?.mostChallenging || [];
  const careerItems = careerSection?.items as string[] | undefined;
  const famousItems = famousSection?.items as Array<{ name: string; description?: string }> | undefined;
  const lifeQuote = quoteSection?.text || displayData?.lifeQuote || heroQuote;

  const handleShare = async () => {
    const shareHeadline = heroTitle?.trim() || personalityType;
    const shareQuote = heroQuote ? `"${heroQuote}"` : '';
    const shareText = `I just discovered I'm ${shareHeadline}. ${shareQuote}`.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('personalityResults.myPersonalityTestResults'),
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.warn('Share cancelled', err);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareMessage(t('personalityResults.resultsCopiedToClipboard'));
      setTimeout(() => setShareMessage(''), 3500);
    }
  };

  if ((loadingType && !personalityType) || (loadingDisplay && !displayData)) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5ff' }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!personalityType || !displayData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: headerGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2
        }}
      >
        <Paper sx={{ p: 6, maxWidth: 560, textAlign: 'center', borderRadius: 4, backgroundColor: '#ffffffdd' }}>
          <Psychology sx={{ fontSize: 72, color: gradientColors[0], mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {t('personalityResults.noResults')}
          </Typography>
          <Typography sx={{ mb: 4, fontFamily: bodyFont }}>
            {error || t('personalityResults.noResultsDesc')}
          </Typography>
          <Stack spacing={2}>
            <Button variant="contained" onClick={() => navigate('/personality-test')} startIcon={<Psychology />} size="large">
              {t('common.personalityTest')}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/')} startIcon={<Home />} size="large">
              {t('common.back')} {t('common.home')}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5ff' }}>
      <Box
        component="header"
        sx={{
          background: headerGradient,
          color: '#fff',
          py: { xs: 6, md: 10 },
          boxShadow: 4
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mb: { xs: 2, md: 0 } }}>
              <ArrowBack />
            </IconButton>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" color="inherit" startIcon={<Share />} onClick={handleShare}>
                {t('common.share')}
              </Button>
              <Button variant="contained" color="secondary" onClick={() => navigate('/')} startIcon={<Home />}>
                {t('common.home')}
              </Button>
            </Stack>
          </Box>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: headingFont,
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    textTransform: 'none',
                    letterSpacing: '-1px'
                  }}
                >
                  {heroTitle}
                </Typography>
                {heroSubtitle && (
                  <Typography variant="h5" sx={{ fontFamily: headingFont, opacity: 0.9 }}>
                    {heroSubtitle}
                  </Typography>
                )}
                {heroQuote && (
                  <Typography variant="h6" sx={{ fontFamily: bodyFont, fontStyle: 'italic', opacity: 0.85 }}>
                    “{heroQuote}”
                  </Typography>
                )}
                <Stack direction="row" spacing={1.5} flexWrap="wrap" mt={2}>
                  {heroTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: '#fff',
                        fontWeight: 600,
                        mb: 1
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '24px',
                  p: 4,
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 3,
                    fontSize: '2rem',
                    bgcolor: 'rgba(255,255,255,0.25)',
                    border: '3px solid rgba(255,255,255,0.45)'
                  }}
                >
                  {displayData.codeName?.slice(0, 1) || personalityType.slice(0, 1)}
                </Avatar>
                <Typography variant="h4" sx={{ fontFamily: headingFont, fontWeight: 700 }}>
                  {personalityType}
                </Typography>
                <Typography sx={{ fontFamily: bodyFont, opacity: 0.85 }}>
                  {t('personalityResults.personalityType')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack spacing={{ xs: 4, md: 6 }}>
          {shareMessage && (
            <Alert severity="success" onClose={() => setShareMessage('')}>
              {shareMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="warning">
              {error}
            </Alert>
          )}

          {overviewSection && (
            <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 4, boxShadow: 6 }}>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 2 }}>
                {overviewSection.title}
              </Typography>
              <Typography sx={{ fontFamily: bodyFont, fontSize: '1.05rem', color: '#444' }}>
                {overviewSection.body}
              </Typography>
            </Paper>
          )}

          {storyParagraphs.length > 0 && (
            <Box
              sx={{
                backgroundColor: lightBackground,
                borderRadius: 4,
                p: { xs: 4, md: 6 },
                border: '1px solid rgba(109,100,255,0.15)'
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {storySection?.heading || 'Your Story'}
              </Typography>
              <Stack spacing={2.5}>
                {storyParagraphs.map((paragraph, idx) => (
                  <Typography key={idx} sx={{ fontFamily: bodyFont, lineHeight: 1.8 }}>
                    {paragraph}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {traitCards.length > 0 && (
            <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 4, boxShadow: 4 }}>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {keyTraitsSection?.heading || 'Key Traits'}
              </Typography>
              <Stack spacing={2}>
                {traitCards.map((card, index) => (
                  <Stack
                    key={`${card.title}-${index}`}
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    sx={{ fontFamily: bodyFont }}
                  >
                    <CheckCircle color="secondary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 600 }}>
                        {card.title}
                      </Typography>
                      <Typography sx={{ color: '#555', mt: 0.5 }}>
                        {card.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {strengthsItems && strengthsItems.length > 0 && (
            <Box>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {strengthsSection?.heading || 'Your Strengths'}
              </Typography>
              <Grid container spacing={3}>
                {strengthsItems.map((item, index) => (
                  <Grid item xs={12} md={3} sm={6} key={`${item?.title}-${index}`}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: 3 }}>
                      <AutoAwesome color="secondary" sx={{ mb: 1.5 }} />
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 600 }}>
                        {item?.title}
                      </Typography>
                      <Typography sx={{ fontFamily: bodyFont, mt: 1, color: '#555' }}>
                        {item?.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {warningItems && warningItems.length > 0 && (
            <Box
              sx={{
                backgroundColor: warningBackground,
                borderRadius: 4,
                p: { xs: 4, md: 5 },
                border: '1px solid rgba(233,114,168,0.4)'
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {watchOutSection?.heading || 'Watch Out For'}
              </Typography>
              <Grid container spacing={3}>
                {warningItems.map((warning, index) => (
                  <Grid item xs={12} md={4} key={`${warning?.title}-${index}`}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        backgroundColor: '#fff',
                        border: '1px solid rgba(250, 211, 144, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <WarningAmber color="warning" />
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 600 }}>
                        {warning?.title}
                      </Typography>
                      <Typography sx={{ fontFamily: bodyFont, color: '#555' }}>
                        {warning?.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {moralCompassSection && (
            <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 4, textAlign: 'center', boxShadow: 4 }}>
              <Typography sx={{ fontFamily: headingFont, letterSpacing: 5, fontWeight: 800, textTransform: 'uppercase', color: gradientColors[0], mb: 2 }}>
                {moralCompassSection.coreValue || 'Authentic'}
              </Typography>
              <Typography sx={{ fontFamily: bodyFont, fontSize: '1.05rem', mb: 4 }}>
                {moralCompassSection.paragraph}
              </Typography>
              {moralCompassSection.subBox && (
                <Box
                  sx={{
                    backgroundColor: lightBackground,
                    borderRadius: 3,
                    p: 3,
                    border: '1px solid rgba(109,100,255,0.2)'
                  }}
                >
                  <Typography sx={{ fontFamily: headingFont, fontWeight: 600, mb: 1 }}>
                    {moralCompassSection.subBox.title}
                  </Typography>
                  <Typography sx={{ fontFamily: bodyFont }}>
                    {moralCompassSection.subBox.text}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {friendshipsItems && friendshipsItems.length > 0 && (
            <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 4, boxShadow: 4 }}>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 2 }}>
                {friendshipsSection?.heading || 'Friendships & Teams'}
              </Typography>
              <Stack spacing={1.5} mb={2}>
                {friendshipsItems.map((item, idx) => (
                  <Stack direction="row" spacing={1.5} key={`${item}-${idx}`} alignItems="center">
                    <CheckCircle color="secondary" />
                    <Typography sx={{ fontFamily: bodyFont }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Typography sx={{ fontFamily: bodyFont, color: '#555' }}>
                {friendshipsSection?.summary ||
                  `As ${displayData.codeName || displayData.label}, you anchor teams with empathy, meaning, and steady conviction.`}
              </Typography>
            </Paper>
          )}

          {growthItems && growthItems.length > 0 && (
            <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 4 }}>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {growthSection?.heading || 'Growth Advice'}
              </Typography>
              <Stack spacing={2}>
                {growthItems.map((tip, idx) => (
                  <Stack direction="row" spacing={2} alignItems="flex-start" key={`${tip}-${idx}`}>
                    <CheckCircleOutline color="secondary" sx={{ mt: 0.5 }} />
                    <Typography sx={{ fontFamily: bodyFont }}>{tip}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {(mostAligned.length > 0 || mostChallenging.length > 0) && (
            <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 4 }}>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {compatibilitySection?.heading || 'Compatibility Snapshot'}
              </Typography>
              <Grid container spacing={4}>
                {mostAligned.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontFamily: headingFont, fontWeight: 600, mb: 2 }}>
                      Most Aligned With
                    </Typography>
                    <Stack spacing={2}>
                      {mostAligned.map((partner, idx) => (
                        <Paper key={`${partner.type}-${idx}`} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(109,100,255,0.2)' }}>
                          <Typography sx={{ fontFamily: headingFont, fontWeight: 600 }}>
                            {partner.type}
                          </Typography>
                          <Typography sx={{ fontFamily: bodyFont, color: '#555', fontSize: '0.95rem' }}>
                            {partner.description}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                )}
                {mostChallenging.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontFamily: headingFont, fontWeight: 600, mb: 2 }}>
                      Most Challenging With
                    </Typography>
                    <Stack spacing={2}>
                      {mostChallenging.map((partner, idx) => (
                        <Paper key={`${partner.type}-${idx}`} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(233,114,168,0.2)' }}>
                          <Typography sx={{ fontFamily: headingFont, fontWeight: 600 }}>
                            {partner.type}
                          </Typography>
                          <Typography sx={{ fontFamily: bodyFont, color: '#555', fontSize: '0.95rem' }}>
                            {partner.description}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {careerItems && careerItems.length > 0 && (
            <Box sx={{ backgroundColor: careerBackground, borderRadius: 4, p: { xs: 4, md: 5 } }}>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {careerSection?.heading || 'Career Growth Advice'}
              </Typography>
              <Stack spacing={2}>
                {careerItems.map((item, idx) => (
                  <Stack direction="row" spacing={2} key={`${item}-${idx}`}>
                    <Work color="secondary" />
                    <Typography sx={{ fontFamily: bodyFont }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {famousItems && famousItems.length > 0 && (
            <Box>
              <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 3 }}>
                {famousSection?.heading || 'Famous People Like You'}
              </Typography>
              <Grid container spacing={3}>
                {famousItems.map((person, idx) => (
                  <Grid item xs={12} md={4} key={`${person.name}-${idx}`}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        textAlign: 'center',
                        border: '1px solid rgba(109,100,255,0.15)'
                      }}
                    >
                      <EmojiPeople color="secondary" sx={{ fontSize: 40, mb: 1.5 }} />
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 600 }}>
                        {person.name}
                      </Typography>
                      <Typography sx={{ fontFamily: bodyFont, color: '#555', mt: 1 }}>
                        {person.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {lifeQuote && (
            <Paper
              sx={{
                p: { xs: 4, md: 5 },
                borderRadius: 4,
                textAlign: 'center',
                backgroundColor: '#fff',
                boxShadow: 3
              }}
            >
              <FormatQuote color="secondary" sx={{ fontSize: 48, opacity: 0.5 }} />
              <Typography
                variant="h5"
                sx={{
                  fontFamily: headingFont,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  mt: 2,
                  color: gradientColors[0]
                }}
              >
                “{lifeQuote}”
              </Typography>
            </Paper>
          )}

          <Paper
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: 4,
              textAlign: 'center',
              background: `linear-gradient(120deg, ${gradientColors[0]}15, ${gradientColors[1]}15)`
            }}
          >
            <Typography variant="h5" sx={{ fontFamily: headingFont, fontWeight: 700, mb: 4 }}>
              {t('personalityResults.whatsNext')}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="center">
              <Tooltip title={t('personalityResults.takeMajorTest')} disableHoverListener={hasMbti}>
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<School />}
                    onClick={() => navigate('/major-matching-test')}
                    disabled={!hasMbti}
                    sx={{
                      fontFamily: headingFont,
                      fontWeight: 700,
                      px: 4,
                      py: 1.75
                    }}
                  >
                    {t('personalityResults.takeMajorTest')}
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Refresh />}
                onClick={() => navigate('/personality-test')}
                sx={{ fontFamily: headingFont, fontWeight: 600, px: 4, py: 1.75 }}
              >
                {t('personalityResults.retakeTest')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{ fontFamily: headingFont, fontWeight: 600, px: 4, py: 1.75 }}
              >
                {t('common.back')} {t('common.home')}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default PersonalityResults;