function passesWithoutKnownIssues(knownIssueArray, results) {
  const knownIssuePaths = []

  const fails = results.testResults.find(result => {
    if (result.numFailingTests === 0) return false

    const knownIssue = knownIssueArray.find((issue) =>
      result.testFilePath.includes(issue)
    )
    if (knownIssue) {
      result.title += ' / KNOWN ISSUE'
      knownIssuePaths.push(result.testFilePath)
      return false
    }

    // Not a known issue and has failures
    return true
  })

  if (fails) return { passes: false }
  else       return { passes: true, knownIssuePaths }
}

module.exports = passesWithoutKnownIssues