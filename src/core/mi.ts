// Stock Xiaomi firmware: temperature notifications, activation and login.

import { handleError } from "./connection";
import { mainCharSend } from "./gatt";
import { bytesToHex, hex2ascii } from "./hex";
import { do_login_generate, doGenerate, makeSharedKey } from "./miCrypto";
import { session } from "./session";
import { addClog, addLog, setStatus, setUi, updateFail } from "./ui";

function notifiedValue(event: Event): DataView {
  return (event.target as BluetoothRemoteGATTCharacteristic).value!;
}

export function miAction(): void {
  session.gattServer!
    .getPrimaryService("ebe0ccb0-7a0a-4b0c-8a1a-6ff2997da3a6")
    .then((service) => {
      addClog("Found Main service");
      session.ServiceMain = service;
      return session.ServiceMain.getCharacteristic("ebe0ccd8-7a0a-4b0c-8a1a-6ff2997da3a6");
    })
    .then((characteristic) => {
      addClog("Found Write characteristic Speed");
      session.writeCharacteristicSpeed = characteristic;
      return session.ServiceMain!.getCharacteristic("ebe0ccc1-7a0a-4b0c-8a1a-6ff2997da3a6");
    })
    .then((characteristic) => {
      addClog("Found Temp characteristic");
      session.nitifiyCharTemp = characteristic;
      return session.nitifiyCharTemp.startNotifications().then(() => {
        session.nitifiyCharTemp!.addEventListener("characteristicvaluechanged", (event) => {
          var value = notifiedValue(event);
          var sign = value.getUint8(1) & (1 << 7);
          var temp = ((value.getUint8(1) & 0x7f) << 8) | value.getUint8(0);
          if (sign) temp = temp - 32767;
          temp = temp / 100;
          var hum = value.getUint8(2);
          var tempTempString = "Temp/Humi: " + temp + "°C / " + hum + "%";
          setUi({ tempHumi: temp + "°C / " + hum + "%" });
          addClog(tempTempString);
        });
        miAuthorization();
      });
    })
    .catch(handleError);
}

function miAuthorization(): void {
  const s = session;
  s.gattServer!
    .getPrimaryService(0xfe95)
    .then((service) => {
      addClog("Found Main service");
      s.enc_main = service;
      return s.enc_main.getCharacteristic(0x0010);
    })
    .then((characteristic) => {
      addClog("Found enc_10 char");
      s.enc_10 = characteristic;
      return s.enc_main!.getCharacteristic(0x0004);
    })
    .then((characteristic) => {
      addClog("Found enc_04 char");
      return characteristic.readValue();
    })
    .then((fw_version) => {
      s.fw_version_value = hex2ascii(bytesToHex(fw_version.buffer));
      addLog("Fw_version: " + s.fw_version_value);
      return s.enc_main!.getCharacteristic(0x0019);
    })
    .then((characteristic) => {
      addClog("Found enc_19 char");
      s.enc_19 = characteristic;
      s.miConnected = true;
      return s.enc_10!
        .startNotifications()
        .then(() => {
          s.enc_10!.addEventListener("characteristicvaluechanged", (event) => {
            var value = bytesToHex(notifiedValue(event).buffer);
            addClog("Enc_10: " + value);
            if (value == "12000000") {
              addLog("Activation Failed!");
            } else if (value == "11000000") {
              addLog("Activation successfull");
              sendLogin();
            }
            if (value == "23000000") {
              addLog("Login Failed!");
            } else if (value == "21000000") {
              s.is_logged_in = true;
              addLog("Login successfull");
            }
          });
        })
        .then(() => {
          return s.enc_19!.startNotifications().then(() => {
            s.enc_19!.addEventListener("characteristicvaluechanged", (event) => {
              var value = bytesToHex(notifiedValue(event).buffer);
              addClog("Enc_19: " + value);

              if (s.mode_activation == 1) {
                handleActivationMessage(value);
              } else {
                handleLoginMessage(value);
              }
            });
            addLog("Connected");
            if (s.fw_version_value == "2.1.1_0159")
              setStatus("Connected, the current Firmware needs you to supply the Mi Token and Bind key and do a Login to flash the Exploit Firmware!!!", true);
            else setStatus("Connected, you can now Do the Activation to either get the Token or flash a new Firmware");
          });
        });
    })
    .catch(handleError);
}

/** enc_19 notifications while mode_activation == 1 (registering the device). */
function handleActivationMessage(value: string): void {
  const s = session;
  if (value == "000000000100") {
    s.is_activated = false;
    mainCharSend("00000101", s.enc_19);
  } else if (value == "000000000200") {
    s.is_activated = true;
    mainCharSend("00000101", s.enc_19);
  } else if (s.is_activated == true && s.state == 0 && value.substring(0, 4) == "0100") {
    s.device_known_id = value.substring(4);
  } else if (s.is_activated == true && s.state == 0 && value.substring(0, 4) == "0200") {
    s.device_known_id += value.substring(4);
    s.device_new_id = s.device_known_id!.substring(8);
    setUi({ knownId: hex2ascii(s.device_known_id!.substring(10)) });

    mainCharSend("00000100", s.enc_19)
      .then(function () {
        mainCharSend("15000000", s.enc_10)
          .then(function () {
            mainCharSend("000000030400", s.enc_19);
            s.state = 1;
          })
          .catch(function (err) {
            updateFail(err);
          });
      })
      .catch(function (err) {
        updateFail(err);
      });
  } else if (value == "010001000000")
    mainCharSend("00000100", s.enc_19)
      .then(function () {
        mainCharSend("15000000", s.enc_10)
          .then(function () {
            mainCharSend("000000030400", s.enc_19);
            s.state = 1;
          })
          .catch(function (err) {
            updateFail(err);
          });
      })
      .catch(function (err) {
        updateFail(err);
      });
  else if (s.state == 1 && value == "00000101") {
    s.state = 2;
    const own_public_key = s.own_public_key!;
    mainCharSend("0100" + own_public_key.substring(36 * 0 + 2, 36 * 0 + 36 + 2), s.enc_19)
      .then(function () {
        mainCharSend("0200" + own_public_key.substring(36 * 1 + 2, 36 * 1 + 36 + 2), s.enc_19)
          .then(function () {
            mainCharSend("0300" + own_public_key.substring(36 * 2 + 2, 36 * 2 + 36 + 2), s.enc_19)
              .then(function () {
                mainCharSend("0400" + own_public_key.substring(36 * 3 + 2, 36 * 3 + 36 + 2), s.enc_19);
              })
              .catch(function (err) {
                updateFail(err);
              });
          })
          .catch(function (err) {
            updateFail(err);
          });
      })
      .catch(function (err) {
        updateFail(err);
      });
  } else if (value == "000000030400") mainCharSend("00000101", s.enc_19);
  else if (s.state == 2 && value.substring(0, 4) == "0100") {
    s.device_public_key = "04" + value.substring(4);
  } else if (s.state == 2 && value.substring(0, 4) == "0200") {
    s.device_public_key += value.substring(4);
  } else if (s.state == 2 && value.substring(0, 4) == "0300") {
    s.device_public_key += value.substring(4);
  } else if (s.state == 2 && value.substring(0, 4) == "0400") {
    s.device_public_key += value.substring(4);
    mainCharSend("00000100", s.enc_19)
      .then(function () {
        makeSharedKey();
      })
      .catch(function (err) {
        updateFail(err);
      });
  } else if (s.state == 2 && value == "00000101") {
    s.state = 3;
    const mi_write_did = s.mi_write_did!;
    mainCharSend("0100" + mi_write_did.substring(36 * 0, 36 * 0 + 36), s.enc_19)
      .then(function () {
        mainCharSend("0200" + mi_write_did.substring(36 * 1, 36 * 1 + 36), s.enc_19);
      })
      .catch(function (err) {
        updateFail(err);
      });
  } else if (s.state == 3 && value == "00000100") {
    s.state = 0;
    mainCharSend("13000000", s.enc_10);
  } else if (value == "000001050100") {
    addLog("Received Timeout from device");
  } else if (value == "12000000") {
    addLog("Register Failed!");
  } else if (value == "11000000") {
    addLog("Register successfull");
  }
}

/** enc_19 notifications while logging in with an existing token. */
function handleLoginMessage(value: string): void {
  const s = session;
  if (s.state == 0 && value == "00000101") {
    s.state = 1;
    mainCharSend("0100" + s.mi_random_key, s.enc_19);
  } else if (s.state == 1 && value == "0000000d0100") {
    s.state = 2;
    mainCharSend("00000101", s.enc_19);
  } else if (s.state == 2 && value.substring(0, 4) == "0100") {
    s.state = 3;
    s.mi_random_key_recv = value.substring(4);
    do_login_generate();
  } else if (s.state == 3 && value == "0000000c0200") {
    s.state = 4;
    mainCharSend("00000101", s.enc_19);
  } else if (s.state == 4 && value.substring(0, 4) == "0100") {
    s.state = 5;
    s.mi_device_info_recv = value.substring(4);
  } else if (s.state == 5 && value.substring(0, 4) == "0200") {
    s.state = 6;
    s.mi_device_info_recv += value.substring(4);
    if (s.expected_device_infos == s.mi_device_info_recv) addLog("Received device infos are correct");
    else addLog("Received device infos are not correct");
    mainCharSend("00000100", s.enc_19).then(function () {
      mainCharSend("0000000a0200", s.enc_19);
    });
  } else if (s.state == 6 && value == "00000101") {
    s.state = 7;
    const mi_device_info_send = s.mi_device_info_send!;
    mainCharSend("0100" + mi_device_info_send.substring(36 * 0, 36 * 0 + 36), s.enc_19)
      .then(function () {
        mainCharSend("0200" + mi_device_info_send.substring(36 * 1, 36 * 1 + 36), s.enc_19);
      })
      .catch(function (err) {
        updateFail(err);
      });
  }
}

export function sendRegister(): void {
  if (session.miConnected == false) {
    addLog("Not connected");
    return;
  }
  addLog("Activating now, please wait...");
  session.state = 0;
  session.mode_activation = 1;
  doGenerate();
  mainCharSend("a2000000", session.enc_10);
}

export function sendLogin(): void {
  session.mi_random_key = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
  session.state = 0;
  session.mode_activation = 0;
  mainCharSend("24000000", session.enc_10)
    .then(function () {
      mainCharSend("0000000b0100", session.enc_19);
    })
    .catch(function (err) {
      updateFail(err);
    });
}
