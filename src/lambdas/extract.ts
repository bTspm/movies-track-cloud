import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { dbService, movieService } from "../services";

export const handler = async (event: S3Event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const s3 = new S3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  try {
    const response = await s3.send(command);
    const fileContent = await response.Body?.transformToString();

    if (!fileContent) {
      console.error("No movies for file", key);
      return;
    }

    const movies = JSON.parse(fileContent);
    const enrichedMovies = await movieService().processMoviesInBatches(movies);
    await dbService().saveMovies(enrichedMovies);
  } catch (error: unknown) {
    console.error((error as Error).message);
  }
};
