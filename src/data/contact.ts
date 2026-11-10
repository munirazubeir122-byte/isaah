// Contact channels shown on the Contact page.
//
// Fill these in with ISLAAH Media's real details. Any channel left empty is
// simply not shown. Prefer channels that are end-to-end encrypted (Signal,
// Proton Mail) for people sharing their stories.
//
// There is deliberately no web form: a form would store sensitive messages
// on a server, which puts contributors at risk.
import { doc } from '../content/store';
import type { ContactSettings } from '../content/types';

export const CONTACT: ContactSettings = {
  /** Signal number in international format, e.g. '+254700000000'. */
  signal: '',
  /** Encrypted email for story contributors, e.g. 'stories@proton.me'. */
  storiesEmail: '',
  /** General / press email, e.g. 'hello@islaah.co.ke'. */
  generalEmail: 'info@islaah.co.ke',
};

/** Contact details as edited in the dashboard, or as shipped. */
export const contactSettings = (): ContactSettings => ({ ...CONTACT, ...doc<Partial<ContactSettings>>('settings') });
