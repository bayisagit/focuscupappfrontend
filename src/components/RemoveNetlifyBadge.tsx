'use client';

import { useEffect } from 'react';

/**
 * Automatically removes the Netlify floating HUD / "Powered by Netlify"
 * badge from the DOM so it never obscures mobile navigation or user interactions.
 */
export default function RemoveNetlifyBadge() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const purgeBadge = () => {
      // 1. Remove the badge and hud iframes
      const targets = document.querySelectorAll(
        '#nl-badge-frame, #nl-hud-frame, iframe[id^="nl-"], iframe[title*="Netlify"], iframe[title*="Powered by Netlify"], netlify-drawer'
      );
      targets.forEach((el) => {
        try {
          el.remove();
        } catch (_) {}
      });

      // 2. Remove the injected script tag
      const scripts = document.querySelectorAll(
        'script[data-nf-variant], script[src*="netlify/scripts/hud"]'
      );
      scripts.forEach((s) => {
        try {
          s.remove();
        } catch (_) {}
      });
    };

    purgeBadge();

    // Monitor the DOM so any late injected iframe is removed immediately
    const observer = new MutationObserver(() => {
      purgeBadge();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('load', purgeBadge);
    const t1 = setTimeout(purgeBadge, 300);
    const t2 = setTimeout(purgeBadge, 1000);
    const t3 = setTimeout(purgeBadge, 2500);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', purgeBadge);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return null;
}
