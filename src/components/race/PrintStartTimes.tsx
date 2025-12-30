import { useEffect } from 'react'
import type { Race, Runner } from '../../types'
import { timeStringToMs } from '../../raceLogic'

interface PrintStartTimesProps {
  race: Race
  isOpen: boolean
  onClose: () => void
}

export default function PrintStartTimes({ race, isOpen, onClose }: PrintStartTimesProps) {
  // Trigger print dialog when component opens
  useEffect(() => {
    if (isOpen) {
      // Generate HTML content for printing
      const htmlContent = generatePrintHTML(race)

      // Open in new window for printing
      const printWindow = window.open('', '', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Wait for content to load, then trigger print
        printWindow.onload = () => {
          printWindow.print()
          printWindow.close()
          onClose()
        }
      }
    }
  }, [isOpen, onClose, race])

  return null
}

// Helper function to generate HTML for printing
function generatePrintHTML(race: Race): string {
  const runners5k = race.runners
    .filter(r => r.distance === '5km')
    .sort((a, b) => {
      const aHandicap = a.current_handicap_5k || '00:00'
      const bHandicap = b.current_handicap_5k || '00:00'
      const aMs = timeStringToMs(aHandicap)
      const bMs = timeStringToMs(bHandicap)
      if (aMs !== bMs) return aMs - bMs
      return a.member_number - b.member_number
    })

  const runners10k = race.runners
    .filter(r => r.distance === '10km')
    .sort((a, b) => {
      const aHandicap = a.current_handicap_10k || '00:00'
      const bHandicap = b.current_handicap_10k || '00:00'
      const aMs = timeStringToMs(aHandicap)
      const bMs = timeStringToMs(bHandicap)
      if (aMs !== bMs) return aMs - bMs
      return a.member_number - b.member_number
    })

  const formatStartTime = (runner: Runner): string => {
    const handicap = runner.distance === '5km'
      ? runner.current_handicap_5k || '00:00'
      : runner.current_handicap_10k || '00:00'

    if (race.start_time) {
      const startMs = race.start_time + timeStringToMs(handicap)
      return new Date(startMs).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
    return handicap
  }

  const getHandicap = (runner: Runner): string => {
    return runner.distance === '5km'
      ? runner.current_handicap_5k || '00:00'
      : runner.current_handicap_10k || '00:00'
  }

  const getChampionshipPoints = (runner: Runner): number => {
    return runner.distance === '5km'
      ? runner.championship_points_5k || 0
      : runner.championship_points_10k || 0
  }

  const createTableHTML = (distance: '5km' | '10km', runners: Runner[]): string => {
    if (runners.length === 0) {
      return `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${race.name} - ${distance} Start Times</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 16px;">Date: ${race.date}</p>
          <p style="color: #999; font-style: italic;">No runners registered for ${distance}</p>
        </div>
      `
    }

    const tableRows = runners.map(runner => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px 8px;">${runner.member_number}</td>
        <td style="border: 1px solid #000; padding: 6px 8px;">${runner.full_name}</td>
        <td style="border: 1px solid #000; padding: 6px 8px;">${getHandicap(runner)}</td>
        <td style="border: 1px solid #000; padding: 6px 8px;">${getChampionshipPoints(runner)}</td>
        <td style="border: 1px solid #000; padding: 6px 8px;">${formatStartTime(runner)}</td>
      </tr>
    `).join('')

    return `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${race.name} - ${distance} Start Times</h2>
        <p style="font-size: 14px; color: #666; margin-bottom: 16px;">Date: ${race.date}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 12px;">
          <thead>
            <tr>
              <th style="background-color: #f3f4f6; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Member #</th>
              <th style="background-color: #f3f4f6; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Name</th>
              <th style="background-color: #f3f4f6; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Handicap</th>
              <th style="background-color: #f3f4f6; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Champ Points</th>
              <th style="background-color: #f3f4f6; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Start Time</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${race.name} - Start Times</title>
      <style>
        @page {
          margin: 1cm;
          size: A4 portrait;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 1cm;
          color: #000;
        }
        h2 {
          margin: 0 0 8px 0;
        }
        p {
          margin: 0;
        }
        table {
          page-break-inside: avoid;
        }
        tr {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      ${createTableHTML('5km', runners5k)}
      <div style="page-break-after: always;"></div>
      ${createTableHTML('10km', runners10k)}
    </body>
    </html>
  `
}
