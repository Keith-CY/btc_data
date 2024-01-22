'use client'
import { Suspense } from 'react'
import Client from '@/app/client'
import Content from '@/app/content'

export default function Home() {
  return (
    <Client>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <Suspense>
          <Content />
        </Suspense>
      </main>
    </Client>
  )
}
