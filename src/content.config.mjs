import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string(),
      date: z.date(),
      category: z.string(),
      readingMinutes: z.number(),
      cover: image(),
      coverAlt: z.string(),
      softParallax: z.boolean().default(false),
    }),
});

export const collections = { blog };
