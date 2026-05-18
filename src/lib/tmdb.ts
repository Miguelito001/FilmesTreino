const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type: "movie";
}

export interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type: "tv";
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBVideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface TMDBCreditsResult {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
  }>;
}

export type TMDBContent = TMDBMovie | TMDBShow;

export const isMovie = (content: TMDBContent): content is TMDBMovie => {
  return content.media_type === "movie";
};

export const isShow = (content: TMDBContent): content is TMDBShow => {
  return content.media_type === "tv";
};

const getTitle = (content: TMDBContent): string => {
  return isMovie(content) ? content.title : content.name;
};

const getReleaseDate = (content: TMDBContent): string => {
  return isMovie(content) ? content.release_date : content.first_air_date;
};

export async function searchContent(query: string): Promise<TMDBContent[]> {
  if (!API_KEY) {
    throw new Error("TMDB_API_KEY não está configurada");
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || [])
      .filter(
        (item: any) => item.media_type === "movie" || item.media_type === "tv"
      )
      .map((item: any) => ({
        ...item,
        media_type: item.media_type as "movie" | "tv",
      }));
  } catch (error) {
    console.error("Erro ao buscar conteúdo:", error);
    return [];
  }
}

export async function getTrendingContent(
  type: "movie" | "tv" = "movie"
): Promise<TMDBContent[]> {
  if (!API_KEY) {
    throw new Error("TMDB_API_KEY não está configurada");
  }

  try {
    const response = await fetch(
      `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&language=pt-BR`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map((item: any) => ({
      ...item,
      media_type: type,
    }));
  } catch (error) {
    console.error("Erro ao buscar trending:", error);
    return [];
  }
}

export async function getContentDetails(
  id: number,
  type: "movie" | "tv"
): Promise<{
  content: TMDBContent;
  videos: TMDBVideoResult[];
  credits: TMDBCreditsResult;
} | null> {
  if (!API_KEY) {
    throw new Error("TMDB_API_KEY não está configurada");
  }

  try {
    const contentResponse = await fetch(
      `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=pt-BR`,
      { next: { revalidate: 3600 } }
    );

    const videosResponse = await fetch(
      `${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=pt-BR`,
      { next: { revalidate: 3600 } }
    );

    const creditsResponse = await fetch(
      `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}&language=pt-BR`,
      { next: { revalidate: 3600 } }
    );

    if (!contentResponse.ok || !videosResponse.ok || !creditsResponse.ok) {
      throw new Error("Erro ao buscar detalhes");
    }

    const contentData = await contentResponse.json();
    const videosData = await videosResponse.json();
    const creditsData = await creditsResponse.json();

    return {
      content: {
        ...contentData,
        media_type: type,
      },
      videos: videosData.results || [],
      credits: creditsData,
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do conteúdo:", error);
    return null;
  }
}

export async function getPopularContent(
  type: "movie" | "tv",
  page = 1
): Promise<TMDBContent[]> {
  if (!API_KEY) throw new Error("TMDB_API_KEY não está configurada");
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=pt-BR&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error(`Erro na API TMDB: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map((item: any) => ({
      ...item,
      media_type: type,
    }));
  } catch (error) {
    console.error("Erro ao buscar populares:", error);
    return [];
  }
}

export async function getTopRatedContent(
  type: "movie" | "tv"
): Promise<TMDBContent[]> {
  if (!API_KEY) throw new Error("TMDB_API_KEY não está configurada");
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/top_rated?api_key=${API_KEY}&language=pt-BR`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error(`Erro na API TMDB: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map((item: any) => ({
      ...item,
      media_type: type,
    }));
  } catch (error) {
    console.error("Erro ao buscar top rated:", error);
    return [];
  }
}

export async function getContentByGenre(
  type: "movie" | "tv",
  genreId: number
): Promise<TMDBContent[]> {
  if (!API_KEY) throw new Error("TMDB_API_KEY não está configurada");
  try {
    const response = await fetch(
      `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=pt-BR&with_genres=${genreId}&sort_by=popularity.desc`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error(`Erro na API TMDB: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map((item: any) => ({
      ...item,
      media_type: type,
    }));
  } catch (error) {
    console.error("Erro ao buscar por gênero:", error);
    return [];
  }
}

export async function getGenres(
  type: "movie" | "tv"
): Promise<TMDBGenre[]> {
  if (!API_KEY) {
    throw new Error("TMDB_API_KEY não está configurada");
  }

  try {
    const response = await fetch(
      `${BASE_URL}/genre/${type}/list?api_key=${API_KEY}&language=pt-BR`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar gêneros");
    }

    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error("Erro ao buscar gêneros:", error);
    return [];
  }
}

export function getPosterUrl(
  posterPath: string | null,
  size: "w200" | "w500" | "w780" = "w500"
): string {
  if (!posterPath) {
    return "https://via.placeholder.com/500x750/1a1a1a/999?text=Sem+Imagem";
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export function getBackdropUrl(
  backdropPath: string | null,
  size: "w780" | "w1280" = "w1280"
): string {
  if (!backdropPath) {
    return "https://via.placeholder.com/1280x720/1a1a1a/999?text=Sem+Imagem";
  }
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}

export function getTrailerUrl(videos: TMDBVideoResult[]): string | null {
  // Procura por trailers em português
  const ptTrailer = videos.find(
    (v) =>
      v.site === "YouTube" &&
      (v.type === "Trailer" || v.type === "Teaser") &&
      v.key
  );

  if (ptTrailer) {
    return `https://www.youtube.com/embed/${ptTrailer.key}`;
  }

  // Se não encontrar em português, procura em qualquer idioma
  const anyTrailer = videos.find(
    (v) =>
      v.site === "YouTube" &&
      (v.type === "Trailer" || v.type === "Teaser") &&
      v.key
  );

  return anyTrailer ? `https://www.youtube.com/embed/${anyTrailer.key}` : null;
}
