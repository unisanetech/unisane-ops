const helpSourceKey = 'unisane-ops-help-source';

export function rememberHelpSource(path: string): void {
  if (path === '/help') return;
  try {
    window.sessionStorage.setItem(helpSourceKey, path);
  } catch {
    return;
  }
}

export function readHelpSource(): string {
  try {
    return window.sessionStorage.getItem(helpSourceKey) ?? '/overview';
  } catch {
    return '/overview';
  }
}
