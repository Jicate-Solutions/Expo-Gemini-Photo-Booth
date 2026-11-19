/**
 * Marathon outfit choices, shared by the runner details form (browser) and the poster prompt (server).
 * Keep this file free of server-only imports (fs, sharp) so the form can use it.
 */

/**
 * T-shirt colours the runner can pick.
 * Orange/yellow are left out on purpose: they'd blend into the orange "DRUG-FREE LIFE" ribbon.
 * White/very light colours are left out so the white Yi logo on the chest stays visible.
 */
export const TSHIRT_COLORS = [
  { id: 'royal-blue', label: 'Royal Blue', prompt: 'royal blue', hex: '#1d4ed8' },
  { id: 'sky-blue', label: 'Sky Blue', prompt: 'sky blue', hex: '#38bdf8' },
  { id: 'navy', label: 'Navy', prompt: 'navy blue', hex: '#1e3a8a' },
  { id: 'teal', label: 'Teal', prompt: 'teal', hex: '#0d9488' },
  { id: 'green', label: 'Green', prompt: 'emerald green', hex: '#059669' },
  { id: 'red', label: 'Red', prompt: 'crimson red', hex: '#dc2626' },
  { id: 'maroon', label: 'Maroon', prompt: 'maroon', hex: '#7f1d1d' },
  { id: 'pink', label: 'Pink', prompt: 'magenta pink', hex: '#db2777' },
  { id: 'purple', label: 'Purple', prompt: 'deep purple', hex: '#6d28d9' },
  { id: 'black', label: 'Black', prompt: 'black', hex: '#111827' },
  { id: 'grey', label: 'Grey', prompt: 'charcoal grey', hex: '#4b5563' },
] as const;

export type TshirtColorId = (typeof TSHIRT_COLORS)[number]['id'];

/** "Surprise me": a random colour is picked for every poster. */
export const RANDOM_COLOR = 'random';

export type BottomWear = 'shorts' | 'track_pants';

/** Women default to track pants, men to shorts — the runner can change it. */
export function defaultBottomWear(gender?: string): BottomWear {
  return gender === 'female' ? 'track_pants' : 'shorts';
}

export function findTshirtColor(id: unknown) {
  return TSHIRT_COLORS.find(c => c.id === id);
}

export function sanitizeBottomWear(input: unknown): BottomWear | undefined {
  return input === 'shorts' || input === 'track_pants' ? input : undefined;
}

/**
 * Finisher look — how the body is drawn.
 *  'fit'  = "Fit & Fab": a little slimmer and more toned (about an inch at the waist)
 *  'real' = "Just Me": their real body, unchanged (default)
 */
export type BodyLook = 'fit' | 'real';

export const BODY_LOOKS = [
  { id: 'real', emoji: '😎', label: 'Just Me', hint: 'My real look' },
  { id: 'fit', emoji: '🔥', label: 'Fit & Fab', hint: 'A little slimmer & toned' },
] as const;

export const DEFAULT_BODY_LOOK: BodyLook = 'real';

export function sanitizeBodyLook(input: unknown): BodyLook {
  return input === 'fit' ? 'fit' : 'real';
}
