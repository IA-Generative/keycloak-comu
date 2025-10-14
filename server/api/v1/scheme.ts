defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          CreateGroupBody: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
          GroupAndUserBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
            },
            required: ['groupId', 'userId'],
          },
          GroupAndTeamBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
            },
            required: ['groupId', 'name'],
          },
          GroupTeamAndUserIdsBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            },
            required: ['groupId', 'name'],
          },
          GroupAndEmailBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
            },
            required: ['groupId', 'email'],
          },
          GroupAndTosBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              tos: { type: 'string' },
            },
            required: ['groupId', 'tos'],
          },
          GroupAndDescriptionBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              description: { type: 'string' },
            },
            required: ['groupId', 'description'],
          },
          GroupUserAndLevelBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              level: { type: 'string', enum: ['10', '20', '30'] },
            },
            required: ['groupId', 'userId'],
          },
          GroupBody: {
            type: 'object',
            properties: {
              groupId: { type: 'string', format: 'uuid' },
            },
            required: ['groupId'],
          },
          SearchGroupBody: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              exact: { type: 'boolean', default: false },
              page: { type: 'integer', minimum: 0, default: 0 },
              pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            },
            required: ['search'],
          },
          SearchUsersBody: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              excludeGroupId: { type: 'string', format: 'uuid' },
            },
            required: ['search'],
          },
          UserDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string' },
              email: { type: 'string', format: 'email' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
            },
          },
          MemberDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string' },
              email: { type: 'string', format: 'email' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              membershipLevel: { type: 'string', enum: ['10', '20', '30'] },
            },
          },
          ListUserDto: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserDto',
            },
          },
          TeamDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              members: { type: 'array', items: { type: 'string', format: 'uuid' } },
            },
          },
          GroupDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string' },
              tos: { type: 'string' },
              members: { type: 'array', items: { $ref: '#/components/schemas/MemberDto' } },
              teams: { type: 'array', items: { $ref: '#/components/schemas/TeamDto' } },
              invites: { type: 'array', items: { $ref: '#/components/schemas/UserDto' } },
              requests: { type: 'array', items: { $ref: '#/components/schemas/UserDto' } },
            },
          },
          MinimalGroupDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
          ListGroupDto: {
            type: 'object',
            properties: {
              joined: { type: 'array', items: { $ref: '#/components/schemas/MinimalGroupDto' } },
              invited: { type: 'array', items: { $ref: '#/components/schemas/MinimalGroupDto' } },
              requested: { type: 'array', items: { $ref: '#/components/schemas/MinimalGroupDto' } },
            },
          },
          GroupSearchDto: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              owners: { type: 'array', items: { $ref: '#/components/schemas/UserDto' } },
              description: { type: 'string' },
            },
          },
          PaginatedGroupSearchDto: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
              results: { type: 'array', items: { $ref: '#/components/schemas/GroupSearchDto' } },
              next: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
})
