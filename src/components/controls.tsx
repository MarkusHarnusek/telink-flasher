import { useState, type ReactNode } from "react";
import { sendCustomSetting } from "../core/customSettings";

/** A collapsed-by-default section. Content stays mounted while closed. */
export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="collapsible">
      <summary>{title}</summary>
      <div className="collapsible__body">{children}</div>
    </details>
  );
}

export interface Command {
  /** Hex command sent to the custom firmware. */
  code: string;
  label: string;
}

/**
 * A labelled row of buttons that each send one custom firmware command.
 * With `highlightApplied`, the option that was last sent successfully stays
 * highlighted.
 */
export function CommandRow({
  label,
  commands,
  highlightApplied = false,
}: {
  label: string;
  commands: Command[];
  highlightApplied?: boolean;
}) {
  const [applied, setApplied] = useState<string | null>(null);

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="button-row">
        {commands.map((command) => (
          <button
            key={command.code}
            type="button"
            className={highlightApplied && applied === command.code ? "btn btn--applied" : "btn"}
            aria-pressed={highlightApplied ? applied === command.code : undefined}
            title={"Sends " + command.code}
            onClick={() => {
              sendCustomSetting(command.code).then((ok) => {
                if (ok) setApplied(command.code);
              });
            }}
          >
            {command.label}
          </button>
        ))}
      </div>
    </div>
  );
}
