<template>
  <div>
    <header class="page-header">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">Track all your projects</p>
      </div>
      <Button @click="openModal()">
        <Plus class="w-4 h-4 mr-2" />
        New Project
      </Button>
    </header>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input v-model="search" placeholder="Search projects..." class="pl-9" />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <FolderKanban class="empty-icon" />
      <p class="empty-title">No projects found</p>
      <p class="empty-desc">Create your first project to get started</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="project in filtered"
        :key="project.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="$router.push(`/projects/${project.id}`)"
      >
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <CardTitle class="text-base truncate">{{ project.title }}</CardTitle>
              <CardDescription class="truncate">{{ project.client_name }}</CardDescription>
            </div>
            <Badge :variant="getStatusVariant(project.status)">
              {{ formatStatus(project.status) }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Budget</span>
              <span class="font-medium currency">Rp {{ formatNumber(project.total_budget || 0) }}</span>
            </div>
            <Progress :model-value="getBudgetProgress(project)" class="h-1.5" />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ formatNumber(project.total_received || 0) }} received</span>
              <span>{{ formatNumber(project.total_expenses || 0) }} spent</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal -->
    <ProjectModal
      v-if="showModal"
      :project="selectedProject"
      @close="showModal = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { projectsAPI } from '@/services/api'
import ProjectModal from '@/components/Projects/ProjectModal.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, FolderKanban, Loader2 } from 'lucide-vue-next'

const projects = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('all')
const showModal = ref(false)
const selectedProject = ref(null)

const filtered = computed(() => {
  return projects.value.filter(p => {
    const matchSearch = !search.value || 
      p.title?.toLowerCase().includes(search.value.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || p.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n)
const formatStatus = (s) => s?.replace('_', ' ')

const getStatusVariant = (status) => {
  const map = { completed: 'default', in_progress: 'secondary', pending: 'outline', cancelled: 'destructive' }
  return map[status] || 'outline'
}

const getBudgetProgress = (p) => {
  if (!p.total_budget) return 0
  return Math.min(100, ((p.total_received || 0) / p.total_budget) * 100)
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const response = await projectsAPI.getAll()
    projects.value = response.data.data
  } finally {
    loading.value = false
  }
}

const openModal = (project = null) => {
  selectedProject.value = project
  showModal.value = true
}

const handleSaved = () => {
  showModal.value = false
  fetchProjects()
}

onMounted(fetchProjects)
</script>
