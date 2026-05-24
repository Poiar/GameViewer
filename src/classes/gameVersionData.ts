import { GameVersion, systemEnum, unsureBoolEnum, providerEnum } from "./model";
import {
  sv_original_warcraft3,
  sv_original_heroesOfMightAndMagic,
  sv_original_heroesOfMightAndMagic2,
  sv_original_heroesOfMightAndMagic3,
  sv_original_heroesOfMightAndMagic4,
  sv_original_halfLife2,
  sv_original_halfLife2Episode1,
  sv_original_halfLife2Episode2,
  sv_original_portal,
  sv_original_teamFortress2,
  sv_downsample_metalGearSolid3,
  sv_remaster_metalGearSolid2,
  sv_remaster_metalGearSolid3,
  sv_original_metalGearSolid4,
  sv_original_ageOfEmpires2,
  sv_remaster2012_ageOfEmpires2,
  sv_remaster2017_ageOfEmpires2,
  sv_original_indigoProphecy,
  sv_enhanced_indigoProphecy,
  sv_remastered_indigoProphecy,
  sv_original_redDeadRedemption,
  sv_enhanced2016_redDeadRedemption,
  sv_enhanced2018_redDeadRedemption,
  sv_original_redDeadRedemptionUndeadNightmare,
  sv_enhanced2016_redDeadRedemptionUndeadNightmare,
  sv_enhanced2018_redDeadRedemptionUndeadNightmare,
  sv_original_theWitcher3,
  sv_enhanced_theWitcher3,
} from "./superVersionData";

export const gv_PC_physical_original_warcraft3 = new GameVersion(
  sv_original_warcraft3,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic = new GameVersion(
  sv_original_heroesOfMightAndMagic,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic2 = new GameVersion(
  sv_original_heroesOfMightAndMagic2,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic3 = new GameVersion(
  sv_original_heroesOfMightAndMagic3,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_gog_original_heroesOfMightAndMagic3 = new GameVersion(
  sv_original_heroesOfMightAndMagic3,
  providerEnum.gog,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic4 = new GameVersion(
  sv_original_heroesOfMightAndMagic4,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_halfLife2 = new GameVersion(
  sv_original_halfLife2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_halfLife2Episode1 = new GameVersion(
  sv_original_halfLife2Episode1,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_halfLife2Episode2 = new GameVersion(
  sv_original_halfLife2Episode2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_portal = new GameVersion(
  sv_original_portal,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_teamFortress2 = new GameVersion(
  sv_original_teamFortress2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.maybe,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_3DS_physical_downsample_metalGearSolid3 = new GameVersion(
  sv_downsample_metalGearSolid3,
  providerEnum.physical,
  [systemEnum._3ds],
  [systemEnum._3ds],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS3_physical_remaster_metalGearSolid2 = new GameVersion(
  sv_remaster_metalGearSolid2,
  providerEnum.physical,
  [systemEnum.ps3],
  [systemEnum.ps3],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS3_physical_remaster_metalGearSolid3 = new GameVersion(
  sv_remaster_metalGearSolid3,
  providerEnum.physical,
  [systemEnum.ps3],
  [systemEnum.ps3],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS3_physical_original_metalGearSolid4 = new GameVersion(
  sv_original_metalGearSolid4,
  providerEnum.physical,
  [systemEnum.ps3],
  [systemEnum.ps3],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_ageOfEmpires2 = new GameVersion(
  sv_original_ageOfEmpires2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_remaster1_ageOfEmpires2 = new GameVersion(
  sv_remaster2012_ageOfEmpires2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_remaster2_ageOfEmpires2 = new GameVersion(
  sv_remaster2017_ageOfEmpires2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_indigoProphecy = new GameVersion(
  sv_original_indigoProphecy,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS2_physical_original_indigoProphecy = new GameVersion(
  sv_original_indigoProphecy,
  providerEnum.physical,
  [systemEnum.ps2],
  [systemEnum.ps2],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_Xbox_physical_original_indigoProphecy = new GameVersion(
  sv_original_indigoProphecy,
  providerEnum.physical,
  [systemEnum.xbox],
  [systemEnum.xbox],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced_indigoProphecy = new GameVersion(
  sv_enhanced_indigoProphecy,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_digital_enhanced_indigoProphecy = new GameVersion(
  sv_enhanced_indigoProphecy,
  providerEnum.xboxLive,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_remastered_indigoProphecy = new GameVersion(
  sv_remastered_indigoProphecy,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.linux, systemEnum.macOs],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS4_digital_remastered_indigoProphecy = new GameVersion(
  sv_remastered_indigoProphecy,
  providerEnum.psn,
  [systemEnum.ps4],
  [systemEnum.ps4, systemEnum.ps5],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS4_physical_remastered_indigoProphecy = new GameVersion(
  sv_remastered_indigoProphecy,
  providerEnum.physical,
  [systemEnum.ps4],
  [systemEnum.ps4, systemEnum.ps5],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_original_redDeadRedemption = new GameVersion(
  sv_original_redDeadRedemption,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2016_redDeadRedemption = new GameVersion(
  sv_enhanced2016_redDeadRedemption,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xone],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2018_redDeadRedemption = new GameVersion(
  sv_enhanced2018_redDeadRedemption,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xonex, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_original_redDeadRedemptionUndeadNightmare = new GameVersion(
  sv_original_redDeadRedemptionUndeadNightmare,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2016_redDeadRedemptionUndeadNightmare = new GameVersion(
  sv_enhanced2016_redDeadRedemptionUndeadNightmare,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xone],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2018_redDeadRedemptionUndeadNightmare = new GameVersion(
  sv_enhanced2018_redDeadRedemptionUndeadNightmare,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xonex, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_XONE_physical_original_theWitcher3 = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.physical,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XONE_digital_original_theWitcher3 = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XSX_physical_enhanced_theWitcher3 = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.physical,
  [systemEnum.xsx],
  [systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XSX_digital_enhanced_theWitcher3 = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xsx, systemEnum.xss],
  [systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XONE_physical_original_theWitcher3Goty = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.physical,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XONE_digital_original_theWitcher3Goty = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XSX_physical_enhanced_theWitcher3Goty = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.physical,
  [systemEnum.xsx],
  [systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XSX_digital_enhanced_theWitcher3Goty = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xsx, systemEnum.xss],
  [systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_gog_enhanced_theWitcher3 = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.gog,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_gog_enhanced_theWitcher3Goty = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.gog,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
