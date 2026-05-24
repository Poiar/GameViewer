import { OwnedInstance, allOwnedInstances } from "./ownedInstance";
import {
  gv_PC_steam_original_halfLife2,
  gv_PC_physical_original_warcraft3,
  gv_X360_physical_original_redDeadRedemption,
  gv_PC_gog_original_heroesOfMightAndMagic3,
  gv_PC_steam_original_ageOfEmpires2,
} from "./model";

export const oi_1 = new OwnedInstance(
  gv_PC_steam_original_halfLife2,
  "Good",
  "Steam Library",
  "Purchased during Steam Summer Sale",
  "2019-06-22",
  "4.99",
);

export const oi_2 = new OwnedInstance(
  gv_PC_physical_original_warcraft3,
  "Fair",
  "Living room shelf",
  "Original CD case, some scratches",
  "2003-03-15",
  "15.00",
);

export const oi_3 = new OwnedInstance(
  gv_X360_physical_original_redDeadRedemption,
  "Mint",
  "Game cabinet",
  "Still in shrink wrap",
  "2010-12-25",
  "29.99",
);

export const oi_4 = new OwnedInstance(
  gv_PC_gog_original_heroesOfMightAndMagic3,
  "Good",
  "GOG Library",
  "Complete edition with both expansions",
  "2020-01-10",
  "9.99",
);

export const oi_5 = new OwnedInstance(
  gv_PC_steam_original_ageOfEmpires2,
  "Good",
  "Steam Library",
  "Classic edition before HD",
  "2008-05-01",
  "19.99",
);

console.log({ allOwnedInstances });
