const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
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

export const readingLabel = (minutes) => `${minutes} min czytania`;

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
