package server

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func LoadToken() (string, error) {
	return getOrCreateToken(false)
}

func getOrCreateToken(refresh bool) (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}

	dir := filepath.Join(home, ".config", "goterm")
	filePath := filepath.Join(dir, "token")

	if !refresh {
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			if info.Size() > 0 {
				content, err := os.ReadFile(filePath)
				if err != nil {
					return "", fmt.Errorf("failed to read token file: %w", err)
				}
				return string(content), nil
			}
		}
	}

	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	bytes := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	token := hex.EncodeToString(bytes)

	if err := os.WriteFile(filePath, []byte(token), 0600); err != nil {
		return "", fmt.Errorf("failed to write token file: %w", err)
	}

	return token, nil
}

func compareTokens(one string, another string) bool {
	oneHash := sha256.Sum256([]byte(one))
	anotherHash := sha256.Sum256([]byte(another))

	return subtle.ConstantTimeCompare(oneHash[:], anotherHash[:]) == 1
}
