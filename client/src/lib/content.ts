export type NavigationLink = { label: string; href: string };
export type ProcessStep = { title: string; description: string };
export type ServiceSection = { id: string; heading: string; body: string };
export type ServiceDetailContent = {
  intro: string;
  benefits: string[];
  sections: ServiceSection[];
};
export type ServiceItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  linkLabel: string;
  linkHref: string;
  visible: boolean;
  detail: ServiceDetailContent;
};
export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  detail: string;
  visible: boolean;
};

export type HomeContent = {
  brand: { name: string; descriptor: string; footerLine: string };
  navigation: NavigationLink[];
  hero: {
    eyebrow: string;
    headline: string;
    focus: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    primaryHref: string;
    secondaryHref: string;
    caption: string;
    sideNote: string;
    image: string;
    imageAlt: string;
  };
  trustItems: string[];
  process: {
    eyebrow: string;
    title: string;
    focus: string;
    intro: string;
    steps: ProcessStep[];
    image: string;
    imageAlt: string;
    photoCaption: string;
  };
  services: {
    eyebrow: string;
    title: string;
    focus: string;
    description: string;
    items: ServiceItem[];
  };
  about: {
    eyebrow: string;
    title: string;
    focus: string;
    subline: string;
    paragraphs: string[];
    image: string;
    imageAlt: string;
    linkLabel: string;
    linkHref: string;
    photoCaption: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    supportingText: string;
    emptyMessage: string;
    items: Testimonial[];
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    primaryHref: string;
    secondaryHref: string;
    image: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    hours: string;
    mapLabel: string;
    mapHref: string;
  };
  footer: {
    copyright: string;
    quickLinksLabel: string;
    privacyLabel: string;
    privacyHref: string;
    termsLabel: string;
    termsHref: string;
  };
};

export const DEFAULT_CONTENT: HomeContent = {
  brand: {
    name: "HONLARIS",
    descriptor: "WELLNESS",
    footerLine: "Thoughtful care for your skin and aesthetic concerns.",
  },
  navigation: [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  hero: {
    eyebrow: "CLINICAL PRECISION. ABSOLUTE LUXURY.",
    headline: "Confidence begins with",
    focus: "clarity.",
    description:
      "Thoughtful, personalised care for your skin and aesthetic concerns in our private clinic.",
    primaryCta: "Reserve your consultation",
    secondaryCta: "Explore our services",
    primaryHref: "#book",
    secondaryHref: "#services",
    caption: "A considered approach to skin & wellness",
    sideNote: "HONLARIS WELLNESS · PERSONAL CARE, THOUGHTFULLY CONSIDERED",
    image: "/uploads/hero-daylight.png",
    imageAlt: "Woman in soft daylight, with a calm and confident expression",
  },
  trustItems: [
    "Individual assessment",
    "Clear communication",
    "Safety-conscious care",
  ],
  process: {
    eyebrow: "THE CONSULTATION PROCESS",
    title: "Your first consultation,",
    focus: "explained.",
    intro:
      "A thoughtful first visit gives us time to understand you, your skin, and what matters most.",
    steps: [
      {
        title: "Discuss your concerns",
        description:
          "We take dedicated time to understand your goals and routine.",
      },
      {
        title: "Review your skin history",
        description:
          "Lifestyle, previous treatments, and sensitivities all matter.",
      },
      {
        title: "Understand your goals",
        description: "Together, we clarify what feels right for you.",
      },
      {
        title: "Explore suitable options",
        description:
          "You receive a considered plan, with time to ask questions.",
      },
    ],
    image: "/uploads/process-consultation.png",
    imageAlt:
      "A clinician listening as a client talks through her skin-care goals",
    photoCaption: "Time to listen. Space to understand.",
  },
  services: {
    eyebrow: "OUR SERVICES",
    title: "A more considered",
    focus: "approach to your skin.",
    description:
      "Personalised care, clear options, and a plan that starts with you.",
    items: [
      {
        id: "skin",
        title: "Skin",
        category: "PERSONALISED CARE",
        description:
          "Personalised facial treatments designed around your skin, routine, and goals.",
        image: "/uploads/service-skin.png",
        imageAlt: "Close view of healthy, glowing skin",
        linkLabel: "Explore",
        linkHref: "/service/skin",
        visible: true,
        detail: {
          intro:
            "Skin care at Honlaris begins with listening. Before we recommend anything, we take time to understand how you care for your skin today, what you have tried, and what you would like to see change.",
          benefits: [
            "A facial plan designed around your skin, not a template",
            "Gentle, evidence-informed techniques",
            "Honest guidance on what is worth doing — and what is not",
            "A clear home routine you can actually maintain",
          ],
          sections: [
            {
              id: "skin-what",
              heading: "What a treatment looks like",
              body: "Your visit starts with a relaxed conversation and a close look at your skin. Treatments themselves are calm and unhurried: gentle cleansing, considered actives chosen for your skin, and time for everything to settle. Nothing is rushed, and nothing is done without explanation.",
            },
            {
              id: "skin-who",
              heading: "Who it is for",
              body: "Anyone dealing with dullness, congestion, sensitivity, or an uneven feel; anyone starting a proper routine for the first time; and anyone who has been layering products without seeing results. If your concern needs a different kind of care, we will say so plainly and point you the right way.",
            },
            {
              id: "skin-results",
              heading: "What to expect over time",
              body: "Skin improves steadily rather than overnight. Most people notice their skin feeling calmer after the first visits, with texture and clarity settling in over the following weeks. We review progress together at every stage and adjust the plan as your skin changes.",
            },
          ],
        },
      },
      {
        id: "laser",
        title: "Laser",
        category: "ADVANCED TECHNOLOGY",
        description:
          "Technology-led options, discussed with care and tailored to your concerns.",
        image: "/uploads/service-laser.png",
        imageAlt:
          "Professional aesthetic laser equipment in a calm treatment room",
        linkLabel: "Explore",
        linkHref: "/service/laser",
        visible: true,
        detail: {
          intro:
            "Laser treatment is a tool, not a decision. We start with your skin history and a careful assessment, so the technology serves a clear, agreed goal — never the other way around.",
          benefits: [
            "Suitability checked carefully before anything is booked",
            "Settings chosen for your skin tone and concern",
            "Recovery expectations explained before your first session",
            "A realistic schedule, without over-treatment",
          ],
          sections: [
            {
              id: "laser-what",
              heading: "What happens in a session",
              body: "After the assessment, sessions themselves are short and methodical. You will feel what can best be described as warm snaps — uncomfortable for some, unremarkable for others. Afterwards we walk through aftercare together, in plain language.",
            },
            {
              id: "laser-who",
              heading: "Who it suits — and who it doesn't",
              body: "Laser options can suit concerns like unwanted hair, pigmentation, and visible vessels. Some skin types, recent sun exposure, or certain medications change what is safe. When laser is not right for you, we offer considered alternatives and never push an unsuitable treatment.",
            },
            {
              id: "laser-results",
              heading: "Results and reviews",
              body: "Most plans run over several sessions, with change appearing gradually between them. We photograph, compare, and review honestly — if a course is not progressing as expected, we discuss what to change before continuing.",
            },
          ],
        },
      },
      {
        id: "ayurveda",
        title: "Ayurveda",
        category: "WHOLE-PERSON WELLNESS",
        description:
          "Traditional wellness perspectives alongside a modern, individual approach.",
        image: "/uploads/service-ayurveda.png",
        imageAlt:
          "Fresh botanical ingredients arranged on a warm stone surface",
        linkLabel: "Explore",
        linkHref: "/service/ayurveda",
        visible: true,
        detail: {
          intro:
            "Ayurveda looks at the whole person — digestion, sleep, stress, daily rhythm — and how they show on your skin. We bring that wisdom together with a modern, evidence-aware clinical view.",
          benefits: [
            "Care that looks beyond skin-deep causes",
            "Traditional practices, explained clearly and without mystique",
            "Practical daily-rhythm suggestions you can keep",
            "Fully compatible with your medical care",
          ],
          sections: [
            {
              id: "ayurveda-what",
              heading: "How a consultation works",
              body: "Expect a longer, unhurried conversation: how you sleep and eat, how your day runs, and what your skin is telling us within that picture. From there we plan small, sustainable changes — treatment, routine, and diet guidance framed practically.",
            },
            {
              id: "ayurveda-who",
              heading: "Who it suits",
              body: "Those curious about a gentler, whole-person approach; those whose skin flares with stress or lifestyle; and anyone who wants their care to consider more than surface symptoms. We always work alongside — never instead of — your doctor's advice.",
            },
            {
              id: "ayurveda-results",
              heading: "Change that holds",
              body: "Ayurvedic care shows up gradually: steadier skin, calmer flare-ups, and better tolerance of your daily routine. We keep reviews regular, and adjust as your life changes, because the plan is meant to fit you — not the other way around.",
            },
          ],
        },
      },
      {
        id: "aesthetics",
        title: "Advanced aesthetics",
        category: "AESTHETIC CARE",
        description:
          "Non-surgical options, guided by thoughtful assessment and clear discussion.",
        image: "/uploads/service-aesthetics.png",
        imageAlt:
          "A close, reassuring view of a modern non-invasive facial treatment",
        linkLabel: "Explore",
        linkHref: "/service/aesthetics",
        visible: true,
        detail: {
          intro:
            "Good aesthetic work should be quiet — people notice you look rested, never that you have had something done. Every option starts with a frank conversation about what you want and what would look natural on you.",
          benefits: [
            "Natural-looking results, stated as the goal from day one",
            "Every option explained with honest limits",
            "Conservative dosing — refinement over transformation",
            "Named products and transparent pricing",
          ],
          sections: [
            {
              id: "aesthetics-what",
              heading: "What we offer",
              body: "A focused range of non-surgical treatments — wrinkle-smoothing, skin-quality boosters, and supportive care — chosen for how reliably natural they look. We explain each option, its longevity, and its costs before anything is agreed.",
            },
            {
              id: "aesthetics-who",
              heading: "The first conversation",
              body: "Your first visit is a consultation only. We map facial movement, discuss what bothers you, and often suggest starting lower rather than higher — treatment can always be added to, rarely reversed.",
            },
            {
              id: "aesthetics-results",
              heading: "Aftercare and review",
              body: "Every treatment includes a two-week review. Results are checked together, refinements are made gently, and photographs stay part of your record. Nothing is 'finished' until it looks and feels right to you.",
            },
          ],
        },
      },
    ],
  },
  about: {
    eyebrow: "OUR PHILOSOPHY",
    title: "Beauty is personal.",
    focus: "Care should be too.",
    subline: "A more thoughtful way to wellness.",
    paragraphs: [
      "At Honlaris Wellness, we believe your care begins with understanding you. We bring together clinical expertise, considered treatments, and the space to make decisions that feel right for you.",
      "Because confidence is not about changing who you are. It is about feeling well cared for, every step of the way.",
    ],
    image: "/uploads/lobby.png",
    imageAlt: "Warm, calm reception lounge at Honlaris Wellness",
    linkLabel: "Our Clinic",
    linkHref: "#contact",
    photoCaption: "A quieter kind of care",
  },
  testimonials: {
    eyebrow: "PATIENT EXPERIENCES",
    title: "What our patients say.",
    supportingText: "Thoughtful care, told in their own words.",
    emptyMessage: "Patient stories will appear here soon.",
    items: [
      {
        id: "story-1",
        quote:
          "The conversation felt thoughtful from the very start. I had time to ask questions and understand my options.",
        name: "Sample patient story",
        detail: "Illustrative sample — replace with a verified review",
        visible: true,
      },
      {
        id: "story-2",
        quote:
          "I appreciated how personal the experience felt. Everything was explained in a way that made me feel at ease.",
        name: "Sample patient story",
        detail: "Illustrative sample — replace with a verified review",
        visible: true,
      },
      {
        id: "story-3",
        quote:
          "A calm, welcoming clinic and a team who really listened. I left feeling informed and cared for.",
        name: "Sample patient story",
        detail: "Illustrative sample — replace with a verified review",
        visible: true,
      },
    ],
  },
  cta: {
    eyebrow: "BOOK A CONSULTATION",
    title: "Take the next step.",
    description:
      "Start with a conversation. We will take it from there, together.",
    primaryCta: "Book a consultation",
    secondaryCta: "WhatsApp us",
    primaryHref: "#book",
    secondaryHref: "#whatsapp",
    image: "/uploads/banner-leaf.png",
  },
  contact: {
    eyebrow: "VISIT HONLARIS",
    title: "We would love to hear from you.",
    phone: "8839145005",
    whatsapp: "8839145005",
    email: "",
    address: "",
    hours: "",
    mapLabel: "Find your way to feeling well.",
    mapHref: "",
  },
  footer: {
    copyright: "© 2026 Honlaris Wellness. All rights reserved.",
    quickLinksLabel: "QUICK LINKS",
    privacyLabel: "",
    privacyHref: "",
    termsLabel: "",
    termsHref: "",
  },
};

/**
 * Merges saved JSON (older saves may predate some fields, and Supabase
 * content arrives as a plain object) onto the starter content so every
 * section and every service detail page always has a complete shape.
 */
export function normalizeHomeContent(input: unknown): HomeContent {
  const raw: Record<string, any> =
    input && typeof input === "object" ? (input as Record<string, any>) : {};
  const fallback = DEFAULT_CONTENT;

  const rawServices = raw.services ?? {};
  const rawItems = Array.isArray(rawServices.items) ? rawServices.items : [];
  const items: ServiceItem[] = rawItems.length
    ? rawItems.map((item: Record<string, any>) => {
        const match = fallback.services.items.find(base => base.id === item?.id);
        const source = (item ?? {}) as Partial<ServiceItem>;
        return {
          ...(match ?? fallback.services.items[0]),
          ...source,
          detail: {
            intro: source.detail?.intro ?? match?.detail.intro ?? "",
            benefits: Array.isArray(source.detail?.benefits)
              ? source.detail.benefits
              : (match?.detail.benefits ?? []),
            sections: Array.isArray(source.detail?.sections)
              ? source.detail.sections
              : (match?.detail.sections ?? []),
          },
        };
      })
    : fallback.services.items;

  return {
    ...fallback,
    ...raw,
    brand: { ...fallback.brand, ...raw.brand },
    navigation: Array.isArray(raw.navigation) ? raw.navigation : fallback.navigation,
    hero: { ...fallback.hero, ...raw.hero },
    trustItems: Array.isArray(raw.trustItems) ? raw.trustItems : fallback.trustItems,
    process: { ...fallback.process, ...raw.process },
    services: { ...fallback.services, ...rawServices, items },
    about: { ...fallback.about, ...raw.about },
    testimonials: { ...fallback.testimonials, ...raw.testimonials },
    cta: { ...fallback.cta, ...raw.cta },
    contact: { ...fallback.contact, ...raw.contact },
    footer: { ...fallback.footer, ...raw.footer },
  };
}
