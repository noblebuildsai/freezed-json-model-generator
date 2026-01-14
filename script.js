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
  
  function copyCode() {
    const output = document.getElementById("output").textContent;
    const status = document.getElementById("copyStatus");
    const copyBtn = document.querySelector('.output-actions .btn');
    
    if (!output || !output.trim()) {
      status.textContent = "Nothing to copy yet — generate code first.";
      status.style.color = "#64748b";
      status.style.fontWeight = "500";
      setTimeout(() => (status.textContent = ""), 2000);
      return;
    }
  
    navigator.clipboard.writeText(output).then(() => {
      // Update status message
      status.textContent = "✓ Copied to clipboard!";
      status.style.color = "#16a34a";
      status.style.fontWeight = "600";
      
      // Change button text temporarily
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      copyBtn.style.background = "#16a34a";
      copyBtn.style.color = "#ffffff";
      copyBtn.style.borderColor = "#16a34a";
      
      setTimeout(() => {
        status.textContent = "";
        copyBtn.textContent = originalText;
        copyBtn.style.background = "";
        copyBtn.style.color = "";
        copyBtn.style.borderColor = "";
      }, 2000);
    }).catch(() => {
      status.textContent = "Failed to copy";
      status.style.color = "#dc2626";
      status.style.fontWeight = "600";
      setTimeout(() => (status.textContent = ""), 2000);
    });
  }
  
  // ---------------- CORE BUILDER ----------------
  
  function buildClass(name, obj, classes, config) {
    const fields = [];
  
    for (const key in obj) {
      const value = obj[key];
      const fieldName = config.useCamelCase ? toCamelCase(key) : key;
  
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
      const f = config.useCamelCase ? toCamelCase(k) : k;
      return `    ${f} = json['${k}']?.toString();`;
    });
  
    const toJson = Object.keys(obj).map(k => {
      const f = config.useCamelCase ? toCamelCase(k) : k;
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
  
  function buildField(originalKey, fieldName, value, config) {
    const type = inferType(value);
    if (config.useJsonKey) {
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
  