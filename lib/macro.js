"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _babelPluginMacros = require("babel-plugin-macros");

var _crypto = _interopRequireDefault(require("crypto"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var macro = function macro(_ref) {
  var references = _ref.references,
      config = _ref.config;
  var _references$default = references["default"],
      defaultImport = _references$default === void 0 ? [] : _references$default;
  var privateKeyProperty = config.privateKey;
  if (!privateKeyProperty) throw new _babelPluginMacros.MacroError("Error: privateKey config property is not set");
  var privateKey = "-----BEGIN RSA PRIVATE KEY-----\n".concat(privateKeyProperty, "\n-----END RSA PRIVATE KEY-----");
  console.log("privateKey", privateKey);
  defaultImport.forEach(function (referencePath) {
    if (referencePath.parentPath.type === "CallExpression") {
      var callExpressionPath = referencePath.parentPath;

      var _callExpressionPath$g = callExpressionPath.get("arguments"),
          _callExpressionPath$g2 = _slicedToArray(_callExpressionPath$g, 2),
          operationArg = _callExpressionPath$g2[0],
          fieldsArg = _callExpressionPath$g2[1];

      var operation = operationArg.evaluate().value;
      var fields = fieldsArg.evaluate().value;
      var signed = sign(privateKey, operation, fields);
      referencePath.parentPath.replaceWithSourceString(JSON.stringify(signed));
    }
  });
};

var sign = function sign(privateKey, operation, fields) {
  var dataToSign = JSON.stringify(_defineProperty({}, operation, fields));

  var signerObject = _crypto["default"].createSign("RSA-SHA512");

  signerObject.update(dataToSign);
  var signature = signerObject.sign(privateKey, 'base64');
  return {
    signature: signature,
    fields: fields
  };
};

var _default = (0, _babelPluginMacros.createMacro)(macro, {
  configName: 'tm2SignConfig'
});

exports["default"] = _default;