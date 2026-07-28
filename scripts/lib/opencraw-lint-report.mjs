export function parseOxlintReport(stdout) {
  const reportStart = stdout.search(/\{\s*"diagnostics"\s*:/u);
  if (reportStart < 0) {
    throw new Error("Oxlint JSON report was not found in stdout");
  }
  const reportText = stdout.slice(reportStart);
  return {
    prelude: stdout.slice(0, reportStart),
    reportText,
    report: JSON.parse(reportText),
  };
}

export function measureOxlintCoverage(report, expectedFileCount) {
  if (!Number.isSafeInteger(report.number_of_files) || report.number_of_files < 0) {
    throw new Error("number_of_files is missing or invalid");
  }
  return {
    processedFileCount: report.number_of_files,
    coverageMatches: report.number_of_files === expectedFileCount,
  };
}
