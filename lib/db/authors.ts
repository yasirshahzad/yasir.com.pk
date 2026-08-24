import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const authorsDir = path.join(process.cwd(), 'data/authors')

export function getAllAuthors() {
  const files = fs.readdirSync(authorsDir)
  return files.map((file) => {
    const filePath = path.join(authorsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(fileContent)
    return {
      ...data,
      slug: file.replace(/\.mdx?$/, ''),
    }
  })
}

export function getAuthorBySlug(slug: string) {
  const filePath = path.join(authorsDir, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  return {
    ...data,
    content,
    slug,
  }
}
