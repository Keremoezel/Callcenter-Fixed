import { ref, type Ref } from "vue";

export interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  followUpDate: Date | null;
  assignedToName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignedToId: string | null;
  description: string;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Contact {
  isPrimary: boolean;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  position?: string;
  birthDate?: string;
  social?: {
    linkedin?: string;
    xing?: string;
    facebook?: string;
  };
  notizen?: string;
}

export interface Customer {
  id: number;
  companyName: string;
  project: string;
  status: string;
  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
  assignedTeamId?: number | null;
  importedByRole: "Admin" | "Teamlead" | "Agent";
  importedByUserId?: number | null;
  companyForm: string;
  industry: string;
  employeeCount: string;
  website: string;
  phoneNumber: string;
  email: string;
  openingHours: string;
  revenueSize: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  state: string;
  foundingDate: string;
  description: string;
  contacts: Contact[];
  conversationHook?: string;
  researchResult?: string;
  tasks?: Task[];
}

export function useCustomers() {
  // Pagination state
  const page = ref(1);
  const limit = ref(10);
  
  // Filter state
  const filters = ref({
    search: '',
    agent: '',
    project: '',
    team: '',
    status: '',
    assignedDate: '',
    lastActivity: '',
    date: '',
  });
  
  const { data: response, error, status, refresh } = useFetch("/api/customers", {
    query: computed(() => ({
      page: page.value,
      limit: limit.value,
      search: filters.value.search || undefined,
      agent: filters.value.agent || undefined,
      project: filters.value.project || undefined,
      team: filters.value.team || undefined,
      status: filters.value.status || undefined,
      assignedDate: filters.value.assignedDate || undefined,
      lastActivity: filters.value.lastActivity || undefined,
      date: filters.value.date || undefined,
    })),
  });

  // Extract customers from paginated response
  const customers = computed(() => response.value?.data || []);
  const pagination = computed(() => response.value?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  const selectedCustomer: Ref<Customer | null> = ref(null);

  const selectCustomer = (customer: Customer) => {
    selectedCustomer.value = customer;
  };

  const getContactCount = (customer: Customer | null) => {
    if (!customer) return 0;
    return customer.contacts?.length || 0;
  };

  const loadPage = (newPage: number) => {
    page.value = newPage;
  };

  const setFilters = (newFilters: typeof filters.value) => {
    filters.value = newFilters;
    page.value = 1; // Reset to first page when filters change
  };

  return {
    customers,
    pagination,
    selectedCustomer,
    selectCustomer,
    getContactCount,
    status,
    error,
    refresh,
    loadPage,
    page,
    setFilters,
  };
}
