# Hospital Management System -- Patients Module Enhancement Prompt

## Objective

Add a new **Patients** section to the Hospital Admin Panel. This section
will act as the hospital's digital patient database and replace the need
for using MongoDB Compass or any external database tools. Hospital staff
should be able to search, view, edit, and re-register patients entirely
from the admin interface.

------------------------------------------------------------------------

# Existing Admin Structure

Current navigation:

-   Live Queue
-   Registrations

Proposed navigation:

-   Live Queue
-   Registrations
-   Patients

The new **Patients** tab should be designed for non-technical hospital
staff and therefore should never expose database terminology.

------------------------------------------------------------------------

# Why This Feature?

Currently:

-   Live Queue only displays today's queue.
-   Registrations displays today's registration records.

There is no centralized place where staff can:

-   Search previous patients.
-   View complete patient history.
-   Edit patient information.
-   Register returning patients quickly.

The Patients page solves these problems.

------------------------------------------------------------------------

# Database Architecture

## Patient Collection (Permanent Data)

Store one document per patient.

Fields:

-   Name
-   Phone Number
-   Village
-   Case Number
-   Case Type
-   Created At

Each patient should exist only once.

------------------------------------------------------------------------

## Registration Collection (Visit Data)

Each hospital visit creates a registration.

Fields:

-   patientId (Reference)
-   Registration Date
-   Token Number
-   Queue Status
-   Window
-   Doctor (future)
-   Notes (future)

Relationship:

One Patient → Many Registrations

------------------------------------------------------------------------

# Patients Page

## Header

Title:

Patients

Buttons:

-   Search
-   Add Patient

Search should support:

-   Case Number
-   Phone Number
-   Name
-   Village

------------------------------------------------------------------------

# Patient Card

Each patient card should contain:

-   Name
-   Case Number
-   Phone Number
-   Village
-   Case Type
-   Total Visits
-   Last Visit Date

Buttons:

-   View
-   Edit
-   Register Again

------------------------------------------------------------------------

# Patient Details Page

Display:

Patient Information

-   Name
-   Phone
-   Village
-   Case Number
-   Case Type

Registration History

Each visit should display:

-   Registration Date
-   Token
-   Queue Status
-   Window

Newest visit appears first.

------------------------------------------------------------------------

# Register Again Workflow

Reception workflow:

1.  Search patient.
2.  Open profile.
3.  Click Register Again.
4.  New registration is created.
5.  New queue token is generated.

No patient details should be entered again.

------------------------------------------------------------------------

# Quick Search

A global search box should appear in the admin header.

Searching any of these should instantly locate the patient:

-   Case Number
-   Phone Number
-   Name

------------------------------------------------------------------------

# Statistics

Display summary cards:

-   Total Patients
-   Today's Registrations
-   Returning Patients
-   New Patients This Month

------------------------------------------------------------------------

# Mobile First Design

The UI should be optimized for tablets and phones.

Instead of large tables, use responsive cards.

Each card should display only essential information with large
touch-friendly buttons.

------------------------------------------------------------------------

# Future Enhancements

Potential features:

-   Patient profile photo
-   PDF patient card
-   QR code for case number
-   Medical history
-   Prescription uploads
-   Doctor assignment
-   Follow-up reminders
-   Export to Excel/CSV
-   Archive inactive patients
-   Audit log for edits

------------------------------------------------------------------------

# Backend Changes

Create:

Patient Model

Modify:

Registration Model

Replace duplicated patient fields with:

patientId

Update:

-   Registration Controller
-   Queue Controller
-   Admin Controller

Populate patient data whenever registrations are returned.

------------------------------------------------------------------------

# Benefits

-   Eliminates duplicate patient records.
-   Faster repeat registrations.
-   Complete patient visit history.
-   Cleaner database normalization.
-   Easier maintenance.
-   Better scalability.
-   Mobile-friendly workflow.
-   No need for MongoDB access by hospital staff.

------------------------------------------------------------------------

# Expected Outcome

The Hospital Admin Panel becomes a complete patient management system
where receptionists can:

-   Search any patient.
-   View patient history.
-   Edit patient details.
-   Register returning patients with one click.
-   Continue using Live Queue without changes.

This design is scalable and ready for future hospital management
features while keeping the interface simple for non-technical users.
