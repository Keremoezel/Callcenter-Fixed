import * as XLSX from "xlsx";
const { utils, write } = XLSX;

//das ist fur die vorlage excell download

export default eventHandler(async (event) => {
    // Define headers and sample data
    const headers = [
        "Firma",
        "STR. HNR",
        "Plz",
        "Ort",
        "Land",
        "Bundesland / Bezirk",
        "Telefon",
        "Webseite",
        "E-Mail-büro",
        "Mitarbeiter (Staffel)",
        "Umsatz (Staffel)",
        "Gründung",
        "Rechtsform",
        "Gegenstand",
        "LinkedIn",
        "XING",
        "Person-Anrede",
        "Person-Vorname",
        "Person-Nachname",
        "Person-Funktion",
        "Person-Tätigkeit",
        "Person-Geboren",
        "Person-Telefon",
        "Person-E-Mail",
        "Person-Xing",
        "Person-LinkedIn",
        "Branche-Text-1"
    ];

    const sampleData = [
        {
            "Firma": "Muster GmbH",
            "STR. HNR": "Musterstraße 1",
            "Plz": "10115",
            "Ort": "Berlin",
            "Land": "Deutschland",
            "Bundesland / Bezirk": "Berlin",
            "Telefon": "+49 30 12345678",
            "Webseite": "https://muster-gmbh.de",
            "E-Mail-büro": "info@muster-gmbh.de",
            "Mitarbeiter (Staffel)": "21 - 50",
            "Umsatz (Staffel)": "1 Mio. € - 5 Mio. €",
            "Gründung": "2010-01-01",
            "Rechtsform": "GmbH",
            "Gegenstand": "Ein führendes IT-Unternehmen.",
            "LinkedIn": "https://linkedin.com/company/muster-gmbh",
            "XING": "https://xing.com/pages/muster-gmbh",
            "Person-Anrede": "Herr",
            "Person-Vorname": "Max",
            "Person-Nachname": "Mustermann",
            "Person-Funktion": "Geschäftsführer",
            "Person-Tätigkeit": "Softwareentwicklung",
            "Person-Geboren": "1980-05-15",
            "Person-Telefon": "+49 170 12345678",
            "Person-E-Mail": "max.mustermann@muster-gmbh.de",
            "Person-Xing": "https://xing.com/profile/Max_Mustermann",
            "Person-LinkedIn": "https://linkedin.com/in/maxmustermann",
            "Branche-Text-1": "IT-Dienstleistungen"
        },
        {
            "Firma": "Beispiel AG",
            "STR. HNR": "Industrieweg 10",
            "Plz": "80331",
            "Ort": "München",
            "Land": "Deutschland",
            "Bundesland / Bezirk": "Bayern",
            "Telefon": "+49 89 98765432",
            "Webseite": "https://beispiel-ag.de",
            "E-Mail-büro": "kontakt@beispiel-ag.de",
            "Mitarbeiter (Staffel)": "101 - 250",
            "Umsatz (Staffel)": "10 Mio. € - 50 Mio. €",
            "Gründung": "1995-09-20",
            "Rechtsform": "AG",
            "Gegenstand": "Spezialist für Präzisionsmaschinen.",
            "LinkedIn": "https://linkedin.com/company/beispiel-ag",
            "XING": "",
            "Person-Anrede": "Frau",
            "Person-Vorname": "Erika",
            "Person-Nachname": "Musterfrau",
            "Person-Funktion": "Vertriebsleiterin",
            "Person-Tätigkeit": "Vertrieb und Marketing",
            "Person-Geboren": "1975-11-30",
            "Person-Telefon": "+49 160 98765432",
            "Person-E-Mail": "erika.musterfrau@beispiel-ag.de",
            "Person-Xing": "",
            "Person-LinkedIn": "https://linkedin.com/in/erikamusterfrau",
            "Branche-Text-1": "Maschinenbau"
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
