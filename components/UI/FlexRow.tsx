import clsx from 'clsx'
import React from 'react'

const FlexRow = ({
  className,
  children,
  paddingBottom,
  justify
}: {
  className?: string
  children: React.ReactNode
  justify?: string
  paddingBottom?: string
}) => {
  const classes = ['align-start', 'w-full', 'flex', 'flex-row', 'gap-[8px]']

  if (justify === 'flex-end') {
    classes.push('justify-end')
  } else if (justify === 'center') {
    classes.push('justify-center')
  } else {
    classes.push('justify-start')
  }

  if (paddingBottom) {
    classes.push(`pb-[${paddingBottom}]`)
  }

  return <div className={clsx(classes, className)}>{children}</div>
}

export default FlexRow
