import Papa from "papaparse";
import { z } from "zod";
import { CloudStorageService } from "../../../services/cloud-storage.service";
import type { AppendCloudCsvRequestSchema } from "./schema";

export class CloudCsvDestinationService {
  private cloudStorageService: CloudStorageService;

  constructor() {
    this.cloudStorageService = new CloudStorageService();
  }

  async appendCsv(
    params: z.infer<typeof AppendCloudCsvRequestSchema>,
  ): Promise<{ message: string }> {
    // Return simple message for now
    const { auth, csvPath, data: newData } = params;

    console.log(
      `[CloudCsvDestService] Appending ${newData.length} rows to CSV: ${csvPath}`,
    );

    let existingData: Record<string, any>[] = [];
    let fileExists = false;

    try {
      // 1. Check if file exists and read if it does
      fileExists = await this.cloudStorageService.objectExists(auth, csvPath);
      if (fileExists) {
        console.log(
          `[CloudCsvDestService] File exists. Reading existing content...`,
        );
        const fileBuffer = await this.cloudStorageService.getObject(
          auth,
          csvPath,
        );
        const csvString = fileBuffer.toString("utf-8");
        console.log(
          `[CloudCsvDestService] Existing content length: ${csvString.length}. Parsing...`,
        );

        // Parse existing data
        const parseResult = Papa.parse(csvString, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });

        if (parseResult.errors.length > 0) {
          console.error(
            "[CloudCsvDestService] Papaparse errors on existing file:",
            parseResult.errors,
          );
          throw new Error(
            `Failed to parse existing CSV: ${parseResult.errors[0].message} on row ${parseResult.errors[0].row}`,
          );
        }
        existingData = parseResult.data as Record<string, any>[];
        console.log(
          `[CloudCsvDestService] Existing file parsed into ${existingData.length} records.`,
        );
      } else {
        console.log(
          `[CloudCsvDestService] File does not exist. Will create new file.`,
        );
      }

      // 2. Combine existing data (if any) with new data
      const combinedData = [...existingData, ...newData];
      console.log(
        `[CloudCsvDestService] Combined data has ${combinedData.length} records.`,
      );

      if (combinedData.length === 0) {
        console.warn(
          "[CloudCsvDestService] No data to write (neither existing nor new). Aborting write.",
        );
        return { message: "No data provided or found; file not written." };
      }

      // 3. Unparse (stringify) the combined data back to CSV format
      // Important: Ensure consistent headers. Papaparse uses headers from the first object by default.
      // If columns might differ between existing/new, header handling needs more care.
      const outputCsvString = Papa.unparse(combinedData, {
        header: true, // Always include headers
        // Add other options from params.writeOptions if implemented
      });
      console.log(
        `[CloudCsvDestService] Data unparsed to CSV string (length: ${outputCsvString.length}). Writing...`,
      );

      // 4. Write the new CSV content (overwrites existing or creates new)
      const outputBuffer = Buffer.from(outputCsvString, "utf-8");
      await this.cloudStorageService.putObject(
        auth,
        csvPath,
        outputBuffer,
        "text/csv",
      );

      console.log(
        `[CloudCsvDestService] Successfully wrote ${combinedData.length} records to ${csvPath}`,
      );
      return {
        message: `Successfully appended ${newData.length} records (${combinedData.length} total) to ${csvPath}`,
      };
    } catch (error: any) {
      console.error(
        `[CloudCsvDestService] Error appending to CSV ${csvPath}:`,
        error,
      );
      throw new Error(
        `Failed to append data to CSV at ${csvPath}: ${error.message}`,
      );
    }
  }
}

// Export singleton instance
export const cloudCsvDestinationService = new CloudCsvDestinationService();
