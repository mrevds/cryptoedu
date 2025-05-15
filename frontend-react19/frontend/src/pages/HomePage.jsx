import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function HomePage() {
  const navigate = useNavigate();
  const [binaryText, setBinaryText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [randomNoise, setRandomNoise] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true)

  const fullText = "> ИНИЦИАЛИЗАЦИЯ ПЛАТФОРМЫ...\n> АНАЛИЗ КЛЮЧЕЙ ШИФРОВАНИЯ...\n> ДОСТУП ПОДТВЕРЖДЕН\n> ДОБРО ПОЖАЛОВАТЬ В CRYPTO LAB v1.1.2_ — ВАШ ГИД В МИРЕ КРИПТОГРАФИИ";
  // Эффекты
  useEffect(() => {
    // Мигающий курсор
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);

    // Глитч-эффект каждые 5-10 секунд
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 200);
    }, 5000 + Math.random() * 5000);

    // Сканирующая линия
    const scanLineInterval = setInterval(() => {
      setScanLinePosition(prev => (prev + 1) % 100);
    }, 50);

    // Случайный шум
    const noiseInterval = setInterval(() => {
      let noise = "";
      for (let i = 0; i < 20; i++) {
        noise += Math.random() > 0.5 ? "1" : "0";
      }
      setRandomNoise(noise);
    }, 300);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(glitchInterval);
      clearInterval(scanLineInterval);
      clearInterval(noiseInterval);
    };
  }, []);

  // Эффект печатающего текста
  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    return () => clearInterval(typingInterval);
  }, []);

  // Бинарный дождь
  useEffect(() => {
    const generateBinaryString = () => {
      let binary = "";
      const lines = 20;
      const charsPerLine = 60;
      
      for (let i = 0; i < lines; i++) {
        for (let j = 0; j < charsPerLine; j++) {
          binary += Math.random() > 0.5 ? "1" : "0";
        }
        binary += "\n";
      }
      return binary;
    };

    const binaryInterval = setInterval(() => {
      setBinaryText(generateBinaryString());
    }, 100);

    return () => clearInterval(binaryInterval);
  }, []);

  // Обработчик кнопки с глюками
  const handleAccessClick = () => {
    setButtonDisabled(true);
    
    // Случайный шанс "глюка"
    if (Math.random() < 0.3) {
      setTimeout(() => {
        setButtonDisabled(false);
      }, 2000);
      return;
    }

    // Эффект получения доступа
    setTimeout(() => {
      setAccessGranted(true);
      setTimeout(() => navigate("/text-cipher"), 1000);
    }, 1000);
  };

  return (
    <Box sx={{ 
      backgroundColor: "#0a0a0a", 
      color: "#00FF00", 
      minHeight: "100vh", 
      p: 4, 
      fontFamily: "'Courier New', monospace",
      position: "relative",
      overflow: "hidden",
      filter: glitchEffect ? "url('#glitch')" : "none"
    }}>
      {/* SVG фильтр для глитч-эффекта */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="glitch" x="0" y="0" width="100%" height="100%">
          <feColorMatrix in="SourceGraphic" mode="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="SourceGraphic" dx="-5" dy="0" result="r1" />
          <feOffset in="SourceGraphic" dx="5" dy="0" result="r2" />
          <feBlend in="r1" in2="r2" mode="screen" result="r" />
        </filter>
      </svg>

      {/* Бинарный дождь */}
      <Box sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        color: "rgba(0, 255, 0, 0.05)",
        whiteSpace: "pre",
        fontSize: "0.7rem",
        lineHeight: "1.1",
        zIndex: 0,
        pointerEvents: "none"
      }}>
        {binaryText}
      </Box>

      {/* Сканирующая линия */}
      <Box sx={{
        position: "absolute",
        top: `${scanLinePosition}%`,
        left: 0,
        right: 0,
        height: "1px",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      {/* Основное содержимое */}
      <Box sx={{ 
        position: "relative",
        zIndex: 2,
        maxWidth: "800px",
        margin: "0 auto",
        pt: 10
      }}>
        {/* Заголовок системы */}
        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: "bold",
            fontSize: "3.5rem",
            color: "#00FF00",
            textShadow: "0 0 15px #00FF00",
            mb: 3,
            letterSpacing: "0.3em",
            position: "relative"
          }}
        >
          CRYPTO LAB
          <Box sx={{
            position: "absolute",
            bottom: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "2px",
            backgroundColor: "#00FF00",
            boxShadow: "0 0 10px #00FF00"
          }} />
        </Typography>

        {/* Терминал ввода */}
        <Box sx={{ 
          backgroundColor: "rgba(0, 20, 0, 0.3)",
          border: "1px solid #00FF00",
          padding: 3,
          mb: 4,
          boxShadow: "0 0 20px rgba(0, 255, 0, 0.2)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px)",
            backgroundSize: "100% 2px",
            animation: "scan 8s linear infinite",
            pointerEvents: "none"
          }
        }}>
          <Typography variant="h6" sx={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>
            {typedText}
            <Box 
              component="span" 
              sx={{ 
                opacity: cursorVisible ? 1 : 0,
                backgroundColor: "#00FF00",
                width: "10px",
                height: "20px",
                display: "inline-block",
                verticalAlign: "bottom",
                ml: 0.5
              }}
            />
          </Typography>
        </Box>

        {/* Статус системы */}
        <Box sx={{ 
          display: "flex",
          justifyContent: "space-between",
          mb: 5,
          "& > *": {
            flex: 1,
            textAlign: "center",
            border: "1px solid rgba(0, 255, 0, 0.3)",
            padding: 2,
            mx: 1
          }
        }}>
          <Box>
            <Typography sx={{ color: "#4CAF50" }}>АЛГОРИТМ</Typography>
            <Typography>AES-256</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: "#4CAF50" }}>СОСТОЯНИЕ</Typography>
            <Typography>{typedText.length > 100 ? "ГОТОВ" : "ОБРАБОТКА..."}</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: "#4CAF50" }}>ЗАЩИТА</Typography>
            <Typography>HIGH</Typography>
          </Box>
        </Box>

        {/* Кнопка доступа */}
        <Box sx={{ 
          textAlign: "center",
          marginTop: 6,
          position: "relative"
        }}>
          <Button
            variant="outlined"
            onClick={handleAccessClick}
            disabled={buttonDisabled}
            sx={{
              color: accessGranted ? "#00FF00" : "#00FF00",
              borderColor: accessGranted ? "#00FF00" : "#00FF00",
              "&:hover": { 
                backgroundColor: "rgba(0, 255, 0, 0.1)",
                borderColor: "#00FF00"
              },
              padding: "12px 40px",
              fontSize: "1.2rem",
              letterSpacing: "0.2em",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "#00FF00",
                transform: buttonDisabled ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 2s linear"
              }
            }}
          >
            {buttonDisabled ? (
              <>
                {randomNoise} ДОСТУП ОТКЛОНЕН {randomNoise}
              </>
            ) : accessGranted ? (
              "ДОСТУП РАЗРЕШЕН ✓"
            ) : (
              "НАЧАТЬ ОБУЧЕНИЕ"
            )}
          </Button>
          
          {/* Анимация разрешения доступа */}
          {accessGranted && (
            <Box sx={{
              position: "absolute",
              top: -20,
              left: 0,
              right: 0,
              height: "2px",
              backgroundColor: "#00FF00",
              boxShadow: "0 0 10px #00FF00",
              animation: "accessGranted 1s forwards"
            }} />
          )}
        </Box>

        {/* Детали системы */}
        <Box sx={{ 
          display: "flex",
          justifyContent: "space-around",
          mt: 8,
          color: "rgba(0, 255, 0, 0.6)",
          fontSize: "0.7rem",
          letterSpacing: "0.1em"
        }}>
          <Typography>ENCRYPTION: AES-256</Typography>
          <Typography>SESSION: {Math.random().toString(36).substring(2, 10).toUpperCase()}</Typography>
          <Typography>IP: 192.168.{Math.floor(Math.random() * 255)}.{Math.floor(Math.random() * 255)}</Typography>
        </Box>

        {/* Предупреждение */}
        <Typography 
          align="center" 
          sx={{ 
            color: "rgba(255, 0, 0, 0.7)", 
            mt: 8,
            fontSize: "0.8rem",
            textShadow: "0 0 5px rgba(255, 0, 0, 0.5)",
            animation: "blink 2s infinite"
          }}
        >
          ВНИМАНИЕ: НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП БУДЕТ ЗАФИКСИРОВАН И ПЕРЕДАН В ОТДЕЛ БЕЗОПАСНОСТИ
        </Typography>
      </Box>

      {/* Глобальные стили анимаций */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes accessGranted {
          0% { width: 0; opacity: 0; }
          50% { width: "100%"; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }
      `}</style>
    </Box>
  );
}