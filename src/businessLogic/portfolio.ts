import { APIGatewayProxyEvent } from "aws-lambda";
import { PortfolioAccess } from "../dataLayer/portfolioAccess";
import { capitalizeWord } from "../utils/StringUtils";
import { getUserId } from "../lambda/utils";

const videographerAccess = new PortfolioAccess()


export async function getPortfolio(event: APIGatewayProxyEvent): Promise<any> {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    console.log('videographerId', videographerId);

    if (videographerId === "your-portfolio") {
        const videographerId = getUserId(event);

        return await videographerAccess.getPortfolio(videographerId);
    }

    if (videographerId.indexOf("-") >= 0) {
        let first = videographerId.split("-")[0];
        let last = videographerId.split("-")[1];

        first = capitalizeWord(first);
        last = capitalizeWord(last);

        return await videographerAccess.getPortfolioByName(first, last);
    }

    return await videographerAccess.getPortfolio(videographerId);
}
