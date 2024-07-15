import { Entity } from "dynamodb-toolbox";
import { Table } from "./Table";

export const MovieEntity = new Entity({
  name: "Movie",

  attributes: {
    pk: { partitionKey: true, default: "MOVIE" },
    code: { sortKey: true, type: "string" },
    year: { type: "number", required: true },
    description: { type: 'string', required: false },
    genres: { type: 'list', required: false },
    image: { type: 'string', required: false },
    title: { type: 'string' },
    providers: { type: 'list', required: false },
    tmdbId: { type: 'number', required: false },
    rating: { type: "number" },
    votes: { type: "number" },
  },

  table: Table
} as const);
