export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
  draft?: boolean;
  authors?: string[];
  layout?: string;
  images?: string[] | string;
  summary?: string;
  content: string;
  path: string;
  filePath?: string;
}

export interface Author {
  name: string;
  avatar?: string;
  occupation?: string;
  company?: string;
  email?: string;
  twitter?: string;
  bluesky?: string;
  linkedin?: string;
  github?: string;
  layout?: string;
  slug: string;
}
