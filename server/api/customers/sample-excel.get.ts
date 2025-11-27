import * as XLSX from "xlsx";
const { utils, write } = XLSX;

//das ist fur die vorlage excell download

export default eventHandler(async (event) => {
    // Define headers and sample data
    const headers = [
        "Firma",
        "Projekt",
        "Branche",
        "Webseite",
        "Telefon",
        "Email",
        "Straße",
        "PLZ",
        "Stadt",
        "Bundesland",
        "Mitarbeiter",
        "Umsatz",
        "Rechtsform",
        "Beschreibung",
        "Öffnungszeiten",
        "Gründung",
        "Vorname",
        "Nachname",
        "KontaktEmail",
        "KontaktTelefon",
        "Position",
        "Geburtsdatum",
        "LinkedIn",
        "Xing",
        "Facebook"
    ];

    const sampleData = [
        {
            "Firma": "Muster GmbH",
            "Projekt": "Kaltakquise Q4",
            "Branche": "IT-Dienstleistungen",
            "Webseite": "https://muster-gmbh.de",
            "Telefon": "+49 30 12345678",
            "Email": "info@muster-gmbh.de",
            "Straße": "Musterstraße 1",
            "PLZ": "10115",
            "Stadt": "Berlin",
            "Bundesland": "Berlin",
            "Mitarbeiter": "50",
            "Umsatz": "5000000",
            "Rechtsform": "GmbH",
            "Beschreibung": "Ein führendes IT-Unternehmen.",
            "Öffnungszeiten": "Mo-Fr 09:00 - 17:00",
            "Gründung": "2010-01-01",
            "Vorname": "Max",
            "Nachname": "Mustermann",
            "KontaktEmail": "max.mustermann@muster-gmbh.de",
            "KontaktTelefon": "+49 170 12345678",
            "Position": "Geschäftsführer",
            "Geburtsdatum": "1980-05-15",
            "LinkedIn": "https://linkedin.com/in/maxmustermann",
            "Xing": "https://xing.com/profile/Max_Mustermann",
            "Facebook": ""
        },
        {
            "Firma": "Beispiel AG",
            "Projekt": "Messe Leads",
            "Branche": "Maschinenbau",
            "Webseite": "https://beispiel-ag.de",
            "Telefon": "+49 89 98765432",
            "Email": "kontakt@beispiel-ag.de",
            "Straße": "Industrieweg 10",
            "PLZ": "80331",
            "Stadt": "München",
            "Bundesland": "Bayern",
            "Mitarbeiter": "250",
            "Umsatz": "25000000",
            "Rechtsform": "AG",
            "Beschreibung": "Spezialist für Präzisionsmaschinen.",
            "Öffnungszeiten": "Mo-Fr 08:00 - 16:30",
            "Gründung": "1995-09-20",
            "Vorname": "Erika",
            "Nachname": "Musterfrau",
            "KontaktEmail": "erika.musterfrau@beispiel-ag.de",
            "KontaktTelefon": "+49 160 98765432",
            "Position": "Vertriebsleiterin",
            "Geburtsdatum": "1975-11-30",
            "LinkedIn": "https://linkedin.com/in/erikamusterfrau",
            "Xing": "",
            "Facebook": "https://facebook.com/erikamusterfrau"
        }
    ];

    // Create workbook and worksheet
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(sampleData, { header: headers });

    // Adjust column widths (optional, but nice)
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    utils.book_append_sheet(wb, ws, "Kunden Import Vorlage");

    // Generate buffer
    const buffer = write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers for download
    setHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    setHeader(event, "Content-Disposition", 'attachment; filename="kunden_import_vorlage.xlsx"');

    return buffer;
});
