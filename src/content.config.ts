import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Blog collection with Content Layer API
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(100),
      description: z.string().max(200),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      author: z.string().default('Team'),
      image: image().optional(),
      imageAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      locale: z.enum(['en', 'es', 'fr']).default('en'),
    }),
});

// Pages collection for static pages
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date().optional(),
    locale: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

// Authors collection
const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      bio: z.string(),
      avatar: image().optional(),
      social: z
        .object({
          twitter: z.string().optional(),
          github: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .optional(),
    }),
});

// Properties collection — the track record. Single source of truth for every
// deal shown on the homepage portfolio section, /track-record, and the
// per-property case study pages. Entries with `caseStudy: true` get a page at
// /track-record/[id] rendered from the markdown body.
const properties = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/properties' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      location: z.string(), // "Irving, TX"
      // Hand-geocoded, city/corridor-level — drives the portfolio map pin.
      // Optional: entries without coords simply don't appear on the map.
      coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
      submarket: z.string().optional(), // "North Dallas Submarket"
      units: z.number().int().positive().optional(),
      assetType: z.enum(['multifamily', 'self-storage']).default('multifamily'),
      status: z.enum(['active', 'full-cycle']),
      strategy: z.string().optional(), // "Value-Add"
      holdMonths: z.number().int().positive().optional(),
      // IRR/multiple stay strings — published figures include ranges ("19–21%")
      targetIrr: z.string().optional(),
      actualIrr: z.string().optional(),
      equityMultiple: z.string().optional(), // "1.86x"
      image: image(),
      imageAlt: z.string(),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      blurb: z.string().optional(), // highlight-card / featured copy
      description: z.string().optional(), // SEO meta for case-study pages
      featured: z.boolean().default(false), // the single feature block
      highlight: z.boolean().default(false), // full-cycle highlight cards
      caseStudy: z.boolean().default(false), // gates page generation
      order: z.number().default(0),
      // Ledger copy overrides — several published strings ("1031 Exchange",
      // "Acquired 2022") are not derivable from the structured fields
      indexMeta: z.string().optional(),
      indexFigure: z.string().optional(),
      // Bespoke stats for the featured deal block
      featureStats: z.array(z.object({ n: z.string(), l: z.string() })).optional(),
    }),
});

// FAQs collection (for JSON-LD FAQ schema)
const faqs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
    order: z.number().default(0),
    locale: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

export const collections = {
  blog,
  pages,
  authors,
  faqs,
  properties,
};
