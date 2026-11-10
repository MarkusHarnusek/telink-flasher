// Hex / byte helpers, ported 1:1 from the original TelinkFlasher.html.

export function decimalToHex(d: number): string {
  var hex = Number(d).toString(16);
  while (hex.length < 4) {
    hex = "0" + hex;
  }
  return hex;
}

export function decimalToHex00(d: number): string {
  var hex = Number(d).toString(16);
  while (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  for (var bytes: number[] = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return new Uint8Array(bytes);
}

export function bytesToHex(data: ArrayBufferLike | ArrayLike<number>): string {
  return new Uint8Array(data as ArrayBuffer).reduce(function (memo, i) {
    return memo + ("0" + i.toString(16)).slice(-2);
  }, "");
}

export function makeRandomID(length: number): string {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return bytesToHex(new TextEncoder().encode(result));
}

export function crc16_modbus(buffer: Uint8Array): number {
  var crc = 0xffff;
  var odd;
  for (var i = 0; i < buffer.length; i++) {
    crc = crc ^ buffer[i];
    for (var j = 0; j < 8; j++) {
      odd = crc & 0x0001;
      crc = crc >> 1;
      if (odd) {
        crc = crc ^ 0xa001;
      }
    }
  }
  return crc;
}

export function hex2ascii(hexx: string): string {
  var hex = hexx.toString();
  var str = "";
  for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}
