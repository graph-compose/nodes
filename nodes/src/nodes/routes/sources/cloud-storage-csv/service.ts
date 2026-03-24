import Papa from "papaparse";
import { z } from "zod";
import { CloudStorageService } from "../../../services/cloud-storage.service";
import type { ReadCloudCsvRequestSchema, ReadResultData } from "./schema";

// Helper to convert header to snake_case (if needed, or use existing)
const toSnakeCase = (str: string): string => {
  return str
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`) // Add underscore before capitals
    .replace(/^_/, "") // Remove leading underscore if any
    .toLowerCase();
};

export class CloudCsvSourceService {
  private cloudStorageService: CloudStorageService;

  constructor() {
    // Use a singleton or instantiate new?
    // For now, instantiate; consider singleton if state/caching needed later.
    this.cloudStorageService = new CloudStorageService();
  }

  async readCsv(
    params: z.infer<typeof ReadCloudCsvRequestSchema>,
  ): Promise<ReadResultData> {
    const { auth, csvPath } = params;

    console.log(`[CloudCsvSourceService] Reading CSV from path: ${csvPath}`);

    try {
      // 1. Get the CSV content as a Buffer
      const fileBuffer = await this.cloudStorageService.getObject(
        auth,
        csvPath,
      );
      const csvString = fileBuffer.toString("utf-8");
      console.log(
        `[CloudCsvSourceService] CSV content retrieved (${csvString.length} chars). Parsing...`,
      );

      // 2. Parse the CSV string using papaparse
      const parsedData: Record<string, any>[] = await new Promise(
        (resolve, reject) => {
          Papa.parse(csvString, {
            header: true, // Use first row as headers for object keys
            skipEmptyLines: true,
            dynamicTyping: true, // Attempt to convert numbers/booleans
            // Add other options from params.parseOptions if implemented
            complete: (results) => {
              if (results.errors.length > 0) {
                console.error(
                  "[CloudCsvSourceService] Papaparse errors:",
                  results.errors,
                );
                // Report first error
                reject(
                  new Error(
                    `CSV parsing error: ${results.errors[0].message} on row ${results.errors[0].row}`,
                  ),
                );
              } else {
                console.log(
                  `[CloudCsvSourceService] CSV parsed successfully into ${results.data.length} records.`,
                );
                // Ensure data is in the expected format Array<Record<string, any>>
                resolve(results.data as Record<string, any>[]);
              }
            },
            error: (error: Error) => {
              console.error(
                "[CloudCsvSourceService] Papaparse critical error:",
                error,
              );
              reject(new Error(`CSV parsing failed: ${error.message}`));
            },
          });
        },
      );

      console.log(
        `[CloudCsvSourceService] CSV parsed successfully into ${parsedData.length} records. Transforming...`,
      );

      // Transform parsed data into the required { id, name, value } format
      const items: ReadResultData["items"] = [];
      parsedData.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([header, value]) => {
          items.push({
            id: `row${rowIndex + 1}`, // Consistent row ID
            name: toSnakeCase(header), // Use snake_case for header name
            value: value ?? null, // Ensure null for empty values
          });
        });
      });

      const result: ReadResultData = {
        items,
        metadata: {
          total: items.length, // Total number of cells processed
        },
      };

      console.log(
        `[CloudCsvSourceService] Transformation complete. Total items: ${result.metadata.total}`,
      );
      return result;
    } catch (error: any) {
      console.error(
        `[CloudCsvSourceService] Error reading CSV from ${csvPath}:`,
        error,
      );
      // Rethrow with a more specific message if possible
      if (error.message.includes("Object not found")) {
        throw new Error(`Source CSV not found at path: ${csvPath}`);
      }
      throw new Error(
        `Failed to read or parse CSV from ${csvPath}: ${error.message}`,
      );
    }
  }
}

// Export singleton instance
export const cloudCsvSourceService = new CloudCsvSourceService();
