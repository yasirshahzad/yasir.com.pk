export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const noOfWords = content.split(/\s+/).length;
  const minutes = noOfWords / wordsPerMinute;
  return Math.ceil(minutes);
}
