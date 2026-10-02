const ORDINAL_SUFFIX: Record<Intl.LDMLPluralRule, string> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
  zero: 'th',
  many: 'th',
};
const rules = new Intl.PluralRules('en', { type: 'ordinal' });

/** 1 -> "1st", 2 -> "2nd", 23 -> "23rd". */
export const ordinal = (n: number): string => `${n}${ORDINAL_SUFFIX[rules.select(n)]}`;

export const formatScore = (n: number): string => n.toLocaleString('en');

/** "1 entry" / "3 entries": `forms` is [singular, plural]. */
export const plural = (n: number, [one, many]: readonly [string, string]): string => `${n} ${n === 1 ? one : many}`;
