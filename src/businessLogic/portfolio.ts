import { APIGatewayProxyEvent } from "aws-lambda";
import { PortfolioAccess } from "../dataLayer/portfolioAccess";

const videographerAccess = new PortfolioAccess()


export async function getPortfolio(event: APIGatewayProxyEvent): Promise<any> {
    const videographerId = decodeURI(event.pathParameters.videographerId);

    return await videographerAccess.getPortfolio(videographerId);
}
