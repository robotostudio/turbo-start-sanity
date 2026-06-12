import { mkdir, readdir, rm, stat, copyFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDir, '..')
const sourceRoot = join(packageRoot, 'src')

const options = parseArgs({
  args: process.argv.slice(2).filter((argument) => argument !== '--'),
  options: {
    'file-prefix': {
      type: 'string',
    },
    'target-root': {
      type: 'string',
    },
  },
})

const targetRootArg = options.values['target-root']?.trim()
const rawFilePrefix = options.values['file-prefix']

if (!targetRootArg) {
  throw new Error('sync-thumbnails requires --target-root')
}

if (typeof rawFilePrefix !== 'string' || rawFilePrefix.trim() === '') {
  throw new Error('sync-thumbnails requires --file-prefix')
}

const filePrefix = rawFilePrefix.trim()
if (/[/\\]/.test(filePrefix) || filePrefix.includes('..')) {
  throw new Error(
    'sync-thumbnails --file-prefix must not contain path separators or ".."',
  )
}
const targetRoot = resolve(packageRoot, targetRootArg)
const allowedRoot = resolve(packageRoot, '..', '..')
const rel = relative(allowedRoot, targetRoot)

if (isAbsolute(rel) || rel.startsWith('..')) {
  throw new Error('sync-thumbnails --target-root must be inside workspace root')
}

const generatedFileName = (directoryName: string) =>
  `${filePrefix}${directoryName}.png`

const syncThumbnails = async () => {
  await mkdir(targetRoot, { recursive: true })

  const existingEntries = await readdir(targetRoot, { withFileTypes: true })
  await Promise.all(
    existingEntries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith(filePrefix) &&
          entry.name.endsWith('.png'),
      )
      .map((entry) => rm(join(targetRoot, entry.name), { force: true })),
  )

  const entries = await readdir(sourceRoot, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        if (
          entry.name.trim() === '' ||
          /[/\\]/.test(entry.name) ||
          /^\.+$/.test(entry.name)
        ) {
          return
        }

        const sourceFile = join(sourceRoot, entry.name, 'thumbnail.png')

        try {
          const thumbnailStats = await stat(sourceFile)
          if (!thumbnailStats.isFile()) {
            return
          }
        } catch {
          return
        }

        const targetFile = join(targetRoot, generatedFileName(entry.name))
        await copyFile(sourceFile, targetFile)
      }),
  )
}

await syncThumbnails()
