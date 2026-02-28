import { useState, useEffect, useMemo } from 'react';
import { WordPressMediaService, WordPressPageService } from '../../services';
import { ResultsHTMLGenerator } from '../../services/html/ResultsHTMLGenerator';
import type { MonthlyResults } from '../../services/html/ResultsHTMLGenerator';
import { parseCSVFilename } from '../../services/csv/filenameParser';
import { parseCSV, parseChampionshipRaceHistory } from '../../raceLogic';
import type { MediaItem } from '../../services/wordpress/types';
import LoadingView from '../ui/LoadingView';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function UpdateSiteResultsView() {
  const [csvFiles, setCSVFiles] = useState<MediaItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedPageUrl, setGeneratedPageUrl] = useState<string | null>(null);

  const mediaService = useMemo(() => new WordPressMediaService(), []);
  const pageService = useMemo(() => new WordPressPageService(), []);
  const htmlGenerator = useMemo(() => new ResultsHTMLGenerator(), []);

  useEffect(() => {
    fetchCurrentYearCSVs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentYearCSVs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await mediaService.listAllCSVs();

      if (!response.success) {
        setError(response.error || 'Failed to fetch CSVs');
        return;
      }

      // Filter CSV files from current year (flexible matching)
      const currentYear = new Date().getFullYear();
      const currentYearCSVs = response.data.filter((mediaItem) => {
        const filename = mediaItem.title.rendered || '';

        // Only process CSV files
        const isCSV =
          mediaItem.mime_type === 'text/csv' ||
          mediaItem.mime_type === 'application/csv' ||
          mediaItem.mime_type === 'text/plain' ||
          filename.toLowerCase().endsWith('.csv');

        if (!isCSV) return false;

        // Check if filename contains current year (flexible matching)
        // This catches "2026", "2025", etc. in any format
        return filename.includes(String(currentYear));
      });

      // Sort by date (most recent first)
      currentYearCSVs.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setCSVFiles(currentYearCSVs);

      // Auto-select the most recent CSV
      if (currentYearCSVs.length > 0) {
        setSelectedFileId(currentYearCSVs[0].id);
      } else {
        setError('No CSV files found for current year');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error fetching CSVs: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateResults = async () => {
    const selectedFile = csvFiles.find(f => f.id === selectedFileId);
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }
    await generateResultsPageFromCSV(selectedFile);
  };

  const generateResultsPageFromCSV = async (csvFile: MediaItem) => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);

      // 1. Download CSV
      const downloadResponse = await mediaService.downloadCSV(csvFile.id);

      if (!downloadResponse.success) {
        setError(downloadResponse.error || 'Failed to download CSV');
        return;
      }

      // 2. Parse CSV
      const parsedRunners = parseCSV(downloadResponse.data);

      if (!parsedRunners || parsedRunners.length === 0) {
        setError('No runners found in CSV');
        return;
      }

      // 3. Extract year from filename
      const parsed = parseCSVFilename(csvFile.title.rendered);
      const year = parsed?.year || new Date().getFullYear();

      // 4. Group runners by race number (1-12) and distance
      const monthlyResultsMap = new Map<number, MonthlyResults>();

      for (const runner of parsedRunners) {
        // Process 5k runners
        if (runner.distance === '5km' && runner.championship_races_5k) {
          try {
            const entries = parseChampionshipRaceHistory(runner.championship_races_5k);

            for (const entry of entries) {
              const raceNumber = entry.month; // This is the race number (1-12)

              if (!monthlyResultsMap.has(raceNumber)) {
                monthlyResultsMap.set(raceNumber, {
                  month: raceNumber,
                  year: year,
                  runners_5k: [],
                  runners_10k: [],
                });
              }

              // Add runner to this race number's results
              monthlyResultsMap.get(raceNumber)!.runners_5k.push(runner);
            }
          } catch (err) {
            console.warn(`Failed to parse 5k championship races for ${runner.full_name}:`, err);
          }
        }

        // Process 10k runners
        if (runner.distance === '10km' && runner.championship_races_10k) {
          try {
            const entries = parseChampionshipRaceHistory(runner.championship_races_10k);

            for (const entry of entries) {
              const raceNumber = entry.month;

              if (!monthlyResultsMap.has(raceNumber)) {
                monthlyResultsMap.set(raceNumber, {
                  month: raceNumber,
                  year: year,
                  runners_5k: [],
                  runners_10k: [],
                });
              }

              monthlyResultsMap.get(raceNumber)!.runners_10k.push(runner);
            }
          } catch (err) {
            console.warn(`Failed to parse 10k championship races for ${runner.full_name}:`, err);
          }
        }
      }

      // 5. Convert to array and sort by race number (1-12)
      const monthlyResults = Array.from(monthlyResultsMap.values()).sort(
        (a, b) => a.month - b.month
      );

      if (monthlyResults.length === 0) {
        setError('No race results found in championship data');
        return;
      }

      console.log(`[Results] Generated results for ${monthlyResults.length} months`);

      // 6. Generate HTML
      const htmlContent = htmlGenerator.generateYearResultsHTML(year, monthlyResults);

      // 7. Find parent "Handicap" page
      let parentId: number | undefined;
      try {
        const parentSearchTerms = ['Handicap', 'handicap', 'Handicaps', 'handicaps'];
        for (const searchTerm of parentSearchTerms) {
          const parentResponse = await pageService.findPageByTitle(searchTerm);
          if (parentResponse.success && parentResponse.data) {
            parentId = parentResponse.data.id;
            console.log(`[Results] Found parent page: "${parentResponse.data.title.rendered}" (ID: ${parentId})`);
            break;
          }
        }

        if (!parentId) {
          console.warn('[Results] Parent "Handicap" page not found. Creating page without parent.');
        }
      } catch (err) {
        console.warn('[Results] Error searching for parent page:', err);
      }

      // 8. Create or update WordPress page
      console.log(`[Results] Creating or updating page: "${year} Results"`);
      const pageResponse = await pageService.createOrUpdatePage(
        `${year} Results`,
        htmlContent,
        parentId
      );

      if (!pageResponse.success) {
        setError(pageResponse.error || 'Failed to create/update WordPress page');
        return;
      }

      // Success! Refresh the page by appending cache-busting parameter
      const pageUrlWithRefresh = `${pageResponse.data.link}?refresh=${Date.now()}`;
      setGeneratedPageUrl(pageUrlWithRefresh);
      setSuccess(true);

      console.log('✅ WordPress page created/updated successfully!');
      console.log(`   Page ID: ${pageResponse.data.id}`);
      console.log(`   URL: ${pageResponse.data.link}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error generating results page: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <LoadingView />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
        Update Site Results
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Select the latest race CSV to generate results page for the entire year.
        The CSV contains complete race history in championship data.
      </p>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-4">
          <p className="text-red-800 dark:text-red-200 mb-3">{error}</p>
          <Button onClick={() => fetchCurrentYearCSVs()} variant="secondary" size="sm">
            Retry
          </Button>
        </Card>
      )}

      {success && generatedPageUrl && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mb-4">
          <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
            ✅ Results page created/updated successfully!
          </p>
          <a
            href={generatedPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
          >
            View Page →
          </a>
        </Card>
      )}

      {csvFiles.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Select CSV File
          </h3>
          <div className="space-y-2 mb-4">
            {csvFiles.map((file) => (
              <label
                key={file.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFileId === file.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <input
                  type="radio"
                  name="csv-file"
                  value={file.id}
                  checked={selectedFileId === file.id}
                  onChange={() => setSelectedFileId(file.id)}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                    {file.title.rendered}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Uploaded: {formatDate(file.date)}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <Button
            onClick={handleGenerateResults}
            disabled={isGenerating || !selectedFileId}
            className="w-full"
            variant="primary"
            size="lg"
          >
            {isGenerating ? 'Generating Results Page...' : 'Generate Results'}
          </Button>
        </Card>
      )}
    </div>
  );
}
