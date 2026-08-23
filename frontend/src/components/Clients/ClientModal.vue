<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ client ? 'Edit Client' : 'New Client' }}</DialogTitle>
        <DialogDescription>
          {{ client ? 'Update client information' : 'Add a new client to your database' }}
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Name *</Label>
          <Input id="name" v-model="form.name" placeholder="Client name" required />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" placeholder="email@example.com" />
          </div>
          <div class="space-y-2">
            <Label for="phone">Phone</Label>
            <Input id="phone" v-model="form.phone" placeholder="+62 812..." />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="company">Company</Label>
          <Input id="company" v-model="form.company" placeholder="Company name" />
        </div>
        
        <div class="space-y-2">
          <Label for="address">Address</Label>
          <Textarea id="address" v-model="form.address" placeholder="Full address" rows="2" />
        </div>

        <div class="space-y-2">
          <Label for="notes">Notes</Label>
          <Textarea id="notes" v-model="form.notes" placeholder="Additional notes" rows="2" />
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
import { clientsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({ client: Object })
const emit = defineEmits(['close', 'saved'])

const form = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  notes: ''
})
const saving = ref(false)

onMounted(() => {
  if (props.client) {
    Object.assign(form, props.client)
  }
})

const handleSubmit = async () => {
  saving.value = true
  try {
    if (props.client) {
      await clientsAPI.update(props.client.id, form)
    } else {
      await clientsAPI.create(form)
    }
    emit('saved')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
