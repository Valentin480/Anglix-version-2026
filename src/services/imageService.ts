
export async function fetchUnsplashImage(query: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    // LoremFlickr is a good free alternative for keyword-based images
    return `https://loremflickr.com/800/600/${encodedQuery}`;
  } catch (e) {
    return `https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80`;
  }
}
