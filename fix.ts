import fs from "fs";
import readline from "readline";

interface Speaker {
  name?: string | null;
  role?: string | null;
  company?: string | null;
  linkedIn?: string | null;
  twitter?: string | null;
}

async function convertCsvToArrayOfObjects(
  filePath: string
): Promise<Speaker[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const array = [];
  let headers;

  for await (const line of rl) {
    if (!headers) {
      // Split the first line to get headers
      headers = line.split(",");
    } else {
      const data = line.split(",");
      const obj = headers.reduce((accumulator, currentValue, index) => {
        // @ts-ignore
        accumulator[currentValue] = data[index];
        return accumulator;
      }, {});
      array.push(obj);
    }
  }

  return array;
}

// Replace 'path/to/your/data.csv' with the path to your CSV file
convertCsvToArrayOfObjects("./pbw-2024-speakers.csv")
  .then((speakers) => {
    const correctedSpeakers = speakers.map((speaker) => {
      const speakerCopy = { ...speaker };
      const prevTwitterValue = speaker.twitter;
      const prevLinkedInValue = speaker.linkedIn;

      const correctTwitterValue = prevTwitterValue?.includes("twitter.com")
        ? prevTwitterValue
        : prevLinkedInValue?.includes("twitter.com")
        ? prevLinkedInValue
        : null;
      const correctLinkedInValue = prevLinkedInValue?.includes("linkedin.com")
        ? prevLinkedInValue
        : prevTwitterValue?.includes("linkedin.com")
        ? prevTwitterValue
        : null;

      speakerCopy.twitter = correctTwitterValue;
      speakerCopy.linkedIn = correctLinkedInValue;

      return speakerCopy;
    });

    function convertArrayToCSV(arrayOfObjects: Speaker[]) {
      if (arrayOfObjects.length === 0) return "";

      // Get all keys from the first object, assuming all objects have the same structure
      const headers = Object.keys(arrayOfObjects[0]);

      // Map each object to a CSV row
      const rows = arrayOfObjects.map((obj) => {
        // Map each key to its value, escaping quotes and handling undefined/null
        return headers
          .map((header) => {
            // @ts-ignore
            const escaped = ("" + (obj[header] || "")).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",");
      });

      // Combine headers and rows, with each row on a new line
      return [headers.join(","), ...rows].join("\n");
    }

    const csvString = convertArrayToCSV(correctedSpeakers);

    fs.writeFileSync("pbw-2024-speakers.csv", csvString);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
