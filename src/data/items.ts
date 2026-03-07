import { prisma } from '#/db'
import { firecrawl } from '#/lib/firecrawl'
import { extractSchema, importSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import type z from 'zod'
import { authFnMiddleware } from '#/middlewares/auth'

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
        onlyMainContent: true, // Only scrape the main content of the page
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
