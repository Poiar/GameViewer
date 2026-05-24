import { SuperVersion, versionEnum } from "./model";
import {
  g_warcraft3,
  g_heroesOfMightAndMagic,
  g_heroesOfMightAndMagic2,
  g_heroesOfMightAndMagic3,
  g_heroesOfMightAndMagic4,
  g_halfLife2,
  g_halfLife2Episode1,
  g_halfLife2Episode2,
  g_portal,
  g_teamFortress2,
  g_metalGearSolid2,
  g_metalGearSolid3,
  g_metalGearSolid4,
  g_ageOfEmpires2,
  g_indigoProphecy,
  g_redDeadRedemption,
  g_redDeadRedemptionUndeadNightmare,
  g_theWitcher3,
} from "./gameData";

export const sv_original_warcraft3 = new SuperVersion(g_warcraft3, versionEnum.original, "", undefined);
export const sv_original_heroesOfMightAndMagic = new SuperVersion(
  g_heroesOfMightAndMagic,
  versionEnum.original,
  "",
  undefined,
);
export const sv_original_heroesOfMightAndMagic2 = new SuperVersion(
  g_heroesOfMightAndMagic2,
  versionEnum.original,
  "",
  undefined,
);
export const sv_original_heroesOfMightAndMagic3 = new SuperVersion(
  g_heroesOfMightAndMagic3,
  versionEnum.original,
  "",
  undefined,
);
export const sv_original_heroesOfMightAndMagic4 = new SuperVersion(
  g_heroesOfMightAndMagic4,
  versionEnum.original,
  "",
  undefined,
);
export const sv_original_halfLife2 = new SuperVersion(g_halfLife2, versionEnum.original, "", undefined);
export const sv_original_halfLife2Episode1 = new SuperVersion(g_halfLife2Episode1, versionEnum.original, "", undefined);
export const sv_original_halfLife2Episode2 = new SuperVersion(g_halfLife2Episode2, versionEnum.original, "", undefined);
export const sv_original_portal = new SuperVersion(g_portal, versionEnum.original, "", undefined);
export const sv_original_teamFortress2 = new SuperVersion(g_teamFortress2, versionEnum.original, "", undefined);
export const sv_downsample_metalGearSolid3 = new SuperVersion(g_metalGearSolid3, versionEnum.downsample, "", 2012);
export const sv_remaster_metalGearSolid2 = new SuperVersion(g_metalGearSolid2, versionEnum.remaster, "", 2011);
export const sv_remaster_metalGearSolid3 = new SuperVersion(g_metalGearSolid3, versionEnum.remaster, "", 2011);
export const sv_original_metalGearSolid4 = new SuperVersion(g_metalGearSolid4, versionEnum.original, "", undefined);
export const sv_original_ageOfEmpires2 = new SuperVersion(g_ageOfEmpires2, versionEnum.original, "", 1999);
export const sv_remaster2012_ageOfEmpires2 = new SuperVersion(
  g_ageOfEmpires2,
  versionEnum.remaster,
  "HD Edition",
  2012,
);
export const sv_remaster2017_ageOfEmpires2 = new SuperVersion(
  g_ageOfEmpires2,
  versionEnum.remaster,
  "Definitive Edition",
  2017,
);
export const sv_original_indigoProphecy = new SuperVersion(g_indigoProphecy, versionEnum.original, "", 2005);
export const sv_enhanced_indigoProphecy = new SuperVersion(g_indigoProphecy, versionEnum.enhanced, "", 2007);
export const sv_remastered_indigoProphecy = new SuperVersion(g_indigoProphecy, versionEnum.remaster, "", 2015);
export const sv_original_redDeadRedemption = new SuperVersion(g_redDeadRedemption, versionEnum.original, "", 2010);
export const sv_enhanced2016_redDeadRedemption = new SuperVersion(g_redDeadRedemption, versionEnum.enhanced, "", 2016);
export const sv_enhanced2018_redDeadRedemption = new SuperVersion(g_redDeadRedemption, versionEnum.enhanced, "", 2018);
export const sv_original_redDeadRedemptionUndeadNightmare = new SuperVersion(
  g_redDeadRedemptionUndeadNightmare,
  versionEnum.original,
  "",
  2010,
);
export const sv_enhanced2016_redDeadRedemptionUndeadNightmare = new SuperVersion(
  g_redDeadRedemptionUndeadNightmare,
  versionEnum.enhanced,
  "",
  2016,
);
export const sv_enhanced2018_redDeadRedemptionUndeadNightmare = new SuperVersion(
  g_redDeadRedemptionUndeadNightmare,
  versionEnum.enhanced,
  "",
  2018,
);
export const sv_original_theWitcher3 = new SuperVersion(g_theWitcher3, versionEnum.original, "", 2015);
export const sv_enhanced_theWitcher3 = new SuperVersion(g_theWitcher3, versionEnum.enhanced, "", 2022);
