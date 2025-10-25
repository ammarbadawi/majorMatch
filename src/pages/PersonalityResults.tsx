import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Chip,
  Paper,
  Avatar,
  Divider,
  Stack,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Psychology,
  Home,
  Share,
  School,
  Refresh,
  PersonPin,
  CheckCircle,
  Star,
  Favorite
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface PersonalityData {
  type: string;
  content: string;
}

interface LocationState {
  personalityType: string;
  personalityData: PersonalityData;
}

const PersonalityResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const theme = useTheme();

  const [shareMessage, setShareMessage] = useState('');
  const [hasMbti, setHasMbti] = useState<boolean>(() => {
    try { return localStorage.getItem('hasMbti') === '1'; } catch { return true; }
  });

  useEffect(() => {
    const onMbti = () => setHasMbti(true);
    window.addEventListener('mbti-completed', onMbti);
    return () => window.removeEventListener('mbti-completed', onMbti);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/personality/latest', { credentials: 'include' });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setHasMbti(Boolean(data?.hasResult));
          } else {
            setHasMbti(false);
          }
        }
      } catch {
        if (!cancelled) setHasMbti(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  if (!state || !state.personalityType || !state.personalityData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={10}
            sx={{
              p: 8,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Psychology sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              No Personality Results Found
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontSize: '1.125rem', mb: 4 }}>
              It looks like you haven't taken the test yet or the results were lost.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Psychology />}
              onClick={() => navigate('/personality-test')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.125rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              Take Personality Test
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const { personalityType, personalityData } = state;

  const parsePersonalityContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    let title = '';
    let subtitle = '';
    let description = '';
    let traits: string[] = [];
    let strengths: string[] = [];
    let quote = '';

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.includes('(') && line.includes(')') && /[IE][SN][TF][JP]/.test(line)) {
        title = line;
      } else if (line.startsWith('The ') && !title) {
        title = line;
      } else if (line.startsWith('"') && line.endsWith('"')) {
        subtitle = line.replace(/\"/g, '');
      }
    }

    const sections = content.split('###').map(s => s.trim());
    sections.forEach(section => {
      if (section.includes('Key Traits') || section.includes('You Embody')) {
        const matches = section.match(/• ([^•\n]+)/g);
        if (matches) {
          traits = matches.map(match => match.replace('• ', '').split(' – ')[0]);
        }
      }
      if (section.includes('Your Strengths') || section.includes('Strengths')) {
        const matches = section.match(/✔ ([^✔\n]+)/g);
        if (matches) {
          strengths = matches.map(match => match.replace('✔ ', '').trim());
        }
      }
      if (section.includes('Your Life Quote') || section.includes('Life Quote')) {
        const quoteMatch = section.match(/"([^"]+)"/);
        if (quoteMatch) {
          quote = quoteMatch[1];
        }
      }
      if (section.includes('Your Story') && !description) {
        const paragraphs = section.split('\n').filter(p => p.trim() && !p.includes('Your Story'));
        description = paragraphs.slice(0, 2).join(' ').trim();
      }
    });

    return {
      title: title || personalityType,
      subtitle: subtitle || 'Discover your unique personality',
      description: description || 'Your detailed personality analysis reveals unique insights about your character, motivations, and potential.',
      traits: traits.slice(0, 5),
      strengths: strengths.slice(0, 4),
      quote: quote || 'Your personality is your superpower.'
    };
  };

  const parsedData = parsePersonalityContent(personalityData.content);

  const getPersonalityColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'INFP': theme.palette.secondary.main,
      'INFJ': theme.palette.primary.dark,
      'ENFP': theme.palette.warning.main,
      'ENFJ': theme.palette.secondary.light,
      'INTP': theme.palette.primary.main,
      'INTJ': theme.palette.primary.dark,
      'ENTP': theme.palette.warning.main,
      'ENTJ': theme.palette.error.main,
      'ISFP': theme.palette.success.main,
      'ISFJ': theme.palette.success.dark,
      'ESFP': theme.palette.warning.light,
      'ESFJ': theme.palette.warning.main,
      'ISTP': theme.palette.primary.light,
      'ISTJ': theme.palette.primary.dark,
      'ESTP': theme.palette.error.light,
      'ESTJ': theme.palette.primary.main
    };
    return colorMap[type.split('-')[0]] || theme.palette.primary.main;
  };

  const getPersonalityEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      'INFP': '🌸', 'INFJ': '🔮', 'ENFP': '🌟', 'ENFJ': '💫', 'INTP': '🧠', 'INTJ': '♟️', 'ENTP': '💡', 'ENTJ': '👑',
      'ISFP': '🎨', 'ISFJ': '🤗', 'ESFP': '🎉', 'ESFJ': '💖', 'ISTP': '🔧', 'ISTJ': '📋', 'ESTP': '⚡', 'ESTJ': '⚖️'
    };
    return emojiMap[type.split('-')[0]] || '🧠';
  };

  const handleShare = async () => {
    const shareText = `I just discovered I'm a ${personalityType} personality type! ${parsedData.quote}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Personality Test Results', text: shareText, url: window.location.href });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setShareMessage('Results copied to clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  const personalityColor = getPersonalityColor(personalityType);
  const personalityEmoji = getPersonalityEmoji(personalityType);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50] }}>
      {/* App Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${personalityColor} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: theme.shadows[4]
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 3 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Your Personality Results
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Complete personality analysis and insights
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Share />}
            onClick={handleShare}
            sx={{
              borderColor: 'rgba(255,255,255,0.5)', borderWidth: '2px', color: 'white', mr: 2,
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: '2px' }
            }}
          >
            Share
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Hero Section */}
        <Card elevation={8} sx={{
          mb: 6, background: `linear-gradient(135deg, ${personalityColor} 0%, ${personalityColor}CC 100%)`, color: 'white', overflow: 'hidden', position: 'relative',
          '&::before': { content: '""', position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }
        }}>
          <CardContent sx={{ p: 6, position: 'relative', zIndex: 1 }}>
            <Grid container spacing={4} alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4rem' }, fontWeight: 800, mb: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                    {personalityEmoji} {personalityType}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, opacity: 0.95 }}>
                    {parsedData.title}
                  </Typography>
                  <Typography variant="h6" sx={{ fontStyle: 'italic', opacity: 0.9, mb: 4, fontSize: '1.25rem' }}>
                    "{parsedData.quote}"
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.125rem', lineHeight: 1.6, opacity: 0.95 }}>
                    {parsedData.description}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 3, fontSize: '4rem', backgroundColor: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.3)' }}>
                    {personalityEmoji}
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {personalityType}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Personality Type
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Share Message */}
        {shareMessage && (
          <Paper elevation={4} sx={{ p: 2, mb: 4, backgroundColor: theme.palette.success.main, color: 'white', textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{shareMessage}</Typography>
          </Paper>
        )}

        <Grid container spacing={6} alignItems="stretch" justifyContent="center">
          {/* Key Traits */}
          <Grid item xs={12} md={6}>
            <Card elevation={4} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ backgroundColor: `${personalityColor}20`, color: personalityColor, mr: 2, width: 48, height: 48 }}>
                    <PersonPin sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    Key Traits
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {parsedData.traits.map((trait, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ color: personalityColor, mr: 2, fontSize: 24 }} />
                      <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {trait}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Strengths */}
          <Grid item xs={12} md={6}>
            <Card elevation={4} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ backgroundColor: `${theme.palette.success.main}20`, color: theme.palette.success.main, mr: 2, width: 48, height: 48 }}>
                    <Star sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    Your Strengths
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {parsedData.strengths.map((strength, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Favorite sx={{ color: theme.palette.success.main, mr: 2, fontSize: 24 }} />
                      <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {strength}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Analysis */}
          <Grid item xs={12}>
            <Card elevation={4}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Psychology sx={{ mr: 2, color: personalityColor, fontSize: 32 }} />
                  Complete Personality Analysis
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-line' }}>
                  {personalityData.content}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)` }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                What's Next?
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                <Tooltip title="You need to do the MBTI test first" disableHoverListener={hasMbti}>
                  <span>
                    <Button variant="contained" size="large" startIcon={<School />} onClick={() => navigate('/major-matching-test')} sx={{ py: 2, px: 4, fontSize: '1.125rem', fontWeight: 700, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }} disabled={!hasMbti}>
                      Find Your Perfect Major
                    </Button>
                  </span>
                </Tooltip>
                <Button variant="outlined" size="large" startIcon={<Refresh />} onClick={() => navigate('/personality-test')} sx={{ py: 2, px: 4, fontSize: '1.125rem', fontWeight: 600, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}>
                  Retake Test
                </Button>
                <Button variant="outlined" size="large" startIcon={<Home />} onClick={() => navigate('/')} sx={{ py: 2, px: 4, fontSize: '1.125rem', fontWeight: 600, borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}>
                  Back to Home
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PersonalityResults;