export const phone = {
  label: '14 681 63 01',
  href: 'tel:+48146816301',
};

const mobile = (label) => ({ label, href: `tel:+48${label.replace(/\s/g, '')}` });

export const departmentPhones = [
  { department: 'Sekretariat', numbers: [mobile('662 395 997')] },
  { department: 'Iwona Mazur', numbers: [mobile('692 432 712')] },
  { department: 'Kadry', numbers: [mobile('698 616 726'), mobile('798 607 082')] },
  { department: 'Księgi handlowe', numbers: [mobile('882 423 766'), mobile('888 743 172')] },
  { department: 'KPiR', numbers: [mobile('539 377 102'), mobile('606 736 219')] },
];

export const email = {
  label: 'biuro@biuro-mazur.pl',
  href: 'mailto:biuro@biuro-mazur.pl',
};

export const address = {
  label: 'ul. Strażacka 9, 39-200 Dębica',
};

export const openingHours = {
  label: 'pon. do pt. 8:00 do 16:00',
  sentence: 'od poniedziałku do piątku w godzinach od 8:00 do 16:00',
};

export const postalAddress = {
  street: 'ul. Strażacka 9',
  postalCode: '39-200',
  city: 'Dębica',
  country: 'PL',
};

export const businessHours = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  opens: '08:00',
  closes: '16:00',
};

export const callback = {
  clause: 'postaramy się odpowiedzieć jak najszybciej',
  sentence: 'Postaramy się odpowiedzieć jak najszybciej.',
};

export const facebook = {
  label: 'Facebook',
  href: 'https://www.facebook.com/biurorachunkoweimazur',
};

export const brandName = 'Biuro Rachunkowe Iwona Mazur';

export const legalName = 'Biuro Rachunkowe Iwona Mazur sp. k.';

export const registry = {
  taxId: '8722438313',
  courtRegister: '0000987798',
  statisticalId: '522859570',
  taxAdvisorNumber: '12040',
};

export const geo = {
  latitude: 50.04941,
  longitude: 21.41465,
};
