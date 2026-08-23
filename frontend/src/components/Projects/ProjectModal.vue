<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ project ? 'Edit Project' : 'New Project' }}</DialogTitle>
        <DialogDescription>
          {{ project ? 'Update project details' : 'Create a new project' }}
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Project Name *</Label>
          <Input id="name" v-model="form.name" placeholder="Enter project name" required />
        </div>
        
        <div class="space-y-2">
          <Label for="client">Client *</Label>
          <Select v-model="form.client_id" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in clients" :key="c.id" :value="String(c.id)">
                {{ c.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="service">Service</Label>
            <Select v-model="form.service_id">
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in services" :key="s.id" :value="String(s.id)">
                  {{ s.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="status">Status</Label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="budget">Budget (IDR)</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
            <Input id="budget" v-model.number="form.budget" type="number" class="pl-10" placeholder="0" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="start">Start Date</Label>
            <Input id="start" v-model="form.start_date" type="date" />
          </div>
          <div class="space-y-2">
            <Label for="end">End Date</Label>
            <Input id="end" v-model="form.end_date" type="date" />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="desc">Description</Label>
          <Textarea id="desc" v-model="form.description" rows="3" placeholder="Project description..." />
        </div>
      </form>
      
      <DialogFooter>
        <Button variant="outline" @click="$emit('close')">Cancel</Button>
        <Button @click="handleSubmit" :disabled="saving">
          <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
          {{ saving ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { projectsAPI, clientsAPI, servicesAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({ project: Object })
const emit = defineEmits(['close', 'saved'])

const clients = ref([])
const services = ref([])
const form = reactive({
  name: '',
  client_id: '',
  service_id: '',
  status: 'Pending',
  budget: 0,
  start_date: '',
  end_date: '',
  description: ''
})
const saving = ref(false)

onMounted(async () => {
  const [clientsRes, servicesRes] = await Promise.all([
    clientsAPI.getAll(),
    servicesAPI.getAll()
  ])
  clients.value = clientsRes.data.data || []
  services.value = servicesRes.data.data || []
  
  if (props.project) {
    Object.assign(form, {
      name: props.project.title,
      client_id: String(props.project.client_id),
      service_id: props.project.service_id ? String(props.project.service_id) : '',
      status: props.project.status,
      budget: props.project.total_budget || 0,
      start_date: props.project.start_date || '',
      end_date: props.project.end_date || '',
      description: props.project.description || ''
    })
  }
})

const handleSubmit = async () => {
  saving.value = true
  try {
    const payload = { 
      title: form.name,
      client_id: Number(form.client_id),
      service_id: form.service_id ? Number(form.service_id) : null,
      status: form.status,
      total_budget: form.budget,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description
    }
    if (props.project) {
      await projectsAPI.update(props.project.id, payload)
    } else {
      await projectsAPI.create(payload)
    }
    emit('saved')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
