<template>
  <div>
    <header class="page-header">
      <div>
        <h1 class="page-title">Clients</h1>
        <p class="page-subtitle">Manage your client database</p>
      </div>
      <Button @click="openModal()">
        <Plus class="w-4 h-4 mr-2" />
        Add Client
      </Button>
    </header>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          v-model="search"
          placeholder="Search clients..."
          class="pl-9"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <Users class="empty-icon" />
      <p class="empty-title">No clients found</p>
      <p class="empty-desc">Get started by adding your first client</p>
    </div>

    <!-- Table (Desktop) -->
    <Card v-else class="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead class="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="client in filtered" :key="client.id" class="cursor-pointer" @click="$router.push(`/clients/${client.id}`)">
            <TableCell>
              <div class="flex items-center gap-3">
                <Avatar class="h-9 w-9">
                  <AvatarFallback>{{ getInitials(client.name) }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ client.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ client.company || 'Individual' }}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p class="text-sm">{{ client.email || '-' }}</p>
              <p class="text-xs text-muted-foreground">{{ client.phone || '-' }}</p>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{{ client.total_projects || 0 }} projects</Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" @click.stop>
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click.stop="openModal(client)">Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click.stop="confirmDelete(client)" class="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Cards (Mobile) -->
    <div class="md:hidden space-y-3">
      <Card v-for="client in filtered" :key="client.id" class="cursor-pointer" @click="$router.push(`/clients/${client.id}`)">
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <Avatar class="h-10 w-10">
              <AvatarFallback>{{ getInitials(client.name) }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ client.name }}</p>
              <p class="text-sm text-muted-foreground truncate">{{ client.email || client.phone || 'No contact' }}</p>
            </div>
            <Badge variant="secondary">{{ client.total_projects || 0 }}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal -->
    <ClientModal
      v-if="showModal"
      :client="selectedClient"
      @close="showModal = false"
      @saved="handleSaved"
    />

    <!-- Delete Confirm -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ clientToDelete?.name }}"? This action cannot be undone.
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
import { ref, computed, onMounted } from 'vue'
import { clientsAPI } from '@/services/api'
import ClientModal from '@/components/Clients/ClientModal.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Users, MoreHorizontal, Loader2 } from 'lucide-vue-next'

const clients = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const selectedClient = ref(null)
const showDelete = ref(false)
const clientToDelete = ref(null)

const filtered = computed(() => {
  if (!search.value) return clients.value
  const q = search.value.toLowerCase()
  return clients.value.filter(c => 
    c.name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.company?.toLowerCase().includes(q)
  )
})

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

const fetchClients = async () => {
  loading.value = true
  try {
    const response = await clientsAPI.getAll()
    clients.value = response.data.data
  } finally {
    loading.value = false
  }
}

const openModal = (client = null) => {
  selectedClient.value = client
  showModal.value = true
}

const handleSaved = () => {
  showModal.value = false
  fetchClients()
}

const confirmDelete = (client) => {
  clientToDelete.value = client
  showDelete.value = true
}

const handleDelete = async () => {
  await clientsAPI.delete(clientToDelete.value.id)
  showDelete.value = false
  fetchClients()
}

onMounted(fetchClients)
</script>
