# Auth System Fix — Implementation Plan

## Summary
Fix the broken auth system: the AuthComponent is never rendered anywhere. Add password-based login, a circular avatar badge with dropdown (Profile + Log out) when logged in, a "Log in" button when logged out, and a profile modal to edit name/email. The app has NO routing — profile will be a modal overlay.

---

## Files Changed

### 1. `src/app/auth/user.model.ts` — MODIFIED
- Add `email: string` and `password: string` fields to the `User` class constructor.

### 2. `src/app/auth/auth.service.ts` — MODIFIED
- Hardcoded user becomes `new User("MM", "MM", "mm@example.com", "test")`
- `login(username, password)`: finds user by username, also checks password. Throws `Error("Invalid username or password")` if either doesn't match.
- New `updateProfile(displayName, email)`: creates a new `User` with updated fields (keeping same username/password), updates the signal, persists to localStorage.
- Storage serialization/deserialization now includes `email` field.

### 3. `src/app/auth/auth.component.ts` — REWRITTEN
- **When logged in**: circular initials badge (`40x40px`, `border-radius: 50%`, accent color) → click toggles dropdown with "Profile" and "Log out" items.
- **When logged out**: "Log in" button → click toggles dropdown with username input + password input + error message area + "Sign in" submit button.
- Remove the old text-input-always-visible pattern (it was ugly in the header).
- `@HostListener("document:click")` closes dropdown when clicking outside.
- `loginError` string property for credential mismatch messages.
- `onProfile()` sets a shared state to open the profile modal (communicates with AppComponent via a simple callback or the auth service signal).

### 4. `src/app/auth/auth.component.html` — REWRITTEN
Template structure:
```
@if (authService.user(); as user) {
  <div class="auth-inline">
    <button class="avatar-badge" (click)="toggleDropdown()">{{ authService.initials() }}</button>
    @if (dropdownOpen) {
      <div class="dropdown-menu" role="menu">
        <button class="dropdown-item" (click)="onProfile()">Profile</button>
        <button class="dropdown-item" (click)="onLogout()">Log out</button>
      </div>
    }
  </div>
} @else {
  <div class="auth-inline">
    <button class="login-btn" (click)="toggleDropdown()">Log in</button>
    @if (dropdownOpen) {
      <div class="dropdown-menu login-dropdown" role="menu">
        <input type="text" [(ngModel)]="loginUsername" placeholder="Username" />
        <input type="password" [(ngModel)]="loginPassword" placeholder="Password" />
        @if (loginError) {
          <div class="login-error">{{ loginError }}</div>
        }
        <button class="login-submit" (click)="onLogin()">Sign in</button>
      </div>
    }
  </div>
}
```

### 5. `src/app/auth/auth.component.css` — REWRITTEN
- Remove `position: fixed; top/right` from `:host`. Make it `display: block` only (inline flex item in header).
- Avatar badge: 36x36px circle, `var(--accent)` background, white bold text, hover glow.
- Dark theme dropdown: `var(--bg-card)` background, `var(--border-subtle)`, `border-radius: var(--radius-md)`.
- Log in button: styled as a simple compact button matching the dark theme.
- Login inputs: dark inputs with `var(--bg-tertiary)` background.
- Transitions using `var(--transition-fast)`.

### 6. `src/app/profile/profile.component.ts` — NEW
- Standalone component with `ChangeDetectionStrategy.OnPush`.
- Injects `AuthService`.
- Has `displayName` and `email` string properties pre-filled from `authService.user()`.
- `onSave()`: calls `authService.updateProfile(...)`, closes modal.
- `onCancel()`: just closes modal.
- `#cancel` and `#save` EventEmitters to notify AppComponent.

### 7. `src/app/profile/profile.component.html` — NEW
```
<div class="profile-overlay" (click)="onCancel()">
  <div class="profile-modal" (click)="$event.stopPropagation()">
    <h2>Edit Profile</h2>
    <label>Display Name: <input [(ngModel)]="displayName" /></label>
    <label>Email: <input [(ngModel)]="email" type="email" /></label>
    <div class="profile-actions">
      <button (click)="onCancel()">Cancel</button>
      <button (click)="onSave()" class="primary">Save</button>
    </div>
  </div>
</div>
```

### 8. `src/app/profile/profile.component.css` — NEW
- Full-screen overlay: `position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000`.
- Centered modal card: `var(--bg-secondary)` background, `border-radius: var(--radius-xl)`, max-width 400px.
- Dark themed inputs matching app style.
- Action buttons: Cancel (subtle) and Save (accent color).

### 9. `src/app/app.component.ts` — MODIFIED
- Add imports: `AuthComponent`, `ProfileComponent`.
- Add `showProfile` boolean flag.
- Add `openProfile()` / `closeProfile()` methods (or just toggle).

### 10. `src/app/app.component.html` — MODIFIED
- In `.top-bar-inner`, after `.stats`, add `<app-auth (profileRequested)="showProfile = true"></app-auth>`.
- At the end of `.app-layout`, add `@if (showProfile) { <app-profile (cancel)="showProfile = false" (save)="showProfile = false" /> }`.

---

## Key Design Decisions
- **No routing**: Profile is a modal overlay consistent with the single-page architecture.
- **Dark theme**: All new CSS uses the app's existing CSS custom properties.
- **Login UX**: "Log in" button in the header opens a compact dropdown with username + password fields. Cleaner than a permanent input.
- **AuthComponent placement**: Inline as a flex item in `.top-bar-inner`, not `position: fixed`.
- **Error handling**: Login failures show an error message inside the dropdown (not an alert).

---

## No changes needed for:
- `InventoryComponent` — already gates correctly behind `authService.user()`.
- Playwright config — auto-starts ng serve.
- Model classes (`src/classes/`) — auth is purely in `src/app/auth/`.
