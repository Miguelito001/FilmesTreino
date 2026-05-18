"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Play,
  Star,
  Info,
  ChevronLeft,
  ChevronRight,
  Film,
  Tv,
  X,
} from "lucide-react";
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
  getPopularContent,
  getTopRatedContent,
  getContentDetails,
  getGenres,
  getPosterUrl,
  getBackdropUrl,
  getTrailerUrl,
  isMovie,
  type TMDBContent,
} from "@/lib/tmdb";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getTitle(content: TMDBContent) {
  return isMovie(content) ? content.title : content.name;
}

function getReleaseYear(content: TMDBContent) {
  const date = isMovie(content)
    ? content.release_date
    : content.first_air_date;
  return date ? new Date(date).getFullYear() : "—";
}

/* ------------------------------------------------------------------ */
/*  ContentCard                                                         */
/* ------------------------------------------------------------------ */

interface ContentCardProps {
  content: TMDBContent;
  onSelect: (content: TMDBContent) => void;
  wide?: boolean;
}

function ContentCard({ content, onSelect, wide = false }: ContentCardProps) {
  return (
    <button
      onClick={() => onSelect(content)}
      className={cn(
        "group relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all duration-300",
        "hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-black/70",
        wide ? "w-64 h-36" : "w-40 h-60 md:w-44 md:h-64"
      )}
    >
      <img
        src={
          wide && content.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${content.backdrop_path}`
            : getPosterUrl(content.poster_path, "w500")
        }
        alt={getTitle(content)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* info on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-white font-semibold text-sm line-clamp-1">
          {getTitle(content)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-yellow-400 text-xs">
            <Star className="w-3 h-3 fill-yellow-400" />
            {content.vote_average.toFixed(1)}
          </span>
          <span className="text-white/60 text-xs">{getReleaseYear(content)}</span>
        </div>
      </div>

      {/* play icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ContentRow                                                          */
/* ------------------------------------------------------------------ */

interface ContentRowProps {
  title: string;
  items: TMDBContent[];
  onSelect: (content: TMDBContent) => void;
  wide?: boolean;
  loading?: boolean;
}

function ContentRow({ title, items, onSelect, wide = false, loading = false }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = direction === "left" ? -600 : 600;
    rowRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="relative group/row">
      <h2 className="text-white font-semibold text-lg md:text-xl px-4 md:px-12 mb-3 tracking-wide">
        {title}
      </h2>

      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Rolar para esquerda"
          className="absolute left-0 top-0 bottom-0 z-10 w-10 md:w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
        >
          <ChevronLeft className="w-7 h-7 text-white" />
        </button>

        {/* Scrollable list */}
        <div
          ref={rowRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "flex-shrink-0 rounded-md bg-white/10",
                    wide ? "w-64 h-36" : "w-40 h-60 md:w-44 md:h-64"
                  )}
                />
              ))
            : items.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  onSelect={onSelect}
                  wide={wide}
                />
              ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Rolar para direita"
          className="absolute right-0 top-0 bottom-0 z-10 w-10 md:w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
        >
          <ChevronRight className="w-7 h-7 text-white" />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HeroBanner                                                          */
/* ------------------------------------------------------------------ */

interface HeroBannerProps {
  content: TMDBContent | null;
  onPlay: (content: TMDBContent) => void;
  onInfo: (content: TMDBContent) => void;
  loading: boolean;
}

function HeroBanner({ content, onPlay, onInfo, loading }: HeroBannerProps) {
  if (loading) {
    return (
      <div className="relative w-full h-[70vh] bg-black">
        <Skeleton className="w-full h-full bg-white/5" />
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Backdrop */}
      <img
        src={getBackdropUrl(content.backdrop_path, "w1280")}
        alt={getTitle(content)}
        className="absolute inset-0 w-full h-full object-cover"
        priority-fetch="high"
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />

      {/* Content */}
      <div className="absolute bottom-16 md:bottom-24 left-4 md:left-12 max-w-xl">
        {/* Type tag */}
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">
          {isMovie(content) ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
          {isMovie(content) ? "Filme em destaque" : "Série em destaque"}
        </span>

        <h1 className="text-4xl md:text-6xl font-black text-white leading-none mb-4 text-balance drop-shadow-lg">
          {getTitle(content)}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center gap-1 text-yellow-400 font-semibold text-sm">
            <Star className="w-4 h-4 fill-yellow-400" />
            {content.vote_average.toFixed(1)}
          </span>
          <span className="text-white/50 text-sm">•</span>
          <span className="text-white/70 text-sm">{getReleaseYear(content)}</span>
        </div>

        <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-3 mb-8 text-pretty">
          {content.overview || "Sinopse não disponível."}
        </p>

        <div className="flex gap-3">
          <Button
            onClick={() => onPlay(content)}
            size="lg"
            className="bg-white text-black font-bold hover:bg-white/90 gap-2 rounded-md px-8"
          >
            <Play className="w-5 h-5 fill-black" />
            Assistir trailer
          </Button>
          <Button
            onClick={() => onInfo(content)}
            size="lg"
            variant="secondary"
            className="bg-white/20 text-white font-semibold hover:bg-white/30 gap-2 rounded-md px-6 backdrop-blur-sm border border-white/10"
          >
            <Info className="w-5 h-5" />
            Mais info
          </Button>
        </div>
      </div>
    </div>
  );
}



/* ------------------------------------------------------------------ */
/*  DetailModal — trailer inline + info lado a lado                    */
/* ------------------------------------------------------------------ */

interface DetailModalProps {
  content: TMDBContent | null;
  details: any;
  genres: Record<string, string>;
  onClose: () => void;
}

function DetailModal({ content, details, genres, onClose }: DetailModalProps) {
  const trailerUrl = details?.videos ? getTrailerUrl(details.videos) : null;

  return (
    <Dialog open={!!content} onOpenChange={onClose}>
      {/*
        w-[95vw] max-w-6xl: ocupa 95% da largura, no máximo 1152px
        max-h-[92vh] overflow-y-auto: scroll vertical se necessário (tela pequena)
        Sem overflow horizontal — layout flex-col → flex-row conforme espaço
      */}
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] !max-w-6xl max-h-[92vh] overflow-y-auto bg-[#181818] border-white/10 p-0 gap-0"
      >
        {content && (
          <>
            {/* Cabeçalho com título e botão fechar */}
            <div className="flex items-start justify-between px-6 pt-5 pb-0">
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-black text-white leading-tight text-balance pr-8">
                  {getTitle(content)}
                </DialogTitle>
              </DialogHeader>
              <button
                onClick={onClose}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full p-1.5 text-white transition-colors mt-0.5"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo: player à esquerda + info à direita */}
            <div className="flex flex-col lg:flex-row gap-0 p-6 pt-4">

              {/* ── Coluna esquerda: trailer ou backdrop ── */}
              <div className="lg:w-[60%] flex-shrink-0">
                {trailerUrl ? (
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`${trailerUrl}&autoplay=1&mute=0`}
                      title={`Trailer — ${getTitle(content)}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                    <img
                      src={getBackdropUrl(content.backdrop_path, "w1280")}
                      alt={getTitle(content)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* ── Coluna direita: informações ── */}
              <div className="lg:w-[40%] lg:pl-6 mt-5 lg:mt-0 flex flex-col gap-4 overflow-y-auto lg:max-h-[calc(92vh-120px)]">

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {content.vote_average.toFixed(1)}/10
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/70">{getReleaseYear(content)}</span>
                  <span className="text-white/30">·</span>
                  <span className="flex items-center gap-1 text-white/70">
                    {isMovie(content) ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                    {isMovie(content) ? "Filme" : "Série"}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/50">
                    {(content.vote_count / 1000).toFixed(1)}k votos
                  </span>
                </div>

                {/* Gêneros */}
                {content.genre_ids && content.genre_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {content.genre_ids.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="bg-white/10 text-white/80 border-white/20"
                      >
                        {genres[String(id)] || "Outro"}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Sinopse */}
                <p className="text-white/75 leading-relaxed text-sm">
                  {content.overview || "Sinopse não disponível."}
                </p>

                {/* Direção / Produção */}
                {details?.credits?.crew && (
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                      Direção / Produção
                    </p>
                    <div className="flex flex-col gap-1">
                      {details.credits.crew
                        .filter((m: any) =>
                          ["Director", "Producer", "Executive Producer"].includes(m.job)
                        )
                        .slice(0, 4)
                        .map((member: any) => (
                          <div key={`${member.id}-${member.job}`} className="flex items-center gap-2">
                            <span className="text-white text-sm font-semibold">{member.name}</span>
                            <span className="text-white/40 text-xs">
                              {member.job === "Director" ? "Diretor" : "Produtor"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Elenco */}
                {details?.credits?.cast?.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
                      Elenco
                    </p>
                    <ScrollArea>
                      <div className="flex gap-3 pb-2">
                        {details.credits.cast.slice(0, 10).map((actor: any) => (
                          <div key={actor.id} className="flex-shrink-0 w-16 text-center">
                            {actor.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                alt={actor.name}
                                className="w-16 h-24 object-cover rounded-md mb-1"
                              />
                            ) : (
                              <div className="w-16 h-24 rounded-md bg-white/10 flex items-center justify-center mb-1">
                                <Film className="w-5 h-5 text-white/30" />
                              </div>
                            )}
                            <p className="text-white text-xs font-semibold truncate">{actor.name}</p>
                            <p className="text-white/40 text-xs truncate">{actor.character}</p>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  SearchResults grid                                                  */
/* ------------------------------------------------------------------ */

interface SearchResultsProps {
  results: TMDBContent[];
  query: string;
  onSelect: (content: TMDBContent) => void;
}

function SearchResults({ results, query, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="px-4 md:px-12 py-20 text-center">
        <p className="text-white/50 text-lg">
          Nenhum resultado para &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-12 py-8">
      <p className="text-white/60 text-sm mb-6">
        {results.length} resultados para &quot;{query}&quot;
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
        {results.map((item) => (
          <ContentCard key={item.id} content={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

interface CatalogRow {
  title: string;
  items: TMDBContent[];
  wide?: boolean;
}

export default function StreamingHome() {
  const [hero, setHero] = useState<TMDBContent | null>(null);
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [genres, setGenres] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBContent[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedContent, setSelectedContent] = useState<TMDBContent | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);



  const [headerScrolled, setHeaderScrolled] = useState(false);

  // Scroll detection for header style
  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load catalog data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [
          trendingMovies,
          trendingShows,
          popularMovies,
          popularShows,
          topMovies,
          topShows,
          movieGenreList,
          showGenreList,
        ] = await Promise.all([
          getTrendingContent("movie"),
          getTrendingContent("tv"),
          getPopularContent("movie"),
          getPopularContent("tv"),
          getTopRatedContent("movie"),
          getTopRatedContent("tv"),
          getGenres("movie"),
          getGenres("tv"),
        ]);

        // Build genre map
        const genreMap: Record<string, string> = {};
        [...movieGenreList, ...showGenreList].forEach((g) => {
          genreMap[String(g.id)] = g.name;
        });
        setGenres(genreMap);

        // Hero = first trending movie with backdrop
        const heroItem = trendingMovies.find((m) => m.backdrop_path) ?? trendingMovies[0] ?? null;
        setHero(heroItem);

        setRows([
          { title: "Filmes em Alta", items: trendingMovies, wide: true },
          { title: "Séries em Alta", items: trendingShows, wide: true },
          { title: "Filmes Populares", items: popularMovies },
          { title: "Séries Populares", items: popularShows },
          { title: "Filmes Mais Bem Avaliados", items: topMovies },
          { title: "Séries Mais Bem Avaliadas", items: topShows },
        ]);
      } catch (err) {
        console.error("[v0] Erro ao carregar catálogo:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Dynamic search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchContent(searchQuery);
      setSearchResults(results);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectContent = useCallback(async (content: TMDBContent) => {
    setSelectedContent(content);
    setDetailLoading(true);
    const details = await getContentDetails(
      content.id,
      isMovie(content) ? "movie" : "tv"
    );
    setSelectedDetails(details);
    setDetailLoading(false);
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden">
      {/* ── Header ── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          headerScrolled
            ? "bg-[#141414]/95 backdrop-blur-md shadow-lg shadow-black/40"
            : "bg-gradient-to-b from-black/80 to-transparent"
        )}
      >
        <div className="flex items-center gap-8 px-4 md:px-12 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Film className="w-7 h-7 text-red-500" />
            <span className="text-xl font-black text-red-500 tracking-tight">
              FilmesTreino
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#" className="text-white font-semibold">Início</a>
            <a href="#" className="hover:text-white transition-colors">Filmes</a>
            <a href="#" className="hover:text-white transition-colors">Séries</a>
            <a href="#" className="hover:text-white transition-colors">Em Alta</a>
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-xs ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            <Input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 bg-black/60 border-white/20 text-white placeholder:text-white/40 focus:border-red-500 focus:ring-red-500/30 h-9 text-sm rounded-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                aria-label="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      {!isSearching && (
        <HeroBanner
          content={hero}
          loading={loading}
          onPlay={handleSelectContent}
          onInfo={handleSelectContent}
        />
      )}

      {/* ── Content ── */}
      <main className={cn("relative z-10", !isSearching && "-mt-20 md:-mt-28")}>
        {isSearching ? (
          <div className="pt-24">
            {searchLoading ? (
              <div className="px-4 md:px-12 py-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3">
                {Array.from({ length: 14 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-60 md:h-64 rounded-md bg-white/10" />
                ))}
              </div>
            ) : (
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onSelect={handleSelectContent}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-16">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <ContentRow
                    key={i}
                    title=""
                    items={[]}
                    onSelect={() => {}}
                    loading
                  />
                ))
              : rows.map((row) => (
                  <ContentRow
                    key={row.title}
                    title={row.title}
                    items={row.items}
                    onSelect={handleSelectContent}
                    wide={row.wide}
                  />
                ))}
          </div>
        )}
      </main>

      {/* ── Detail Modal ── */}
      <DetailModal
        content={selectedContent}
        details={selectedDetails}
        genres={genres}
        onClose={() => {
          setSelectedContent(null);
          setSelectedDetails(null);
        }}
      />
    </div>
  );
}
