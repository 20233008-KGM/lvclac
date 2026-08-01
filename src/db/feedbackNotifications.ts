import { supabase } from './supabaseClient'

export async function notifyNewFeedbackPost(postId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (error || !accessToken) return false

  try {
    const response = await fetch('/api/feedback/notify', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ postId }),
    })
    return response.ok
  } catch {
    return false
  }
}
