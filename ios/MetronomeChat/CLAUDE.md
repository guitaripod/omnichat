# MetronomeChat iOS

Native iOS client for the OmniChat platform.

## Project Overview
MetronomeChat is the iOS companion app for OmniChat, providing native mobile access to multi-model AI conversations.

## Build Commands
- **Build project**: `xcodebuild -project MetronomeChat.xcodeproj -scheme MetronomeChat build`
- **Run tests**: `xcodebuild test -project MetronomeChat.xcodeproj -scheme MetronomeChat -destination 'platform=iOS Simulator,name=iPhone 16'`

## Key Technical Details
- **UI Pattern**: Fully programmatic UIKit (no storyboards/XIBs)
- **Architecture**: MVVM pattern throughout
- **Target**: iOS 17+, iPhone only
- **Scene Management**: Root view controller set programmatically in `SceneDelegate.scene(_:willConnectTo:options:)`

## Development Patterns
- Use UIKit and latest UIKit APIs
- MVVM architecture for all screens
- Write tests for all view models and business logic. Make sure they test real implementations and add value
- Follow programmatic UI approach - no Interface Builder
- Use UIStackView's heavily to simplify layout code
- Always use latest UIKit APIs like diffable datasource and compositional layout
- Keep view controllers focused - delegate business logic to view models
- Prefer Protocol-Oriented-Programming over Object-Oriented-Programming

## Test Organization
- Tests are organized by feature area in the test target
- Test directory structure mirrors source directory structure
- Only write tests that provide real value
- Test business logic, data persistence, and complex operations
- Skip trivial tests that don't add value

## Claude Working Principles
- **Before implementing**: Search for 2-3 similar patterns in the codebase to follow
- **For complex tasks**: Internally decompose into sub-problems before starting
- **After implementing**: Self-check the solution for edge cases and potential issues
- **Consider alternatives**: Think of 2-3 approaches and pick the best one
- **Gather context first**: Read relevant files and understand constraints before coding
