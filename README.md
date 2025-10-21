# CRM-System Dokumentation

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Datenbankschema](#datenbankschema)
- [Installation](#installation)
- [Entwicklung](#entwicklung)
- [Deployment](#deployment)

## 🎯 Überblick

Dieses CRM-System wurde mit Nuxt.js entwickelt und bietet eine umfassende Lösung für die Verwaltung von Kundenbeziehungen, Teams und Aktivitäten.

## 💾 Datenbankschema

### 1. Benutzerverwaltung (Benutzer & Teams)

#### Benutzer (Users)

- **Hauptmerkmale:**
  - Keycloak-Integration für Authentifizierung
  - Drei Rollen: Admin, Teamleiter, Agent
  - Basis-Informationen:
    - E-Mail (eindeutig)
    - Name
    - Avatar (optional)
    - Erstellungs- und Aktualisierungsdatum

#### Teams

- **Struktur:**
  - Eindeutiger Name
  - Ein Teamleiter pro Team
  - Mehrere Team-Mitglieder möglich
  - Zeitstempel für Erstellung

### 2. Kundenverwaltung

#### Unternehmen (Companies)

- **Gespeicherte Informationen:**
  - Firmenname
  - Rechtsform
  - Branche
  - Mitarbeiteranzahl
  - Kontaktdaten
    - Website
    - Telefon
    - E-Mail
  - Standort
    - Straße
    - PLZ
    - Stadt
    - Bundesland
  - Weitere Details
    - Umsatzgröße
    - Öffnungszeiten
    - Gründungsdatum
    - Beschreibung

#### Kontakte (Contacts)

- **Kontaktinformationen:**
  - Vorname (Pflichtfeld)
  - Nachname
  - E-Mail
  - Telefon
  - Position im Unternehmen
  - Primärkontakt-Status
  - Soziale Medien
    - LinkedIn
    - Xing
    - Facebook
  - Geburtsdatum

### 3. Aktivitätsmanagement

#### Zuweisungen (Assignments)

- **Details:**
  - Verknüpfung zwischen Unternehmen und Agent/Team
  - Zuweisung durch Benutzer
  - Status-Tracking
  - Zeitstempel der Zuweisung

#### Aktivitäten (Activities)

- **Arten:**
  - Anrufe
  - E-Mails
  - Meetings
  - Notizen
- **Erfasst werden:**
  - Betreff
  - Inhalt
  - Start- und Endzeit
  - Verknüpfter Kontakt

### 4. Gesprächsmanagement

#### Gesprächsnotizen (Conversation Notes)

- **Inhalte:**
  - Gesprächsaufhänger
  - Rechercheergebnisse
  - Letzte Aktualisierung
  - Aktualisiert durch

## 🚀 Installation

```bash
# Abhängigkeiten installieren
pnpm install

# Entwicklungsserver starten
pnpm dev
```

## 💻 Entwicklung

Der Entwicklungsserver läuft unter `http://localhost:3000`

## 📦 Deployment

Produktion Build erstellen:

```bash
pnpm build
```

---

### Technische Besonderheiten

- SQLite Datenbank mit Drizzle ORM
- Nuxt.js Frontend Framework
- Keycloak Integration
- Optimierte Datenbankabfragen
- Robuste Fehlerbehandlung

### Sicherheitsmerkmale

- Rollenbasierte Zugriffskontrolle
- Sichere Datenlöschung mit Cascade
- Geschützte Benutzerauthentifizierung
