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
            { title: 'Tester', value: 'tester' },
            { title: 'Company', value: 'company' }
          ]
        },
        validation: Rule => Rule.required()
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