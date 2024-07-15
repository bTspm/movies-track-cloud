import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Filter } from "../domain/Filter.type";
import { searchMoviesService } from "../services/search-movies-service";

export const handler = async (event: APIGatewayEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters as unknown as Filter
  const movies = await searchMoviesService().search(queryParams)

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
