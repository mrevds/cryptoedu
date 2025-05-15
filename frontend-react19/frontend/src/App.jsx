import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Fade
} from "@mui/material";
import LanguageIcon from '@mui/icons-material/Language';
import KeyIcon from '@mui/icons-material/VpnKey'; // Импорт иконки ключа
import { useState } from "react";
import { useTranslation } from "react-i18next";

import TextCipherPage from "./pages/TextCipherPage";
import FileCipherPage from "./pages/FileCipherPage";
import FileListPage from "./pages/FileListPage";
import BruteForcePage from "./pages/BruteForcePage";
import FileDecryptPage from "./pages/DownloadFile";
import HomePage from "./pages/HomePage";

import './i18n';
import './App.css';

function Layout() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLanguageClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = (lang) => {
    if (lang) i18n.changeLanguage(lang);
    setAnchorEl(null);
  };

  // Если мы на главной странице, не показываем хедер и футер
  if (location.pathname === "/") {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    );
  }

  return (
    <>
      <AppBar position="static" elevation={2} sx={{ backgroundColor: "#f5f5f5", color: "#333" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Логотип ключа с ссылкой на главную */}
            <IconButton 
              component={Link} 
              to="/" 
              sx={{ 
                color: "#333",
                '&:hover': {
                  transform: 'rotate(15deg)',
                  transition: 'transform 0.3s ease'
                }
              }}
            >
              <KeyIcon fontSize="large" />
            </IconButton>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button component={Link} to="/text-cipher" sx={{ color: "#333", textTransform: 'none', fontSize: '1rem' }}>
                {t("Text Encryption")}
              </Button>
              <Button component={Link} to="/files" sx={{ color: "#333", textTransform: 'none', fontSize: '1rem' }}>
                {t("File Encryption")}
              </Button>
              <Button component={Link} to="/files-list" sx={{ color: "#333", textTransform: 'none', fontSize: '1rem' }}>
                {t("My Files")}
              </Button>
              <Button component={Link} to="/bruteforce" sx={{ color: "#333", textTransform: 'none', fontSize: '1rem' }}>
                {t("Bruteforce")}
              </Button>
              <Button component={Link} to="/file-decrypt" sx={{ color: "#333", textTransform: 'none', fontSize: '1rem' }}>
                {t("File Decryption")}
              </Button>
            </Box>
          </Box>

          <Box>
            <IconButton onClick={handleLanguageClick} color="inherit">
              <LanguageIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleLanguageClose()}
              TransitionComponent={Fade}
              sx={{
                "& .MuiPaper-root": {
                  backgroundColor: "#fff",
                  color: "#333",
                  borderRadius: 2,
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
                  minWidth: 160,
                },
              }}
            >
              <MenuItem onClick={() => handleLanguageClose('ru')} selected={i18n.language === 'ru'}>
                Русский
              </MenuItem>
              <MenuItem onClick={() => handleLanguageClose('uz')} selected={i18n.language === 'uz'}>
                O‘zbekcha
              </MenuItem>
              <MenuItem onClick={() => handleLanguageClose('kk')} selected={i18n.language === 'kk'}>
                Qaraqalpaqsha
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Остальной код остается без изменений */}
      <Container
        maxWidth="xl"
        sx={{
          p: 4,
          backgroundColor: "#fafafa",
          minHeight: 'calc(100vh - 64px - 80px)',
          color: "#333",
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Routes>
          <Route path="/text-cipher" element={<TextCipherPage />} />
          <Route path="/files" element={<FileCipherPage />} />
          <Route path="/files-list" element={<FileListPage />} />
          <Route path="/bruteforce" element={<BruteForcePage />} />
          <Route path="/file-decrypt" element={<FileDecryptPage />} />
        </Routes>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 4,
          backgroundColor: "#f5f5f5",
          textAlign: "center",
          fontFamily: 'Inter, sans-serif',
          color: "#555",
          fontSize: "0.9rem",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.05)"
        }}
      >
        MURATBAYEV DENIS 205-21(ИБ РУСС)
      </Box>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </Router>
  );
}