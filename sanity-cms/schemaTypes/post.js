import React from 'react'

export default {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required()
    },
    {
      name: 'postType',
      title: 'Post Type',
      type: 'string',
      options: {
        list: [
          { title: 'Gaming', value: 'gaming' }
        ]
      },
      initialValue: 'gaming'
    },
    {
      name: 'date',
      title: 'Event Date',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'advertisingTags',
      title: 'Advertising Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tags added after payment'
    },
    {
      name: 'studio',
      title: 'Studio',
      type: 'string'
    },
    {
      name: 'bannerImage',
      title: 'Banner Image',
      type: 'object',
      fields: [
        {
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true }
        },
        {
          name: 'url',
          title: 'URL',
          type: 'url'
        }
      ],
      validation: Rule => Rule.required()
    },
    {
      name: 'images',
      title: 'Additional Images',
      type: 'array',
      of: [{ type: 'image' }]
    },
    {
      name: 'access_instructions',
      title: 'Access Instructions',
      type: 'text',
      description: 'Instructions given to testers to access the build'
    },
    {
      name: 'rewards',
      title: 'Rewards',
      type: 'string',
      description: 'Any incentives for testers (gift cards, keys, etc.)'
    },
    {
      name: 'has_nda',
      title: 'NDA Required',
      type: 'boolean',
      description: 'Does this test require signing an NDA?'
    },
    {
      name: 'share_post_to_socials',
      title: 'Share Post To Socials',
      type: 'boolean',
      description: 'Whether the post should be auto-shared to socials when approved',
      initialValue: false
    },
    {
      name: 'registrants',
      title: 'Registrants',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'user_id', title: 'User ID', type: 'string' },
            { name: 'name', title: 'Name', type: 'string' },
            { name: 'email', title: 'Email', type: 'string' },
            { name: 'registered_at', title: 'Registered At', type: 'datetime' }
          ]
        }
      ],
      readOnly: true,
      description: 'Users who signed up for this test event'
    },
    {
      name: 'testerId',
      title: 'Tester ID',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'createdBy',
      title: 'Created By',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'status',
      title: 'Post Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' }
        ]
      },
      initialValue: 'draft'
    },
    {
      name: 'is_approved',
      title: 'Is Approved',
      type: 'boolean',
      description: 'Whether this post has been approved by an admin',
      initialValue: false
    }
  ],
  preview: {
    select: {
      title: 'title',
      studio: 'studio',
      media: 'bannerImage'
    },
    prepare(selection) {
      const { title, studio, media } = selection
      const image = media?.image?.asset || media?.url
      const alt = title || 'banner'
      const mediaComponent = image
        ? () => React.createElement('img', {
            src: image,
            alt,
            style: { objectFit: 'cover', width: '100%', height: '100%' },
          })
        : undefined
      return {
        title,
        subtitle: studio,
        media: mediaComponent
      }
    }
  }
}