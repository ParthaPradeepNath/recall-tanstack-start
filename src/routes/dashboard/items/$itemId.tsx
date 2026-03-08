import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '#/components/ui/collapsible'
import { getItemsById } from '#/data/items'
import { cn } from '#/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Calendar, ChevronDown, Clock, ExternalLink, User } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
  loader: ({ params }) => getItemsById({ data: { id: params.itemId } }),
})

function RouteComponent() {
  const data = Route.useLoaderData()

  const [contentOpen, setContentOpen] = useState(false)

  return (
    <div className="mx-auto max-w-3xl space-y-6 w-full">
      <div className="flex justify-start">
        <Link
          to="/dashboard/items"
          className={buttonVariants({
            variant: 'outline',
          })}
        >
          <ArrowLeft />
          Go Back
        </Link>
      </div>

      {data.ogImage && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            src={data.ogImage}
            alt={data.title ?? 'Article Thumbnail'}
          />
        </div>
      )}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {data.title ?? 'Untitled'}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {data.author && (
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
            </span>
          )}

          {data.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(data.publishedAt).toLocaleDateString('en-US')}
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            Saved {new Date(data.createdAt).toLocaleDateString('en-US')}
          </span>
        </div>

        {/* when need to redirect to an external website use "a" ,for internal redirect use "Link" */}
        <a
          href={data.url}
          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
          target="_blank"
        >
          View Original
          <ExternalLink className="size-3.5" />
        </a>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Badge>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Summary Section */}
        <p>edtfgbj</p>

        {/* Content Section */}
        {data.content && (
          <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
            <CollapsibleTrigger asChild>
              <Button value="outline" className='w-full justify-between'>
                <span className='font-medium'>Full Content</span>
                <ChevronDown className={cn(
                    contentOpen ? 'rotate-180' : '', 'size-4 transition-transform duration-200'
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <Card className='mt-2'>
                    <CardContent>
                        {data.content}
                    </CardContent>
                </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
7
