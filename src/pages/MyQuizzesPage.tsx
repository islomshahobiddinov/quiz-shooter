import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { MyQuizzes } from '../components/MyQuizzes'
import { QuizEditor } from '../components/QuizEditor'
import type { QuizTopic, UserQuiz } from '../lib/quizzesApi'

type Props = {
  user: User
  userLabel: string
  onStartTopic: (quiz: QuizTopic) => void
  onCreateLobby: (quiz: QuizTopic) => void
}

export function MyQuizzesPage({ user, onStartTopic, onCreateLobby }: Props) {
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
      onPlay={(quiz) => onStartTopic(quiz)}
      onEdit={(quiz) => {
        setEditingQuiz(quiz)
        setEditorOpen(true)
      }}
      onCreate={() => {
        setEditingQuiz(null)
        setEditorOpen(true)
      }}
      onOpenLobby={(quiz) => onCreateLobby(quiz)}
    />
  )
}
