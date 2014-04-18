'use strict';
var through = require('through2'),
	uglify = require('uglify-js'),
	merge = require('deepmerge'),
	uglifyError = require('./lib/error.js');

module.exports = function(opt) {

	function minify(file, encoding, callback) {
		/*jshint validthis:true */

		if (file.isNull()) {
			this.push(file);
			return callback();
		}

		if (file.isStream()) {
			return callback(uglifyError('Streaming not supported'));
		}

		var options = merge(opt || {}, {
			fromString: true,
			output: {}
		});

		var mangled;

		if (file.sourceMap) {
			options.outSourceMap = file.relative + '.map';
		}

		if (options.preserveComments === 'all') {
			options.output.comments = true;
		} else if (options.preserveComments === 'some') {
			// preserve comments with directives or that start with a bang (!)
			options.output.comments = /^!|@preserve|@license|@cc_on/i;
		} else if (typeof options.preserveComments === 'function') {
			options.output.comments = options.preserveComments;
		}

		try {
			mangled = uglify.minify(String(file.contents), options);
			file.contents = new Buffer(mangled.code);
		} catch (e) {
			console.warn('Error caught from uglify: ' + e.message + ' in ' + file.path + '. Returning unminifed code');
			this.push(file);
			return callback();
		}

		if (file.sourceMap) {
			file.applySourceMap(mangled.map);
		}

		this.push(file);
		callback();
	}

	return through.obj(minify);
};
