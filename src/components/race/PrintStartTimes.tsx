import { useEffect, useState } from 'react'
import type { Race, Runner } from '../../types'
import { timeStringToMs } from '../../raceLogic'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface PrintStartTimesProps {
  race: Race
  isOpen: boolean
  onClose: () => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function PrintStartTimes({ race, isOpen, onClose }: PrintStartTimesProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    if (isOpen) {
      setShowModal(true)
    }
  }, [isOpen])

  const handlePrint = () => {
    setShowModal(false)

    // Generate HTML content for printing with selected month/year
    const htmlContent = generatePrintHTML(race, selectedMonth, selectedYear)

    // Open in new window for printing
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for content to render, then trigger print
      printWindow.addEventListener('load', () => {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
          onClose()
        }, 500)
      }, { once: true })
    } else {
      onClose()
    }
  }

  const handleCancel = () => {
    setShowModal(false)
    onClose()
  }

  return (
    <Modal isOpen={showModal} onClose={handleCancel} title="Print Handicap Times">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Race Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          >
            {MONTHS.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Race Year
          </label>
          <Input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            min="2020"
            max="2100"
          />
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <Button
            onClick={handleCancel}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            variant="primary"
          >
            Print Handicap Times
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Helper function to generate HTML for printing
function generatePrintHTML(race: Race, monthIndex: number, year: number): string {
  const runners5k = race.runners
    .filter(r => r.distance === '5km')
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const runners10k = race.runners
    .filter(r => r.distance === '10km')
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const monthName = MONTHS[monthIndex]
  const raceHeader = `Handicap ${monthName} - ${year}`

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

  const getChampionshipPoints = (runner: Runner): number => {
    return runner.distance === '5km'
      ? runner.championship_points_5k || 0
      : runner.championship_points_10k || 0
  }

  const createTableHTML = (distance: '5km' | '10km', runners: Runner[]): string => {
    if (runners.length === 0) {
      return `
        <div style="flex: 1; min-width: 0;">
          <h2 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">${distance} Start Times</h2>
          <p style="color: #999; font-style: italic;">No runners registered</p>
        </div>
      `
    }

    const tableRows = runners.map(runner => `<tr><td style="border: 1px solid #000; padding: 3px 4px; font-size: 9pt;">${runner.member_number}</td><td style="border: 1px solid #000; padding: 3px 4px; font-size: 9pt;">${runner.full_name}</td><td style="border: 1px solid #000; padding: 3px 4px; font-size: 9pt; text-align: center;">${getChampionshipPoints(runner)}</td><td style="border: 1px solid #000; padding: 3px 4px; font-size: 9pt;">${formatStartTime(runner)}</td></tr>`).join('')

    return `<div style="flex: 1; min-width: 0;"><h2 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">${distance} Start Times</h2><table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin: 0; padding: 0;"><thead><tr><th style="background-color: #f3f4f6; border: 1px solid #000; padding: 3px 4px; text-align: left; font-weight: bold; font-size: 8pt;">Member #</th><th style="background-color: #f3f4f6; border: 1px solid #000; padding: 3px 4px; text-align: left; font-weight: bold; font-size: 8pt;">Name</th><th style="background-color: #f3f4f6; border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold; font-size: 8pt;">Points</th><th style="background-color: #f3f4f6; border: 1px solid #000; padding: 3px 4px; text-align: left; font-weight: bold; font-size: 8pt;">Start Time</th></tr></thead><tbody>${tableRows}</tbody></table></div>`
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${raceHeader} - Start Times</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } @page { margin: 0.5cm; size: A4 landscape; } html { margin: 0; padding: 0; } body { font-family: Arial, sans-serif; margin: 0.5cm; padding: 0; color: #000; line-height: 1.2; } h1 { font-size: 18px; margin: 0 0 8px 0; text-align: center; } h2 { margin: 0 0 4px 0; padding: 0; } p { margin: 0 0 4px 0; padding: 0; } .container { display: flex; gap: 12px; align-items: flex-start; } table { margin: 0; padding: 0; border-spacing: 0; } thead { display: table-header-group; }</style></head><body><h1>${raceHeader}</h1><div class="container">${createTableHTML('5km', runners5k)}${createTableHTML('10km', runners10k)}</div></body></html>`
}
