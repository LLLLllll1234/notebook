import { Post, Tag, TagOnPost } from '@prisma/client'

export type PostWithTags = Post & {
  tags: (TagOnPost & {
    tag: Tag
  })[]
}

export type PostFormData = {
  title: string
  content: string
  tags: string
}