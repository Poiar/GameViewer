import { Injectable, signal, computed } from "@angular/core";
import { User } from "./user.model";

const STORAGE_KEY = "user";

const validUsers: User[] = [new User("MM", "MM", "mm@example.com", "test")];

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.loadFromStorage());

  readonly user = this.currentUser.asReadonly();

  readonly initials = computed(() => {
    const u = this.currentUser();
    if (!u || !u.displayName) return "";
    return u.displayName
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  });

  login(username: string, password: string): void {
    const found = validUsers.find((u) => u.username === username && u.password === password);
    if (!found) {
      throw new Error("Invalid username or password");
    }
    this.currentUser.set(found);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ username: found.username, displayName: found.displayName, email: found.email }),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  updateProfile(displayName: string, email: string): void {
    const current = this.currentUser();
    if (!current) return;
    const updated = new User(current.username, displayName, email, current.password);
    const idx = validUsers.findIndex((u) => u.username === current.username);
    if (idx >= 0) {
      validUsers[idx] = updated;
    }
    this.currentUser.set(updated);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ username: updated.username, displayName: updated.displayName, email: updated.email }),
    );
  }

  private loadFromStorage(): User | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { username: string; displayName: string; email?: string };
      const found = validUsers.find((u) => u.username === parsed.username);
      return found ?? null;
    } catch {
      return null;
    }
  }
}
