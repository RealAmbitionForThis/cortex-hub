import { addDocument, getDocuments, getDocumentById, deleteDocument } from './queries';
import { searchDocuments, indexDocument } from '@/lib/docs/rag';

export const docTools = [
  {
    name: 'docs.add',
    description: 'Add a document to the knowledge base',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['text', 'pdf', 'receipt', 'note'] },
        content: { type: 'string' },
      },
      required: ['title', 'content'],
    },
    handler: async (args) => {
      const id = addDocument(args);
      await indexDocument(id, args.content).catch(() => {});
      return { success: true, id };
    },
  },
  {
    name: 'docs.search',
    description: 'Search documents using semantic search (RAG)',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
    handler: async ({ query, limit }) => {
      const results = await searchDocuments(query, limit);
      return { results };
    },
  },
  {
    name: 'docs.list',
    description: 'List all documents',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        search: { type: 'string' },
      },
    },
    handler: async (args) => ({ documents: getDocuments(args) }),
  },
  {
    name: 'docs.get',
    description: 'Get a document by ID',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async ({ id }) => {
      const doc = getDocumentById(id);
      return doc || { error: 'Document not found' };
    },
  },
  {
    name: 'docs.delete',
    description: 'Delete a document',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async ({ id }) => {
      deleteDocument(id);
      return { success: true };
    },
  },
];
