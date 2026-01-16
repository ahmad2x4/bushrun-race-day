/**
 * Types for credential obfuscation system
 */

/**
 * Data structure for a single obfuscated credential
 * Contains all information needed to deobfuscate the value
 */
export interface ObfuscatedData {
  /** Interleaved obfuscated string with padding */
  data: string;
  /** Indices used to unshuffle the character code arrays */
  shuffleIndices: number[];
  /** Original chunk sizes for reconstructing chunks */
  chunkSizes: number[];
}

/**
 * Complete obfuscated credentials set
 */
export interface ObfuscatedCredentials {
  /** Obfuscated WordPress URL */
  url: ObfuscatedData;
  /** Obfuscated username/email */
  username: ObfuscatedData;
  /** Obfuscated application password */
  appPassword: ObfuscatedData;
  /** Metadata for deobfuscation */
  meta: {
    /** Obfuscation key derived from package version */
    key: number;
    /** Timestamp when credentials were obfuscated */
    timestamp: number;
  };
}
