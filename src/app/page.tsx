'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// "/" → Dashboard. next.config redirects handle this on a server; static hosting relies on this page.
export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return null
}
