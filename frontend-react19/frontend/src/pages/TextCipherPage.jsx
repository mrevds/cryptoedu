import { useState } from "react";
import { Box, Button, TextField, Select, MenuItem, Typography, Paper, Collapse, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { keyframes } from "@mui/system";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CircularProgress from '@mui/material/CircularProgress';

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function TextCipherPage() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [mode, setMode] = useState("gcm");
  const [key, setKey] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const visualizeEncryption = (text, mode) => {
    const visualizationSteps = [
      { 
        title: t("visualization.step1"), 
        description: t("visualization.step1Desc"), 
        icon: <LockIcon color="primary" />
      },
      { 
        title: mode === "gcm" ? t("visualization.step2GCM") : t("visualization.step2ECB"),
        description: mode === "gcm" ? t("visualization.step2GCMDesc") : t("visualization.step2ECBDesc"),
        icon: <LockIcon color="secondary" />
      },
      { 
        title: t("visualization.step3"), 
        description: t("visualization.step3Desc"), 
        icon: <LockOpenIcon color="action" />
      },
      { 
        title: t("visualization.step4"), 
        description: t("visualization.step4Desc"), 
        icon: <LockOpenIcon color="success" />
      }
    ];
    setSteps(visualizationSteps);
    setExpanded(true);
  };

  const handleEncrypt = async () => {
    try {
      setLoading(true);
      visualizeEncryption(text, mode);
      
      const response = await axios.post("http://localhost:8080/text/encrypt", {
        text,
        mode,
      });
      
      setResult(response.data.ciphertext);
      setKey(response.data.key);
    } catch (error) {
      alert(t("errors.encrypt") + ": " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post("http://localhost:8080/text/decrypt", {
        ciphertext: result,
        key,
        mode,
      });
      
      setResult(response.data.plaintext);
    } catch (error) {
      alert(t("errors.decrypt") + ": " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
       <Paper sx={{ width: '95%', p: 4, borderRadius: 2, boxShadow: 3, animation: `${fadeIn} 1s ease-in` }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center", color: "#388e3c" }}>
        {t("cipher.title")}
      </Typography>

      <TextField
        label={t("cipher.textLabel")}
        multiline
        rows={4}
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: 1,
          '& .MuiInputBase-root': {
            borderRadius: 2,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: "#388e3c",
          }
        }}
      />

      <Select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        fullWidth
        sx={{
          mb: 2,
          borderRadius: 2,
          backgroundColor: "#e8f5e9",
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: "#388e3c",
          },
          '&:hover': {
            backgroundColor: "#f1f8e9",
          }
        }}
      >
        <MenuItem value="gcm">{t("cipher.gcm")}</MenuItem>
        <MenuItem value="ecb">{t("cipher.ecb")}</MenuItem>
      </Select>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleEncrypt} 
          sx={{
            backgroundColor: "#388e3c", 
            '&:hover': { backgroundColor: "#2e7d32" },
            color: "white"
          }}
        >
          {t("cipher.encrypt")}
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleDecrypt} 
          sx={{
            color: "#388e3c", 
            borderColor: "#388e3c",
            '&:hover': {
              backgroundColor: "#388e3c",
              color: "white",
            }
          }}
        >
          {t("cipher.decrypt")}
        </Button>
      </Box>

      {result && (
        <Box sx={{ mt: 3, animation: `${fadeIn} 1s ease-in` }}>
          <Typography variant="h6" sx={{ color: "#388e3c" }}>{t("cipher.result")}</Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={result}
            InputProps={{ readOnly: true }}
            sx={{
              backgroundColor: "#f1f8e9",
              borderRadius: 2,
              boxShadow: 1,
              '& .MuiInputBase-root': {
                borderRadius: 2,
              },
            }}
          />
          {key && (
            <Typography sx={{ mt: 1, color: "#388e3c" }}>
              {t("cipher.key")}: <code>{key}</code>
            </Typography>
          )}
        </Box>
      )}
    </Paper>

      {/* Визуализация процесса */}
      <Paper sx={{ width: '95%', p: 3, borderRadius: 2, boxShadow: 3 }}>
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: "#388e3c" }}>
              {t("visualization.title")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((step, index) => (
                <Box 
                  key={index}
                  sx={{
                    p: 2,
                    borderLeft: '4px solid #388e3c',
                    backgroundColor: '#f1f8e9',
                    borderRadius: 1,
                    animation: `${pulse} 1s ease-in-out`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    boxShadow: 1
                  }}>
                    {step.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2">
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {/* Графическая схема */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#388e3c" }}>
                  {t("visualization.schemeTitle")}
                </Typography>
                <Box sx={{ 
                  position: 'relative', 
                  height: 200,
                  backgroundImage: mode === 'gcm' 
                    ? 'linear-gradient(to right, #e8f5e9, #c8e6c9, #a5d6a7, #81c784, #66bb6a)'
                    : 'linear-gradient(to right, #e8f5e9, #b2dfdb, #80cbc4, #4db6ac, #26a69a)',
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {mode === 'gcm' ? (
                    <>
                      <Box sx={{ position: 'absolute', left: 50, textAlign: 'center' }}>
                        <Typography variant="caption">Plaintext</Typography>
                        <Box sx={{ 
                          p: 1, 
                          backgroundColor: 'white', 
                          borderRadius: 1, 
                          mt: 1,
                          boxShadow: 2
                        }}>
                          {text.substring(0, 10)}...
                        </Box>
                      </Box>
                      <Box sx={{ position: 'absolute', left: 200 }}>
                        <LockIcon fontSize="large" color="primary" />
                      </Box>
                      <Box sx={{ position: 'absolute', left: 350, textAlign: 'center' }}>
                        <Typography variant="caption">Ciphertext</Typography>
                        <Box sx={{ 
                          p: 1, 
                          backgroundColor: 'white', 
                          borderRadius: 1, 
                          mt: 1,
                          boxShadow: 2
                        }}>
                          {result ? result.substring(0, 10) + '...' : '...'}
                        </Box>
                      </Box>
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 20, 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption">Key + IV</Typography>
                        <Box sx={{ 
                          p: 1, 
                          backgroundColor: 'white', 
                          borderRadius: 1, 
                          mt: 1,
                          boxShadow: 2
                        }}>
                          {key ? key.substring(0, 10) + '...' : '...'}
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ position: 'absolute', left: 50, textAlign: 'center' }}>
                        <Typography variant="caption">Plaintext</Typography>
                        <Box sx={{ 
                          p: 1, 
                          backgroundColor: 'white', 
                          borderRadius: 1, 
                          mt: 1,
                          boxShadow: 2
                        }}>
                          {text.substring(0, 10)}...
                        </Box>
                      </Box>
                      <Box sx={{ position: 'absolute', left: 200 }}>
                        <LockIcon fontSize="large" color="primary" />
                      </Box>
                      <Box sx={{ position: 'absolute', left: 350, textAlign: 'center' }}>
                        <Typography variant="caption">Ciphertext</Typography>
                        <Box sx={{ 
                          p: 1, 
                          backgroundColor: 'white', 
                          borderRadius: 1, 
                          mt: 1,
                          boxShadow: 2
                        }}>
                          {result ? result.substring(0, 10) + '...' : '...'}
                        </Box>
                      </Box>
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 20, 
                        left: 200,
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption">Key</Typography>
                        <Box sx={{ 
                          p: 1, 
                          backgroundColor: 'white', 
                          borderRadius: 1, 
                          mt: 1,
                          boxShadow: 2
                        }}>
                          {key ? key.substring(0, 10) + '...' : '...'}
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {mode === 'gcm' 
                    ? t("visualization.schemeGCM") 
                    : t("visualization.schemeECB")}
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Информация о режимах */}
      <Paper sx={{ width: '95%', p: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: "#388e3c" }}>
          {t("modesInfo.title")}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ 
            flex: 1, 
            p: 2, 
            backgroundColor: '#e8f5e9', 
            borderRadius: 2,
            border: mode === 'gcm' ? '2px solid #388e3c' : '1px solid #bdbdbd'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              GCM {t("modesInfo.mode")}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t("modesInfo.gcmDesc")}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#2e7d32' }}>
              {t("modesInfo.useCases")}: {t("modesInfo.gcmUseCases")}
            </Typography>
          </Box>
          <Box sx={{ 
            flex: 1, 
            p: 2, 
            backgroundColor: '#e8f5e9', 
            borderRadius: 2,
            border: mode === 'ecb' ? '2px solid #388e3c' : '1px solid #bdbdbd'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              ECB {t("modesInfo.mode")}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t("modesInfo.ecbDesc")}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#d32f2f' }}>
              {t("modesInfo.warning")}: {t("modesInfo.ecbWarning")}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}