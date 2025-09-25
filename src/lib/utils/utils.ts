import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string): string {
  // Create a more URL-friendly slug
  let slug = title
    .toLowerCase()
    .trim()
    // Replace Chinese characters with pinyin-like equivalents or remove them
    .replace(/[\u4e00-\u9fff]/g, '') // Remove Chinese characters for now
    // Keep only alphanumeric characters, spaces, and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
  
  // If slug is empty after cleaning, create a fallback
  if (!slug || slug.length === 0) {
    // Use current timestamp for unique identifier
    slug = 'post-' + Date.now().toString(36)
  }
  
  // Ensure slug is not too long
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-+$/, '')
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