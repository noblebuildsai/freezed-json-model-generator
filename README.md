# freezed-json-model-generator
Generate Flutter models (Freezed / Normal) from JSON

This repository contains example Freezed model code and guidance to help Flutter developers generate immutable, JSON-serializable data classes using `freezed` and `json_serializable`.

## Quick Start

- Add the following to your app's `pubspec.yaml`:

```yaml
dependencies:
	freezed_annotation: ^2.4.1
	json_annotation: ^4.9.0

dev_dependencies:
	build_runner: ^2.4.11
	freezed: ^2.5.7
	json_serializable: ^6.9.0
```

- Create a model file (example below) and run the code generator:

```bash
dart pub run build_runner build --delete-conflicting-outputs
```

## Example Freezed Model

Below is a compact example for a `User` model you can copy into `lib/models/user.dart`.

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class User with _$User {
	const factory User({
		required String id,
		required String name,
		required String email,
		String? avatar,
	}) = _User;

	factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

After running `build_runner` this will generate `user.freezed.dart` and `user.g.dart` in the same directory.

## How to Use the Generated Model

- Create from JSON:

```dart
final user = User.fromJson(jsonMap);
```

- Convert to JSON:

```dart
final map = user.toJson();
```

- Copy with modifications (immutable update):

```dart
final updated = user.copyWith(name: 'New Name');
```

- Equality & pattern matching: Freezed gives you value equality and helpful debugging `toString()` output.

## Notes & Tips

- If you need custom JSON key names use `@JsonKey(name: 'server_name')` on fields.
- For complex types that need custom conversion, implement `JsonConverter`s and annotate fields accordingly.
- If you update annotations or change types, re-run the `build_runner` command above.
- To auto-watch files during development:

```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

## Troubleshooting

- Conflicting generated files: run the build command with `--delete-conflicting-outputs`.
- If generation fails, check the analyzer output for missing `part` directives or wrong import paths.

## Contributing

Contributions are welcome! To contribute:

1. Open an issue to discuss large changes or new features.
2. Fork the repo and create a feature branch.
3. Write clear, focused commits and include tests or example snippets when relevant.
4. Submit a pull request describing the change and why it helps.

Checklist for PRs:

- [ ] Follow existing style and formatting.
- [ ] Update README or examples if behavior changes.
- [ ] Make sure `build_runner` completes without errors.

For small fixes or documentation updates, feel free to submit a PR directly.

## License

This project welcomes contributions. If you want a specific license added, open an issue or include the appropriate `LICENSE` file in a PR.

---
If you'd like, I can also add a simple example Flutter app using this model, or create a CONTRIBUTING.md with a PR template.
