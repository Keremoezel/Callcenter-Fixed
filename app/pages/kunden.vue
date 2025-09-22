<script setup lang="ts">
import { ref, computed } from 'vue'

type Customer = {
  id: number
  // core
  kunde_besitzer: string
  kunde_name: string
  tel: string
  webseite: string
  kunde_typ: string
  branche: string
  beschaeftigte: number
  jahreseinnahmen: string
  erstellt_durch: string
  // addresses
  rechnungsadresse_strasse: string
  versandadresse_strasse: string
  rechnungsadresse_stadt: string
  versandadresse_stadt: string
  rechnungsadresse_bundesland: string
  versandadresse_bundesland: string
  rechnungsadresse_plz: string
  versandadresse_plz: string
  rechnungsadresse_land: string
  versandadresse_land: string
  // misc
  kunde_nummer: string
  oeffnungszeiten: string
  hauptstelle: boolean
  zusatzinfos: string
  email: string
  vorname: string
  nachname: string
  abteilung: string
}

// ---- MOCK DATA ----
const rows = ref<Customer[]>([
  {
    id: 1,
    kunde_besitzer: 'Max Mustermann',
    kunde_name: 'Acme GmbH',
    tel: '+49 123 456789',
    webseite: 'https://acme.de',
    kunde_typ: 'Bestand',
    branche: 'IT',
    beschaeftigte: 50,
    jahreseinnahmen: '1.000.000 €',
    erstellt_durch: 'Admin',
    rechnungsadresse_strasse: 'Musterstraße 1',
    versandadresse_strasse: 'Industriestraße 10',
    rechnungsadresse_stadt: 'Berlin',
    versandadresse_stadt: 'Hamburg',
    rechnungsadresse_bundesland: 'Berlin',
    versandadresse_bundesland: 'Hamburg',
    rechnungsadresse_plz: '10115',
    versandadresse_plz: '20095',
    rechnungsadresse_land: 'Deutschland',
    versandadresse_land: 'Deutschland',
    kunde_nummer: 'CUST-001',
    oeffnungszeiten: 'Mo–Fr 9–17',
    hauptstelle: true,
    zusatzinfos: 'Langjähriger Kunde',
    email: 'info@acme.de',
    vorname: 'Anna',
    nachname: 'Müller',
    abteilung: 'Einkauf'
  },
  {
    id: 2,
    kunde_besitzer: 'Lisa Meier',
    kunde_name: 'Muster AG',
    tel: '+49 987 654321',
    webseite: 'https://muster-ag.de',
    kunde_typ: 'Lead',
    branche: 'Handel',
    beschaeftigte: 200,
    jahreseinnahmen: '5.000.000 €',
    erstellt_durch: 'Vertrieb',
    rechnungsadresse_strasse: 'Bahnhofstr. 20',
    versandadresse_strasse: 'Hafenstr. 30',
    rechnungsadresse_stadt: 'München',
    versandadresse_stadt: 'Hamburg',
    rechnungsadresse_bundesland: 'Bayern',
    versandadresse_bundesland: 'Hamburg',
    rechnungsadresse_plz: '80331',
    versandadresse_plz: '20457',
    rechnungsadresse_land: 'Deutschland',
    versandadresse_land: 'Deutschland',
    kunde_nummer: 'CUST-002',
    oeffnungszeiten: 'Mo–Fr 8–18',
    hauptstelle: false,
    zusatzinfos: 'Interessent Messe 2024',
    email: 'kontakt@muster-ag.de',
    vorname: 'Peter',
    nachname: 'Schmidt',
    abteilung: 'IT'
  }
])

const columns = [
  { accessorKey: 'kunde_besitzer', header: 'Kunde-Besitzer' },
  { accessorKey: 'kunde_name', header: 'Kunde-Name' },
  { accessorKey: 'tel', header: 'Tel.' },
  { accessorKey: 'webseite', header: 'Webseite' },
  { accessorKey: 'kunde_typ', header: 'Kunde Typ' },
  { accessorKey: 'branche', header: 'Branche' },
  { accessorKey: 'beschaeftigte', header: 'Beschäftigte' },
  { accessorKey: 'jahreseinnahmen', header: 'Jahreseinnahmen' },
  { accessorKey: 'erstellt_durch', header: 'Erstellt durch' },
  { accessorKey: 'rechnungsadresse_strasse', header: 'Rechnungsadresse - Straße' },
  { accessorKey: 'versandadresse_strasse', header: 'Versandadresse - Straße' },
  { accessorKey: 'rechnungsadresse_stadt', header: 'Rechnungsadresse - Stadt' },
  { accessorKey: 'versandadresse_stadt', header: 'Versandadresse - Stadt' },
  { accessorKey: 'rechnungsadresse_bundesland', header: 'Rechnungsadresse - Bundesland' },
  { accessorKey: 'versandadresse_bundesland', header: 'Versandadresse - Bundesland' },
  { accessorKey: 'rechnungsadresse_plz', header: 'Rechnungsadresse - PLZ' },
  { accessorKey: 'versandadresse_plz', header: 'Versandadresse - PLZ' },
  { accessorKey: 'rechnungsadresse_land', header: 'Rechnungsadresse - Land' },
  { accessorKey: 'versandadresse_land', header: 'Versandadresse - Land' },
  { accessorKey: 'kunde_nummer', header: 'Kunde-Nummer' },
  { accessorKey: 'oeffnungszeiten', header: 'Öffnungszeiten' },
  { accessorKey: 'hauptstelle', header: 'Hauptstelle' },
  { accessorKey: 'zusatzinfos', header: 'Zusatzinfos' },
  { accessorKey: 'email', header: 'E-Mail' },
  { accessorKey: 'vorname', header: 'Vorname' },
  { accessorKey: 'nachname', header: 'Name' },
  { accessorKey: 'abteilung', header: 'Abteilung' },
  { accessorKey: 'aktion', header: 'Aktion' }
]

// ---- INFO MODAL ----
const showModal = ref(false)
const selected = ref<Customer | null>(null)

function openInfo(row: any) {
  console.log('openInfo called with:', row)
  selected.value = row
  showModal.value = true
  console.log('Modal should open, showModal:', showModal.value)
}

// optional: simple search over a few fields
const q = ref('')
const filtered = computed(() => {
  if (!q.value) return rows.value
  const s = q.value.toLowerCase()
  return rows.value.filter(r =>
    [
      r.kunde_name,
      r.kunde_nummer,
      r.kunde_besitzer,
      r.email,
      r.branche,
      r.kunde_typ
    ]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(s))
  )
})
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Kundenübersicht (Mock • Nuxt UI)</h1>
      <UInput v-model="q" placeholder="Suchen (Name, Nummer, Besitzer…)" />
    </div>
    
    <UCard>
      <div class="overflow-x-auto">
        <UTable :data="filtered" :columns="columns" :empty-state="{ icon: 'i-lucide-users', label: 'Keine Einträge' }">
          <!-- make website clickable -->
          <template #webseite-data="{ row }">
            <ULink :to="(row as any).webseite" target="_blank" class="truncate max-w-[220px]">
              {{ (row as any).webseite }}
            </ULink>
          </template>

          <!-- booleans as badges -->
          <template #hauptstelle-data="{ row }">
            <UBadge :color="(row as any).hauptstelle ? 'success' : 'neutral'">
              {{ (row as any).hauptstelle ? 'Ja' : 'Nein' }}
            </UBadge>
          </template>

          <!-- numbers aligned -->
          <template #beschaeftigte-data="{ row }">
            <div class="text-right tabular-nums">{{ (row as any).beschaeftigte }}</div>
          </template>
          <template #jahreseinnahmen-data="{ row }">
            <div class="text-right">{{ (row as any).jahreseinnahmen }}</div>
          </template>

          <!-- action button -->
          <template #aktion-data="{ row }">
            <UButton icon="i-lucide-info" size="xs" @click="openInfo(row as any)">
              Info
            </UButton>
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>
