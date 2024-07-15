type BaseMovie = {
  code: string;
  title: string;
  rating: number;
  votes: number;
  year: number;
}

export type Movie = BaseMovie & {
  code: string;
  rating: number;
  title: string;
  votes: number;
  year: number;
  description?: string;
  genres?: string[];
  image?: string;
  providers?: string[];
  tmdbId?: number
};

export type MovieRequest = BaseMovie & {
  description: string;
  image: string
};
