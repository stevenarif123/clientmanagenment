<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Communication</DialogTitle>
        <DialogDescription>Log a communication for this project</DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Type *</Label>
            <Select v-model="form.type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Direction</Label>
            <Select v-model="form.direction">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div v-if="form.type !== 'note'" class="space-y-2">
          <Label for="contact">Contact</Label>
          <Input 
            id="contact" 
            v-model="form.contact_info" 
            :placeholder="form.type === 'email' ? 'email@example.com' : '+62 812...'" 
          />
        </div>
        
        <div v-if="form.type === 'email'" class="space-y-2">
          <Label for="subject">Subject</Label>
          <Input id="subject" v-model="form.subject" placeholder="Email subject" />
        </div>
        
        <div class="space-y-2">
          <Label for="content">Content *</Label>
          <Textarea id="content" v-model="form.content" rows="4" placeholder="Message content..." required />
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
import { ref, reactive } from 'vue'
import { projectsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({ projectId: Number })
const emit = defineEmits(['close', 'saved'])

const form = reactive({
  type: 'whatsapp',
  subject: '',
  content: '',
  contact_info: '',
  direction: 'outgoing'
})
const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  try {
    await projectsAPI.createCommunication(props.projectId, form)
    emit('saved')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
