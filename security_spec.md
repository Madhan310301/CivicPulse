# Security Specification - CivicPulse

## 1. Data Invariants
1. **User Identity Invariant**: A user's profile can only be created by the owner themselves (`userId == request.auth.uid`). No user can spoof another user's UID or register with a different UID.
2. **Immutability Invariant**: Critical audit-trail fields such as `createdAt` and `reportedBy` on `issues` or `joinedAt` and `uid` on `users` must be absolutely immutable after creation.
3. **Citizen Verification Escalation**: Issues begin in the `reported` state and can only be escalated to `verified` if at least 3 unique citizens verify the issue.
4. **Government Accountability**: Only authenticated users acting on behalf of government agencies can simulate physical resolution states (assigned, in_progress, resolved).
5. **No Cross-User Manipulation**: Users can only modify their own profile data, except for specific gamification indicators (such as `xp`, `verificationsCount`, `resolvedCount`) which are safely updated by peer interactions during crowdsourced ticket verifications and resolutions.

---

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Scenarios)
The following payloads describe attempts to breach CivicPulse's data boundaries:

1. **Payload #1: Identity Spoofing (Create User)**
   * *Target path*: `/users/attacker_uid`
   * *Attack vector*: Attacker attempts to register a profile under someone else's Google UID.
2. **Payload #2: Admin Privilege Escalation (Set XP)**
   * *Target path*: `/users/attacker_uid`
   * *Attack vector*: Attacker attempts to create a profile starting with 500,000 XP and all badges.
3. **Payload #3: Profile Hijacking (Update Email)**
   * *Target path*: `/users/victim_uid`
   * *Attack vector*: Attacker attempts to overwrite a victim's email address.
4. **Payload #4: Ghost Issue Filing (Unsigned-in)**
   * *Target path*: `/issues/ghost_issue_id`
   * *Attack vector*: Unauthenticated user attempts to write a civic issue to the collection.
5. **Payload #5: Issue Spoofing (Forge Reporter)**
   * *Target path*: `/issues/malicious_issue_id`
   * *Attack vector*: Attacker registers an issue setting the `reportedBy` field to a victim's UID.
6. **Payload #6: Status Bypass (Self-Verification)**
   * *Target path*: `/issues/malicious_issue_id`
   * *Attack vector*: Attacker submits a new issue with status pre-set to `resolved` or `verified`.
7. **Payload #7: Multi-Upvote Exploitation**
   * *Target path*: `/issues/target_issue_id`
   * *Attack vector*: Same attacker attempts to append their own UID multiple times to the `verifiedBy` array to force immediate status escalation.
8. **Payload #8: Temporal Fraud (Forge Timestamp)**
   * *Target path*: `/issues/target_issue_id`
   * *Attack vector*: Attacker attempts to update the `createdAt` timestamp to 3 years ago to bypass SLA deadlines.
9. **Payload #9: Unauthorized Issue Deletion**
   * *Target path*: `/issues/target_issue_id`
   * *Attack vector*: Regular citizen attempts to delete an active civic complaint.
10. **Payload #10: Deny-of-Wallet Character Poisoning**
    * *Target path*: `/issues/A_VERY_LONG_GARBAGE_ID_EXCEEDING_MAX_BOUNDS_AND_CONTAINING_ILLEGAL_CHARACTERS_$$$`
    * *Attack vector*: Attacker attempts to write a document using an oversized ID containing malicious scripting characters.
11. **Payload #11: PII Leakage Scrape**
    * *Target path*: `/users/any_user`
    * *Attack vector*: Regular user tries to fetch private PII documents of other users.
12. **Payload #12: Fake Hotspot Injection**
    * *Target path*: `/hotspots/fake_hotspot`
    * *Attack vector*: Attacker attempts to write mock predictive risk alerts into the AI Hotspots database.

---

## 3. Test Cases Specification
Every malicious operation from the Dirty Dozen must result in a `PERMISSION_DENIED` error from the Firestore rules engine, while legitimate civic actions (reporting, viewing, verified peer votes) succeed.
