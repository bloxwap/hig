/** Provider ids and artwork match the Bloxwap app login drawer. */
export const loginProviders = ['twitter', 'apple', 'google'] as const;
export type LoginProvider = typeof loginProviders[number];
export const loginArtwork: Record<LoginProvider, readonly {d: string; fill: string | null}[]> = {
  "twitter": [
    {
      "d": "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
      "fill": null
    }
  ],
  "apple": [
    {
      "d": "M16.365 1.43c0 1.14-.427 2.2-1.28 3.18-1.03 1.17-2.276 1.85-3.44 1.75a3.9 3.9 0 0 1-.03-.44c0-1.1.472-2.26 1.31-3.21.42-.48.95-.88 1.6-1.2.64-.31 1.25-.48 1.82-.51.01.14.02.28.02.43zm4.377 16.44c-.35.81-.77 1.55-1.25 2.24-.66.94-1.2 1.59-1.62 1.95-.65.6-1.34.9-2.08.92-.53 0-1.17-.15-1.92-.46-.75-.3-1.44-.45-2.06-.45-.66 0-1.37.15-2.13.45-.76.31-1.37.47-1.84.48-.71.03-1.42-.28-2.12-.93-.45-.39-1.02-1.06-1.7-2.02-.73-1.02-1.33-2.21-1.8-3.56-.5-1.46-.76-2.87-.76-4.24 0-1.57.34-2.92 1.02-4.06a5.98 5.98 0 0 1 2.14-2.16 5.75 5.75 0 0 1 2.89-.82c.56 0 1.3.17 2.22.52.91.35 1.5.53 1.75.53.19 0 .84-.21 1.94-.62 1.04-.38 1.92-.54 2.64-.48 1.95.16 3.42.93 4.4 2.32-1.75 1.06-2.61 2.54-2.59 4.44.01 1.48.55 2.71 1.61 3.69.48.46 1.02.81 1.62 1.06-.13.38-.27.74-.42 1.09z",
      "fill": null
    }
  ],
  "google": [
    {
      "d": "M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z",
      "fill": "#4285F4"
    },
    {
      "d": "M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z",
      "fill": "#34A853"
    },
    {
      "d": "M5.27 14.29A7.19 7.19 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76z",
      "fill": "#FBBC05"
    },
    {
      "d": "M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z",
      "fill": "#EA4335"
    }
  ]
};

export const loginCopy = {
  title: 'Log in', close: 'Close', lastUsed: 'Last used',
  twitter: 'Continue with X', apple: 'Continue with Apple', google: 'Continue with Google',
  analytics: 'Product analytics', analyticsInfo: 'About product analytics',
  description: 'Share optional analytics to help us understand onboarding. We exclude wallet details and form inputs.',
  terms: 'Terms of Use', privacy: 'Privacy Policy',
};
export const loginTermsUrl = 'https://bloxwap.com/docs/terms';
export const loginPrivacyUrl = 'https://bloxwap.com/docs/privacy';

export interface LoginBlockProps {
  onLogin: (provider: LoginProvider) => void;
  onClose: () => void;
  lastUsed?: LoginProvider | null;
  /** Disable provider rows while the host starts authentication. */
  disabled?: boolean;
  /** Providers whose sign-in is in flight: their rows are disabled while the others stay open. */
  pending?: readonly LoginProvider[];
  analyticsEnabled?: boolean;
  /** Omit to leave the analytics row out, for a host with nothing to consent to. */
  onAnalyticsChange?: (enabled: boolean) => void;
  /** Draw the analytics switch unavailable, such as while consent loads. */
  analyticsDisabled?: boolean;
  /** Open Terms or Privacy the host's own way, such as an in-app browser. Without it the link opens its URL. */
  onOpenLink?: (url: string, link: 'terms' | 'privacy') => void;
  labels?: Partial<typeof loginCopy>;
  termsUrl?: string;
  privacyUrl?: string;
}
