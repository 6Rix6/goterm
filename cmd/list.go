package cmd

import (
	"encoding/json"
	"fmt"
	"goterm/internal/server"
	"goterm/internal/session"
	"net/http"
	"os"

	"github.com/jedib0t/go-pretty/v6/table"
	"github.com/spf13/cobra"
)

var (
	listPort  int
	listToken string
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List sessions of the running goterm server",
	RunE: func(cmd *cobra.Command, args []string) error {
		token := listToken
		if token == "" {
			var err error
			token, err = server.LoadToken()
			if err != nil {
				return fmt.Errorf("Cannot read token (you can specify it with --token): %w", err)
			}
		}

		url := fmt.Sprintf("http://127.0.0.1:%d/api/sessions", listPort)
		req, err := http.NewRequest(http.MethodGet, url, nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return fmt.Errorf("Failed to connect goterm server: %w", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("Got unexpected status: %s", resp.Status)
		}

		var res struct {
			Sessions []session.SessionInfo `json:"sessions"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
			return err
		}

		t := table.NewWriter()
		t.SetOutputMirror(os.Stdout)
		t.AppendHeader(table.Row{"ID", "TITLE", "PINNED", "ATTACHED", "CREATED"})
		for _, s := range res.Sessions {
			t.AppendRow(table.Row{s.ID, s.Title, s.Pinned, s.Attached, s.CreatedAt.Format("01-02 15:04")})
			t.AppendSeparator()
		}
		t.Render()

		return nil
	},
}

func init() {
	listCmd.Flags().IntVar(&listPort, "port", 8080, "Port of the server")
	listCmd.Flags().StringVar(&listToken, "token", "", "Auth token (default: use the token saved in the token file)")
	rootCmd.AddCommand(listCmd)
}
