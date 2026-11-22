package cmd

import (
	"goterm/internal/server"
	"os"

	"github.com/spf13/cobra"
)

var (
	port         int
	allowedHosts []string
	newToken     bool
	shell        string
	shellArgs    []string
)

var rootCmd = &cobra.Command{
	Use:          "goterm",
	Short:        "Web-based terminal server",
	Long:         "goterm serves a web-based terminal over WebSocket.",
	SilenceUsage: true,
	RunE: func(cmd *cobra.Command, _ []string) error {
		return server.Serve(&server.ServerOption{
			Port:           port,
			AllowedOrigins: allowedHosts,
			NewToken:       newToken,
			Shell:          shell,
			Args:           shellArgs,
		})
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().IntVar(&port, "port", 8080, "Port to listen on")
	rootCmd.Flags().StringArrayVar(&allowedHosts, "allowed-hosts", []string{}, "Additional hosts allowed to connect (repeatable)")
	rootCmd.Flags().BoolVar(&newToken, "new-token", false, "Generate a new auth token and replace the saved one")
	rootCmd.Flags().StringVar(&shell, "shell", "", "Shell to run in each session (default: auto-detected)")
	rootCmd.Flags().StringArrayVar(&shellArgs, "args", []string{}, "Arguments passed to the shell (repeatable)")
}
