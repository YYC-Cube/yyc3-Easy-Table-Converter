'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

export function SpinnerBadge() {
  return (
    <div className="flex items-center gap-2">
      <Badge>
        <Spinner className="mr-1" />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner className="mr-1" />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner className="mr-1" />
        Loading
      </Badge>
    </div>
  )
}
