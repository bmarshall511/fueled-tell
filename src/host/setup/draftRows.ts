import type { RowIssue } from '../../engine/intake';
import { UI_COPY } from '../../ui/copy';

/** One editable row in the entries editor (`key` is stable for React and focus). */
export interface DraftRow {
  key: string;
  name: string;
  text: string;
}

let keySeq = 0;
export const newRow = (name = '', text = ''): DraftRow => ({ key: `r${++keySeq}`, name, text });

/** Has the person typed anything in this row? (Blank rows aren't errors yet.) */
export const isFilled = (r: { name: string; text: string }): boolean => Boolean(r.name.trim() || r.text.trim());

export const filledRows = <T extends { name: string; text: string }>(rows: readonly T[]): T[] => rows.filter(isFilled);

/** "Add a name · Same name as another row" */
export const describeIssues = (issues: readonly RowIssue[]): string => issues.map((i) => UI_COPY.editor.issues[i]).join(' · ');

const NAME_ISSUES: readonly RowIssue[] = ['missingName', 'duplicateName'];
export const nameIssues = (issues: readonly RowIssue[]) => issues.filter((i) => NAME_ISSUES.includes(i));
export const textIssues = (issues: readonly RowIssue[]) => issues.filter((i) => !NAME_ISSUES.includes(i));
