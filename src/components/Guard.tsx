import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function Guard({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const { session, loading } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!admin || !session) return
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)))
  }, [admin, session])

  if (loading || (admin && session && isAdmin === null)) {
    return <p className="p-8 text-center text-slate-500">Loading…</p>
  }
  if (!session) return <Navigate to={admin ? '/admin/login' : '/'} replace />
  if (admin && !isAdmin) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="mb-4">This account isn't an admin.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    )
  }
  return <>{children}</>
}
