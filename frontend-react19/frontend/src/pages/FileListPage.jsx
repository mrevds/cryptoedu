import { useState, useEffect } from "react";
import { 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress
} from "@mui/material";
import { keyframes } from "@mui/system";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import FileDownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import CodeIcon from '@mui/icons-material/Code';

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

export default function FileListPage() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:8080/files/list")
      .then((res) => {
        setFiles(res.data.files);
        setLoading(false);
      })
      .catch((err) => {
        alert(t('errors.fileList') + ": " + err.message);
        setLoading(false);
      });
  }, [t]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setShowDetails(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Основной список файлов */}
      <Paper sx={{ 
        padding: 4, 
        borderRadius: 3, 
        boxShadow: 3, 
        animation: `${fadeIn} 0.8s ease-out`,
        position: 'relative'
      }}>
        {loading && (
          <LinearProgress sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            height: 4
          }} />
        )}

        <Typography variant="h4" gutterBottom sx={{ 
          textAlign: "center", 
          color: "#388e3c",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <LockIcon fontSize="large" />
          {t('fileList.title')}
        </Typography>

        {files.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="h6" sx={{ color: "#f44336" }}>
              {t('fileList.noFiles')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ marginTop: 3 }}>
            {files.map((file) => (
              <Box key={file} sx={{ 
                marginBottom: 2, 
                animation: `${fadeIn} 0.5s ease-in`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(5px)'
                }
              }}>
                <ListItem sx={{ 
                  backgroundColor: "#e8f5e9", 
                  borderRadius: 1, 
                  padding: "12px 16px",
                  boxShadow: 2,
                  borderLeft: '4px solid #388e3c'
                }}>
                  <ListItemText 
                    primary={file} 
                    secondary={t('fileList.encryptedFile')}
                    sx={{ 
                      fontFamily: "monospace", 
                      '& .MuiListItemText-primary': {
                        fontWeight: "bold", 
                        color: "#388e3c",
                        fontSize: '1.1rem'
                      },
                      '& .MuiListItemText-secondary': {
                        color: "#757575",
                        fontSize: '0.8rem'
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={t('fileList.details')}>
                      <IconButton 
                        onClick={() => handleFileSelect(file)}
                        sx={{ color: "#388e3c" }}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Button 
                      variant="contained"
                      startIcon={<FileDownloadIcon />}
                      sx={{
                        backgroundColor: "#388e3c",
                        "&:hover": { backgroundColor: "#2e7d32" },
                        color: "white",
                        minWidth: '120px'
                      }}
                      onClick={() => alert(`${t('fileList.download')}: ${file}`)}
                    >
                      {t('fileList.download')}
                    </Button>
                  </Box>
                </ListItem>
                <Divider sx={{ marginTop: 1, borderColor: "#bdbdbd" }} />
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* Блок с обучающей информацией */}
      <Paper sx={{ 
        padding: 3, 
        borderRadius: 3, 
        boxShadow: 3,
        backgroundColor: '#f5f5f5'
      }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" sx={{ color: "#388e3c" }}>
              <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('fileList.aboutEncryptedFiles')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Что такое .enc файлы */}
              <Box>
                <Typography variant="h6" sx={{ 
                  color: "#388e3c",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1
                }}>
                  <LockIcon fontSize="small" />
                  {t('fileList.whatIsEnc')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {t('fileList.encExplanation')}
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#e8f5e9', 
                  p: 2, 
                  borderRadius: 2,
                  borderLeft: '4px solid #388e3c'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {t('fileList.fileStructure')}:
                  </Typography>
                  <Box component="ul" sx={{ 
                    pl: 2, 
                    mt: 1,
                    '& li': { 
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      mb: 1
                    }
                  }}>
                    <li>16 байт: Nonce (вектор инициализации)</li>
                    <li>N байт: Зашифрованные данные</li>
                    <li>16 байт: GCM тег аутентификации</li>
                  </Box>
                </Box>
              </Box>

              {/* Важность ключа */}
              <Box>
                <Typography variant="h6" sx={{ 
                  color: "#d32f2f",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1
                }}>
                  <WarningIcon fontSize="small" />
                  {t('fileList.keyImportance')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {t('fileList.keyExplanation')}
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t('fileList.keyWarning')}
                </Alert>
              </Box>

              {/* Технические детали */}
              {selectedFile && (
                <Box sx={{ 
                  backgroundColor: '#e3f2fd', 
                  p: 3, 
                  borderRadius: 2,
                  border: '1px solid #bbdefb'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: "#1976d2",
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <InfoIcon fontSize="small" />
                    {t('fileList.selectedFile')}: {selectedFile}
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2
                  }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {t('fileList.encryptionDetails')}:
                      </Typography>
                      <Box component="ul" sx={{ mt: 1 }}>
                        <li>
                          <Chip label="AES-256" size="small" sx={{ mr: 1 }} />
                          {t('fileList.algorithm')}
                        </li>
                        <li>
                          <Chip label="GCM" size="small" sx={{ mr: 1 }} />
                          {t('fileList.mode')}
                        </li>
                        <li>
                          <Chip label="PBKDF2" size="small" sx={{ mr: 1 }} />
                          {t('fileList.keyDerivation')}
                        </li>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {t('fileList.securityFeatures')}:
                      </Typography>
                      <Box component="ul" sx={{ mt: 1 }}>
                        <li>{t('fileList.feature1')}</li>
                        <li>{t('fileList.feature2')}</li>
                        <li>{t('fileList.feature3')}</li>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Как работает шифрование */}
              <Box>
                <Typography variant="h6" sx={{ 
                  color: "#388e3c",
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <LockIcon fontSize="small" />
                  {t('fileList.howItWorks')}
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: 1,
                    borderLeft: '4px solid #388e3c'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      1. {t('fileList.step1')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t('fileList.step1Desc')}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: 1,
                    borderLeft: '4px solid #388e3c'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      2. {t('fileList.step2')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t('fileList.step2Desc')}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: 1,
                    borderLeft: '4px solid #388e3c'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      3. {t('fileList.step3')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t('fileList.step3Desc')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}