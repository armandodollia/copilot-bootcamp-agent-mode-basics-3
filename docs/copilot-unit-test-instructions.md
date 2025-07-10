# GitHub Copilot Unit Test Instructions

> **Note**: These instructions apply specifically to writing unit tests for this project. Follow these guidelines when generating or modifying test files.

## Test Philosophy & Standards
- Always strive for 100% branch coverage when possible.
- Define and set all test data and constants at the top of each file.

### Always execute these steps in order when unit testing!!!!

#### Unit test setup, do this first for files
- Execute the following steps if there are no outlined tests in the current file
- Add comments to outline the tests we need to write to cover the feature with 100% branch coverage. 
- The comments should be followed by empty and disabled tests with their title and description.
- Save changes to the file.
- Reset the chat history and restart the context window as if this was a new chat.
- Continue with the next set of instructions
- //clear


#### Building the the actual unit test code
- Work on completing one empty unit test at a time for each file.
- Enable the test then write it.
- Repeat the previous 2 steps for all unimplemented tests.
- Only run the tests when they are ALL written.
- Fix any problems found one test at a time then run the tests again until they all pass.
- When the tests passes, save the changes to the file.
- If code branch coverage is not at 100%, fix any of the lines that are not covered.
