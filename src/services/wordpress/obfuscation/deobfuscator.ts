/**
 * Runtime deobfuscation for WordPress credentials
 * Reverses the 4-layer obfuscation algorithm applied at build time
 */

import type { ObfuscatedData, ObfuscatedCredentials } from './types';

// Extend globalThis to support storing obfuscated credentials
declare global {
  var __OBFUSCATED_CREDENTIALS__: ObfuscatedCredentials | undefined;
}

/**
 * Layer 4 Reversal: Remove interleaving and padding
 * Extracts the actual data from interleaved string by using XOR with position
 */
function removeInterleaving(interleavedData: string, key: number): string {
  const chars: string[] = [];
  let keyPosition = 0;

  for (let i = 0; i < interleavedData.length; i++) {
    // Use XOR to determine if this character is data or padding
    const xorValue = (key + keyPosition) % 256;
    const charCode = interleavedData.charCodeAt(i) ^ xorValue;

    // Keep characters that look like valid Base64 or JSON
    if (isLikelyDataChar(charCode)) {
      chars.push(interleavedData[i]);
      keyPosition++;
    }
  }

  return chars.join('');
}

/**
 * Check if character code likely represents data (not padding)
 * Valid Base64 chars: A-Z, a-z, 0-9, +, /, =
 * Valid JSON chars: {, }, [, ], ", :, etc.
 */
function isLikelyDataChar(charCode: number): boolean {
  // A-Z (65-90), a-z (97-122), 0-9 (48-57)
  if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || (charCode >= 48 && charCode <= 57)) {
    return true;
  }
  // Base64 special chars: +, /, =
  if (charCode === 43 || charCode === 47 || charCode === 61) {
    return true;
  }
  // JSON chars: {, }, [, ], ", :, comma, space
  if ([123, 125, 91, 93, 34, 58, 44, 32].includes(charCode)) {
    return true;
  }
  return false;
}

/**
 * Layer 3 Reversal: Reverse the string and decode from Base64
 * Undoes the Base64 encoding and string reversal
 */
function reverseLayer3(reversedBase64: string): unknown {
  // Reverse the string
  const base64 = reversedBase64.split('').reverse().join('');

  // Decode Base64
  const jsonString = atob(base64);

  // Parse JSON array of character codes
  return JSON.parse(jsonString);
}

/**
 * Layer 2 Reversal: Unshuffle the array using stored indices
 * Restores original order before shuffling
 */
function unshuffle(shuffledArray: number[][], shuffleIndices: number[]): number[][] {
  const unshuffled: number[][] = [];

  // Place each shuffled chunk back to its original position
  for (let i = 0; i < shuffledArray.length; i++) {
    unshuffled[shuffleIndices[i]] = shuffledArray[i];
  }

  return unshuffled;
}

/**
 * Layer 1 Reversal: XOR decode character codes and reconstruct string
 * Reverses the character code transformation and XOR encoding
 */
function reverseLayer1(encodedChunks: number[][], key: number): string {
  const chunks: string[] = [];

  for (let chunkIdx = 0; chunkIdx < encodedChunks.length; chunkIdx++) {
    const charCodes = encodedChunks[chunkIdx];
    const chunkChars: string[] = [];

    for (let charIdx = 0; charIdx < charCodes.length; charIdx++) {
      // Reverse XOR transformation
      const xorKey = (key + chunkIdx) % 256;
      const originalCode = charCodes[charIdx] ^ xorKey;
      chunkChars.push(String.fromCharCode(originalCode));
    }

    chunks.push(chunkChars.join(''));
  }

  return chunks.join('');
}

/**
 * Main deobfuscation function
 * Reverses all 4 layers of obfuscation to restore original credential
 */
export function deobfuscate(data: ObfuscatedData, key: number): string {
  try {
    // Layer 4 reversal: Remove interleaving
    const deinterleaved = removeInterleaving(data.data, key);

    // Layer 3 reversal: Reverse Base64 decode
    const encodedChunks = reverseLayer3(deinterleaved) as number[][];

    // Layer 2 reversal: Unshuffle
    const unshuffled = unshuffle(encodedChunks, data.shuffleIndices);

    // Layer 1 reversal: XOR decode and reconstruct
    const plaintext = reverseLayer1(unshuffled, key);

    return plaintext;
  } catch (error) {
    console.error('Deobfuscation failed:', error);
    throw new Error('Failed to deobfuscate credentials');
  }
}

/**
 * Load and deobfuscate all WordPress credentials
 * This is called dynamically in production builds
 */
export function getObfuscatedCredentials(): {
  url: string;
  username: string;
  appPassword: string;
} {
  try {
    // For synchronous loading (needed for constructor), we use global scope storage
    // The obfuscated-credentials.ts file stores credentials in globalThis
    const credentials = globalThis.__OBFUSCATED_CREDENTIALS__;

    if (!credentials || !credentials.meta) {
      throw new Error('Obfuscated credentials not available');
    }

    const { url, username, appPassword, meta } = credentials;

    return {
      url: deobfuscate(url, meta.key),
      username: deobfuscate(username, meta.key),
      appPassword: deobfuscate(appPassword, meta.key),
    };
  } catch (error) {
    console.error('Failed to load obfuscated credentials:', error);
    throw error;
  }
}

/**
 * Store obfuscated credentials globally for synchronous access
 * Called from the generated obfuscated-credentials.ts file
 */
export function storeObfuscatedCredentials(credentials: ObfuscatedCredentials): void {
  globalThis.__OBFUSCATED_CREDENTIALS__ = credentials;
}
