'use server'

import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const tagsString = formData.get('tags') as string

  if (!title || !content) {
    throw new Error('标题和内容不能为空')
  }

  // Generate unique slug
  let slug = generateSlug(title)
  const existingPost = await prisma.post.findUnique({
    where: { slug }
  })

  if (existingPost) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
  }

  // Parse tags
  const tagNames = tagsString
    ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    : []

  // Create or get tags
  const tags = await Promise.all(
    tagNames.map(async (name) => {
      return await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    })
  )

  // Create post with tags
  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      tags: {
        create: tags.map(tag => ({
          tagId: tag.id
        }))
      }
    }
  })

  revalidatePath('/')
  redirect(`/post/${slug}`)
}

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const tagsString = formData.get('tags') as string

  if (!title || !content) {
    throw new Error('标题和内容不能为空')
  }

  // Parse tags
  const tagNames = tagsString
    ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    : []

  // Get or create tags
  const tags = await Promise.all(
    tagNames.map(async (name) => {
      return await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    })
  )

  // Update post
  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      tags: {
        deleteMany: {},
        create: tags.map(tag => ({
          tagId: tag.id
        }))
      }
    }
  })

  const post = await prisma.post.findUnique({
    where: { id },
    select: { slug: true }
  })

  revalidatePath('/')
  revalidatePath(`/post/${post?.slug}`)
  redirect(`/post/${post?.slug}`)
}

export async function deletePost(id: string) {
  await prisma.post.delete({
    where: { id }
  })

  revalidatePath('/')
  redirect('/')
}

export async function searchPosts(query: string) {
  if (!query.trim()) {
    return await prisma.post.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  }

  // Check if query contains tag filter (starts with #)
  if (query.startsWith('#')) {
    const tagName = query.substring(1).trim()
    return await prisma.post.findMany({
      where: {
        tags: {
          some: {
            tag: {
              name: {
                contains: tagName
              }
            }
          }
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  }

  // General search in title and content
  return await prisma.post.findMany({
    where: {
      OR: [
        {
          title: {
            contains: query
          }
        },
        {
          content: {
            contains: query
          }
        }
      ]
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}