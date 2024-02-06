import { MovieEntity } from "../db/MovieEntity";
import { Table } from "../db/Table";
import { Movie } from "../models/Movie.type";

const MAX_DYNAMODB_UPDATE_ITEMS = 25;

export type DbServiceResponse = {
  getMovies: () => Promise<Movie[]>;
  saveMovies: (movies: Movie[]) => Promise<void>;
};

export const dbService = (): DbServiceResponse => {
  const getMovies = async (): Promise<Movie[]> => {
    const { Items } = await MovieEntity.scan<Movie>();

    return Items ?? []
  }

  const saveMovies = async (movies: Movie[]): Promise<void> => {
    console.log(`Saving total movies: ${ movies.length }`);
    const batches = _chunkArray<Movie>(movies);

    for (let i = 0; i < batches.length; i++) {
      // Wait 1sec for every batch
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`Processing batch number: ${ i + 1 }`);
      await _bulkUpdateWithRetry(batches[i]);
    }
  }

  const _chunkArray = <T>(array: T[]): T[][] => {
    const chunks = [];
    for (let i = 0; i < array.length; i += MAX_DYNAMODB_UPDATE_ITEMS) {
      chunks.push(array.slice(i, i + MAX_DYNAMODB_UPDATE_ITEMS));
    }
    return chunks;
  };

  const _bulkUpdateWithRetry = async (movies: Movie[]) => {
    let unprocessedItems = movies;

    while (unprocessedItems.length > 0) {
      try {
        const putRequests = unprocessedItems.map((movie) => MovieEntity.putBatch(movie))
        const result = await Table.batchWrite(putRequests);
        console.log('Bulk update:', JSON.stringify(result));

        unprocessedItems = _extractUnprocessedItems(result)
      } catch (error) {
        console.error('Error performing bulk update:', error);
      }
    }
  }

  const _extractUnprocessedItems = (response: { UnprocessedItems: Record<string, { PutRequest: { Item: Movie } }[]> }): Movie[] => {
    const unprocessedItems: Movie[] = [];

    const responseUnprocessedItems = response.UnprocessedItems[process.env.TABLE_NAME ?? ""]
    if (responseUnprocessedItems === null || responseUnprocessedItems === undefined) {
      return []
    }

    for (const unprocessedItem of responseUnprocessedItems) {
      if (unprocessedItem.PutRequest && unprocessedItem.PutRequest.Item) {
        unprocessedItems.push(unprocessedItem.PutRequest.Item);
      }
    }

    return unprocessedItems;
  };

  return {
    getMovies,
    saveMovies
  }
}
