import { useTheme, type ThemeMode } from "../theme/ThemeProvider"

export function HomePage() {
  return (
    <div>
      <p style={{ "font-size": "60px", color: "white" }}>Home</p>
      <a href="terminal" target="_blank">
        terminal
      </a>
      <Settings />
    </div>
  )
}

function Settings() {
  const { seed, setSeed, mode, setMode } = useTheme()
  return (
    <>
      <input type="color" value={seed()} onInput={(e) => setSeed(e.currentTarget.value)} />
      <select value={mode()} onChange={(e) => setMode(e.currentTarget.value as ThemeMode)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </>
  )
}
