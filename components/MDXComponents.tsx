import TOCInline from 'pliny/ui/TOCInline'
import AdvancedPre from './AdvancedPre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import QuizQuestion from './QuizQuestion'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SafeTOCInline = (props: { toc: any[]; [key: string]: any }) => {
  if (!props.toc || (Array.isArray(props.toc) && props.toc.length === 0)) {
    return null
  }
  return <TOCInline {...props} />
}

export const components: MDXComponents = {
  Image,
  TOCInline: SafeTOCInline,
  a: CustomLink,
  pre: AdvancedPre,
  table: TableWrapper,
  BlogNewsletterForm,
  QuizQuestion,
}
