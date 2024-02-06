import { APIGatewayProxyResult } from 'aws-lambda';
import { dbService } from "../services";

export const handler = async (_event, _context): Promise<APIGatewayProxyResult> => {
  console.log("Started search")
  const movies = await dbService().getMovies()

  return {
    body: JSON.stringify(movies),
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
      "Content-Type": "application/json"
    }
  }
};
