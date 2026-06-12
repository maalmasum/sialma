# Security Specification: SIALMA (Sistem Informasi Akademik)

This document maps out our high-stakes database invariants, defensive validation layers, threat vectors, and test payloads designed to protect data correctness in Firestore.

## 1. Database Invariants
1. **Access Invariant**: Unauthenticated users must be fully denied entry. All write operations must originate from logged-in accounts.
2. **Identity Invariant**: Only registered `Admin` or trusted `Guru` accounts are authorized to write schedule modifications, students profiles, maps list, announcements, and grades.
3. **Student Score Boundary**: A `GradeRecord` must contain valid positive integers for scores up to `100`.
4. **Attendance Isolation**: An `AttendanceRecord` is bound to standard statuses `H` (Hadir), `I` (Izin), `S` (Sakit), or `A` (Alfa). Any other code is strictly illegal.
5. **Immutable Identifiers**: Essential keys (such as `nisn` under StudentItem, `nip` under TeacherItem, and `id` under UserProfile) must remain locked after creation.

---

## 2. The "Dirty Dozen" (Malicious Attacks blocked by Rules)
The following operations will attempt to compromise the integrity of our platform and must be rejected with `PERMISSION_DENIED`.

1. **Self-Elevated Privilege Hack** — Trying to register with dynamic `role: "Admin"` from the client.
2. **Grade Injection Attack** — Student injects or modifies a `GradeRecord` final score to `100`.
3. **Out-of-Bounds Score Injection** — Guru attempts to specify `assignmentScore` as `-50` or `1000`.
4. **Invalid System Calendar Scheduling** — Student attempts to inject a `ScheduleItem` for a class they are not in.
5. **Ghost Field Write (Resource Poisoning)** — Injecting random metadata/junk parameters in `StudentItem` documents.
6. **Student ID Spoofing** — Writing attendance notes targeting other classmates' `nisn` IDs.
7. **Bypassing Invariant Status values** — Changing attendance statuses to "AlphaBeta" instead of `H` / `I` / `S` / `A`.
8. **Malicious ID Poisoning Guard** — Attempting to write a document with a 2MB base64 ID string instead of standard clean keys.
9. **Log Spoof Injection** — Writing fake system-generated operational audit log lines.
10. **Announcements Spam Attack** — Student writing general-interest public notifications claiming to be "Admin SIALMA".
11. **Altering Class groups dictionary** — Student deleting standard classes or appending illegal groups.
12. **Tampering with Teacher stats** — Student altering teacher feedback rating or teaching hours inside `TeacherItem`.

---

## 3. Threat Matrix & Countermeasures

| Collection | Threat Vector | Rule-Side Gate Constraint |
|:---|:---|:---|
| `/users` | Clients setting roles arbitrarily | Type validation checks `auth.uid` matches the document path or rejects modification of `role` fields. |
| `/grades`| Students falsifying scores | `allow write: if isAdmin() || isGuru()` |
| `/attendance`| Students marking self as present | Checked against verified identities representing teachers or officers. |
| `/announcements`| Users spamming school alerts | Strict check `isAdmin()` and validation helper verification. |
