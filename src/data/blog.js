import { getCollection } from 'astro:content';

const dateFormatter =new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const formatDate = (date) => dateFormatter.format(date);

const monthFormatter = new Intl.DateTimeFormat('pl-PL', { month: 'long' });

export const formatDateMonthFirst = (date) => {
  const month = monthFormatter.format(date);
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getDate()} ${date.getFullYear()}`;
};

export const isoDate = (date) => date.toISOString().slice(0, 10);

const WORDS_PER_MINUTE = 200;

export const readingMinutes = (post) =>
  Math.max(1, Math.round(post.body.trim().split(/\s+/).length / WORDS_PER_MINUTE));

export const readingLabel = (minutes) => `${minutes} min czytania`;

export const publishedPosts = () => getCollection('blog', ({ data }) => !data.draft);

const newestFirst = (a, b) => b.data.date.valueOf() - a.data.date.valueOf();

export const sortPosts = (posts) => [...posts].sort(newestFirst);

export const relatedPosts = (posts, current, limit = 3) => {
  const others = sortPosts(posts).filter((post) => post.id !== current.id);
  const sameCategory = others.filter(
    (post) => post.data.category === current.data.category
  );
  const filler = others.filter(
    (post) => post.data.category !== current.data.category
  );
  return [...sameCategory, ...filler].slice(0, limit);
};
