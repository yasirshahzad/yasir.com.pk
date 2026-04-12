'use server'

import { createPost, updatePost, deletePost } from 'lib/db/posts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function savePostAction(formData: FormData) {
  const slug = formData.get('slug') as string
  const isEditing = formData.get('isEditing') === 'true'
  const originalSlug = formData.get('originalSlug') as string

  const postData = {
    title: formData.get('title') as string,
    slug: slug,
    date: formData.get('date') as string,
    tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean),
    summary: formData.get('summary') as string,
    content: formData.get('content') as string,
    draft: formData.get('draft') === 'on',
    layout: formData.get('layout') as string || 'PostLayout',
    authors: (formData.get('authors') as string || 'default').split(',').map(a => a.trim()).filter(Boolean),
  }

  if (isEditing && originalSlug) {
    await updatePost(originalSlug, postData)
  } else {
    await createPost(postData)
  }

  revalidatePath('/admin')
  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  
  redirect('/admin')
}

export async function deletePostAction(slug: string) {
  await deletePost(slug)
  revalidatePath('/admin')
  revalidatePath('/blog')
  redirect('/admin')
}
