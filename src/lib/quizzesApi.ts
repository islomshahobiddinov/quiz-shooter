import { supabase } from './supabase'

export type QuizQuestion = {
  q: string
  a: string[]
  c: number
}

export type QuizTopic = {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
}

export type UserQuiz = QuizTopic & {
  created_at: string
  updated_at: string
}

type QuizRow = {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
  created_at: string
  updated_at: string
}

const fromRow = (row: QuizRow): UserQuiz => ({
  id: row.id,
  title: row.title,
  description: row.description ?? '',
  questions: row.questions ?? [],
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export async function listMyQuizzes(): Promise<UserQuiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, description, questions, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data as QuizRow[]).map(fromRow)
}

export type QuizDraft = {
  title: string
  description: string
  questions: QuizQuestion[]
}

export async function createQuiz(userId: string, draft: QuizDraft): Promise<UserQuiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      user_id: userId,
      title: draft.title,
      description: draft.description,
      questions: draft.questions,
    })
    .select('id, title, description, questions, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return fromRow(data as QuizRow)
}

export async function updateQuiz(id: string, draft: QuizDraft): Promise<UserQuiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .update({
      title: draft.title,
      description: draft.description,
      questions: draft.questions,
    })
    .eq('id', id)
    .select('id, title, description, questions, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return fromRow(data as QuizRow)
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', id)

  if (error) {
    throw error
  }
}
