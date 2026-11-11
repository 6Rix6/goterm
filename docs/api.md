## API Documentation

Base URL: `/api`
Authentication: Bearer Token (`Authorization: Bearer <token>`)

### 1. List Sessions

* **Method & Path:** `GET /api/sessions`
* **Description:** Retrieves a list of all active sessions.
* **Response (200 OK):**

```json
{
  "sessions": [
    {
      "id": "string",
      "created_at": "string (RFC3339)",
      "pinned": boolean,
      "attached": boolean
    }
  ]
}

```

### 2. Update Session (Pin/Unpin)

* **Method & Path:** `PATCH /api/sessions/{id}`
* **Description:** Updates the pinned status of a specific session.
* **Request Body:**

```json
{
  "pinned": boolean
}

```

* **Responses:**
* `200 OK`: Returns the updated session info.

```json
{
    "id": "string",
    "created_at": "string (RFC3339)",
    "pinned": boolean,
    "attached": boolean
}
```

* `204 No Content`: Returned if the session was destroyed.
* `400 Bad Request`: Invalid request body.
* `404 Not Found`: Session not found.



### 3. Delete Session

* **Method & Path:** `DELETE /api/sessions/{id}`
* **Description:** Deletes a specific session.
* **Responses:**
* `204 No Content`: Successfully deleted.
* `404 Not Found`: Session not found.
