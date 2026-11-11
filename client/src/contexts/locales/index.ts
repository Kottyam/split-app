import type { LanguageCode } from '../LanguageContext';
import { as } from './as';
import { bn } from './bn';
import { gu } from './gu';
import { hi } from './hi';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';
import { or } from './or';
import { pa } from './pa';
import { ta } from './ta';
import { te } from './te';

/**
 * Full-coverage locale dictionaries. These take precedence over the older
 * per-feature dictionaries (LanguageContext translations, languageExtras) so
 * every key resolves to a reviewed string in the selected language.
 */
export const localeTranslations: Record<Exclude<LanguageCode, 'en'>, Record<string, string>> = { ml, hi, ta, kn, te, mr, bn, gu, pa, or, as };
