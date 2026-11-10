// Minimal typings for the parts of the Stanford Javascript Crypto Library
// (vendored unchanged from the original core.js) that the flasher uses.
type BitArray = number[];

declare const sjcl: {
  codec: {
    hex: {
      fromBits(bits: BitArray): string;
      toBits(hex: string): BitArray;
    };
  };
  hash: Record<string, unknown>;
  cipher: {
    aes: new (key: BitArray) => unknown;
  };
  mode: {
    ccm: {
      encrypt(prf: unknown, plaintext: BitArray, iv: BitArray, adata?: BitArray, tlen?: number): BitArray;
    };
  };
  misc: {
    hkdf(ikm: BitArray, keyBitLength: number, salt: BitArray | null, info: string, Hash?: unknown): BitArray;
    hmac: new (key: BitArray, Hash?: unknown) => { mac(data: BitArray): BitArray };
  };
};

export default sjcl;
