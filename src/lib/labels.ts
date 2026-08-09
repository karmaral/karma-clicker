/**
 * The one place code names and UI labels meet. `detail` has no fixed label —
 * it takes the active planet's proper noun. See nav.label().
 */

export type ScreenName = 'overview' | 'detail' | 'refinery';

export const SCREENS: ScreenName[] = ['overview', 'detail', 'refinery'];

export const SCREEN_LABELS: Record<ScreenName, string> = {
  overview: 'Overview',
  detail: '—',
  refinery: 'Refinery',
};
