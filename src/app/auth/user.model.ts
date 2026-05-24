export class User {
  constructor(
    readonly username: string,
    readonly displayName: string,
    readonly email: string,
    readonly password: string,
  ) {}
}
