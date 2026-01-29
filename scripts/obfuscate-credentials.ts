/**
 * Build-time script to obfuscate WordPress credentials
 * Reads from environment variables and generates obfuscated-credentials.ts
 * Run this before building: npm run obfuscate:credentials
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ==================== Types ====================

interface ObfuscatedData {
  data: string;
  shuffleIndices: number[];
  chunkSizes: number[];
}

interface ObfuscatedCredentials {
  url: ObfuscatedData;
  username: ObfuscatedData;
  appPassword: ObfuscatedData;
  meta: {
    key: number;
    timestamp: number;
  };
}

// ==================== Key Derivation ====================

/**
 * Derive obfuscation key from package.json version
 * Makes the key deterministic so builds are reproducible
 */
function deriveKey(): number {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const version = pkg.version || '1.0.0';

    // Convert version string to hash
    let hash = 0;
    for (let i = 0; i < version.length; i++) {
      const char = version.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Create deterministic key in range 0-65535
    const key = (Math.abs(hash) * 7919 + 12345) % 65536;
    console.log(`[Obfuscation] Derived key from version "${version}": ${key}`);

    return key;
  } catch (error) {
    console.error('[Obfuscation] Failed to derive key:', error);
    throw error;
  }
}

// ==================== Layer 1: Chunking & XOR ====================

/**
 * Split string into variable-size chunks
 * Sizes vary between 3-7 characters to make pattern less obvious
 */
function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let position = 0;

  while (position < text.length) {
    // Vary chunk size between 3-7 based on position for deterministic variation
    const baseSize = 3 + ((position * 7) % 5);
    const chunkSize = Math.min(baseSize, text.length - position);
    chunks.push(text.substring(position, position + chunkSize));
    position += chunkSize;
  }

  return chunks;
}

/**
 * Convert chunks to character codes and apply XOR encoding
 * Layer 1 encoding: text → chunks → char codes → XOR
 */
function encodeLayer1(plaintext: string, key: number): number[][] {
  const chunks = splitIntoChunks(plaintext);

  return chunks.map((chunk, chunkIdx) => {
    return chunk.split('').map((char) => {
      const charCode = char.charCodeAt(0);
      const xorKey = (key + chunkIdx) % 256;
      return charCode ^ xorKey;
    });
  });
}

// ==================== Layer 2: Shuffling ====================

/**
 * Generate deterministic shuffle indices based on key
 */
function generateShuffleIndices(length: number, key: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);

  // Fisher-Yates shuffle with seeded randomness
  let seed = key;
  for (let i = indices.length - 1; i > 0; i--) {
    // Seeded pseudo-random number generator
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);

    // Swap
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

/**
 * Shuffle array using pre-generated indices
 * Layer 2 encoding: encoded chunks → shuffle
 */
function shuffleArray<T>(array: T[], indices: number[]): T[] {
  return indices.map((idx) => array[idx]);
}

// ==================== Layer 3: Base64 & Reverse ====================

/**
 * Encode to Base64 and reverse the string
 * Layer 3 encoding: shuffled array → JSON string → Base64 → reverse
 */
function encodeLayer3(shuffledArray: number[][]): string {
  // Convert to JSON string
  const jsonString = JSON.stringify(shuffledArray);

  // Encode to Base64
  const base64 = Buffer.from(jsonString).toString('base64');

  // Reverse the string
  const reversed = base64.split('').reverse().join('');

  return reversed;
}

// ==================== Layer 4: Interleaving ====================

/**
 * Interleave data with padding to make it harder to spot patterns
 * Layer 4 encoding: reversed Base64 → interleave with padding
 */
function encodeLayer4(data: string, key: number): string {
  const result: string[] = [];
  let keyPosition = 0;

  for (let i = 0; i < data.length; i++) {
    // Add data character
    result.push(data[i]);

    // Occasionally add padding character
    if ((i + key) % 3 === 0 && i < data.length - 1) {
      // Generate a "padding" character using XOR
      const xorValue = (key + keyPosition) % 256;
      const paddingChar = String.fromCharCode(xorValue % 256);
      result.push(paddingChar);
      keyPosition++;
    }
  }

  return result.join('');
}

// ==================== Full Obfuscation Pipeline ====================

/**
 * Obfuscate a single credential value through all 4 layers
 */
function obfuscate(plaintext: string, key: number): ObfuscatedData {
  try {
    // Layer 1: Chunk and XOR encode
    const chunks = splitIntoChunks(plaintext);
    const chunkSizes = chunks.map((c) => c.length);
    const encodedLayer1 = encodeLayer1(plaintext, key);

    // Layer 2: Shuffle
    const shuffleIndices = generateShuffleIndices(encodedLayer1.length, key);
    const shuffledLayer2 = shuffleArray(encodedLayer1, shuffleIndices);

    // Layer 3: Base64 encode and reverse
    const reversedLayer3 = encodeLayer3(shuffledLayer2);

    // Layer 4: Interleave with padding
    const interleavedLayer4 = encodeLayer4(reversedLayer3, key);

    return {
      data: interleavedLayer4,
      shuffleIndices,
      chunkSizes,
    };
  } catch (error) {
    console.error('[Obfuscation] Failed to obfuscate value:', error);
    throw error;
  }
}

// ==================== .env File Loading ====================

/**
 * Parse .env file and return key-value pairs
 * Simple parser for basic .env format (KEY=VALUE)
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.trim().startsWith('#')) continue;

    const trimmed = line.trim();
    const eqIndex = trimmed.indexOf('=');

    if (eqIndex === -1) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

/**
 * Load .env file if it exists
 * Tries .env.local first (preferred for local development), then .env
 */
function loadEnvFile(): void {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envPath = join(process.cwd(), '.env');

  try {
    // Try to load .env.local first
    if (existsSync(envLocalPath)) {
      const content = readFileSync(envLocalPath, 'utf-8');
      const envVars = parseEnvFile(content);
      // Merge into process.env (don't override existing)
      for (const [key, value] of Object.entries(envVars)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      console.log('[Obfuscation] Loaded environment variables from .env.local');
      return;
    }

    // Fall back to .env
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      const envVars = parseEnvFile(content);
      // Merge into process.env (don't override existing)
      for (const [key, value] of Object.entries(envVars)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      console.log('[Obfuscation] Loaded environment variables from .env');
    }
  } catch (error) {
    console.warn('[Obfuscation] Could not load .env file:', error);
  }
}

// ==================== Credential Loading ====================

/**
 * Load credentials from environment variables or .env file
 */
function loadCredentials(): {
  url: string;
  username: string;
  appPassword: string;
} {
  // Try to load from .env files first
  loadEnvFile();

  const url = process.env.VITE_WP_URL;
  const username = process.env.VITE_WP_USERNAME;
  const appPassword = process.env.VITE_WP_APP_PASSWORD;

  if (!url || !username || !appPassword) {
    throw new Error('Missing WordPress credentials. Please ensure VITE_WP_URL, VITE_WP_USERNAME, and VITE_WP_APP_PASSWORD are set in .env.local, .env, or as environment variables.');
  }

  return { url, username, appPassword };
}

// ==================== File Generation ====================

/**
 * Generate TypeScript file with obfuscated credentials
 */
function generateCredentialsFile(
  credentials: ObfuscatedCredentials,
  outputPath: string
): void {
  const code = `/**
 * GENERATED FILE - DO NOT EDIT
 * This file is auto-generated by scripts/obfuscate-credentials.ts
 * It contains obfuscated WordPress credentials for production builds
 */

import { storeObfuscatedCredentials } from './deobfuscator.js';
import type { ObfuscatedCredentials } from './types.js';

// Obfuscated credentials data
const credentials: ObfuscatedCredentials = ${JSON.stringify(credentials, null, 2)};

// Store credentials in global scope for synchronous access
storeObfuscatedCredentials(credentials);

// Export for optional async access
export const obfuscatedCredentials = credentials;
`;

  writeFileSync(outputPath, code, 'utf-8');
  console.log(`[Obfuscation] Generated: ${outputPath}`);
}

// ==================== Main ====================

/**
 * Main entry point
 */
async function main() {
  try {
    console.log('[Obfuscation] Starting credential obfuscation...\n');

    // Derive obfuscation key
    const key = deriveKey();

    // Load credentials from environment
    const credentials = loadCredentials();
    console.log('[Obfuscation] Loaded credentials from environment variables');

    // Obfuscate each credential
    console.log('[Obfuscation] Obfuscating credentials...');
    const obfuscatedCredentials: ObfuscatedCredentials = {
      url: obfuscate(credentials.url, key),
      username: obfuscate(credentials.username, key),
      appPassword: obfuscate(credentials.appPassword, key),
      meta: {
        key,
        timestamp: Date.now(),
      },
    };

    // Create output directory if it doesn't exist
    const outputDir = join(
      process.cwd(),
      'src/services/wordpress/obfuscation'
    );
    mkdirSync(outputDir, { recursive: true });

    // Generate output file
    const outputPath = join(outputDir, 'obfuscated-credentials.ts');
    generateCredentialsFile(obfuscatedCredentials, outputPath);

    console.log('[Obfuscation] ✅ Credentials successfully obfuscated!');
    console.log('[Obfuscation] ℹ️  Remember to add to .gitignore:');
    console.log('[Obfuscation]    src/services/wordpress/obfuscation/obfuscated-credentials.ts\n');
  } catch (error) {
    console.error('[Obfuscation] ❌ Failed:', error);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('[Obfuscation] Fatal error:', error);
  process.exit(1);
});
