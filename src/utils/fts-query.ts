export function sanitizeFtsInput(input: string): string {
  return input.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildFtsQueryVariants(input: string): string[] {
  const sanitized = sanitizeFtsInput(input);
  const words = sanitized.split(/\s+/).filter(Boolean);

  if (words.length === 0) return [];
  if (words.length === 1) return [words[0], `${words[0]}*`];

  return [
    `"${sanitized}"`,
    words.join(' AND '),
    `${words.slice(0, -1).join(' AND ')} AND ${words[words.length - 1]}*`,
  ];
}
