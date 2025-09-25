'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface DeletePostButtonProps {
  action: (formData: FormData) => Promise<void>
}

export function DeletePostButton({ action }: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (formData: FormData) => {
    if (!confirm('确定要删除这篇笔记吗？此操作不可撤销。')) {
      return
    }

    setIsDeleting(true)
    try {
      await action(formData)
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form action={handleDelete}>
      <button
        type="submit"
        disabled={isDeleting}
        className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        <span>{isDeleting ? '删除中...' : '删除'}</span>
      </button>
    </form>
  )
}