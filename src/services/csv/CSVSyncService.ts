/**
 * CSV Sync Service
 * Orchestrates pulling and pushing CSV data to/from WordPress
 * Implements hybrid matching strategy: metadata-based (primary) + filename-based (fallback)
 */

import { WordPressMediaService } from '../wordpress/WordPressMediaService';
import { parseCSVFilename } from './filenameParser';
import { parseCSV, generateNextRaceCSV, generateSeasonRolloverCSV } from '../../raceLogic';
import type { Race, Runner } from '../../types';
import type {
  ServiceResponse,
  PullCSVResponse,
  CSVMetadata,
  MediaItem,
} from '../wordpress/types';

export class CSVSyncService {
  private mediaService: WordPressMediaService;

  constructor() {
    this.mediaService = new WordPressMediaService();
  }

  /**
   * Pull CSV from WordPress using hybrid matching strategy
   * 1. If testing mode: return most recent CSV
   * 2. Try metadata matching (race_month + race_year)
   * 3. Try filename parsing (fallback for manually-uploaded CSVs)
   * 4. If no exact match, backward search up to 12 months
   */
  async pullCSVFromWordPress(
    targetMonth: number,
    targetYear: number,
    testingMode: boolean = false
  ): Promise<ServiceResponse<PullCSVResponse>> {
    try {
      // Testing mode: return most recent CSV regardless of date
      if (testingMode) {
        const recent = await this.mediaService.getMostRecentCSV();
        if (!recent.success) {
          return recent;
        }

        if (!recent.data) {
          return {
            success: false,
            error: 'No CSVs found in WordPress',
          };
        }

        return await this.downloadAndParseCSV(recent.data);
      }

      // Try metadata matching first
      let matchedMedia = await this.mediaService.queryCSVsByMetadata(
        targetMonth,
        targetYear
      );

      if (matchedMedia.success && matchedMedia.data) {
        return await this.downloadAndParseCSV(matchedMedia.data);
      }

      // Try filename parsing (fallback)
      const csvList = await this.mediaService.listAllCSVs();
      if (csvList.success && csvList.data) {
        const mediaByFilename = this.findByFilename(
          csvList.data,
          targetMonth,
          targetYear
        );

        if (mediaByFilename) {
          return await this.downloadAndParseCSV(mediaByFilename);
        }
      }

      // Backward search (up to 12 months)
      for (let i = 1; i <= 12; i++) {
        let searchMonth = targetMonth - i;
        let searchYear = targetYear;

        // Handle year boundaries
        if (searchMonth < 1) {
          searchMonth += 12;
          searchYear -= 1;
        }

        // Try metadata matching
        matchedMedia = await this.mediaService.queryCSVsByMetadata(
          searchMonth,
          searchYear
        );

        if (matchedMedia.success && matchedMedia.data) {
          return await this.downloadAndParseCSV(matchedMedia.data);
        }

        // Try filename parsing
        if (csvList.success && csvList.data) {
          const mediaByFilename = this.findByFilename(
            csvList.data,
            searchMonth,
            searchYear
          );

          if (mediaByFilename) {
            return await this.downloadAndParseCSV(mediaByFilename);
          }
        }
      }

      return {
        success: false,
        error: `No CSV found for month ${targetMonth}/${targetYear} or recent months`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to pull CSV from WordPress: ${errorMessage}`,
      };
    }
  }

  /**
   * Push CSV to WordPress
   */
  async pushCSVToWordPress(
    csvContent: string,
    raceName: string,
    raceDate: string,
    raceMonth: number,
    raceYear: number,
    isSeasonRollover: boolean
  ): Promise<ServiceResponse<MediaItem>> {
    try {
      // Generate filename
      const monthPad = String(raceMonth).padStart(2, '0');
      const rolloverSuffix = isSeasonRollover ? '-rollover' : '';
      const filename = `bushrun-next-race-${raceYear}-${monthPad}${rolloverSuffix}.csv`;

      // Build metadata
      const metadata: CSVMetadata = {
        race_name: raceName,
        race_date: raceDate,
        race_month: raceMonth,
        race_year: raceYear,
        csv_type: isSeasonRollover ? 'season_rollover' : 'next_race',
        is_season_rollover: isSeasonRollover,
      };

      // Upload to WordPress
      return await this.mediaService.uploadCSV(csvContent, filename, metadata);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to push CSV to WordPress: ${errorMessage}`,
      };
    }
  }

  /**
   * Generate next race CSV and push to WordPress
   */
  async generateAndPushNextRaceCSV(race: Race): Promise<ServiceResponse<MediaItem>> {
    try {
      const csvContent = generateNextRaceCSV(race.runners);

      const today = new Date();
      const raceDate = today.toISOString().split('T')[0];
      const raceMonth = today.getMonth() + 1; // 1-12
      const raceYear = today.getFullYear();

      return await this.pushCSVToWordPress(
        csvContent,
        'Next Race',
        raceDate,
        raceMonth,
        raceYear,
        false
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to generate and push next race CSV: ${errorMessage}`,
      };
    }
  }

  /**
   * Generate season rollover CSV and push to WordPress
   */
  async generateAndPushSeasonRolloverCSV(
    race: Race
  ): Promise<ServiceResponse<MediaItem>> {
    try {
      const csvContent = generateSeasonRolloverCSV(race.runners);

      const today = new Date();
      const raceDate = today.toISOString().split('T')[0];
      const raceMonth = today.getMonth() + 1; // 1-12
      const raceYear = today.getFullYear();

      return await this.pushCSVToWordPress(
        csvContent,
        'Season Rollover',
        raceDate,
        raceMonth,
        raceYear,
        true
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to generate and push season rollover CSV: ${errorMessage}`,
      };
    }
  }

  /**
   * Download and parse CSV file
   */
  private async downloadAndParseCSV(
    media: MediaItem
  ): Promise<ServiceResponse<PullCSVResponse>> {
    try {
      const csvResponse = await this.mediaService.downloadCSV(media.id);

      if (!csvResponse.success) {
        return csvResponse;
      }

      let runners: Runner[];
      try {
        runners = parseCSV(csvResponse.data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Invalid CSV format: ${errorMessage}`,
        };
      }

      // Try to extract metadata from filename
      const filename = media.title.rendered || '';
      const parsed = parseCSVFilename(filename);

      const metadata: CSVMetadata = {
        race_name: media.meta?.race_name || 'Race',
        race_date: media.date,
        race_month: parsed?.month || 1,
        race_year: parsed?.year || new Date().getFullYear(),
        csv_type: parsed?.isSeasonRollover ? 'season_rollover' : 'next_race',
        is_season_rollover: parsed?.isSeasonRollover || false,
      };

      return {
        success: true,
        data: {
          runners,
          metadata,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to download and parse CSV: ${errorMessage}`,
      };
    }
  }

  /**
   * Find media item by parsed filename
   */
  private findByFilename(
    mediaItems: MediaItem[],
    targetMonth: number,
    targetYear: number
  ): MediaItem | null {
    for (const item of mediaItems) {
      const filename = item.title.rendered;
      const parsed = parseCSVFilename(filename);

      if (
        parsed &&
        parsed.month === targetMonth &&
        parsed.year === targetYear
      ) {
        return item;
      }
    }

    return null;
  }

  /**
   * Get most recent CSV from WordPress
   */
  async getMostRecentCSV(): Promise<ServiceResponse<MediaItem | null>> {
    return await this.mediaService.getMostRecentCSV();
  }
}
