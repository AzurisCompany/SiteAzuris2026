import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostFrontmatter = {
  title: string;
  excerpt: string;
  date: string; // ISO yyyy-mm-dd
  cover?: string;
  tags?: string[];
  author?: string;
  property?: string; // qual site do ecossistema (hadoop.com.br, ETT, DSSBR…)
};

export type PostMeta = PostFrontmatter & {
  slug: string;
  readingMinutes: number;
};

export type Post = PostMeta & {
  content: string;
};

export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await fs.readdir(BLOG_DIR);
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx$/, "");
        const raw = await fs.readFile(path.join(BLOG_DIR, f), "utf8");
        const { data, content } = matter(raw);
        const fm = data as PostFrontmatter;
        return {
          ...fm,
          slug,
          readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
        } satisfies PostMeta;
      }),
  );

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const raw = await fs.readFile(path.join(BLOG_DIR, `${slug}.mdx`), "utf8");
    const { data, content } = matter(raw);
    const fm = data as PostFrontmatter;
    return {
      ...fm,
      slug,
      content,
      readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    };
  } catch {
    return null;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const files = await fs.readdir(BLOG_DIR);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
