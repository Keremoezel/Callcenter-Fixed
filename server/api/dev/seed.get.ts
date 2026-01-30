import { useDrizzle } from "../../utils/drizzle";
import * as schema from "../../database/schema";
import {
    companies,
    contacts,
    conversationNotes,
    assignments,
} from "../../database/schema";

/**
 * DEV ONLY - Database Seed Endpoint
 *
 * This endpoint seeds the database with test data.
 *
 * Usage: GET /api/dev/seed
 *
 * ⚠️ WARNING: Consider disabling this endpoint in production!
 */
export default eventHandler(async (event) => {
    // Optional: Add environment check for extra safety
    // if (process.env.NODE_ENV === 'production') {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: "This endpoint is disabled in production"
    //   });
    // }

    const db = useDrizzle(event);

    console.log("🌱 Starting database seeding...");

    try {
        // First, create some users (agents/team leads) that we'll reference
        await db.insert(schema.users).values([
            {
                id: "agent-101",
                email: "agent101@example.com",
                name: "Agent 101",
                role: "Agent",
            },
            {
                id: "agent-102",
                email: "agent102@example.com",
                name: "Agent 102",
                role: "Agent",
            },
            {
                id: "agent-103",
                email: "agent103@example.com",
                name: "Agent 103",
                role: "Agent",
            },
            {
                id: "teamlead-1",
                email: "teamlead1@example.com",
                name: "Team Lead 1",
                role: "Teamlead",
            },
        ]);

        console.log("✅ Users inserted (4 users)");

        // Create teams
        await db.insert(schema.teams).values([
            {
                id: 11,
                name: "Team Alpha",
                teamleadId: "teamlead-1",
            },
            {
                id: 12,
                name: "Team Beta",
                teamleadId: "teamlead-1",
            },
        ]);

        console.log("✅ Teams inserted (2 teams)");

        // Insert company 1
        const company1Result = await db
            .insert(companies)
            .values({
                name: "Muster GmbH",
                project: "Projekt",
                legalForm: "GmbH",
                industry: "IT-Services",
                employeeCount: 250,
                website: "www.muster.de",
                phone: "+49 123 456789",
                email: "info@muster.de",
                openingHours: "Mo-Fr 9-17",
                revenueSize: "10-50 Mio",
                street: "Musterstr. 123",
                postalCode: "12345",
                city: "Berlin",
                state: "Berlin",
                foundingDate: "1995",
                description: "Führender IT-Dienstleister",
            })
            .returning({ id: companies.id });

        const company1Id = company1Result[0].id;
        console.log("✅ Company 1 inserted, ID:", company1Id);

        // Insert contacts for company 1
        await db.insert(contacts).values([
            {
                companyId: company1Id,
                firstName: "Max",
                lastName: "Muster",
                email: "max.muster@muster.de",
                phone: "+49 123 456789",
                isPrimary: true,
                position: "Geschäftsführer",
                birthDate: "15.03.1985",
                linkedin: "linkedin.com/in/maxmuster",
                xing: "xing.com/profile/max_muster",
                facebook: "facebook.com/maxmuster",
            },
            {
                companyId: company1Id,
                firstName: "Anna",
                lastName: "Schmidt",
                email: "anna.schmidt@muster.de",
                phone: "+49 123 456790",
                isPrimary: false,
                position: "Einkaufsleiter",
                birthDate: "22.07.1978",
                linkedin: "linkedin.com/in/annaschm",
                xing: "xing.com/profile/anna_schmidt",
                facebook: "facebook.com/annaschm",
            },
            {
                companyId: company1Id,
                firstName: "Peter",
                lastName: "Mueller",
                email: "peter.mueller@muster.de",
                phone: "+49 123 456791",
                isPrimary: false,
                position: "IT-Leiter",
                birthDate: "10.09.1980",
                linkedin: "linkedin.com/in/petermueller",
                xing: "xing.com/profile/peter_mueller",
                facebook: "facebook.com/petermueller",
            },
        ]);

        console.log("✅ Contacts for company 1 inserted (3 contacts)");

        // Insert conversation notes for company 1
        await db.insert(conversationNotes).values({
            companyId: company1Id,
            conversationHook:
                "Sehr kooperativ, interessiert an neuen Technologien. Bevorzugt Meetings am Vormittag.",
            researchResult: "Technologieführer in Berlin. Sehr innovativ.",
        });

        console.log("✅ Notes for company 1 inserted");

        // Insert assignment for company 1
        await db.insert(assignments).values({
            companyId: company1Id,
            status: "Hinzugefügt Am",
            agentId: "agent-101",
            teamId: 11,
        });

        console.log("✅ Assignment for company 1 inserted");

        // ============================================
        // SEED COMPANY 2: Test GmbH
        // ============================================
        const company2Result = await db
            .insert(companies)
            .values({
                name: "Test GmbH",
                project: "Projekt",
                legalForm: "GmbH",
                industry: "Handel",
                employeeCount: 150,
                website: "www.test.de",
                phone: "+49 987 654321",
                email: "info@test.de",
                openingHours: "Mo-Fr 8-18",
                revenueSize: "5-10 Mio",
                street: "Teststr. 456",
                postalCode: "54321",
                city: "Hamburg",
                state: "Hamburg",
                foundingDate: "2001",
                description: "Handelsunternehmen",
            })
            .returning({ id: companies.id });

        const company2Id = company2Result[0].id;
        console.log("✅ Company 2 inserted, ID:", company2Id);

        // Insert contacts for company 2
        await db.insert(contacts).values([
            {
                companyId: company2Id,
                firstName: "Anna",
                lastName: "Test",
                email: "anna.test@test.de",
                phone: "+49 987 654321",
                isPrimary: true,
                position: "Vertriebsleiter",
                birthDate: "02.01.1987",
                linkedin: "linkedin.com/in/annatest",
                xing: "xing.com/profile/anna_test",
                facebook: "facebook.com/annatest",
            },
            {
                companyId: company2Id,
                firstName: "Thomas",
                lastName: "Test",
                email: "thomas.test@test.de",
                phone: "+49 987 654322",
                isPrimary: false,
                position: "Marketing Manager",
                birthDate: "09.09.1980",
                linkedin: "linkedin.com/in/thomastest",
                xing: "xing.com/profile/thomas_test",
                facebook: "facebook.com/thomastest",
            },
        ]);

        console.log("✅ Contacts for company 2 inserted (2 contacts)");

        // Insert conversation notes for company 2
        await db.insert(conversationNotes).values({
            companyId: company2Id,
            conversationHook: "Fokus auf Wachstum und Expansion.",
            researchResult: "Etabliertes Handelsunternehmen in Hamburg.",
        });

        console.log("✅ Notes for company 2 inserted");

        // Insert assignment for company 2
        await db.insert(assignments).values({
            companyId: company2Id,
            status: "Hinzugefügt Am",
            agentId: "agent-102",
            teamId: 11,
        });

        console.log("✅ Assignment for company 2 inserted");

        // ============================================
        // SEED COMPANY 3: Aufgabe GmbH
        // ============================================
        const company3Result = await db
            .insert(companies)
            .values({
                name: "Aufgabe GmbH",
                project: "Projekt",
                legalForm: "GmbH",
                industry: "Consulting",
                employeeCount: 75,
                website: "www.aufgabe.de",
                phone: "+49 555 123456",
                email: "info@aufgabe.de",
                openingHours: "Mo-Fr 9-18",
                revenueSize: "1-5 Mio",
                street: "Aufgabenstr. 789",
                postalCode: "67890",
                city: "München",
                state: "Bayern",
                foundingDate: "2010",
                description: "Beratungsunternehmen",
            })
            .returning({ id: companies.id });

        const company3Id = company3Result[0].id;
        console.log("✅ Company 3 inserted, ID:", company3Id);

        // Insert contacts for company 3
        await db.insert(contacts).values([
            {
                companyId: company3Id,
                firstName: "Thomas",
                lastName: "Aufgabe",
                email: "thomas.aufgabe@aufgabe.de",
                phone: "+49 555 123456",
                isPrimary: true,
                position: "Senior Berater",
                birthDate: "18.05.1982",
                linkedin: "linkedin.com/in/thomasaufgabe",
                xing: "xing.com/profile/thomas_aufgabe",
                facebook: "facebook.com/thomas.aufgabe",
            },
            {
                companyId: company3Id,
                firstName: "Maria",
                lastName: "Aufgabe",
                email: "maria.aufgabe@aufgabe.de",
                phone: "+49 555 123457",
                isPrimary: false,
                position: "Projektmanager",
                birthDate: "27.11.1990",
                linkedin: "linkedin.com/in/mariaaufgabe",
                xing: "xing.com/profile/maria_aufgabe",
                facebook: "facebook.com/maria.aufgabe",
            },
            {
                companyId: company3Id,
                firstName: "Klaus",
                lastName: "Berger",
                email: "klaus.berger@aufgabe.de",
                phone: "+49 555 123458",
                isPrimary: false,
                position: "Personalleiter",
                birthDate: "12.03.1975",
                linkedin: "linkedin.com/in/klausberger",
                xing: "xing.com/profile/klaus_berger",
                facebook: "facebook.com/klausberger",
            },
            {
                companyId: company3Id,
                firstName: "Julia",
                lastName: "Fischer",
                email: "julia.fischer@aufgabe.de",
                phone: "+49 555 123459",
                isPrimary: false,
                position: "Finanzcontroller",
                birthDate: "05.08.1988",
                linkedin: "linkedin.com/in/juliafischer",
                xing: "xing.com/profile/julia_fischer",
                facebook: "facebook.com/juliafischer",
            },
        ]);

        console.log("✅ Contacts for company 3 inserted (4 contacts)");

        // Insert conversation notes for company 3
        await db.insert(conversationNotes).values({
            companyId: company3Id,
            conversationHook:
                "Vertrauenswürdiges Beratungsunternehmen mit starkem Team.",
            researchResult: "Wachsendes Beratungsunternehmen in München.",
        });

        console.log("✅ Notes for company 3 inserted");

        // Insert assignment for company 3
        await db.insert(assignments).values({
            companyId: company3Id,
            status: "Hinzugefügt Am",
            agentId: null,
            teamId: 12,
        });

        console.log("✅ Assignment for company 3 inserted");

        // ============================================
        // SEED COMPANY 4: Perfekt GmbH
        // ============================================
        const company4Result = await db
            .insert(companies)
            .values({
                name: "Perfekt GmbH",
                project: "test Projekt",
                legalForm: "GmbH",
                industry: "Software",
                employeeCount: 500,
                website: "www.perfekt.de",
                phone: "+49 777 987654",
                email: "info@perfekt.de",
                openingHours: "Mo-Fr 8-17",
                revenueSize: "50-100 Mio",
                street: "Perfektstr. 321",
                postalCode: "98765",
                city: "Frankfurt",
                state: "Hessen",
                foundingDate: "1988",
                description: "Softwareentwicklung",
            })
            .returning({ id: companies.id });

        const company4Id = company4Result[0].id;
        console.log("✅ Company 4 inserted, ID:", company4Id);

        // Insert contacts for company 4
        await db.insert(contacts).values([
            {
                companyId: company4Id,
                firstName: "Sarah",
                lastName: "Perfekt",
                email: "sarah.perfekt@perfekt.de",
                phone: "+49 777 987654",
                isPrimary: true,
                position: "CTO",
                birthDate: "30.10.1989",
                linkedin: "linkedin.com/in/sarahperfekt",
                xing: "xing.com/profile/sarah_perfekt",
                facebook: "facebook.com/sarah.perfekt",
            },
            {
                companyId: company4Id,
                firstName: "Michael",
                lastName: "Perfekt",
                email: "michael.perfekt@perfekt.de",
                phone: "+49 777 987655",
                isPrimary: false,
                position: "Lead Developer",
                birthDate: "15.03.1991",
                linkedin: "linkedin.com/in/michaelperfekt",
                xing: "xing.com/profile/michael_perfekt",
                facebook: "facebook.com/michael.perfekt",
            },
            {
                companyId: company4Id,
                firstName: "Lisa",
                lastName: "Perfekt",
                email: "lisa.perfekt@perfekt.de",
                phone: "+49 777 987656",
                isPrimary: false,
                position: "Product Manager",
                birthDate: "22.06.1992",
                linkedin: "linkedin.com/in/lisaperfekt",
                xing: "xing.com/profile/lisa_perfekt",
                facebook: "facebook.com/lisa.perfekt",
            },
        ]);

        console.log("✅ Contacts for company 4 inserted (3 contacts)");

        // Insert conversation notes for company 4
        await db.insert(conversationNotes).values({
            companyId: company4Id,
            conversationHook:
                "Innovatives Softwareunternehmen mit hohem Wachstumspotenzial.",
            researchResult:
                "Marktführend im Software-Bereich. Sehr innovatives Team.",
        });

        console.log("✅ Notes for company 4 inserted");

        // Insert assignment for company 4
        await db.insert(assignments).values({
            companyId: company4Id,
            status: "Hinzugefügt Am",
            agentId: "agent-103",
            teamId: null,
        });

        console.log("✅ Assignment for company 4 inserted");

        // ============================================
        // SEED COMPANY 5: Tech Solutions GmbH
        // ============================================
        const company5Result = await db
            .insert(companies)
            .values({
                name: "Tech Solutions GmbH",
                project: "Digital Transformation",
                legalForm: "GmbH",
                industry: "IT-Consulting",
                employeeCount: 120,
                website: "www.tech-solutions.de",
                phone: "+49 201 123456",
                email: "info@tech-solutions.de",
                openingHours: "Mo-Fr 9-18",
                revenueSize: "10-25 Mio",
                street: "Tech-Straße 45",
                postalCode: "40221",
                city: "Düsseldorf",
                state: "Nordrhein-Westfalen",
                foundingDate: "2015",
                description: "IT-Beratung und Lösungen für digitale Transformation",
            })
            .returning({ id: companies.id });

        const company5Id = company5Result[0].id;
        console.log("✅ Company 5 inserted, ID:", company5Id);

        // Insert contacts for company 5
        await db.insert(contacts).values([
            {
                companyId: company5Id,
                firstName: "David",
                lastName: "Schmidt",
                email: "david.schmidt@tech-solutions.de",
                phone: "+49 201 123456",
                isPrimary: true,
                position: "Geschäftsführer",
                birthDate: "08.04.1983",
                linkedin: "linkedin.com/in/davidschmidt",
                xing: "xing.com/profile/david_schmidt",
                facebook: "facebook.com/david.schmidt",
            },
            {
                companyId: company5Id,
                firstName: "Sophie",
                lastName: "Weber",
                email: "sophie.weber@tech-solutions.de",
                phone: "+49 201 123457",
                isPrimary: false,
                position: "IT-Direktor",
                birthDate: "12.09.1986",
                linkedin: "linkedin.com/in/sophieweber",
                xing: "xing.com/profile/sophie_weber",
                facebook: "facebook.com/sophie.weber",
            },
            {
                companyId: company5Id,
                firstName: "Markus",
                lastName: "Koch",
                email: "markus.koch@tech-solutions.de",
                phone: "+49 201 123458",
                isPrimary: false,
                position: "Technischer Leiter",
                birthDate: "25.11.1987",
                linkedin: "linkedin.com/in/markuskoch",
                xing: "xing.com/profile/markus_koch",
                facebook: "facebook.com/markus.koch",
            },
            {
                companyId: company5Id,
                firstName: "Nicole",
                lastName: "Schneider",
                email: "nicole.schneider@tech-solutions.de",
                phone: "+49 201 123459",
                isPrimary: false,
                position: "Projektkoordinatorin",
                birthDate: "03.02.1991",
                linkedin: "linkedin.com/in/nicoleschneider",
                xing: "xing.com/profile/nicole_schneider",
                facebook: "facebook.com/nicole.schneider",
            },
        ]);

        console.log("✅ Contacts for company 5 inserted (4 contacts)");

        // Insert conversation notes for company 5
        await db.insert(conversationNotes).values({
            companyId: company5Id,
            conversationHook:
                "Spezialisiert auf digitale Transformation. Sehr professionelles Team.",
            researchResult:
                "Wachsendes IT-Beratungsunternehmen mit starkem technischem Know-how.",
        });

        console.log("✅ Notes for company 5 inserted");

        // Insert assignment for company 5
        await db.insert(assignments).values({
            companyId: company5Id,
            status: "In Bearbeitung",
            agentId: "agent-101",
            teamId: 11,
        });

        console.log("✅ Assignment for company 5 inserted");

        console.log("🎉 Database seeding completed successfully!");

        return {
            success: true,
            message: "Database seeded successfully!",
            seeded: {
                users: 4,
                teams: 2,
                companies: 5,
                contacts: 16,
                conversationNotes: 5,
                assignments: 5,
            },
        };
    } catch (error: any) {
        console.error("❌ Error seeding database:", error);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to seed database: ${error.message}`,
        });
    }
});
