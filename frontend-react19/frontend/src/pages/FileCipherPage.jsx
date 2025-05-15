import { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Paper,
  Box,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
  Chip
} from "@mui/material";
import { keyframes } from "@mui/system";
import { useTranslation } from "react-i18next";
import axios from "axios";
import FileUploadIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function FileCipherPage() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [key, setKey] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const steps = [
    t("fileSteps.upload"),
    t("fileSteps.generateKey"),
    t("fileSteps.encrypt"),
    t("fileSteps.save")
  ];

  const visualizeProcess = () => {
    setActiveStep(0);
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
      
      setActiveStep((prevStep) => {
        if (prevStep === steps.length - 1) {
          clearInterval(timer);
          return prevStep;
        }
        if (progress >= 100 / steps.length * (prevStep + 1)) {
          return prevStep + 1;
        }
        return prevStep;
      });
    }, 500);
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setLoading(true);
    setProgress(0);
    setActiveStep(0);
    visualizeProcess();

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:8080/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data && response.data.key) {
        setKey(response.data.key);
        setFilename(response.data.encrypted_filename || response.data.encryptedFilename);
        setSuccess(true);
        setActiveStep(steps.length - 1);
      } else {
        setError(t("errors.noKey"));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("errors.upload"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async () => {
    if (!filename || !key) {
      setError(t("errors.insufficientData"));
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/file/download", { filename, key }, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file?.name || "decrypted_file");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("errors.download"));
    }
  };

  const handleEncryptedFileDownload = async () => {
    if (!filename) {
      setError(t("errors.insufficientEncrypted"));
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8080/file/encrypted?filename=${filename}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("errors.downloadEncrypted"));
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(false);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(key);
  };
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Paper sx={{ width: '95%', p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: 6, animation: `${fadeIn} 0.5s ease` }}>
        {/* Основной интерфейс загрузки файла */}
        <Typography variant="h4" align="center" sx={{ mb: 4, color: "#2e7d32", fontWeight: 600 }}>
          {t("fileEncryption.title")}
        </Typography>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <input type="file" onChange={handleFileUpload} style={{ display: "none" }} id="file-upload" />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<FileUploadIcon />}
              disabled={loading}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                backgroundColor: "#2e7d32",
                "&:hover": { backgroundColor: "#1b5e20" },
                animation: loading ? `${pulse} 1.5s infinite` : 'none'
              }}
            >
              {loading ? t("fileEncryption.uploading") : t("fileEncryption.upload")}
            </Button>
          </label>
        </Box>

        {/* Индикатор прогресса */}
        {loading && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 10, borderRadius: 5, mt: 2 }}
            />
          </Box>
        )}

        {/* Результаты шифрования */}
        {filename && (
          <Box sx={{ mt: 3, backgroundColor: "#e8f5e9", p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: "#2e7d32" }}>{t("fileEncryption.encryptedFile")}:</Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{filename}</Typography>

            {key && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Typography variant="h6" sx={{ color: "#2e7d32" }}>{t("fileEncryption.encryptionKey")}:</Typography>
                  <Tooltip title={t("fileEncryption.copyKey")}>
                    <IconButton onClick={copyKey} sx={{ ml: 1 }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  value={key}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '1rem' }
                  }}
                  sx={{ mt: 1, backgroundColor: '#f1f8e9', borderRadius: 1 }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {t("fileEncryption.saveKeyInfo")}
                </Typography>
              </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={handleEncryptedFileDownload}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 'bold',
                  backgroundColor: "#2e7d32",
                  "&:hover": { backgroundColor: "#1b5e20" }
                }}
              >
                {t("fileEncryption.downloadEncrypted")}
              </Button>
              
            </Box>
          </Box>
        )}
      </Paper>

      {/* Визуализация процесса */}
      <Paper sx={{ width: '95%', p: 3, borderRadius: 4, boxShadow: 6 }}>
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" sx={{ color: "#2e7d32" }}>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t("fileVisualization.title")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Шаги процесса */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip icon={<FileUploadIcon />} label="1" color="primary" />
                  <Box>
                    <Typography variant="h6">{t("fileVisualization.step1Title")}</Typography>
                    <Typography variant="body2">{t("fileVisualization.step1Desc")}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip icon={<LockIcon />} label="2" color="secondary" />
                  <Box>
                    <Typography variant="h6">{t("fileVisualization.step2Title")}</Typography>
                    <Typography variant="body2">{t("fileVisualization.step2Desc")}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip icon={<CodeIcon />} label="3" color="success" />
                  <Box>
                    <Typography variant="h6">{t("fileVisualization.step3Title")}</Typography>
                    <Typography variant="body2">
                      {t("fileVisualization.step3Desc")}
                      <Box component="span" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 0.5 }}>
                        AES-256
                      </Box>
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip icon={<FileDownloadIcon />} label="4" color="info" />
                  <Box>
                    <Typography variant="h6">{t("fileVisualization.step4Title")}</Typography>
                    <Typography variant="body2">{t("fileVisualization.step4Desc")}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Графическая схема */}
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 3, 
                borderRadius: 2, 
                border: '1px dashed #2e7d32',
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>
                  {t("fileVisualization.schemeTitle")}
                </Typography>
                <Box sx={{ 
                  position: 'relative', 
                  height: 150,
                  backgroundImage: 'linear-gradient(to right, #e8f5e9, #c8e6c9, #a5d6a7, #81c784, #66bb6a)',
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around'
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption">{t("fileVisualization.original")}</Typography>
                    <Box sx={{ 
                      p: 1, 
                      backgroundColor: 'white', 
                      borderRadius: 1, 
                      mt: 1,
                      boxShadow: 2
                    }}>
                      {file?.name?.substring(0, 10) || 'file.txt'}...
                    </Box>
                  </Box>
                  <LockIcon fontSize="large" color="primary" />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption">AES-256</Typography>
                    <Box sx={{ 
                      p: 1, 
                      backgroundColor: 'white', 
                      borderRadius: 1, 
                      mt: 1,
                      boxShadow: 2
                    }}>
                      {key ? key.substring(0, 10) + '...' : '*****'}
                    </Box>
                  </Box>
                  <LockOpenIcon fontSize="large" color="secondary" />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption">{t("fileVisualization.encrypted")}</Typography>
                    <Box sx={{ 
                      p: 1, 
                      backgroundColor: 'white', 
                      borderRadius: 1, 
                      mt: 1,
                      boxShadow: 2
                    }}>
                      {filename ? filename.substring(0, 10) + '...' : 'encrypted...'}
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Технические детали */}
              <Box sx={{ 
                backgroundColor: '#e8f5e9', 
                p: 3, 
                borderRadius: 2,
                borderLeft: '4px solid #2e7d32'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>
                  <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t("fileVisualization.techDetails")}
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                  gap: 2 
                }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {t("fileVisualization.algorithm")}:
                    </Typography>
                    <Chip label="AES-256" color="success" sx={{ mt: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {t("fileVisualization.mode")}:
                    </Typography>
                    <Chip label="GCM (рекомендуемый)" color="info" sx={{ mt: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {t("fileVisualization.keyGen")}:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      PBKDF2 с 100,000 итерациями
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {t("fileVisualization.security")}:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t("fileVisualization.securityLevel")}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Уведомления */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert severity="error" onClose={handleCloseAlert}>{error}</Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={3000} onClose={handleCloseAlert}>
        <Alert
          severity="success"
          onClose={handleCloseAlert}
          sx={{ backgroundColor: "#43a047", color: "#fff" }}
        >
          {t("fileEncryption.success")}
        </Alert>
      </Snackbar>
    </Box>
  );
}