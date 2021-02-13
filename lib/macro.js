"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _babelPluginMacros = require("babel-plugin-macros");

var _crypto = _interopRequireDefault(require("crypto"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

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
  defaultImport.forEach(function (referencePath) {
    if (referencePath.parentPath.type === "CallExpression") {
      var callExpressionPath = referencePath.parentPath;

      var _callExpressionPath$g = callExpressionPath.get("arguments"),
          _callExpressionPath$g2 = _slicedToArray(_callExpressionPath$g, 2),
          operationArg = _callExpressionPath$g2[0],
          fieldsArg = _callExpressionPath$g2[1];

      var _getArgumentValue = getArgumentValue(operationArg),
          operation = _getArgumentValue.value,
          getOperationSuccess = _getArgumentValue.success;

      var _getArgumentValue2 = getArgumentValue(fieldsArg),
          fields = _getArgumentValue2.value,
          getFieldsSuccess = _getArgumentValue2.success;

      if (!getOperationSuccess || !getFieldsSuccess) throw new _babelPluginMacros.MacroError("Error: Unable to get macro arguments values");
      var signed = sign(privateKey, operation, fields);
      referencePath.parentPath.replaceWithSourceString(JSON.stringify(signed));
    }
  });
};

var getArgumentValue = function getArgumentValue(argument) {
  if (argument.evaluateTruthy()) {
    return {
      success: true,
      value: argument.evaluate().value
    };
  }

  if (argument.isArrayExpression()) {
    return getArrayValue(argument);
  } else if (argument.isSpreadElement()) {
    return getSpreadValue(argument);
  } else if (argument.isObjectExpression()) {
    return getObjectValue(argument);
  } else if (argument.isNumericLiteral()) {
    return {
      success: true,
      value: argument.node.value
    };
  }

  console.log(":(", argument.type);
  return {
    success: false
  };
};

var getArrayValue = function getArrayValue(arrayExpression) {
  var result = [];

  var _iterator = _createForOfIteratorHelper(arrayExpression.get("elements")),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var arrayElement = _step.value;
      var elementValue = getArgumentValue(arrayElement);

      if (elementValue.success) {
        if (elementValue.isSpread) {
          result.push.apply(result, _toConsumableArray(elementValue.value));
        } else {
          result.push(elementValue.value);
        }
      } else {
        return {
          success: false
        };
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return {
    success: true,
    value: result
  };
};

var getSpreadValue = function getSpreadValue(spreadElement) {
  var argument = spreadElement.get("argument");
  var spreadValue = getArgumentValue(argument);
  return _objectSpread({
    isSpread: true
  }, spreadValue);
};

var getObjectValue = function getObjectValue(objectElement) {
  var result = {};

  var _iterator2 = _createForOfIteratorHelper(objectElement.get("properties")),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var objectProperty = _step2.value;
      var key = objectProperty.get("key");

      if (objectProperty.node.computed) {
        console.log("Computed keys are not supported");
        return {
          success: false
        };
      }

      var valuePath = objectProperty.get("value");

      if (valuePath.parentPath.isSpreadElement()) {
        var value = getArgumentValue(valuePath.parentPath);
        if (!value.success) return {
          success: false
        };
        result = _objectSpread(_objectSpread({}, result), value.value);
      } else {
        if (!key.isIdentifier()) {
          console.log("Unable to get object key");
          return {
            success: false
          };
        }

        var _value = getArgumentValue(valuePath);

        if (!_value.success) return {
          success: false
        };
        result = _objectSpread(_objectSpread({}, result), {}, _defineProperty({}, key.node.name, _value.value));
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  return {
    success: true,
    value: result
  };
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