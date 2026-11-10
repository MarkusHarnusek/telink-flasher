// Key generation and derivation for the Mi activation / login handshake.

import sjcl from "../vendor/sjcl";
import { mainCharSend } from "./gatt";
import { bytesToHex, hexToBytes } from "./hex";
import { session } from "./session";
import { addLog, getUi, setUi } from "./ui";

export function doGenerate(): void {
  window.crypto.subtle
    .generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      false,
      ["deriveKey", "deriveBits"],
    )
    .then((own_key) => {
      session.keypair = own_key;
      return window.crypto.subtle.exportKey("raw", own_key.publicKey);
    })
    .then((ownPublicKeyExported) => {
      session.own_public_key = bytesToHex(ownPublicKeyExported);
    })
    .catch((err) => {
      addLog(err);
    });
}

export function makeSharedKey(): void {
  window.crypto.subtle
    .importKey(
      "raw",
      hexToBytes(session.device_public_key!),
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      [],
    )
    .then((device_key_imported) => {
      return window.crypto.subtle.deriveBits(
        {
          name: "ECDH",
          namedCurve: "P-256",
          public: device_key_imported,
        } as EcdhKeyDeriveParams,
        session.keypair!.privateKey,
        256,
      );
    })
    .then((sharedSecret) => {
      session.shared_key = bytesToHex(sharedSecret);
      deriveTheKey();
    })
    .catch((err) => {
      addLog(err);
    });
}

function deriveTheKey(): void {
  var derived_key = sjcl.codec.hex.fromBits(sjcl.misc.hkdf(sjcl.codec.hex.toBits(session.shared_key!), 8 * 64, null, "mible-setup-info", sjcl.hash["sha256"]));
  setUi({
    miToken: derived_key.substring(0, 24),
    miBindKey: derived_key.substring(24, 56),
  });
  var mi_bind_A = derived_key.substring(56, 88);
  session.mi_write_did = sjcl.codec.hex.fromBits(sjcl.mode.ccm.encrypt(new sjcl.cipher.aes(sjcl.codec.hex.toBits(mi_bind_A)), sjcl.codec.hex.toBits(session.device_new_id), sjcl.codec.hex.toBits("101112131415161718191A1B"), sjcl.codec.hex.toBits("6465764944"), 32));
  mainCharSend("000000000200", session.enc_19);
}

export function do_login_generate(): void {
  var salt = hexToBytes(session.mi_random_key! + session.mi_random_key_recv!);
  var salt1 = hexToBytes(session.mi_random_key_recv! + session.mi_random_key!);
  var derived_key = sjcl.codec.hex.fromBits(sjcl.misc.hkdf(sjcl.codec.hex.toBits(getUi().miToken), 8 * 64, sjcl.codec.hex.toBits(bytesToHex(salt)), "mible-login-info", sjcl.hash["sha256"]));
  session.expected_device_infos = sjcl.codec.hex.fromBits(new sjcl.misc.hmac(sjcl.codec.hex.toBits(derived_key.substring(0, 32))).mac(sjcl.codec.hex.toBits(bytesToHex(salt1))));
  session.mi_device_info_send = sjcl.codec.hex.fromBits(new sjcl.misc.hmac(sjcl.codec.hex.toBits(derived_key.substring(32, 64))).mac(sjcl.codec.hex.toBits(bytesToHex(salt))));
  mainCharSend("00000100", session.enc_19);
}
