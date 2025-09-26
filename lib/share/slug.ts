import { customAlphabet } from 'nanoid';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const nanoid = customAlphabet(ALPHABET, 12);

export function generateShareSlug() {
  return nanoid();
}
