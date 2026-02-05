import { useDrizzle } from "../../utils/drizzle";
import { assignments, teams, teamMembers, companies } from "../../database/schema";
import { createAuth } from "../../lib/auth";
import { getUserRole, type UserRole } from "../../utils/types";
import { eq, inArray, or, and, sql, like } from "drizzle-orm";

//unsere main customer api

//Datenbank abfrage
export default eventHandler(async (event) => {
  // 1. Authenticate
  const auth = createAuth(event);
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const currentUser = session.user;
  const role: UserRole | undefined = getUserRole(currentUser);
  const db = useDrizzle(event);

  // Pagination params
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 50;
  const offset = (page - 1) * limit;

  // Filter params
  const searchQuery = query.search as string | undefined;
  const filterAgent = query.agent as string | undefined;
  const filterProject = query.project as string | undefined;
  const filterTeam = query.team as string | undefined;
  const filterStatus = query.status as string | undefined;
  const filterAssignedDate = query.assignedDate as string | undefined;
  const filterLastActivity = query.lastActivity as string | undefined;
  const filterDate = query.date as string | undefined;

  let filterCompanyIds: number[] | undefined = undefined;


  // Apply agent/team filters first (if any) to get matching company IDs
  if (filterAgent || filterTeam) {
    let filterQuery = db.query.assignments.findMany({
      columns: { companyId: true },
    });

    // Build where condition
    const filterConditions: any[] = [];
    if (filterAgent) filterConditions.push(eq(assignments.agentId, filterAgent));
    if (filterTeam) filterConditions.push(eq(assignments.teamId, parseInt(filterTeam)));

    const filteredAssignments = await db.query.assignments.findMany({
      columns: { companyId: true },
      where: or(...filterConditions),
    });

    filterCompanyIds = [...new Set(filteredAssignments.map(a => a.companyId))];

    // If no companies match the filter, return empty
    if (filterCompanyIds.length === 0) {
      return {
        data: [],
        pagination: { total: 0, page, limit, pages: 0 },
      };
    }
  }

  // 2. Determine Visibility Scope and Task Filtering
  let allowedTaskAssignees: string[] | undefined = undefined; // For task filtering
  let roleBasedCondition: any = undefined; // For SQL subquery instead of in-memory filtering

  if (role === "Admin") {
    // Admin sees ALL (no filter needed)
    roleBasedCondition = undefined;
    allowedTaskAssignees = undefined; // See all tasks
  } else if (role === "Teamlead") {
    // Teamlead: See customers assigned to:
    // a) Their Assignments (Direct)
    // b) Their Teams (By Team ID)
    // c) Their Team Members (By Agent ID of member)

    const myLedTeams = await db.select().from(teams).where(eq(teams.teamleadId, currentUser.id));
    const myTeamIds = myLedTeams.map(t => t.id);

    // Build assignment conditions
    const assignmentConditions = [eq(assignments.agentId, currentUser.id)];
    let memberIds: string[] = [];

    if (myTeamIds.length > 0) {
      assignmentConditions.push(inArray(assignments.teamId, myTeamIds));

      // Fetch team members
      const memberRecords = await db.select()
        .from(teamMembers)
        .where(inArray(teamMembers.teamId, myTeamIds));
      memberIds = memberRecords.map(m => m.userId);
      if (memberIds.length > 0) {
        assignmentConditions.push(inArray(assignments.agentId, memberIds));
      }
    }

    // Use SQL subquery instead of loading all IDs
    roleBasedCondition = sql`${companies.id} IN (
      SELECT DISTINCT ${assignments.companyId} 
      FROM ${assignments} 
      WHERE ${or(...assignmentConditions)}
    )`;

    // Teamleads can see tasks assigned to them or their team members
    allowedTaskAssignees = [currentUser.id, ...memberIds];

  } else {
    // Agent: See ONLY customers assigned to self

    // Use SQL subquery instead of loading all IDs
    roleBasedCondition = sql`${companies.id} IN (
      SELECT DISTINCT ${assignments.companyId} 
      FROM ${assignments} 
      WHERE ${assignments.agentId} = ${currentUser.id}
    )`;

    // Agents can ONLY see their own tasks
    allowedTaskAssignees = [currentUser.id];
  }

  // Build where conditions
  const whereConditions: any[] = [];

  // Add role-based condition if it exists
  if (roleBasedCondition) {
    whereConditions.push(roleBasedCondition);
  }

  // Apply filter-based visibility (agent/team filters)
  if (filterCompanyIds) {
    if (filterCompanyIds.length === 0) {
      // No companies match the filter
      return {
        data: [],
        pagination: { total: 0, page, limit, pages: 0 },
      };
    }

    // Batch the filter IDs if there are too many (> 500)
    if (filterCompanyIds.length > 500) {
      // Use SQL IN with batches
      const batches: any[] = [];
      for (let i = 0; i < filterCompanyIds.length; i += 500) {
        const batch = filterCompanyIds.slice(i, i + 500);
        batches.push(inArray(companies.id, batch));
      }
      whereConditions.push(or(...batches));
    } else {
      whereConditions.push(inArray(companies.id, filterCompanyIds));
    }
  }

  // Search filter (company name)
  if (searchQuery) {
    // Escape LIKE special characters to prevent pattern attacks
    const escapedSearch = searchQuery.replace(/[%_\\]/g, '\\$&');
    whereConditions.push(like(companies.name, `%${escapedSearch}%`));
  }

  // Project filter
  if (filterProject) {
    whereConditions.push(eq(companies.project, filterProject));
  }

  // Status filter - Note: status field doesn't exist in schema yet
  // TODO: Add status field to companies table
  // if (filterStatus) {
  //   whereConditions.push(eq(companies.status, filterStatus));
  // }

  // Helper function for date filtering
  const getDateFilter = (dateValue: string) => {
    const now = new Date();

    if (dateValue === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateValue === 'week') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateValue === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateValue === 'quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth, 1);
    }
    return new Date(0);
  };

  // Upload date filter (createdAt)
  if (filterDate) {
    const startDate = getDateFilter(filterDate);
    whereConditions.push(sql`${companies.createdAt} >= ${startDate.toISOString()}`);
  }

  // Assigned date filter (need to check assignments table)
  if (filterAssignedDate) {
    const startDate = getDateFilter(filterAssignedDate);
    const recentAssignments = await db.query.assignments.findMany({
      columns: { companyId: true },
      where: sql`${assignments.assignedAt} >= ${startDate.toISOString()}`,
    });
    const assignedCompanyIds = [...new Set(recentAssignments.map(a => a.companyId))];

    if (assignedCompanyIds.length > 0) {
      // Intersect with existing filterCompanyIds
      if (filterCompanyIds) {
        filterCompanyIds = filterCompanyIds.filter(id => assignedCompanyIds.includes(id));
        if (filterCompanyIds.length === 0) {
          return {
            data: [],
            pagination: { total: 0, page, limit, pages: 0 },
          };
        }
      } else {
        filterCompanyIds = assignedCompanyIds;
      }
    } else {
      // No assignments in this date range - return empty
      return {
        data: [],
        pagination: { total: 0, page, limit, pages: 0 },
      };
    }
  }


  // Last activity filter (tasks or notes)
  // TODO: Implement lastActivity filter - requires proper join query on tasks/activities tables
  // Currently disabled as the previous implementation was non-functional (empty array results)
  // if (filterLastActivity) {
  //   // Implementation needed: query tasks/activities joined with companies
  // }


  const whereClause = whereConditions.length > 1
    ? and(...whereConditions)
    : whereConditions.length === 1
      ? whereConditions[0]
      : undefined;

  // Count total matching companies
  let totalQuery = (db as any).select({ count: sql<number>`count(*)` }).from(companies);
  if (whereClause) {
    totalQuery = totalQuery.where(whereClause);
  }
  const [totalResult] = await totalQuery;

  const total = Number(totalResult?.count) || 0;
  const totalPages = Math.ceil(total / limit);

  // 3. Main Query with Filter + Pagination
  const allCompaniesData = await db.query.companies.findMany({
    where: whereClause,
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],
    limit,
    offset,

    with: {
      // 2. 'contacts'-Beziehung laden (im Schema definiert)
      contacts: {
        orderBy: (contacts, { desc }) => [desc(contacts.isPrimary)],
      },
      // 3. 'conversationNotes'-Beziehung laden
      conversationNotes: true,

      // 4. 'assignments'-Beziehung laden (Latest 10 for history, not ALL)
      assignments: {
        orderBy: (assignments, { desc }) => [desc(assignments.assignedAt)],
        limit: 10, // Performance: Only load recent 10 assignments per customer

        // 5. Und die verschachtelte 'agent' (Benutzer)-Beziehung innerhalb der Zuweisung laden
        with: {
          agent: {
            columns: {
              name: true,
            },
          },
          team: {
            columns: {
              name: true,
            },
          },
        },
      },

      // 6. 'tasks'-Beziehung laden (Aufgaben) - OPTIMIZED: Only load active tasks
      tasks: {
        where: (tasks, { ne }) => ne(tasks.status, 'Done'),
        orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
        limit: 10, // Only load first 10 tasks per customer
        with: {
          assignee: {
            columns: {
              name: true,
            },
          },
          assigner: {
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
    const assignments = company.assignments || []; // Alle Assignments
    const latestAssignment = assignments[0]; // Neuestes Assignment
    const note = company.conversationNotes; // 1-zu-1-Beziehung, kommt als Objekt

    // Alle zugewiesenen Agents sammeln (unique)
    const assignedAgents = assignments
      .filter(a => a.agent)
      .map(a => a.agent!.name)
      .filter((name, index, self) => self.indexOf(name) === index);

    return {
      id: company.id,
      companyName: company.name,
      project: company.project || "",

      // 'status'- und 'agent'-Informationen wurden in der Hauptabfrage mitgeladen
      status: latestAssignment?.status || "Hinzugefügt Am",
      assignedAgentId: latestAssignment?.agentId || null,
      assignedAgentName: assignedAgents.length > 0 ? assignedAgents.join(", ") : null,
      assignedAgents: assignedAgents, // Alle Agents als Array
      assignedTeamId: latestAssignment?.teamId || null,

      // Alle Assignments für Zuweisungshistorie
      allAssignments: assignments.map(a => ({
        id: a.id,
        status: a.status,
        agentName: a.agent?.name || null,
        teamName: a.team?.name || null,
        assignedAt: a.assignedAt,
        assignedBy: a.assignedBy,
      })),

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

      // Tasks sind ebenfalls als 'tasks'-Array vorhanden und können direkt gemappt werden
      // Filter tasks based on role (Agents/Teamleads only see their own tasks)
      tasks: company.tasks
        .filter((task) => {
          // If allowedTaskAssignees is undefined (Admin), show all tasks
          if (!allowedTaskAssignees) return true;
          // Otherwise, only show tasks assigned to allowed users
          return task.assignedTo && allowedTaskAssignees.includes(task.assignedTo);
        })
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          followUpDate: task.followUpDate,
          assignedToName: task.assignee?.name || null,
          assignedById: task.assignedBy || null,
          assignedByName: task.assigner?.name || null,
          assignedToId: task.assignedTo || null,
          description: task.description || "",
          completedAt: task.completedAt,
          createdAt: task.createdAt,
        })),
    };
  });

  return {
    data: formattedResults,
    pagination: {
      total,
      page,
      limit,
      pages: totalPages,
    },
  };
});