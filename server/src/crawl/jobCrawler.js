//Import the necessary modules
import dotenv from "dotenv";
import FirecrawlApp from "@mendable/firecrawl-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

//Set up __filename and __dirname because they are not automatically available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Load environment variables from jobCrawler.env
dotenv.config({
    path: path.join(__dirname, "../../../jobCrawler.env")
});

//Trouble Shooting: Check if the key is loaded correctly
console.log("Key loaded:", !!process.env.FIRECRAWL_API_KEY);

//Initialize the FirecrawlApp with the API key and debug mode enabled
const app = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
    debug: true
});

//Define the schema for the job posting data
const jobSchema = {
    type: "object",
    properties: {
        jobTitle: { type: "string" },
        location: { type: "string" },
        employmentType: {
            type: "string",
            description: "e.g. Full-time, Part-time, Contract"
        },
        workArrangement: {
            type: "string",
            description: "Remote, In-person, or Hybrid"
        },
        salary: {
            type: "string",
            description: "Salary or salary range if mentioned, otherwise null"
        },
        skillsRequired: {
            type: "array",
            items: { type: "string" },
            description: "List of required or preferred skills, qualifications, and technologies"
        },
        responsibilities: {
            type: "array",
            items: { type: "string" }
        },
        howToApply: { type: "string" }
    },
    required: ["jobTitle", "skillsRequired"]
};

//Main function to scrape the job posting and save the result
async function main() {
    const urls = [
        "https://drive.co.za/join-the-team/junior-software-developer",
        "https://job-boards.greenhouse.io/takealotgroup/jobs/7573640",
        "https://job-boards.greenhouse.io/takealotgroup/jobs/5865553",
        "https://job-boards.greenhouse.io/takealotgroup/jobs/8161166",
        "https://jobs.lever.co/theodo/31633ba7-be82-4389-9eec-f045bf258bf8",
        "https://jobs.lever.co/theodo/9680b822-7982-49b0-aecc-2aa3ac39275a",
        "https://jobs.lever.co/jobgether/6987d697-6e8f-4881-a60a-90eb69f36afd",
        "https://jobs.ashbyhq.com/the-global-talent-co/73bfc1ef-4dc8-4027-b8c2-a6a70d20737e",
        "https://jobs.ashbyhq.com/the-global-talent-co/78368c47-16b0-4aee-bb68-3200d6681a1e",
        "https://apply.workable.com/translution-software/j/65FFD8B62F/"
    ];

    const payload = [];

//Iterate over each URL, scrape the job posting data, and push it to the payload array
for (const url of urls) {
    try {
        const result = await app.scrape(url, {
            formats: ["markdown", { type: "json", schema: jobSchema }]
        });

        const structured = result.json ?? {};

        payload.push({
            scrapedAt: new Date().toISOString(),
            sourceUrl: url,
            pageTitle: result.metadata?.title ?? null,
            ...structured,
            rawMarkdown: result.markdown
        });

    } catch (error) {
        console.log("Failed to scrape:", url);
        console.log("Reason:", error.message);
    }
}

//Define the location where the scraped job data will be saved
const outputPath = path.join(__dirname, "../../../public/data/jobs.json");

    //Save the scraped job data to jobs.json
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");

    console.log("Saved scrape result to", outputPath);
}

//Execute the main function
main();