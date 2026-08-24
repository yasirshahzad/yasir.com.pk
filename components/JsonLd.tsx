import siteMetadata from '@/data/siteMetadata'

export function WebSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteMetadata.headerTitle || siteMetadata.title,
    url: siteMetadata.siteUrl,
    description: siteMetadata.description,
    inLanguage: siteMetadata.language,
    publisher: {
      '@type': 'Person',
      name: siteMetadata.author,
      url: siteMetadata.siteUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteMetadata.siteUrl}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function PersonJsonLd() {
  const socialLinks = [
    siteMetadata.github,
    siteMetadata.linkedin,
    siteMetadata.x,
    siteMetadata.facebook,
    siteMetadata.instagram,
  ].filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteMetadata.author,
    url: siteMetadata.siteUrl,
    email: siteMetadata.email,
    jobTitle: 'Software Developer & Designer',
    worksFor: {
      '@type': 'Organization',
      name: siteMetadata.headerTitle,
    },
    sameAs: socialLinks,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BlogPostJsonLdProps {
  title: string
  summary?: string
  datePublished: string
  dateModified?: string
  url: string
  images?: string[]
  authorName?: string
}

export function BlogPostJsonLd({
  title,
  summary,
  datePublished,
  dateModified,
  url,
  images = [],
  authorName,
}: BlogPostJsonLdProps) {
  const formattedImages = images.length
    ? images.map((img) => (img.startsWith('http') ? img : `${siteMetadata.siteUrl}${img.startsWith('/') ? '' : '/'}${img}`))
    : [`${siteMetadata.siteUrl}${siteMetadata.socialBanner.startsWith('/') ? '' : '/'}${siteMetadata.socialBanner}`]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: summary || siteMetadata.description,
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    image: formattedImages,
    author: {
      '@type': 'Person',
      name: authorName || siteMetadata.author,
      url: siteMetadata.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.headerTitle || siteMetadata.title,
      url: siteMetadata.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteMetadata.siteUrl}/fav.png`,
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteMetadata.siteUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
