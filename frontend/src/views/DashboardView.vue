<template>
  <div>
    <header class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Overview of your business</p>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else class="space-y-8">
      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card v-for="stat in stats" :key="stat.label">
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="stat-label">{{ stat.label }}</p>
                <p class="stat-value">{{ stat.value }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <component :is="stat.icon" class="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Recent Projects -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <router-link to="/projects">View all</router-link>
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="recentProjects.length === 0" class="py-8 text-center text-sm text-muted-foreground">
              No projects yet
            </div>
            <div v-else class="divide-y">
              <router-link
                v-for="project in recentProjects"
                :key="project.id"
                :to="`/projects/${project.id}`"
                class="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm truncate">{{ project.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ project.client_name }}</p>
                </div>
                <Badge :variant="getStatusVariant(project.status)">
                  {{ project.status }}
                </Badge>
              </router-link>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Clients -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">Recent Clients</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <router-link to="/clients">View all</router-link>
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="recentClients.length === 0" class="py-8 text-center text-sm text-muted-foreground">
              No clients yet
            </div>
            <div v-else class="divide-y">
              <router-link
                v-for="client in recentClients"
                :key="client.id"
                :to="`/clients/${client.id}`"
                class="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <Avatar class="h-8 w-8">
                  <AvatarFallback class="text-xs">{{ getInitials(client.name) }}</AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm truncate">{{ client.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ client.email || client.phone || 'No contact' }}</p>
                </div>
              </router-link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { reportsAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, FolderKanban, Banknote, Loader2 } from 'lucide-vue-next'

const loading = ref(true)
const dashboard = ref({})

const stats = computed(() => [
  { label: 'Clients', value: dashboard.value.counts?.clients || 0, icon: markRaw(Users) },
  { label: 'Projects', value: dashboard.value.counts?.projects || 0, icon: markRaw(FolderKanban) },
  { label: 'Revenue', value: formatCurrency(dashboard.value.budget?.total_received || 0), icon: markRaw(Banknote) },
  { label: 'Expenses', value: formatCurrency(dashboard.value.budget?.total_expenses || 0), icon: markRaw(Banknote) }
])

const recentProjects = computed(() => dashboard.value.recent_projects || [])
const recentClients = computed(() => dashboard.value.recent_clients || [])

const formatCurrency = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const getStatusVariant = (status) => {
  const variants = {
    'completed': 'default',
    'in_progress': 'secondary',
    'pending': 'outline'
  }
  return variants[status] || 'outline'
}

onMounted(async () => {
  try {
    const response = await reportsAPI.getDashboard()
    dashboard.value = response.data.data
  } finally {
    loading.value = false
  }
})
</script>
