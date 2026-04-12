import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'

const SafeTOCInline = (props: any) => {
  if (!props.toc || (Array.isArray(props.toc) && props.toc.length === 0)) {
    return null
  }
  return <TOCInline {...props} />
}

export const components: MDXComponents = {
  Image,
  TOCInline: SafeTOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
}
