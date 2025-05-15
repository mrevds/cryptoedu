import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider
} from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

export default function BruteForcePage() {
  const { t } = useTranslation();

  const [ciphertext, setCiphertext] = useState('');
  const [knownKeyPart, setKnownKeyPart] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentKeys, setCurrentKeys] = useState([]);
  const [foundKey, setFoundKey] = useState(null);

  const animationRef = useRef();
  const resultRef = useRef(null);
  const keysHistoryRef = useRef([]);
  const delayDurationRef = useRef(0);

  const generateRandomKey = () => {
    const randomBytes = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return knownKeyPart + randomBytes;
  };

  const simulateBruteforce = (onFinish) => {
    const startTime = Date.now();
    const duration = delayDurationRef.current * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(elapsed / duration, 1);
      setProgress(prog * 100);

      if (elapsed < duration) {
        if (elapsed % 200 < 50) {
          const newKey = generateRandomKey();
          keysHistoryRef.current = [newKey, ...keysHistoryRef.current].slice(0, 10);
          setCurrentKeys(keysHistoryRef.current);
        }
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onFinish();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleBruteForce = async () => {
    if (!ciphertext || !knownKeyPart) {
      setError(t('fill_all_fields'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProgress(0);
    setCurrentKeys([]);
    setFoundKey(null);
    keysHistoryRef.current = [];

    delayDurationRef.current = 20 + Math.floor(Math.random() * 21);

    try {
      const response = await axios.post('http://localhost:8080/bruteforce', {
        ciphertext,
        known_key_part: knownKeyPart,
        mode: 'ecb'
      });

      resultRef.current = response.data;

      simulateBruteforce(() => {
        setResult(response.data);
        setFoundKey(response.data.key);
        setCurrentKeys(prev => [response.data.key, ...prev.slice(0, 9)]);
        setLoading(false);
      });

    } catch (err) {
      setError(err.response?.data?.error || t('bruteforce_error'));
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Main bruteforce interface */}
      <Paper elevation={6} sx={{
        p: 4,
        maxWidth: 800,
        mx: 'auto',
        mt: 4,
        borderRadius: 4,
        background: '#f5f5f5',
        color: '#333',
      }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4CAF50', mb: 3 }}>
          <LockOpenIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          {t('brute_force_title')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            label={t('ciphertext')}
            fullWidth
            value={ciphertext}
            onChange={(e) => setCiphertext(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: '#4CAF50' },
              '& .MuiInputBase-input': { color: '#4CAF50' }
            }}
          />

          <TextField
            label={t('known_key_part')}
            fullWidth
            value={knownKeyPart}
            onChange={(e) => setKnownKeyPart(e.target.value)}
            helperText={t('key_part_length_hint')}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: '#4CAF50' },
              '& .MuiInputBase-input': { color: '#4CAF50' }
            }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleBruteForce}
          disabled={loading}
          sx={{
            mb: 2,
            background: '#4CAF50',
            fontWeight: 'bold',
            color: 'white',
            '&:hover': { background: '#388E3C' },
            fontSize: '1.1rem',
            py: 1.5
          }}
        >
          🚀 {t('start_bruteforce')}
        </Button>

        {loading && (
          <>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, height: 10, borderRadius: 5 }} />
            <Typography variant="body2" color="gray">
              {t('progress')}: {Math.round(progress)}% ({t('estimated_time')}: {delayDurationRef.current} {t('seconds')})
            </Typography>
          </>
        )}

        {loading && currentKeys.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('key_history')}
            </Typography>
            <List dense sx={{
              maxHeight: 200,
              overflow: 'auto',
              border: '1px solid',
              borderColor: '#4CAF50',
              borderRadius: 2,
              bgcolor: '#e8f5e9',
            }}>
              {currentKeys.map((key, index) => (
                <ListItem
                  key={index}
                  sx={{
                    bgcolor: foundKey === key ? '#388E3C' : 'transparent',
                    color: foundKey === key ? 'white' : 'inherit',
                    transition: 'background-color 0.3s',
                    fontFamily: 'monospace'
                  }}
                >
                  <ListItemText
                    primary={key}
                    primaryTypographyProps={{ fontFamily: 'monospace' }}
                  />
                  {foundKey === key && (
                    <Typography variant="body2" color="lightgreen">
                      ✓ {t('found')}
                    </Typography>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {result && !loading && (
          <Box sx={{
            mt: 3,
            background: '#e8f5e9',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
          }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {t('key_found')}: {result.time_taken} {t('seconds')}
            </Alert>
            <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              <strong>{t('found_key')}:</strong> {result.key}
            </Typography>
            <Typography sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-word' }}>
              <strong>{t('decrypted_text')}:</strong> {result.plaintext}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Educational section */}
      <Paper elevation={6} sx={{
        p: 4,
        maxWidth: 800,
        mx: 'auto',
        borderRadius: 4,
        background: '#f5f5f5',
      }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#4CAF50', mb: 3 }}>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          {t('bruteforce_education.title')}
        </Typography>

        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {t('bruteforce_education.what_is_bruteforce')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('bruteforce_education.bruteforce_definition')}
            </Typography>
            <Box sx={{ 
              backgroundColor: '#e8f5e9', 
              p: 2, 
              borderRadius: 2,
              borderLeft: '4px solid #4CAF50'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {t('bruteforce_education.key_points')}:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>{t('bruteforce_education.point1')}</li>
                <li>{t('bruteforce_education.point2')}</li>
                <li>{t('bruteforce_education.point3')}</li>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              {t('bruteforce_education.why_ecb_vulnerable')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('bruteforce_education.ecb_problems_intro')}
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mt: 2
            }}>
              <Box sx={{ 
                p: 2,
                backgroundColor: '#ffebee',
                borderRadius: 2,
                borderLeft: '4px solid #d32f2f'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {t('bruteforce_education.ecb_weakness1_title')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('bruteforce_education.ecb_weakness1_desc')}
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 2,
                backgroundColor: '#ffebee',
                borderRadius: 2,
                borderLeft: '4px solid #d32f2f'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {t('bruteforce_education.ecb_weakness2_title')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('bruteforce_education.ecb_weakness2_desc')}
                </Typography>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('bruteforce_education.ecb_warning')}
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {t('bruteforce_education.how_to_protect')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('bruteforce_education.protection_intro')}
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mt: 2
            }}>
              <Box sx={{ 
                p: 2,
                backgroundColor: '#e8f5e9',
                borderRadius: 2,
                borderLeft: '4px solid #4CAF50'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {t('bruteforce_education.protection1_title')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('bruteforce_education.protection1_desc')}
                </Typography>
                <Chip label="AES-GCM" color="success" sx={{ mt: 1 }} />
                <Chip label="AES-CBC" color="success" sx={{ mt: 1, ml: 1 }} />
              </Box>
              
              <Box sx={{ 
                p: 2,
                backgroundColor: '#e8f5e9',
                borderRadius: 2,
                borderLeft: '4px solid #4CAF50'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {t('bruteforce_education.protection2_title')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('bruteforce_education.protection2_desc')}
                </Typography>
                <Chip label="PBKDF2" color="info" sx={{ mt: 1 }} />
                <Chip label="Argon2" color="info" sx={{ mt: 1, ml: 1 }} />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}