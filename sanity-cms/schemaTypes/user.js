export default {
    name: 'user',
    title: 'User',
    type: 'document',
    fields: [
      {
        name: 'username',
        title: 'Username',
        type: 'string',
        validation: Rule => Rule.required().unique()
      },
      {
        name: 'email',
        title: 'Email',
        type: 'string',
        validation: Rule => Rule.required().unique()
      },
      {
        name: 'userType',
        title: 'User Type',
        type: 'string',
        options: {
          list: [
            { title: 'Tester', value: 'Tester' },
            { title: 'Dev', value: 'Dev' }
          ]
        },
        validation: Rule => Rule.required()
      },
      {
        name: 'display_name',
        title: 'Display Name',
        type: 'string'
      },
      {
        name: 'created_at',
        title: 'Created At',
        type: 'datetime'
      },
      {
        name: 'followers',
        title: 'Followers',
        type: 'number',
        initialValue: 0
      },
      {
        name: 'following',
        title: 'Following',
        type: 'number',
        initialValue: 0
      },
      {
        name: 'profile_picture',
        title: 'Profile Picture',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'social_links',
        title: 'Social Links',
        type: 'string'
      },
      {
        name: 'isVerified',
        title: 'Email Verified',
        type: 'boolean',
        initialValue: false
      },
      {
        name: 'twoFactorEnabled',
        title: 'Two-Factor Authentication',
        type: 'boolean',
        initialValue: false
      }
    ],
    preview: {
      select: {
        title: 'username',
        subtitle: 'email'
      }
    }
  }