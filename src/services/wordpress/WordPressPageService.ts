/**
 * WordPress Pages Service
 * Handles all WordPress page operations (create, update, find, list)
 */

import { WordPressClient } from './WordPressClient';
import type { ServiceResponse } from './types';

/**
 * WordPress Page interface (API response)
 */
export interface WordPressPage {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  link: string;
  parent: number;
  status: 'publish' | 'draft' | 'private';
}

export class WordPressPageService {
  private client: WordPressClient;

  constructor(timeout?: number) {
    this.client = new WordPressClient(timeout);
  }

  /**
   * Find a page by title using search
   * Returns the first exact matching page or null if not found
   */
  async findPageByTitle(
    title: string
  ): Promise<ServiceResponse<WordPressPage | null>> {
    try {
      const response = await this.client.get<WordPressPage[]>('/pages', {
        search: encodeURIComponent(title),
        per_page: '100', // Get more results to increase chance of finding exact match
      });

      if (!response.success) {
        return response;
      }

      const pages = Array.isArray(response.data) ? response.data : [];

      // Find exact title match (case-insensitive) since WordPress search is fuzzy
      const exactMatch = pages.find(page =>
        page.title.rendered.toLowerCase() === title.toLowerCase()
      );

      console.log(`[PageService] Searching for page: "${title}"`);
      console.log(`[PageService] Found ${pages.length} pages from search`);
      console.log(`[PageService] Exact match found: ${exactMatch ? `Yes (ID: ${exactMatch.id})` : 'No'}`);

      return {
        success: true,
        data: exactMatch || null,
      };
    } catch {
      return {
        success: false,
        error: `Failed to search for page: ${title}`,
      };
    }
  }

  /**
   * Create a new WordPress page
   */
  async createPage(
    title: string,
    content: string,
    parent?: number
  ): Promise<ServiceResponse<WordPressPage>> {
    try {
      const payload: {
        title: string;
        content: string;
        status: 'publish';
        parent?: number;
      } = {
        title,
        content,
        status: 'publish',
      };

      if (parent) {
        payload.parent = parent;
      }

      const response = await this.client.post<WordPressPage>(
        '/pages',
        payload
      );

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to create page: ${errorMessage}`,
      };
    }
  }

  /**
   * Update an existing WordPress page
   */
  async updatePage(
    pageId: number,
    title: string,
    content: string
  ): Promise<ServiceResponse<WordPressPage>> {
    try {
      const payload = {
        title,
        content,
      };

      const response = await this.client.post<WordPressPage>(
        `/pages/${pageId}`,
        payload
      );

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to update page: ${errorMessage}`,
      };
    }
  }

  /**
   * Create or update a page (convenience method)
   * Searches for existing page by title and updates it, otherwise creates new
   */
  async createOrUpdatePage(
    title: string,
    content: string,
    parent?: number
  ): Promise<ServiceResponse<WordPressPage>> {
    try {
      // Try multiple approaches to find the page
      console.log(`[PageService] Looking for existing page: "${title}"`);

      // Approach 1: Search with title
      const searchResponse = await this.listPages({
        search: title,
      });

      if (searchResponse.success && searchResponse.data) {
        const exactMatch = searchResponse.data.find(page =>
          page.title.rendered.toLowerCase() === title.toLowerCase()
        );

        if (exactMatch) {
          console.log(`[PageService] Found via search - ID: ${exactMatch.id}, updating...`);
          return await this.updatePage(exactMatch.id, title, content);
        }
        console.log(`[PageService] No exact match in search results (${searchResponse.data.length} pages found)`);
      }

      // Approach 2: List all pages and filter (fallback for when search fails)
      console.log(`[PageService] Trying fallback: listing all pages...`);
      const allPagesResponse = await this.listPages({});

      if (allPagesResponse.success && allPagesResponse.data) {
        console.log(`[PageService] Retrieved ${allPagesResponse.data.length} total pages`);

        const exactMatch = allPagesResponse.data.find(page =>
          page.title.rendered.toLowerCase() === title.toLowerCase()
        );

        if (exactMatch) {
          console.log(`[PageService] Found via full list - ID: ${exactMatch.id}, updating...`);
          return await this.updatePage(exactMatch.id, title, content);
        }
        console.log(`[PageService] No exact match found in all pages`);
      }

      // Page doesn't exist, create it
      console.log(`[PageService] Creating new page: "${title}"`);
      return await this.createPage(title, content, parent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to create or update page: ${errorMessage}`,
      };
    }
  }

  /**
   * List pages with optional filters
   */
  async listPages(params?: {
    search?: string;
    parent?: number;
  }): Promise<ServiceResponse<WordPressPage[]>> {
    try {
      const queryParams: Record<string, string> = {
        per_page: '100',
      };

      if (params?.search) {
        queryParams.search = encodeURIComponent(params.search);
      }

      if (params?.parent !== undefined) {
        queryParams.parent = String(params.parent);
      }

      const response = await this.client.get<WordPressPage[]>(
        '/pages',
        queryParams
      );

      if (!response.success) {
        return response;
      }

      const pages = Array.isArray(response.data) ? response.data : [];
      return { success: true, data: pages };
    } catch {
      return {
        success: false,
        error: 'Failed to list pages',
      };
    }
  }
}
