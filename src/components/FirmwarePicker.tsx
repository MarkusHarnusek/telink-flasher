import { useEffect, useRef, useState } from "react";
import { firmwareFileSelected, startDFU } from "../core/ota";
import { resetFileSelector } from "../core/ui";
import { useUi } from "../hooks/useUi";

export function FirmwarePicker() {
  const { fileResetCount } = useUi();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  // The flasher logic empties the selector on every (re)connect and error.
  useEffect(() => {
    if (input.current) input.current.value = "";
    setFileName("");
  }, [fileResetCount]);

  return (
    <>
      <p className="hint">Please select a .bin file you want to flash to a Telink BLE device.</p>
      <div className="field">
        <label className="field__label" htmlFor="file">
          Select Firmware
        </label>
        <div className="file-picker">
          <input
            ref={input}
            id="file"
            className="visually-hidden"
            type="file"
            accept=".bin"
            onClick={resetFileSelector}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file ? file.name : "");
              firmwareFileSelected(file);
            }}
          />
          <label className="btn" htmlFor="file">
            Choose file
          </label>
          <span className="file-picker__name">{fileName || "No file chosen"}</span>
        </div>
      </div>
      <div className="button-row">
        <button type="button" className="btn btn--primary" onClick={startDFU}>
          Start Flashing
        </button>
      </div>
    </>
  );
}
