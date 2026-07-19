/**
 * Navigation Configuration
 *
 * Defines which pages appear in the site navigation and their display order.
 * Astro handles routing via the filesystem — this only controls nav menus.
 */

export interface NavItem {
  label: string;
  href: string;
  order: number;
}

// Labels match the section eyebrows 1:1 so nav and page never disagree.
export const navItems: NavItem[] = [
  { label: 'The Firm', href: '/#firm', order: 1 },
  { label: 'The Method', href: '/#method', order: 2 },
  { label: 'Track Record', href: '/track-record', order: 3 },
  { label: 'The Team', href: '/#team', order: 4 },
  { label: 'Perspectives', href: '/#perspectives', order: 5 },
];

/**
 * Get navigation items sorted by order
 */
export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}
