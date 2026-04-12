const fs = require('fs');
const path = require('path');

const blogDir = 'd:/Projects/yasir.com.pk/data/blog';
const outputFile = 'd:/Projects/yasir.com.pk/data/blog_data.json';

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
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
  // More robust frontmatter extraction
  const parts = content.split(/---+\r?\n/);
  if (parts.length < 3) {
    // If no frontmatter delimiter found, try just a very simple check
    return { metadata: {}, body: content };
  }
  
  const yaml = parts[1];
  const body = parts.slice(2).join('---').trim();
  const metadata = {};
  
  yaml.split(/\r?\n/).forEach(line => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex !== -1) {
      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      }
      metadata[key] = value;
    }
  });
  
  return { metadata, body };
}

const allFiles = getFiles(blogDir);
console.log(`Analyzing ${allFiles.length} files...`);

const data = allFiles.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const { metadata, body } = parseFrontmatter(content);
  const relativePath = path.relative(blogDir, file).replace(/\\/g, '/');
  const slug = relativePath.replace(/\.(mdx|md)$/, '');
  
  if (!metadata.title) {
    console.warn(`⚠️ Warning: No title found for ${relativePath}`);
  }
  
  return {
    slug,
    path: relativePath,
    ...metadata,
    content: body
  };
});

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully created ${outputFile} with ${data.length} items.`);
