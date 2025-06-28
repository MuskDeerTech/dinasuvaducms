import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
// const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
  hooks: {
    afterRead: [
      async ({ doc }) => {
        if (doc.filename) {
          const bucket = process.env.S3_BUCKET
          const region = process.env.S3_REGION
          const baseUrl = `https://${bucket}.${region}.digitaloceanspaces.com`
          doc.url = `${baseUrl}/${doc.filename}`
          if (doc.sizes) {
            Object.keys(doc.sizes).forEach((size) => {
              if (doc.sizes[size].filename) {
                doc.sizes[size].url = `${baseUrl}/${size}-${doc.filename}`
              }
            })
          }
        }
        return doc
      },
    ],
  },

  //   hooks: {
  //   afterRead: [
  //     async ({ doc }) => {
  //       if (doc.filename) {
  //         const baseUrl = `https://media.dinasuvadu.com` // Use the custom subdomain
  //         doc.url = `${baseUrl}/${doc.filename}`
  //         if (doc.sizes) {
  //           Object.keys(doc.sizes).forEach((size) => {
  //             if (doc.sizes[size].filename) {
  //               doc.sizes[size].url = `${baseUrl}/${size}-${doc.filename}`
  //             }
  //           })
  //         }
  //       }
  //       return doc
  //     },
  //   ],
  // },
}
