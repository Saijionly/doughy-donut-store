export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  badge?: string | null;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Strawberry Dream",
    slug: "strawberry-dream",
    category: "Donuts",
    description:
      "A soft and fluffy donut topped with sweet strawberry glaze and delicate sprinkles.",
    price: 149,
    image: "/products/strawberry-dream.png",
    featured: true,
    badge: "Best Seller",
  },

  {
    id: 2,
    name: "Chocolate Cloud",
    slug: "chocolate-cloud",
    category: "Donuts",
    description:
      "Rich chocolate-coated donut with a soft center and a deliciously sweet finish.",
    price: 159,
    image: "/products/chocolate-cloud.png",
    featured: true,
    badge: "Popular",
  },

  {
    id: 3,
    name: "Vanilla Bliss",
    slug: "vanilla-bliss",
    category: "Cupcakes",
    description:
      "Light vanilla cupcake topped with smooth creamy frosting and colorful sprinkles.",
    price: 129,
    image: "/products/vanilla-bliss.png",
    featured: true,
  },

  {
    id: 4,
    name: "Caramel Crunch",
    slug: "caramel-crunch",
    category: "Donuts",
    description:
      "Golden donut covered in creamy caramel glaze with a satisfying crunchy topping.",
    price: 159,
    image: "/products/caramel-crunch.png",
    featured: true,
    badge: "New",
  },

  {
    id: 5,
    name: "Cookies & Cream",
    slug: "cookies-cream",
    category: "Cupcakes",
    description:
      "Creamy vanilla cupcake finished with cookies and cream frosting and cookie crumbs.",
    price: 139,
    image: "/products/cookies-cream.png",
    featured: false,
  },

  {
    id: 6,
    name: "Red Velvet Dream",
    slug: "red-velvet",
    category: "Cakes",
    description:
      "Moist red velvet cake layered with smooth cream cheese frosting.",
    price: 189,
    image: "/products/red-velvet.png",
    featured: false,
  },

  {
    id: 7,
    name: "Blueberry Cream",
    slug: "blueberry-cream",
    category: "Donuts",
    description:
      "Fresh and fluffy donut topped with blueberry glaze and creamy drizzle.",
    price: 149,
    image: "/products/blueberry-cream.png",
    featured: false,
  },

  {
    id: 8,
    name: "Matcha Cloud",
    slug: "matcha-cloud",
    category: "Cupcakes",
    description:
      "Soft matcha cupcake with a smooth green tea cream topping.",
    price: 149,
    image: "/products/matcha-cloud.png",
    featured: false,
  },
];

export const categories = [
  "All",
  "Donuts",
  "Cakes",
  "Cupcakes",
];