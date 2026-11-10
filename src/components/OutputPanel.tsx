import { useEffect, useRef } from "react";
import { clearLog } from "../core/ui";
import { useUi } from "../hooks/useUi";

export function OutputPanel() {
  const ui = useUi();
  const logBox = useRef<HTMLDivElement>(null);
  const followLog = useRef(true);

  // Keep the newest entry in view unless the user scrolled up to read.
  useEffect(() => {
    const box = logBox.current;
    if (box && followLog.current) box.scrollTop = box.scrollHeight;
  }, [ui.log]);

  return (
    <section className="output" aria-label="Output">
      <dl className="readouts">
        <div className="readout readout--wide">
          <dt>Status</dt>
          <dd>
            {ui.status}
            {ui.stockFirmwareWarning && (
              <p className="readout__warning">
                ATTENTION Make sure to flash this{" "}
                <a
                  href="https://github.com/atc1441/ATC_MiThermometer/blob/master/Stock_fw_2.1.1_0159.bin"
                  target="_blank"
                  rel="noreferrer"
                >
                  2.1.1_0159
                </a>{" "}
                firmware before flashing the exploit.
                <br />
                There are different stock firmware versions even with the same numbering!
              </p>
            )}
          </dd>
        </div>
        {ui.stockFirmwareDetected && (
          <div className="readout readout--wide readout--secondary">
            <dt>Temp/Humi</dt>
            <dd className={ui.tempHumi ? "readout__value" : "readout__placeholder"}>
              {ui.tempHumi || "waiting for data"}
            </dd>
          </div>
        )}
      </dl>

      <div className="log">
        <div className="log__header">
          <h2>Log</h2>
          <button type="button" className="btn btn--small" onClick={clearLog}>
            Clear Log
          </button>
        </div>
        <div
          className="log__entries"
          ref={logBox}
          role="log"
          tabIndex={0}
          onScroll={(event) => {
            const box = event.currentTarget;
            followLog.current = box.scrollHeight - box.scrollTop - box.clientHeight < 24;
          }}
        >
          {ui.log.length === 0 ? (
            <p className="log__empty">Nothing logged yet.</p>
          ) : (
            ui.log.map((entry, index) => (
              <div className="log__entry" key={index}>
                <time>{entry.time}</time>
                <span>{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
