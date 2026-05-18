"use client";

import { useState, useEffect } from "react";
import { Search, Play, Star, Calendar, Film, Tv, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  searchContent,
  getTrendingContent,
  getContentDetails,
  getGenres,
  getPosterUrl,
  getBackdropUrl,
  getTrailerUrl,
  isMovie,
  type TMDBContent,
  type TMDBGenre,
} from "@/lib/tmdb";
import { YouTubePlayer } from "@/components/YouTubePlayer";

const GENRE_COLORS: Record<string, string> = {
  28: "bg-red-500/20 text-red-300 border-red-500/30",
  12: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  16: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  35: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  80: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  99: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  18: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  10751: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  14: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  36: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  27: "bg-green-500/20 text-green-300 border-green-500/30",
  10402: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  9648: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  10749: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  878: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  10770: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  53: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  10752: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  37: "bg-lime-500/20 text-lime-300 border-lime-500/30",
};

function getGenreColor(genreId: number): string {
  return (
    GENRE_COLORS[String(genreId)] ||
    "bg-muted text-muted-foreground border-border"
  );
}

export default function StreamingHome() {
  const [allMovies, setAllMovies] = useState<TMDBContent[]>([]);
  const [allShows, setAllShows] = useState<TMDBContent[]>([]);
  const [trendingAll, setTrendingAll] = useState<TMDBContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<TMDBContent | null>(
    null
  );
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [genres, setGenres] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);

        // Carrega dados iniciais
        const [moviesData, showsData, trendingData, movieGenres, showGenres] =
          await Promise.all([
            getTrendingContent("movie"),
            getTrendingContent("tv"),
            getTrendingContent("movie"),
            getGenres("movie"),
            getGenres("tv"),
          ]);

        setAllMovies(moviesData);
        setAllShows(showsData);
        setTrendingAll(trendingData);

        const genreMap: Record<string, string> = {};
        [...movieGenres, ...showGenres].forEach((g) => {
          genreMap[String(g.id)] = g.name;
        });
        setGenres(genreMap);
      } catch (error) {
        console.error("[v0] Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Pesquisa dinâmica
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        const results = await searchContent(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectContent = async (content: TMDBContent) => {
    setSelectedContent(content);
    const details = await getContentDetails(
      content.id,
      isMovie(content) ? "movie" : "tv"
    );
    setSelectedDetails(details);
  };

  const displayedContent = searchResults.length > 0 ? searchResults : trendingAll;

  const ContentCard = ({ content }: { content: TMDBContent }) => (
    <button
      onClick={() => handleSelectContent(content)}
      className="group relative flex-shrink-0 w-48 cursor-pointer transform transition-all duration-300 hover:scale-110"
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <img
          src={getPosterUrl(
            isMovie(content) ? content.poster_path : content.poster_path,
            "w200"
          )}
          alt={isMovie(content) ? content.title : content.name}
          className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="text-white text-sm">
            <p className="font-semibold line-clamp-2">
              {isMovie(content) ? content.title : content.name}
            </p>
            <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400" />
              {content.vote_average.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-background to-transparent border-b border-border/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Film className="w-8 h-8 text-destructive" />
              <h1 className="text-3xl font-bold">FilmesTreino</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Powered by TMDB
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquise filmes, séries, atores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50 focus:border-destructive"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-72 rounded-lg" />
            ))}
          </div>
        ) : displayedContent.length > 0 ? (
          <div>
            {searchResults.length > 0 && (
              <h2 className="text-xl font-bold mb-6">
                {searchResults.length} resultados encontrados
              </h2>
            )}

            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {displayedContent.slice(0, 20).map((content) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? "Nenhum resultado encontrado"
                : "Carregando conteúdo..."}
            </p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 border-border/50">
          {selectedContent && selectedDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {isMovie(selectedContent)
                    ? selectedContent.title
                    : selectedContent.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Backdrop */}
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={getBackdropUrl(
                      isMovie(selectedContent)
                        ? selectedContent.backdrop_path
                        : selectedContent.backdrop_path
                    )}
                    alt={isMovie(selectedContent) ? selectedContent.title : selectedContent.name}
                    className="w-full h-64 object-cover"
                  />
                </div>

                {/* Trailer */}
                {selectedDetails.videos && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Trailer</h3>
                    <YouTubePlayer
                      videoUrl={getTrailerUrl(selectedDetails.videos)}
                      title={
                        isMovie(selectedContent)
                          ? selectedContent.title
                          : selectedContent.name
                      }
                    />
                  </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Avaliação</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {selectedContent.vote_average.toFixed(1)}/10
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Votos</p>
                    <p className="text-lg font-semibold">
                      {(selectedContent.vote_count / 1000).toFixed(1)}k
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      {isMovie(selectedContent) ? (
                        <>
                          <Film className="w-4 h-4" />
                          Filme
                        </>
                      ) : (
                        <>
                          <Tv className="w-4 h-4" />
                          Série
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Lançamento</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(
                        isMovie(selectedContent)
                          ? selectedContent.release_date
                          : selectedContent.first_air_date
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {/* Genres */}
                {selectedContent.genre_ids && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Gêneros</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.genre_ids.map((genreId) => (
                        <Badge
                          key={genreId}
                          className={`${getGenreColor(genreId)} border`}
                          variant="outline"
                        >
                          {genres[String(genreId)] || "Outro"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synopsis */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Sinopse</p>
                  <p className="text-foreground/80 leading-relaxed">
                    {selectedContent.overview ||
                      "Sinopse não disponível"}
                  </p>
                </div>

                {/* Cast */}
                {selectedDetails.credits && selectedDetails.credits.cast && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Elenco</p>
                    <ScrollArea>
                      <div className="flex gap-3 pb-2">
                        {selectedDetails.credits.cast
                          .slice(0, 10)
                          .map((actor: any) => (
                            <div
                              key={actor.id}
                              className="flex-shrink-0 w-24 text-center"
                            >
                              {actor.profile_path && (
                                <img
                                  src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                  alt={actor.name}
                                  className="w-24 h-32 object-cover rounded-lg mb-2"
                                />
                              )}
                              <p className="text-xs font-semibold truncate">
                                {actor.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {actor.character}
                              </p>
                            </div>
                          ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}

                {/* Director/Producer */}
                {selectedDetails.credits && selectedDetails.credits.crew && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Diretor/Produtor
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDetails.credits.crew
                        .filter(
                          (member: any) =>
                            member.job === "Director" ||
                            member.job === "Producer"
                        )
                        .slice(0, 4)
                        .map((member: any) => (
                          <div key={member.id}>
                            <p className="text-sm font-semibold">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.job}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
