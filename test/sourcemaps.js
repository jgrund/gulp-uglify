'use strict';
var test = require('tape'),
		Vinyl = require('vinyl'),
		gulpUglify = require('../'),
		convertSourceMap = require('convert-source-map'),
		EOL = require('os').EOL,
		uglifyjs = require('uglify-js');
	
var testContentsInput = '"use strict"; (function(console, first, second) { console.log(first + second) }(console, 5, 10))';
var testContentsExpected = uglifyjs.minify(testContentsInput, {fromString: true}).code + EOL;

var testFile1 = new Vinyl({
	cwd: "/home/terin/broken-promises/",
	base: "/home/terin/broken-promises/test",
	path: "/home/terin/broken-promises/test/test1.js",
	contents: new Buffer(testContentsInput)
});

test('should minify files and inline source maps', function(t) {
	t.plan(13);

	var stream = gulpUglify({
		outSourceMap: true
	});

	stream.on('data', function(newFile) {
		var sourceString = newFile.contents.toString(),
			contentString = convertSourceMap.removeComments(sourceString),
			sourceMap = convertSourceMap.fromSource(sourceString).toObject();

		t.ok(newFile, 'emits a file');
		t.ok(newFile.path, 'file has a path');
		t.ok(newFile.relative, 'file has relative path information');
		t.ok(newFile.contents, 'file has contents');

		t.ok(newFile instanceof Vinyl, 'file is Vinyl');
		t.ok(newFile.contents instanceof Buffer, 'file contents are a buffer');

		t.equals(contentString, testContentsExpected);

		t.ok(sourceMap, 'has a source map');
		t.equals(sourceMap.version, 3, 'source map has expected version');
		t.ok(Array.isArray(sourceMap.sources), 'source map has sources array');
		t.ok(Array.isArray(sourceMap.names), 'source map has names array');
		t.ok(Array.isArray(sourceMap.sourcesContent), 'source map has sourcesContent');
		t.ok(sourceMap.mappings, 'source map has mappings');
	});

	stream.write(testFile1);
});
