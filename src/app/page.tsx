"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Play, Star, Clock, Calendar, Film, Tv, X, Info } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { parseTitles, parseCredits, type Title, type Credit } from "@/lib/data";

const GENRE_COLORS: Record<string, string> = {
  drama: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  action: "bg-red-500/20 text-red-300 border-red-500/30",
  comedy: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  thriller: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  horror: "bg-green-500/20 text-green-300 border-green-500/30",
  romance: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  scifi: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  fantasy: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  crime: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  war: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  documentation: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  animation: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  family: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  music: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  western: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  history: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  european: "bg-sky-500/20 text-sky-300 border-sky-500/30",
};

function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre.toLowerCase()] || "bg-muted text-muted-foreground border-border";
}

export default function StreamingHomePage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | "MOVIE" | "SHOW">("ALL");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [titlesRes, creditsRes] = await Promise.all([
          fetch("/data/titles.csv"),
          fetch("/data/credits.csv"),
        ]);

        const titlesText = await titlesRes.text();
        const creditsText = await creditsRes.text();

        setTitles(parseTitles(titlesText));
        setCredits(parseCredits(creditsText));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    titles.forEach((t) => t.genres.forEach((g) => genres.add(g)));
    return Array.from(genres).sort();
  }, [titles]);

  const filteredTitles = useMemo(() => {
    return titles.filter((title) => {
      const matchesSearch =
        !searchQuery ||
        title.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        title.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === "ALL" || title.type === selectedType;

      const matchesGenre =
        !selectedGenre || title.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());

      return matchesSearch && matchesType && matchesGenre;
    });
  }, [titles, searchQuery, selectedType, selectedGenre]);

  const featuredTitle = useMemo(() => {
    const topRated = filteredTitles
      .filter((t) => t.imdb_score && t.imdb_score > 7)
      .sort((a, b) => (b.imdb_score || 0) - (a.imdb_score || 0));
    return topRated[0] || filteredTitles[0];
  }, [filteredTitles]);

  const titlesByGenre = useMemo(() => {
    const byGenre: Record<string, Title[]> = {};
    const genres = ["drama", "action", "comedy", "thriller", "crime", "scifi", "horror", "documentation"];

    genres.forEach((genre) => {
      byGenre[genre] = filteredTitles
        .filter((t) => t.genres.some((g) => g.toLowerCase() === genre))
        .sort((a, b) => (b.imdb_score || 0) - (a.imdb_score || 0))
        .slice(0, 20);
    });

    return byGenre;
  }, [filteredTitles]);

  const topRated = useMemo(() => {
    return filteredTitles
      .filter((t) => t.imdb_score)
      .sort((a, b) => (b.imdb_score || 0) - (a.imdb_score || 0))
      .slice(0, 20);
  }, [filteredTitles]);

  const recentlyAdded = useMemo(() => {
    return filteredTitles
      .filter((t) => t.release_year >= 2000)
      .sort((a, b) => b.release_year - a.release_year)
      .slice(0, 20);
  }, [filteredTitles]);

  const getTitleCredits = useCallback(
    (titleId: string) => {
      return credits.filter((c) => c.id === titleId);
    },
    [credits]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setSelectedGenre(null);
  };

  const hasActiveFilters = searchQuery || selectedType !== "ALL" || selectedGenre;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent">
        <div className="flex items-center justify-between px-4 py-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary md:text-3xl">StreamFlix</h1>
            <nav className="hidden items-center gap-6 md:flex">
              <button
                onClick={() => setSelectedType("ALL")}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  selectedType === "ALL" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => setSelectedType("MOVIE")}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  selectedType === "MOVIE" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Filmes
              </button>
              <button
                onClick={() => setSelectedType("SHOW")}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  selectedType === "SHOW" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Series
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`relative transition-all duration-300 ${
                isSearchFocused ? "w-64 md:w-80" : "w-40 md:w-64"
              }`}
            >
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="border-border bg-secondary/50 pl-9 text-sm backdrop-blur-sm placeholder:text-muted-foreground focus:bg-secondary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="px-4 pb-4 md:px-8 lg:px-12">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="shrink-0 border-primary/50 text-primary hover:bg-primary/10"
                >
                  Limpar filtros
                </Button>
              )}
              {allGenres.slice(0, 12).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                    selectedGenre === genre
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32">
        {/* Hero Section */}
        {featuredTitle && !searchQuery && (
          <HeroSection
            title={featuredTitle}
            credits={getTitleCredits(featuredTitle.id)}
            onSelect={() => setSelectedTitle(featuredTitle)}
          />
        )}

        {/* Search Results */}
        {searchQuery && (
          <section className="px-4 py-8 md:px-8 lg:px-12">
            <h2 className="mb-4 text-lg font-semibold md:text-xl">
              Resultados para &quot;{searchQuery}&quot;{" "}
              <span className="text-muted-foreground">({filteredTitles.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredTitles.slice(0, 30).map((title) => (
                <TitleCard key={title.id} title={title} onClick={() => setSelectedTitle(title)} />
              ))}
            </div>
          </section>
        )}

        {/* Content Rows */}
        {!searchQuery && (
          <div className="space-y-8 pb-12">
            <ContentRow
              title="Mais Bem Avaliados"
              titles={topRated}
              onSelect={setSelectedTitle}
            />
            <ContentRow
              title="Adicionados Recentemente"
              titles={recentlyAdded}
              onSelect={setSelectedTitle}
            />
            {Object.entries(titlesByGenre).map(
              ([genre, genreTitles]) =>
                genreTitles.length > 0 && (
                  <ContentRow
                    key={genre}
                    title={genre.charAt(0).toUpperCase() + genre.slice(1)}
                    titles={genreTitles}
                    onSelect={setSelectedTitle}
                  />
                )
            )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <TitleDetailModal
        title={selectedTitle}
        credits={selectedTitle ? getTitleCredits(selectedTitle.id) : []}
        onClose={() => setSelectedTitle(null)}
      />
    </div>
  );
}

function HeroSection({
  title,
  credits,
  onSelect,
}: {
  title: Title;
  credits: Credit[];
  onSelect: () => void;
}) {
  const directors = credits.filter((c) => c.role === "DIRECTOR").slice(0, 2);
  const actors = credits.filter((c) => c.role === "ACTOR").slice(0, 3);

  return (
    <section className="relative h-[70vh] min-h-[500px] w-full">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            {title.type === "MOVIE" ? (
              <Film className="size-5 text-primary" />
            ) : (
              <Tv className="size-5 text-primary" />
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {title.type === "MOVIE" ? "Filme" : "Serie"}
            </span>
            {title.age_certification && (
              <Badge variant="outline" className="border-border text-xs">
                {title.age_certification}
              </Badge>
            )}
          </div>

          <h2 className="text-balance text-3xl font-bold md:text-5xl lg:text-6xl">{title.title}</h2>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {title.imdb_score && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="size-4 fill-current" />
                {title.imdb_score.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {title.release_year}
            </span>
            {title.runtime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {title.runtime} min
              </span>
            )}
            {title.seasons && <span>{title.seasons} temporadas</span>}
          </div>

          <p className="line-clamp-3 text-pretty text-sm text-muted-foreground md:text-base">
            {title.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {title.genres.slice(0, 4).map((genre) => (
              <Badge key={genre} variant="outline" className={`border ${getGenreColor(genre)}`}>
                {genre}
              </Badge>
            ))}
          </div>

          {(directors.length > 0 || actors.length > 0) && (
            <div className="space-y-1 text-sm">
              {directors.length > 0 && (
                <p className="text-muted-foreground">
                  <span className="text-foreground">Diretor:</span>{" "}
                  {directors.map((d) => d.name).join(", ")}
                </p>
              )}
              {actors.length > 0 && (
                <p className="text-muted-foreground">
                  <span className="text-foreground">Elenco:</span>{" "}
                  {actors.map((a) => a.name).join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="size-5 fill-current" />
              Assistir
            </Button>
            <Button variant="outline" className="gap-2" onClick={onSelect}>
              <Info className="size-5" />
              Mais Informacoes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentRow({
  title,
  titles,
  onSelect,
}: {
  title: string;
  titles: Title[];
  onSelect: (title: Title) => void;
}) {
  if (titles.length === 0) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12">
      <h2 className="mb-3 text-lg font-semibold md:text-xl">{title}</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {titles.map((t) => (
            <TitleCard key={t.id} title={t} onClick={() => onSelect(t)} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

function TitleCard({ title, onClick }: { title: Title; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="group relative w-36 shrink-0 overflow-hidden rounded-md bg-card transition-all duration-300 hover:z-10 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary md:w-44"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[2/3] w-full bg-gradient-to-br from-secondary to-muted">
        <div className="flex h-full flex-col items-center justify-center p-3 text-center">
          {title.type === "MOVIE" ? (
            <Film className="mb-2 size-8 text-muted-foreground" />
          ) : (
            <Tv className="mb-2 size-8 text-muted-foreground" />
          )}
          <span className="line-clamp-3 text-sm font-medium text-foreground">{title.title}</span>
          <span className="mt-1 text-xs text-muted-foreground">{title.release_year}</span>
        </div>
      </div>

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/90 to-transparent p-3 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="space-y-1">
          {title.imdb_score && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <Star className="size-3 fill-current" />
              {title.imdb_score.toFixed(1)}
            </span>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold">{title.title}</h3>
          <div className="flex flex-wrap gap-1">
            {title.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="text-xs capitalize text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function TitleDetailModal({
  title,
  credits,
  onClose,
}: {
  title: Title | null;
  credits: Credit[];
  onClose: () => void;
}) {
  if (!title) return null;

  const directors = credits.filter((c) => c.role === "DIRECTOR");
  const actors = credits.filter((c) => c.role === "ACTOR").slice(0, 10);

  return (
    <Dialog open={!!title} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {title.type === "MOVIE" ? (
              <Film className="size-5 text-primary" />
            ) : (
              <Tv className="size-5 text-primary" />
            )}
            <span className="text-sm text-muted-foreground">
              {title.type === "MOVIE" ? "Filme" : "Serie"}
            </span>
          </div>
          <DialogTitle className="text-2xl">{title.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes sobre {title.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {title.imdb_score && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="size-4 fill-current" />
                {title.imdb_score.toFixed(1)} IMDb
                {title.imdb_votes && (
                  <span className="text-muted-foreground">
                    ({(title.imdb_votes / 1000).toFixed(0)}K votos)
                  </span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="size-4" />
              {title.release_year}
            </span>
            {title.runtime > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-4" />
                {title.runtime} min
              </span>
            )}
            {title.seasons && (
              <span className="text-muted-foreground">{title.seasons} temporadas</span>
            )}
            {title.age_certification && (
              <Badge variant="outline" className="border-border">
                {title.age_certification}
              </Badge>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {title.genres.map((genre) => (
              <Badge key={genre} variant="outline" className={`border ${getGenreColor(genre)}`}>
                {genre}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <p className="text-pretty text-muted-foreground">{title.description}</p>

          {/* Credits */}
          {directors.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Diretores</h4>
              <div className="flex flex-wrap gap-2">
                {directors.map((d, i) => (
                  <Badge key={`${d.person_id}-${i}`} variant="secondary">
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {actors.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Elenco Principal</h4>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {actors.map((a, i) => (
                  <div key={`${a.person_id}-${i}`} className="rounded-md bg-secondary/50 p-2">
                    <p className="text-sm font-medium">{a.name}</p>
                    {a.character && (
                      <p className="text-xs text-muted-foreground">{a.character}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Countries */}
          {title.production_countries.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground">Paises de producao: </span>
              {title.production_countries.join(", ")}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="size-5 fill-current" />
              Assistir Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background">
        <div className="flex items-center justify-between px-4 py-4 md:px-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
      </header>

      <main className="pt-24">
        {/* Hero skeleton */}
        <div className="h-[70vh] min-h-[500px] w-full bg-gradient-to-t from-background to-muted/20">
          <div className="absolute bottom-0 left-0 p-8">
            <Skeleton className="mb-4 h-12 w-96" />
            <Skeleton className="mb-2 h-4 w-64" />
            <Skeleton className="mb-4 h-20 w-[500px]" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>

        {/* Content rows skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-8 md:px-8">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <Skeleton key={j} className="h-64 w-44 shrink-0 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
