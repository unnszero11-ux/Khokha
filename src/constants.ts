import { Gift, Artist } from "./types";

export const GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', value: 1, icon: '🌹' },
  { id: 'heart', name: 'Heart', value: 5, icon: '❤️' },
  { id: 'diamond', name: 'Diamond', value: 10, icon: '💎' },
  { id: 'car', name: 'Car', value: 50, icon: '🚗' },
  { id: 'rocket', name: 'Rocket', value: 100, icon: '🚀' },
  { id: 'castle', name: 'Castle', value: 500, icon: '🏰' },
];

export const ARTISTS: Artist[] = [
  { id: '1', name: 'Artist 1', category: 'pop', image: 'https://picsum.photos/seed/artist1/200/150' },
  { id: '2', name: 'Artist 2', category: 'hiphop', image: 'https://picsum.photos/seed/artist2/200/150' },
  { id: '3', name: 'Artist 3', category: 'rock', image: 'https://picsum.photos/seed/artist3/200/150' },
  { id: '4', name: 'Artist 4', category: 'jazz', image: 'https://picsum.photos/seed/artist4/200/150' },
];

export const AGORA_APP_ID = "e7f6e9aeecf14b2ba10e3f40be9f56e7";
