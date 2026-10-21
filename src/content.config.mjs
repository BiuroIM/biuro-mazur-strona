import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lines = (max) => z.array(z.string().min(1).max(max)).min(1).max(3);

const seo = z.object({
  title: z.string().min(1).max(70),
  fullTitle: z.string().max(70).optional(),
  description: z.string().min(50).max(200),
});

const page = (name, schema) =>
  defineCollection({
    loader: glob({ pattern: `${name}.yml`, base: './src/content/pages' }),
    schema,
  });

const setting = (name, schema) =>
  defineCollection({
    loader: glob({ pattern: `${name}.yml`, base: './src/content/settings' }),
    schema,
  });

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string(),
      date: z.coerce.date(),
      category: z.string(),
      cover: image(),
      coverAlt: z.string(),
      softParallax: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date().optional(),
    documents: z
      .array(z.object({ label: z.string().min(1), file: z.string().regex(/^\/documents\/.+\.pdf$/i) }))
      .optional(),
  }),
});

const home = page(
  'home',
  z.object({
    seo,
    intro: z.string().min(1).max(400),
    numbers: z
      .array(z.object({ label: z.string().min(1).max(40), value: z.string().min(1).max(8) }))
      .min(3)
      .max(6),
    servicesIntro: z.string().min(1).max(300),
    services: z
      .array(z.object({ name: z.string().min(1).max(40), description: z.string().min(1).max(200) }))
      .min(3)
      .max(6),
    steps: z
      .array(z.object({ title: lines(24), text: z.string().min(1).max(180) }))
      .length(4),
    closing: z.string().min(1).max(220),
    faq: z
      .array(z.object({ question: z.string().min(1).max(90), answer: z.string().min(1).max(400) }))
      .min(1)
      .max(10),
  })
);

const about = page('about', ({ image }) =>
  z.object({
    seo,
    intro: z.string().min(1).max(200),
    paragraphs: z.array(z.string().min(1).max(700)).length(2),
    team: z
      .array(
        z.object({
          name: z.string().min(1).max(40),
          role: z.string().min(1).max(40),
          bio: z.string().min(1).max(220),
          photo: image(),
          photoAlt: z.string().min(1),
          photoFocus: z.string().regex(/^\d+(\.\d+)?% \d+(\.\d+)?%$/).default('50% 15%'),
          photoZoom: z.number().min(1).max(3).default(1.6),
        })
      )
      .min(1),
    closing: z.string().min(1).max(220),
  })
);

const services = page('services', ({ image }) =>
  z.object({
    seo,
    intro: z.string().min(1).max(200),
    groups: z
      .array(
        z.object({
          title: lines(16),
          lead: z.string().min(1).max(80),
          photo: image().optional(),
          photoAlt: z.string().optional(),
          services: z
            .array(
              z.object({
                name: z.string().min(1).max(40),
                lead: z.string().min(1).max(50),
                description: z.string().min(1).max(400),
              })
            )
            .min(1),
        })
      )
      .min(1)
      .refine((groups) => groups.some((group) => group.photo), 'Co najmniej jedna grupa usług musi mieć zdjęcie.'),
    standards: z
      .array(z.object({ title: lines(20), description: z.string().min(1).max(260) }))
      .min(1)
      .max(5),
    closing: z.string().min(1).max(200),
  })
);

const blogPage = page('blog', z.object({ seo, closing: z.string().min(1).max(220) }));

const contactPage = page('contact', z.object({ seo }));

const notFound = page('not-found', z.object({ seo, text: z.string().min(1).max(220) }));

const company = setting(
  'company',
  z.object({
    brandName: z.string().min(1),
    legalName: z.string().min(1),
    tagline: z.string().min(1).max(140),
    phone: z.string().regex(/^[\d ]{9,13}$/),
    email: z.string().email(),
    address: z.object({
      street: z.string().min(1),
      postalCode: z.string().regex(/^\d{2}-\d{3}$/),
      city: z.string().min(1),
    }),
    hours: z.object({
      label: z.string().min(1).max(40),
      sentence: z.string().min(1).max(100),
      opens: z.string().regex(/^\d{2}:\d{2}$/),
      closes: z.string().regex(/^\d{2}:\d{2}$/),
    }),
    callback: z.object({
      clause: z.string().min(1).max(80),
      sentence: z.string().min(1).max(80),
    }),
    facebook: z.string().url(),
    registry: z.object({
      taxId: z.string().regex(/^\d{10}$/),
      courtRegister: z.string().regex(/^\d{10}$/),
      statisticalId: z.string().regex(/^\d{9}(\d{5})?$/),
      taxAdvisorNumber: z.string().min(1),
    }),
    geo: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  })
);

const clients = setting('clients', ({ image }) =>
  z
    .object({
      logos: z
        .array(
          z.object({
            name: z.string().min(1),
            image: image(),
            scale: z.number().min(0.5).max(2).default(1),
            mobileScale: z.number().min(0.5).max(2).optional(),
          })
        )
        .min(4),
      mobileTopRow: z.array(z.string()).min(1),
      mobileBottomRow: z.array(z.string()).min(1),
      names: z.array(z.string().min(1).max(30)).min(5),
      wall: z.array(z.object({ names: z.array(z.string()).length(5) })).length(5),
    })
    .superRefine((data, context) => {
      const logoNames = new Set(data.logos.map((logo) => logo.name));
      for (const name of [...data.mobileTopRow, ...data.mobileBottomRow]) {
        if (!logoNames.has(name)) {
          context.addIssue({ code: 'custom', message: `Logo „${name}” nie istnieje na liście logotypów.` });
        }
      }
    })
);

export const collections = {
  blog,
  legal,
  home,
  about,
  services,
  blogPage,
  contactPage,
  notFound,
  company,
  clients,
};
