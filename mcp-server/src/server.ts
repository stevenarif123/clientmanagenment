#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getClientHubConfig, ClientHubConfig } from './config.js';
import { getClientHubClient } from './client.js';
import { TOOLS } from './tools.js';

const server = new Server(
  {
    name: 'mcpclienthub',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    const config = getClientHubConfig(args as Partial<ClientHubConfig>);
    const client = await getClientHubClient(config);

    switch (name) {
      // 1. Connection & Verification
      case 'clienthub_test_connection': {
        const res = await client.get('/auth/check-setup');
        const projectsRes = await client.get('/projects');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Berhasil terhubung ke ClientHub API.',
                  targetUrl: config.baseUrl,
                  authMethod: config.apiKey ? 'API Key (X-API-Key)' : 'Session Token',
                  totalProjects: projectsRes.data?.meta?.total || (projectsRes.data?.data?.length ?? 0),
                  serverStatus: res.data,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // 2. Projects
      case 'clienthub_list_projects': {
        const params: Record<string, any> = {};
        if (args.status) params.status = args.status;
        if (args.search) params.search = args.search;
        if (args.page) params.page = args.page;
        if (args.per_page) params.per_page = args.per_page;

        const res = await client.get('/projects', { params });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_get_project': {
        const projectId = Number(args.project_id);
        const res = await client.get(`/projects/${projectId}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_create_project': {
        const res = await client.post('/projects', {
          client_id: Number(args.client_id),
          service_id: args.service_id ? Number(args.service_id) : 1,
          title: args.title,
          description: args.description || null,
          total_budget: args.total_budget ? Number(args.total_budget) : 0,
          start_date: args.start_date || null,
          end_date: args.end_date || null,
          status: args.status || 'In Progress',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_update_project': {
        const projectId = Number(args.project_id);
        const updateData: Record<string, any> = {};
        if (args.title) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.status) updateData.status = args.status;
        if (args.total_budget !== undefined) updateData.total_budget = Number(args.total_budget);
        if (args.start_date !== undefined) updateData.start_date = args.start_date;
        if (args.end_date !== undefined) updateData.end_date = args.end_date;

        const res = await client.put(`/projects/${projectId}`, updateData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      // 3. Tasks & Milestones
      case 'clienthub_list_tasks': {
        const projectId = Number(args.project_id);
        const res = await client.get(`/projects/${projectId}/tasks`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_create_task': {
        const projectId = Number(args.project_id);
        const res = await client.post(`/projects/${projectId}/tasks`, {
          title: args.title,
          description: args.description || null,
          status: args.status || 'Todo',
          priority: args.priority || 'Medium',
          due_date: args.due_date || null,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_update_task': {
        const taskId = Number(args.task_id);
        const updateData: Record<string, any> = {};
        if (args.title) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.status) updateData.status = args.status;
        if (args.priority) updateData.priority = args.priority;
        if (args.due_date !== undefined) updateData.due_date = args.due_date;

        const res = await client.put(`/tasks/${taskId}`, updateData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_toggle_task': {
        const taskId = Number(args.task_id);
        const res = await client.patch(`/tasks/${taskId}/toggle`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_delete_task': {
        const taskId = Number(args.task_id);
        const res = await client.delete(`/tasks/${taskId}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      // 4. Communications & Work Logs
      case 'clienthub_log_work_update': {
        const projectId = Number(args.project_id);
        const res = await client.post(`/projects/${projectId}/communications`, {
          type: args.channel || 'note',
          subject: args.subject,
          content: args.notes || (args as any).content || args.subject,
          direction: args.direction || 'outgoing',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      // 5. Clients
      case 'clienthub_list_clients': {
        const params: Record<string, any> = {};
        if (args.search) params.search = args.search;
        const res = await client.get('/clients', { params });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_create_client': {
        const res = await client.post('/clients', {
          name: args.name,
          email: args.email || null,
          phone: args.phone || null,
          company: args.company || null,
          address: args.address || null,
          notes: args.notes || null,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      // 6. Client Portal Link
      case 'clienthub_get_portal_link': {
        const projectId = Number(args.project_id);
        const projectRes = await client.get(`/projects/${projectId}`);
        const project = projectRes.data?.data;
        if (!project) {
          throw new Error('Proyek tidak ditemukan.');
        }

        const portalToken = project.portal_token;
        const portalUrl = `${config.baseUrl}/portal.html?token=${portalToken}`;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  project_id: projectId,
                  project_title: project.title,
                  client_name: project.client_name,
                  portal_enabled: Boolean(project.portal_enabled),
                  portal_token: portalToken,
                  portal_url: portalUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // 7. Financials
      case 'clienthub_record_payment': {
        const projectId = Number(args.project_id);
        const res = await client.post(`/projects/${projectId}/payments`, {
          amount: Number(args.amount),
          payment_date: args.payment_date || new Date().toISOString().slice(0, 10),
          payment_method: args.payment_method || 'Bank Transfer',
          status: args.status || 'Received',
          notes: args.notes || null,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      case 'clienthub_record_expense': {
        const projectId = Number(args.project_id);
        const res = await client.post(`/projects/${projectId}/expenses`, {
          amount: Number(args.amount),
          category: args.category,
          description: args.description || null,
          expense_date: args.expense_date || new Date().toISOString().slice(0, 10),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Tool '${name}' tidak dikenali.`,
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Terjadi error saat memanggil API ClientHub.';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              tool: name,
              error: errorMsg,
              details: error.response?.data || undefined,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start MCP Server over Stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ClientHub MCP Server v1.0 is running over stdio.');
}

main().catch((error) => {
  console.error('Fatal error starting ClientHub MCP Server:', error);
  process.exit(1);
});
