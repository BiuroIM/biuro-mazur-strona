import { getCollection } from 'astro:content';

export const pageData = async (collection) => {
  const [entry] = await getCollection(collection);
  return entry.data;
};
