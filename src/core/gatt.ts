// Low-level characteristic writes.

import { hexToBytes } from "./hex";
import { session } from "./session";
import { addClog } from "./ui";

export function otaCharSend(data: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    addClog("OTA: " + data);
    session.writeCharacteristic!
      .writeValue(hexToBytes(data))
      .then(function () {
        resolve("ok");
      })
      .catch(function () {
        reject("some error while sending char data");
      });
  });
}

export function mainCharSend(
  data: string,
  characteristic: BluetoothRemoteGATTCharacteristic | null | undefined,
): Promise<string> {
  return new Promise(function (resolve, reject) {
    addClog("Send: " + data);
    characteristic!
      .writeValue(hexToBytes(data))
      .then(function () {
        resolve("ok");
      })
      .catch(function () {
        reject("some error while sending char data");
      });
  });
}
