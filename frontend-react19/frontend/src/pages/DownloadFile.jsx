import { useState } from "react";
import {
  Button,
  Typography,
  Paper,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function FileDecryptPage() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [key, setKey] = useState("");
  const [format, setFormat] = useState("txt");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    t("decrypt_steps.upload"),
    t("decrypt_steps.key_verification"),
    t("decrypt_steps.decryption"),
    t("decrypt_steps.reconstruction"),
    t("decrypt_steps.download")
  ];

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setActiveStep(1); // Move to key verification step
  };

  const handleFileDecrypt = async () => {
    if (!file || !key) {
      setError(t("file_decrypt_fill_fields"));
      return;
    }

    try {
      setActiveStep(2); // Start decryption process
      
      const response = await axios.post(
        "http://localhost:8080/file/download",
        {
          filename: file.name,
          key: key
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          responseType: "blob"
        }
      );

      setActiveStep(3); // File reconstruction
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${file.name.split(".")[0]}_decrypted.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setActiveStep(4); // Complete
    } catch (err) {
      console.error("Decrypt error:", err);
      setError(err.response?.data?.error || err.message || t("file_decrypt_error"));
      setActiveStep(0); // Reset on error
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Main decryption interface */}
      <Paper
        sx={{
          width: "100%",
          maxWidth: 800,
          mx: "auto",
          mt: 4,
          p: 4,
          borderRadius: 4,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          background: "#f0f8ff"
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            color: "#2e7d32",
            textShadow: "0 0 8px rgba(46, 125, 50, 0.4)",
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <LockOpenIcon fontSize="large" />
          {t("file_decrypt_title")}
        </Typography>

        {/* Process stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            id="file-upload"
            accept=".enc"
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadFileIcon />}
              sx={{
                background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
                color: "#fff",
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1.5,
                boxShadow: "0 2px 10px rgba(66, 165, 245, 0.4)",
                '&:hover': {
                  background: "linear-gradient(135deg, #1e7e2e, #43a047)"
                }
              }}
            >
              {t("upload_encrypted_file")}
            </Button>
          </label>

          {file && (
            <Box sx={{ 
              backgroundColor: '#e8f5e9', 
              p: 2, 
              borderRadius: 2,
              borderLeft: '4px solid #2e7d32'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t("selected_file")}: {file.name}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {t("file_size")}: {(file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}

          <TextField
            label={t("enter_encryption_key")}
            variant="outlined"
            fullWidth
            value={key}
            onChange={(e) => setKey(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            helperText={t("key_requirements")}
          />

          <FormControl fullWidth>
            <InputLabel>{t("choose_output_format")}</InputLabel>
            <Select
              value={format}
              label={t("choose_output_format")}
              onChange={(e) => setFormat(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="txt">TXT (Text)</MenuItem>
              <MenuItem value="png">PNG (Image)</MenuItem>
              <MenuItem value="jpg">JPG (Image)</MenuItem>
              <MenuItem value="pdf">PDF (Document)</MenuItem>
              <MenuItem value="original">{t("original_format")}</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            fullWidth
            startIcon={<FileDownloadIcon />}
            disabled={!file || !key}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: "bold",
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: 2,
              background: "linear-gradient(135deg, #00c853, #64dd17)",
              boxShadow: "0 3px 10px rgba(100, 221, 23, 0.4)",
              '&:hover': {
                background: "linear-gradient(135deg, #2e7d32, #66bb6a)"
              }
            }}
            onClick={handleFileDecrypt}
          >
            {t("decrypt_and_download")}
          </Button>
        </Box>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
          <Alert severity="error" onClose={handleCloseAlert}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={success} autoHideDuration={3000} onClose={handleCloseAlert}>
          <Alert severity="success" onClose={handleCloseAlert}>
            {t("file_decrypt_success")}
          </Alert>
        </Snackbar>
      </Paper>

      {/* Educational section */}
      <Paper
        sx={{
          width: "100%",
          maxWidth: 800,
          mx: "auto",
          p: 4,
          borderRadius: 4,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          background: "#f5f5f5"
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "#2e7d32",
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <SecurityIcon fontSize="large" />
          {t("decryption_process.title")}
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {t("decryption_process.how_it_works")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ 
                backgroundColor: '#e8f5e9', 
                p: 3, 
                borderRadius: 2,
                borderLeft: '4px solid #2e7d32'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {t("decryption_process.structure_of_enc")}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CodeIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary={t("decryption_process.nonce_header")}
                      secondary={t("decryption_process.nonce_desc")}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemIcon><LockIcon color="secondary" /></ListItemIcon>
                    <ListItemText 
                      primary={t("decryption_process.encrypted_data")}
                      secondary={t("decryption_process.encrypted_data_desc")}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemIcon><WarningIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary={t("decryption_process.auth_tag")}
                      secondary={t("decryption_process.auth_tag_desc")}
                    />
                  </ListItem>
                </List>
              </Box>

              <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                {t("decryption_process.decryption_steps")}
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2
              }}>
                <Box sx={{ 
                  p: 2,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 2,
                  borderLeft: '4px solid #1976d2'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    1. {t("decryption_process.step1_title")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("decryption_process.step1_desc")}
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 2,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 2,
                  borderLeft: '4px solid #1976d2'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    2. {t("decryption_process.step2_title")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("decryption_process.step2_desc")}
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 2,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 2,
                  borderLeft: '4px solid #1976d2'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    3. {t("decryption_process.step3_title")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("decryption_process.step3_desc")}
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 2,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 2,
                  borderLeft: '4px solid #1976d2'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    4. {t("decryption_process.step4_title")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("decryption_process.step4_desc")}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {t("decryption_process.important_note")}
                </Typography>
                {t("decryption_process.important_note_desc")}
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {t("security_considerations.title")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t("security_considerations.key_management")}
              </Typography>
              <Typography variant="body2">
                {t("security_considerations.key_management_desc")}
              </Typography>
              
              <Box sx={{ 
                backgroundColor: '#fff8e1', 
                p: 2, 
                borderRadius: 2,
                borderLeft: '4px solid #ffa000'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {t("security_considerations.best_practices")}
                </Typography>
                <List dense sx={{ mt: 1 }}>
                  <ListItem>
                    <ListItemText
                      primary={t("security_considerations.practice1")}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={t("security_considerations.practice2")}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={t("security_considerations.practice3")}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}