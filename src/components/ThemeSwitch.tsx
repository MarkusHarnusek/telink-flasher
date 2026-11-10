import { useTheme } from "../hooks/useTheme";

export function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";

  return (
    <label className="theme-switch">
      <span className={dark ? "theme-switch__label" : "theme-switch__label is-active"}>Light</span>
      <input
        type="checkbox"
        role="switch"
        aria-label="Dark mode"
        checked={dark}
        onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
      />
      <span className="theme-switch__track" aria-hidden="true">
        <span className="theme-switch__thumb" />
      </span>
      <span className={dark ? "theme-switch__label is-active" : "theme-switch__label"}>Dark</span>
    </label>
  );
}
