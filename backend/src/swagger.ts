export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Platform Cloud API',
    version: '1.0.0',
    description: 'API documentation for Platform Cloud image management platform'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          username: { type: 'string' },
          email: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      Image: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          filename: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          mime_type: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          shot_date: { type: 'string', format: 'date-time' },
          url: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/user/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'username'],
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'securepassword' },
                  username: { type: 'string', example: 'Le poivrot' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    result: { type: 'string', example: 'User registered successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    result: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/user/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'securepassword' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    result: { type: 'string', example: "bravo t'es connecté !!!" },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    result: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/image/create': {
      post: {
        tags: ['Images'],
        summary: 'Create a new image entry',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'filename.png' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Image entry created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    content: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 8924789 }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/image/{id}/upload': {
      post: {
        tags: ['Images'],
        summary: 'Upload image file',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
            description: 'Image ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Image not found'
          }
        }
      }
    },
    '/image/me': {
      get: {
        tags: ['Images'],
        summary: 'Get all images for authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of user images',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      url: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      mime_type: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                      shot_date: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/image/{id}': {
      get: {
        tags: ['Images'],
        summary: 'Get image by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
            description: 'Image ID'
          }
        ],
        responses: {
          '200': {
            description: 'Image details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    content: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        url: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        mime_type: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        shot_date: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Image not found'
          }
        }
      }
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
