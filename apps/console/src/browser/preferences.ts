export type ConsoleHomePath =
  | '/overview'
  | '/seo/overview'
  | '/advertising/all/overview'
  | '/analytics/overview';

export const consoleHomeOptions: Array<{ value: ConsoleHomePath; label: string }> = [
  { value: '/overview', label: 'Growth overview' },
  { value: '/seo/overview', label: 'SEO overview' },
  { value: '/advertising/all/overview', label: 'Advertising overview' },
  { value: '/analytics/overview', label: 'Analytics overview' },
];

const homeKey = 'unisane-ops-home-page';
const sidebarStorageKey = 'unisane-ops-sidebar';

export function readConsoleHomePath(): ConsoleHomePath {
  try {
    const value = window.localStorage.getItem(homeKey);
    return consoleHomeOptions.some((option) => option.value === value)
      ? (value as ConsoleHomePath)
      : '/overview';
  } catch {
    return '/overview';
  }
}

export function writeConsoleHomePath(path: ConsoleHomePath): void {
  try {
    window.localStorage.setItem(homeKey, path);
  } catch {
    return;
  }
}

export function resetConsolePreferences(): void {
  try {
    window.localStorage.removeItem(homeKey);
    window.localStorage.removeItem(`${sidebarStorageKey}-value`);
    window.localStorage.removeItem(`${sidebarStorageKey}-expanded`);
    window.localStorage.removeItem(`${sidebarStorageKey}-groups`);
  } catch {
    return;
  }
}
