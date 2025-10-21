export function getStatusColor(status: string): string {
  switch (status) {
    case 'Hinzugefügt Am':
      return 'bg-green-100 text-green-800'
    case 'In Bearbeitung':
      return 'bg-yellow-100 text-yellow-800'
    case 'Nicht erreicht':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}


