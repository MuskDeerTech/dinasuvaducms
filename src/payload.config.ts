import { mongooseAdapter } from '@payloadcms/db-mongodb'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Tags } from './collections/Tags'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { s3Storage } from '@payloadcms/storage-s3'

// Dynamically set server URL based on environment
const serverURL =
  process.env.NODE_ENV === 'production' ? 'http://localhost:3000' : 'http://localhost:3000'
process.env.PAYLOAD_PUBLIC_SERVER_URL = serverURL
process.env.NEXT_PUBLIC_SERVER_URL = serverURL

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Define the allowed origins dynamically based on the environment
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['http://localhost:3000']
    : ['http://localhost:3000', 'http://localhost:3001']

// Debug: Log collections before initialization
const collections = [Pages, Posts, Media, Categories, Users, Tags]
collections.forEach((collection, index) => {
  if (!collection || !collection.slug) {
    throw new Error(`Collection at index ${index} is missing a slug`)
  }
})

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
    connectOptions: {
      // Add valid mongoose connect options here if needed
    },
  }),

  collections,
  cors: allowedOrigins,
  csrf: allowedOrigins,
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || '',
        endpoint: process.env.S3_ENDPOINT || '',
      },
      acl: 'public-read',
    }),
  ],

  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
