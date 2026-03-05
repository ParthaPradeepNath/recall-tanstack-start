import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/import')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex flex-1 items-center justify-center py-8'>
      <div className=''>

      </div>
    </div>
  )
}
