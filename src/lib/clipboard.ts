// navigator is not available in the server-side rendering
// so the code need to only run on client side
// But Tanstack is by default isomorphic (runs on both client and server)

import { createClientOnlyFn } from '@tanstack/react-start'
import { toast } from 'sonner'

/*
export const copyToClipboard = async(url: string) => {
    await navigator.clipboard.writeText(url)

    return
}
*/

export const copyToClipboard = createClientOnlyFn(async (url: string) => {
  await navigator.clipboard.writeText(url)

  toast.success('Copied to clipboard')
  return
})

// now this function will only run on client side, if server side execution tried it throws an error
