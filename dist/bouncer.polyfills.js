/*!
 * bouncer v1.0.0: A lightweight form validation script that augments native HTML5 form validation elements and attributes.
 * (c) 2018 Chris Ferdinandi
 * MIT License
 * http://github.com/cferdinandi/bouncer
 */


/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20170427
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in self) {

	// Full polyfill for browsers with no classList support
	// Including IE < Edge missing SVGElement.classList
	if (!("classList" in document.createElement("_"))
		|| document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {

		(function (view) {

			"use strict";

			if (!('Element' in view)) return;

			var
				classListProp = "classList"
				, protoProp = "prototype"
				, elemCtrProto = view.Element[protoProp]
				, objCtr = Object
				, strTrim = String[protoProp].trim || function () {
					return this.replace(/^\s+|\s+$/g, "");
				}
				, arrIndexOf = Array[protoProp].indexOf || function (item) {
					var
						i = 0
						, len = this.length
						;
					for (; i < len; i++) {
						if (i in this && this[i] === item) {
							return i;
						}
					}
					return -1;
				}
				// Vendors: please allow content code to instantiate DOMExceptions
				, DOMEx = function (type, message) {
					this.name = type;
					this.code = DOMException[type];
					this.message = message;
				}
				, checkTokenAndGetIndex = function (classList, token) {
					if (token === "") {
						throw new DOMEx(
							"SYNTAX_ERR"
							, "An invalid or illegal string was specified"
						);
					}
					if (/\s/.test(token)) {
						throw new DOMEx(
							"INVALID_CHARACTER_ERR"
							, "String contains an invalid character"
						);
					}
					return arrIndexOf.call(classList, token);
				}
				, ClassList = function (elem) {
					var
						trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
						, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
						, i = 0
						, len = classes.length
						;
					for (; i < len; i++) {
						this.push(classes[i]);
					}
					this._updateClassName = function () {
						elem.setAttribute("class", this.toString());
					};
				}
				, classListProto = ClassList[protoProp] = []
				, classListGetter = function () {
					return new ClassList(this);
				}
				;
			// Most DOMException implementations don't allow calling DOMException's toString()
			// on non-DOMExceptions. Error's toString() is sufficient here.
			DOMEx[protoProp] = Error[protoProp];
			classListProto.item = function (i) {
				return this[i] || null;
			};
			classListProto.contains = function (token) {
				token += "";
				return checkTokenAndGetIndex(this, token) !== -1;
			};
			classListProto.add = function () {
				var
					tokens = arguments
					, i = 0
					, l = tokens.length
					, token
					, updated = false
					;
				do {
					token = tokens[i] + "";
					if (checkTokenAndGetIndex(this, token) === -1) {
						this.push(token);
						updated = true;
					}
				}
				while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.remove = function () {
				var
					tokens = arguments
					, i = 0
					, l = tokens.length
					, token
					, updated = false
					, index
					;
				do {
					token = tokens[i] + "";
					index = checkTokenAndGetIndex(this, token);
					while (index !== -1) {
						this.splice(index, 1);
						updated = true;
						index = checkTokenAndGetIndex(this, token);
					}
				}
				while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.toggle = function (token, force) {
				token += "";

				var
					result = this.contains(token)
					, method = result ?
						force !== true && "remove"
						:
						force !== false && "add"
					;

				if (method) {
					this[method](token);
				}

				if (force === true || force === false) {
					return force;
				} else {
					return !result;
				}
			};
			classListProto.toString = function () {
				return this.join(" ");
			};

			if (objCtr.defineProperty) {
				var classListPropDesc = {
					get: classListGetter
					, enumerable: true
					, configurable: true
				};
				try {
					objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
				} catch (ex) { // IE 8 doesn't support enumerable:true
					// adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
					// modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
					if (ex.number === undefined || ex.number === -0x7FF5EC54) {
						classListPropDesc.enumerable = false;
						objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
					}
				}
			} else if (objCtr[protoProp].__defineGetter__) {
				elemCtrProto.__defineGetter__(classListProp, classListGetter);
			}

		}(self));

	}

	// There is full or partial native classList support, so just check if we need
	// to normalize the add/remove and toggle APIs.

	(function () {
		"use strict";

		var testElement = document.createElement("_");

		testElement.classList.add("c1", "c2");

		// Polyfill for IE 10/11 and Firefox <26, where classList.add and
		// classList.remove exist but support only one argument at a time.
		if (!testElement.classList.contains("c2")) {
			var createMethod = function (method) {
				var original = DOMTokenList.prototype[method];

				DOMTokenList.prototype[method] = function (token) {
					var i, len = arguments.length;

					for (i = 0; i < len; i++) {
						token = arguments[i];
						original.call(this, token);
					}
				};
			};
			createMethod('add');
			createMethod('remove');
		}

		testElement.classList.toggle("c3", false);

		// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
		// support the second argument.
		if (testElement.classList.contains("c3")) {
			var _toggle = DOMTokenList.prototype.toggle;

			DOMTokenList.prototype.toggle = function (token, force) {
				if (1 in arguments && !this.contains(token) === !force) {
					return force;
				} else {
					return _toggle.call(this, token);
				}
			};

		}

		testElement = null;
	}());

}
/**
 * Element.closest() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}
	Element.prototype.closest = function (s) {
		var el = this;
		var ancestor = this;
		if (!document.documentElement.contains(el)) return null;
		do {
			if (ancestor.matches(s)) return ancestor;
			ancestor = ancestor.parentElement;
		} while (ancestor !== null);
		return null;
	};
}
/**
 * CustomEvent() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
 */
(function () {

	if (typeof window.CustomEvent === "function") return false;

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;
})();
/**
 * Element.matches() polyfill (simple version)
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
/*!
 * Universal Module Definition (UMD) with Constructor Boilerplate
 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
 */
 (function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], (function () {
			return factory(root);
		}));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.Bouncer = factory(root);
	}
 })(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, (function (window) {

	'use strict';

	//
	// Variables
	//

	var defaults = {

		// Classes & IDs
		fieldClass: 'error',
		errorClass: 'error-message',
		fieldPrefix: 'bouncer-field_',
		errorPrefix: 'bouncer-error_',

		// Patterns
		patterns: {
			email: '^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*(\.\w{2,})+$',
			url: '^(?:(?:https?|HTTPS?|ftp|FTP):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-zA-Z\u00a1-\uffff0-9]-*)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]-*)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$',
			number: '[-+]?[0-9]*[.,]?[0-9]+',
			color: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$',
			date: '(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))',
			time: '(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9])',
			month: '(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2]))'
		},

		// Messages
		messageAfterField: true,
		messageCustom: 'data-bouncer-message',
		messages: {
			missingValue: {
				checkbox: 'This field is required.',
				radio: 'Please select a value.',
				select: 'Please select a value.',
				'select-multiple': 'Please select at least one value.',
				default: 'Please fill out this field.'
			},
			patternMismatch: {
				email: 'Please enter a valid email address.',
				url: 'Please enter a URL.',
				number: 'Please enter a number',
				color: 'Please match the following format: #rrggbb',
				date: 'Please use the YYYY-MM-DD format',
				time: 'Please use the 24-hour time format. Ex. 23:00',
				month: 'Please use the YYYY-MM format',
				default: 'Please match the requested format.'
			},
			outOfRange: {
				over: 'Please select a value that is no more than {max}.',
				under: 'Please select a value that is no less than {min}.'
			},
			wrongLength: {
				over: 'Please shorten this text to no more than {maxLength} characters. You are currently using {length} characters.',
				under: 'Please lengthen this text to {minLength} characters or more. You are currently using {length} characters.'
			}
		},

		// Form Submission
		disableSubmit: false,
		onSubmit: function () {}

	};


	//
	// Methods
	//

	var forEach = function (arr, callback) {
		Array.prototype.forEach.call(arr, callback);
	};

	/**
	 * Merge two or more objects together.
	 * @param   {Object}   objects  The objects to merge together
	 * @returns {Object}            Merged values of defaults and options
	 */
	var extend = function () {
		var merged = {};
		forEach(arguments, (function (obj) {
			for (var key in obj) {
				if (!obj.hasOwnProperty(key)) return;
				if (Object.prototype.toString.call(obj[key]) === '[object Object]') {
					merged[key] = extend(merged[key], obj[key]);
				} else {
					merged[key] = obj[key];
				}
				// merged[key] = obj[key];
			}
		}));
		return merged;
	};

	/**
	 * Add the `novalidate` attribute to all forms
	 * @param {Boolean} remove  If true, remove the `novalidate` attribute
	 */
	var addNoValidate = function (selector) {
		forEach(document.querySelectorAll(selector), (function (form) {
			form.setAttribute('novalidate', true);
		}));
	};

	/**
	 * Remove the `novalidate` attribute to all forms
	 */
	var removeNoValidate = function (selector) {
		forEach(document.querySelectorAll(selector), (function (form) {
			form.removeAttribute('novalidate');
		}));
	};

	/**
	 * Check if a required field is missing its value
	 * @param  {Node} field The field to check
	 * @return {Boolean}       It true, field is missing it's value
	 */
	var missingValue = function (field) {

		// If not required, bail
		if (!field.hasAttribute('required')) return false;

		// Handle checkboxes
		if (field.type === 'checkbox') {
			return !field.checked;
		}

		// Get the field value length
		var length = field.value.length;

		// Handle radio buttons
		if (field.type === 'radio') {
			length = Array.prototype.filter.call(field.form.querySelectorAll('[name="' + field.name + '"]'), (function (btn) {
				return btn.checked;
			})).length;
		}

		// Check for value
		return length < 1;

	};

	/**
	 * Check if field value doesn't match a patter.
	 * @param  {Node}   field    The field to check
	 * @param  {Object} settings The plugin settings
	 * @return {Boolean}         If true, there's a pattern mismatch
	 */
	var patternMismatch = function (field, settings) {

		// Check if there's a pattern to match
		var pattern = field.getAttribute('pattern') || settings.patterns[field.type];
		if (!pattern) return false;

		// Validate the pattern
		return !(new RegExp(pattern).test(field.value));

	};

	var outOfRange = function (field) {

		// Check for range
		var max = field.getAttribute('max');
		var min = field.getAttribute('min');

		// Check validity
		var num = parseFloat(field.value);
		if (max && num > max) return 'over';
		if (min && num < min) return 'under';
		return false;

	};

	var wrongLength = function (field) {

		// Check for min/max length
		var max = field.getAttribute('maxlength');
		var min = field.getAttribute('minlength');

		// Check validity
		var length = field.value.length;
		if (max && length > max) return 'over';
		if (min && length < min) return 'under';
		return false;

	};

	var getErrors = function (field, settings) {

		// Get any errors
		var errors = {
			missingValue: missingValue(field),
			patternMismatch: patternMismatch(field, settings),
			outOfRange: outOfRange(field),
			wrongLength: wrongLength(field)
		};

		return {
			valid: !errors.missingValue && !errors.patternMismatch && !errors.outOfRange && !errors.wrongLength,
			errors: errors
		};

	};

	var getFieldID = function (field, settings, create) {
		var id = field.name || field.id;
		if (!id && create) {
			id = settings.fieldPrefix + Math.floor(Math.random() * 999);
			field.id = id;
		}
		return id;
	};

	var createError = function (field, settings) {

		// Create the error message
		var error = document.createElement('div');
		error.className = settings.errorClass;
		error.id = settings.errorPrefix + getFieldID(field, settings, true);

		// If the field is a radio button, get the last item in the radio group
		if (field.type === 'radio') {
			var group = field.form.querySelectorAll('[name="' + field.name + '"]');
			field = group[group.length - 1];
		}

		// If the field is a checkbox or radio button wrapped in a label, get the label
		if (field.type === 'checkbox' || field.type === 'radio') {
			var label = field.closest('label');
			field = label || field;
		}

		// Inject the error message into the DOM
		field.parentNode.insertBefore(error, settings.messageAfterField ? field.nextSibling : field);

		return error;

	};

	var getErrorMessage = function (field, errors, settings) {

		// Variables
		var custom = field.getAttribute(settings.messageCustom);
		var messages = settings.messages;

		// If there's a custom message, use it
		if (custom) return custom;

		// Missing value error
		if (errors.missingValue) {
			return messages.missingValue[field.type] || messages.missingValue.default;
		}

		// Numbers that are out of range
		if (errors.outOfRange) {
			return messages.outOfRange[errors.outOfRange].replace('{max}', field.getAttribute('max')).replace('{min}', field.getAttribute('min')).replace('{length}', field.value.length);
		}

		// Values that are too long or short
		if (errors.wrongLength) {
			return messages.wrongLength[errors.wrongLength].replace('{maxLength}', field.getAttribute('maxlength')).replace('{minLength}', field.getAttribute('minlength')).replace('{length}', field.value.length);
		}

		// Pattern mismatch error
		if (errors.patternMismatch) {
			return messages.patternMismatch[field.type] || messages.patternMismatch.default;
		}

	};

	var showError = function (field, errors, settings) {

		// Get/create an error message
		var error = field.form.querySelector('#' + settings.errorPrefix + getFieldID(field, settings)) || createError(field, settings);
		var msg = getErrorMessage(field, errors, settings);
		error.textContent = msg;

		// Add an error class to the field
		field.classList.add(settings.fieldClass);

		// Accessibility improvement
		field.setAttribute('aria-describedby', error.id);

	};

	var removeError = function (field, settings) {

		// Get the error message for this field
		var error = field.form.querySelector('#' + settings.errorPrefix + getFieldID(field, settings));
		if (!error) return;

		// Remove the error
		error.parentNode.removeChild(error);

		// Remove error and a11y from the field
		field.classList.remove(settings.fieldClass);
		field.removeAttribute('aria-describedby');

	};

	var removeAllErrors = function (selector, settings) {
		forEach(document.querySelectorAll(selector), (function (form) {
			formEach(form.elements, (function (field) {
				removeError(field, settings);
			}));
		}));
	};

	/**
	 * The plugin constructor
	 * @param {String} selector The selector to use for forms to be validated
	 * @param {Object} options  User settings [optional]
	 */
	var Constructor = function (selector, options) {

		//
		// Variables
		//

		var publicAPIs = {};
		var settings;


		//
		// Methods
		//

		publicAPIs.validate = function (field, options) {

			// Don't validate submits, buttons, file and reset inputs, and disabled and readonly fields
			if (field.disabled || field.readOnly || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') return;

			// Local settings
			var _settings = extend(settings, options || {});

			// Check for errors
			var isValid = getErrors(field, _settings);

			// If valid, remove any error messages
			if (isValid.valid) {
				removeError(field, _settings);
				return;
			}

			// Otherwise, show an error message
			showError(field, isValid.errors, _settings);

			return isValid;

		};

		var blurHandler = function (event) {

			// Only run if the field is in a form to be validated
			if (!event.target.form || !event.target.form.matches(selector)) return;

			// Validate the field
			publicAPIs.validate(event.target);

		};

		var inputHandler = function (event) {

			// Only run if the field is in a form to be validated
			if (!event.target.form || !event.target.form.matches(selector)) return;

			// Only run on radio and checkbox inputs
			// if (event.target.type === 'checkbox' || event.target.type === 'radio') return;
			if (!event.target.classList.contains(settings.fieldClass)) return;

			// Validate the field
			publicAPIs.validate(event.target);

		};

		var submitHandler = function (event) {

			// Only run on matching elements
			if (!event.target.matches(selector)) return;

			// Prevent form submission
			event.preventDefault();

			// Validate each field
			var errors = Array.prototype.filter.call(event.target.elements, (function (field) {
				var validate = publicAPIs.validate(field);
				return validate && !validate.valid;
			}));

			// If there are errors, focus on the first one
			if (errors.length > 0) {
				errors[0].focus();
				return;
			}

			// Otherwise, submit
			if (settings.disableSubmit) {
				settings.onSubmit(event.target);
			} else {
				event.target.submit();
			}

		};

		publicAPIs.destroy = function () {

			// Remove event listeners
			document.removeEventListener('blur', blurHandler, true);
			document.removeEventListener('input', inputHandler, false);
			document.removeEventListener('submit', submitHandler, false);

			// Remove all errors
			removeAllErrors(selector, settings);

			// Remove novalidate attribute
			removeNoValidate(selector);

			// Reset settings
			settings = null;

		};

		var init = function () {

			// Create settings
			settings = extend(defaults, options || {});

			// Add novalidate attribute
			addNoValidate(selector);

			// Event Listeners
			document.addEventListener('blur', blurHandler, true);
			document.addEventListener('input', inputHandler, false);
			document.addEventListener('submit', submitHandler, false);

		};

		//
		// Inits & Event Listeners
		//

		init();
		return publicAPIs;

	};


	//
	// Return the constructor
	//

	return Constructor;

}));