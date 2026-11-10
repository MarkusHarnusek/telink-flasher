// Device discovery, connecting, reconnecting and firmware-type detection.

import { customAction } from "./customSettings";
import { miAction } from "./mi";
import { resetVariables, session } from "./session";
import { addClog, addLog, getUi, setStatus, setUi } from "./ui";

export function handleError(error: unknown): void {
  addLog(error);
  resetVariables();
  if (session.connectTrys < 5) {
    session.connectTrys++;
    addLog("Reconnect " + session.connectTrys + " from " + 5);
    doConnect();
  } else {
    addLog("Something went wrong, to many reconnect's");
    session.connectTrys = 0;
  }
}

function onDisconnected(): void {
  addLog("Disconnected.");
}

export function connect(): void {
  var deviceOptions: {
    optionalServices: BluetoothServiceUUID[];
    acceptAllDevices: boolean;
    filters?: BluetoothLEScanFilter[];
  } = {
    optionalServices: [
      "00010203-0405-0607-0809-0a0b0c0d1912",
      "ebe0ccb0-7a0a-4b0c-8a1a-6ff2997da3a6",
      0xfe95,
      0x1f10,
    ],
    acceptAllDevices: true,
  };
  const hideUnknown = getUi().hideUnknown;
  const namePrefix = getUi().namePrefix;
  if (hideUnknown) {
    deviceOptions.acceptAllDevices = false;
    deviceOptions.filters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz"
      .split("")
      .map((x) => ({ namePrefix: x }));
  }
  if (namePrefix) {
    deviceOptions.acceptAllDevices = false;
    deviceOptions.filters = namePrefix.split(",").map((x) => ({ namePrefix: x }));
  }

  console.log(deviceOptions);

  if (session.bluetoothDevice != null) session.bluetoothDevice.gatt!.disconnect();
  resetVariables();
  addLog("Searching for devices");
  session.connectTrys = 0;
  navigator.bluetooth
    .requestDevice(deviceOptions as RequestDeviceOptions)
    .then((device) => {
      session.bluetoothDevice = device;
      catchAdvertisement(device);
      session.bluetoothDevice.addEventListener("gattserverdisconnected", onDisconnected);
      addLog("Connecting to: " + session.bluetoothDevice.name);
      doConnect();
    })
    .catch(handleError);
}

function catchAdvertisement(device: BluetoothDevice): void {
  const abortController = new AbortController();
  device.addEventListener(
    "advertisementreceived",
    (event) => {
      console.log('Received advertisement from "' + device.name + '"...');
      event.serviceData.forEach((valueDataView) => {
        const buffer = new Uint8Array(valueDataView.buffer);
        console.log(buffer, device, event);
        if (device.name == "LYWSD03MMC") {
          console.log("LYWSD03MMC MAC:", buffer[10].toString(16), buffer[9].toString(16), buffer[8].toString(16), buffer[7].toString(16), buffer[6].toString(16), buffer[5].toString(16));
          setUi({
            mac: "LYWSD03MMC MAC: " + buffer[10].toString(16) + buffer[9].toString(16) + buffer[8].toString(16) + buffer[7].toString(16) + buffer[6].toString(16) + buffer[5].toString(16),
          });
        }
        if (device.name!.startsWith("ATC")) {
          console.log("ATC MAC:", buffer[0].toString(16), buffer[1].toString(16), buffer[2].toString(16), buffer[3].toString(16), buffer[4].toString(16), buffer[5].toString(16));
          setUi({
            mac: "ATC MAC: " + buffer[0].toString(16) + buffer[1].toString(16) + buffer[2].toString(16) + buffer[3].toString(16) + buffer[4].toString(16) + buffer[5].toString(16),
          });
        } else {
          console.log("only LYWSD03MMC/ATC supported");
        }
      });
      abortController.abort();
    },
    { once: true },
  );
}

export function doConnect(): void {
  session.bluetoothDevice!.gatt!
    .connect()
    .then((server) => {
      addClog("Found GATT server");
      session.gattServer = server;
      return session.gattServer.getPrimaryService("00010203-0405-0607-0809-0a0b0c0d1912");
    })
    .then((service) => {
      addClog("Found service");
      session.Theservice = service;
      return session.Theservice.getCharacteristic("00010203-0405-0607-0809-0a0b0c0d2b12");
    })
    .then((characteristic) => {
      addClog("Found write characteristic");
      session.writeCharacteristic = characteristic;
      detectMi();
    })
    .catch(handleError);
}

function detectMi(): void {
  session.gattServer!
    .getPrimaryServices()
    .then((services) => {
      session.miEnabled = false;
      session.customEnabled = false;
      for (var i = 0; i < services.length; i++) {
        console.log("Services: " + services[i].uuid);
        if (services[i].uuid == "ebe0ccb0-7a0a-4b0c-8a1a-6ff2997da3a6") session.miEnabled = true;
        if (services[i].uuid == "00001f10-0000-1000-8000-00805f9b34fb") session.customEnabled = true;
      }
      setUi({ stockFirmwareDetected: session.miEnabled });
      if (session.miEnabled) {
        addLog("Detected Mi Thermometer");
        setStatus("Detected Mi Thermometer");
        miAction();
      } else if (session.customEnabled) {
        addLog("Detected custom Firmware");
        setStatus("Detected custom Firmware");
        customAction();
      } else {
        addLog("Connected");
        setStatus("Connected");
      }
    })
    .catch(handleError);
}

export function reConnect(): void {
  if (session.bluetoothDevice != null) session.bluetoothDevice.gatt!.disconnect();
  resetVariables();
  addLog("Reconnect");
  session.connectTrys = 0;
  doConnect();
}
