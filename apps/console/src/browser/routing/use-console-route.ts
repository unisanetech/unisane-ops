import { useEffect, useRef, useState } from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { resolveConsoleRoute } from '../../routes.js';
import { readConsoleHomePath } from '../preferences.js';
import { rememberHelpSource } from './help-context.js';

export function useConsoleRoute(capabilities: MarketingConsoleState['capabilities']) {
  const [pathname, setPathname] = useState(() =>
    window.location.pathname === '/' ? readConsoleHomePath() : window.location.pathname,
  );
  const route = resolveConsoleRoute(pathname, capabilities);
  const initialRender = useRef(true);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (window.location.pathname !== route.path) {
      window.history.replaceState({}, '', route.path);
      setPathname(route.path);
    }
  }, [route.path]);

  useEffect(() => {
    rememberHelpSource(route.path);
  }, [route.path]);

  useEffect(() => {
    document.title = `${route.title} — Unisane Ops`;
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pathname, route.title]);

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setPathname(path);
  }

  return { route, navigate };
}
