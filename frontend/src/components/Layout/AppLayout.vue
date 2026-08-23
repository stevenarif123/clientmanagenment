<template>
  <div class="flex h-screen bg-background">
    <!-- Desktop Sidebar -->
    <aside class="w-64 border-r hidden lg:flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <svg class="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <span class="font-semibold tracking-tight">ClientHub</span>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1">
        <router-link 
          v-for="item in navigation" 
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
          :class="isActive(item.to) 
            ? 'bg-secondary text-foreground font-medium' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.name }}
        </router-link>
      </nav>
      
      <!-- User -->
      <div class="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button class="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted transition-colors text-left">
              <Avatar class="h-8 w-8">
                <AvatarFallback class="text-xs">{{ authStore.admin?.username?.charAt(0)?.toUpperCase() || 'A' }}</AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ authStore.admin?.username }}</p>
                <p class="text-xs text-muted-foreground">Admin</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive">
              <LogOut class="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
    
    <!-- Mobile Header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b flex items-center justify-between px-4">
      <Sheet v-model:open="mobileMenuOpen">
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" class="-ml-2">
            <Menu class="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="w-64 p-0">
          <SheetHeader class="h-14 flex items-center px-6 border-b">
            <SheetTitle class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <svg class="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <span class="font-semibold">ClientHub</span>
            </SheetTitle>
          </SheetHeader>
          <nav class="p-4 space-y-1">
            <router-link 
              v-for="item in navigation" 
              :key="item.name"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors"
              :class="isActive(item.to) 
                ? 'bg-secondary text-foreground font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
              @click="mobileMenuOpen = false"
            >
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.name }}
            </router-link>
          </nav>
          <Separator />
          <div class="p-4">
            <Button variant="ghost" class="w-full justify-start text-destructive hover:text-destructive" @click="handleLogout">
              <LogOut class="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <span class="font-semibold">ClientHub</span>
      
      <Avatar class="h-8 w-8">
        <AvatarFallback class="text-xs">{{ authStore.admin?.username?.charAt(0)?.toUpperCase() || 'A' }}</AvatarFallback>
      </Avatar>
    </div>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto pt-14 lg:pt-0">
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" class="animate-in" />
          </Transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Inbox, 
  Settings, 
  BarChart3,
  Menu,
  LogOut
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Clients', to: '/clients', icon: Users },
  { name: 'Projects', to: '/projects', icon: FolderKanban },
  { name: 'Submissions', to: '/submissions', icon: Inbox },
  { name: 'Services', to: '/services', icon: Settings },
  { name: 'Reports', to: '/reports', icon: BarChart3 }
]

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  mobileMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>
