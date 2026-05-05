import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

import { db } from '../db/database'

afterEach(async () => {
  cleanup()

  await db.transaction('rw', db.routines, db.exerciseCatalog, db.sessions, db.appState, async () => {
    await Promise.all([db.routines.clear(), db.exerciseCatalog.clear(), db.sessions.clear(), db.appState.clear()])
  })
})
