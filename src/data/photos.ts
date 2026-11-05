// Every photo slot on the site. Add a file to src/assets/photos/ with the slot's
// name (for example hero.jpg) and it replaces the placeholder automatically.
// The alt text describes each photo for screen readers and search engines, so
// update it if a photo shows something different.
export const photoAlt: Record<string, string> = {
  hero: 'A latte with leaf art on a marble table, between two small dishes of coffee beans',
  property: 'A wooden table and two white chairs by a sunlit window, with a steaming coffee and a vase of flowers',
  detail: 'A latte in a glass, a croissant and a brownie with ice cream on a marble table',
  menu: 'A barista pouring steamed milk into a coffee to make latte art at the counter',
  'gallery-1': 'An iced coffee with layers of milk and espresso in a takeaway cup with a straw',
  'gallery-2': 'A tall blue iced drink with lime, mint and a metal straw',
  'gallery-3': 'A creamy drink in a glass mug with caramel drizzle, whipped cream and sprinkles',
  'gallery-4': 'A tall red fizzy drink with a foamy top and a metal straw',
  'gallery-5': 'A tall coffee shake with chocolate sauce running down the glass',
  'gallery-6': 'A sparkling iced drink with lime and fresh mint leaves',
};

export const photoSlots = Object.keys(photoAlt);
