import { ref, type Ref } from "vue";

export interface Contact {
  isPrimary: boolean;
  firstName: string;
  email: string;
  phoneNumber: string;
  position?: string;
  birthDate?: string;
  social?: {
    linkedin?: string;
    xing?: string;
    facebook?: string;
  };
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
  primaryContact: Contact;
  secondaryContact?: Contact;
  conversationHook?: string;
  researchResult?: string;
}

export function useCustomers() {
  const { data: customers, error, status } = useFetch("/api/customers");

  const selectedCustomer: Ref<Customer | null> = ref(null);

  const selectCustomer = (customer: Customer) => {
    selectedCustomer.value = customer;
  };

  const getContactCount = (customer: Customer | null) => {
    if (!customer) return 0;
    let count = 0;
    if (customer.primaryContact) count++;
    if (customer.secondaryContact) count++;
    return count;
  };

  return {
    customers,
    selectedCustomer,
    selectCustomer,
    getContactCount,
    status,
    error,
  };
}
