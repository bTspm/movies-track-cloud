export type TMDBSearchResponse = {
  movie_results: TMDBSearchMovie[];
}

export type TMDBSearchMovie = {
  id: number;
  overview: string;
  genre_ids: number[];
  poster_path: string;
}

export type TmdbGenre = {
  id: number;
  name: string;
}

export type TmdbGenresResponse = {
  genres: TmdbGenre[]
}

export type TmdbProviderResults = {
  US: {
    link: string;
    flatrate: TmdbProviderType[]
  }
}

export type TmdbProviderType = {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export type TmdbProvidersResponse = {
  id: number;
  results: TmdbProviderResults;
}
