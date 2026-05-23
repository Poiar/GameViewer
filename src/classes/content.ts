export abstract class Content {
  readonly id: number;
  readonly title: string;
  readonly firstRelease: number;

  constructor(id: number, title: string, firstRelease: number) {
    this.id = id;
    this.title = title;
    this.firstRelease = firstRelease;
  }
}
