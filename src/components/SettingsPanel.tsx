import { useState } from "react";
import { connect, reConnect } from "../core/connection";
import { sendCustomSetting } from "../core/customSettings";
import { sendLogin, sendRegister } from "../core/mi";
import { setUi } from "../core/ui";
import { useUi } from "../hooks/useUi";
import { Collapsible, CommandRow } from "./controls";
import { FirmwarePicker } from "./FirmwarePicker";
import { SegmentMapper } from "./SegmentMapper";

export function SettingsPanel() {
  const ui = useUi();
  const [command, setCommand] = useState("");

  return (
    <aside className="settings" aria-label="Settings">
      <div className="settings__connect">
        <button type="button" className="btn btn--primary" onClick={connect}>
          Connect
        </button>
        <button type="button" className="btn" onClick={reConnect}>
          Reconnect
        </button>
      </div>

      <section className="settings__common" aria-label="Common settings">
        <CommandRow
          label="Smiley"
          highlightApplied
          commands={[
            { code: "A0", label: "Off" },
            { code: "A1", label: "Happy" },
            { code: "A2", label: "Sad" },
            { code: "AB", label: "Blinking" },
            { code: "A3", label: "Comfort Indicator" },
          ]}
        />
        <CommandRow
          label="Advertising type"
          highlightApplied
          commands={[
            { code: "AE", label: "Custom" },
            { code: "AF", label: "Mi Like" },
          ]}
        />
        <CommandRow
          label="Show battery in LCD"
          highlightApplied
          commands={[
            { code: "B1", label: "Enabled" },
            { code: "B0", label: "Disabled" },
          ]}
        />
        <CommandRow
          label="Advertising interval"
          highlightApplied
          commands={[
            { code: "FE01", label: "10 Seconds" },
            { code: "FE06", label: "1 Minute" },
            { code: "FE1E", label: "5 Minutes" },
            { code: "FE3C", label: "10 Minutes" },
          ]}
        />
      </section>

      <div className="settings__sections">
        <Collapsible title="Device filter">
          <label className="check">
            <input
              type="checkbox"
              id="hideUnknown"
              checked={ui.hideUnknown}
              onChange={(event) => setUi({ hideUnknown: event.target.checked })}
            />
            Hide unknown
          </label>
          <div className="field">
            <label className="field__label" htmlFor="namePrefix">
              BLE device name prefix filter(s)
            </label>
            <input
              type="text"
              id="namePrefix"
              className="input"
              placeholder="LYWSD03,ATC"
              value={ui.namePrefix}
              onChange={(event) => setUi({ namePrefix: event.target.value })}
            />
          </div>
        </Collapsible>

        <Collapsible title="Firmware flashing">
          <FirmwarePicker />
        </Collapsible>

        <Collapsible title="Activation and Mi keys">
          <div className="button-row">
            <button type="button" className="btn" onClick={sendRegister}>
              Do Activation
            </button>
            <button type="button" className="btn" onClick={sendLogin}>
              Do via Login
            </button>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="known_id">
              Device known id
            </label>
            <input
              type="text"
              id="known_id"
              className="input input--mono"
              spellCheck={false}
              value={ui.knownId}
              onChange={(event) => setUi({ knownId: event.target.value })}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="mi_token">
              Mi Token
            </label>
            <input
              type="text"
              id="mi_token"
              className="input input--mono"
              spellCheck={false}
              value={ui.miToken}
              onChange={(event) => setUi({ miToken: event.target.value })}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="mi_bind_key">
              Mi Bind Key
            </label>
            <input
              type="text"
              id="mi_bind_key"
              className="input input--mono"
              spellCheck={false}
              value={ui.miBindKey}
              onChange={(event) => setUi({ miBindKey: event.target.value })}
            />
          </div>
          <p className="hint">
            When doing an activation here the device is needed to be activated in the Mi app again when wanted to use
            there.
          </p>
        </Collapsible>

        <Collapsible title="Temperature unit">
          <CommandRow
            label="Sensor display"
            commands={[
              { code: "CC", label: "In °C" },
              { code: "FF", label: "In °F" },
            ]}
          />
          <CommandRow
            label="Sensor advertising"
            commands={[
              { code: "0C", label: "In °C" },
              { code: "0F", label: "In °F" },
            ]}
          />
        </Collapsible>

        <Collapsible title="Sensor offset">
          <CommandRow
            label="Sensor offset"
            commands={[
              { code: "FA00", label: "Temp 0°C offset" },
              { code: "FB00", label: "Humi 0% offset" },
            ]}
          />
          <p className="hint">
            To set a precise offset use the custom command field with FA+offset for Temp and FB+offset for Humidity,
            convert an int8 to hex.
          </p>
        </Collapsible>

        <Collapsible title="Instant advertising">
          <CommandRow
            label="Sensor instant advertising"
            commands={[
              { code: "FC05", label: "Temp 0,5°C instant alarm" },
              { code: "FD05", label: "Humi 5% instant alarm" },
            ]}
          />
          <p className="hint">
            To set other values use the custom command field with FC+temp alarm or FD+humi alarm with uint8_t values.
            This can be used to get instant advertising if the sensor data changes too fast. Temp divided by 10.
          </p>
        </Collapsible>

        <Collapsible title="Save and reset settings">
          <div className="button-row">
            <button type="button" className="btn" title="Sends DF" onClick={() => sendCustomSetting("DF")}>
              Save current settings in flash
            </button>
            <button type="button" className="btn" title="Sends DE" onClick={() => sendCustomSetting("DE")}>
              Reset settings to default
            </button>
          </div>
        </Collapsible>

        <Collapsible title="Custom command">
          <div className="field">
            <label className="field__label" htmlFor="cmdTXT">
              Send settings to custom firmware
            </label>
            <div className="input-with-button">
              <input
                type="text"
                id="cmdTXT"
                className="input input--mono"
                spellCheck={false}
                value={command}
                onChange={(event) => setCommand(event.target.value)}
              />
              <button type="button" className="btn" onClick={() => sendCustomSetting(command)}>
                Send
              </button>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="LCD segment mapper">
          <SegmentMapper />
        </Collapsible>
      </div>

      <footer className="settings__footer">
        <p>
          Copyright: Aaron Christophel / Atc1441{" "}
          <a href="https://atcnetz.de" target="_blank" rel="noreferrer">
            https://ATCnetz.de
          </a>
        </p>
        <p>
          UI redeveloped by
          <a href="https://github.com/markusharnusek" target="_blank" rel="noreferrer">
            Markus Harnúšek
          </a>
        </p>
      </footer>
    </aside>
  );
}
