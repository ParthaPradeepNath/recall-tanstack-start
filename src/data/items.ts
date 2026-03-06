import { firecrawl } from "#/lib/firecrawl";
import { createServerFn } from "@tanstack/react-start";

export const scrapeUrlFn = createServerFn({ method: 'POST'}).handler(async () => {
    const result = await firecrawl.scrape('https://tanstack.com/start/latest',
        {
            formats: ['markdown'],
            onlyMainContent: true, // Only scrape the main content of the page
        }
    )
    console.log(result)
})