// Everything the flasher logic shows to (or reads from) the user lives here.
// It replaces the document.getElementById(...) reads/writes of the original
// page; the React components subscribe to it.

export interface LogEntry {
  time: string;
  text: string;
}

export interface UiState {
  log: LogEntry[];
  status: string;
  /** Shows the stock firmware 2.1.1_0159 warning underneath the status. */
  stockFirmwareWarning: boolean;
  /** True while a device running the stock Mi firmware is detected. */
  stockFirmwareDetected: boolean;
  /** Empty until the first notification arrives. */
  tempHumi: string;
  /** Empty until an advertisement was read. */
  mac: string;
  knownId: string;
  miToken: string;
  miBindKey: string;
  hideUnknown: boolean;
  namePrefix: string;
  /** Incremented whenever the firmware file input has to be emptied. */
  fileResetCount: number;
}

let state: UiState = {
  log: [],
  status: "waiting for you to connect a device",
  stockFirmwareWarning: false,
  stockFirmwareDetected: false,
  tempHumi: "",
  mac: "",
  knownId: "",
  miToken: "",
  miBindKey: "",
  hideUnknown: false,
  namePrefix: "",
  fileResetCount: 0,
};

const listeners = new Set<() => void>();

export function getUi(): UiState {
  return state;
}

export function setUi(patch: Partial<UiState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeUi(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addLog(logTXT: unknown): void {
  var time = new Date().toLocaleTimeString("de-DE");
  setUi({ log: [...state.log, { time, text: "" + logTXT }] });
}

export function addClog(logTXT: unknown): void {
  console.log(logTXT);
}

export function clearLog(): void {
  setUi({ log: [] });
}

export function setStatus(status: string, stockFirmwareWarning = false): void {
  addClog("Status: " + status);
  setUi({ status, stockFirmwareWarning });
}

export function updateFail(err: unknown): void {
  addLog("Update error: " + err);
  setStatus("Update error: " + err);
}

export function resetFileSelector(): void {
  setUi({ fileResetCount: state.fileResetCount + 1 });
}
