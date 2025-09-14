import Replicate from "replicate";

let replicate: Replicate | null = null;

if (process.env.REPLICATE_API_TOKEN) {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
} else {
  console.warn('Warning: REPLICATE_API_TOKEN is not set');
}

export default replicate;
