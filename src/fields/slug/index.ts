import type { CheckboxField, TextField } from 'payload'
import { formatSlug } from './formatSlug'

type Overrides = {
  slugOverrides?: Partial<TextField>
  checkboxOverrides?: Partial<CheckboxField>
}

type Slug = (fieldToUse?: string, overrides?: Overrides) => [TextField, CheckboxField]

export const slugField: Slug = (fieldToUse = 'title', overrides = {}) => {
  const { slugOverrides, checkboxOverrides } = overrides

  const checkBoxField: CheckboxField = {
    name: 'slugLock',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      hidden: true,
      position: 'sidebar',
    },
    ...checkboxOverrides,
  }

  // @ts-expect-error - ts mismatch Partial<TextField> with TextField
  const slugField: TextField = {
    name: 'slug',
    type: 'text',
    index: true,
    label: 'Slug',
    ...(slugOverrides || {}),
    hooks: {
      beforeChange: [
        ({ data, value, operation }) => {
          const isUnlocked = !data?.slugLock
          if (isUnlocked && data?.[fieldToUse] && typeof data[fieldToUse] === 'string') {
            // Use the manually entered value if it exists and differs from the default generated slug
            const defaultSlug = formatSlug(data[fieldToUse])
            const existingCustomId = data?.customId ? `-${data.customId}` : ''
            // Only append customId during create operation or if not already present
            if (operation === 'create' || !value?.includes(`-${data.customId}`)) {
              return `${defaultSlug}${existingCustomId}`
            }
            return value // Keep existing slug on update without re-adding customId
          }
          // If locked, return the existing value or let it be handled by default
          return value
        },
      ],
    },
    admin: {
      position: 'sidebar',
      ...(slugOverrides?.admin || {}),
      components: {
        Field: {
          path: '@/fields/slug/SlugComponent#SlugComponent',
          clientProps: {
            fieldToUse,
            checkboxFieldPath: checkBoxField.name,
          },
        },
      },
    },
  }

  return [slugField, checkBoxField]
}
