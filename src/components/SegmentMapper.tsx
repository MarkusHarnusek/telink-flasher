import { useState } from "react";
import { sendSegmentBytes } from "../core/customSettings";

const BYTES = [0, 1, 2, 3, 4, 5];
const BITS = [0, 1, 2, 3, 4, 5, 6, 7];

export function SegmentMapper() {
  const [segments, setSegments] = useState<boolean[][]>(() => BYTES.map(() => BITS.map(() => false)));

  function toggle(byteNr: number, bit: number, checked: boolean) {
    setSegments((current) =>
      current.map((row, rowNr) => (rowNr === byteNr ? row.map((value, nr) => (nr === bit ? checked : value)) : row)),
    );
  }

  return (
    <>
      <div className="mapper">
        {BYTES.map((byteNr) => (
          <div className="mapper__row" key={byteNr}>
            <span className="mapper__byte">Byte{byteNr}</span>
            {BITS.map((bit) => (
              <label className="mapper__bit" key={bit}>
                <input
                  type="checkbox"
                  checked={segments[byteNr][bit]}
                  onChange={(event) => toggle(byteNr, bit, event.target.checked)}
                />
                {bit}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="button-row">
        <button type="button" className="btn" onClick={() => sendSegmentBytes(segments)}>
          Send bytes
        </button>
      </div>
    </>
  );
}
