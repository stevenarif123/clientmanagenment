<template>
  <div>
    <!-- Back -->
    <Button variant="ghost" size="sm" class="mb-6" @click="$router.push('/clients')">
      <ArrowLeft class="w-4 h-4 mr-2" />
      Back to Clients
    </Button>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="client" class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar class="h-16 w-16">
          <AvatarFallback class="text-xl">{{ getInitials(client.name) }}</AvatarFallback>
        </Avatar>
        <div class="flex-1">
          <h1 class="text-2xl font-semibold tracking-tight">{{ client.name }}</h1>
          <p class="text-muted-foreground">{{ client.company || 'Individual Client' }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="showEdit = true">Edit</Button>
          <Button variant="destructive" @click="showDelete = true">Delete</Button>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card v-if="client.email">
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-secondary">
                <Mail class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Email</p>
                <p class="text-sm font-medium">{{ client.email }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card v-if="client.phone">
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-secondary">
                <Phone class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Phone</p>
                <p class="text-sm font-medium">{{ client.phone }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card v-if="client.address">
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-secondary">
                <MapPin class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Address</p>
                <p class="text-sm font-medium line-clamp-2">{{ client.address }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-secondary">
                <FolderKanban class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Total Projects</p>
                <p class="text-2xl font-semibold">{{ client.total_projects || 0 }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-secondary">
                <Activity class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Active Projects</p>
                <p class="text-2xl font-semibold">{{ client.active_projects || 0 }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div>
              <p class="text-xs text-muted-foreground mb-1">Total Budget</p>
              <p class="text-xl font-semibold">Rp {{ formatNumber(client.total_budget || 0) }}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div>
              <p class="text-xs text-muted-foreground mb-1">Total Received</p>
              <p class="text-xl font-semibold text-green-600">Rp {{ formatNumber(client.total_received || 0) }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Notes -->
      <Card v-if="client.notes">
        <CardHeader>
          <CardTitle class="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground whitespace-pre-wrap">{{ client.notes }}</p>
        </CardContent>
      </Card>

      <!-- Projects -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Projects ({{ projects.length }})</CardTitle>
        </CardHeader>
        <CardContent v-if="projects.length === 0" class="text-center py-8 text-sm text-muted-foreground">
          No projects yet
        </CardContent>
        <div v-else class="divide-y">
          <router-link
            v-for="p in projects"
            :key="p.id"
            :to="`/projects/${p.id}`"
            class="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p class="font-medium text-sm">{{ p.title }}</p>
              <p class="text-xs text-muted-foreground">Rp {{ formatNumber(p.total_budget || 0) }}</p>
            </div>
            <Badge :variant="getStatusVariant(p.status)">{{ p.status }}</Badge>
          </router-link>
        </div>
      </Card>
    </div>

    <!-- Edit Modal -->
    <ClientModal v-if="showEdit" :client="client" @close="showEdit = false" @saved="handleSaved" />

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            This will permanently delete "{{ client?.name }}" and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDelete = false">Cancel</Button>
          <Button variant="destructive" @click="handleDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clientsAPI, projectsAPI } from '@/services/api'
import ClientModal from '@/components/Clients/ClientModal.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, Mail, Phone, MapPin, FolderKanban, Activity } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const client = ref(null)
const projects = ref([])
const loading = ref(true)
const showEdit = ref(false)
const showDelete = ref(false)

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n)
const getStatusVariant = (s) => ({ completed: 'default', in_progress: 'secondary', pending: 'outline' })[s] || 'outline'

const fetchData = async () => {
  loading.value = true
  try {
    const [clientRes, projectsRes] = await Promise.all([
      clientsAPI.getOne(route.params.id),
      projectsAPI.getAll({ client_id: route.params.id })
    ])
    client.value = clientRes.data.data
    projects.value = projectsRes.data.data || []
  } finally {
    loading.value = false
  }
}

const handleSaved = () => {
  showEdit.value = false
  fetchData()
}

const handleDelete = async () => {
  await clientsAPI.delete(route.params.id)
  router.push('/clients')
}

onMounted(fetchData)
</script>
