import { SITE_URL, GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION } from 'astro:env/server';

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  author: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  socialLinks: string[];
  twitter?: {
    site: string;
    creator: string;
  };
  verification?: {
    google?: string;
    bing?: string;
  };
  /**
   * Branding configuration
   * Logo files: Replace SVGs in src/assets/branding/
   * Favicon: Replace in public/favicon.svg
   */
  branding: {
    /** Logo alt text for accessibility */
    logo: {
      alt: string;
    };
    /** Favicon path (lives in public/) */
    favicon: {
      svg: string;
    };
    /** Theme colors for manifest and browser UI */
    colors: {
      /** Browser toolbar color (hex) */
      themeColor: string;
      /** PWA splash screen background (hex) */
      backgroundColor: string;
    };
  };
}

const siteConfig: SiteConfig = {
  name: 'Reap Capital',
  description:
    'An IRR-driven, vertically integrated, value-add real estate operator based in Dallas–Fort Worth. Recognize opportunity. Reap Capital.',
  url: SITE_URL || 'https://reapcapital.com',
  ogImage: '/og-default.png',
  author: 'Reap Capital',
  email: 'invest@reapcapital.com',
  address: {
    street: '',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    country: 'US',
  },
  socialLinks: [],
  // Twitter metadata - update with your actual handles or remove
  // twitter: {
  //   site: '@yourhandle',
  //   creator: '@yourhandle',
  // },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    bing: BING_SITE_VERIFICATION,
  },
  // Branding: Logo files live in src/assets/branding/
  // Replace the SVG files there with your own branding
  branding: {
    logo: {
      alt: 'Reap Capital',
    },
    favicon: {
      svg: '/favicon.svg',
    },
    colors: {
      themeColor: '#394334',
      backgroundColor: '#ffffff',
    },
  },
};

export default siteConfig;
