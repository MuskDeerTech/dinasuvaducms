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
// import { getServerSideURL } from './utilities/getURL'
import { s3Storage } from '@payloadcms/storage-s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Define the allowed origins dynamically based on the environment
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://aesthetic-swan-5095dd.netlify.app/p']
    : ['http://localhost:3000', 'http://localhost:3001']

// Debug: Log environment variables to ensure they're set correctly
console.log('Debug: Environment Variables Check')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set')
console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Set' : 'Not Set')
console.log('S3_BUCKET:', process.env.S3_BUCKET ? 'Set' : 'Not Set')
console.log('S3_ACCESS_KEY_ID:', process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Not Set')
console.log('S3_SECRET_ACCESS_KEY:', process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Not Set')
console.log('S3_REGION:', process.env.S3_REGION ? 'Set' : 'Not Set')
console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT ? 'Set' : 'Not Set')

// Debug: Log collections before initialization
const collections = [Pages, Posts, Media, Categories, Users, Tags]
console.log('Debug: Collections Before Initialization')
collections.forEach((collection, index) => {
  console.log(`Collection ${index}:`, collection?.slug || 'undefined')
  if (!collection || !collection.slug) {
    console.error(`Error: Collection at index ${index} is invalid:`, collection)
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
  // Debug: Log when Payload is fully initialized
  onInit: async () => {
    console.log('Debug: Payload CMS initialized successfully')
  },
})
