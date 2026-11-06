/*
Copyright © 2026 6Rix6
*/
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
	args         []string
)

var rootCmd = &cobra.Command{
	Use:   "goterm",
	Short: "A brief description of your application",
	RunE: func(cmd *cobra.Command, args []string) error {
		return server.Serve(&server.ServerOption{
			Port:           port,
			AllowedOrigins: allowedHosts,
			NewToken:       newToken,
			Shell:          shell,
			Args:           args,
		})
	},
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().IntVar(&port, "port", 8080, "Port to listen on")
	rootCmd.Flags().StringArrayVar(&allowedHosts, "allowed-hosts", []string{}, "Allowed hosts")
	rootCmd.Flags().BoolVar(&newToken, "new-token", false, "Generate new token")
	rootCmd.Flags().StringVar(&shell, "shell", "", "Shell")
	rootCmd.Flags().StringArrayVar(&args, "args", []string{}, "Shell args")
}
