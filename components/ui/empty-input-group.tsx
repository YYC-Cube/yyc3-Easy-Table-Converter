'use client'

import React from 'react'
import { SearchIcon } from 'lucide-react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'

export function EmptyInputGroup() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>404 - Not Found</EmptyTitle>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist. Try searching for
          what you need below.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="relative w-3/4">
          <Input placeholder="Try searching for pages..." className="pr-16" />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Kbd>/</Kbd>
          </div>
        </div>
        <EmptyDescription>
          Need help?{' '}
          <a href="#" className="text-primary underline underline-offset-4">
            Contact support
          </a>
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  )
}
