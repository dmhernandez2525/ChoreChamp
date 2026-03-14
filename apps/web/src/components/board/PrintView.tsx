import { useMemo, useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import type { Chore, ChorePriority, Member } from '@chorechamp/types';

interface PrintViewProps {
  chores: Chore[];
  householdName: string;
  viewMode: 'list' | 'kanban' | 'calendar';
  members?: Member[];
}

const priorityLabel: Record<ChorePriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const priorityOrder: Record<ChorePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildMemberMap(members?: Member[]): Map<string, Member> {
  const map = new Map<string, Member>();
  members?.forEach((m) => map.set(m.id, m));
  return map;
}

function getAssigneeNames(
  assignedTo: string[],
  memberMap: Map<string, Member>
): string {
  if (!assignedTo || assignedTo.length === 0) return 'Unassigned';
  return assignedTo
    .map((id) => memberMap.get(id)?.name ?? 'Unknown')
    .join(', ');
}

function ChoreTable({
  chores,
  memberMap,
}: {
  chores: Chore[];
  memberMap: Map<string, Member>;
}) {
  if (chores.length === 0) {
    return <p className="print-empty-msg">No chores in this group.</p>;
  }

  return (
    <table className="print-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Assignee</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {chores.map((chore) => (
          <tr key={chore.id}>
            <td>{chore.title}</td>
            <td>{getAssigneeNames(chore.assignedTo, memberMap)}</td>
            <td>{formatDate(chore.startDate)}</td>
            <td>{priorityLabel[chore.priority] ?? chore.priority}</td>
            <td className="capitalize">{chore.category.replace('_', ' ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PrintView({
  chores,
  householdName,
  viewMode,
  members,
}: PrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const memberMap = useMemo(() => buildMemberMap(members), [members]);

  const groupedByPriority = useMemo(() => {
    if (viewMode !== 'kanban') return null;

    const groups: Record<ChorePriority, Chore[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };

    chores.forEach((chore) => {
      const bucket = groups[chore.priority];
      if (bucket) {
        bucket.push(chore);
      } else {
        groups.medium.push(chore);
      }
    });

    return (Object.keys(groups) as ChorePriority[])
      .sort((a, b) => priorityOrder[a] - priorityOrder[b])
      .filter((key) => groups[key].length > 0)
      .map((key) => ({ priority: key, chores: groups[key] }));
  }, [chores, viewMode]);

  const sortedChores = useMemo(() => {
    if (viewMode === 'kanban') return chores;
    return [...chores].sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    );
  }, [chores, viewMode]);

  const handlePrint = () => {
    window.print();
  };

  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* Print trigger button (hidden when printing) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="print-hidden"
        data-testid="print-button"
      >
        <Printer className="mr-1.5 h-4 w-4" />
        Print
      </Button>

      {/* Printable content (hidden on screen, visible when printing) */}
      <div
        ref={printRef}
        className="print-area"
        data-testid="print-view"
      >
        {/* Header */}
        <div className="print-header">
          <h1 className="print-title">{householdName}</h1>
          <div className="print-meta">
            <span>Printed: {dateString}</span>
            <span className="print-meta-separator">|</span>
            <span>
              {chores.length} chore{chores.length !== 1 ? 's' : ''}
            </span>
            <span className="print-meta-separator">|</span>
            <span>View: {viewMode}</span>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'kanban' && groupedByPriority ? (
          groupedByPriority.map(({ priority, chores: groupChores }) => (
            <div key={priority} className="print-group">
              <h2 className="print-group-title">
                {priorityLabel[priority]} ({groupChores.length})
              </h2>
              <ChoreTable chores={groupChores} memberMap={memberMap} />
            </div>
          ))
        ) : (
          <ChoreTable chores={sortedChores} memberMap={memberMap} />
        )}
      </div>

      {/* Print styles */}
      <style>{`
        /* Screen: hide the print area */
        .print-area {
          display: none;
        }

        @media print {
          /* Hide everything except print area */
          body > * {
            visibility: hidden;
          }

          /* Hide navigation, sidebar, dialogs, toolbars */
          nav,
          aside,
          [role="dialog"],
          [data-testid="selection-toolbar"],
          [data-testid="filter-bar"],
          .print-hidden {
            display: none !important;
          }

          /* Show print area */
          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5in;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            background: #fff;
          }

          /* Header */
          .print-header {
            margin-bottom: 20pt;
            padding-bottom: 8pt;
            border-bottom: 1pt solid #333;
          }

          .print-title {
            font-size: 18pt;
            font-weight: 700;
            margin: 0 0 4pt 0;
          }

          .print-meta {
            font-size: 9pt;
            color: #555;
          }

          .print-meta-separator {
            margin: 0 6pt;
          }

          /* Group sections */
          .print-group {
            margin-bottom: 16pt;
            page-break-inside: avoid;
          }

          .print-group-title {
            font-size: 13pt;
            font-weight: 600;
            margin: 0 0 6pt 0;
            padding-bottom: 3pt;
            border-bottom: 0.5pt solid #999;
          }

          /* Table */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12pt;
          }

          .print-table th {
            text-align: left;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            padding: 4pt 6pt;
            border-bottom: 1pt solid #333;
            color: #333;
          }

          .print-table td {
            padding: 4pt 6pt;
            font-size: 10pt;
            border-bottom: 0.5pt solid #ddd;
            vertical-align: top;
          }

          .print-table tr:last-child td {
            border-bottom: none;
          }

          .capitalize {
            text-transform: capitalize;
          }

          .print-empty-msg {
            font-size: 10pt;
            color: #888;
            font-style: italic;
            margin: 4pt 0;
          }

          /* Page settings */
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </>
  );
}
