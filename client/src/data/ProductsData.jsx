import { furnitureItems } from './FurnitureItems';

export const initialProducts = furnitureItems.map((item) => ({
  id: String(item.id),
  name: item.title,
  price: item.price,
  image: item.image,
  category: item.category,
  description: item.description || '',
  material: item.material || '',
  inStock: item.inStock ?? true,
  rating: item.rating || 0,
  reviews: item.reviews || 0,
}));

export const categories = ['Sofas', 'Tables', 'Chairs', 'Beds', 'Lighting'];

export const emptyProduct = {
  name: '',
  price: 0,
  image: '',
  category: '',
  description: '',
  material: '',
  inStock: true,
  rating: 0,
  reviews: 0,
};
