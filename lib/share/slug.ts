import crypto from "crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const LENGTH = 12;

export function generateShareSlug() {
  const random = crypto.randomBytes(LENGTH);
  let slug = "";
  for (let i = 0; i < LENGTH; i += 1) {
    const index = random[i] % ALPHABET.length;
    slug += ALPHABET[index];
  }
  return slug;
}
