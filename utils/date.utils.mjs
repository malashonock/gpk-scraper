export const parseDateRu = (dateRu) => {
  const [day, month, year] = dateRu.split('.');
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  return getISODateString(date);
};

export const getISODateString = (date) => {
  return date.toISOString().slice(0, 10);
};
