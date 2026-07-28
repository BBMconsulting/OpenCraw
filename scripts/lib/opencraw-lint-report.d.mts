export type OxlintReport = {
  number_of_files?: unknown;
  [key: string]: unknown;
};

export function parseOxlintReport(stdout: string): {
  prelude: string;
  reportText: string;
  report: OxlintReport;
};

export function measureOxlintCoverage(
  report: OxlintReport,
  expectedFileCount: number,
): {
  processedFileCount: number;
  coverageMatches: boolean;
};
