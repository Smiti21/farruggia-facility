export type Language = 'en' | 'de';

export type ServiceKey = 'technical' | 'security' | 'landscaping' | 'other';

export interface ServiceItem {
  key: ServiceKey;
  title: string;
  desc: string;
}

export interface Translation {
  nav: { home: string; about: string; services: string; contact: string };
  hero: { headline: string; sub: string };
  about: { subtitle: string; heading: string; italics: string[] };
  services: { title: string; intro: string; items: ServiceItem[] };
  marquee: string[];
  contact: {
    title: string;
    lead: string;
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    address: string;
  };
  footer: { rights: string; impressum: string; datenschutz: string; tagline: string };
  cta: string;
  language: { label: string; en: string; de: string };
}

export const translations: Record<Language, Translation> = {
  en: {
    nav: { home: 'HOME', about: 'ABOUT', services: 'SERVICES', contact: 'CONTACT' },
    hero: { headline: 'Farruggia\nFacility', sub: 'Swiss precision in every detail.' },
    about: {
      subtitle: 'About Us',
      heading:
        'We deliver seamless facility management that lets your property run flawlessly. From technical care to security and outdoor spaces, we handle it all.',
      italics: ['seamless', 'flawlessly', 'all'],
    },
    services: {
      title: 'Our Services',
      intro:
        'One partner for every system, surface and schedule your property depends on.',
      items: [
        {
          key: 'technical',
          title: 'Technical Maintenance',
          desc: 'HVAC, electrical, plumbing, elevators and structural upkeep for complex buildings.',
        },
        {
          key: 'security',
          title: 'Security & Protection',
          desc: 'Access control, surveillance, guarding and asset protection for warehouses and sensitive sites.',
        },
        {
          key: 'landscaping',
          title: 'Landscaping & Exterior',
          desc: 'Gardens, grounds, winter services and outdoor aesthetics for residential and commercial properties.',
        },
        {
          key: 'other',
          title: 'Additional Services',
          desc: 'Cleaning, waste management, energy optimisation and relocation support.',
        },
      ],
    },
    marquee: ['TECHNICAL', 'SECURITY', 'LANDSCAPING', 'WINTERDIENST', 'REINIGUNG', 'ENERGY', 'OBJEKTSCHUTZ'],
    contact: {
      title: 'Let’s talk about your property',
      lead: 'Tell us what your building needs. We answer within one working day.',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      addressLabel: 'Office',
      address: 'Frauenfeld, Thurgau, Switzerland',
    },
    footer: {
      rights: 'All rights reserved.',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      tagline: 'Facility management from Frauenfeld — for all of Switzerland.',
    },
    cta: 'Request a Consultation',
    language: { label: 'Switch language', en: 'EN', de: 'DE' },
  },
  de: {
    nav: { home: 'START', about: 'ÜBER UNS', services: 'LEISTUNGEN', contact: 'KONTAKT' },
    hero: { headline: 'Farruggia\nFacility', sub: 'Schweizer Präzision in jedem Detail.' },
    about: {
      subtitle: 'Über uns',
      heading:
        'Wir liefern nahtloses Facility Management, damit Ihre Immobilie einwandfrei funktioniert. Von der Technik über Sicherheit bis zur Aussenpflege – wir kümmern uns um alles.',
      italics: ['nahtloses', 'einwandfrei', 'alles'],
    },
    services: {
      title: 'Unsere Leistungen',
      intro:
        'Ein Partner für jede Anlage, jede Fläche und jeden Turnus, auf den Ihre Immobilie angewiesen ist.',
      items: [
        {
          key: 'technical',
          title: 'Technischer Unterhalt',
          desc: 'HLK, Elektro, Sanitär, Aufzüge und baulicher Unterhalt für komplexe Gebäude.',
        },
        {
          key: 'security',
          title: 'Sicherheit & Objektschutz',
          desc: 'Zutrittskontrolle, Überwachung, Bewachung und Schutz für Lager und sensible Areale.',
        },
        {
          key: 'landscaping',
          title: 'Aussenanlagen & Pflege',
          desc: 'Gärten, Grünflächen, Winterdienst und Aussenästhetik für Wohn- und Gewerbeimmobilien.',
        },
        {
          key: 'other',
          title: 'Weitere Dienste',
          desc: 'Reinigung, Abfallmanagement, Energieoptimierung und Umzugsunterstützung.',
        },
      ],
    },
    marquee: ['TECHNIK', 'SICHERHEIT', 'AUSSENANLAGEN', 'WINTERDIENST', 'REINIGUNG', 'ENERGIE', 'OBJEKTSCHUTZ'],
    contact: {
      title: 'Sprechen wir über Ihre Immobilie',
      lead: 'Sagen Sie uns, was Ihr Gebäude braucht. Wir antworten innert einem Arbeitstag.',
      emailLabel: 'E-Mail',
      phoneLabel: 'Telefon',
      addressLabel: 'Standort',
      address: 'Frauenfeld, Thurgau, Schweiz',
    },
    footer: {
      rights: 'Alle Rechte vorbehalten.',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      tagline: 'Facility Management aus Frauenfeld — für die ganze Schweiz.',
    },
    cta: 'Beratungsgespräch anfragen',
    language: { label: 'Sprache wechseln', en: 'EN', de: 'DE' },
  },
};

export const CONTACT = {
  email: 'info@farruggia-facility.ch',
  phone: '+41 52 123 45 67',
  phoneHref: '+41521234567',
} as const;
