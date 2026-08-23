<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogDescription>Record an expense for this project</DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="desc">Description *</Label>
          <Input id="desc" v-model="form.description" placeholder="What was this expense for?" required />
        </div>
        
        <div class="space-y-2">
          <Label for="amount">Amount (IDR) *</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
            <Input id="amount" v-model.number="form.amount" type="number" min="0" required class="pl-10" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="date">Date *</Label>
            <Input id="date" v-model="form.expense_date" type="date" required />
          </div>
          <div class="space-y-2">
            <Label for="category">Category</Label>
            <Select v-model="form.category">
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in categories" :key="c" :value="c">{{ c }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          {{ saving ? 'Saving...' : 'Add Expense' }}
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

const categories = ['Materials', 'Labor', 'Hosting', 'Software', 'Transportation', 'Other']
const form = reactive({
  description: '',
  amount: 0,
  expense_date: new Date().toISOString().split('T')[0],
  category: '',
  notes: ''
})
const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  try {
    await projectsAPI.createExpense(props.projectId, form)
    emit('saved')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
