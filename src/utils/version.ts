/**
 * Get the current application version
 *
 * In production builds triggered by git tags, this will be the tag version (e.g., "1.0.1")
 * In development, this will be "dev"
 */
export function getAppVersion(): string {
  return __APP_VERSION__;
}
