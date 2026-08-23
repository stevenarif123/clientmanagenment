<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogDescription>Record a payment for this project</DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="amount">Amount (IDR) *</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
            <Input id="amount" v-model.number="form.amount" type="number" min="0" required class="pl-10" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="date">Payment Date *</Label>
            <Input id="date" v-model="form.payment_date" type="date" required />
          </div>
          <div class="space-y-2">
            <Label for="method">Method</Label>
            <Select v-model="form.payment_method">
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in methods" :key="m" :value="m">{{ m }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label>Status</Label>
          <Select v-model="form.status">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label for="notes">Notes</Label>
          <Textarea id="notes" v-model="form.notes" rows="2" placeholder="Additional notes..." />
        </div>
      </form>
      
      <DialogFooter>
        <Button variant="outline" @click="$emit('close')">Cancel</Button>
        <Button @click="handleSubmit" :disabled="saving">
          <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
          {{ saving ? 'Saving...' : 'Add Payment' }}
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

const methods = ['Bank Transfer', 'Cash', 'E-Wallet', 'Credit Card', 'Other']
const form = reactive({
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  status: 'Received',
  notes: ''
})
const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  try {
    await projectsAPI.createPayment(props.projectId, form)
    emit('saved')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
