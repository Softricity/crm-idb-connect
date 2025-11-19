# API Documentation

This document provides a complete reference for all the APIs available in the backend application.

---

## ⚡ General Information

### Authentication
Most endpoints are protected by **JWT Authentication**.
-   **Public Endpoints:** `POST /auth/login` and `POST /leads`.
-   **Protected Endpoints:** Require a valid Bearer Token in the Authorization header: `Authorization: Bearer <access_token>`.
-   **Role Based Access Control (RBAC):** Endpoints verify if the user has the required role (`admin`, `counsellor`, `agent`).

### Base URL
All routes are relative to the NestJS server URL (e.g., `http://localhost:3000`).

### Error Codes
-   **400 Bad Request:** Invalid input (e.g., invalid UUID format).
-   **401 Unauthorized:** Missing or invalid JWT token.
-   **403 Forbidden:** Authenticated but lacks permission (e.g., Agent deleting a Partner).
-   **404 Not Found:** Resource does not exist.
-   **409 Conflict:** Unique constraint violation (e.g., Email/Mobile exists).
-   **422 Unprocessable Entity:** Validation failed.
-   **500 Internal Server Error:** Server-side failure.

---

## 🏠 App API

### Health Check
-   **Route:** `GET /`
-   **Authentication:** None
-   **Description:** Simple health check.
-   **Returns:** "Hello World!"

---

## 🔐 Auth API

### Partner Login
-   **Route:** `POST /auth/login`
-   **Authentication:** **None (Public)**
-   **Description:** Authenticates a partner using email and password.
-   **Request Body:**
    ```json
    {
      "email": "admin@example.com",
      "password": "password123"
    }
    ```
-   **Returns:** Includes both the token and the user's profile info.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "partner": {
        "id": "uuid",
        "name": "Admin User",
        "role": "admin",
        "email": "admin@example.com"
      }
    }
    ```

---

## 👨‍💼 Leads API

### Create a New Lead
-   **Route:** `POST /leads`
-   **Authentication:** **None (Public)**
-   **Description:**
    1.  Validates unique `email` and `mobile`.
    2.  Generates a random plaintext password.
    3.  Hashes password and saves lead.
    4.  **Side-effect:** Sends welcome email with plaintext password.
    5.  **Side-effect:** Logs `LEAD_CREATED` to Timeline.
-   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "mobile": "9876543210",
      "email": "john@example.com",
      "type": "lead",
      "city": "New York",
      "purpose": "Study Abroad",
      "status": "new",
      "created_by": "partner-uuid"
    }
    ```

### Get All Leads
-   **Route:** `GET /leads`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves all leads, ordered by newest first. Includes `partners_leads_assigned_toTopartners` object (name, email).

### Get Single Lead
-   **Route:** `GET /leads/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a single lead by ID.
-   **Validation:** `id` must be valid UUID (32 or 36 chars).

### Update Lead
-   **Route:** `PATCH /leads/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Updates specific fields.
-   **Returns:** The full updated lead object (including assigned partner details if fetched).
-   **Side-effects:**
    -   Status change logs `LEAD_STATUS_CHANGED`.
    -   Assignment change logs `LEAD_OWNER_CHANGED`.

### Delete Lead
-   **Route:** `DELETE /leads/:id`
-   **Authentication:** **JWT Required (Admin Only)**

### Bulk Actions
-   **Bulk Assign:** `POST /leads/bulk/assign`
    -   **Auth:** Admin, Counsellor
    -   **Body:** `{ "leadIds": ["uuid"], "counsellorId": "uuid" }`
-   **Bulk Status:** `POST /leads/bulk/status`
    -   **Auth:** Admin, Counsellor
    -   **Body:** `{ "leadIds": ["uuid"], "status": "cold", "reason": "..." }`
-   **Bulk Message:** `POST /leads/bulk/message`
    -   **Auth:** Admin, Counsellor (Agents may be allowed depending on configuration).
    -   **Body:** `{ "leadIds": ["uuid"], "message": "Hello!" }`
-   **Bulk Delete:** `POST /leads/bulk/delete`
    -   **Auth:** **Admin Only**
    -   **Body:** `{ "leadIds": ["uuid"] }`

---

## 🤝 Partners API

### Create Partner
-   **Route:** `POST /partners`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** `{ "role": "agent", "name": "...", "email": "...", "password": "..." }`

### Get All Partners
-   **Route:** `GET /partners`
-   **Query Params:** `?role=agent` or `?role=counsellor`
-   **Authentication:** **JWT Required**

### Get Single Partner
-   **Route:** `GET /partners/:id`
-   **Authentication:** **JWT Required (Admin Only)**

### Update Partner
-   **Route:** `PATCH /partners/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Note:** Sending `password` will re-hash and update it.

### Delete Partner
-   **Route:** `DELETE /partners/:id`
-   **Authentication:** **JWT Required (Admin Only)**

### Bulk Delete Partners
-   **Route:** `POST /partners/bulk/delete`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Body:** `{ "partnerIds": ["uuid"] }`

---

## 💬 Engagement API

### Notes
-   **Create Note:** `POST /notes`
    -   **Body:** `{ "text": "Note content", "lead_id": "uuid" }`
    -   **Side-effect:** Logs `LEAD_NOTE_ADDED`.
-   **Get Notes:** `GET /leads/:leadId/notes`
    -   **Auth:** Any authenticated user with access to the lead.
-   **Update Note:** `PATCH /notes/:id`
    -   **Auth:** **Creator OR Admin Only**.
-   **Delete Note:** `DELETE /notes/:id`
    -   **Auth:** **Creator OR Admin Only**.

### Follow-ups
-   **Create Follow-up:** `POST /followups`
    -   **Body:** `{ "title": "...", "lead_id": "uuid", "due_date": "ISO" }`
    -   **Side-effect:** Logs `LEAD_FOLLOWUP_ADDED`.
-   **Get Follow-ups:** `GET /leads/:leadId/followups`
    -   **Auth:** Any authenticated user with access to the lead.
-   **Update Follow-up:** `PATCH /followups/:id`
    -   **Auth:** **Creator OR Admin Only**.
-   **Delete Follow-up:** `DELETE /followups/:id`
    -   **Auth:** **Creator OR Admin Only**.

### Follow-up Comments
-   **Add Comment:** `POST /followups/:id/comments`
    -   **Returns:** Comment object including `created_by` user ID and timestamp.
-   **Update/Delete Comment:** `PATCH` / `DELETE` `/comments/:id`
    -   **Auth:** **Creator OR Admin Only**.

---

## 📝 Applications API

**Behavior:** All `PATCH` endpoints automatically create the parent `application` record if it does not exist (Upsert).

### Get Full Application
-   **Route:** `GET /applications/:leadId`
-   **Description:** Returns the full application tree. Returns `null` if not started.

### Update Sections
-   **Personal Info:** `PATCH /applications/:leadId/personal`
-   **Identifications:** `PATCH /applications/:leadId/identifications`
-   **Preferences:** `PATCH /applications/:leadId/preferences`
-   **Family Details:** `PATCH /applications/:leadId/family`
-   **Address:** `PATCH /applications/:leadId/address`
-   **Documents:** `PATCH /applications/:leadId/documents`
-   **Declarations:** `PATCH /applications/:leadId/declarations`

---

## 📊 Dashboard API

### Get Dashboard Stats
-   **Route:** `GET /dashboard/stats`
-   **Authentication:** **JWT Required (Admin, Counsellor)**
-   **Returns:**
    ```json
    {
      "metrics": { "total": 100, "todaysLeads": 5, "converted": 10, "rejected": 2 },
      "byStatus": { "new": 10, "contacted": 5 },
      "bySource": { "google": 20, "referral": 5 },
      "last7Days": [ { "label": "Nov 16", "count": 3 } ]
    }
    ```
---

## 🏳️ Countries API

Manages the list of countries for study abroad destinations.

### Create Country
-   **Route:** `POST /countries`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "name": "Finland",
      "flag": "[https://example.com/finland-flag.png](https://example.com/finland-flag.png)"
    }
    ```
-   **Returns:** Created country object.
-   **Errors:** `409 Conflict` if country name already exists.

### Get All Countries
-   **Route:** `GET /countries`
-   **Authentication:** **None (Public)**
-   **Description:** Retrieves a list of all countries, sorted alphabetically. Used to populate dropdowns on the frontend.
-   **Returns:** Array of country objects.

### Get Single Country
-   **Route:** `GET /countries/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a single country by ID, including a list of its universities.

### Update Country
-   **Route:** `PATCH /countries/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** (Partial)
    ```json
    {
      "name": "Republic of Finland"
    }
    ```

### Delete Country
-   **Route:** `DELETE /countries/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Note:** This will cascade delete all Universities and Courses linked to this country.

---

## 🏫 Universities API

Manages universities linked to countries.

### Create University
-   **Route:** `POST /universities`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "name": "University of Helsinki",
      "countryId": "uuid-of-country",
      "city": "Helsinki",
      "logo": "[https://example.com/logo.png](https://example.com/logo.png)"
    }
    ```
-   **Validation:** `countryId` must be a valid UUID of an existing country.

### Get All Universities
-   **Route:** `GET /universities`
-   **Authentication:** **None (Public)**
-   **Query Params:**
    -   `?countryId=uuid` (Optional: Filter universities by a specific country).
-   **Description:** Retrieves a list of universities.
-   **Returns:** Array of university objects with their associated `country` data.

### Get Single University
-   **Route:** `GET /universities/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves a single university, including its `country` and list of `courses`.

### Update University
-   **Route:** `PATCH /universities/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** (Partial)
    ```json
    {
      "city": "Espoo",
      "logo": "https://new-logo-url.com"
    }
    ```

### Delete University
-   **Route:** `DELETE /universities/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Note:** This will cascade delete all Courses linked to this university.

---

## 🎓 Courses API

Manages courses offered by universities.

### Create Course
-   **Route:** `POST /courses`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:**
    ```json
    {
      "name": "Masters in Computer Science",
      "university_id": "uuid-of-university",
      "level": "Masters",
      "category": "IT",
      "duration": 24,
      "fee": 15000,
      "fee_type": "Per Year",
      "application_fee": 100,
      "intake_month": "September, January",
      "commission": "15%",
      "description": "Comprehensive CS program..."
    }
    ```

### Get All Courses (Search & Filter)
-   **Route:** `GET /courses`
-   **Authentication:** **None (Public)** (or Protected based on config)
-   **Query Params:** (All are optional)
    -   `search`: String (Matches Course Name or University Name)
    -   `country`: Array of strings (e.g., `?country=USA&country=UK`)
    -   `level`: Array of strings (e.g., `?level=Masters`)
    -   `university`: Array of strings (University names)
    -   `intake`: Array of strings (e.g., `?intake=Sep`)
-   **Description:** Returns a filtered list of courses. Includes nested `university` and `country` objects.

### Get Filter Options
-   **Route:** `GET /courses/filters`
-   **Authentication:** **None (Public)**
-   **Description:** Returns available unique values for the frontend sidebar (Countries, Universities, Levels).
-   **Returns:**
    ```json
    {
      "countries": ["Finland", "USA"],
      "universities": ["Helsinki", "Aalto"],
      "levels": ["Bachelors", "Masters"]
    }
    ```

### Get Single Course
-   **Route:** `GET /courses/:id`
-   **Authentication:** **JWT Required**
-   **Description:** Retrieves detailed information for a specific course.

### Update Course
-   **Route:** `PATCH /courses/:id`
-   **Authentication:** **JWT Required (Admin Only)**
-   **Request Body:** Partial course object.

### Delete Course
-   **Route:** `DELETE /courses/:id`
-   **Authentication:** **JWT Required (Admin Only)**