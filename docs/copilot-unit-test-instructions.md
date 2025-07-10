# GitHub Copilot Unit Test Instructions

> **Note**: These instructions apply specifically to writing unit tests for this project. Follow these guidelines when generating or modifying test files.

## Test Philosophy & Standards
- Always strive for 100% branch coverage when possible.

### Always execute these steps in order when unit testing!!!!

#### Unit test setup, do this first for files
- Execute the following steps if there are no outlined tests in the current file
- Add comments to outline the tests we need to write to cover the feature with 100% branch coverage. 
- The comments should be followed by empty tests with their title and description.
- Save changes to the file.
- Reset the chat history and restart the context window as if this was a new chat.
- //clear


#### Building the the actual unit test code
- Work on completing one empty unit test at a time for each file
- Once you write a test, run it in verbose mode.
- Fix any problems found then run again until it passes.
- When the test passes, save the changes to the file.
- Reset the chat history and restart the context window as if this was a new chat.
- //clear
