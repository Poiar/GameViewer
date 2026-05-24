import { GameVersion } from "./model";

export const allOwnedInstances: OwnedInstance[] = [];

export class OwnedInstance {
  readonly id: number;
  readonly gameVersion: GameVersion;
  condition: string;
  location: string;
  notes: string;
  acquiredDate: string;
  purchasePrice: string;

  constructor(
    gameVersion: GameVersion,
    condition: string = "",
    location: string = "",
    notes: string = "",
    acquiredDate: string = "",
    purchasePrice: string = "",
  ) {
    this.id = allOwnedInstances.length;
    this.gameVersion = gameVersion;
    this.condition = condition;
    this.location = location;
    this.notes = notes;
    this.acquiredDate = acquiredDate;
    this.purchasePrice = purchasePrice;

    allOwnedInstances.push(this);
  }

  getGameTitle(): string {
    return this.gameVersion.superVersion.game.title;
  }

  getVersionType(): string {
    return this.gameVersion.superVersion.getVersionType();
  }

  getVersionYear(): number {
    return this.gameVersion.superVersion.getVersionYear();
  }

  getPlayableOnTitles(): string {
    return this.gameVersion.getPlayableOnTitles();
  }

  getProvider(): string {
    return this.gameVersion.getProvider();
  }
}
