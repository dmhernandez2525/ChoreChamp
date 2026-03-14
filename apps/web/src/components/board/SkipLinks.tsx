import React from 'react';

interface SkipLink {
  href: string;
  label: string;
}

const SKIP_LINKS: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#board-content', label: 'Skip to board' },
];

/**
 * Renders visually hidden skip navigation links that become visible on focus.
 * Allows keyboard users to jump directly to primary content areas without
 * tabbing through the entire navigation.
 */
export function SkipLinks() {
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Remove tabindex after blur so it does not interfere with normal flow
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {
        once: true,
      });
    }
  };

  return (
    <nav aria-label="Skip navigation">
      {SKIP_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => handleClick(e, link.href)}
          className={[
            'sr-only focus:not-sr-only',
            'focus:fixed focus:top-2 focus:left-2 focus:z-[9999]',
            'focus:inline-block focus:rounded-full',
            'focus:bg-blue-600 focus:px-4 focus:py-2',
            'focus:text-sm focus:font-medium focus:text-white',
            'focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
          ].join(' ')}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
