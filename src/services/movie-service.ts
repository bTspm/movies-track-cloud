import axios from 'axios';
import { Movie, MovieRequest } from "../domain/Movie.type";
import { TmdbGenresResponse, TmdbProvidersResponse, TMDBSearchResponse } from "../domain/Tmdb.type";

const MOVIE_BATCH_SIZE = 20;

export type MovieServiceResponse = {
  processMoviesInBatches: (movieRequests: MovieRequest[]) => Promise<Movie[]>;
};

export const movieService = (): MovieServiceResponse => {
  const apiKey = process.env.TMDB_API_KEY ?? "";

  const processMoviesInBatches = async (movieRequests: MovieRequest[]): Promise<Movie[]> => {
    const genres = await _getGenres();

    const moviesList: Movie[] = []
    for (let i = 0; i < movieRequests.length; i += MOVIE_BATCH_SIZE) {
      const batch = movieRequests.slice(i, i + MOVIE_BATCH_SIZE);
      const promises = batch.map(movie => _enrichMovie(movie, moviesList, genres));
      await Promise.all(promises);
    }

    return moviesList
  }

  const _getGenres = async (): Promise<Record<number, string>> => {
    const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${ apiKey }`
    const response = await axios.get<TmdbGenresResponse>(url)
    const { genres } = response.data

    return genres.reduce((genreMapping, genre) => {
      genreMapping[genre.id] = genre.name;
      return genreMapping;
    }, {} as Record<number, string>);
  }

  const _enrichMovie = async (movieRequest: MovieRequest, enrichedMovies: Movie[], allGenres: Record<number, string>): Promise<void> => {
    const url = `https://api.themoviedb.org/3/find/${ movieRequest.code }?api_key=${ apiKey }&external_source=imdb_id`
    const { data } = await axios.get<TMDBSearchResponse>(url)
    const { movie_results: movieResults } = data

    if (!movieResults || movieResults.length === 0) {
      console.error("Unable to find movie", movieRequest)
      enrichedMovies.push(movieRequest)
      return;
    }

    const { id: tmdbId, overview, genre_ids, poster_path } = movieResults[0]
    const genres = genre_ids.map((id) => allGenres[id])
    const providers = await _getProviders(tmdbId);

    const description = (movieRequest.description && movieRequest.description.length > 0) ? movieRequest.description : overview
    const image = (movieRequest.image && movieRequest.image.length > 0) ? movieRequest.image : poster_path
    enrichedMovies.push({ ...movieRequest, description, genres, providers, image, tmdbId })
  };

  const _getProviders = async (tmdbMovieId: number): Promise<string[]> => {
    const url = `https://api.themoviedb.org/3/movie/${ tmdbMovieId }/watch/providers?api_key=${ apiKey }`
    const response = await axios.get<TmdbProvidersResponse>(url)

    const { results } = response.data
    const flatrate = results.US?.flatrate ?? []
    const cleanedProviders = flatrate.map((providerType) => providerType.provider_name)

    return [...new Set(cleanedProviders)];
  }

  return {
    processMoviesInBatches
  }
};
