import { tasks } from "../database/schema";
import type { H3Event } from "h3";

/**
 * Creates an automatic task when a customer is assigned to an agent
 * 
 * @param db - Database instance
 * @param companyId - Customer ID
 * @param companyName - Customer name for task title
 * @param assignedTo - Agent ID who receives the task
 * @param assignedBy - User ID who created the assignment
 * @returns Created task or null if error
 */
export async function createAutoTask(
  db: any,
  companyId: number,
  companyName: string,
  assignedTo: string,
  assignedBy: string
) {
  try {
    const newTask = {
      title: `Erstkontakt: ${companyName}`,
      companyId: companyId,
      status: "Nicht angefasst",
      priority: "Mittel",
      assignedTo: assignedTo,
      assignedBy: assignedBy,
      description: `Automatisch erstellt bei Kundenzuweisung`,
      dueDate: null, // Can be set later
      followUpDate: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [createdTask] = await db.insert(tasks).values(newTask).returning();
    
    console.log(`✅ Auto-Task erstellt: "${newTask.title}" für Agent ${assignedTo}`);
    
    return createdTask;
  } catch (error) {
    console.error("❌ Fehler beim Erstellen des Auto-Tasks:", error);
    return null;
  }
}
