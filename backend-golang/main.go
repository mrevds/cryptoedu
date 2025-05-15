package main

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const (
	EncryptedDir = "./encrypted"
	ServerPort   = ":8080"
	AESKeySize   = 32
	MaxFileSize  = 10 << 20
	ReadTimeout  = 10 * time.Second
	WriteTimeout = 10 * time.Second
)

type (
	FileEncryptResponse struct {
		EncryptedFilename string `json:"encrypted_filename"`
		Key               string `json:"key"`
		Timestamp         int64  `json:"timestamp"`
	}

	FileDecryptRequest struct {
		Filename string `json:"filename"`
		Key      string `json:"key"`
	}

	TextEncryptRequest struct {
		Text string `json:"text"`
		Mode string `json:"mode"`
	}

	TextEncryptResponse struct {
		Ciphertext string `json:"ciphertext"`
		Key        string `json:"key"`
		Mode       string `json:"mode"`
		Timestamp  int64  `json:"timestamp"`
	}

	TextDecryptRequest struct {
		Ciphertext string `json:"ciphertext"`
		Key        string `json:"key"`
		Mode       string `json:"mode"`
	}

	TextDecryptResponse struct {
		Plaintext string `json:"plaintext"`
		Timestamp int64  `json:"timestamp"`
	}

	BruteForceRequest struct {
		Ciphertext   string `json:"ciphertext"`
		KnownKeyPart string `json:"known_key_part"`
		Mode         string `json:"mode"`
	}

	BruteForceResponse struct {
		Plaintext string `json:"plaintext,omitempty"`
		Key       string `json:"key,omitempty"`
		Error     string `json:"error,omitempty"`
		TimeTaken string `json:"time_taken,omitempty"`
	}
)

func init() {
	if err := os.MkdirAll(EncryptedDir, 0750); err != nil {
		log.Fatalf("Failed to create encrypted directory: %v", err)
	}
}

func prettyJSON(v interface{}) ([]byte, error) {
	return json.MarshalIndent(v, "", "  ")
}

func sendJSON(w http.ResponseWriter, statusCode int, v interface{}) {
	jsonData, err := prettyJSON(v)
	if err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	w.Write(jsonData)
}

func validateMode(mode string) bool {
	return mode == "ecb" || mode == "gcm"
}

func encryptFile(fileBytes []byte) (string, string, error) {
	key := make([]byte, AESKeySize)
	if _, err := rand.Read(key); err != nil {
		return "", "", fmt.Errorf("key generation failed: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", "", fmt.Errorf("cipher creation failed: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", "", fmt.Errorf("GCM mode failed: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", "", fmt.Errorf("nonce generation failed: %w", err)
	}

	encrypted := gcm.Seal(nonce, nonce, fileBytes, nil)
	encryptedFilename := fmt.Sprintf("%x.enc", encrypted[:8])
	encryptedPath := filepath.Join(EncryptedDir, encryptedFilename)

	if err := os.WriteFile(encryptedPath, encrypted, 0640); err != nil {
		return "", "", fmt.Errorf("file write failed: %w", err)
	}

	return encryptedFilename, base64.StdEncoding.EncodeToString(key), nil
}

func decryptFile(filename, keyBase64 string) ([]byte, error) {
	encryptedPath := filepath.Join(EncryptedDir, filename)
	encrypted, err := os.ReadFile(encryptedPath)
	if err != nil {
		return nil, fmt.Errorf("file read failed: %w", err)
	}

	key, err := base64.StdEncoding.DecodeString(keyBase64)
	if err != nil {
		return nil, fmt.Errorf("key decode failed: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("cipher creation failed: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("GCM mode failed: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(encrypted) < nonceSize {
		return nil, errors.New("invalid encrypted file size")
	}

	nonce, encrypted := encrypted[:nonceSize], encrypted[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, encrypted, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption failed: %w", err)
	}

	return plaintext, nil
}

func padPKCS7(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	return append(data, bytes.Repeat([]byte{byte(padding)}, padding)...)
}

func unpadPKCS7(data []byte) ([]byte, error) {
	if len(data) == 0 {
		return nil, errors.New("empty input")
	}
	padding := int(data[len(data)-1])
	if padding > len(data) {
		return nil, errors.New("invalid padding")
	}
	return data[:len(data)-padding], nil
}

func encryptTextECB(plaintext string) (string, string, error) {
	key := make([]byte, AESKeySize)
	if _, err := rand.Read(key); err != nil {
		return "", "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", "", err
	}

	padded := padPKCS7([]byte(plaintext), aes.BlockSize)
	ciphertext := make([]byte, len(padded))

	for bs, be := 0, block.BlockSize(); bs < len(padded); bs, be = bs+block.BlockSize(), be+block.BlockSize() {
		block.Encrypt(ciphertext[bs:be], padded[bs:be])
	}

	return base64.StdEncoding.EncodeToString(ciphertext), base64.StdEncoding.EncodeToString(key), nil
}

func decryptTextECB(ciphertext, keyBase64 string) (string, error) {
	key, err := base64.StdEncoding.DecodeString(keyBase64)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	ct, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	if len(ct)%aes.BlockSize != 0 {
		return "", errors.New("ciphertext is not a multiple of block size")
	}

	plaintext := make([]byte, len(ct))
	for bs, be := 0, block.BlockSize(); bs < len(ct); bs, be = bs+block.BlockSize(), be+block.BlockSize() {
		block.Decrypt(plaintext[bs:be], ct[bs:be])
	}

	unpadded, err := unpadPKCS7(plaintext)
	if err != nil {
		return "", err
	}

	return string(unpadded), nil
}

func encryptTextGCM(plaintext string) (string, string, error) {
	key := make([]byte, AESKeySize)
	if _, err := rand.Read(key); err != nil {
		return "", "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), base64.StdEncoding.EncodeToString(key), nil
}

func decryptTextGCM(ciphertext, keyBase64 string) (string, error) {
	key, err := base64.StdEncoding.DecodeString(keyBase64)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	ct, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	if len(ct) < gcm.NonceSize() {
		return "", errors.New("ciphertext too short")
	}

	nonce, ct := ct[:gcm.NonceSize()], ct[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func bruteForceECB(ciphertext string, knownKeyPartBase64 string) (string, string) {
	knownKeyPart, err := base64.StdEncoding.DecodeString(knownKeyPartBase64)
	if err != nil {
		return "", ""
	}

	missingBytes := AESKeySize - len(knownKeyPart)
	if missingBytes <= 0 || missingBytes > 4 { // Ограничиваем 4 байтами для производительности
		return "", ""
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resultChan := make(chan struct {
		plaintext string
		key       string
	}, 1)

	go func() {
		defer cancel()

		switch missingBytes {
		case 1:
			for b := 0; b < 256; b++ {
				select {
				case <-ctx.Done():
					return
				default:
					key := append(knownKeyPart, byte(b))
					plain, err := decryptTextECB(ciphertext, base64.StdEncoding.EncodeToString(key))
					if err == nil && isMeaningfulText(plain) {
						resultChan <- struct {
							plaintext string
							key       string
						}{plain, base64.StdEncoding.EncodeToString(key)}
						return
					}
				}
			}

		case 2:
			for b1 := 0; b1 < 256; b1++ {
				for b2 := 0; b2 < 256; b2++ {
					select {
					case <-ctx.Done():
						return
					default:
						key := append(knownKeyPart, byte(b1), byte(b2))
						plain, err := decryptTextECB(ciphertext, base64.StdEncoding.EncodeToString(key))
						if err == nil && isMeaningfulText(plain) {
							resultChan <- struct {
								plaintext string
								key       string
							}{plain, base64.StdEncoding.EncodeToString(key)}
							return
						}
					}
				}
			}

		case 3:
			for b1 := 0; b1 < 32; b1++ {
				for b2 := 0; b2 < 32; b2++ {
					for b3 := 0; b3 < 32; b3++ {
						select {
						case <-ctx.Done():
							return
						default:
							key := append(knownKeyPart, byte(b1), byte(b2), byte(b3))
							plain, err := decryptTextECB(ciphertext, base64.StdEncoding.EncodeToString(key))
							if err == nil && isMeaningfulText(plain) {
								resultChan <- struct {
									plaintext string
									key       string
								}{plain, base64.StdEncoding.EncodeToString(key)}
								return
							}
						}
					}
				}
			}

		case 4:
			for b1 := 0; b1 < 16; b1++ {
				for b2 := 0; b2 < 16; b2++ {
					for b3 := 0; b3 < 16; b3++ {
						for b4 := 0; b4 < 16; b4++ {
							select {
							case <-ctx.Done():
								return
							default:
								key := append(knownKeyPart, byte(b1), byte(b2), byte(b3), byte(b4))
								plain, err := decryptTextECB(ciphertext, base64.StdEncoding.EncodeToString(key))
								if err == nil && isMeaningfulText(plain) {
									resultChan <- struct {
										plaintext string
										key       string
									}{plain, base64.StdEncoding.EncodeToString(key)}
									return
								}
							}
						}
					}
				}
			}
		}
	}()

	select {
	case <-ctx.Done():
		return "", ""
	case res := <-resultChan:
		return res.plaintext, res.key
	}
}

// func isPrintable(s string) bool {
// 	for _, r := range s {
// 		if r < 32 || r > 126 {
// 			return false
// 		}
// 	}
// 	return true
// }

func isMeaningfulText(text string) bool {
	if len(text) < 5 {
		return false
	}

	letterCount := 0
	spaceCount := 0
	for _, r := range text {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
			letterCount++
		} else if r == ' ' {
			spaceCount++
		} else if r < 32 || r > 126 {
			return false
		}
	}

	return letterCount > len(text)/2 && spaceCount >= 1
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	if err := r.ParseMultipartForm(MaxFileSize); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "File too large"})
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read file"})
		return
	}

	encryptedFilename, key, err := encryptFile(fileBytes)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]string{"error": "Encryption failed"})
		return
	}

	sendJSON(w, http.StatusOK, FileEncryptResponse{
		EncryptedFilename: encryptedFilename,
		Key:               key,
		Timestamp:         time.Now().Unix(),
	})
}

func handleFileDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req FileDecryptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}

	decrypted, err := decryptFile(req.Filename, req.Key)
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Decryption failed: " + err.Error()})
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename=decrypted_file")
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Write(decrypted)
}

func handleTextEncrypt(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req TextEncryptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}

	if !validateMode(req.Mode) {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid mode"})
		return
	}

	var ciphertext, key string
	var err error

	switch req.Mode {
	case "ecb":
		ciphertext, key, err = encryptTextECB(req.Text)
	case "gcm":
		ciphertext, key, err = encryptTextGCM(req.Text)
	}

	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]string{"error": "Encryption failed"})
		return
	}

	sendJSON(w, http.StatusOK, TextEncryptResponse{
		Ciphertext: ciphertext,
		Key:        key,
		Mode:       req.Mode,
		Timestamp:  time.Now().Unix(),
	})
}

func handleTextDecrypt(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req TextDecryptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}

	if !validateMode(req.Mode) {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid mode"})
		return
	}

	var plaintext string
	var err error

	switch req.Mode {
	case "ecb":
		plaintext, err = decryptTextECB(req.Ciphertext, req.Key)
	case "gcm":
		plaintext, err = decryptTextGCM(req.Ciphertext, req.Key)
	}

	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]string{"error": "Decryption failed: " + err.Error()})
		return
	}

	sendJSON(w, http.StatusOK, TextDecryptResponse{
		Plaintext: plaintext,
		Timestamp: time.Now().Unix(),
	})
}

func handleBruteForce(w http.ResponseWriter, r *http.Request) {
	var req BruteForceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, BruteForceResponse{Error: "Invalid request"})
		return
	}

	if _, err := base64.StdEncoding.DecodeString(req.KnownKeyPart); err != nil {
		sendJSON(w, http.StatusBadRequest, BruteForceResponse{Error: "Invalid known key part encoding"})
		return
	}

	startTime := time.Now()
	plain, key := bruteForceECB(req.Ciphertext, req.KnownKeyPart)
	timeTaken := time.Since(startTime).String()

	if plain == "" {
		sendJSON(w, http.StatusOK, BruteForceResponse{
			Error:     "Brute force failed",
			TimeTaken: timeTaken,
		})
		return
	}

	sendJSON(w, http.StatusOK, BruteForceResponse{
		Plaintext: plain,
		Key:       key,
		TimeTaken: timeTaken,
	})
}

// Добавляем новый тип для ответа
type FileListResponse struct {
	Files []string `json:"files"`
}

// Новый хендлер для списка файлов
func handleFileList(w http.ResponseWriter, r *http.Request) {
	files, err := os.ReadDir(EncryptedDir)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read directory"})
		return
	}

	var filenames []string
	for _, file := range files {
		if !file.IsDir() {
			filenames = append(filenames, file.Name())
		}
	}

	sendJSON(w, http.StatusOK, FileListResponse{Files: filenames})
}
func handleEncryptedDownload(w http.ResponseWriter, r *http.Request) {
	filename := r.URL.Query().Get("filename")
	if filename == "" {
		http.Error(w, "Имя файла не указано", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(EncryptedDir, filename)
	file, err := os.Open(filePath)
	if err != nil {
		http.Error(w, "Файл не найден", http.StatusNotFound)
		return
	}
	defer file.Close()

	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	w.Header().Set("Content-Type", "application/octet-stream")

	if _, err := io.Copy(w, file); err != nil {
		http.Error(w, "Ошибка при передаче файла", http.StatusInternalServerError)
	}
}

func main() {
	server := &http.Server{
		Addr:         ServerPort,
		ReadTimeout:  ReadTimeout,
		WriteTimeout: WriteTimeout,
	}

	// Настройка CORS middleware
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Разрешаем запросы с любого origin (в продакшене укажите конкретные домены)
			w.Header().Set("Access-Control-Allow-Origin", "*")

			// Разрешаем методы
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

			// Разрешаем заголовки
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// Для предварительных OPTIONS-запросов
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}

	// Применяем CORS ко всем обработчикам
	http.HandleFunc("/file/upload", corsHandler(handleFileUpload))
	http.HandleFunc("/file/download", corsHandler(handleFileDownload))
	http.HandleFunc("/text/encrypt", corsHandler(handleTextEncrypt))
	http.HandleFunc("/text/decrypt", corsHandler(handleTextDecrypt))
	http.HandleFunc("/bruteforce", corsHandler(handleBruteForce))
	http.HandleFunc("/files/list", corsHandler(handleFileList))
	http.HandleFunc("/file/encrypted", corsHandler(handleEncryptedDownload))

	log.Printf("Server started on %s", ServerPort)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
