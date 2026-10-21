/// <reference types="vite/client" />

import type { PresenceStudioApi } from '../../shared/types'

declare global {
  interface Window {
    presenceStudio: PresenceStudioApi
  }
}

export {}
