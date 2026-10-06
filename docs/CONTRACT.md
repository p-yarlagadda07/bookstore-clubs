# API contract changelog

Any change to a route, a Zod schema in `shared/`, or a service function other members call is
written here **before** it is merged, and announced in the team group.

| Date       | Who      | Change                                                                                                                                 | Breaking? | Who must update |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------- |
| 2026-10-06 | Member 1 | Initial skeleton: response envelope `{ ok, data }` / `{ ok, error: { code, message, details } }`, error codes in `shared/constants.js` | -         | -               |
