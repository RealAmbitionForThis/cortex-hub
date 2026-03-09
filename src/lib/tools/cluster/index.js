import { getAllClusters, createCluster, updateCluster, addClusterMemory } from './queries';

export const clusterTools = [
  {
    name: 'cluster.create',
    description: 'Create a new information cluster',
    parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, icon: { type: 'string' }, color: { type: 'string' }, system_prompt_addition: { type: 'string' } }, required: ['name'] },
    handler: ({ name, description, icon, color, system_prompt_addition }) => {
      const id = createCluster({ name, description, icon, color, system_prompt_addition });
      return { success: true, id };
    },
  },
  {
    name: 'cluster.activate',
    description: 'Activate an information cluster',
    parameters: { type: 'object', properties: { cluster_id: { type: 'string' } }, required: ['cluster_id'] },
    handler: ({ cluster_id }) => { updateCluster(cluster_id, { active: 1 }); return { success: true }; },
  },
  {
    name: 'cluster.deactivate',
    description: 'Deactivate an information cluster',
    parameters: { type: 'object', properties: { cluster_id: { type: 'string' } }, required: ['cluster_id'] },
    handler: ({ cluster_id }) => { updateCluster(cluster_id, { active: 0 }); return { success: true }; },
  },
  {
    name: 'cluster.add_memory',
    description: 'Add a memory to a specific cluster',
    parameters: { type: 'object', properties: { cluster_id: { type: 'string' }, content: { type: 'string' } }, required: ['cluster_id', 'content'] },
    handler: ({ cluster_id, content }) => {
      const id = addClusterMemory(cluster_id, content);
      return { success: true, id };
    },
  },
  {
    name: 'cluster.list',
    description: 'List all information clusters',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ clusters: getAllClusters() }),
  },
];
