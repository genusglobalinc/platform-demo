export default {
    name: 'user',
    title: 'User',
    type: 'document',
    fields: [
      {
        name: 'username',
        title: 'Username',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'email',
        title: 'Email',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'user_type',
        title: 'User Type',
        type: 'string',
        options: {
          list: [
            { title: 'Tester', value: 'Tester' },
            { title: 'Dev', value: 'Dev' },
            { title: 'Admin', value: 'Admin' }
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
        title: 'Profile Picture URL',
        type: 'string'
      },
      {
        name: 'social_links',
        title: 'Social Links',
        type: 'string'
      },
      {
        name: 'is_verified',
        title: 'Email Verified',
        type: 'boolean',
        initialValue: false
      },
      {
        name: 'twoFactorEnabled',
        title: 'Two-Factor Authentication',
        type: 'boolean',
        initialValue: false
      },
      {
        name: 'demographic_info',
        title: 'Demographic Info',
        type: 'object',
        fields: [
          { name: 'age', title: 'Age Range', type: 'string' },
          { name: 'gender', title: 'Gender', type: 'string' },
          { name: 'location_city', title: 'Location City', type: 'string' },
          { name: 'location_state', title: 'Location State', type: 'string' },
          { name: 'preferred_platforms', title: 'Preferred Platforms', type: 'array', of: [{ type: 'string' }] },
          { name: 'gaming_experience', title: 'Gaming Experience', type: 'string' },
          { name: 'favorite_genres', title: 'Favorite Genres', type: 'array', of: [{ type: 'string' }] },
          { name: 'weekly_playtime', title: 'Weekly Playtime', type: 'string' },
          { name: 'previous_playtest_experience', title: 'Previous Playtest Experience', type: 'text' }
        ]
      },
      {
        name: 'last_steam_sync',
        title: 'Last Steam Sync',
        type: 'string',
        description: 'Make sure to convert to number in frontend code if needed'
      },
      {
        name: 'steam_profile',
        title: 'Steam Profile',
        type: 'object',
        fields: [
          { name: 'avatar', title: 'Avatar URL', type: 'url' },
          { name: 'persona_name', title: 'Persona Name', type: 'string' },
          { name: 'steam_id', title: 'Steam ID', type: 'string' },
          { name: 'profile_url', title: 'Profile URL', type: 'url' },
          { name: 'visibility', title: 'Visibility', type: 'number' },
          { name: 'game_extra_info', title: 'Game Extra Info', type: 'string' },
          { name: 'game_id', title: 'Game ID', type: 'string' },
          { name: 'loc_city_id', title: 'City ID', type: 'string' },
          { name: 'loc_country_code', title: 'Country Code', type: 'string' },
          { name: 'loc_state_code', title: 'State Code', type: 'string' },
          { name: 'primary_clan_id', title: 'Primary Clan ID', type: 'string' },
          { name: 'profile_state', title: 'Profile State', type: 'number' },
          { name: 'real_name', title: 'Real Name', type: 'string' },
          { name: 'time_created', title: 'Time Created', type: 'number', description: 'Unix timestamp' },
          { name: 'last_logoff', title: 'Last Logoff', type: 'number', description: 'Unix timestamp' },
          { name: 'vanity_input', title: 'Vanity Input', type: 'string' },
          {
            name: 'debug',
            title: 'Debug Info',
            type: 'object',
            fields: [
              { name: 'vanity_input', title: 'Vanity Input', type: 'string' },
              { 
                name: 'api_response', 
                title: 'API Response', 
                type: 'object',
                fields: [
                  { 
                    name: 'response', 
                    title: 'Response', 
                    type: 'object',
                    fields: [
                      { 
                        name: 'players', 
                        title: 'Players', 
                        type: 'array',
                        of: [{
                          type: 'object',
                          fields: [
                            { name: 'avatar', title: 'Avatar', type: 'string' },
                            { name: 'avatarfull', title: 'Avatar Full', type: 'string' },
                            { name: 'avatarhash', title: 'Avatar Hash', type: 'string' },
                            { name: 'avatarmedium', title: 'Avatar Medium', type: 'string' },
                            { name: 'communityvisibilitystate', title: 'Community Visibility State', type: 'number' },
                            { name: 'lastlogoff', title: 'Last Logoff', type: 'number' },
                            { name: 'personaname', title: 'Persona Name', type: 'string' },
                            { name: 'personastate', title: 'Persona State', type: 'number' },
                            { name: 'personastateflags', title: 'Persona State Flags', type: 'number' },
                            { name: 'primaryclanid', title: 'Primary Clan ID', type: 'string' },
                            { name: 'profilestate', title: 'Profile State', type: 'number' },
                            { name: 'profileurl', title: 'Profile URL', type: 'string' },
                            { name: 'steamid', title: 'Steam ID', type: 'string' },
                            { name: 'timecreated', title: 'Time Created', type: 'number' }
                          ]
                        }]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    preview: {
      select: {
        title: 'username',
        subtitle: 'email'
      }
    }
  }