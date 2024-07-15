import { ConditionsOrFilters } from "dynamodb-toolbox/dist/cjs/classes/Entity/types";
import { MovieEntity } from "../db/MovieEntity";
import { Filter } from "../domain/Filter.type";
import { Movie } from "../domain/Movie.type";

export type SearchMoviesServiceResponse = {
  search: (query: Record<string, unknown>) => Promise<Movie[]>;
};

export const searchMoviesService = (): SearchMoviesServiceResponse => {
  const _transformToFilter = (query: Record<string, unknown>): Filter => {
    return {
      searchText: query.searchText?.toString() ?? "",
      yearRange: ((query.yearRange?.toString() ?? "")).split(',').map(Number) as [number, number],
      rating: parseFloat(query.rating?.toString() ?? ""),
      votes: parseInt(query.votes?.toString() ?? "", 10),
      genres: (query.genres?.toString() ?? "").split(',').filter(Boolean),
      providers: (query.providers?.toString() ?? "").split(',').filter(Boolean)
    }
  };

  const _queryMovies = async (filters: ConditionsOrFilters): Promise<Movie[]> => {
    const results: Movie[] = [];
    let lastKey: Record<string, any> | undefined;

    do {
      // @ts-ignore
      const result = await MovieEntity.query<Movie>("MOVIE", {filters});
      results.push(...result.Items);
      lastKey = result.ExclusiveStartKey;
    } while (lastKey);

    return results;
  };

  const search = async (query: Record<string, unknown>): Promise<Movie[]> => {
    const {searchText, yearRange, rating, votes, genres, providers} = _transformToFilter(query);

    const filters: ConditionsOrFilters = [];

    searchText.length > 0 && filters.push({attr: "title", contains: searchText});

    if (yearRange) {
      filters.push({attr: "year", between: yearRange});
    }

    if (rating) {
      filters.push({attr: "rating", gte: rating});
    }

    if (votes) {
      filters.push({attr: "votes", gte: votes});
    }

    if (genres.length > 0) {
      filters.push(genres.map((genre, index) => ({
        ...(index > 0 && {or: true}),
        attr: "genres",
        contains: genre
      })));
    }

    if (providers.length > 0) {
      filters.push(providers.map((provider, index) => ({
        ...(index > 0 && {or: true}),
        attr: "providers",
        contains: provider
      })));
    }

    return _queryMovies(filters)
  }

  return {
    search
  };
};
