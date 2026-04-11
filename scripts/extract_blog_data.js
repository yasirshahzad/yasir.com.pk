const fs = require('fs');
const path = require('path');

const blogDir = 'd:/Projects/yasir.com.pk/data/blog';
const outputFile = 'd:/Projects/yasir.com.pk/data/blog_data.json';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { metadata: {}, content };
  
  const yaml = match[1];
  const body = content.slice(match[0].length).trim();
  const metadata = {};
  
  yaml.split(/\r?\n/).forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      let value = valueParts.join(':').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      }
      metadata[key.trim()] = value;
    }
  });
  
  return { metadata, body };
}

const allFiles = getFiles(blogDir);
const data = allFiles.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const { metadata, body } = parseFrontmatter(content);
  const relativePath = path.relative(blogDir, file).replace(/\\/g, '/');
  const slug = relativePath.replace(/\.(mdx|md)$/, '');
  
  return {
    slug,
    path: relativePath,
    ...metadata,
    content: body
  };
});

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully created ${outputFile} with ${data.length} items.`);
