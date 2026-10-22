
//Load the hackathons from hackathons.json
export async function getHackathons() {
    const response = await fetch("/data/hackathons.json");

    if (!response.ok) {
        throw new Error("Failed to load hackathons.json");
    }

    const data = await response.json();

    return sortUpcoming(mapHackathons(data));
}

//Map the raw hackathons into the shape the page uses
function mapHackathons(data) {
    return data
        .filter((hackathon) => hackathon.title)
        .map((hackathon, index) => ({
            id: `${index}-${hackathon.title}`,
            title: hackathon.title,
            organizer: hackathon.organizer || "Unknown Organizer",
            description: hackathon.description || "No description available",
            location: hackathon.location || "Location not specified",
            format: normalizeFormat(hackathon.format),
            startDate: hackathon.startDate || "Not specified",
            endDate: hackathon.endDate || "Not specified",
            registrationDeadline:
                hackathon.registrationDeadline || "Not specified",
            eligibility: hackathon.eligibility || "Check event details",
            themes: hackathon.themes || [],
            prizes: hackathon.prizes || "Not specified",
            teamRequirements: hackathon.teamRequirements || "Not specified",
            registrationUrl:
                hackathon.registrationUrl || hackathon.sourceUrl || "",
            sourceUrl: hackathon.sourceUrl || "",
        }));
}

//Hide events that have already ended, then sort by start date, soonest first.
//Events without real dates (e.g. "TBA" or "Not specified") are kept and go last.
function sortUpcoming(hackathons) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dated = [];
    const undated = [];

    for (const hackathon of hackathons) {
        const start = parseDate(hackathon.startDate);
        const end = parseDate(hackathon.endDate);

        if (end && end < today) continue;

        if (start && end) {
            dated.push({ hackathon, start });
        } else {
            undated.push(hackathon);
        }
    }

    dated.sort((a, b) => a.start - b.start);

    return [...dated.map((item) => item.hackathon), ...undated];
}

//Return a Date for a real date string, or null for values like "TBA"
function parseDate(value) {
    if (typeof value !== "string" || !value.trim()) return null;

    //Read plain YYYY-MM-DD dates as local days, not UTC midnight
    const day = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));

    const time = Date.parse(value);
    return Number.isNaN(time) ? null : new Date(time);
}

//Normalize the event format
function normalizeFormat(format) {
    if (!format) return "Not specified";

    const value = format.toLowerCase();

    if (value.includes("online") || value.includes("virtual")) {
        return "Online";
    }

    if (value.includes("hybrid")) {
        return "Hybrid";
    }

    if (
        value.includes("in-person") ||
        value.includes("in person") ||
        value.includes("onsite") ||
        value.includes("on-site")
    ) {
        return "In-person";
    }

    return format;
}