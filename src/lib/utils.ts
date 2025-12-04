/**
 * Utility function to conditionally join classNames
 * Simple implementation for combining class strings
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
