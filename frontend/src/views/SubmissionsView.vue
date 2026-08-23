<template>
  <div>
    <header class="page-header">
      <div>
        <h1 class="page-title">Submissions</h1>
        <p class="page-subtitle">Manage project submissions</p>
      </div>
    </header>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input v-model="search" placeholder="Search submissions..." class="pl-9" />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="New">New</SelectItem>
          <SelectItem value="Reviewed">Reviewed</SelectItem>
          <SelectItem value="Converted">Converted</SelectItem>
          <SelectItem value="Spam">Spam</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <Inbox class="empty-icon" />
      <p class="empty-title">No submissions found</p>
    </div>

    <!-- Table -->
    <Card v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead class="hidden sm:table-cell">Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="hidden md:table-cell">Date</TableHead>
            <TableHead class="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="sub in filtered" :key="sub.id">
            <TableCell>
              <p class="font-medium">{{ sub.name }}</p>
              <p class="text-xs text-muted-foreground">{{ sub.email }}</p>
            </TableCell>
            <TableCell class="hidden sm:table-cell">
              <p class="text-sm line-clamp-2 max-w-xs">{{ sub.message }}</p>
            </TableCell>
            <TableCell>
              <Select :model-value="sub.status" @update:model-value="updateStatus(sub, $event)">
                <SelectTrigger class="h-8 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
              {{ formatDate(sub.created_at) }}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" @click="viewDetail(sub)">
                View
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Detail Dialog -->
    <Dialog v-model:open="showDetail">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ selectedSub?.name }}</DialogTitle>
          <DialogDescription>{{ formatDate(selectedSub?.created_at) }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <p class="text-xs text-muted-foreground">Email</p>
            <p class="text-sm font-medium">{{ selectedSub?.email }}</p>
          </div>
          <div v-if="selectedSub?.phone">
            <p class="text-xs text-muted-foreground">Phone</p>
            <p class="text-sm font-medium">{{ selectedSub?.phone }}</p>
          </div>
          <div v-if="selectedSub?.service_name">
            <p class="text-xs text-muted-foreground">Service</p>
            <p class="text-sm font-medium">{{ selectedSub?.service_name }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-1">Message</p>
            <p class="text-sm whitespace-pre-wrap">{{ selectedSub?.message || 'No message' }}</p>
          </div>
          <Separator />
          <div class="flex items-center gap-2">
            <Badge :variant="getStatusVariant(selectedSub?.status)">{{ selectedSub?.status }}</Badge>
            <Badge v-if="selectedSub?.is_duplicate" variant="destructive">Duplicate</Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDetail = false">Close</Button>
          <Button 
            v-if="selectedSub?.status !== 'Converted' && selectedSub?.status !== 'Spam'"
            @click="handleConvert"
            :disabled="converting"
          >
            <Loader2 v-if="converting" class="w-4 h-4 mr-2 animate-spin" />
            Convert to Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Convert Dialog -->
    <Dialog v-model:open="showConvert">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to Client</DialogTitle>
          <DialogDescription>
            Create a new client from this submission
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitConvert" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name *</Label>
            <Input id="name" v-model="convertForm.name" disabled class="bg-muted" />
          </div>
          <div class="space-y-2">
            <Label for="email">Email *</Label>
            <Input id="email" v-model="convertForm.email" disabled class="bg-muted" />
          </div>
          <div class="space-y-2">
            <Label for="phone">Phone</Label>
            <Input id="phone" v-model="convertForm.phone" placeholder="+62..." />
          </div>
          <div class="space-y-2">
            <Label for="company">Company</Label>
            <Input id="company" v-model="convertForm.company" placeholder="Company name (optional)" />
          </div>
          <div class="space-y-2">
            <Label for="address">Address</Label>
            <Textarea id="address" v-model="convertForm.address" placeholder="Full address (optional)" rows="2" />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" @click="showConvert = false">Cancel</Button>
          <Button @click="submitConvert" :disabled="converting">
            <Loader2 v-if="converting" class="w-4 h-4 mr-2 animate-spin" />
            {{ converting ? 'Converting...' : 'Convert' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { submissionsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Inbox, Loader2 } from 'lucide-vue-next'

const submissions = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('all')
const showDetail = ref(false)
const selectedSub = ref(null)
const showConvert = ref(false)
const converting = ref(false)
const convertForm = ref({
  name: '',
  email: '',
  phone: '',
  company: '',
  address: ''
})

const filtered = computed(() => {
  return submissions.value.filter(s => {
    const matchSearch = !search.value || 
      s.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.value.toLowerCase()) ||
      s.message?.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || s.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-'

const getStatusVariant = (status) => {
  const map = { approved: 'default', pending: 'secondary', rejected: 'destructive', revision: 'outline' }
  return map[status] || 'outline'
}

const fetchSubmissions = async () => {
  loading.value = true
  try {
    const response = await submissionsAPI.getAll()
    submissions.value = response.data.data
  } finally {
    loading.value = false
  }
}

const updateStatus = async (sub, status) => {
  await submissionsAPI.update(sub.id, { ...sub, status })
  sub.status = status
}

const viewDetail = (sub) => {
  selectedSub.value = sub
  showDetail.value = true
}

const handleConvert = () => {
  if (!selectedSub.value) return
  
  convertForm.value = {
    name: selectedSub.value.name,
    email: selectedSub.value.email,
    phone: selectedSub.value.phone || '',
    company: '',
    address: ''
  }
  
  showDetail.value = false
  showConvert.value = true
}

const submitConvert = async () => {
  if (!selectedSub.value) return
  
  converting.value = true
  try {
    await submissionsAPI.convertToClient(selectedSub.value.id, {
      company: convertForm.value.company || null,
      address: convertForm.value.address || null
    })
    
    showConvert.value = false
    alert('✅ Submission converted to client successfully!')
    
    await fetchSubmissions()
  } catch (err) {
    alert('❌ ' + (err.response?.data?.message || 'Failed to convert'))
  } finally {
    converting.value = false
  }
}

onMounted(fetchSubmissions)
</script>
