// Firmware file handling and the Telink OTA upload.

import { mainCharSend, otaCharSend } from "./gatt";
import { bytesToHex, crc16_modbus, decimalToHex, hexToBytes } from "./hex";
import { session } from "./session";
import { addClog, addLog, setStatus, updateFail } from "./ui";

/** Handles the change event of the firmware file input. */
export function firmwareFileSelected(file: File | null | undefined): void {
  var reader = new FileReader();
  reader.onload = function () {
    session.firmwareArray = bytesToHex(reader.result as ArrayBuffer);
    if (session.firmwareArray.substring(16, 24) != "4b4e4c54") {
      alert("Select file is no telink firmware .bin");
      addLog("Select file is no telink firmware .bin");
      session.blockCount = 0;
      session.firmwareArray = "";
      return;
    }
    addLog("File was selected, size: " + session.firmwareArray.length / 2 + " bytes");

    if (session.firmwareArray.length % 32 !== 0) {
      // pad last block to 16bytes
      var padHex = "ffffffffffffffffffffffffffffffff";
      session.firmwareArray += padHex.substr(0, 32 - (session.firmwareArray.length % 32));
    }
    session.blockCount = session.firmwareArray.length / 32;
    addLog("Count: " + session.blockCount);
  };
  if (file != null) reader.readAsArrayBuffer(file);
  else addLog("No file selected");
}

export function startDFU(): void {
  addLog("Start DFU");
  if (session.miConnected == true && session.is_logged_in == false) {
    addLog("Please do the Activation first");
    return;
  }
  updateBegin();
}

function updateBegin(): void {
  if (session.blockCount <= 0) {
    addLog("No file selected aborting");
    return;
  }

  if (session.miEnabled) mainCharSend("1e0000", session.writeCharacteristicSpeed); // this makes the upload faster

  setTimeout(function () {
    otaCharSend("00ff")
      .then(function () {
        otaCharSend("01ff")
          .then(function () {
            setTimeout(function () {
              session.startTime = new Date().getTime();
              sendOTAblock(0);
            }, 300);
          })
          .catch(function (err) {
            updateFail(err);
          });
      })
      .catch(function (err) {
        updateFail(err);
      });
  }, 500);
}

function sendOTAblock(blockNr: number): void {
  const blockCount = session.blockCount;
  if (blockNr >= blockCount) {
    sendLastOTA();
    return;
  }
  setStatus("Sending block nr: " + blockNr + " from " + blockCount + ", " + Math.floor((blockNr / (blockCount * 1.0)) * 100) + "% done, time since start " + (new Date().getTime() - session.startTime) / 1000.0 + "s");
  var blockNrString = getHexBLockCount(blockNr);
  var blockString = blockNrString + session.firmwareArray.substring(blockNr * 32, blockNr * 32 + 32);
  var blockCRC = getHexCRC(blockString);
  otaCharSend(blockString + blockCRC)
    .then(function () {
      setTimeout(function () {
        if ((blockNr + 1) % 8 == 0) {
          session.writeCharacteristic!
            .readValue()
            .then(function () {
              addClog("reading OTA");
              sendOTAblock(blockNr + 1);
            })
            .catch(function (err) {
              updateFail(err);
            });
        } else {
          sendOTAblock(blockNr + 1);
        }
      }, 0);
    })
    .catch(function (err) {
      updateFail(err);
    });
}

function getHexBLockCount(count: number): string {
  var tempHEX = decimalToHex(count);
  return tempHEX.substring(2, 4) + tempHEX.substring(0, 2);
}

function getHexCRC(data: string): string {
  var tempCRC = decimalToHex(crc16_modbus(hexToBytes(data)));
  return tempCRC.substring(2, 4) + tempCRC.substring(0, 2);
}

function sendLastOTA(): void {
  var data = "02ff" + getHexBLockCount(session.blockCount - 1) + getHexBLockCount(~(session.blockCount - 1) & 0xffff);
  otaCharSend(data)
    .then(function () {
      addLog("Update done after " + (new Date().getTime() - session.startTime) / 1000 + " seconds");
      setStatus("Update done after " + (new Date().getTime() - session.startTime) / 1000 + " seconds");
    })
    .catch(function (err) {
      updateFail(err);
    });
}
