# Groups Business Logic

This package contains the application-level rules for group lifecycle, membership, invitations, join requests, teams, settings, and notifications.

## Roles

- `guest` (`0`): invited or requesting user, not a member yet
- `member` (`10`): regular group member
- `admin` (`20`): can manage most group operations
- `owner` (`30`): highest level, required for destructive ownership decisions

Role checks are enforced in the service layer through `guard(...)`, which compares the caller's membership level against the minimum level required by an operation.

## Main Rules

- A group is created with the caller as `owner`.
- `admin+` can edit group metadata, invite users, manage requests, manage teams, and update settings/links/TOS.
- Only `owner` can delete a group.
- Membership level can only be set to `member`, `admin`, or `owner`.
- A user cannot kick themselves.
- A user cannot kick someone with the same or higher level.
- The only remaining owner cannot demote themselves.
- The last remaining owner cannot leave the group unless they are also the last member, in which case the group is deleted.
- Non-owners cannot promote themselves above their own level.
- Non-owners cannot grant another user a level equal to or above their own.

## Membership Flows

### Invitations

- `admin+` can invite a user by email.
- If the target user has `AutoAcceptInvites=true`, they are added directly to the group.
- Otherwise an invite is stored and the target user is notified.
- The invited user can accept or decline the invite.
- `admin+` can cancel an outstanding invite.

### Join Requests

- A user can request to join if they are not already a member and do not already have a pending request.
- If `AutoAcceptRequests=true` on the group, the user is added immediately.
- Otherwise a request is stored, admins/owners are notified, and an email is sent to them.
- `admin+` can accept or decline a request.
- The requester can cancel their own request.

### Membership Editing

- `admin+` can change membership levels, but admins remain constrained by hierarchy rules.
- An `admin` can update their own level up to `admin`, but cannot self-promote to `owner`.
- An `admin` cannot change another user to a level equal to or above their own, and cannot edit a user whose current level is equal to or above theirs.
- An `owner` can assign any membership level to any member.
- The only remaining owner can keep `owner`, but cannot demote themselves below `owner`.
- Members removed from a group are also removed from child teams during kick operations.

### Leaving a Group

- Any member can leave voluntarily.
- If the caller is the only owner and other members still exist, leaving is blocked.
- If the caller is the only owner and also the last member, leaving deletes the group.

## Teams and Settings

- `admin+` can create/update/delete child teams.
- `admin+` can update group settings, links, and TOS.
- Updating TOS sends an email notification to all current members.

## Notifications

The service emits lightweight notification events through `NotificationBroker` when group state changes affect users, for example:

- invite created/cancelled/accepted/declined
- join request created/accepted/declined/cancelled
- membership changed or member kicked
- group deleted or left

These events are separate from email delivery. Emails are sent only for selected workflows such as invitations, auto-join, join requests, join validation, and TOS updates.

## Current Implementation Notes

- Business rules are centralized in `application/service.go`.
- Persistence and external side effects are delegated through `ports.Repository`, `ports.Mailer`, and `ports.MetricsRecorder`.
- `GetGroupDetails` currently acts as a pass-through to the repository and does not enforce an explicit membership check in the service layer.
- Ownership invariants are validated before repository writes, so concurrent writes should be reviewed carefully if stronger atomic guarantees are needed.