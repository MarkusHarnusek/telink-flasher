// Settings channel of the ATC custom firmware.

import { handleError } from "./connection";
import { mainCharSend } from "./gatt";
import { decimalToHex00 } from "./hex";
import { session } from "./session";
import { addClog, addLog } from "./ui";

export function customAction(): void {
  session.gattServer!
    .getPrimaryService("00001f10-0000-1000-8000-00805f9b34fb")
    .then((service) => {
      addClog("Found custom Main service");
      session.ServiceMain = service;
      return session.ServiceMain.getCharacteristic("00001f1f-0000-1000-8000-00805f9b34fb");
    })
    .then((characteristic) => {
      addClog("Found custom write characteristic");
      session.settingsCharacteristics = characteristic;
    })
    .catch(handleError);
}

/** Resolves to true when the device accepted the write, false otherwise. */
export function sendCustomSetting(data: string): Promise<boolean> {
  return mainCharSend(data, session.settingsCharacteristics)
    .then(function () {
      addLog("Settings " + data + " was send successful");
      return true;
    })
    .catch(function () {
      addLog("Error on sending setting " + data);
      return false;
    });
}

/**
 * LCD segment mapper. `segments[byte][bit]` says whether the checkbox for
 * that bit is ticked; six bytes of eight bits each.
 */
export function sendSegmentBytes(segments: boolean[][]): void {
  var segment_bytes_to_send = "dd";
  for (var byteNr = 0; byteNr < 6; byteNr++) {
    var byte = 0;
    for (var bit = 0; bit < 8; bit++) {
      if (segments[byteNr][bit]) byte += 1 << bit;
    }
    segment_bytes_to_send += decimalToHex00(byte);
  }
  addLog("Sending Segment bytes: " + segment_bytes_to_send);
  sendCustomSetting(segment_bytes_to_send);
}
