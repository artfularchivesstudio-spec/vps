// src/mocks/products.ts
import { Product } from '../types/Product';

export const products: Product[] = [
  {
    id: 1,
    title: "Swirling Colors",
    price: 200,
    image: "/swirling-colors.png",
    category: "Abstract",
  },
  {
    id: 2,
    title: "Mountain Serenity",
    price: 300,
    image: "/mountain-serenity.png",
    category: "Landscape",
  },
  {
    id: 3,
    title: "Calm Portrait",
    price: 150,
    image: "/calm-portrait.png",
    category: "Portrait",
  },
  {
    id: 4,
    title: "Fruit Bowl",
    price: 100,
    image: "/fruit-bowl.png",
    category: "Still Life",
  },
  // Add more products as needed...
];
