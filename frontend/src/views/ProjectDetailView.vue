<template>
  <div>
    <!-- Back -->
    <Button variant="ghost" size="sm" class="mb-6" @click="$router.push('/projects')">
      <ArrowLeft class="w-4 h-4 mr-2" />
      Back to Projects
    </Button>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="project" class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold tracking-tight">{{ project.title }}</h1>
            <Badge :variant="getStatusVariant(project.status)">{{ project.status }}</Badge>
          </div>
          <router-link :to="`/clients/${project.client_id}`" class="text-muted-foreground hover:text-foreground transition-colors">
            {{ project.client_name }}
          </router-link>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="showEdit = true">Edit</Button>
          <Button variant="destructive" @click="showDelete = true">Delete</Button>
        </div>
      </div>

      <!-- Budget Cards -->
      <div class="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Budget</p>
            <p class="stat-value currency">Rp {{ formatNumber(project.total_budget || 0) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Received</p>
            <p class="stat-value text-emerald-600 currency">Rp {{ formatNumber(project.total_received || 0) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Expenses</p>
            <p class="stat-value text-red-600 currency">Rp {{ formatNumber(project.total_expenses || 0) }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <!-- Payments -->
        <TabsContent value="payments" class="mt-6">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-muted-foreground">{{ payments.length }} payment(s)</p>
            <Button size="sm" @click="showPaymentModal = true">
              <Plus class="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </div>
          <Card v-if="payments.length">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="p in payments" :key="p.id">
                  <TableCell>{{ formatDate(p.payment_date) }}</TableCell>
                  <TableCell class="currency text-emerald-600">Rp {{ formatNumber(p.amount) }}</TableCell>
                  <TableCell>{{ p.payment_method || '-' }}</TableCell>
                  <TableCell><Badge variant="outline">{{ p.status }}</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
          <p v-else class="text-center py-8 text-sm text-muted-foreground">No payments yet</p>
        </TabsContent>

        <!-- Expenses -->
        <TabsContent value="expenses" class="mt-6">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-muted-foreground">{{ expenses.length }} expense(s)</p>
            <Button size="sm" @click="showExpenseModal = true">
              <Plus class="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
          <Card v-if="expenses.length">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="e in expenses" :key="e.id">
                  <TableCell>{{ formatDate(e.expense_date) }}</TableCell>
                  <TableCell>{{ e.description }}</TableCell>
                  <TableCell class="currency text-red-600">Rp {{ formatNumber(e.amount) }}</TableCell>
                  <TableCell><Badge variant="secondary">{{ e.category }}</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
          <p v-else class="text-center py-8 text-sm text-muted-foreground">No expenses yet</p>
        </TabsContent>

        <!-- Communications -->
        <TabsContent value="communications" class="mt-6">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-muted-foreground">{{ communications.length }} message(s)</p>
            <Button size="sm" @click="showCommModal = true">
              <Plus class="w-4 h-4 mr-2" />
              Add Communication
            </Button>
          </div>
          <div v-if="communications.length" class="space-y-3">
            <Card v-for="c in communications" :key="c.id">
              <CardContent class="pt-4">
                <div class="flex items-start gap-3">
                  <div class="p-2 rounded-lg bg-secondary">
                    <component :is="getCommIcon(c.type)" class="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{{ c.type }}</Badge>
                      <Badge :variant="c.direction === 'incoming' ? 'secondary' : 'outline'">{{ c.direction }}</Badge>
                      <span class="text-xs text-muted-foreground ml-auto">{{ formatDate(c.created_at) }}</span>
                    </div>
                    <p class="text-sm whitespace-pre-wrap">{{ c.content }}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <p v-else class="text-center py-8 text-sm text-muted-foreground">No communications yet</p>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Modals -->
    <ProjectModal v-if="showEdit" :project="project" @close="showEdit = false" @saved="handleSaved" />
    <PaymentModal v-if="showPaymentModal" :project-id="project?.id" @close="showPaymentModal = false" @saved="handleSaved" />
    <ExpenseModal v-if="showExpenseModal" :project-id="project?.id" @close="showExpenseModal = false" @saved="handleSaved" />
    <CommunicationModal v-if="showCommModal" :project-id="project?.id" @close="showCommModal = false" @saved="handleSaved" />

    <!-- Delete -->
    <Dialog v-model:open="showDelete">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>This will permanently delete "{{ project?.title }}".</DialogDescription>
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
import { ref, onMounted, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsAPI } from '@/services/api'
import ProjectModal from '@/components/Projects/ProjectModal.vue'
import PaymentModal from '@/components/Budget/PaymentModal.vue'
import ExpenseModal from '@/components/Budget/ExpenseModal.vue'
import CommunicationModal from '@/components/Communications/CommunicationModal.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, Plus, Mail, MessageCircle, FileText } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const project = ref(null)
const payments = ref([])
const expenses = ref([])
const communications = ref([])
const loading = ref(true)
const activeTab = ref('payments')
const showEdit = ref(false)
const showDelete = ref(false)
const showPaymentModal = ref(false)
const showExpenseModal = ref(false)
const showCommModal = ref(false)

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-'
const getStatusVariant = (s) => ({ completed: 'default', in_progress: 'secondary', pending: 'outline' })[s] || 'outline'
const getCommIcon = (type) => ({ email: markRaw(Mail), whatsapp: markRaw(MessageCircle), note: markRaw(FileText) })[type] || markRaw(FileText)

const fetchData = async () => {
  loading.value = true
  try {
    const [projectRes, paymentsRes, expensesRes, commsRes] = await Promise.all([
      projectsAPI.getOne(route.params.id),
      projectsAPI.getPayments(route.params.id),
      projectsAPI.getExpenses(route.params.id),
      projectsAPI.getCommunications(route.params.id)
    ])
    project.value = projectRes.data.data
    payments.value = paymentsRes.data.data?.payments || []
    expenses.value = expensesRes.data.data?.expenses || []
    communications.value = commsRes.data.data || []
  } finally {
    loading.value = false
  }
}

const handleSaved = () => {
  showEdit.value = false
  showPaymentModal.value = false
  showExpenseModal.value = false
  showCommModal.value = false
  fetchData()
}

const handleDelete = async () => {
  await projectsAPI.delete(route.params.id)
  router.push('/projects')
}

onMounted(fetchData)
</script>
