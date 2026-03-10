import { prisma } from '#/db'
import { firecrawl } from '#/lib/firecrawl'
import { bulkImportSchema, extractSchema, importSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { authFnMiddleware } from '#/middlewares/auth'
import { notFound } from '@tanstack/react-router'
import { generateText } from 'ai'
import { openrouter } from '#/lib/openRouter'

// Server Function
export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware]) // Add an middleware or pass it in array because the we can pass multiple of them to check for different diff things like checking the user for rate limiting , auth etc and also when you add your middleware they get executed in order
  .inputValidator(importSchema)
  .handler(async ({ data, context }) => {
    const item = await prisma.savedItem.create({
      data: {
        url: data.url,
        userId: context.session.user.id,
        status: 'PROCESSING',
      },
    })

    try {
      const result = await firecrawl.scrape(data.url, {
        formats: [
          'markdown',
          {
            type: 'json',
            schema: extractSchema,
            // prompt: 'please extract the author and also publishedAt timestamp'
          },
        ],
        location: { country: 'US', languages: ['en'] },
        onlyMainContent: true, // Only scrape the main content of the page
        proxy: 'auto',
      })

      const jsonData = result.json as z.infer<typeof extractSchema>

      let publishedAt = null

      if (jsonData.publishedAt) {
        const parsed = new Date(jsonData.publishedAt)

        if (isNaN(parsed.getTime())) {
          publishedAt = parsed
        }
      }

      const updatedItem = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          // if any of the fields are not present then the whole thing failed so we put OR null means make it null if that particular field is not present
          title: result.metadata?.title || null,
          content: result.markdown || null,
          ogImage: result.metadata?.ogImage || null,
          author: jsonData.author || null,
          publishedAt: publishedAt,
          status: 'COMPLETED',
        },
      })
      return updatedItem
    } catch {
      const failedItem = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          status: 'FAILED',
        },
      })
      return failedItem
    }
  })

export const mapUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(bulkImportSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.map(data.url, {
      limit: 25,
      search: data.search,
      location: {
        country: 'US',
        languages: ['en'],
      },
    })

    return result.links
  })

// POST = not getting data but we want to mutate/update the data
export const bulkScrapeUrlsFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.string().url()),
    }),
  )
  .handler(async ({ data, context }) => {
    for (let i = 0; i < data.urls.length; i++) {
      const url = data.urls[i] // we get the single url from the array by this i iterator

      const item = await prisma.savedItem.create({
        data: {
          url: url,
          userId: context.session.user.id,
          status: 'PENDING',
        },
      })

      try {
        const result = await firecrawl.scrape(url, {
          formats: [
            'markdown',
            {
              type: 'json',
              schema: extractSchema,
              // prompt: 'please extract the author and also publishedAt timestamp'
            },
          ],
          location: { country: 'US', languages: ['en'] },
          onlyMainContent: true, // Only scrape the main content of the page
          proxy: 'auto',
        })

        const jsonData = result.json as z.infer<typeof extractSchema>

        let publishedAt = null

        if (jsonData.publishedAt) {
          const parsed = new Date(jsonData.publishedAt)

          if (isNaN(parsed.getTime())) {
            publishedAt = parsed
          }
        }

        await prisma.savedItem.update({
          where: {
            id: item.id,
          },
          data: {
            // if any of the fields are not present then the whole thing failed so we put OR null means make it null if that particular field is not present
            title: result.metadata?.title || null,
            content: result.markdown || null,
            ogImage: result.metadata?.ogImage || null,
            author: jsonData.author || null,
            publishedAt: publishedAt,
            status: 'COMPLETED',
          },
        })
        // return updatedItem -> becaus return will break the for loop iteration cycle
      } catch {
        await prisma.savedItem.update({
          where: {
            id: item.id,
          },
          data: {
            status: 'FAILED',
          },
        })
      }
    }
  })

// creating server function to get data
export const getItemsFn = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    // await new Promise((resolve) => setTimeout(resolve, 3000))
    const items = await prisma.savedItem.findMany({
      where: {
        userId: context.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return items
  })

  export const getItemsById = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(
    async ({ data, context }) => {
      const item = await prisma.savedItem.findUnique({
        where: {
          userId: context.session.user.id,
          id: data.id,
        }
      })

      if (!item) {
        throw notFound()
      }

      return item
    }
  )

  export const saveSummaryAndGenerateTagsFn = createServerFn({
    method: 'POST',
  })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({
    id: z.string(),
    summary: z.string(),
  })
)
.handler(async ({context, data}) => {
  const existing = await prisma.savedItem.findUnique({
    where: {
      id: data.id,
      userId: context.session.user.id,
    },
  })

  if (!existing) {
    throw notFound()
  }

  const {text} = await generateText({
    model: openrouter.chat('z-ai/glm-4.5-air:free'),
    system: `You are a helpful assistant that extracts relevant tags from content summaries.
    Extract 3-5 short, relevant tags that categorize the content.
    Return ONLY a comma-separated list of tags, nothing else.
    Example: technology, programming, web development, javascript`,
    prompt: `Extract tags from the summary: \n\n${data.summary}`,
  })

  const tags = text.split(',').map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)
  .slice(0, 5)

  const item = await prisma.savedItem.update({
    where: {
      userId: context.session.user.id,
      id: data.id
    },
    data: {
      summary: data.summary,
      tags: tags,
    }
  })

  return item
})