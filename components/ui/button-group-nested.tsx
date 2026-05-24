'use client'

import React from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ButtonGroup,
} from '@/components/ui/button-group'

export function ButtonGroupNested() {
  return (
    <ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon" aria-label="Previous">
          <ArrowLeftIcon className="size-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next">
          <ArrowRightIcon className="size-4" />
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  )
}
