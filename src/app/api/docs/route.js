import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'BookLeaf Author Support & Communication Portal REST API',
      version: '1.0.0',
      description: 'Production-ready REST API for author support ticketing, book analytics, role-based operations, and AI-assisted workflow.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'User & Author login',
          description: 'Authenticates with email and password, creates JWT token, and returns HTTP-only session cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'priya.sharma@email.com' },
                    password: { type: 'string', example: 'bookleaf123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Authentication successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Get authenticated user session profile',
          responses: {
            200: { description: 'Current session user details' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          summary: 'Log out current user',
          responses: {
            200: { description: 'Session cookie invalidated' },
          },
        },
      },
      '/api/books': {
        get: {
          summary: 'Get books and royalty statistics',
          description: 'For authors, returns their catalog, total royalties earned, pending, and rollover status. For admins, can filter by ?author_id=... or list all books.',
          parameters: [
            { name: 'author_id', in: 'query', schema: { type: 'string' }, description: 'Admin only filter' },
          ],
          responses: {
            200: { description: 'List of books and aggregated financial summary' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/tickets': {
        get: {
          summary: 'List tickets',
          description: 'Authors only see their tickets. Admins see all tickets with filtering by status, category, priority, and date/urgency sorting.',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'Open', 'In Progress', 'Resolved', 'Closed'] } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['all', 'Critical', 'High', 'Medium', 'Low'] } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['urgent', 'newest', 'oldest'] } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Array of tickets matching filters' },
          },
        },
        post: {
          summary: 'Create a new support ticket (with AI Triage)',
          description: 'Creates a ticket, automatically triggers AI category classification, priority score, and generates an AI draft response based on the BookLeaf Knowledge Base.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subject', 'description'],
                  properties: {
                    book_id: { type: 'string', example: 'BK001' },
                    subject: { type: 'string', example: 'Delayed royalty payment for Q3' },
                    description: { type: 'string', example: 'I have not received my royalty of ₹3,570. Please update on status.' },
                    attachment_name: { type: 'string', example: 'bank_statement.pdf' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Ticket created with AI classification and draft' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/tickets/{id}': {
        get: {
          summary: 'Get ticket details',
          description: 'Returns ticket details. Internal notes are stripped for authors.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Ticket details' }, 404: { description: 'Not found' } },
        },
        patch: {
          summary: 'Update ticket metadata',
          description: 'Admins can update status, assign admin, and override AI category or priority.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                    category: { type: 'string' },
                    priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
                    assigned_to: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Ticket updated' } },
        },
      },
      '/api/tickets/{id}/messages': {
        post: {
          summary: 'Append a message to ticket conversation',
          description: 'Admin or author posts a reply. Near real-time ticket conversation.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'We have initiated the bank transfer.' },
                    resolve: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Message appended' } },
        },
      },
      '/api/tickets/{id}/notes': {
        post: {
          summary: 'Add internal note (Admin only)',
          description: 'Adds an internal operational note hidden from the author.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['note'],
                  properties: {
                    note: { type: 'string', example: 'Awaiting ICICI clearance batch.' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Internal note added' }, 403: { description: 'Admin only' } },
        },
      },
      '/api/tickets/{id}/ai-draft': {
        post: {
          summary: 'Regenerate AI Draft Response (Admin only)',
          description: 'Invokes Gemini model with BookLeaf Knowledge Base and specific book context to craft a fresh empathetic response.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'AI draft response generated' } },
        },
      },
      '/api/authors': {
        get: {
          summary: 'List all authors with aggregated metrics (Admin only)',
          responses: { 200: { description: 'Authors and statistics' } },
        },
      },
      '/api/seed': {
        post: {
          summary: 'Seed initial dataset',
          parameters: [{ name: 'force', in: 'query', schema: { type: 'boolean' } }],
          responses: { 200: { description: 'Seed status' } },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
