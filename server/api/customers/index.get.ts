import { useDrizzle } from "../../utils/drizzle";
import { assignments, teams, teamMembers, companies } from "../../database/schema";
import { createAuth } from "../../lib/auth";
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
  const role = (currentUser as any).role;
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

  let allowedCompanyIds: number[] | undefined = undefined;
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
  
  if (role === "Admin") {
    // Admin sees ALL (allowedCompanyIds stays undefined = no filter)
    allowedCompanyIds = undefined;
    allowedTaskAssignees = undefined; // See all tasks
  } else if (role === "Teamlead") {
    // Teamlead: See customers assigned to:
    // a) Their Assignments (Direct)
    // b) Their Teams (By Team ID)
    // c) Their Team Members (By Agent ID of member) - Wait, "Teamleaders only the customers that is assigned to him or his team" 
    // Usually "assigned to his team" means assigned to the Team entity OR assigned to a user IN that team.
    // Let's implement: Assigned to Team OR Assigned to Me. ( Simplest interpretation of "his team")
    // If user meant "assigned to any agent who is in my team", I'd need to fetch team members.
    // The prompt says "assigned to him or his team".
    // I will fetch ids for assignments where (teamId IN myTeams) OR (agentId == me).

    const myLedTeams = await db.select().from(teams).where(eq(teams.teamleadId, currentUser.id));
    const myTeamIds = myLedTeams.map(t => t.id);

    // Find assignments matching criteria
    const whereConditions = [eq(assignments.agentId, currentUser.id)];
    let memberIds: string[] = []; // Define memberIds outside the if block

    if (myTeamIds.length > 0) {
      whereConditions.push(inArray(assignments.teamId, myTeamIds));

      // Also include assignments to AGENTS who are in my team?
      // User said: "teamleaders can do imports for his own teams... teamleaders only the customers that is assigned to him or his team"
      // I'll stick to direct ID and Team ID assignment for now. If an agent in the team has a personal assignment that isn't via Team ID, it might be excluded unless I fetch all members.
      // Let's fetch all members to be safe and thorough.
      const memberRecords = await db.select()
        .from(teamMembers)
        .where(inArray(teamMembers.teamId, myTeamIds));
      memberIds = memberRecords.map(m => m.userId);
      if (memberIds.length > 0) {
        whereConditions.push(inArray(assignments.agentId, memberIds));
      }
    }

    const relevantAssignments = await db.select()
      .from(assignments)
      .where(or(...whereConditions));

    allowedCompanyIds = relevantAssignments.map(a => a.companyId);
    
    // Teamleads can see tasks assigned to them or their team members
    allowedTaskAssignees = [currentUser.id, ...memberIds];

  } else {
    // Agent: See ONLY customers assigned to self
    const myAssignments = await db.select()
      .from(assignments)
      .where(eq(assignments.agentId, currentUser.id));

    allowedCompanyIds = myAssignments.map(a => a.companyId);
    
    // Agents can ONLY see their own tasks
    allowedTaskAssignees = [currentUser.id];
  }

  // If filtered role returns NO companies, return empty early
  if (allowedCompanyIds !== undefined && allowedCompanyIds.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0,
      },
    };
  }

  // Build where conditions
  const whereConditions: any[] = [];
  
  // Combine role-based visibility with filter-based visibility
  let finalAllowedIds = allowedCompanyIds;
  
  if (filterCompanyIds) {
    if (allowedCompanyIds) {
      // Intersection: only show companies that match BOTH role AND filter
      finalAllowedIds = allowedCompanyIds.filter(id => filterCompanyIds!.includes(id));
    } else {
      // Admin with filter: use filter ids
      finalAllowedIds = filterCompanyIds;
    }
  }
  
  // Apply final ID filter
  if (finalAllowedIds && finalAllowedIds.length > 0) {
    whereConditions.push(inArray(companies.id, finalAllowedIds));
  } else if (finalAllowedIds && finalAllowedIds.length === 0) {
    // No companies match - return empty
    return {
      data: [],
      pagination: { total: 0, page, limit, pages: 0 },
    };
  }
  
  // Search filter (company name)
  if (searchQuery) {
    whereConditions.push(like(companies.name, `%${searchQuery}%`));
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
  if (filterLastActivity) {
    // For "older" filter, we want companies with NO recent activity
    if (filterLastActivity === 'older') {
      const oneMonthAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
      // This is complex - would need to check both tasks and conversation notes
      // For now, we'll filter on tasks only
      // Note: Simplified query - in production would need proper join
      // For now, skip this complex filter
      // const recentTaskCompanies = await db
      //   .selectDistinct({ companyId: sql`${companies.id}` })
      //   .from(companies)
      //   .leftJoin(sql`tasks`, sql`tasks.company_id = ${companies.id}`)
      //   .where(sql`tasks.created_at >= ${oneMonthAgo.toISOString()}`);
      
      const recentTaskCompanies: any[] = [];
      
      const activeIds = recentTaskCompanies.map((r: any) => r.companyId);
      
      // We want companies NOT in this list
      if (filterCompanyIds) {
        filterCompanyIds = filterCompanyIds.filter(id => !activeIds.includes(id));
      } else if (finalAllowedIds) {
        filterCompanyIds = finalAllowedIds.filter(id => !activeIds.includes(id));
      }
    } else {
      // Recent activity filter
      const startDate = getDateFilter(filterLastActivity);
      // Similar logic for recent activity
      // Simplified: just use task creation dates
      // Note: Complex query - simplified for now
      // const activeCompanies = await db
      //   .selectDistinct({ companyId: sql`${companies.id}` })
      //   .from(companies)
      //   .leftJoin(sql`tasks`, sql`tasks.company_id = ${companies.id}`)
      //   .where(sql`tasks.created_at >= ${startDate.toISOString()}`);
      
      const activeCompanies: any[] = [];
      
      const activeIds = activeCompanies.map((r: any) => r.companyId);
      
      if (activeIds.length > 0) {
        if (filterCompanyIds) {
          filterCompanyIds = filterCompanyIds.filter(id => activeIds.includes(id));
        } else {
          filterCompanyIds = activeIds;
        }
      } else {
        return {
          data: [],
          pagination: { total: 0, page, limit, pages: 0 },
        };
      }
    }
  }
  
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

      // 4. 'assignments'-Beziehung laden (ALLE Assignments für Historie)
      assignments: {
        orderBy: (assignments, { desc }) => [desc(assignments.assignedAt)],
        // KEIN limit mehr - wir holen alle Assignments

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