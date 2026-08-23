<template>
  <div>
    <header class="page-header">
      <div>
        <h1 class="page-title">Services</h1>
        <p class="page-subtitle">Manage your service offerings</p>
      </div>
      <Button @click="openModal()">
        <Plus class="w-4 h-4 mr-2" />
        Add Service
      </Button>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty -->
    <div v-else-if="services.length === 0" class="empty-state">
      <Settings class="empty-icon" />
      <p class="empty-title">No services yet</p>
      <p class="empty-desc">Add your first service to get started</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="service in services" :key="service.id">
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between">
            <CardTitle class="text-base">{{ service.name }}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <MoreHorizontal class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openModal(service)">Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="confirmDelete(service)" class="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription class="line-clamp-2">{{ service.description || 'No description' }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" class="text-xs">
            {{ service.is_active ? 'Active' : 'Inactive' }}
          </Badge>
        </CardContent>
      </Card>
    </div>

    <!-- Modal -->
    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ selectedService ? 'Edit Service' : 'New Service' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name *</Label>
            <Input id="name" v-model="form.name" placeholder="Service name" required />
          </div>
          <div class="space-y-2">
            <Label for="desc">Description</Label>
            <Textarea id="desc" v-model="form.description" rows="3" placeholder="Service description" />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" @click="showModal = false">Cancel</Button>
          <Button @click="handleSubmit" :disabled="saving">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            {{ saving ? 'Saving...' : 'Save' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ serviceToDelete?.name }}"?
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
import { ref, reactive, onMounted } from 'vue'
import { servicesAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Settings, MoreHorizontal, Loader2 } from 'lucide-vue-next'

const services = ref([])
const loading = ref(true)
const showModal = ref(false)
const selectedService = ref(null)
const showDelete = ref(false)
const serviceToDelete = ref(null)
const saving = ref(false)

const form = reactive({ name: '', description: '' })

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n)

const fetchServices = async () => {
  loading.value = true
  try {
    const response = await servicesAPI.getAll()
    services.value = response.data.data
  } finally {
    loading.value = false
  }
}

const openModal = (service = null) => {
  selectedService.value = service
  if (service) {
    Object.assign(form, { name: service.name, description: service.description })
  } else {
    Object.assign(form, { name: '', description: '' })
  }
  showModal.value = true
}

const handleSubmit = async () => {
  saving.value = true
  try {
    if (selectedService.value) {
      await servicesAPI.update(selectedService.value.id, form)
    } else {
      await servicesAPI.create(form)
    }
    showModal.value = false
    fetchServices()
  } finally {
    saving.value = false
  }
}

const confirmDelete = (service) => {
  serviceToDelete.value = service
  showDelete.value = true
}

const handleDelete = async () => {
  await servicesAPI.delete(serviceToDelete.value.id)
  showDelete.value = false
  fetchServices()
}

onMounted(fetchServices)
</script>
