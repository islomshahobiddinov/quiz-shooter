import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { MyQuizzes } from '../components/MyQuizzes'
import { QuizEditor } from '../components/QuizEditor'
import type { UserQuiz } from '../lib/quizzesApi'

type Props = {
  user: User
  userLabel: string
}

export function MyQuizzesPage({ user }: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<UserQuiz | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (editorOpen) {
    return (
      <QuizEditor
        userId={user.id}
        existing={editingQuiz}
        onSaved={() => {
          setEditorOpen(false)
          setEditingQuiz(null)
          setRefreshKey((k) => k + 1)
        }}
        onCancel={() => {
          setEditorOpen(false)
          setEditingQuiz(null)
        }}
      />
    )
  }

  return (
    <MyQuizzes
      refreshKey={refreshKey}
      onEdit={(quiz) => {
        setEditingQuiz(quiz)
        setEditorOpen(true)
      }}
      onCreate={() => {
        setEditingQuiz(null)
        setEditorOpen(true)
      }}
    />
  )
}
