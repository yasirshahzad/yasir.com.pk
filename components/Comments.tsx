'use client'

import { useState, useEffect } from 'react'
import { addComment, getComments, deleteComment } from '@/app/actions/commentActions'
import { createClient } from '@/utils/supabase/client'

type Comment = {
  id: number
  content: string
  userId: string | null
  parentId: number | null
  createdAt: string | Date | null
  user: {
    fullName: string | null
    avatarUrl: string | null
  } | null
}

interface CommentsProps {
  postId: number
}

export default function Comments({ postId }: CommentsProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const fetchComments = async () => {
    const res = await getComments(postId)
    if (res.success && res.data) {
      setComments(res.data)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    const res = await deleteComment(id)
    if (res.success) {
      await fetchComments()
    } else {
      alert(res.error || 'Failed to delete comment')
    }
  }

  useEffect(() => {
    fetchComments()
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Fetch role from profile
        const { data: profile } = await supabase
          .from('reader_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setCurrentUser({ ...user, role: profile?.role || 'user' })
      } else {
        setCurrentUser(null)
      }
    })
  }, [postId])

  const handleSubmit = async (parentId?: number) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    setIsSubmitting(true)
    const res = await addComment(postId, content, parentId)
    if (res.success) {
      if (parentId) {
        setReplyContent('')
        setReplyingTo(null)
      } else {
        setNewComment('')
      }
      await fetchComments()
    } else {
      alert(res.error || 'Failed to post comment')
    }
    setIsSubmitting(false)
  }

  // Simple threading logic
  const rootComments = comments.filter(c => !c.parentId)
  const getReplies = (parentId: number) => comments.filter(c => c.parentId === parentId)

  return (
    <div className="mt-16 space-y-8 border-t border-gray-100 pt-10 dark:border-gray-800">
      <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
        Discussion ({comments.length})
      </h3>

      {/* Main Comment Form */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full rounded-2xl border-gray-100 bg-gray-50 p-4 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !newComment.trim()}
            className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {rootComments.length === 0 && !isSubmitting && (
          <p className="text-center text-sm text-gray-500">No comments yet. Be the first to start the conversation!</p>
        )}

        {rootComments.map((comment) => (
          <div key={comment.id} className="group space-y-4">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold dark:bg-primary-900/30 dark:text-primary-400">
                {comment.user?.fullName?.[0] || (comment.userId ? 'U' : 'A')}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {comment.user?.fullName || (comment.userId ? 'Registered User' : 'Anonymous')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{comment.content}</p>
                
                <div className="flex gap-4 pt-1">
                  <button 
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Reply
                  </button>
                  {(currentUser?.role === 'admin' || currentUser?.id === comment.userId) && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-primary-100 dark:border-primary-900">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full rounded-xl border-gray-100 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-900"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setReplyingTo(null)} className="text-xs font-bold text-gray-500">Cancel</button>
                      <button 
                        onClick={() => handleSubmit(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                        className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                <div className="mt-4 space-y-4 pl-8 border-l border-gray-100 dark:border-gray-800">
                  {getReplies(comment.id).map(reply => (
                    <div key={reply.id} className="space-y-1">
                       <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {reply.user?.fullName || (reply.userId ? 'Registered User' : 'Anonymous')}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                      {(currentUser?.role === 'admin' || currentUser?.id === reply.userId) && (
                        <button 
                          onClick={() => handleDelete(reply.id)}
                          className="mt-1 text-[10px] font-bold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
