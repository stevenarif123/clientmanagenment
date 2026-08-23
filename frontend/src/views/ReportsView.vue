<template>
  <div>
    <header class="page-header">
      <div>
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle">Financial overview and exports</p>
      </div>
    </header>

    <!-- Date Range -->
    <div class="flex flex-wrap items-center gap-4 mb-8">
      <div class="flex items-center gap-2">
        <Label class="text-sm text-muted-foreground">From</Label>
        <Input v-model="dateRange.start" type="date" class="w-auto" />
      </div>
      <div class="flex items-center gap-2">
        <Label class="text-sm text-muted-foreground">To</Label>
        <Input v-model="dateRange.end" type="date" class="w-auto" />
      </div>
      <Button variant="outline" @click="fetchReport">
        <RefreshCw class="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else class="space-y-8">
      <!-- Summary Cards -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Total Revenue</p>
            <p class="stat-value text-emerald-600">Rp {{ formatNumber(report.total_revenue || 0) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Total Expenses</p>
            <p class="stat-value text-red-600">Rp {{ formatNumber(report.total_expenses || 0) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Net Profit</p>
            <p class="stat-value" :class="profit >= 0 ? 'text-emerald-600' : 'text-red-600'">
              Rp {{ formatNumber(profit) }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="stat-label">Completed Projects</p>
            <p class="stat-value">{{ report.completed_projects || 0 }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Export Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Export Data</CardTitle>
          <CardDescription>Download reports in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-3">
            <Button variant="outline" @click="exportReport('csv')">
              <FileSpreadsheet class="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" @click="exportReport('pdf')">
              <FileText class="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Projects Table -->
      <Card v-if="report.projects?.length">
        <CardHeader>
          <CardTitle class="text-base">Projects in Period</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead class="hidden sm:table-cell">Client</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead class="hidden md:table-cell">Expenses</TableHead>
              <TableHead>Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in report.projects" :key="p.id">
              <TableCell class="font-medium">{{ p.title }}</TableCell>
              <TableCell class="hidden sm:table-cell text-muted-foreground">{{ p.client_name }}</TableCell>
              <TableCell class="text-emerald-600 currency">{{ formatNumber(p.total_received || 0) }}</TableCell>
              <TableCell class="hidden md:table-cell text-red-600 currency">{{ formatNumber(p.total_expenses || 0) }}</TableCell>
              <TableCell class="currency" :class="(p.total_received - p.total_expenses) >= 0 ? 'text-emerald-600' : 'text-red-600'">
                {{ formatNumber((p.total_received || 0) - (p.total_expenses || 0)) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reportsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, RefreshCw, FileSpreadsheet, FileText } from 'lucide-vue-next'

const loading = ref(true)
const report = ref({})
const dateRange = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

const profit = computed(() => (report.value.total_revenue || 0) - (report.value.total_expenses || 0))
const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n)

const fetchReport = async () => {
  loading.value = true
  try {
    const response = await reportsAPI.getFinancial(dateRange.value)
    report.value = response.data.data
  } finally {
    loading.value = false
  }
}

const exportReport = async (format) => {
  try {
    const token = localStorage.getItem('auth_token')
    const baseURL = import.meta.env.VITE_API_URL || '/api'
    const url = `${baseURL}/reports/export/projects?format=${format}&start_date=${dateRange.value.start}&end_date=${dateRange.value.end}`
    
    // For PDF, fetch and open in new window
    if (format === 'pdf') {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const html = await response.text()
      const newWindow = window.open('', '_blank')
      if (!newWindow) {
        alert('Please allow popups to view PDF report')
        return
      }
      newWindow.document.write(html)
      newWindow.document.close()
      return
    }
    
    // For CSV, download as blob
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Export failed')
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `projects_report_${dateRange.value.start}_${dateRange.value.end}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (err) {
    alert('Failed to export report')
  }
}

onMounted(fetchReport)
</script>
