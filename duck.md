<plan>
# Master Plan (duck.md)

## Overview
This document serves as the master plan for the mobile-first HTML app located in the `work` file. It outlines the app's purpose, features, design guidelines, and any updates or changes to be made.

## Current State
- The app is a single-page, mobile-first HTML application.
- It includes basic navigation, content sections, and responsive design.
- All existing functionality is preserved unless explicitly modified in the plan.

## Recent Updates
- **New API Key Added**: A new Venice.ai API key with sufficient inference budget has been added and is ready for use. This key should be integrated wherever the app requires external AI inference calls.

## Action Items
1. **Integrate API Key**: Update the app's configuration or code to use the newly added Venice.ai API key for any AI inference requests.  
   *Implementation note*: Insert the API key (e.g., `const VENICE_API_KEY = "YOUR_NEW_KEY_HERE";`) into the appropriate script or configuration section of `work`.
2. **Testing**: Verify that the API calls succeed using the new key and that the app functions correctly with the updated configuration.

## Future Enhancements (Ideas)
- Add user authentication to protect API usage.
- Implement caching for AI responses to reduce inference calls.
- Provide a UI for users to input custom prompts for AI processing.

## Development Guidelines
- Follow mobile-first design principles.
- Ensure all new features are responsive and accessible.
- Preserve existing functionality unless explicitly changed in this plan.

## Build Instructions
- When instructed with "build it" or explicit build commands, implement the changes described in this plan into the `work` file.
- Only one file may be modified per response; prioritize updating the plan before code changes.
</plan>