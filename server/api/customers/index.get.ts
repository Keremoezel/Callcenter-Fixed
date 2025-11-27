import { useDrizzle } from "../../utils/drizzle";

//unsere main customer api

//Datenbank abfrage
export default eventHandler(async () => {
  const db = useDrizzle();

  const allCompaniesData = await db.query.companies.findMany({
    // 1. Firmen nach Erstellungsdatum (neueste zuerst) sortieren
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],

    with: {
      // 2. 'contacts'-Beziehung laden (im Schema definiert)
      contacts: {
        // Kontakte sortieren, sodass 'isPrimary' (Primärkontakt) zuerst kommt
        orderBy: (contacts, { desc }) => [desc(contacts.isPrimary)],
      },
      // 3. 'conversationNotes'-Beziehung laden
      conversationNotes: true,

      // 4. 'assignments'-Beziehung laden
      assignments: {
        orderBy: (assignments, { desc }) => [desc(assignments.assignedAt)],
        limit: 1,

        // 5. Und die verschachtelte 'agent' (Benutzer)-Beziehung innerhalb der Zuweisung laden
        with: {
          agent: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  });

  const formattedResults = allCompaniesData.map((company) => {
    // Die Daten kommen von Drizzle bereits gruppiert und verschachtelt an
    const assignment = company.assignments[0]; // Dank 'limit: 1'
    const note = company.conversationNotes; // 1-zu-1-Beziehung, kommt als Objekt

    return {
      id: company.id,
      companyName: company.name,
      project: company.project || "",

      // 'status'- und 'agent'-Informationen wurden in der Hauptabfrage mitgeladen
      status: assignment?.status || "Hinzugefügt Am",
      assignedAgentId: assignment?.agentId || null,
      assignedAgentName: assignment?.agent?.name || null, // Kam aus der Hauptabfrage
      assignedTeamId: assignment?.teamId || null,

      companyForm: company.legalForm || "",
      industry: company.industry || "",
      employeeCount: company.employeeCount?.toString() || "0",
      website: company.website || "",
      phoneNumber: company.phone || "",
      email: company.email || "",
      openingHours: company.openingHours || "",
      revenueSize: company.revenueSize || "",
      streetAddress: company.street || "",
      postalCode: company.postalCode || "",
      city: company.city || "",
      state: company.state || "",
      foundingDate: company.foundingDate || "",
      description: company.description || "",

      // Notizen wurden ebenfalls in der Hauptabfrage geladen
      conversationHook: note?.conversationHook || "",
      researchResult: note?.researchResult || "",

      // Kontakte sind bereits als 'contacts'-Array vorhanden und können direkt gemappt werden
      contacts: company.contacts.map((contact) => ({
        id: contact.id,
        isPrimary: contact.isPrimary,
        firstName: contact.firstName,
        lastName: contact.lastName || "",
        email: contact.email || "",
        phoneNumber: contact.phone || "",
        position: contact.position || "",
        birthDate: contact.birthDate || "",
        social: {
          linkedin: contact.linkedin || "",
          xing: contact.xing || "",
          facebook: contact.facebook || "",
        },
        notizen: contact.notes || "",
      })),
    };
  });

  return formattedResults;
});
