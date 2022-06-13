import {
  GameVersion,
  gv_3DS_physical_downsample_metalGearSolid3,
  gv_PC_gog_original_heroesOfMightAndMagic3,
  gv_PC_physical_original_heroesOfMightAndMagic,
  gv_PC_physical_original_heroesOfMightAndMagic2,
  gv_PC_physical_original_heroesOfMightAndMagic3,
  gv_PC_physical_original_heroesOfMightAndMagic4,
  gv_PC_physical_original_indigoProphecy,
  gv_PC_physical_original_warcraft3,
  gv_PC_steam_original_ageOfEmpires2,
  gv_PC_steam_original_halfLife2,
  gv_PC_steam_original_halfLife2Episode1,
  gv_PC_steam_original_halfLife2Episode2,
  gv_PC_steam_original_portal,
  gv_PC_steam_original_teamFortress2,
  gv_PC_steam_remaster1_ageOfEmpires2,
  gv_PC_steam_remaster2_ageOfEmpires2,
  gv_PC_steam_remastered_indigoProphecy,
  gv_PS2_physical_original_indigoProphecy,
  gv_PS3_physical_original_metalGearSolid4,
  gv_PS3_physical_remaster_metalGearSolid2,
  gv_PS3_physical_remaster_metalGearSolid3,
  gv_PS4_digital_remastered_indigoProphecy,
  gv_PS4_physical_remastered_indigoProphecy,
  gv_X360_digital_original_indigoProphecy,
  gv_X360_physical_original_indigoProphecy,
  gv_X360_physical_original_redDeadRedemption,
  gv_X360_physical_original_redDeadRedemptionUndeadNightmare,
  gv_Xbox_physical_original_indigoProphecy,
  gv_XONE_digital_original_theWitcher3,
  gv_XONE_digital_original_theWitcher3Goty,
  gv_XONE_physical_original_theWitcher3,
  gv_XONE_physical_original_theWitcher3Goty,
  gv_XSX_digital_enhanced_theWitcher3, gv_XSX_digital_enhanced_theWitcher3Goty,
  gv_XSX_physical_enhanced_theWitcher3,
  gv_XSX_physical_enhanced_theWitcher3Goty,
} from './gameVersion';
import {
  DlcVersion,
  dv_PC_gog_original_heroesOfMightAndMagic3_armageddonsBlade,
  dv_PC_gog_original_heroesOfMightAndMagic3_theShadowOfDeath,
  dv_PC_physical_original_ageOfEmpires2_theConquerors,
  dv_PC_physical_original_heroesOfMightAndMagic2_thePriceOfLoyalty,
  dv_PC_physical_original_heroesOfMightAndMagic3_armageddonsBlade,
  dv_PC_physical_original_heroesOfMightAndMagic3_theShadowOfDeath,
  dv_PC_physical_original_heroesOfMightAndMagic4_theGatheringStorm,
  dv_PC_physical_original_heroesOfMightAndMagic4_windsOfWar,
  dv_PC_steam_remaster1_ageOfEmpires1_riseOfTheRajas,
  dv_PC_steam_remaster1_ageOfEmpires2_theAfricanKingdoms,
  dv_PC_steam_remaster1_ageOfEmpires2_theConquerors,
  dv_PC_steam_remaster1_ageOfEmpires2_theForgotten,
  dv_PC_steam_remaster2_ageOfEmpires2_dawnOfTheDukes,
  dv_PC_steam_remaster2_ageOfEmpires2_dynastiesOfIndia,
  dv_PC_steam_remaster2_ageOfEmpires2_lordsOfTheWest,
  dv_PC_steam_remaster2_ageOfEmpires2_riseOfTheRajas,
  dv_PC_steam_remaster2_ageOfEmpires2_theAfricanKingdoms,
  dv_PC_steam_remaster2_ageOfEmpires2_theConquerors,
  dv_PC_steam_remaster2_ageOfEmpires2_theForgotten,
  dv_XONE_original_theWitcher3goty_bloodAndWine,
  dv_XONE_original_theWitcher3goty_heartsOfStone,
  dv_XSX_Enhanced_theWitcher3goty_bloodAndWine,
  dv_XSX_Enhanced_theWitcher3goty_heartsOfStone,
} from "./dlcVersion";

enum mediaEnum {
  na,
  digital,
  dvd,
  cd,
}

export const allCollections: Collection[] = [];

export class Collection {
  readonly id: number;
  readonly title: string;
  readonly gameVersions: GameVersion[];
  readonly media: mediaEnum;
  readonly releaseYear?: number;
  readonly dlcVersions: DlcVersion[];

  constructor(
    title: string, gameVersions: GameVersion[], dlcVersions: DlcVersion[], media: mediaEnum, releaseYear?: number
  ) {
    this.id = allCollections.length;
    this.title = title;
    this.media = media;
    this.releaseYear = releaseYear;

    this.gameVersions = gameVersions;
    gameVersions.forEach(gameIteration => gameIteration.collections.push(this));

    this.dlcVersions = dlcVersions;
    dlcVersions.forEach(dlcVersion => dlcVersion.collections.push(this));

    allCollections.push(this);
  }

  getPlayableOnTitles(): string {
    const playableOnList: string[] = [];

    this.gameVersions.forEach( gameVersion => gameVersion.getPlayableOn().forEach(playableOn => playableOnList.push(playableOn)) );

    this.dlcVersions.forEach( dlcVersion => {
      dlcVersion.gameVersionsThisCanBeUsedOn.forEach(gameVersion => {
        gameVersion.getPlayableOn().forEach(playableOn => playableOnList.push(playableOn))
      });
    });

    return [...new Set(playableOnList)].join(', '); //unique
  }

  getVersionTypes(): string {
    const versionTypes: string[] = this.gameVersions.map( gameVersion => gameVersion.getVersionType() );

    this.dlcVersions.forEach( dlcVersion => {
      dlcVersion.gameVersionsThisCanBeUsedOn.forEach(gameVersion => {
        versionTypes.push(gameVersion.getVersionType())
      });
    });

    return [...new Set(versionTypes)].join(', '); //unique
  }
}

const c_PC_none_warcraft3 = new Collection('Warcraft 3: Reign of Chaos', [gv_PC_physical_original_warcraft3], [], mediaEnum.cd, 2002);
const c_PC_none_HeroesOfMightAndMagicCollection = new Collection('Heroes of Might and Magic Collection', [gv_PC_physical_original_heroesOfMightAndMagic, gv_PC_physical_original_heroesOfMightAndMagic2, gv_PC_physical_original_heroesOfMightAndMagic3, gv_PC_physical_original_heroesOfMightAndMagic4], [dv_PC_physical_original_heroesOfMightAndMagic2_thePriceOfLoyalty, dv_PC_physical_original_heroesOfMightAndMagic3_armageddonsBlade, dv_PC_physical_original_heroesOfMightAndMagic3_theShadowOfDeath, dv_PC_physical_original_heroesOfMightAndMagic4_theGatheringStorm, dv_PC_physical_original_heroesOfMightAndMagic4_windsOfWar], mediaEnum.dvd, 2004);
const c_PC_steam_TheOrangeBox = new Collection('The Orange Box', [gv_PC_steam_original_halfLife2, gv_PC_steam_original_halfLife2Episode1, gv_PC_steam_original_halfLife2Episode2, gv_PC_steam_original_portal, gv_PC_steam_original_teamFortress2], [], mediaEnum.digital, 2007);
const c_3DS_none_MetalGearSolid3SnakeEater3D = new Collection('Metal Gear Solid: Snake Eater 3D', [gv_3DS_physical_downsample_metalGearSolid3], [], mediaEnum.na, 2012);
const c_PS3_none_MetalGearSolidTheLegacyCollection = new Collection('Metal Gear Solid: The Legacy Collection', [gv_PS3_physical_remaster_metalGearSolid2, gv_PS3_physical_remaster_metalGearSolid3, gv_PS3_physical_original_metalGearSolid4], [], mediaEnum.na, 2011);
const c_PC_gog_HeroesOfMightAndMagic3Complete = new Collection('Heroes of Might and Magic 3: Complete', [gv_PC_gog_original_heroesOfMightAndMagic3], [dv_PC_gog_original_heroesOfMightAndMagic3_armageddonsBlade, dv_PC_gog_original_heroesOfMightAndMagic3_theShadowOfDeath], mediaEnum.na, undefined);

const c_PC_physical_ageOfEmpires2 = new Collection('Age of Empires 2: Age of Kings', [gv_PC_steam_original_ageOfEmpires2], [], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2TheConquerors = new Collection('Age of Empires 2: Age of Kings: The Conquerors', [], [dv_PC_physical_original_ageOfEmpires2_theConquerors], mediaEnum.na, undefined);

const c_PC_physical_ageOfEmpires2HdEdition = new Collection('Age of Empires 2: Age of Kings (HD Edition)', [gv_PC_steam_remaster1_ageOfEmpires2], [], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2HdEditionTheConquerors = new Collection('Age of Empires 2: Age of Kings (HD Edition): The Conquerors', [], [dv_PC_steam_remaster1_ageOfEmpires2_theConquerors], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2HdEditionTheForgotten = new Collection('Age of Empires 2: Age of Kings (HD Edition): The Forgotten', [], [dv_PC_steam_remaster1_ageOfEmpires2_theForgotten], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2HdEditionTheAfricanKingdoms = new Collection('Age of Empires 2: Age of Kings (HD Edition): The African Kingdoms', [], [dv_PC_steam_remaster1_ageOfEmpires2_theAfricanKingdoms], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2HdEditionRiseOfTheRajas = new Collection('Age of Empires 2: Age of Kings (HD Edition): Rise of the Rajas', [], [dv_PC_steam_remaster1_ageOfEmpires1_riseOfTheRajas], mediaEnum.na, undefined);

const c_PC_physical_ageOfEmpires2DefinitiveEdition = new Collection('Age of Empires 2: Age of Kings (Definitive Edition)', [gv_PC_steam_remaster2_ageOfEmpires2], [], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionTheConquerors = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): The Conquerors', [], [dv_PC_steam_remaster2_ageOfEmpires2_theConquerors], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionTheForgotten = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): The Forgotten', [], [dv_PC_steam_remaster2_ageOfEmpires2_theForgotten], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionTheAfricanKingdoms = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): The African Kingdoms', [], [dv_PC_steam_remaster2_ageOfEmpires2_theAfricanKingdoms], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionRiseOfTheRajas = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): Rise of the Rajas', [], [dv_PC_steam_remaster2_ageOfEmpires2_riseOfTheRajas], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionLordsOfTheWest = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): Lords of the West', [], [dv_PC_steam_remaster2_ageOfEmpires2_lordsOfTheWest], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionDawnOfTheDukes = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): Dawn of the Dukes', [], [dv_PC_steam_remaster2_ageOfEmpires2_dawnOfTheDukes], mediaEnum.na, undefined);
const c_PC_physical_ageOfEmpires2DefinitiveEditionDynastiesOfIndia = new Collection('Age of Empires 2: Age of Kings (Definitive Edition): Dynasties of India', [], [dv_PC_steam_remaster2_ageOfEmpires2_dynastiesOfIndia], mediaEnum.na, undefined);


const c_PC_physical_indigoProphecy = new Collection('Indigo Prophecy', [gv_PC_physical_original_indigoProphecy], [], mediaEnum.dvd, 2005);
const c_PS2_physical_indigoProphecy = new Collection('Indigo Prophecy', [gv_PS2_physical_original_indigoProphecy], [], mediaEnum.dvd, 2005);
const c_Xbox_physical_indigoProphecy = new Collection('Indigo Prophecy', [gv_Xbox_physical_original_indigoProphecy], [], mediaEnum.dvd, 2005);
const c_X360_physical_indigoProphecy = new Collection('Indigo Prophecy', [gv_X360_physical_original_indigoProphecy], [], mediaEnum.dvd, 2007);
const c_X360_digital_indigoProphecy = new Collection('Indigo Prophecy', [gv_X360_digital_original_indigoProphecy], [], mediaEnum.digital, 2007);
const c_PC_steam_fahrenheitIndigoProphecyRemastered = new Collection('Fahrenheit: Indigo Prophecy Remastered', [gv_PC_steam_remastered_indigoProphecy], [], mediaEnum.digital, 2015);

const c_PS4_digital_indigoProphecy = new Collection('Indigo Prophecy', [gv_PS4_digital_remastered_indigoProphecy], [], mediaEnum.digital, 2015);
const c_PS4_physical_indigoProphecy = new Collection('Indigo Prophecy: Limited Run #331', [gv_PS4_physical_remastered_indigoProphecy], [], mediaEnum.digital, 2020);

const c_X360_physical_redDeadRedemptionGameOfTheYearEdition = new Collection('Red Dead Redemption: Game of the Year Edition', [gv_X360_physical_original_redDeadRedemption, gv_X360_physical_original_redDeadRedemptionUndeadNightmare], [], mediaEnum.na, 2011);

const c_XONE_physical_TheWitcher3 = new Collection('The Witcher 3: Wild Hunt', [gv_XONE_physical_original_theWitcher3, gv_XSX_physical_enhanced_theWitcher3], [], mediaEnum.na, 2015);
const c_XONE_digital_TheWitcher3 = new Collection('The Witcher 3: Wild Hunt', [gv_XONE_digital_original_theWitcher3, gv_XSX_digital_enhanced_theWitcher3], [], mediaEnum.na, 2015);

const c_XONEXSX_physical_TheWitcher3goty = new Collection('The Witcher 3: Wild Hunt - Game of the Year Edition', [gv_XONE_physical_original_theWitcher3Goty, gv_XSX_physical_enhanced_theWitcher3Goty], [dv_XSX_Enhanced_theWitcher3goty_heartsOfStone, dv_XSX_Enhanced_theWitcher3goty_bloodAndWine, dv_XONE_original_theWitcher3goty_heartsOfStone, dv_XONE_original_theWitcher3goty_bloodAndWine], mediaEnum.na, 2016);
const c_XONEXSXXSS_digital_TheWitcher3goty = new Collection('The Witcher 3: Wild Hunt - Game of the Year Edition', [gv_XONE_digital_original_theWitcher3Goty, gv_XSX_digital_enhanced_theWitcher3Goty], [dv_XSX_Enhanced_theWitcher3goty_heartsOfStone, dv_XSX_Enhanced_theWitcher3goty_bloodAndWine, dv_XONE_original_theWitcher3goty_heartsOfStone, dv_XONE_original_theWitcher3goty_bloodAndWine], mediaEnum.na, 2016);

const c_PS4PS5_physical_TheWitcher3 = new Collection('The Witcher 3: Wild Hunt', [], [], mediaEnum.na, 2015);
const c_PS4PS5PS5D_digital_TheWitcher3 = new Collection('The Witcher 3: Wild Hunt', [], [], mediaEnum.na, 2015);


console.log({allCollections});
