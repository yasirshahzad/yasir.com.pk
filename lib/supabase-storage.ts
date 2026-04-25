import { createClient } from '@/utils/supabase/client'

export const BUCKET_NAME = 'blog-images'

/**
 * Uploads a file to Supabase storage.
 * @param file The file object to upload.
 * @param path Optional path within the bucket (e.g. 'posts/my-post/image.jpg')
 * @returns The public URL of the uploaded file.
 */
export async function uploadImage(file: File, path?: string) {
  const supabase = createClient()

  // Generate a unique filename if not provided
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  const filePath = path ? `${path}/${fileName}` : fileName

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Lists all images in the bucket.
 */
export async function listImages(path = '') {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'desc' },
  })

  if (error) throw error

  // Combine with public URLs
  const images = data.map((file) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path ? `${path}/${file.name}` : file.name)

    return {
      ...file,
      url: publicUrl,
    }
  })

  return images
}

/**
 * Deletes an image from storage.
 */
export async function deleteImage(path: string) {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) throw error
  return true
}
