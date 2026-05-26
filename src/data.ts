import { Team, Sticker } from "./types";

const RAW_CSV_DATA = `Seleção,FWC,,,3,4,5,6,7,8,,,,,,,,,,,,
México,MEX,1,,,,5,,,8,,10,,12,13,,,,17,,19,
África do Sul,RSA,,,,,,,7,,,,,,,,,16,,18,,
Coreia do Sul,KOR,,2,,,,6,,,9,,11,12,,14,,,17,18,19,20
República Tcheca,CZE,,2,3, ,,,7,,,,11,12,13,14,15,16,,18,19,20
Canadá,CAN,,2,3,,5,6,7,8,,10,11,12,13,,,,,18,,
Bósnia e Herzegovina,BIH,1,2,3,4,,6,7,8,,,,12,13,,,,,18,,
Catar,QAT,1,2,,,5,,7,,,,,,,,15,,17,18,,20
Suíça,SUI,1,2,3,,5,6,,8,,10,,12,,,,,17,,,20
Brasil,BRA,1,,,,,,,,9,,,12,13,14,,16,17,18,,20
Marrocos,MAR,,2,,,5,6,,,9,,,,,,,16,,,,20
Haiti,HAI,1,2,3,4,5,,7,8,9,,11,,13,,,16,17,,,20
Escócia,SCO,1,,,4,,,,,,,,12,13,,,,,,,
Estados Unidos,USA,1,2,3,4,5,6,,8,,10,11,12,13,14,,,17,,19,
Paraguai,PAR,,2,,4,,6,,8,,10,,12,,,15,,17,,,
Austrália,AUS,1,,,,,,7,,,,,,,,,,17,,,
Turquia,TUR,,2,3,,5,6,7,,9,10,11,,13,14,15,,17,18,19,20
Alemanha,GER,,,,,,6,7,8,,,,,,,,16,,,19,
Curaçao,CUW,,,,4,,6,,,,10,,,13,,15,,,,,20
Costa do Marfim,CIV,,,3,,5,6,,,,,11,,13,,,,,,,
Equador,ECU,1,,,4,,6,,,9,,,,,,,16,,,19,20
Holanda,NED,1,,3,,,,7,,9,,11,12,13,,,16,,,19,20
Japão,JPN,1,2,3,4,,,,8,,10,,12,,,,,17,,,
Suécia,SWE,1,,3,,5,6,7,8,9,10,11,,13,,15,16,17,18,19,20
Tunísia,TUN,,,,,5,6,7,,9,,11,,13,,,16,17,18,19,20
Bélgica,BEL,,2,3,,,,7,,,,,,13,14,15,,,,,
Egito,EGY,,,,4,,6,,,9,10,11,12,13,,,16,,,,20
Irã,IRN,1,,3,4,,,7,,,,11,,,14,,16,17,,,20
Nova Zelândia,NZL,,,,4,5,,,,9,10,,12,,14,,,17,18,,
Espanha,ESP,,2,,,5,,,,9,,,12,13,,,,17,,,
Cabo Verde,CPV,1,,3,4,5,,7,,,,,12,,14,,16,,18,,
Arábia Saudita,KSA,,2,3,4,,,7,,,,,,,,,16,17,,,
Uruguai,URU,,2,3,4,5,6,7,8,9,,11,,13,,,,,,,
França,FRA,,,3,,,,7,,,10,11,12,13,14,,,,18,19,
Senegal,SEN,1,2,,,,,7,,,,11,,,,,,,,,
Iraque,IRQ,1,2,,,5,6,,,9,10,,,,14,,16,17,18,19,
Noruega,NOR,,,3,4,,,7,8,,,11,12,13,,,16,,,,20
Argentina,ARG,,,,,5,,,,9,,11,,,14,,16,17,,19,
Argélia,ALG,,2,,,5,6,,,9,,11,,,,15,,,,19,
Áustria,AUT,1,,,4,,,,8,9,,,,13,14,,16,,18,,
Jordânia,JOR,,2,,,5,,,,9,10,,,13,,,,,,19,
Portugal,POR,1,,3,,,6,,8,,10,11,12,,,,16,17,18,19,20
RD Congo,COD,1,2,,4,,6,,,9,10,11,,13,14,15,16,17,,,20
Uzbequistão,UZB,,,,4,5,,7,8,,10,11,12,13,14,15,16,,,,
Colômbia,COL,1,,,,5,6,,8,,,,,13,,,,17,18,19,20
Inglaterra,ENG,,,,,5,6,,,9,,11,,13,14,,16,,,,20
Croácia,CRO,,2,,,,,7,,9,10,11,12,,,,16,17,18,,20
Gana,GHA,,,3,4,,6,7,8,,10,,,,14,15,,,,,20
Panamá,PAN,1,,,,,,,,,,11,,,,15,16,17,,,20
FIFA,FWC,,10,,12,13,,,16,17,18,19,,,,,,,,,
COCA,,,,CC3,,,CC6,,,,CC10,CC11,,CC13,CC14,,,,,,`;

const FLAG_MAP: Record<string, string> = {
  FWC: "🏆",
  MEX: "🇲🇽",
  RSA: "🇿🇦",
  KOR: "🇰🇷",
  CZE: "🇨🇿",
  CAN: "🇨🇦",
  BIH: "🇧🇦",
  QAT: "🇶🇦",
  SUI: "🇨🇭",
  BRA: "🇧🇷",
  MAR: "🇲🇦",
  HAI: "🇭🇹",
  SCO: "🏴",
  USA: "🇺🇸",
  PAR: "🇵🇾",
  AUS: "🇦🇺",
  TUR: "🇹🇷",
  GER: "🇩🇪",
  CUW: "🇨🇼",
  CIV: "🇨🇮",
  ECU: "🇪🇨",
  NED: "🇳🇱",
  JPN: "🇯🇵",
  SWE: "🇸🇪",
  TUN: "🇹🇳",
  BEL: "🇧🇪",
  EGY: "🇪🇬",
  IRN: "🇮🇷",
  NZL: "🇳🇿",
  ESP: "🇪🇸",
  CPV: "🇨🇻",
  KSA: "🇸🇦",
  URU: "🇺🇾",
  FRA: "🇫🇷",
  SEN: "🇸🇳",
  IRQ: "🇮🇶",
  NOR: "🇳🇴",
  ARG: "🇦🇷",
  ALG: "🇩🇿",
  AUT: "🇦🇹",
  JOR: "🇯🇴",
  POR: "🇵🇹",
  COD: "🇨🇩",
  UZB: "🇺🇿",
  COL: "🇨🇴",
  ENG: "🏴",
  CRO: "🇭🇷",
  GHA: "🇬🇭",
  PAN: "🇵🇦",
  COCA: "🥤",
};

interface ParsedRow {
  name: string;
  id: string;
  unobtainedNumbers: Set<number>;
}

function parseCsvData(): {
  teams: Team[];
  unobtainedMap: Record<string, Set<number>>;
} {
  const lines = RAW_CSV_DATA.trim().split("\n");
  const teamMap: Record<
    string,
    { name: string; unobtainedNumbers: Set<number> }
  > = {};
  const orderList: string[] = [];

  lines.forEach((line) => {
    if (!line.trim()) return;
    const parts = line.split(",");

    // col 0: Name
    const name = parts[0]?.trim();
    // col 1: ID
    let id = parts[1]?.trim();

    if (!name) return;

    // Handle special case COCA
    if (name.toUpperCase() === "COCA" && !id) {
      id = "COCA";
    }

    if (!id) return;

    // Col 2 and onwards map to numbers 1 to 20
    const currentUnobtained = new Set<number>();
    for (let i = 2; i < parts.length; i++) {
      const val = parts[i]?.trim();
      const num = i - 1; // index 2 maps to 1
      if (val && num <= 20) {
        currentUnobtained.add(num);
      }
    }

    if (teamMap[id]) {
      // Merge unobtained numbers
      currentUnobtained.forEach((n) => teamMap[id].unobtainedNumbers.add(n));
    } else {
      teamMap[id] = {
        name,
        unobtainedNumbers: currentUnobtained,
      };
      orderList.push(id);
    }
  });

  // Re-map FWC name specifically
  if (teamMap["FWC"]) {
    teamMap["FWC"].name = "Especial / Abertura";
  }
  // Re-map COCA name specifically
  if (teamMap["COCA"]) {
    teamMap["COCA"].name = "Coca-Cola";
  }

  // Generate ordered teams
  const finalTeams: Team[] = [];
  const isEspecial = (id: string) => id === "FWC" || id === "COCA";
  const normalIds = orderList.filter((id) => !isEspecial(id));

  // 1. FWC at top
  if (teamMap["FWC"]) {
    finalTeams.push({
      id: "FWC",
      name: teamMap["FWC"].name,
      group: "Especial",
      flag: "🏆",
    });
  }

  // 2. Normal Teams sorted in custom 6-team columns (Group A to H)
  normalIds.forEach((id, idx) => {
    let group = "Grupo A";
    if (idx < 6) group = "Grupo A";
    else if (idx < 12) group = "Grupo B";
    else if (idx < 18) group = "Grupo C";
    else if (idx < 24) group = "Grupo D";
    else if (idx < 30) group = "Grupo E";
    else if (idx < 36) group = "Grupo F";
    else if (idx < 42) group = "Grupo G";
    else group = "Grupo H";

    finalTeams.push({
      id,
      name: teamMap[id].name,
      group,
      flag: FLAG_MAP[id] || "🏳️",
    });
  });

  // 3. COCA at bottom
  if (teamMap["COCA"]) {
    finalTeams.push({
      id: "COCA",
      name: teamMap["COCA"].name,
      group: "Especial",
      flag: "🥤",
    });
  }

  const unobtainedRecord: Record<string, Set<number>> = {};
  for (const id of orderList) {
    unobtainedRecord[id] = teamMap[id].unobtainedNumbers;
  }

  return { teams: finalTeams, unobtainedMap: unobtainedRecord };
}

const parsed = parseCsvData();
export const TEAMS: Team[] = parsed.teams;

export const GROUPS = [
  "Especial",
  "Grupo A",
  "Grupo B",
  "Grupo C",
  "Grupo D",
  "Grupo E",
  "Grupo F",
  "Grupo G",
  "Grupo H",
];

const unobtainedMap = parsed.unobtainedMap;

function getStickersAmmountByType(teamId: string): number {
  switch (teamId) {
    case "COCA":
      return 15;
    case "FWC":
      return 19;
    default:
      return 20;
  }
}

export function generateDefaultStickers(): Sticker[] {
  const stickers: Sticker[] = [];

  TEAMS.forEach((team) => {
    const totalStickersForTeam = getStickersAmmountByType(team.id);
    const teamUnobtained = unobtainedMap[team.id] || new Set<number>();

    for (let i = 1; i <= totalStickersForTeam; i++) {
      let code = `${team.id} ${i}`;
      if (team.id === "COCA") {
        code = `CC ${i}`;
      }

      const isUnobtained = teamUnobtained.has(i);

      stickers.push({
        id: `${team.id}-${i}`,
        code,
        number: i,
        teamId: team.id,
        owned: !isUnobtained,
        duplicates: 0,
      });
    }
  });

  return stickers;
}
