export interface Title {
  id: string;
  title: string;
  type: "MOVIE" | "SHOW";
  description: string;
  release_year: number;
  age_certification: string;
  runtime: number;
  genres: string[];
  production_countries: string[];
  seasons: number | null;
  imdb_id: string;
  imdb_score: number | null;
  imdb_votes: number | null;
  tmdb_popularity: number | null;
  tmdb_score: number | null;
}

export interface Credit {
  person_id: string;
  id: string;
  name: string;
  character: string;
  role: "ACTOR" | "DIRECTOR";
}

export function parseCSV(csv: string): string[][] {
  const lines = csv.split("\n");
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

export function parseGenres(genresStr: string): string[] {
  if (!genresStr || genresStr === "[]") return [];
  try {
    // Remove brackets and split by comma
    const cleaned = genresStr.replace(/[\[\]']/g, "");
    return cleaned
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function parseCountries(countriesStr: string): string[] {
  if (!countriesStr || countriesStr === "[]") return [];
  try {
    const cleaned = countriesStr.replace(/[\[\]']/g, "");
    return cleaned
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function parseTitles(csv: string): Title[] {
  const rows = parseCSV(csv);
  const headers = rows[0];
  const titles: Title[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < headers.length) continue;

    const title: Title = {
      id: row[0],
      title: row[1],
      type: row[2] as "MOVIE" | "SHOW",
      description: row[3],
      release_year: parseInt(row[4]) || 0,
      age_certification: row[5] || "",
      runtime: parseInt(row[6]) || 0,
      genres: parseGenres(row[7]),
      production_countries: parseCountries(row[8]),
      seasons: row[9] ? parseFloat(row[9]) : null,
      imdb_id: row[10],
      imdb_score: row[11] ? parseFloat(row[11]) : null,
      imdb_votes: row[12] ? parseFloat(row[12]) : null,
      tmdb_popularity: row[13] ? parseFloat(row[13]) : null,
      tmdb_score: row[14] ? parseFloat(row[14]) : null,
    };

    if (title.id && title.title) {
      titles.push(title);
    }
  }

  return titles;
}

export function parseCredits(csv: string): Credit[] {
  const rows = parseCSV(csv);
  const credits: Credit[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;

    const credit: Credit = {
      person_id: row[0],
      id: row[1],
      name: row[2],
      character: row[3],
      role: row[4] as "ACTOR" | "DIRECTOR",
    };

    if (credit.name) {
      credits.push(credit);
    }
  }

  return credits;
}
