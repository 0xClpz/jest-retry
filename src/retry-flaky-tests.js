/* eslint-disable no-console */
const jest = require('jest-cli');
const jestJunit = require('jest-junit');

const { newLineWrap: nW } = require('./string');
const processFlakiness = require('./process-flakiness');
const processTestResults = require('./process-test-results');

function retryIfFlakyTests({
  results: lastResults,
  jestConfig,
  testDirs,
  flakyOptions,
  retryNumber = 1,
  done
}) {
  const lastTestResults = lastResults.testResults;

  const flakyResults = processFlakiness(
    lastTestResults,
    flakyOptions.flakyFailureMessages,
    flakyOptions.flakyMarkAll
  );

  if (!flakyResults) {
    done(nW('Found real failures'));
  }

  const { flakyFailingTestPaths, flakyDictionaryCount } = flakyResults;

  const updatedConfig = Object.assign({}, jestConfig, {
    testMatch: flakyFailingTestPaths,
    _: null
  });

  console.log(nW(`flakyDictionaryCount: ${JSON.stringify(flakyDictionaryCount, null, 4)}`));
  console.log(nW('Retrying the following test suites: ', flakyFailingTestPaths))

  if (flakyOptions.flakyTestMock && retryNumber === 1) {
    process.env.SKIP = true;
  }

  console.log('===============================================\n');

  setTimeout(() => {
    jest.runCLI(updatedConfig, testDirs).then(response => {
      const { results: flakyResults } = response;
      const mergedTestResults = processTestResults(lastResults, flakyResults);

      if (flakyOptions.outputTestResults) {
        jestJunit(mergedTestResults);
      }

      if (flakyResults.success) {
        console.log('\nAll failures have now passed');
        return done(true);
      }

      console.log(nW('Retries have failures...'));

      if (retryNumber === flakyOptions.flakyNumRetries) {
        return done(`Max number of retries reached: ${retryNumber}`);
      }

      retryIfFlakyTests({
        results: mergedTestResults,
        jestConfig,
        testDirs,
        flakyOptions,
        retryNumber: retryNumber + 1,
        done
      });
    });
  }, flakyOptions.flakyWaitBeforeRerun);
}

module.exports = retryIfFlakyTests;
