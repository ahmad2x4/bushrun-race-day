/**
 * WordPress Media Library Service
 * Handles all Media Library operations (list, upload, download CSVs)
 */

import { WordPressClient } from './WordPressClient';
import type { ServiceResponse, MediaItem, CSVMetadata } from './types';

export class WordPressMediaService {
  private client: WordPressClient;

  constructor(timeout?: number) {
    this.client = new WordPressClient(timeout);
  }

  /**
   * List all CSV files in WordPress Media Library
   */
  async listAllCSVs(): Promise<ServiceResponse<MediaItem[]>> {
    try {
      const response = await this.client.get<MediaItem[]>('/media', {
        mime_type: 'text/csv',
        per_page: '100',
      });

      if (!response.success) {
        return response;
      }

      // Ensure we have an array
      const items = Array.isArray(response.data) ? response.data : [];

      // Sort by date descending (most recent first)
      items.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      return { success: true, data: items };
    } catch {
      return {
        success: false,
        error: 'Failed to list CSV files from WordPress',
      };
    }
  }

  /**
   * Query CSVs by metadata (race_month and race_year)
   * Since WordPress REST API doesn't expose custom meta fields,
   * we rely on filename parsing (e.g., bushrun-next-race-2026-01.csv)
   */
  async queryCSVsByMetadata(
    month: number,
    year: number
  ): Promise<ServiceResponse<MediaItem | null>> {
    try {
      const response = await this.client.get<MediaItem[]>('/media', {
        mime_type: 'text/csv',
        per_page: '100',
      });

      if (!response.success) {
        return response;
      }

      const items = Array.isArray(response.data) ? response.data : [];

      // Import filename parser
      const { parseCSVFilename } = await import('../csv/filenameParser');

      // Find CSV with matching filename pattern
      const match = items.find((item) => {
        const filename = item.title.rendered || '';
        const parsed = parseCSVFilename(filename);
        return parsed && parsed.month === month && parsed.year === year;
      });

      return {
        success: true,
        data: match || null,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to query CSVs by metadata',
      };
    }
  }

  /**
   * Download CSV file from WordPress
   */
  async downloadCSV(mediaId: number): Promise<ServiceResponse<string>> {
    try {
      const response = await this.client.get<MediaItem>(`/media/${mediaId}`);

      if (!response.success) {
        return response;
      }

      const url = response.data.source_url;

      if (!url) {
        return {
          success: false,
          error: 'CSV URL not found in media item',
        };
      }

      // Fetch the CSV file
      const csvResponse = await fetch(url);
      if (!csvResponse.ok) {
        return {
          success: false,
          error: 'Failed to download CSV file',
        };
      }

      const csvContent = await csvResponse.text();
      return {
        success: true,
        data: csvContent,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to download CSV from WordPress',
      };
    }
  }

  /**
   * Upload CSV file to WordPress Media Library
   * Note: Custom metadata is stored in the filename (e.g., bushrun-next-race-2026-01.csv)
   * because WordPress REST API doesn't expose custom meta fields by default
   */
  async uploadCSV(
    csvContent: string,
    filename: string,
    metadata: CSVMetadata
  ): Promise<ServiceResponse<MediaItem>> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, filename);

      // Set title with race info for easy identification in Media Library
      const title = `${metadata.race_name} - ${metadata.race_date}`;
      formData.append('title', title);

      // Add description with metadata info
      const description = `Race: ${metadata.race_name} (Month: ${metadata.race_month}, Year: ${metadata.race_year}, Type: ${metadata.csv_type})`;
      formData.append('description', description);

      const response = await this.client.post<MediaItem>('/media', formData);

      if (!response.success) {
        return response;
      }

      return {
        success: true,
        data: response.data,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to upload CSV to WordPress',
      };
    }
  }

  /**
   * Get most recent CSV by date
   */
  async getMostRecentCSV(): Promise<ServiceResponse<MediaItem | null>> {
    try {
      const response = await this.listAllCSVs();

      if (!response.success) {
        return response;
      }

      const items = response.data;

      if (items.length === 0) {
        return {
          success: true,
          data: null,
        };
      }

      // Items are already sorted by date descending, return first
      return {
        success: true,
        data: items[0],
      };
    } catch {
      return {
        success: false,
        error: 'Failed to get most recent CSV',
      };
    }
  }
}
