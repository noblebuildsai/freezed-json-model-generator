function generate() {
  const jsonText = document.getElementById("jsonInput").value;
  const rootClass = document.getElementById("rootClass").value.trim();

  const config = {
    useFreezed: document.getElementById("useFreezed").checked,
    useJsonKey: document.getElementById("useJsonKey").checked,
    useCamelCase: document.getElementById("useCamelCase").checked,
    useNullSafe: document.getElementById("useNullSafe").checked,
    includeJsonComment: document.getElementById("includeJsonComment").checked,
  };

  if (!jsonText || !rootClass) {
    alert("JSON and Root Class Name required");
    return;
  }

  let json;
  try {
    json = JSON.parse(jsonText);
  } catch {
    alert("Invalid JSON");
    return;
  }

  const classes = [];
  buildClass(rootClass, json, classes, config);

  const header = config.useFreezed
    ? `
import 'package:freezed_annotation/freezed_annotation.dart';

part '${toSnake(rootClass)}.freezed.dart';
part '${toSnake(rootClass)}.g.dart';
`
    : ``;

  document.getElementById("output").textContent =
    header + "\n" + classes.reverse().join("\n\n");
}

// ---------------- CORE BUILDER ----------------

function buildClass(name, obj, classes, config) {
  const fields = [];

  for (const key in obj) {
    const value = obj[key];
    const fieldName = sanitizeFieldName(key, config.useCamelCase);

    if (Array.isArray(value)) {
      if (value.length && typeof value[0] === "object") {
        const child = capitalize(fieldName);
        buildClass(child, value[0], classes, config);
        fields.push(`List<${child}>${nullable(config)} ${fieldName}`);
      } else {
        fields.push(`List<dynamic>${nullable(config)} ${fieldName}`);
      }
    } else if (typeof value === "object" && value !== null) {
      const child = capitalize(fieldName);
      buildClass(child, value, classes, config);
      fields.push(`${child}${nullable(config)} ${fieldName}`);
    } else {
      fields.push(buildField(key, fieldName, value, config));
    }
  }

  const jsonComment = config.includeJsonComment
    ? formatJsonComment(obj)
    : "";

  if (config.useFreezed) {
    classes.push(freezedClass(name, fields, jsonComment));
  } else {
    classes.push(normalClass(name, fields, obj, jsonComment, config));
  }
}

// ---------------- FREEZED ----------------

function freezedClass(name, fields, jsonComment) {
  return `
@freezed
class ${name} with _$${name} {
${jsonComment}
  const factory ${name}({
${fields.map(f => `    ${f},`).join("\n")}
  }) = _${name};

  factory ${name}.fromJson(Map<String, dynamic> json) =>
      _$${name}FromJson(json);
}
`;
}

// ---------------- NORMAL MODEL ----------------

function normalClass(name, fields, obj, jsonComment, config) {
  const constructor = fields.map(f => {
    const n = f.split(" ").pop();
    return `    this.${n},`;
  });

  const fromJson = Object.keys(obj).map(k => {
    const f = sanitizeFieldName(k, config.useCamelCase);
    return `    ${f} = json['${k}'];`;
  });

  const toJson = Object.keys(obj).map(k => {
    const f = sanitizeFieldName(k, config.useCamelCase);
    return `    data['${k}'] = ${f};`;
  });

  return `
class ${name} {
${jsonComment}
${fields.map(f => `  ${f.replace("?", "?;")}`).join("\n")}

  ${name}({
${constructor.join("\n")}
  });

  ${name}.fromJson(Map<String, dynamic> json) {
${fromJson.join("\n")}
  }

  Map<String, dynamic> toJson() {
    final data = <String, dynamic>{};
${toJson.join("\n")}
    return data;
  }
}
`;
}

// ---------------- HELPERS ----------------

// ⭐ SMART JsonKey AUTO-DETECTION
function buildField(originalKey, fieldName, value, config) {
  const type = inferType(value);

  const needsJsonKey =
    config.useJsonKey &&
    (originalKey.startsWith("_") || originalKey !== fieldName);

  if (needsJsonKey) {
    return `@JsonKey(name: '${originalKey}') ${type}${nullable(config)} ${fieldName}`;
  }

  return `${type}${nullable(config)} ${fieldName}`;
}

function inferType(value) {
  if (typeof value === "string") return "String";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "double";
  if (typeof value === "boolean") return "bool";
  return "dynamic";
}

function formatJsonComment(obj) {
  return `
/*
${JSON.stringify(obj, null, 2)}
*/
`;
}

function nullable(config) {
  return config.useNullSafe ? "?" : "";
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnake(str) {
  return str.replace(/[A-Z]/g, m => "_" + m.toLowerCase()).replace(/^_/, "");
}

// ⭐ FIELD NAME SANITIZER (handles _id, __t, __v, etc.)
function sanitizeFieldName(key, useCamelCase) {
  let clean = key.replace(/^_+/, "");
  if (!clean) clean = "value";
  return useCamelCase ? toCamelCase(clean) : clean;
}
