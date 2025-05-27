import { LiveProvider, LiveEditor, LivePreview, LiveError } from 'react-live'

import React from 'react'

type Props = { code: string }

export default function LiveCode({ code }: Props) {
  return (
    <LiveProvider code={code}>
      <div className="grid grid-cols-2 gap-4">
        <LiveEditor className="font-mono" />
        <LivePreview />
        <LiveError className="mt-2 bg-red-100 text-red-800" />
      </div>
    </LiveProvider>
  )
}
