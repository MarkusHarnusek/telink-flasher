// Shared mutable state of the current BLE session. These were the global
// `var`s at the top of the original script block.

import { makeRandomID } from "./hex";
import { resetFileSelector, setUi } from "./ui";

type Characteristic = BluetoothRemoteGATTCharacteristic;
type Service = BluetoothRemoteGATTService;

export const session = {
  // BLE values
  bluetoothDevice: undefined as BluetoothDevice | undefined,
  gattServer: undefined as BluetoothRemoteGATTServer | null | undefined,
  Theservice: undefined as Service | null | undefined,
  writeCharacteristic: undefined as Characteristic | null | undefined,
  ServiceMain: undefined as Service | undefined,
  writeCharacteristicSpeed: undefined as Characteristic | undefined,
  nitifiyCharTemp: undefined as Characteristic | undefined,
  enc_main: undefined as Service | undefined,
  enc_10: undefined as Characteristic | undefined,
  enc_19: undefined as Characteristic | undefined,

  // Firmware values
  firmwareArray: "",
  startTime: 0,
  blockCount: 0,

  // Connection values
  state: 0,
  connectTrys: 0,

  // Custom firmware
  customEnabled: undefined as boolean | undefined,
  settingsCharacteristics: undefined as Characteristic | undefined,

  // Mi values
  miEnabled: false,
  miConnected: false,
  mode_activation: undefined as number | undefined,
  fw_version_value: "",

  // Login values
  mi_random_key: undefined as string | undefined,
  mi_random_key_recv: undefined as string | undefined,
  mi_device_info_recv: undefined as string | undefined,
  mi_device_info_send: undefined as string | undefined,
  device_known_id: undefined as string | undefined,
  expected_device_infos: undefined as string | undefined,
  is_logged_in: false,

  // Activation values
  keypair: undefined as CryptoKeyPair | undefined,
  is_activated: undefined as boolean | undefined,
  own_public_key: undefined as string | undefined,
  device_public_key: undefined as string | undefined,
  shared_key: undefined as string | undefined,
  mi_write_did: undefined as string | undefined,
  device_new_id: "00626c742e332e31323976" + makeRandomID(6) + "415443",
};

export function resetVariables(): void {
  session.gattServer = null;
  session.Theservice = null;
  session.writeCharacteristic = null;
  session.miConnected = false;
  session.is_logged_in = false;
  setUi({ knownId: "", miToken: "", miBindKey: "", stockFirmwareDetected: false, tempHumi: "" });
  resetFileSelector();
}
