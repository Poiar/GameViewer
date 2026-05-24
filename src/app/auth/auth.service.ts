import { Injectable, signal, computed } from "@angular/core";
import { User } from "./user.model";

const STORAGE_KEY = "user";

const validUsers: User[] = [new User("MM", "MM")];

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.loadFromStorage());

  readonly user = this.currentUser.asReadonly();

  readonly initials = computed(() => {
    const u = this.currentUser();
    if (!u) return "";
    return u.displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  });

  login(username: string): void {
    const found = validUsers.find((u) => u.username === username);
    if (!found) {
      throw new Error(`Unknown user: ${username}`);
    }
    this.currentUser.set(found);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: found.username, displayName: found.displayName }));
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadFromStorage(): User | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { username: string; displayName: string };
      const found = validUsers.find((u) => u.username === parsed.username);
      return found ?? null;
    } catch {
      return null;
    }
  }
}
