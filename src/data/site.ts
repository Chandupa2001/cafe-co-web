// The single source of truth for the cafe's details. Change them here and they
// update everywhere, including the links and the data Google reads.

const street = 'No. 230, Old Road';
const city = 'Maharagama';
const postcode = '10280';
const fullAddress = `${street}, ${city} ${postcode}`;
const mapsQuery = encodeURIComponent(`${street}, ${city} ${postcode}, Sri Lanka`);

const whatsappMessage = "Hi Cafe' Co.! I'd like to reserve a table or place an order.";

export const site = {
  // Replace with the real domain before launch. `npm run check:launch` flags this value.
  url: 'https://cafe-co.example',

  name: "Cafe' Co.",
  fullName: "Cafe' Co. by Virasha",
  tagline: 'Coffee. Calm. Connect.',
  foundingYear: '2026',

  address: { street, city, postcode, country: 'LK', full: fullAddress },

  phone: {
    display: '071 260 1949',
    international: '+94712601949',
  },

  hours: {
    opens: '10:00',
    closes: '20:00',
    display: '10 AM – 8 PM',
    days: 'Every day',
  },

  links: {
    directions: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
    mapEmbed: `https://www.google.com/maps?q=${mapsQuery}&output=embed`,
    whatsapp: `https://wa.me/94712601949?text=${encodeURIComponent(whatsappMessage)}`,
    call: 'tel:+94712601949',
    instagram: 'https://www.instagram.com/cafe_co._by_virasha/',
    instagramHandle: '@cafe_co._by_virasha',
    facebook: 'https://www.facebook.com/profile.php?id=61587797796023',
  },

  seo: {
    title: "Cafe' Co. by Virasha | Cosy Neighbourhood Cafe in Maharagama",
    description:
      "A cosy neighbourhood cafe in Maharagama, Sri Lanka. Good coffee, good food and a friendly welcome, every day from 10 AM to 8 PM at No. 230 Old Road.",
  },
};
