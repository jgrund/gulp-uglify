'use strict';
var through = require('through2'),
	uglify = require('uglify-js'),
	merge = require('deepmerge'),
	EOL = '\n',
	uglifyError = require('./lib/error.js'),
	convertSourceMap = require('convert-source-map');

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

		var stringContents = file.contents.toString(),
			mangled,
			outString,
			sourceMap;

		if (options.outSourceMap) {
			options.outSourceMap = file.relative.replace(/\.[\w]+$/, ".js.map");
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
			mangled = uglify.minify(stringContents, options);
		} catch (e) {
			console.warn('Error caught from uglify: ' + e.message + ' in ' + file.path + '. Returning unminifed code');
			this.push(file);
			return callback();
		}

		outString = mangled.code;

		if (options.outSourceMap) {
			sourceMap = convertSourceMap
				.fromJSON(mangled.map)
				.setProperty('sources', [ file.path ])
				.setProperty('sourcesContent', [ stringContents ]);

			outString += EOL + sourceMap.toComment();
		}

		file.contents = new Buffer(outString);

		this.push(file);

		callback();
	}

	return through.obj(minify);
};
