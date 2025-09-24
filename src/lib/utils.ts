import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // Keep Chinese characters and basic characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  
  // If slug is empty or only hyphens, use a fallback
  if (!slug || slug === '' || /^-+$/.test(slug)) {
    return 'untitled-' + Date.now()
  }
  
  return slug
}

export function extractContent(content: string, maxLength: number = 150): string {
  // Remove markdown formatting and extract plain text
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()

  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}