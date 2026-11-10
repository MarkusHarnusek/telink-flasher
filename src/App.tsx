import { OutputPanel } from "./components/OutputPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ThemeSwitch } from "./components/ThemeSwitch";

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Telink Flasher</h1>
          <p>for Mi Thermostat</p>
        </div>
        <ThemeSwitch />
      </header>
      {!("bluetooth" in navigator) && (
        <p className="notice" role="alert">
          This browser has no Web Bluetooth support, so connecting will not work. Use Chrome or Edge over HTTPS or
          localhost.
        </p>
      )}
      <main className="workspace">
        <SettingsPanel />
        <OutputPanel />
      </main>
    </div>
  );
}
