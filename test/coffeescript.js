'use strict';
var test = require('tape'),
		Vinyl = require('vinyl'),
		gulpUglify = require('../'),
		convertSourceMap = require('convert-source-map'),
		cs = require('coffee-script'),
		EOL = '\n',
		uglifyjs = require('uglify-js');
	
var testCoffeeScript = 'square = (side) ->\n  side * side\nthis.squareCS = square';
var testCompiled = cs.compile(testCoffeeScript, {
	sourceMap: true
});
var testCoffeeSourceMap = convertSourceMap.fromJSON(testCompiled.v3SourceMap).setProperty('file', 'square.js.map').setProperty('sources', ['square.coffee']).setProperty('sourcesContent', [testCoffeeScript]);

var testContentsInput = testCompiled.js + '\n' + testCoffeeSourceMap.toComment();
var testContentsExpected = uglifyjs.minify(testContentsInput, {fromString: true}).code + EOL;

var testFile1 = new Vinyl({
	cwd: "/home/terin/broken-promises/",
	base: "/home/terin/broken-promises/test",
	path: "/home/terin/broken-promises/test/square.coffee",
	contents: new Buffer(testContentsInput)
});

test('should minify files with in souce maps and inline source maps', function(t) {
	t.plan(13);

	var stream = gulpUglify({
		inSourceMap: true,
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
