/**
 * Système de gestion des devises pour CodingLive
 */

export type CurrencyCode = 'XAF' | 'XOF' | 'CDF' | 'EUR' | 'USD' | 'GBP' | 'MAD' | 'TND' | 'DZD';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  position: 'before' | 'after';
  decimals: number;
  // Taux par rapport à l'EUR (1 EUR = X devise)
  rateToEUR: number;
}

// Taux de change par défaut (1 EUR = X devise)
// Ces taux peuvent être personnalisés via l'interface ou l'API
export const defaultExchangeRates: Record<CurrencyCode, number> = {
  XAF: 655.957,    // Taux fixe CFA CEMAC
  XOF: 655.957,    // Taux fixe CFA UEMOA
  CDF: 2750,       // Franc Congolais (taux approximatif)
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  MAD: 10.85,
  TND: 3.35,
  DZD: 145.50
};

export const currencies: Record<CurrencyCode, Currency> = {
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA (CEMAC)',
    locale: 'fr-CM',
    position: 'after',
    decimals: 0,
    rateToEUR: defaultExchangeRates.XAF
  },
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA (UEMOA)',
    locale: 'fr-SN',
    position: 'after',
    decimals: 0,
    rateToEUR: defaultExchangeRates.XOF
  },
  CDF: {
    code: 'CDF',
    symbol: 'FC',
    name: 'Franc Congolais',
    locale: 'fr-CD',
    position: 'after',
    decimals: 0,
    rateToEUR: defaultExchangeRates.CDF
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'fr-FR',
    position: 'after',
    decimals: 2,
    rateToEUR: defaultExchangeRates.EUR
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar américain',
    locale: 'en-US',
    position: 'before',
    decimals: 2,
    rateToEUR: defaultExchangeRates.USD
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'Livre sterling',
    locale: 'en-GB',
    position: 'before',
    decimals: 2,
    rateToEUR: defaultExchangeRates.GBP
  },
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Dirham marocain',
    locale: 'fr-MA',
    position: 'after',
    decimals: 2,
    rateToEUR: defaultExchangeRates.MAD
  },
  TND: {
    code: 'TND',
    symbol: 'DT',
    name: 'Dinar tunisien',
    locale: 'fr-TN',
    position: 'after',
    decimals: 3,
    rateToEUR: defaultExchangeRates.TND
  },
  DZD: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Dinar algérien',
    locale: 'fr-DZ',
    position: 'after',
    decimals: 2,
    rateToEUR: defaultExchangeRates.DZD
  }
};

// Devise par défaut (peut être configurée via .env)
export const DEFAULT_CURRENCY: CurrencyCode = 
  (process.env.NEXT_PUBLIC_CURRENCY as CurrencyCode) || 'USD';

/**
 * Obtenir la devise actuelle
 * Récupère la devise depuis localStorage si disponible, sinon utilise la devise par défaut
 */
export function getCurrency(): Currency {
  if (typeof window !== 'undefined') {
    try {
      const savedSettings = localStorage.getItem('codinglive_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.currency && currencies[settings.currency as CurrencyCode]) {
          return currencies[settings.currency as CurrencyCode];
        }
      }
    } catch (e) {
      console.error('Error loading currency from settings:', e);
    }
  }
  return currencies[DEFAULT_CURRENCY] || currencies.USD;
}

/**
 * Obtenir le code de devise actuel
 */
export function getCurrencyCode(): CurrencyCode {
  if (typeof window !== 'undefined') {
    try {
      const savedSettings = localStorage.getItem('codinglive_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.currency && currencies[settings.currency as CurrencyCode]) {
          return settings.currency as CurrencyCode;
        }
      }
    } catch (e) {
      console.error('Error loading currency code from settings:', e);
    }
  }
  return DEFAULT_CURRENCY;
}

/**
 * Formater un montant avec la devise
 */
export function formatMoney(amount: number, currencyCode?: CurrencyCode): string {
  const code = currencyCode || getCurrencyCode();
  const currency = currencies[code] || currencies.USD;
  
  const formattedNumber = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals
  }).format(amount);

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currency.symbol}`;
  }
}

/**
 * Formater un montant de manière compacte (ex: 150K FCFA)
 */
export function formatMoneyCompact(amount: number, currencyCode?: CurrencyCode): string {
  const currency = currencies[currencyCode || DEFAULT_CURRENCY] || currencies.USD;
  
  let formattedNumber: string;
  
  if (amount >= 1000000) {
    formattedNumber = (amount / 1000000).toFixed(1).replace('.0', '') + 'M';
  } else if (amount >= 1000) {
    formattedNumber = (amount / 1000).toFixed(1).replace('.0', '') + 'K';
  } else {
    formattedNumber = amount.toString();
  }

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currency.symbol}`;
  }
}

/**
 * Parser un montant depuis une chaîne
 */
export function parseMoney(value: string): number {
  // Supprimer tous les caractères non numériques sauf le point et la virgule
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Liste des devises pour les sélecteurs
 */
export function getCurrencyList(): { value: CurrencyCode; label: string }[] {
  return Object.entries(currencies).map(([code, currency]) => ({
    value: code as CurrencyCode,
    label: `${currency.symbol} - ${currency.name}`
  }));
}

/**
 * Convertir un montant d'une devise à une autre
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, number>>
): number {
  if (from === to) return amount;

  // Utiliser les taux personnalisés ou les taux par défaut
  const rates = { ...defaultExchangeRates, ...customRates };
  
  // Convertir en EUR d'abord, puis dans la devise cible
  const amountInEUR = amount / rates[from];
  const convertedAmount = amountInEUR * rates[to];
  
  // Arrondir selon les décimales de la devise cible
  const decimals = currencies[to].decimals;
  return Math.round(convertedAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Obtenir le taux de change entre deux devises
 */
export function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, number>>
): number {
  if (from === to) return 1;
  
  const rates = { ...defaultExchangeRates, ...customRates };
  return rates[to] / rates[from];
}

/**
 * Formater un montant avec conversion
 */
export function formatMoneyConverted(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, number>>
): string {
  const converted = convertCurrency(amount, fromCurrency, toCurrency, customRates);
  return formatMoney(converted, toCurrency);
}

/**
 * Obtenir les taux de change depuis le localStorage (côté client)
 */
export function getStoredExchangeRates(): Partial<Record<CurrencyCode, number>> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem('codinglive_exchange_rates');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Sauvegarder les taux de change dans le localStorage
 */
export function saveExchangeRates(rates: Partial<Record<CurrencyCode, number>>): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('codinglive_exchange_rates', JSON.stringify(rates));
}

